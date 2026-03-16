# Naija Food for Sats

Naija Food for Sats is a small Lightning-powered ordering demo. The project now runs as a single Express app, and the backend no longer depends on Polar to start locally.

## Highlights

- Starts without Polar by falling back to a built-in mock Lightning client
- Serves the storefront and API from one backend process
- Keeps product data in one shared catalog
- Preserves the real LND flow when credentials are provided

## Project Structure

```text
backend/
  catalog.js        Product data used by the API
  lightning.proto   LND gRPC schema
  server.js         Express app and Lightning integration
  static/           Downloadable files
frontend/
  public/
    app.js          Lightweight storefront logic
    assets/         Food thumbnails
    index.html      Storefront page
```

## Quick Start

1. Install backend dependencies:

```bash
cd backend
npm install
```

2. Start the app from the project root:

```bash
cd ..
npm start
```

3. Open `http://localhost:3033`

That is enough to run the project in mock mode.

## Running Without Polar

No extra setup is required.

If the backend does not find valid LND credentials, it automatically starts in `mock` mode. In that mode you can still:

- load the storefront
- generate invoices
- verify payments
- download the gated files

You can also force mock mode explicitly:

```bash
npm run start:mock
```

## Using A Real LND Node

To connect to a real Lightning node, set these environment variables before starting the app:

- `LND_HOST`
- `LND_MACAROON_PATH`
- `LND_CERT_PATH`
- `LND_PROTO_PATH` optional, defaults to `backend/lightning.proto`

Example:

```bash
export LND_HOST=127.0.0.1:10009
export LND_MACAROON_PATH=/path/to/admin.macaroon
export LND_CERT_PATH=/path/to/tls.cert
npm start
```

When those values are present and valid, the backend switches from `mock` mode to `lnd` mode automatically.

## API Endpoints

- `GET /` serves the storefront
- `GET /health` returns server health and mode
- `GET /products` returns the product catalog
- `GET /getinfo` returns Lightning node info
- `GET /generate-invoice/:source` creates an invoice for a product
- `GET /check-invoice/:payment_hash` checks invoice settlement
- `GET /file/:source?paymentHash=...` downloads a paid file

## Notes

- Downloadable assets live in `backend/static`
- Storefront thumbnails live in `frontend/public/assets`
- Product metadata is defined in `backend/catalog.js`
- The file download route now validates invoice settlement before serving content
