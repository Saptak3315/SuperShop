# AetherFlow Architecture: System Deficiencies, Engineering Solutions & Implementation Roadmap

## Overview
This document provides a complete technical breakdown of the architectural gaps, concurrency challenges, and design patterns required to fulfill the specifications in `ARCHITECTURE_SPEC.md`. It serves as the master blueprint and contextual reference across execution sessions.

---

## Task 1: Deadlock Prevention via Deterministic Entity Sorting

### 1.1 Problem Statement
In multi-item checkouts, concurrent threads acquiring row locks on multiple products/batches in arbitrary order cause database deadlocks.
- **Example Scenario**:
  - Thread A requests Checkout with items $[P_1, P_2]$.
  - Thread B requests Checkout with items $[P_2, P_1]$.
  - Thread A locks $P_1$ and waits for $P_2$. Thread B locks $P_2$ and waits for $P_1$.
  - Database detects a circular lock wait dependency and throws a deadlock exception (`SQLSTATE 40P01`), aborting one or both transactions.

### 1.2 Engineering Solution
Establish a strict total order relation over all entities prior to lock lease acquisition:
$$\text{Sort } \{P_1, P_2, \dots, P_n\} \text{ such that } \text{UUID}_i < \text{UUID}_{i+1}$$
By sorting the item request payload by primary key (`productId`) before initiating the `SELECT ... FOR UPDATE` lock queries inside the ACID transaction, all concurrent threads acquire locks in the exact same sequence. This reduces lock cycle probability to **zero**.

### 1.3 Implementation Scope (`apps/backend/app/features/sales/sales_service.ts`)
- Deterministically sort the input `items` array by `productId` prior to entering the transaction batch lock loop.
- Consolidate duplicate product entries in a single request payload before sorting.

---

## Task 2: Transactional Outbox Pattern for Asynchronous Event Streaming

### 2.1 Problem Statement
In high-throughput e-commerce operations, writing directly to secondary datastructures, search engines (Elasticsearch), or pushing WebSocket updates inside the primary ACID checkout transaction creates $O(N)$ network hop dependencies, increases lock hold duration, and degrades API latency beyond the P99 $< 15\text{ms}$ budget.

### 2.2 Engineering Solution
Implement the **Transactional Outbox Pattern**:
1. Within the same database ACID transaction as stock deduction and invoice creation, write a JSON payload event to an `outbox_events` table.
2. A separate background worker / relay task polls or streams pending outbox events asynchronously.
3. Once processed/published (e.g. to Redis/WebSockets/search indexes), mark the event as `PROCESSED`.

### 2.3 Implementation Scope
- **Database Schema**: Migration `create_outbox_events_table.ts` (`id`, `event_type`, `payload`, `status`, `created_at`, `processed_at`).
- **Model**: `app/models/outbox_event.ts`.
- **Checkout Integration**: Append `OutboxEvent` record inside `sales_service.ts` checkout transaction.
- **Outbox Relay Worker**: `app/services/outbox_relay_service.ts` or background worker job to poll and dispatch events.

---

## Task 3: Strict FEFO (First-Expired, First-Out) Mathematical Allocation Engine

### 3.1 Problem Statement
Naive inventory updates (`UPDATE products SET stock = stock - X`) do not track batch-level perishable expiration dates, leading to stock spoilage and double-allocation race conditions under parallel checkout load.

### 3.2 Engineering Solution
Formally implement the FEFO lexicographical order relation $\prec$:
$$b_i \prec b_j \iff (e_i < e_j) \lor (e_i = e_j \land r_i < r_j)$$
Query active batches with `status = 'ACTIVE'`, `quantity > 0`, non-expired (`expiry_date >= TODAY`), ordered by `expiry_date ASC, received_date ASC`, locking matched rows with `FOR UPDATE`. Sequentially deduct quantities across batches until requested demand $D$ is satisfied, or abort atomically with an `INSUFFICIENT_STOCK` exception if $\sum q_i < D$.

### 3.3 Implementation Scope
- Verify and refine `SalesService.checkout` query filtering and status updates (`ACTIVE` $\to$ `DEPLETED`).
- Ensure transactional rollbacks clean up state on failure.

---

## Task 4: Automated Concurrency & Stress Testing Suite

### 4.1 Problem Statement
Without automated parallel execution tests, correctness under extreme write contention, double-allocation prevention, and zero-deadlock guarantees cannot be scientifically verified.

### 4.2 Engineering Solution
Develop a Japa test suite under `apps/backend/tests/functional/sales/` executing parallel checkout requests using `Promise.all()` over identical product stocks:
- **Test 1: FEFO Ordering Validation**: Confirm stock is deducted strictly from the batch with the earliest expiration date.
- **Test 2: Double Allocation & Stock Exhaustion**: Execute parallel checkout requests exceeding total stock to verify exact inventory depletion with 0 negative inventory and proper atomic rejections.
- **Test 3: Deadlock Immunity**: Execute concurrent reverse-order multi-item checkouts (`[P1, P2]` vs `[P2, P1]`) and assert zero deadlock aborts.

---

## Task 5: End-to-End Cashier POS UI & Real-Time Outbox Integration

### 5.1 Problem Statement
The frontend requires integration with the backend FEFO checkout API, dynamic error handling (e.g. `INSUFFICIENT_STOCK`), and low-stock/expiring batch alert visualization.

### 5.2 Implementation Scope
- Frontend API client calling AdonisJS sales endpoints.
- Cashier POS Checkout component with multi-item selection and invoice generation.
- Real-time stock / expiring batch alerts dashboard.
