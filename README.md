# Product Catalog — CRUD API

REST API for a product catalog built with **Fastify**, an in-memory store, **Zod** validation, and optional horizontal scaling (Node.js Cluster + HTTP load balancer).

## Requirements

- **Node.js** **24.10.0** or newer (see `engines` in `package.json`).
- **npm** (or a compatible package manager).

## Installation

1. Clone the repository and open the project directory:

   ```bash
   git clone <repository-url>
   cd node-crud-api
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Create your environment file **from the example** (only `.env.example` is committed, not `.env`):

   ```bash
   cp .env.example .env
   ```

4. Edit `.env` if needed. At minimum, set:

   | Variable | Description                         | Example |
   | -------- | ----------------------------------- | ------- |
   | `PORT`   | HTTP port (single-process server)   | `4000`  |

   For **`start:multi`**, the same `PORT` is where the load balancer listens; workers bind to `PORT + 1`, `PORT + 2`, … (worker count: `max(1, availableParallelism() - 1)`).

## Running the application

### Development

Restarts on file changes (via **tsx**):

```bash
npm run start:dev
```

The server listens at `http://localhost:<PORT>` (`PORT` from `.env`).

### Production

Build the bundle (**esbuild**) and run the compiled file:

```bash
npm run start:prod
```

This runs `dist/server.js` after the build. Ensure `.env` exists locally and defines `PORT`.

### Horizontal scaling (cluster + load balancer)

Runs multiple workers with shared state in the primary process and an HTTP round-robin load balancer on `PORT`:

```bash
npm run start:multi
```

- Requests to **`http://localhost:<PORT>/api/...`** hit the balancer, which forwards to workers in turn.
- Catalog state stays consistent across workers (data lives in the primary; workers use IPC).

## Using the API

Base path: **`/api`**. Request bodies are **JSON**; use `Content-Type: application/json` for POST, PUT, and PATCH.

**PUT vs PATCH:** **`PUT`** replaces the entire product — send **all** fields (same shape as create). **`PATCH`** updates **only the fields you include**; at least one field must be present. Use PATCH for partial updates.

### Product entity

| Field         | Type    | Description                                      |
| ------------- | ------- | ------------------------------------------------ |
| `id`          | string  | UUID, assigned by the server on create           |
| `name`        | string  | Name (required)                                  |
| `description` | string  | Description (required)                           |
| `price`       | number  | Price, **must be greater than 0**                |
| `category`    | string  | Category (e.g. `electronics`, `books`)           |
| `inStock`     | boolean | Whether the product is in stock                  |

### Endpoints

| Method   | Path                          | Notes |
| -------- | ----------------------------- | ----- |
| `GET`    | `/api/products`               | All products (`200`) |
| `GET`    | `/api/products/{productId}`   | One product (`200`), invalid UUID (`400`), not found (`404`) |
| `POST`   | `/api/products`               | Create (`201`), validation error (`400`) |
| `PUT`    | `/api/products/{productId}`   | **Full** replace — all fields required (`200`), invalid UUID (`400`), not found (`404`) |
| `PATCH`  | `/api/products/{productId}`   | **Partial** update — any subset of fields, at least one (`200`), invalid UUID (`400`), not found (`404`) |
| `DELETE` | `/api/products/{productId}`   | Delete (`204`), invalid UUID (`400`), not found (`404`) |

Unknown paths (e.g. `/foo/bar`) return **`404`** with JSON `{ "message": "..." }`. Unhandled server errors return **`500`** with a readable message.

### curl examples

Replace `4000` with your `PORT` if different.

**List products:**

```bash
curl -s http://localhost:4000/api/products
```

**Create a product:**

```bash
curl -s -X POST http://localhost:4000/api/products \
  -H "Content-Type: application/json" \
  -d '{"name":"Phone","description":"Smartphone","price":699.99,"category":"electronics","inStock":true}'
```

**Get by id** (use the UUID from the POST response):

```bash
curl -s http://localhost:4000/api/products/<productId>
```

**Update:**

```bash
curl -s -X PUT http://localhost:4000/api/products/<productId> \
  -H "Content-Type: application/json" \
  -d '{"name":"Phone","description":"Updated","price":599.99,"category":"electronics","inStock":false}'
```

**Delete:**

```bash
curl -s -o /dev/null -w "%{http_code}\n" -X DELETE http://localhost:4000/api/products/<productId>
```

Expected status code: **`204`**.

## Tests

API tests use **Vitest** (at least three scenarios: full CRUD, UUID validation, unknown route, etc.):

```bash
npm test
```

Watch mode:

```bash
npm run test:watch
```

## Other scripts

| Script            | Purpose                    |
| ----------------- | -------------------------- |
| `npm run build`   | Build output to `dist/`    |
| `npm run lint`    | Run ESLint                 |
| `npm run format`  | Format with Prettier       |

## Project layout (short)

- `src/server.ts` — entry point, single process, in-memory store.
- `src/multi.ts` — cluster, load balancer, workers.
- `src/routes/products.ts` — `/api/products` routes.
- `src/lib/` — Zod schemas, repository, IPC helpers for the cluster.
- `tests/` — API tests.

---

**Important:** **`.env` must not be committed** (it is listed in `.gitignore`). Only **`.env.example`** is in the repository, with the required variables and example values.
