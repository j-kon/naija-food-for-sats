const port = 3033;

const grpc = require("@grpc/grpc-js");
const protoLoader = require("@grpc/proto-loader");
const fs = require("fs");
const express = require("express");

process.env.GRPC_SSL_CIPHER_SUITES = "HIGH+ECDSA";
const server = express();
const loaderOptions = {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
};

const packageDefinition = protoLoader.loadSync(
  "lightning.proto",
  loaderOptions
);

let m = fs.readFileSync(
  "/Users/jaydroid/.polar/networks/1/volumes/lnd/bob/data/chain/bitcoin/regtest/admin.macaroon"
);
let macaroon = m.toString("hex");

let metadata = new grpc.Metadata();
metadata.add("macaroon", macaroon);
let macaroonCreds = grpc.credentials.createFromMetadataGenerator(
  (_args, callback) => {
    callback(null, metadata);
  }
);

let lndCert = fs.readFileSync(
  "/Users/jaydroid/.polar/networks/1/volumes/lnd/bob/tls.cert"
);
let sslCreds = grpc.credentials.createSsl(lndCert);
let credentials = grpc.credentials.combineChannelCredentials(
  sslCreds,
  macaroonCreds
);

let lnrpcDescriptor = grpc.loadPackageDefinition(packageDefinition);
let lnrpc = lnrpcDescriptor.lnrpc;
let client = new lnrpc.Lightning("127.0.0.1:10002", credentials);

server.get("/", (req, res) => {
  res.send("Hack me if you can");
});

server.get("/getinfo", function (req, res) {
  client.getInfo({}, function (err, response) {
    if (err) {
      console.log("Error: " + err);
    }
    res.json(response);
  });
});

server.get("/generate-invoice/:source/:price", function (req, res) {
  let request = {
    value: req.params["price"],
    memo: req.params["source"],
  };
  client.addInvoice(request, function (err, response) {
    res.json(response);
  });
});

server.get("/check-invoice/:payment_hash", function (req, res) {
  let request = {
    r_hash_str: req.params["payment_hash"],
  };
  client.lookupInvoice(request, function (err, response) {
    if (err) {
      console.log("Error: " + err);
    }
    res.json(response);
  });
});

server.get("/file/:source", function (req, res, next) {
  var options = {
    dotfiles: "deny",
    headers: {
      "x-timestamp": Date.now(),
      "x-sent": true,
    },
  };

  var fileName = path.join(path.join(__dirname, "static"));
  res.download(
    path.join(__dirname, "static", req.params["source"]),
    req.params["source"],
    options,
    function (err) {
      if (err) {
        next(err);
      } else {
        console.log("Sent:", fileName);
      }
    }
  );
});

server.listen(port, () => {
  console.log(`Example server listening at http://localhost:${port}`);
});
