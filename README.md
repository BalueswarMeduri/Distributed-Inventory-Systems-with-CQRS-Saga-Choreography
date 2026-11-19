# Distributed Inventory & Order Management Infrastructure
#### Event-Driven Microservices with CQRS, Saga Choreography & Eventual Consistency

[![Architecture](https://img.shields.io/badge/Architecture-Microservices-black?style=flat-square)](#architecture-overview)
[![Patterns](https://img.shields.io/badge/Design_Patterns-CQRS_%26_Saga-white?style=flat-square)](#design-patterns--distributed-concepts)
[![Broker](https://img.shields.io/badge/Message_Broker-Apache_Kafka-black?style=flat-square)](#apache-kafka--event-driven-communication)
[![Databases](https://img.shields.io/badge/Databases-PostgreSQL_%26_MongoDB-black?style=flat-square)](#cqrs--dual-database-architecture)

A distributed inventory and order management system built using **Node.js microservices**, demonstrating real-world distributed systems concepts such as **CQRS (Command Query Responsibility Segregation), Saga Choreography, Event-Driven Architecture, and Eventual Consistency**.

The system consists of two independently operating microservices — Order Service and Inventory Service — communicating asynchronously through Apache Kafka.

The objective is to explore how distributed applications handle concurrent order operations, inventory reservations, database synchronization, and failures across independently managed services.

---

# Table of Contents

1. Architecture Overview
2. Tech Stack
3. Microservices Architecture
4. Design Patterns & Distributed Concepts
   - CQRS
   - Saga Choreography
   - Eventual Consistency
   - Event-Driven Architecture
5. Apache Kafka & Event Communication
6. Database Architecture
7. Order Lifecycle & Saga Workflow
8. API Reference
9. Getting Started
10. Testing Distributed Workflows
11. Project Structure

---

# 1. Architecture Overview

The system follows a microservices architecture where each service owns its business responsibilities and database.

<img width="1457" height="687" alt="image" src="https://github.com/user-attachments/assets/08299d79-bf0e-47fc-b40a-60e640240138" />


### Core Components

**1. Order Service**
- Handles order creation, cancellation, updates, and tracking.
- Maintains order lifecycle and status.
- Publishes order-related events to Kafka.

**2. Inventory Service**
- Manages products, stock availability, and inventory updates.
- Implements CQRS using PostgreSQL and MongoDB.
- Consumes order events and performs atomic stock reservations.
- Publishes inventory-related events to Kafka.

**3. Apache Kafka**
- Acts as the asynchronous communication backbone.
- Enables event-driven communication between microservices.
- Handles event propagation and decouples service dependencies.

**4. Dual Database Architecture**
- PostgreSQL handles write operations.
- MongoDB handles read operations.
- Kafka synchronizes changes between the two databases.

### Architecture Diagram

The architecture consists of two major workflows:

- **Distributed Order Processing:** Order Service and Inventory Service communicate through Kafka using Saga Choreography.
- **CQRS Data Synchronization:** Inventory writes are performed in PostgreSQL and propagated to MongoDB through Kafka.

---

# 2. Tech Stack

| Category | Technologies | Purpose |
|---|---|---|
| Runtime | Node.js | Asynchronous backend processing |
| Backend Framework | Express.js | REST API development |
| Frontend | React, Vite, Tailwind CSS | User interface |
| Relational Database | PostgreSQL | Order storage and inventory write operations |
| NoSQL Database | MongoDB | Inventory read model |
| Message Broker | Apache Kafka | Asynchronous event communication |
| ORM / ODM | Mongoose | MongoDB data modeling |
| Containerization | Docker | Kafka containerization |
| Orchestration | Docker Compose | Local infrastructure management |
| Architecture | Microservices | Independent service boundaries |
| Design Patterns | CQRS, Saga Choreography | Distributed transaction management |

---

# 3. Microservices Architecture

The application is divided into two independent microservices.

## 1. Order Service

**Port: 4000**

**Responsibility:** Manages the complete order lifecycle.

### Features

- Create new orders.
- Cancel existing orders.
- Update order information.
- Track order status.
- Maintain order history.
- Publish order events to Kafka.
- Consume inventory events and update order status.

### Database

PostgreSQL

The Order Service maintains its own `orders` table.

### Order Statuses

| Status | Description |
|---|---|
| PENDING | Order created, waiting for inventory reservation |
| CONFIRMED | Inventory successfully reserved |
| FAILED | Inventory reservation failed |
| CANCELLED | Order cancelled by the customer |

### User Management

Authentication and user management are intentionally excluded from this learning project.

A default `userId = 1` is used for all orders to focus on distributed systems concepts rather than authentication implementation.

### Kafka Communication

**Producer:**
- OrderCreated
- OrderCancelled

**Consumer:**
- InventoryReserved
- InventoryReservationFailed

---

## 2. Inventory Service

**Port: 4001**

**Responsibility:** Manages product inventory, stock availability, and inventory synchronization.

### Features

- Add new products.
- Update product information.
- Delete products.
- Retrieve inventory details.
- Check stock availability.
- Perform atomic stock reservations.
- Release previously reserved stock.
- Synchronize PostgreSQL and MongoDB using Kafka.

### Database Architecture

The Inventory Service implements CQRS using two separate databases.

**PostgreSQL — Write Database**

Handles all command operations:

- Create product.
- Update product.
- Delete product.
- Reserve inventory.
- Release inventory.

**MongoDB — Read Database**

Handles all query operations:

- Retrieve all products.
- Retrieve product details.
- Check product availability.
- Retrieve inventory information.

### Kafka Communication

**Producers:**
- InventoryReserved
- InventoryReservationFailed
- ProductCreated
- ProductUpdated
- ProductDeleted

**Consumers:**
- Order Service events.
- Inventory database synchronization events.

---

# 4. Design Patterns & Distributed Concepts

## 1. CQRS (Command Query Responsibility Segregation)

CQRS separates read operations from write operations instead of using a single database for everything.

In this project, the Inventory Service uses two different databases for this purpose.

### Why CQRS?

In traditional CRUD applications, the same database handles both read and write operations.

When read traffic increases significantly, it can affect write performance.

CQRS separates these responsibilities, allowing read and write workloads to evolve independently.

### Implementation

**Command Side — PostgreSQL**

All write operations are executed against PostgreSQL.

Examples:
- Add inventory.
- Update inventory.
- Delete inventory.
- Reserve stock.
- Release stock.

**Query Side — MongoDB**

All read operations are served from MongoDB.

Examples:
- Get all products.
- Get product by ID.
- Check available stock.

### Data Synchronization Flow

1. A write request reaches Inventory Service.
2. PostgreSQL processes and commits the database transaction.
3. An event is published to Kafka.
4. A background consumer receives the event.
5. MongoDB updates its read model.

This approach allows the read database to be optimized independently of the write database.

---

## 2. Saga Choreography

Saga Choreography is a distributed transaction pattern used to manage business transactions across multiple microservices without a centralized transaction coordinator.

Each microservice performs its own local transaction and publishes an event.

Other microservices listen to those events and execute their respective operations.

### Why Saga?

In a distributed system, multiple services may need to participate in a single business operation.

For example, placing an order requires both Order Service and Inventory Service to coordinate.

Since each service owns its own database, we cannot simply use one database transaction across both services.

Saga handles this through a sequence of local transactions and compensating actions.

### Implementation in StockMesh

**Step 1 — Order Creation**

- Customer places an order.
- Order Service creates an order in PostgreSQL.
- Initial status is `PENDING`.
- Order Service publishes `OrderCreated` to Kafka.

**Step 2 — Inventory Reservation**

- Inventory Service consumes `OrderCreated`.
- Checks product availability in PostgreSQL.
- Performs an atomic stock reservation.

**Step 3 — Successful Reservation**

If sufficient stock is available:

- Inventory Service deducts the requested quantity.
- Publishes `InventoryReserved`.
- Order Service consumes the event.
- Order status changes to `CONFIRMED`.

**Step 4 — Failed Reservation**

If sufficient stock is unavailable:

- Inventory Service rejects the reservation.
- Publishes `InventoryReservationFailed`.
- Order Service consumes the event.
- Order status changes to `FAILED`.

**Step 5 — Order Cancellation (Compensation)**

When a customer cancels a confirmed order:

- Order Service changes the order status to `CANCELLED`.
- Publishes `OrderCancelled`.
- Inventory Service consumes the event.
- Previously reserved stock is released.
- PostgreSQL is updated.
- MongoDB receives the corresponding synchronization event.

This is a compensating transaction because it reverses the inventory effect of the original successful reservation.

---

## 3. Eventual Consistency

In a distributed system, maintaining immediate consistency across independently managed databases can be expensive.

This project uses eventual consistency between PostgreSQL and MongoDB.

### How it works

1. PostgreSQL receives a write operation.
2. Kafka receives the corresponding inventory event.
3. A consumer processes the event.
4. MongoDB updates its read model.

There may be a small delay between the PostgreSQL commit and MongoDB synchronization.

During this period, both databases might temporarily contain different data.

Once the event is successfully processed, MongoDB reflects the latest committed inventory state.

**Key benefit:** Read and write operations can be handled independently without requiring synchronous database replication.

---

## 4. Event-Driven Architecture

Instead of tightly coupling microservices through direct synchronous communication, StockMesh uses asynchronous event communication.

Services publish events when important business operations happen.

Other services consume those events and react independently.

For example:

- Order Service publishes `OrderCreated`.
- Inventory Service consumes `OrderCreated`.
- Inventory Service publishes `InventoryReserved`.
- Order Service consumes `InventoryReserved`.

This reduces direct dependencies between services and makes it easier to extend the architecture with additional consumers.

---

# 5. Apache Kafka — Event-Driven Communication

Apache Kafka acts as the communication backbone between the two microservices.

The project uses three Kafka topics.

## Topic 1: `order-events`

**Producer:** Order Service

Contains events related to order operations.

### OrderCreated

Published when a customer places a new order.

Example payload:

```json
{
  "eventType": "OrderCreated",
  "data": {
    "orderId": 101,
    "userId": 1,
    "productId": "ELEC-MBP-M3",
    "quantity": 2,
    "price": 4998.00,
    "status": "PENDING"
  }
}
```

### OrderCancelled

Published when a customer cancels an order.

Example payload:

```json
{
  "eventType": "OrderCancelled",
  "data": {
    "orderId": 101,
    "userId": 1,
    "productId": "ELEC-MBP-M3",
    "quantity": 2,
    "status": "CANCELLED"
  }
}
```

**Consumer:** Inventory Service

---

## Topic 2: `inventory-events`

**Producer:** Inventory Service

Contains events related to inventory reservation and its outcome.

### InventoryReserved

Published when inventory is successfully reserved.

This event informs Order Service that the inventory operation has completed successfully.

Example payload:

```json
{
  "eventType": "InventoryReserved",
  "data": {
    "orderId": 101,
    "productId": "ELEC-MBP-M3",
    "quantity": 2,
    "status": "RESERVED",
    "remainingStock": 10
  }
}
```

### InventoryReservationFailed

Published when inventory reservation fails.

Example payload:

```json
{
  "eventType": "InventoryReservationFailed",
  "data": {
    "orderId": 102,
    "productId": "ELEC-RTX-4090",
    "quantity": 1,
    "status": "FAILED",
    "reason": "Insufficient stock",
    "remainingStock": 0
  }
}
```

**Consumer:** Order Service

Order Service consumes these events and updates the corresponding order status.

---

## Topic 3: `inventory-DBupdate-events`

**Producer:** Inventory Service

Used to synchronize PostgreSQL write operations with MongoDB read models.

### Events

| Event | Purpose |
|---|---|
| ProductCreated | Creates a product in MongoDB |
| ProductUpdated | Updates product details in MongoDB |
| ProductDeleted | Removes a product from MongoDB |

### Example ProductUpdated Payload

```json
{
  "eventType": "ProductUpdated",
  "data": {
    "productId": "ELEC-MBP-M3",
    "name": "Apple MacBook Pro",
    "stock": 10,
    "price": 2499.00
  }
}
```

**Consumer:** Inventory Service database synchronization consumer.

---

# 6. Database Architecture

## Order Service — PostgreSQL

The Order Service maintains an independent database.

### Orders Table

```sql
CREATE TABLE orders (
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

## Inventory Service — PostgreSQL

Used as the primary write database.

### Inventory Table

```sql
CREATE TABLE inventory (
    product_id VARCHAR(100) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    stock INT NOT NULL DEFAULT 0,
    price NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

### Atomic Stock Reservation

To prevent concurrent requests from overselling available stock, inventory reservation is performed atomically.

```sql
UPDATE inventory
SET stock = stock - $1,
    updated_at = CURRENT_TIMESTAMP
WHERE product_id = $2
AND stock >= $1
RETURNING *;
```

If the query returns a row, the reservation succeeds.

If no row is returned, the requested stock could not be reserved.

## Inventory Service — MongoDB

MongoDB maintains the read-optimized inventory collection.

The collection is indexed using `productId` to support efficient product lookups.

The data is synchronized from PostgreSQL through Kafka events.

---

# 7. Order Lifecycle & Saga Workflow

### Successful Order — Happy Path

```text
Customer
   |
   v
Order Service
   |
   | Create Order (PENDING)
   |
   v
Kafka: order-events
   |
   | OrderCreated
   |
   v
Inventory Service
   |
   | Check Stock & Reserve
   |
   v
PostgreSQL
   |
   | Reservation Successful
   |
   v
Kafka: inventory-events
   |
   | InventoryReserved
   |
   v
Order Service
   |
   | Update Order Status
   |
   v
CONFIRMED
```

### Failed Order — Saga Failure Path

```text
Customer
   |
   v
Order Service
   |
   | Create Order (PENDING)
   |
   v
Kafka: order-events
   |
   | OrderCreated
   |
   v
Inventory Service
   |
   | Check Stock
   |
   v
Insufficient Stock
   |
   v
Kafka: inventory-events
   |
   | InventoryReservationFailed
   |
   v
Order Service
   |
   | Update Order Status
   |
   v
FAILED
```

### Order Cancellation — Compensation Flow

```text
Customer
   |
   v
Order Service
   |
   | Cancel Order
   |
   v
Kafka: order-events
   |
   | OrderCancelled
   |
   v
Inventory Service
   |
   | Release Reserved Stock
   |
   v
PostgreSQL
   |
   v
Kafka: inventory-DBupdate-events
   |
   | Inventory Updated
   |
   v
MongoDB
```

---

# 8. API Reference

## Order Service — Port 4000

| Method | Endpoint | Description |
|---|---|---|
| POST | `/orders` | Create a new order |
| GET | `/orders` | Retrieve all orders |
| GET | `/orders/:id` | Retrieve a specific order |
| GET | `/orders/:id/track` | Track order status |
| PUT | `/orders/:id/cancel` | Cancel an order |

### Create Order

```http
POST /orders
Content-Type: application/json
```

Request:

```json
{
  "productId": "ELEC-MBP-M3",
  "quantity": 1,
  "price": 2499.00
}
```

The order is initially created with `PENDING` status and an `OrderCreated` event is published to Kafka.

## Inventory Service — Port 4001

| Method | Endpoint | Description | Database |
|---|---|---|---|
| GET | `/inventory` | Retrieve all products | MongoDB |
| GET | `/inventory/:productId` | Get product details | MongoDB |
| POST | `/inventory` | Add a product | PostgreSQL |
| PUT | `/inventory/:productId` | Update product details | PostgreSQL |
| DELETE | `/inventory/:productId` | Delete a product | PostgreSQL |

All inventory write operations are synchronized with MongoDB through Kafka events.

---

# 9. Getting Started

### Prerequisites

- Node.js v18 or higher
- Docker Desktop
- Git
- PostgreSQL database
- MongoDB database

### 1. Clone the Repository

```bash
git clone <your-repository-url>
cd inventory
```

### 2. Configure Environment Variables

Configure the database connection strings and other service-specific settings in the respective environment files.

You will need:

- PostgreSQL connection string for Order Service.
- PostgreSQL connection string for Inventory Service.
- MongoDB connection string.
- Kafka broker configuration.

Do not commit credentials or environment files containing secrets to GitHub.

### 3. Start Apache Kafka

From the project root:

```bash
docker compose up -d
```

Kafka runs on port `9092`.

Verify the container:

```bash
docker ps
```

### 4. Start Order Service

Open a terminal:

```bash
cd OrderService

npm install

npm run dev
```

Service URL:

`http://localhost:4000`

### 5. Start Inventory Service

Open another terminal:

```bash
cd InventoryService

npm install

npm run dev
```

Service URL:

`http://localhost:4001`

### 6. Start Frontend

Open another terminal:

```bash
cd frontend

npm install

npm run dev
```

Frontend URL:

`http://localhost:5173`

---

# 10. Testing Distributed Workflows

The application provides different scenarios to understand how distributed transactions behave.

## Test 1: Successful Order & Stock Reservation

1. Open the application.
2. Navigate to the Orders Ledger.
3. Select a product with available stock.
4. Click Buy Product.
5. Order Service creates an order with `PENDING` status.
6. Inventory Service consumes the event and reserves stock.
7. Inventory Service publishes `InventoryReserved`.
8. Order Service updates the order to `CONFIRMED`.

**Expected Result:** Order successfully confirmed and inventory quantity reduced.

## Test 2: Out-of-Stock Order Rejection

A dedicated test product is available:

`ELEC-RTX-4090`

This product has zero available stock.

1. Navigate to the Orders Ledger.
2. Select the out-of-stock product.
3. Click Buy 0-Stock (Test Saga Fail).
4. Order Service creates the order.
5. Inventory Service checks PostgreSQL.
6. Inventory Service detects insufficient stock.
7. Publishes `InventoryReservationFailed`.
8. Order Service consumes the event.

**Expected Result:** Order status changes to `FAILED`.

## Test 3: Order Cancellation & Compensation

1. Select an order with `CONFIRMED` status.
2. Click Cancel Order.
3. Order Service updates the status to `CANCELLED`.
4. Publishes `OrderCancelled`.
5. Inventory Service consumes the event.
6. Previously reserved stock is released.
7. MongoDB receives the inventory synchronization event.

**Expected Result:** Order cancelled and previously reserved stock restored.

## Test 4: CQRS Database Synchronization

1. Add a new product.
2. PostgreSQL stores the product.
3. Kafka receives the product creation event.
4. Inventory Service's database synchronization consumer processes the event.
5. MongoDB read model gets updated.
6. Retrieve the product through a GET request.

**Expected Result:** Product is available through the MongoDB read database after synchronization.

---

# 11. Project Structure

```text
StockMesh/
│
├── OrderService/
│   ├── controllers/
│   ├── routes/
│   ├── models/
│   ├── config/
│   ├── kafka/
│   ├── services/
│   └── server.js
│
├── InventoryService/
│   ├── controllers/
│   ├── routes/
│   ├── models/
│   ├── config/
│   ├── kafka/
│   ├── services/
│   └── server.js
│
├── frontend/
│   ├── src/
│   ├── public/
│   └── package.json
│
├── docker-compose.yml
│
└── README.md
```

*Note: The directory structure above represents the intended organization; adjust it to match the actual repository.*

---

# Engineering Focus

StockMesh is designed to explore the engineering challenges behind distributed backend systems.

Rather than treating an inventory application as a collection of CRUD APIs, this project focuses on understanding:

- Service boundaries and independent database ownership.
- Separation of read and write workloads.
- Asynchronous communication using message brokers.
- Distributed transaction management.
- Eventual consistency across databases.
- Atomic inventory operations under concurrent requests.
- Compensating transactions and business failure handling.

**The goal isn't just to manage orders and inventory.**

It's to understand how independently operating services coordinate business operations, exchange events, maintain data consistency, and handle failures in a distributed environment.

---

### License

ISC
