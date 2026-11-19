# Distributed Inventory Management System
### Event-Driven Microservices with CQRS & Saga Choreography

[![Architecture](https://img.shields.io/badge/Architecture-Microservices-black?style=flat-square)](#microservices-architecture)
[![Pattern](https://img.shields.io/badge/Design_Patterns-CQRS_%26_Saga_Choreography-white?style=flat-square)](#design-patterns--distributed-concepts)
[![Broker](https://img.shields.io/badge/Message_Broker-Apache_Kafka_(KRaft)-black?style=flat-square)](#apache-kafka-topics--event-flows)
[![Database](https://img.shields.io/badge/Databases-PostgreSQL_%26_MongoDB-black?style=flat-square)](#dual-database-cqrs-implementation)

An enterprise-grade, distributed inventory and order management system built with **Node.js microservices**, demonstrating **CQRS (Command Query Responsibility Segregation)**, **Saga Choreography** for distributed transactions without distributed database locks, and **Eventual Consistency** powered by **Apache Kafka**.

---

## Table of Contents
1. [Architecture Overview](#architecture-overview)
2. [Tech Stack](#tech-stack)
3. [Design Patterns & Distributed Concepts](#design-patterns--distributed-concepts)
   - [CQRS (Command Query Responsibility Segregation)](#1-cqrs-command-query-responsibility-segregation)
   - [Saga Choreography](#2-saga-choreography)
   - [Eventual Consistency](#3-eventual-consistency)
4. [Microservices Breakdown](#microservices-breakdown)
   - [Order Service (Port 4000)](#1-order-service-port-4000)
   - [Inventory Service (Port 4001)](#2-inventory-service-port-4001)
   - [Frontend Application (Port 5173)](#3-frontend-application)
5. [Apache Kafka Topics & Event Flows](#apache-kafka-topics--event-flows)
   - [`order-events`](#topic-1-order-events)
   - [`inventory-events`](#topic-2-inventory-events)
   - [`inventory-DBupdate-events`](#topic-3-inventory-dbupdate-events)
6. [API Reference](#api-reference)
   - [Order Service Endpoints](#order-service-endpoints-port-4000)
   - [Inventory Service Endpoints](#inventory-service-endpoints-port-4001)
7. [Getting Started & Local Setup](#getting-started--local-setup)
8. [Testing Saga Workflows (Success & Failure)](#testing-saga-workflows)

---

## Architecture Overview

```
                      ┌────────────────────────────────────────┐
                      │              CLIENT / UI               │
                      └──────────────┬───────────────────┬─────┘
                     POST /orders    │                   │ GET /inventory
                                     ▼                   ▼
                          ┌────────────────────┐   ┌────────────────────────┐
                          │   Order Service    │   │   Inventory Service    │
                          │    (Port 4000)     │   │      (Port 4001)       │
                          └──────────┬─────────┘   └───────┬────────┬───────┘
                                     │                     │        │
                                     ▼ Writes              ▼ Writes ▼ Reads
                              ┌─────────────┐        ┌──────────┐ ┌─────────┐
                              │ PostgreSQL  │        │PostgreSQL│ │ MongoDB │
                              │  (Orders)   │        │ (Writes) │ │ (Reads) │
                              └─────────────┘        └────┬─────┘ └────▲────┘
                                     │                    │            │
                                     │ Events             │ Sync Event │ Sync
                                     ▼                    ▼            │
  ══════════════════════════════ APACHE KAFKA (PORT 9092) ═════════════╪══════════════════════
    • order-events                (OrderCreated, OrderCancelled) ──────┼──► Consumed by Inventory
    • inventory-events            (InventoryReserved, Failed)   ◄──────┼─── Consumed by Order
    • inventory-DBupdate-events   (ProductCreated, Updated, Del)───────┴──► Consumed by Inventory
  ═════════════════════════════════════════════════════════════════════════════════════════════
```

---

## Tech Stack

| Domain | Technologies | Details |
|---|---|---|
| **Runtime & Framework** | Node.js (ES Modules), Express.js | High-throughput asynchronous I/O |
| **Frontend** | React 19, Vite, Tailwind CSS v4, Framer Motion | High-contrast monochrome UI with live animated architecture canvas |
| **Relational Database** | PostgreSQL (Neon Cloud Serverless) | ACID-compliant write store for Orders & Inventory |
| **NoSQL Database** | MongoDB Atlas (Mongoose) | Fast, indexed read model for Inventory queries |
| **Message Broker** | Apache Kafka (Official `apache/kafka:latest`) | Event streaming running in KRaft mode (no ZooKeeper required) |
| **Containerization** | Docker & Docker Compose | Single-command local Kafka broker on port `9092` |
| **Design Patterns** | CQRS, Saga Choreography, Eventual Consistency | Decoupled distributed microservices |

---

## Design Patterns & Distributed Concepts

### 1. CQRS (Command Query Responsibility Segregation)
Instead of forcing a single database to handle both heavy relational writes and high-frequency read requests, the **Inventory Service** splits operations into two dedicated data stores:

- **Command (Write Store) — PostgreSQL**:
  - Handles all mutations: `addProduct`, `updateProduct`, `deleteProduct`, and atomic stock reservation / release.
  - Guarantees strict transactional integrity and row-level locking for inventory deductions (`stock >= quantity`).
- **Query (Read Store) — MongoDB**:
  - Serves all read queries: `GET /inventory` and `GET /inventory/:productId`.
  - Documents are indexed on `productId` and optimized for low-latency queries without impacting write transactions.
- **Event-Driven Synchronization**:
  - Every write to PostgreSQL emits a message to the Kafka topic `inventory-DBupdate-events`.
  - The Inventory Service's background consumer receives the event and updates MongoDB, achieving **eventual consistency** in milliseconds.

### 2. Saga Choreography
In microservices, executing a distributed transaction using Two-Phase Commit (2PC) creates tight coupling and database locking bottlenecks. This project implements **Saga Choreography**, where services communicate peer-to-peer through asynchronous domain events:

1. **Order Initiation**: The customer places an order. Order Service creates the record in PostgreSQL with status **`PENDING`** and emits `OrderCreated` to Kafka topic `order-events`.
2. **Inventory Verification (Local Transaction)**:
   - Inventory Service consumes `OrderCreated` and checks available stock in PostgreSQL.
   - **Happy Path (Stock Available)**: Stock is decremented in PostgreSQL. Inventory Service emits `InventoryReserved` to Kafka topic `inventory-events`.
   - **Failure Path (Out of Stock)**: Inventory Service detects insufficient stock. It emits `InventoryReservationFailed` with the exact failure reason to Kafka topic `inventory-events`.
3. **Settlement / Compensation**:
   - Order Service consumes the result from `inventory-events`.
   - If `InventoryReserved` $\rightarrow$ Order status is updated to **`CONFIRMED`**.
   - If `InventoryReservationFailed` $\rightarrow$ Order status is updated to **`FAILED`** (transaction rejected).
4. **User Cancellation (Compensating Transaction)**:
   - When a user cancels an order via `PUT /orders/:id/cancel`, Order Service sets status to **`CANCELLED`** and emits `OrderCancelled`.
   - Inventory Service consumes `OrderCancelled` and releases/restores the previously reserved stock back to PostgreSQL, which syncs to MongoDB.

### 3. Eventual Consistency
Data in MongoDB might lag by a few milliseconds behind PostgreSQL during bursts of write traffic. By offloading reads to MongoDB and relying on Kafka's replayable log, the system maintains high availability and fault tolerance.

---

## Microservices Breakdown

### 1. Order Service (Port 4000)
- **Role**: Manages the complete lifecycle of orders (creation, cancellation, updates, and status tracking).
- **Database**: PostgreSQL (Neon Cloud) storing the `orders` table.
- **User Scope**: Uses default `userId = 1` for all orders (authentication is simplified for this architectural prototype).
- **PostgreSQL Table Schema**:
  ```sql
  CREATE TABLE IF NOT EXISTS orders (
    id SERIAL PRIMARY KEY,
    user_id INT DEFAULT 1,
    product_id VARCHAR(100) NOT NULL,
    quantity INT NOT NULL,
    price NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    status VARCHAR(50) DEFAULT 'PENDING',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
  );
  ```
- **Order Statuses**:
  - `PENDING`: Order created, awaiting stock reservation from Inventory Service.
  - `CONFIRMED`: Stock reserved successfully; order finalized.
  - `FAILED`: Stock unavailable or product not found; Saga rejected.
  - `CANCELLED`: Order cancelled by user; compensating stock release dispatched.
- **Kafka Producer**: Publishes to `order-events` (`OrderCreated`, `OrderCancelled`).
- **Kafka Consumer**: Listens to `inventory-events` (`InventoryReserved`, `InventoryReservationFailed`).

---

### 2. Inventory Service (Port 4001)
- **Role**: Manages product items, catalogs, atomic stock reservations, and CQRS dual-database synchronization.
- **Databases**:
  - **Write Database**: PostgreSQL (Neon Cloud) storing the `inventory` table.
    ```sql
    CREATE TABLE IF NOT EXISTS inventory (
      product_id VARCHAR(100) PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      stock INT NOT NULL DEFAULT 0,
      price NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
    ```
  - **Read Database**: MongoDB Atlas storing the `inventories` collection indexed on `productId`.
- **Atomic Stock Reservation (SQL)**:
  ```sql
  UPDATE inventory
  SET stock = stock - $1, updated_at = CURRENT_TIMESTAMP
  WHERE product_id = $2 AND stock >= $1
  RETURNING *;
  ```
- **Kafka Producers**:
  - Publishes to `inventory-events` (`InventoryReserved`, `InventoryReservationFailed`).
  - Publishes to `inventory-DBupdate-events` (`ProductCreated`, `ProductUpdated`, `ProductDeleted`).
- **Kafka Consumers**:
  - **Order Consumer**: Listens to `order-events` to reserve or release stock.
  - **DB Sync Consumer**: Listens to `inventory-DBupdate-events` and updates MongoDB read projections.

---

### 3. Frontend Application
- **Role**: User interface built with React 19, Vite, and Tailwind CSS in a monochrome design.
- **Features**:
  - **Interactive Architecture Simulator**: Powered by Framer Motion, visually tracing event packets along the exact architecture diagram.
  - **Inventory Stock Management**: Quick-add catalog with preset categories (*Electronics*, *Clothing*, *Accessories*) and single-click `+` provisioning buttons.
  - **Storefront & Orders Ledger**: Marketplace to place orders, with real-time status tracking and a dedicated **0-Stock Saga failure test product** (`ELEC-RTX-4090`).

---

## Apache Kafka Topics & Event Flows

### Topic 1: `order-events`
Emitted by **Order Service** when orders are placed or cancelled.

#### `OrderCreated` Payload
```json
{
  "eventType": "OrderCreated",
  "data": {
    "orderId": 101,
    "userId": 1,
    "productId": "ELEC-MBP-M3",
    "quantity": 2,
    "price": 4998.00,
    "status": "PENDING",
    "timestamp": "2026-11-19T13:46:42.701Z"
  }
}
```

#### `OrderCancelled` Payload
```json
{
  "eventType": "OrderCancelled",
  "data": {
    "orderId": 101,
    "userId": 1,
    "productId": "ELEC-MBP-M3",
    "quantity": 2,
    "price": 4998.00,
    "status": "CANCELLED",
    "timestamp": "2026-11-19T13:50:11.200Z"
  }
}
```

---

### Topic 2: `inventory-events`
Emitted by **Inventory Service** in response to order operations (Saga settlement).

#### `InventoryReserved` (Happy Path)
```json
{
  "eventType": "InventoryReserved",
  "data": {
    "orderId": 101,
    "productId": "ELEC-MBP-M3",
    "quantity": 2,
    "status": "RESERVED",
    "reason": null,
    "remainingStock": 10,
    "timestamp": "2026-11-19T13:46:43.120Z"
  }
}
```

#### `InventoryReservationFailed` (Failure / Rollback Path)
```json
{
  "eventType": "InventoryReservationFailed",
  "data": {
    "orderId": 102,
    "productId": "ELEC-RTX-4090",
    "quantity": 1,
    "status": "FAILED",
    "reason": "Insufficient stock for product 'ELEC-RTX-4090'. Requested: 1, Available: 0.",
    "remainingStock": 0,
    "timestamp": "2026-11-19T13:48:15.340Z"
  }
}
```

---

### Topic 3: `inventory-DBupdate-events`
Emitted by **Inventory Service** whenever PostgreSQL write mutations occur (CQRS Sync).

#### `ProductCreated` / `ProductUpdated` Payload
```json
{
  "eventType": "ProductUpdated",
  "data": {
    "productId": "ELEC-MBP-M3",
    "name": "Apple MacBook Pro 16\" (M3 Max)",
    "stock": 10,
    "price": 2499.00,
    "timestamp": "2026-11-19T13:46:43.100Z"
  }
}
```

#### `ProductDeleted` Payload
```json
{
  "eventType": "ProductDeleted",
  "data": {
    "productId": "ELEC-MBP-M3",
    "timestamp": "2026-11-19T13:52:00.000Z"
  }
}
```

---

## API Reference

### Order Service Endpoints (Port 4000)

| Method | Endpoint | Description | Request Body |
|---|---|---|---|
| `POST` | `/orders` | Create a new order (status `PENDING`, emits to Kafka) | `{"productId": "ELEC-MBP-M3", "quantity": 1, "price": 2499.00}` |
| `GET` | `/orders` | Retrieve all orders for default user (`userId = 1`) | _None_ |
| `GET` | `/orders/:id` | Get details of a single order by ID | _None_ |
| `GET` | `/orders/:id/track`| Track order status, timestamps, and stage explanation | _None_ |
| `PUT` | `/orders/:id/cancel` | Cancel an order and trigger stock compensation | _None_ |

### Inventory Service Endpoints (Port 4001)

| Method | Endpoint | Description | Data Store |
|---|---|---|---|
| `GET` | `/inventory` | Get all inventory items (CQRS Query) | **MongoDB** |
| `GET` | `/inventory/:productId` | Get product stock by SKU | **MongoDB** |
| `POST` | `/inventory` | Add/restock product (CQRS Command) | **PostgreSQL** $\rightarrow$ Kafka $\rightarrow$ **MongoDB** |
| `PUT` | `/inventory/:productId` | Update product details | **PostgreSQL** $\rightarrow$ Kafka $\rightarrow$ **MongoDB** |
| `DELETE`| `/inventory/:productId`| Delete product | **PostgreSQL** $\rightarrow$ Kafka $\rightarrow$ **MongoDB** |

---

## Getting Started & Local Setup

### Prerequisites
- [Node.js](https://nodejs.org/) v18 or higher
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (for Apache Kafka)
- [Git](https://git-scm.com/)

### 1. Clone the Repository
```bash
git clone <your-repository-url>
cd inventory
```

### 2. Start Apache Kafka via Docker
From the project root:
```bash
docker compose up -d
```
Verify Kafka is running on port `9092`:
```bash
docker ps --filter "name=inventory-kafka"
```

### 3. Start the Order Service
```bash
cd OrderService
npm install
npm run dev
```
*Runs on `http://localhost:4000` with PostgreSQL connection established.*

### 4. Start the Inventory Service
Open a second terminal:
```bash
cd InventoryService
npm install
npm run dev
```
*Runs on `http://localhost:4001` with PostgreSQL and MongoDB connections established, and Kafka consumers active.*

### 5. Start the Frontend
Open a third terminal:
```bash
cd frontend
npm install
npm run dev
```
*Runs on `http://localhost:5173`.*

---

## Testing Saga Workflows

### Test 1: Successful Order & Stock Deduction (Happy Path)
1. Open the UI at `http://localhost:5173` and go to the **Orders Ledger** tab.
2. Select any product with available stock (e.g., `ELEC-MBP-M3`).
3. Click **"Buy Product"**.
4. Observe the order appear with status `PENDING`, and within 1-2 seconds, transition to:
   ```
   CONFIRMED
   ```
5. Check the **Inventory Stock** tab: the product's stock has decremented in both PostgreSQL and MongoDB!

### Test 2: Out-of-Stock Order Rejection (Saga Failure & Rollback)
1. Go to the **Orders Ledger** tab.
2. Find the pre-seeded 0-stock product: `ELEC-RTX-4090` (*NVIDIA GeForce RTX 4090 (Out of Stock)*).
3. Click **"Buy 0-Stock (Test Saga Fail)"**.
4. Order Service writes the order as `PENDING` and alerts Kafka.
5. Inventory Service validates PostgreSQL stock, detects `0` units, and rejects reservation.
6. Order Service consumes `InventoryReservationFailed` and updates the order status to:
   ```
   FAILED (OUT OF STOCK)
   ```

### Test 3: Order Cancellation & Compensation
1. In the **Orders Ledger** tab, find any `CONFIRMED` order.
2. Click **"Cancel Order"**.
3. Order Service marks the order as `CANCELLED` and emits `OrderCancelled`.
4. Inventory Service releases and restores the quantity in PostgreSQL, which synchronizes to MongoDB.

---

## License
ISC
