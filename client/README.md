## Running with real backend vs json-server mock

The client can target either the real backend (Express on port 3000) or a json-server mock (port 8000).

- To use the real backend: ensure `VITE_USE_JSON_SERVER` is unset or set to `false` and start your server at `http://localhost:3000`.
- To use the mock backend: set `VITE_USE_JSON_SERVER=true`.

Scripts:

- Start mock API (json-server):
  - from the repo root run: `npm --workspace client run mock` or `cd client && npm run mock`
- Start client against mock:
  - `npm --workspace client run dev:mock`
- Start client (default, real backend):
  - `npm --workspace client run dev`

The toggle is read in `src/apis/connection/connector.js` and switches the Axios base URL between `http://localhost:8000` (mock) and `http://localhost:3000` (real).
