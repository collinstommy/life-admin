Of course. Based on our conversation, I'll create a detailed specification for the new agent-based expense recorder. The focus will be on the foundational framework and the initial, simple expense recording feature as you requested.

Here is the content for `@/plan/agents.md`:

````markdown
# Specification: Expense Management Agent Framework

## 1. Overview 📜

This document outlines the technical specification for a new **intelligent agent framework** designed for streamlined expense management. The initial implementation will focus on a **basic expense recorder** that allows users to log an expense with a **name**, **cost**, and associate it with an **expense list** via a simple text or voice command.

The system is built on a serverless architecture using **Cloudflare Workers**, leveraging the **Gemini API** for natural language understanding and **Cloudflare D1** for database storage.

***

## 2. System Architecture: The Agent Framework ⚙️

The core of the system is a pipeline of specialized, independent agents. Each agent has a single responsibility, making the system modular, scalable, and easy to maintain. For the initial implementation, we will focus on the first two agents, with the others being simple passthrough stubs to be developed in later phases.

### Agent Pipeline

1.  **Expense Input Processor Agent:**
    * **Responsibility:** Receives raw input from the user (e.g., text like "coffee for 5.50 on my personal list").
    * **Action:** Forwards the raw text to the Gemini API to extract structured data.
    * **Output:** A JSON object, e.g., `{ "name": "coffee", "cost": 5.50, "list_name": "personal" }`.

2.  **Expense Validation Agent:**
    * **Responsibility:** Ensures the data extracted by the Input Agent is valid and complete.
    * **Action (Phase 1):**
        * Verifies that `name` is a non-empty string.
        * Verifies that `cost` is a positive number.
        * Verifies that `list_name` is present.
    * **Output:** The validated and sanitized JSON object.

3.  **Expense Categorization Agent (Placeholder for Phase 2):**
    * **Responsibility:** Intelligently assigns a category (e.g., "Food & Drink", "Travel") to the expense.
    * **Action (Phase 1):** No-op. Passes data through.

4.  **Budget Monitoring Agent (Placeholder for Phase 3):**
    * **Responsibility:** Checks the expense against predefined budgets.
    * **Action (Phase 1):** No-op. Passes data through.

5.  **Receipt Management Agent (Placeholder for Phase 2):**
    * **Responsibility:** Handles OCR processing and storage of receipt images.
    * **Action (Phase 1):** No-op. This agent will not be triggered.

***

## 3. Technical Implementation Details 🛠️

### Technology Stack

* **Compute:** Cloudflare Workers
* **AI/NLU:** Google Gemini API
* **Database:** Cloudflare D1 (SQLite)
* **Storage (Future):** Cloudflare R2 (for receipts)

### Data Models (D1 Schema)

We will require two initial tables in our D1 database.

**`expense_lists`**
| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `INTEGER` | `PRIMARY KEY` | Unique identifier for the list. |
| `name` | `TEXT` | `NOT NULL, UNIQUE` | The name of the expense list (e.g., "Work", "Personal"). |
| `created_at`| `TIMESTAMP` | `DEFAULT CURRENT_TIMESTAMP` | Timestamp of creation. |

**`expenses`**
| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `INTEGER` | `PRIMARY KEY` | Unique identifier for the expense. |
| `name` | `TEXT` | `NOT NULL` | The name of the expense (e.g., "Latte", "Client Lunch"). |
| `cost` | `REAL` | `NOT NULL` | The cost of the expense. |
| `list_id`| `INTEGER` | `NOT NULL, FOREIGN KEY` | References `id` in `expense_lists`. |
| `created_at`| `TIMESTAMP` | `DEFAULT CURRENT_TIMESTAMP` | Timestamp of creation. |

### API Endpoint

A single endpoint will be created to handle new expense submissions.

**`POST /api/expenses`**

* **Purpose:** Create a new expense via a natural language query.
* **Request Body:**
    ```json
    {
      "input": "Lunch with client for 63 dollars on the work expenses list"
    }
    ```
* **Success Response (201 Created):**
    ```json
    {
      "id": 123,
      "name": "Lunch with client",
      "cost": 63.0,
      "list_name": "Work Expenses"
    }
    ```
* **Error Response (400 Bad Request):**
    ```json
    {
      "error": "Could not determine the cost from the input."
    }
    ```

### Workflow Pipeline ➡️

1.  A `POST` request with the user's text input hits the Cloudflare Worker endpoint.
2.  The **Input Processor Agent** is invoked. It constructs a prompt for the Gemini API to extract `name`, `cost`, and `list_name`.
3.  The Gemini API returns a structured JSON object.
4.  The **Validation Agent** receives the JSON. It performs basic checks (e.g., `cost > 0`).
5.  The worker queries the `expense_lists` table in D1 to find the `id` corresponding to the `list_name`. If the list doesn't exist, it can either be created or an error can be returned (TBD: for Phase 1, we will assume it exists).
6.  The worker inserts a new record into the `expenses` table with the validated `name`, `cost`, and the retrieved `list_id`.
7.  A success response is returned to the client.

***

## 4. Implementation Plan 🚀

This feature will be rolled out in a phased approach.

### Phase 1: Core Expense Logging (2-Week Sprint)

* **Week 1: Core Infrastructure Setup**
    * [ ] Set up Cloudflare D1 database with `expenses` and `expense_lists` schemas.
    * [ ] Create the `POST /api/expenses` endpoint on a Cloudflare Worker.
    * [ ] Securely store the Gemini API key as a Worker secret.
* **Week 2: Feature Implementation & Testing**
    * [ ] Implement the **Input Processor Agent** to call the Gemini API and parse the response.
    * [ ] Implement the **Validation Agent** with basic data checks.
    * [ ] Implement the D1 database logic to look up the list and insert the expense.
    * [ ] Write unit tests for the agents and an integration test for the endpoint.

### Phase 2: Advanced Processing (Future)

* Implement the **Expense Categorization Agent**.
* Implement the **Receipt Management Agent** with Cloudflare R2 for image storage and an OCR service.

### Phase 3: Intelligence & Monitoring (Future)

* Implement the **Budget Monitoring Agent** to track spending against budgets.
* Develop a system for user alerts and notifications.


````