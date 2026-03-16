const crypto = require("crypto");
const fs = require("fs");
const path = require("path");

const express = require("express");
const grpc = require("@grpc/grpc-js");
const protoLoader = require("@grpc/proto-loader");

const catalog = require("./catalog");

const port = Number(process.env.PORT) || 3033;
const app = express();
const staticDir = path.join(__dirname, "static");
const frontendPublicDir = path.join(__dirname, "..", "frontend", "public");
const productsBySource = new Map(catalog.map((product) => [product.source, product]));
const mockInvoices = new Map();

process.env.GRPC_SSL_CIPHER_SUITES = "HIGH+ECDSA";

const loaderOptions = {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
};

function sendError(res, statusCode, message) {
  res.status(statusCode).json({ error: message });
}

function getLightningConfig() {
  return {
    host: process.env.LND_HOST || "",
    macaroonPath: process.env.LND_MACAROON_PATH || "",
    certPath: process.env.LND_CERT_PATH || "",
    protoPath: process.env.LND_PROTO_PATH || path.join(__dirname, "lightning.proto"),
  };
}

function createMockLightningClient() {
  return {
    getInfo(_request, callback) {
      callback(null, {
        alias: "Mock Lightning Node",
        chains: [{ chain: "bitcoin", network: "regtest" }],
        synced_to_chain: true,
      });
    },
    addInvoice(request, callback) {
      const paymentHash = crypto.randomBytes(32).toString("hex");
      const paymentRequest = `lnmock-${request.value}-${paymentHash.slice(0, 24)}`;

      mockInvoices.set(paymentHash, {
        memo: request.memo,
        value: String(request.value),
        settleAt: Date.now() + 1500,
      });

      callback(null, {
        payment_request: paymentRequest,
        payment_hash: paymentHash,
      });
    },
    lookupInvoice(request, callback) {
      const invoice = mockInvoices.get(request.r_hash_str);

      if (!invoice) {
        callback(new Error("Invoice not found"));
        return;
      }

      callback(null, {
        memo: invoice.memo,
        settled: Date.now() >= invoice.settleAt,
        value: invoice.value,
        payment_hash: request.r_hash_str,
      });
    },
  };
}

function createLightningClient() {
  const { host, macaroonPath, certPath, protoPath } = getLightningConfig();
  const hasRealConfig =
    process.env.MOCK_LND !== "true" &&
    host &&
    macaroonPath &&
    certPath &&
    fs.existsSync(macaroonPath) &&
    fs.existsSync(certPath) &&
    fs.existsSync(protoPath);

  if (!hasRealConfig) {
    console.warn(
      "Lightning credentials not found. Starting backend in mock payment mode."
    );
    return { client: createMockLightningClient(), mockMode: true };
  }

  const packageDefinition = protoLoader.loadSync(protoPath, loaderOptions);
  const descriptor = grpc.loadPackageDefinition(packageDefinition);
  const lnrpc = descriptor.lnrpc;

  const macaroon = fs.readFileSync(macaroonPath).toString("hex");
  const metadata = new grpc.Metadata();
  metadata.add("macaroon", macaroon);

  const macaroonCreds = grpc.credentials.createFromMetadataGenerator(
    (_args, callback) => callback(null, metadata)
  );
  const lndCert = fs.readFileSync(certPath);
  const sslCreds = grpc.credentials.createSsl(lndCert);
  const credentials = grpc.credentials.combineChannelCredentials(
    sslCreds,
    macaroonCreds
  );

  return {
    client: new lnrpc.Lightning(host, credentials),
    mockMode: false,
  };
}

const { client, mockMode } = createLightningClient();
const mode = mockMode ? "mock" : "lnd";

app.use(express.static(frontendPublicDir));

function lookupInvoice(paymentHash) {
  return new Promise((resolve, reject) => {
    client.lookupInvoice({ r_hash_str: paymentHash }, (err, response) => {
      if (err) {
        reject(err);
        return;
      }

      resolve(response);
    });
  });
}

app.get("/", (_req, res) => {
  res.sendFile(path.join(frontendPublicDir, "index.html"));
});

app.get("/health", (_req, res) => {
  res.json({ status: "ok", mode });
});

app.get("/products", (_req, res) => {
  res.json(catalog);
});

app.get("/getinfo", (_req, res) => {
  client.getInfo({}, (err, response) => {
    if (err) {
      console.error("getInfo failed:", err);
      sendError(res, 500, "Failed to fetch node info");
      return;
    }

    res.json({
      ...response,
      mode,
    });
  });
});

function createInvoiceForSource(source, res) {
  const product = productsBySource.get(source);

  if (!product) {
    sendError(res, 404, "Unknown product");
    return;
  }

  client.addInvoice(
    {
      value: product.price,
      memo: product.source,
    },
    (err, response) => {
      if (err) {
        console.error("addInvoice failed:", err);
        sendError(res, 500, "Failed to generate invoice");
        return;
      }

      res.json({
        ...response,
        payment_hash:
          response.payment_hash ||
          (response.r_hash ? Buffer.from(response.r_hash).toString("hex") : ""),
        price: product.price,
        product: product.name,
      });
    }
  );
}

app.get("/generate-invoice/:source", (req, res) => {
  createInvoiceForSource(req.params.source, res);
});

// Backward-compatible route for the old frontend shape.
app.get("/generate-invoice/:source/:price", (req, res) => {
  createInvoiceForSource(req.params.source, res);
});

app.get("/check-invoice/:payment_hash", (req, res) => {
  lookupInvoice(req.params.payment_hash)
    .then((response) => {
      res.json({
        ...response,
        payment_hash: response.payment_hash || req.params.payment_hash,
      });
    })
    .catch((err) => {
      console.error("lookupInvoice failed:", err);
      sendError(res, 404, "Invoice not found");
    });
});

app.get("/file/:source", async (req, res) => {
  const source = path.basename(req.params.source);
  const paymentHash = req.query.paymentHash;
  const product = productsBySource.get(source);

  if (!product) {
    sendError(res, 404, "Unknown product");
    return;
  }

  if (!paymentHash) {
    sendError(res, 400, "paymentHash is required");
    return;
  }

  try {
    const invoice = await lookupInvoice(paymentHash);

    if (!invoice.settled || invoice.memo !== source) {
      sendError(res, 403, "Invoice is unpaid or does not match item");
      return;
    }

    const filePath = path.join(staticDir, source);

    if (!fs.existsSync(filePath)) {
      sendError(res, 404, "File not found");
      return;
    }

    res.download(filePath, source);
  } catch (err) {
    console.error("file download failed:", err);
    sendError(res, 404, "Invoice not found");
  }
});

app.listen(port, () => {
  console.log(`Naija Food backend listening at http://localhost:${port} (${mode} mode)`);
});
