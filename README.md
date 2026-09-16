# Task & Engagement Management Tool

A full-stack task and engagement management application for professional services teams.

The application manages clients, service types, reusable task templates, engagements, and tasks while enforcing role-based permissions and task workflow rules on the backend.

## Features

* JWT-based authentication
* Role-based access control

  * Admin
  * Manager
  * Team Member
* Client management
* User management
* Service type management
* Task template management
* Engagement management
* Automatic task generation from service templates
* Recurring engagement generation
* Duplicate recurring engagement prevention
* Task assignment and reassignment
* Task workflow enforcement
* Manager review and approval
* Request-changes workflow
* Waiting-for-client workflow
* Dashboard metrics
* Task filtering and pagination
* Basic audit/history tracking
* Automated backend tests

## Tech Stack

### Frontend

* Next.js
* React
* TypeScript

### Backend

* Node.js
* Express
* TypeScript
* Zod
* JWT
* bcrypt
* Vitest
* Supertest

### Database

* PostgreSQL
* Prisma ORM
* Supabase PostgreSQL

## Architecture

```text
┌─────────────────────┐
│      Next.js        │
│     Frontend        │
└──────────┬──────────┘
           │ HTTP / JSON
           ▼
┌─────────────────────┐
│      Express        │
│       API           │
├─────────────────────┤
│ Controllers         │
│ Services            │
│ Validators          │
│ Middleware / RBAC   │
└──────────┬──────────┘
           │ Prisma
           ▼
┌─────────────────────┐
│     PostgreSQL      │
│      Supabase       │
└─────────────────────┘
```

The backend is responsible for authentication, authorization, validation, workflow enforcement, business logic, duplicate prevention, and database operations.

## Project Structure

```text
task-engagement-manager/
├── client/
│   └── src/
│       ├── app/
│       ├── components/
│       ├── contexts/
│       ├── hooks/
│       ├── providers/
│       ├── lib/
│       └── types/
│
├── server/
│   ├── prisma/
│   │   ├── schema.prisma
│   │   └── seed.ts
│   ├── src/
│   │   ├── config/
│   │   ├── controllers/
│   │   ├── lib/
│   │   ├── middleware/
│   │   ├── routes/
│   │   ├── services/
│   │   ├── validators/
│   │   ├── app.ts
│   │   └── index.ts
│   ├── tests/
│   ├── .env
│   ├── .env.example
│   ├── prisma.config.ts
│   └── package.json
│
├── docs/
└── README.md
```

## Roles and Permissions

| Capability                    | Admin | Manager | Team Member |
| ----------------------------- | :---: | :-----: | :---------: |
| Manage users                  |   ✓   |    ✓    |             |
| Manage clients                |   ✓   |    ✓    |             |
| Create service types          |   ✓   |         |             |
| Manage task templates         |   ✓   |         |             |
| View service types/templates  |   ✓   |    ✓    |             |
| Create/manage engagements     |   ✓   |    ✓    |             |
| Generate recurring engagement |       |    ✓    |             |
| Assign/reassign tasks         |   ✓   |    ✓    |             |
| View own tasks                |   ✓   |    ✓    |      ✓      |
| Update own task status        |       |         |      ✓      |
| Submit work for review        |       |         |      ✓      |
| Review submitted work         |       |    ✓    |             |
| Approve work                  |       |    ✓    |             |
| Request changes               |       |    ✓    |             |
| Dashboard                     |   ✓   |    ✓    |      ✓      |

Authorization is enforced server-side. Frontend navigation is not treated as a security boundary.

## Task Workflow

The backend enforces the following workflow:

```text
NOT_STARTED
     │
     ▼
IN_PROGRESS ────────────────┐
     │                      │
     ├── WAITING_FOR_CLIENT │
     │          │           │
     │          └───────────┘
     │
     └── READY_FOR_REVIEW
              │
       ┌──────┴──────┐
       ▼             ▼
 COMPLETED     CHANGES_REQUESTED
                     │
                     ▼
                IN_PROGRESS
```

Team Members cannot directly transition their work to `COMPLETED`.

A task must first reach `READY_FOR_REVIEW`, after which an authorized Manager can approve it or request changes.

A Team Member cannot approve their own work.

## Engagements and Recurring Services

An engagement belongs to a client and service type.

When an engagement is created, the backend loads the selected service's task templates and creates the corresponding tasks in the same database transaction.

Recurring services support:

* Monthly periods: `YYYY-MM`
* Quarterly periods: `YYYY-QN`
* Yearly periods: `YYYY`

The application can generate the next recurring engagement and its tasks.

Duplicate recurring engagements are prevented using the client, service type, and period combination.

The database contains a unique constraint for this combination, while the service layer also performs duplicate checking before creation.

## Database

The main domain entities are:

```text
User
Client
ServiceType
TaskTemplate
Engagement
Task
AuditLog
```

Important relationships include:

```text
Client
  └── Engagement
        ├── ServiceType
        │     └── TaskTemplate
        │
        └── Task
              └── User (assigned member)

User
  └── AuditLog
```

The database uses foreign keys, unique constraints, and indexes to maintain data integrity and support common task and engagement queries.

## Local Development

### Prerequisites

* Node.js 24+
* PostgreSQL database
* npm

The application uses Supabase PostgreSQL in the deployed setup, but any compatible PostgreSQL database can be used locally.

### 1. Clone the repository

```bash
git clone <REPOSITORY_URL>
cd task-engagement-manager
```

### 2. Configure the backend

```bash
cd server
npm install
```

Create `.env` based on `.env.example`.

The backend requires:

```env
DATABASE_URL=<postgres-connection-pooler-url>
DIRECT_URL=<postgres-direct-connection-url>
JWT_SECRET=<strong-secret>
PORT=4000
CLIENT_URL=http://localhost:3000
```

`DATABASE_URL` is used for the application database connection.

`DIRECT_URL` is used by Prisma migrations.

### 3. Generate Prisma Client

```bash
npm run prisma:generate
```

### 4. Run database migrations

```bash
npm run prisma:migrate
```

### 5. Seed sample data

```bash
npm run db:seed
```

The seed data includes dummy users, clients, service types, task templates, engagements, tasks, and audit records.

No real or confidential information is used.

### 6. Start the backend

```bash
npm run dev
```

The backend runs on:

```text
http://localhost:4000
```

### 7. Configure the frontend

In a separate terminal:

```bash
cd client
npm install
```

Create `.env.local` and add:

```env
NEXT_PUBLIC_API_URL=http://localhost:4000/api
```

For a deployed environment, replace the value with the deployed backend API URL.

### 8. Start the frontend

```bash
npm run dev
```

The frontend runs on:

```text
http://localhost:3000
```

## Testing

Backend automated tests use Vitest and Supertest.

From the `server` directory:

```bash
npm test
```

Type-check the backend:

```bash
npm run typecheck
```

Build the backend:

```bash
npm run build
```

The test suite covers authentication/RBAC, dashboard behavior, task assignment authorization, task workflow and review rules, pagination, and recurring engagement behavior.

## Demo Credentials

The seeded application contains the following demo accounts.

### Manager

```text
Email: rahul.manager@example.com
Password: Password123!
```

### Team Member

```text
Email: amit@example.com
Password: Password123!
```

Additional seeded users are available for demonstrating different roles and assignments.

## API Structure

The Express API is organized into:

```text
Routes
  ↓
Controllers
  ↓
Validators
  ↓
Services
  ↓
Prisma
  ↓
PostgreSQL
```

Controllers handle HTTP concerns and response codes.

Validators handle request-shape validation using Zod.

Services contain business rules and database operations.

Middleware handles authentication and role-based authorization.

This keeps HTTP handling separate from business logic.

## Error Handling

The API uses appropriate HTTP status codes for common failures, including:

* `400` — invalid request or workflow transition
* `401` — authentication required
* `403` — insufficient permissions
* `404` — requested resource not found
* `409` — duplicate/conflicting resource
* `500` — unexpected server error

Validation is performed on the server regardless of frontend validation.

## Deployment

### Frontend

Deployed application:

```text
<LIVE_APPLICATION_URL>
```

### Source Code

```text
<REPOSITORY_URL>
```

The production deployment uses:

```text
Next.js
    ↓
Express API
    ↓
Supabase PostgreSQL
```

Environment-specific configuration is supplied through deployment environment variables rather than committed secrets.

## Production Considerations

If the system grows to approximately 5 million tasks, the main areas requiring additional consideration are:

### Database Indexes

Task queries frequently filter by:

* assignee
* status
* due date
* engagement

Indexes should therefore support these access patterns. Existing indexes cover common assignment/status and task lookup patterns.

At larger scale, query plans should be monitored and indexes adjusted based on actual workload.

### Pagination

Task lists use server-side pagination rather than returning the complete task dataset.

For very large datasets, cursor-based pagination could be considered for high-volume or frequently changing lists.

### Background Jobs

Recurring engagement generation should eventually be moved from a user-triggered operation to a background job.

A scheduled worker could identify due recurring engagements and generate their next periods without requiring a user to manually initiate the operation.

The operation should remain idempotent so repeated job execution does not create duplicate engagements.

### Dashboard Queries

Dashboard metrics should remain aggregated rather than loading individual task records.

At significantly higher volumes, frequently requested metrics could be optimized using:

* carefully indexed aggregate queries
* precomputed counters
* materialized views
* caching where appropriate

The appropriate approach would depend on query frequency and consistency requirements.

### Logging and Monitoring

Production monitoring should include:

* API error rates
* request latency
* database query latency
* transaction failures
* background-job failures
* authentication failures
* application health checks

Structured logs should include request identifiers and relevant operation metadata without exposing credentials or sensitive information.

## Technical Decisions

### Prisma + PostgreSQL

PostgreSQL provides relational integrity and strong transactional guarantees for the application's interconnected domain model.

Prisma provides type-safe database access while keeping the schema and relationships explicit.

### Service-layer Business Logic

Business rules such as workflow transitions, recurring period validation, duplicate prevention, and task generation are implemented in backend services rather than relying on frontend behavior.

This ensures that the rules remain enforced regardless of the API client.

### Transactions for Engagement Creation

Engagement creation and task generation are performed within a database transaction.

This ensures that the engagement and its generated tasks are committed together. If a failure occurs during the operation, the transaction can roll back instead of leaving a partially created engagement.

## Assignment Coverage

The implementation addresses the major requirements of the technical assignment:

* Persistent database storage
* Relational domain model
* Server-side validation
* Server-side authorization
* Task workflow enforcement
* Recurring engagement generation
* Duplicate prevention
* Transactional task generation
* Audit/history tracking
* Dashboard metrics
* Pagination
* Backend automated tests
* Role-based functionality
* Sample data

## License

This project was created as a technical assignment and is not intended for production use without additional security, infrastructure, monitoring, and operational hardening.
