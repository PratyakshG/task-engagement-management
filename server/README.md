# Task Management API

A TypeScript/Express backend using Prisma 7 and Supabase Postgres. It currently provides a small set of dummy authentication endpoints, database connectivity checking, and read-only user endpoints.

## Requirements

- [Node.js 24 LTS](https://nodejs.org/) (`server/.nvmrc` specifies the required version)
- A Supabase project with a Postgres database
- npm (included with Node.js)

## Setup

From the `server` directory:

```bash
# If you use nvm, select the project Node version.
nvm use

# Install dependencies.
npm install

# Create your local configuration file.
cp .env.example .env
```

In Supabase Dashboard, open **Connect** and copy the connection strings into `.env`. Do not commit this file.

```env
DATABASE_URL="postgresql://postgres.[PROJECT_REF]:[PASSWORD]@[HOST]:5432/postgres?sslmode=require"
DIRECT_URL="postgresql://postgres:[PASSWORD]@db.[PROJECT_REF].supabase.co:5432/postgres?sslmode=require"
PORT=3000
NODE_ENV=development
```

`DATABASE_URL` is used by the running API. For a Docker or VM host, use Supabase's direct URL when IPv6 is available, or the Supavisor **session pooler** URL for IPv4-only hosts. `DIRECT_URL` must be Supabase's direct connection URL and is used only by Prisma CLI commands.

Apply the committed migrations to the new Supabase project:

```bash
npx prisma migrate deploy
```

For later schema changes, run `npm run prisma:migrate -- --name <change-name>` and commit the generated migration folder.

Start the development server:

```bash
npm run dev
```

The API is available at `http://localhost:3000` by default. To confirm that the server is running, open `http://localhost:3000/health` or run:

```bash
curl http://localhost:3000/health
```

Supabase credentials stay in `server/.env`, which is ignored by Git. If port `3000` is already in use, update the host-side port in `docker-compose.yml`.

## Environment variables

| Variable | Required | Description |
| --- | --- | --- |
| `DATABASE_URL` | Yes | Supabase URL used by the running API through Prisma's PostgreSQL adapter. |
| `DIRECT_URL` | Yes | Supabase direct connection URL used by Prisma migrations and Studio. |
| `PORT` | No | HTTP port for Express. Defaults to `3000`. |
| `NODE_ENV` | No | Application environment, for example `development` or `production`. |

## Available commands

| Command | Description |
| --- | --- |
| `npm run dev` | Runs the API in watch mode with `tsx`. |
| `npm run build` | Generates the Prisma client and compiles TypeScript into `dist/`. |
| `npm start` | Starts the compiled application. Run `npm run build` first. |
| `npm run typecheck` | Checks TypeScript types without producing build files. |
| `npm run prisma:generate` | Generates the Prisma client from `prisma/schema.prisma`. |
| `npm run prisma:migrate -- --name <name>` | Creates and applies a development database migration. |
| `npm run prisma:studio` | Opens Prisma Studio to view and edit database data. |
| `npm run db:seed` | Upserts a linked dummy dataset for every model: users, client, services, template, engagements, tasks, and audit logs. |

## API reference

All responses are JSON. Send `Content-Type: application/json` for requests with a JSON body.

### `GET /health`

Reports whether the Express process is running. This endpoint does not check PostgreSQL.

**Response — `200 OK`**

```json
{ "status": "ok" }
```

### `GET /api/db/status`

Checks whether the application can run a query against PostgreSQL.

**Response — `200 OK`**

```json
{ "status": "connected" }
```

**Response — `503 Service Unavailable`**

```json
{ "status": "unavailable" }
```

### `POST /api/auth/register`

Dummy registration endpoint. It validates the email and returns a demo user; it does not save a user or accept/store a password.

**Request body**

```json
{
  "email": "ada@example.com",
  "name": "Ada Lovelace"
}
```

**Response — `201 Created`**

```json
{
  "message": "Dummy registration successful.",
  "user": {
    "id": "demo-user-id",
    "email": "ada@example.com",
    "name": "Ada Lovelace"
  }
}
```

An invalid or missing email returns `400 Bad Request` with `{ "error": "A valid email is required." }`.

### `POST /api/auth/login`

Dummy login endpoint. It validates the email and returns a placeholder token. It does not verify credentials or issue an authenticated session.

**Request body**

```json
{ "email": "ada@example.com" }
```

**Response — `200 OK`**

```json
{
  "message": "Dummy login successful.",
  "token": "demo-token-replace-with-jwt",
  "user": {
    "id": "demo-user-id",
    "email": "ada@example.com"
  }
}
```

### `GET /api/users`

Returns all `User` records from PostgreSQL, newest first.

**Response — `200 OK`**

```json
{
  "data": [
    {
      "id": "cm...",
      "email": "demo@example.com",
      "name": "Demo User",
      "createdAt": "2026-09-11T00:00:00.000Z",
      "updatedAt": "2026-09-11T00:00:00.000Z"
    }
  ]
}
```

### `GET /api/users/:id`

Returns one user by its Prisma CUID.

**Response — `200 OK`**: `{ "data": { ...user } }`

**Response — `404 Not Found`**: `{ "error": "User not found." }`

## Example requests

```bash
curl http://localhost:3000/health

curl http://localhost:3000/api/db/status

curl -X POST http://localhost:3000/api/auth/register \
  -H 'Content-Type: application/json' \
  -d '{"email":"ada@example.com","name":"Ada Lovelace"}'

curl -X POST http://localhost:3000/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"ada@example.com"}'

curl http://localhost:3000/api/users
```

## Current limitations

The authentication routes are intentional placeholders. Before deploying, add password hashing, persisted user registration, real authentication tokens, request validation, authorization middleware, rate limiting, and secure production configuration.
