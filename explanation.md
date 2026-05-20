# AgriConnect Backend: Comprehensive Build Process & Explanation

This document outlines the step-by-step process used to build the AgriConnect NestJS backend from scratch. It explains how each architectural requirement of the exam was fulfilled.

---

## Step 1: Monorepo Architecture & Setup
To scale the application cleanly and separate concerns, we used a monorepo workspace pattern using the `@nestjs/cli`.

1. **Root Configuration:** We created the `agriconnect` root folder to hold global configurations (like `package.json`, `tsconfig.json`, and `docker-compose.yml`).
2. **Main API (`apps/api-gateway`):** We generated a standard NestJS application inside the `apps` directory to act as the primary routing server.
3. **Shared Library (`libs/shared-database`):** We created a separate library strictly to house TypeORM Entities. 
   - *Why?* As the platform grows and microservices (like a dedicated `notification-worker`) are added, all services can import the exact same strict database schema without duplicating code.

## Step 2: Database Layer & Indexing
The system uses PostgreSQL due to its superior transactional locking and concurrency handling.

1. **Entities:** We mapped out 4 inter-connected tables: `Farmer`, `Product`, `Distributor`, and `Request`.
2. **Foreign Keys:** Linked `Product` and `Request` back to `Farmer` and `Distributor` via standard `@ManyToOne` bindings.
3. **Indexing Strategy:** 
   - Added `(region)` index on Farmers to speed up localized discovery.
   - Added a composite `(category, price)` index on Products for fast filtering.
   - Added composite `(distributor_id, status)` and `(farmer_id, status)` indexes on Requests so the dashboard can load inbox notifications in constant time.

## Step 3: Global Interceptors (CDN Implementation)
Instead of storing long URLs in the database, we only saved the `image_key` to keep the DB footprint small.
1. Created `CdnInterceptor` (`src/interceptors/cdn.interceptor.ts`).
2. Intercepts all traffic leaving the NestJS controller and recursively crawls the JSON payload.
3. Automatically transforms `image_key` into `https://cdn.agriconnect.io/[image_key]`.

## Step 4: Core Implementation (Catalog Pagination)
The requirement specified handling over 10,000+ farmers and massive product lists.

1. **Farmer Directory:** We used traditional `skip` and `take` (Offset/Limit) for general Farmer searching in `catalog.service.ts`.
2. **Product Directory:** We implemented **Cursor-Based Pagination**.
   - *Why?* Using `OFFSET 500000` is incredibly slow because PostgreSQL has to verify and skip all previous rows. By querying `WHERE product.id > :cursor`, we immediately jump to the relevant product using the B-Tree Primary Key index (O(1) time complexity).

## Step 5: Core Implementation (Concurrency & Request Routing)
The primary challenge of the exam: "Submit requests to multiple farmers simultaneously without race conditions or data loss."

1. **Transaction Wrapping:** Inside `requests.service.ts`, we spawn a manual TypeORM `QueryRunner` to act as a database transaction context so that either *all* requests succeed, or none do.
2. **Deadlock Prevention:** We sort the incoming product IDs before locking them to prevent circular deadlocks in PostgreSQL (e.g. Distributor A requests item 1 then 2; Distributor B requests item 2 then 1 simultaneously).
3. **Row-Level Locking:** We use `.setLock('pessimistic_write')`. This tells PostgreSQL to issue a `SELECT ... FOR UPDATE` command. If two distributors try to buy the last 50 apples at the exact same millisecond, the database forces one command to wait for the other to completely finish, explicitly preventing "overselling".

## Step 6: Core Implementation (Real-Time Websockets)
Once a request is successfully transacted, the relevant Farmer must be notified seamlessly.

1. **Redis IoAdapter:** We implemented `RedisIoAdapter` and wired it into `main.ts` so that Socket.IO natively syncs all connections across the `ioredis` backplane.
2. **Notification Gateway:** We used `@WebSocketGateway()` to host a persistent two-way socket.
3. **The Pub/Sub Strategy:** 
   - When a transaction commits in Step 5, it calls `Redis.publish('farmer-notify:[farmer_uuid]', JSON)`.
   - The Gateway is subscribed to this channel. Upon seeing the payload, it pushes it down to the exact Farmer's connected socket, regardless of which horizontal API server the farmer is actually connected to.

## Step 7: Testing Strategy
To prove the critical logic holds up, we implemented Jest Unit Tests for both modules:

1. Mocked out the `DataSource`, `QueryRunner`, and `RedisClient`.
2. Validated `CatalogService` to ensure Offset and Cursors correctly append to the SQL builder constraint string.
3. Validated `RequestsService` to ensure the `pessimistic_write` lock is triggered prior to state modification, and verified `.rollbackTransaction()` correctly halts execution preventing bad DB writes and nullifying the Redis notification.
