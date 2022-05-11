# stolit
# Naija Food for sats

This is an example media store powered by Lightning payments. The accompanying tutorial/guide can be found on [Medium](https://medium.com/@jaykon/i-developed-a-meal-ordering-system-powered-by-lightning-cfd426bf0b78)

## Tools

[Polar](https://lightningpolar.com/) is required.

## Configuration

Copy lnd's gRPC protocol from [here](https://raw.githubusercontent.com/lightningnetwork/lnd/master/lnrpc/lightning.proto) and place in the `backend` dir.

References to the lnd `admin.macaroon`, `tls.cert`, and `host:port` need to be filled in before starting the backend server.

Media files go in `backend/static`. Thumbnails go in `frontend/public/assets`.

Metadata for media is set in the `frontend/App.js` file.

## Run

### Express Server (backend)
Run `node server.js` from the `backend` dir.

### React Frontend (frontend)
Run `npm start` from the `frontend` dir.

Open [http://localhost:3000](http://localhost:3000) to view in the browser.
