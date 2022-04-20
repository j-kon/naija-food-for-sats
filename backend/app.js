//const express = require('express')
//const app = express()
const port = 3001

const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const fs = require("fs");

const path = require('path');

process.env.GRPC_SSL_CIPHER_SUITES = 'HIGH+ECDSA'

const loaderOptions = {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true
};
const packageDefinition = protoLoader.loadSync(
  "https://raw.githubusercontent.com/lightningnetwork/lnd/master/lnrpc/lightning.proto",
  loaderOptions
);

let m = fs.readFileSync(
  '/Users/jaydroid/.polar/networks/1/volumes/lnd/bob/data/chain/bitcoin/regtest/admin.macaroon'
);
let macaroon = m.toString('hex');

let metadata = new grpc.Metadata()
metadata.add('macaroon', macaroon)
let macaroonCreds = grpc.credentials.createFromMetadataGenerator((_args, callback) => {
  callback(null, metadata);
});
let lndCert = fs.readFileSync(
  '/Users/jaydroid/.polar/networks/1/volumes/lnd/bob/tls.cert'
);
let sslCreds = grpc.credentials.createSsl(lndCert);
let credentials = grpc.credentials.combineChannelCredentials(sslCreds, macaroonCreds);

let lnrpcDescriptor = grpc.loadPackageDefinition(packageDefinition);
let lnrpc = lnrpcDescriptor.lnrpc;
let client = new lnrpc.Lightning('127.0.0.1:10002', credentials);


app.get('/', (req, res) => {
  res.send('Knock!')
})

app.get("/getinfo", function (req, res) {
  client.getInfo({}, function(err, response) {
      if (err) {
        console.log('Error: ' + err);
      }
      res.json(response);
    });
});

app.get("/generate-invoice/:source/:price", function (req, res) {
  let request = { 
    value: req.params['price'],
    memo: req.params['source']
  };
  client.addInvoice(request, function(err, response) {
    res.json(response);
  });
});

app.get("/check-invoice/:payment_hash", function (req, res) {
  let request = { 
    r_hash_str: req.params['payment_hash'],
  };
  client.lookupInvoice(request, function(err, response) {
    if (err) {
      console.log('Error: ' + err);
    }
    res.json(response);
    }
  );
});

app.get('/file/:source', function (req, res, next) {

  var options = {
    dotfiles: 'deny',
    headers: {
      'x-timestamp': Date.now(),
      'x-sent': true
    }
  }

  var fileName = path.join(path.join(__dirname, 'static'))
  res.download(path.join(__dirname, 'static', req.params['source']), req.params['source'], options, function (err) {
    if (err) {
      next(err)
    } else {
      console.log('Sent:', fileName)
    }
  })
})

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`)
})