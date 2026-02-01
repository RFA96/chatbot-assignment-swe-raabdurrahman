# Technical Document: Production Implementation Plan

This document provides a comprehensive technical overview for building and deploying the AI-powered e-commerce chatbot in a production environment.

---

## Table of Contents

1. [System Architecture](#1-system-architecture)
2. [AI/ML Integration Strategy](#2-aiml-integration-strategy)
3. [Scalability & Performance](#3-scalability--performance)
4. [Security & Monitoring](#4-security--monitoring)
5. [Key Technical Challenges](#5-key-technical-challenges)

---

## 1. System Architecture

### 1.1 Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                                    INTERNET                                          │
└─────────────────────────────────────────┬───────────────────────────────────────────┘
                                          │
                                          ▼
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                           Google Cloud Load Balancer                                 │
│                        (HTTPS Termination, SSL Certificates)                        │
└─────────────────────────────────────────┬───────────────────────────────────────────┘
                                          │
                    ┌─────────────────────┴─────────────────────┐
                    │                                           │
                    ▼                                           ▼
┌───────────────────────────────────┐       ┌───────────────────────────────────┐
│         FRONTEND SERVICE          │       │         BACKEND SERVICE           │
│         (Cloud Run)               │       │         (Cloud Run)               │
│  ┌─────────────────────────────┐  │       │  ┌─────────────────────────────┐  │
│  │       Next.js 16            │  │       │  │       FastAPI               │  │
│  │       React 19              │  │       │  │       Python 3.11           │  │
│  │       TypeScript            │  │       │  │       Uvicorn               │  │
│  └─────────────────────────────┘  │       │  └──────────────┬──────────────┘  │
│                                   │       │                 │                  │
│  ┌─────────────────────────────┐  │       │  ┌──────────────▼──────────────┐  │
│  │     Zustand Stores          │  │       │  │    Chatbot Service          │  │
│  │  - Auth Store (persisted)   │  │       │  │  - Tool Executor            │  │
│  │  - Cart Store (persisted)   │  │       │  │  - History Manager          │  │
│  │  - Chat Store (persisted)   │  │       │  └──────────────┬──────────────┘  │
│  └─────────────────────────────┘  │       │                 │                  │
│                                   │       │                 │                  │
│  2 vCPU / 4GB RAM                │       │  2 vCPU / 4GB RAM                 │
│  Min: 1, Max: 10 instances       │       │  Min: 1, Max: 20 instances        │
└───────────────────────────────────┘       └────────┬────────┬─────────────────┘
                                                     │        │
                    ┌────────────────────────────────┘        │
                    │                                         │
                    ▼                                         ▼
┌───────────────────────────────────┐       ┌───────────────────────────────────┐
│          CLOUD SQL                │       │      EXTERNAL SERVICES            │
│        (PostgreSQL 15)            │       │                                   │
│  ┌─────────────────────────────┐  │       │  ┌─────────────────────────────┐  │
│  │    E-Commerce Schema        │  │       │  │    Google Gemini API        │  │
│  │  - Customers                │  │       │  │    (AI/ML Processing)       │  │
│  │  - Products                 │  │       │  │                             │  │
│  │  - Orders                   │  │       │  │  - Gemini 2.5 Flash         │  │
│  │  - Vouchers                 │  │       │  │  - Gemini 2.5 Pro           │  │
│  │  - Addresses                │  │       │  │  - Function Calling         │  │
│  └─────────────────────────────┘  │       │  └─────────────────────────────┘  │
│                                   │       │                                   │
│  ┌─────────────────────────────┐  │       │  ┌─────────────────────────────┐  │
│  │    AI Chatbot Schema        │  │       │  │    Secret Manager           │  │
│  │  - Chat Sessions            │  │       │  │  - API Keys                 │  │
│  │  - Chat Details             │  │       │  │  - DB Credentials           │  │
│  │  - Token Usage              │  │       │  │  - JWT Secrets              │  │
│  └─────────────────────────────┘  │       │  └─────────────────────────────┘  │
│                                   │       │                                   │
│  db-custom-2-4096                 │       │                                   │
│  (2 vCPU, 4GB RAM)               │       │                                   │
│  Private IP via VPC Connector    │       │                                   │
└───────────────────────────────────┘       └───────────────────────────────────┘
```

### 1.2 Data Flow

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│                            CHAT REQUEST DATA FLOW                                 │
└──────────────────────────────────────────────────────────────────────────────────┘

User Input                   Frontend                    Backend                    AI/Database
    │                           │                           │                           │
    │  1. Send message          │                           │                           │
    │ ─────────────────────────>│                           │                           │
    │                           │  2. POST /api/v1/chat     │                           │
    │                           │ ─────────────────────────>│                           │
    │                           │                           │  3. Get session history   │
    │                           │                           │ ─────────────────────────>│
    │                           │                           │<───────────────────────── │
    │                           │                           │                           │
    │                           │                           │  4. Send to Gemini API    │
    │                           │                           │ ─────────────────────────>│
    │                           │                           │                           │
    │                           │                           │  5. Gemini returns        │
    │                           │                           │     tool calls            │
    │                           │                           │<───────────────────────── │
    │                           │                           │                           │
    │                           │                           │  6. Execute tools         │
    │                           │                           │     (search, cart, etc)   │
    │                           │                           │ ─────────────────────────>│
    │                           │                           │<───────────────────────── │
    │                           │                           │                           │
    │                           │                           │  7. Send tool results     │
    │                           │                           │     back to Gemini        │
    │                           │                           │ ─────────────────────────>│
    │                           │                           │<───────────────────────── │
    │                           │                           │                           │
    │                           │                           │  8. Store chat history    │
    │                           │                           │ ─────────────────────────>│
    │                           │                           │                           │
    │                           │  9. Return response       │                           │
    │                           │     + products            │                           │
    │                           │<───────────────────────── │                           │
    │  10. Render rich UI       │                           │                           │
    │<───────────────────────── │                           │                           │
    │                           │                           │                           │
```

### 1.3 Technology Stack Choices with Justification

#### Frontend Stack

| Technology | Choice | Justification |
|------------|--------|---------------|
| **Framework** | Next.js 16 | Server-side rendering for SEO, App Router for modern patterns, built-in image optimization, excellent TypeScript support |
| **UI Library** | React 19 | Latest features including improved Suspense, better hydration, and concurrent rendering for smooth chat UX |
| **Language** | TypeScript | Type safety prevents runtime errors, improves IDE support, and serves as documentation |
| **State Management** | Zustand 5 | Lightweight (1.5KB), built-in persistence middleware, no boilerplate compared to Redux, perfect for persisting chat/cart state |
| **Styling** | Tailwind CSS 3.4 | Utility-first approach enables rapid development, built-in dark mode, purges unused CSS for optimal bundle size |
| **HTTP Client** | Native Fetch | Built into Next.js, no additional dependencies, supports streaming for future enhancements |

#### Backend Stack

| Technology | Choice | Justification |
|------------|--------|---------------|
| **Framework** | FastAPI 0.109 | Async-native, automatic OpenAPI docs, Pydantic validation, high performance (comparable to Node.js/Go) |
| **Language** | Python 3.11+ | Rich AI/ML ecosystem, Google GenAI SDK support, mature async support |
| **ORM** | SQLAlchemy 2.0 | Async support, mature and battle-tested, excellent PostgreSQL support, type hints |
| **Database Driver** | asyncpg | Fastest PostgreSQL driver for Python, native async support |
| **ASGI Server** | Uvicorn | High-performance ASGI server, HTTP/2 support, production-ready |
| **AI SDK** | Google GenAI | Official SDK with function calling support, streaming, and Vertex AI integration |

#### Infrastructure Stack

| Technology | Choice | Justification |
|------------|--------|---------------|
| **Compute** | Cloud Run | Serverless scaling, pay-per-use, automatic HTTPS, built-in load balancing |
| **Database** | Cloud SQL (PostgreSQL 15) | Managed service, automatic backups, high availability, VPC integration |
| **AI/ML** | Google Gemini 2.5 | State-of-the-art reasoning, function calling for tool use, cost-effective Flash model |
| **Secrets** | Secret Manager | Secure credential storage, automatic rotation, IAM integration |
| **Region** | asia-southeast2 (Jakarta) | Lowest latency for Indonesian users |

### 1.4 Database Schema Design

#### Entity Relationship Diagram

```
┌─────────────────────┐       ┌─────────────────────┐       ┌─────────────────────┐
│   tbl_customers     │       │   tbl_customer_     │       │   tbl_customer_     │
│                     │       │   session           │       │   address           │
├─────────────────────┤       ├─────────────────────┤       ├─────────────────────┤
│ PK customer_id      │───┐   │ PK session_id       │       │ PK customer_        │
│    full_name        │   │   │ FK customer_id      │───┐   │    address_id       │
│    email (unique)   │   │   │    token            │   │   │ FK customer_id      │───┐
│    password (bcrypt)│   │   │    expires_at       │   │   │    label            │   │
│    age              │   │   └─────────────────────┘   │   │    street_address   │   │
│    gender           │   │                             │   │    city, state      │   │
│    created_at       │   │                             │   │    postal_code      │   │
└─────────────────────┘   │                             │   │    country          │   │
          │               │                             │   │    lat, lng         │   │
          │               │                             │   └─────────────────────┘   │
          │               └─────────────────────────────┴─────────────────────────────┘
          │
          ▼
┌─────────────────────┐       ┌─────────────────────┐       ┌─────────────────────┐
│     tbl_order       │       │   tbl_order_items   │       │    tbl_product      │
├─────────────────────┤       ├─────────────────────┤       ├─────────────────────┤
│ PK order_id         │───┐   │ PK order_item_id    │   ┌───│ PK product_id       │
│ FK customer_id      │   │   │ FK order_id         │───┘   │ FK product_         │
│ FK voucher_id       │───┼───│ FK customer_id      │       │    category_id      │───┐
│ FK shipping_        │   │   │ FK product_id       │───────│    product_name     │   │
│    address_id       │   │   └─────────────────────┘       │    product_brand    │   │
│    status           │   │                                 │    retail_price     │   │
│    subtotal         │   │                                 │    department       │   │
│    discount_amount  │   │                                 │    stock_quantity   │   │
│    total_amount     │   │                                 │    reserved_qty     │   │
│    created_at       │   │                                 │    low_stock_       │   │
│    shipped_at       │   │                                 │    threshold        │   │
│    delivered_at     │   │                                 └─────────────────────┘   │
└─────────────────────┘   │                                           │               │
                          │                                           │               │
                          │   ┌─────────────────────┐                 │               │
                          │   │    tbl_voucher      │                 │               │
                          │   ├─────────────────────┤                 │               │
                          └───│ PK voucher_id       │                 │               │
                              │    voucher_code     │                 │               │
                              │    discount_type    │   ┌─────────────────────┐       │
                              │    discount_value   │   │ tbl_stock_movement  │       │
                              │    min_purchase     │   ├─────────────────────┤       │
                              │    max_discount     │   │ PK stock_movement_id│       │
                              │    usage_limit      │   │ FK product_id       │───────┘
                              │    used_count       │   │    movement_type    │
                              │    valid_from/until │   │    quantity         │
                              │    is_active        │   │    quantity_before  │
                              └─────────────────────┘   │    quantity_after   │
                                                        │    reference_type   │
                                                        │    reference_id     │
┌─────────────────────────────────────────┐             └─────────────────────┘
│         aichatbot SCHEMA                │
├─────────────────────────────────────────┤             ┌─────────────────────┐
│                                         │             │ tbl_product_category│
│  ┌─────────────────────┐                │             ├─────────────────────┤
│  │   chat_session      │                │         ┌───│ PK product_         │
│  ├─────────────────────┤                │         │   │    category_id      │
│  │ PK chat_session_id  │───┐            │         │   │    category_name    │
│  │    customer_id      │   │            │         │   └─────────────────────┘
│  │    created_at       │   │            │         │
│  └─────────────────────┘   │            │         │
│                            │            │         │
│  ┌─────────────────────┐   │            │         │
│  │   chat_details      │   │            │         │
│  ├─────────────────────┤   │            │         │
│  │ PK chat_id_sequence │   │            │         │
│  │ FK chat_session_id  │───┘            │         │
│  │    role (user/model)│                │         │
│  │    chat_content     │                │         │
│  │    token_usage(JSONB│                │         │
│  │    created_at       │                │         │
│  └─────────────────────┘                │         │
│                                         │         │
└─────────────────────────────────────────┘         │
                                                    │
                    ┌───────────────────────────────┘
                    │
                    ▼
          (FK relationship to tbl_product)
```

#### Key Design Decisions

| Decision | Rationale |
|----------|-----------|
| **Separate `aichatbot` schema** | Isolates AI-related tables, easier maintenance, can scale independently |
| **JSONB for token_usage** | Flexible schema for varying token metadata, efficient querying in PostgreSQL |
| **Stock tracking with constraints** | Database-level constraints prevent overselling, ensures data integrity |
| **Soft reference for chat-customer** | Chat can work without FK constraint for flexibility with guest users |
| **Composite indexes** | Optimized for common queries (status+date, stock levels) |

### 1.5 API Design

#### RESTful API Endpoints

| Category | Endpoint | Method | Description |
|----------|----------|--------|-------------|
| **Chat** | `/api/v1/chat` | POST | Send message, get AI response |
| | `/api/v1/chat/sessions` | GET | List user's chat sessions |
| | `/api/v1/chat/sessions/{id}` | GET | Get session history |
| | `/api/v1/chat/sessions/{id}` | DELETE | Delete session |
| **Products** | `/api/v1/products` | GET | Search/list products |
| | `/api/v1/products/{id}` | GET | Get product details |
| | `/api/v1/categories` | GET | List categories |
| | `/api/v1/products/category/{id}` | GET | Products by category |
| **Cart** | `/api/v1/cart` | GET | Get cart contents |
| | `/api/v1/cart` | POST | Add item to cart |
| | `/api/v1/cart/{item_id}` | DELETE | Remove item |
| | `/api/v1/cart` | DELETE | Clear cart |
| | `/api/v1/cart/count` | GET | Get item count |
| **Orders** | `/api/v1/orders` | GET | List orders |
| | `/api/v1/orders` | POST | Create order (checkout) |
| | `/api/v1/orders/{id}` | GET | Get order details |
| **Auth** | `/api/v1/auth/login` | POST | Customer login |
| | `/api/v1/auth/register` | POST | Customer registration |
| | `/api/v1/auth/refresh` | POST | Refresh token |
| **Stock** | `/api/v1/stock/{product_id}` | GET | Check stock availability |

#### API Response Format

```json
{
  "success": true,
  "data": { ... },
  "message": "Operation successful",
  "meta": {
    "page": 1,
    "page_size": 10,
    "total_items": 100,
    "total_pages": 10
  }
}
```

#### Error Response Format

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input",
    "details": [
      {
        "field": "email",
        "message": "Invalid email format"
      }
    ]
  }
}
```

---

## 2. AI/ML Integration Strategy

### 2.1 LLM Provider Selection

#### Comparison Matrix

| Criteria | Google Gemini | Anthropic Claude | OpenAI GPT-4 | Open Source (Llama) |
|----------|--------------|------------------|--------------|---------------------|
| **Function Calling** | Native support | Native support | Native support | Limited |
| **Cost (Input/1M)** | $0.15 (Flash) | $3.00 (Sonnet) | $2.50 | Self-hosted |
| **Cost (Output/1M)** | $0.60 (Flash) | $15.00 (Sonnet) | $10.00 | Self-hosted |
| **Latency** | ~500ms | ~800ms | ~1000ms | Variable |
| **Context Window** | 1M tokens | 200K tokens | 128K tokens | 8K-32K |
| **Indonesian Support** | Good | Good | Good | Limited |
| **GCP Integration** | Native (Vertex AI) | Via API | Via API | Self-deploy |

#### Decision: Google Gemini 2.5

**Primary Reasons:**
1. **Native GCP Integration**: Seamless with Cloud Run, IAM, and monitoring
2. **Cost-Effective**: Flash model is 20x cheaper than alternatives
3. **Function Calling**: Robust tool use for e-commerce operations
4. **Large Context**: 1M tokens supports long conversation history
5. **Low Latency**: Optimized for real-time chat applications

#### Model Routing Strategy

```python
class ModelRouter:
    """Route requests to appropriate model based on complexity."""

    FLASH = "gemini-2.5-flash"    # Default: fast, cheap
    PRO = "gemini-2.5-pro"        # Complex: better reasoning

    def select_model(self, query: str, context: dict) -> str:
        # Use Pro for complex scenarios
        if self._is_complex_query(query):
            return self.PRO

        # Use Pro for long conversations (better context handling)
        if context.get("turn_count", 0) > 10:
            return self.PRO

        # Default to Flash
        return self.FLASH

    def _is_complex_query(self, query: str) -> bool:
        complex_triggers = [
            "compare", "analyze", "recommend",
            "pros and cons", "best option"
        ]
        return any(t in query.lower() for t in complex_triggers)
```

### 2.2 Prompt Engineering Approach

#### System Prompt Structure

```
┌─────────────────────────────────────────────────────────────────┐
│                      SYSTEM PROMPT                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1. PERSONA DEFINITION (~200 tokens)                            │
│     "You are a friendly e-commerce shopping assistant..."       │
│                                                                  │
│  2. CAPABILITIES LIST (~300 tokens)                             │
│     - Product Discovery                                         │
│     - Cart Management                                           │
│     - Checkout Assistance                                       │
│     - etc.                                                      │
│                                                                  │
│  3. GUIDELINES (~400 tokens)                                    │
│     - Be helpful and professional                               │
│     - Check stock availability                                  │
│     - Handle out-of-stock gracefully                           │
│     - etc.                                                      │
│                                                                  │
│  4. RESPONSE FORMAT (~200 tokens)                               │
│     - Product listing format                                    │
│     - Comparison format                                         │
│     - Cart summary format                                       │
│                                                                  │
│  5. SCENARIO HANDLING (~400 tokens)                             │
│     - Vague product search                                      │
│     - Price-filtered search                                     │
│     - Checkout flow                                             │
│     - Address lookup                                            │
│                                                                  │
│  TOTAL: ~1,500 tokens                                           │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

#### Tool Definitions (20 Tools)

| Tool Category | Tools | Purpose |
|---------------|-------|---------|
| **Product Discovery** | `search_products`, `get_product_details`, `get_categories`, `get_products_by_category`, `get_brands`, `find_product_by_name` | Find and browse products |
| **Stock Management** | `check_stock`, `check_stock_by_name` | Verify availability |
| **Cart Operations** | `get_cart`, `add_to_cart`, `remove_from_cart`, `clear_cart` | Manage shopping cart |
| **Voucher System** | `get_vouchers`, `apply_voucher`, `remove_voucher` | Discount management |
| **Order Processing** | `get_addresses`, `find_address_by_label`, `checkout`, `get_orders`, `get_order_details` | Complete purchases |
| **Recommendations** | `compare_products`, `get_gift_suggestions` | AI-powered suggestions |

### 2.3 Cost Optimization Strategy

#### Token Reduction Techniques

| Technique | Savings | Implementation |
|-----------|---------|----------------|
| **System Prompt Caching** | 40-50% input | Cache static prompt via Gemini's context caching API |
| **History Truncation** | 20-30% input | Keep only last 10 messages, summarize older ones |
| **Tool Response Compression** | 15-20% | Return only essential fields (id, name, price, stock) |
| **Model Routing** | 30-40% overall | Use Flash (cheap) for simple, Pro (expensive) only for complex |

#### Token Budget Per Interaction

```
Average Chat Turn:
├── System Prompt (cached):     ~1,500 tokens × $0.0375/1M = $0.00006
├── Chat History (10 msgs):     ~2,000 tokens × $0.15/1M   = $0.00030
├── User Message:               ~100 tokens   × $0.15/1M   = $0.00002
├── Tool Results:               ~500 tokens   × $0.15/1M   = $0.00008
└── AI Response:                ~400 tokens   × $0.60/1M   = $0.00024
                                ─────────────────────────────────────
                                TOTAL PER TURN:              ~$0.0007
```

### 2.4 Fallback Mechanisms

```
┌─────────────────────────────────────────────────────────────────┐
│                    FALLBACK HIERARCHY                            │
└─────────────────────────────────────────────────────────────────┘

                    ┌─────────────────┐
                    │  User Request   │
                    └────────┬────────┘
                             │
                             ▼
                    ┌─────────────────┐
                    │ Gemini 2.5 Flash│ ◄─── Primary Model
                    └────────┬────────┘
                             │
                    ┌────────┴────────┐
                    │   Success?      │
                    └────────┬────────┘
                        Yes  │  No (Rate limit / 5xx)
                             │
              ┌──────────────┴──────────────┐
              │                             │
              ▼                             ▼
     ┌─────────────────┐         ┌─────────────────┐
     │ Return Response │         │ Gemini 2.5 Pro  │ ◄─── Fallback Model
     └─────────────────┘         └────────┬────────┘
                                          │
                                 ┌────────┴────────┐
                                 │   Success?      │
                                 └────────┬────────┘
                                     Yes  │  No
                                          │
                           ┌──────────────┴──────────────┐
                           │                             │
                           ▼                             ▼
                  ┌─────────────────┐         ┌─────────────────┐
                  │ Return Response │         │ Graceful Error  │
                  └─────────────────┘         │ + Rule-Based    │
                                              │ Response        │
                                              └─────────────────┘

Rule-Based Fallback Examples:
- "search headphones" → Direct DB query, return products
- "view cart" → Return cart contents without AI
- "help" → Return static help text
```

#### Implementation

```python
class FallbackHandler:
    async def handle_with_fallback(self, message: str, context: dict) -> Response:
        try:
            # Try primary model
            return await self.gemini_flash.generate(message, context)
        except RateLimitError:
            logger.warning("Flash rate limited, trying Pro")
            try:
                return await self.gemini_pro.generate(message, context)
            except Exception as e:
                return self._rule_based_fallback(message)
        except Exception as e:
            logger.error(f"AI failed: {e}")
            return self._rule_based_fallback(message)

    def _rule_based_fallback(self, message: str) -> Response:
        """Simple pattern matching for common queries."""
        patterns = {
            r"search (.+)": self._search_products,
            r"cart": self._get_cart,
            r"help": self._get_help,
        }
        for pattern, handler in patterns.items():
            if match := re.search(pattern, message, re.I):
                return handler(match)
        return Response(
            text="I'm having trouble processing your request. "
                 "Please try again or contact support."
        )
```

### 2.5 Estimated Cost Per Conversation

| Conversation Type | Turns | Input Tokens | Output Tokens | Cost |
|-------------------|-------|--------------|---------------|------|
| **Quick Query** | 2 | 8,000 | 1,000 | $0.0018 |
| **Product Search** | 4 | 20,000 | 3,000 | $0.0048 |
| **Full Purchase** | 8 | 45,000 | 6,000 | $0.0104 |
| **Complex Support** | 12 | 80,000 | 10,000 | $0.0180 |

#### Monthly Cost Projections

| Daily Conversations | Avg Cost/Conv | Monthly Cost |
|--------------------|---------------|--------------|
| 1,000 | $0.008 | ~$240 |
| 5,000 | $0.008 | ~$1,200 |
| 10,000 | $0.008 | ~$2,400 |
| 50,000 | $0.008 | ~$12,000 |

---

## 3. Scalability & Performance

### 3.1 Scaling Targets

| Metric | 10K Users | 50K Users | 100K Users |
|--------|-----------|-----------|------------|
| **Concurrent Connections** | 1,000 | 5,000 | 10,000 |
| **Requests/Second** | 500 | 2,500 | 5,000 |
| **Chat Messages/Min** | 2,000 | 10,000 | 20,000 |
| **Database Connections** | 100 | 300 | 500 |

### 3.2 Performance Targets

| Metric | Target | Acceptable | Critical |
|--------|--------|------------|----------|
| **Chat Response Time (p50)** | < 1s | < 2s | > 3s |
| **Chat Response Time (p95)** | < 2s | < 4s | > 5s |
| **API Response Time (p95)** | < 200ms | < 500ms | > 1s |
| **Page Load Time** | < 2s | < 3s | > 5s |
| **Error Rate** | < 0.1% | < 1% | > 5% |
| **Availability** | 99.9% | 99.5% | < 99% |

### 3.3 Caching Strategy

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           CACHING LAYERS                                     │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Browser   │────▶│   CDN       │────▶│   Redis     │────▶│  Database   │
│   Cache     │     │  (Static)   │     │  (Dynamic)  │     │  (Source)   │
└─────────────┘     └─────────────┘     └─────────────┘     └─────────────┘
     │                    │                   │                    │
     │                    │                   │                    │
     ▼                    ▼                   ▼                    ▼
┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│ Zustand     │     │ Images      │     │ Products    │     │ Orders      │
│ LocalStorage│     │ JS/CSS      │     │ Categories  │     │ Cart Items  │
│ (Chat/Cart) │     │ Fonts       │     │ Sessions    │     │ Transactions│
│             │     │ TTL: 1 year │     │ TTL: 5-15min│     │             │
└─────────────┘     └─────────────┘     └─────────────┘     └─────────────┘
```

#### Cache Configuration

| Data Type | Cache Layer | TTL | Invalidation |
|-----------|-------------|-----|--------------|
| **Static Assets** | CDN (Cloud CDN) | 1 year | Deploy-based |
| **Product Catalog** | Redis (Memorystore) | 15 min | Write-through |
| **Categories** | Redis | 1 hour | Manual |
| **Stock Levels** | Redis | 1 min | Write-through |
| **User Sessions** | Redis | 24 hours | Logout/expiry |
| **Chat History** | LocalStorage + DB | Persistent | User action |
| **AI Context Cache** | Gemini API | 1 hour | TTL-based |

#### Redis Implementation

```python
class CacheService:
    def __init__(self, redis: Redis):
        self.redis = redis

    async def get_products(self, query: str) -> Optional[List[Product]]:
        cache_key = f"products:{hash(query)}"
        cached = await self.redis.get(cache_key)
        if cached:
            return json.loads(cached)
        return None

    async def set_products(self, query: str, products: List[Product]):
        cache_key = f"products:{hash(query)}"
        await self.redis.setex(
            cache_key,
            timedelta(minutes=15),
            json.dumps([p.dict() for p in products])
        )

    async def invalidate_product(self, product_id: int):
        # Invalidate all caches containing this product
        pattern = f"products:*"
        async for key in self.redis.scan_iter(pattern):
            await self.redis.delete(key)
```

### 3.4 Database Scaling

#### Scaling Progression

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        DATABASE SCALING STAGES                               │
└─────────────────────────────────────────────────────────────────────────────┘

STAGE 1: Single Instance (< 10K users)
┌─────────────────────────┐
│     Cloud SQL           │
│   db-custom-2-4096      │
│   (2 vCPU, 4GB RAM)     │
│   100 connections       │
└─────────────────────────┘

STAGE 2: Vertical Scaling (10K - 50K users)
┌─────────────────────────┐
│     Cloud SQL           │
│   db-custom-4-16384     │
│   (4 vCPU, 16GB RAM)    │
│   200 connections       │
│   + Read Replica        │
└─────────────────────────┘

STAGE 3: Read Replicas (50K - 100K users)
                    ┌─────────────────────────┐
                    │     Primary (Write)     │
                    │   db-custom-8-32768     │
                    └───────────┬─────────────┘
                                │
              ┌─────────────────┼─────────────────┐
              │                 │                 │
              ▼                 ▼                 ▼
┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
│  Read Replica 1 │ │  Read Replica 2 │ │  Read Replica 3 │
│    (Products)   │ │    (Orders)     │ │     (Chat)      │
└─────────────────┘ └─────────────────┘ └─────────────────┘

STAGE 4: Sharding (> 100K users)
┌─────────────────────────────────────────────────────────────┐
│                    Application Router                        │
│              (Shard by customer_id % N)                     │
└───────────────────────────┬─────────────────────────────────┘
                            │
          ┌─────────────────┼─────────────────┐
          │                 │                 │
          ▼                 ▼                 ▼
   ┌─────────────┐   ┌─────────────┐   ┌─────────────┐
   │  Shard 0    │   │  Shard 1    │   │  Shard 2    │
   │ (id % 3 = 0)│   │ (id % 3 = 1)│   │ (id % 3 = 2)│
   └─────────────┘   └─────────────┘   └─────────────┘
```

#### Connection Pooling

```python
# app/db/database.py
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.pool import QueuePool

engine = create_async_engine(
    DATABASE_URL,
    poolclass=QueuePool,
    pool_size=20,           # Base connections
    max_overflow=30,        # Additional connections under load
    pool_timeout=30,        # Wait time for connection
    pool_recycle=1800,      # Recycle connections every 30 min
    pool_pre_ping=True,     # Verify connection health
)
```

### 3.5 Load Balancing Approach

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        LOAD BALANCING ARCHITECTURE                           │
└─────────────────────────────────────────────────────────────────────────────┘

                         ┌─────────────────┐
                         │   Cloud DNS     │
                         │  (GeoDNS)       │
                         └────────┬────────┘
                                  │
                                  ▼
                         ┌─────────────────┐
                         │  Cloud Load     │
                         │  Balancer       │
                         │  (Global HTTP)  │
                         └────────┬────────┘
                                  │
                    ┌─────────────┴─────────────┐
                    │                           │
                    ▼                           ▼
           ┌─────────────────┐         ┌─────────────────┐
           │   Frontend      │         │   Backend       │
           │   Cloud Run     │         │   Cloud Run     │
           │                 │         │                 │
           │  ┌───────────┐  │         │  ┌───────────┐  │
           │  │ Instance 1│  │         │  │ Instance 1│  │
           │  ├───────────┤  │         │  ├───────────┤  │
           │  │ Instance 2│  │         │  │ Instance 2│  │
           │  ├───────────┤  │         │  ├───────────┤  │
           │  │    ...    │  │         │  │    ...    │  │
           │  ├───────────┤  │         │  ├───────────┤  │
           │  │ Instance N│  │         │  │ Instance N│  │
           │  └───────────┘  │         │  └───────────┘  │
           │                 │         │                 │
           │  Auto-scaling:  │         │  Auto-scaling:  │
           │  Min: 1         │         │  Min: 1         │
           │  Max: 10        │         │  Max: 20        │
           │  Target: 60% CPU│         │  Target: 80 req │
           └─────────────────┘         └─────────────────┘
```

#### Cloud Run Auto-scaling Configuration

```yaml
# Backend service configuration
spec:
  template:
    metadata:
      annotations:
        autoscaling.knative.dev/minScale: "1"
        autoscaling.knative.dev/maxScale: "20"
        autoscaling.knative.dev/target: "80"  # concurrent requests
    spec:
      containerConcurrency: 80
      timeoutSeconds: 300
      containers:
        - resources:
            limits:
              cpu: "2"
              memory: "4Gi"
```

---

## 4. Security & Monitoring

### 4.1 Authentication/Authorization Strategy

#### JWT-Based Authentication Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        AUTHENTICATION FLOW                                   │
└─────────────────────────────────────────────────────────────────────────────┘

  Customer                Frontend                  Backend                  Database
     │                       │                        │                        │
     │  1. Login Request     │                        │                        │
     │  (email, password)    │                        │                        │
     │ ─────────────────────>│                        │                        │
     │                       │  2. POST /auth/login   │                        │
     │                       │ ──────────────────────>│                        │
     │                       │                        │  3. Verify credentials │
     │                       │                        │ ──────────────────────>│
     │                       │                        │<────────────────────── │
     │                       │                        │                        │
     │                       │                        │  4. Generate tokens    │
     │                       │                        │     - Access (15 min)  │
     │                       │                        │     - Refresh (7 days) │
     │                       │                        │                        │
     │                       │  5. Return tokens      │                        │
     │                       │<────────────────────── │                        │
     │  6. Store tokens      │                        │                        │
     │     - Access: memory  │                        │                        │
     │     - Refresh: cookie │                        │                        │
     │<───────────────────── │                        │                        │
     │                       │                        │                        │
     │  7. API Request       │                        │                        │
     │  + Authorization      │                        │                        │
     │ ─────────────────────>│                        │                        │
     │                       │  8. Forward with       │                        │
     │                       │     Bearer token       │                        │
     │                       │ ──────────────────────>│                        │
     │                       │                        │  9. Validate JWT       │
     │                       │                        │  10. Extract claims    │
     │                       │                        │  11. Process request   │
     │                       │<────────────────────── │                        │
     │<───────────────────── │                        │                        │
```

#### Token Structure

```python
# Access Token Payload
{
    "sub": "customer_123",           # Subject (customer ID)
    "email": "user@example.com",
    "type": "access",
    "iat": 1706745600,               # Issued at
    "exp": 1706746500,               # Expires (15 min)
    "jti": "unique-token-id"         # JWT ID for revocation
}

# Refresh Token Payload
{
    "sub": "customer_123",
    "type": "refresh",
    "iat": 1706745600,
    "exp": 1707350400,               # Expires (7 days)
    "jti": "unique-refresh-id"
}
```

#### Authorization Middleware

```python
# app/api/v1/deps.py
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

security = HTTPBearer(auto_error=False)

async def get_current_customer(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: AsyncSession = Depends(get_db)
) -> Optional[Customer]:
    """Extract and validate customer from JWT token."""
    if not credentials:
        return None

    try:
        payload = jwt.decode(
            credentials.credentials,
            settings.JWT_SECRET_KEY,
            algorithms=[settings.JWT_ALGORITHM]
        )

        if payload.get("type") != "access":
            raise HTTPException(status_code=401, detail="Invalid token type")

        customer_id = payload.get("sub")
        customer = await get_customer_by_id(db, customer_id)

        if not customer:
            raise HTTPException(status_code=401, detail="Customer not found")

        return customer

    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

async def require_auth(
    customer: Customer = Depends(get_current_customer)
) -> Customer:
    """Require authenticated customer."""
    if not customer:
        raise HTTPException(
            status_code=401,
            detail="Authentication required"
        )
    return customer
```

### 4.2 PII Handling and Data Privacy

#### Data Classification

| Data Type | Classification | Storage | Encryption | Retention |
|-----------|---------------|---------|------------|-----------|
| **Email** | PII | Database | At-rest (AES-256) | Account lifetime |
| **Password** | Sensitive | Database | Bcrypt (12 rounds) | Account lifetime |
| **Full Name** | PII | Database | At-rest | Account lifetime |
| **Address** | PII | Database | At-rest | Account lifetime |
| **Chat Content** | User Data | Database | At-rest | 90 days |
| **Order History** | Transaction | Database | At-rest | 7 years (legal) |
| **Session Tokens** | Sensitive | Memory/Redis | In-transit (TLS) | Token lifetime |

#### Privacy Controls

```python
class PrivacyService:
    """Handle PII according to privacy regulations."""

    async def anonymize_chat_history(self, customer_id: int):
        """Anonymize chat history for deleted accounts."""
        await self.db.execute(
            update(ChatDetails)
            .where(ChatSession.customer_id == customer_id)
            .values(chat_content="[REDACTED]")
        )

    async def export_customer_data(self, customer_id: int) -> dict:
        """GDPR data export."""
        customer = await self.get_customer(customer_id)
        orders = await self.get_customer_orders(customer_id)
        chats = await self.get_customer_chats(customer_id)

        return {
            "personal_info": customer.to_dict(),
            "orders": [o.to_dict() for o in orders],
            "chat_history": [c.to_dict() for c in chats],
            "exported_at": datetime.utcnow().isoformat()
        }

    async def delete_customer_data(self, customer_id: int):
        """Right to be forgotten."""
        # Anonymize chats
        await self.anonymize_chat_history(customer_id)

        # Delete personal data
        await self.db.execute(
            delete(CustomerAddress).where(
                CustomerAddress.customer_id == customer_id
            )
        )

        # Anonymize customer record (keep for order history)
        await self.db.execute(
            update(Customer)
            .where(Customer.customer_id == customer_id)
            .values(
                email=f"deleted_{customer_id}@anonymized.local",
                full_name="[DELETED]",
                password=None
            )
        )
```

### 4.3 Monitoring Metrics

#### Key Performance Indicators (KPIs)

| Category | Metric | Target | Alert Threshold |
|----------|--------|--------|-----------------|
| **Availability** | Uptime | 99.9% | < 99.5% |
| **Latency** | Chat Response (p95) | < 2s | > 4s |
| **Latency** | API Response (p95) | < 200ms | > 500ms |
| **Error Rate** | 5xx Errors | < 0.1% | > 1% |
| **Error Rate** | AI Failures | < 0.5% | > 2% |
| **Throughput** | Requests/sec | Baseline +20% | > Capacity 80% |
| **Saturation** | CPU Utilization | < 70% | > 85% |
| **Saturation** | Memory Usage | < 80% | > 90% |
| **Saturation** | DB Connections | < 80% | > 90% |

#### User Satisfaction Metrics

| Metric | Measurement | Target |
|--------|-------------|--------|
| **Conversation Completion Rate** | % of chats ending in order/cart | > 30% |
| **Tool Call Success Rate** | % of tool calls that succeed | > 99% |
| **User Return Rate** | % of users with repeat sessions | > 40% |
| **Avg Conversation Length** | Messages per session | 4-8 |
| **Cart Abandonment via Chat** | % starting but not completing | < 50% |

#### Monitoring Dashboard

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        MONITORING DASHBOARD                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                     REAL-TIME METRICS                                │   │
│  ├─────────────┬─────────────┬─────────────┬─────────────┬─────────────┤   │
│  │  Requests   │   Latency   │   Errors    │    AI       │   Users     │   │
│  │   /sec      │   p95       │   Rate      │  Tokens     │  Active     │   │
│  │             │             │             │   /min      │             │   │
│  │   ████      │   ████      │   ████      │   ████      │   ████      │   │
│  │   1,250     │   1.2s      │   0.05%     │   450K      │   3,200     │   │
│  └─────────────┴─────────────┴─────────────┴─────────────┴─────────────┘   │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                     SERVICE HEALTH                                   │   │
│  ├──────────────────┬──────────────────┬──────────────────────────────┤   │
│  │  Frontend        │  Backend         │  Database                    │   │
│  │  ✓ Healthy       │  ✓ Healthy       │  ✓ Healthy                   │   │
│  │  5/10 instances  │  8/20 instances  │  CPU: 45%                    │   │
│  │  CPU: 35%        │  CPU: 55%        │  Connections: 85/150         │   │
│  └──────────────────┴──────────────────┴──────────────────────────────┘   │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                     ALERTS (Last 24h)                                │   │
│  ├─────────────────────────────────────────────────────────────────────┤   │
│  │  ⚠ 14:32 - High latency detected (p95 > 3s) - AUTO-RESOLVED        │   │
│  │  ✓ 09:15 - Deployment completed successfully                        │   │
│  │  ⚠ 03:45 - AI rate limit warning (80% quota) - ACKNOWLEDGED        │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 4.4 Logging and Error Tracking

#### Structured Logging Format

```json
{
  "timestamp": "2026-02-01T10:30:00.123Z",
  "level": "INFO",
  "service": "chatbot-backend",
  "trace_id": "abc123def456",
  "span_id": "span789",
  "customer_id": "cust_123",
  "session_id": "sess_456",
  "request": {
    "method": "POST",
    "path": "/api/v1/chat",
    "user_agent": "Mozilla/5.0...",
    "ip": "203.0.113.42"
  },
  "response": {
    "status": 200,
    "latency_ms": 1234
  },
  "ai": {
    "model": "gemini-2.5-flash",
    "tokens_in": 3500,
    "tokens_out": 420,
    "tool_calls": ["search_products", "check_stock"]
  },
  "message": "Chat request processed successfully"
}
```

#### Error Tracking Integration

```python
# app/core/error_tracking.py
import sentry_sdk
from sentry_sdk.integrations.fastapi import FastApiIntegration
from sentry_sdk.integrations.sqlalchemy import SqlalchemyIntegration

def init_error_tracking():
    sentry_sdk.init(
        dsn=settings.SENTRY_DSN,
        environment=settings.ENVIRONMENT,
        integrations=[
            FastApiIntegration(transaction_style="endpoint"),
            SqlalchemyIntegration(),
        ],
        traces_sample_rate=0.1,  # 10% of transactions
        profiles_sample_rate=0.1,
        before_send=filter_sensitive_data,
    )

def filter_sensitive_data(event, hint):
    """Remove PII before sending to Sentry."""
    if "request" in event:
        headers = event["request"].get("headers", {})
        if "authorization" in headers:
            headers["authorization"] = "[FILTERED]"
        if "cookie" in headers:
            headers["cookie"] = "[FILTERED]"
    return event
```

### 4.5 CI/CD Pipeline Design

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           CI/CD PIPELINE                                     │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐
│  Code   │───▶│  Build  │───▶│  Test   │───▶│ Staging │───▶│  Prod   │
│  Push   │    │         │    │         │    │ Deploy  │    │ Deploy  │
└─────────┘    └─────────┘    └─────────┘    └─────────┘    └─────────┘
     │              │              │              │              │
     │              │              │              │              │
     ▼              ▼              ▼              ▼              ▼
┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐
│ Trigger │    │ Docker  │    │ Unit    │    │ E2E     │    │ Canary  │
│ GitHub  │    │ Build   │    │ Tests   │    │ Tests   │    │ Release │
│ Actions │    │ Push    │    │ Lint    │    │ Smoke   │    │ Monitor │
│         │    │ to GCR  │    │ Types   │    │ Tests   │    │ Rollout │
└─────────┘    └─────────┘    └─────────┘    └─────────┘    └─────────┘
```

#### GitHub Actions Workflow

```yaml
# .github/workflows/deploy.yml
name: Deploy to Cloud Run

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

env:
  PROJECT_ID: ${{ secrets.GCP_PROJECT_ID }}
  REGION: asia-southeast2

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Set up Python
        uses: actions/setup-python@v5
        with:
          python-version: '3.11'

      - name: Install dependencies
        run: |
          cd src/chatbot_backend
          pip install -r requirements.txt
          pip install pytest pytest-asyncio

      - name: Run tests
        run: |
          cd src/chatbot_backend
          pytest tests/ -v

      - name: Set up Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Install frontend dependencies
        run: |
          cd src/chatbot_frontend
          npm ci

      - name: Lint and type check
        run: |
          cd src/chatbot_frontend
          npm run lint
          npm run type-check

  build-and-deploy:
    needs: test
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - name: Authenticate to Google Cloud
        uses: google-github-actions/auth@v2
        with:
          credentials_json: ${{ secrets.GCP_SA_KEY }}

      - name: Set up Cloud SDK
        uses: google-github-actions/setup-gcloud@v2

      - name: Configure Docker
        run: gcloud auth configure-docker ${{ env.REGION }}-docker.pkg.dev

      - name: Build and push Backend
        run: |
          docker build -t ${{ env.REGION }}-docker.pkg.dev/${{ env.PROJECT_ID }}/chatbot/backend:${{ github.sha }} \
            -f src/chatbot_backend/Dockerfile src/chatbot_backend
          docker push ${{ env.REGION }}-docker.pkg.dev/${{ env.PROJECT_ID }}/chatbot/backend:${{ github.sha }}

      - name: Build and push Frontend
        run: |
          docker build -t ${{ env.REGION }}-docker.pkg.dev/${{ env.PROJECT_ID }}/chatbot/frontend:${{ github.sha }} \
            -f src/chatbot_frontend/Dockerfile src/chatbot_frontend
          docker push ${{ env.REGION }}-docker.pkg.dev/${{ env.PROJECT_ID }}/chatbot/frontend:${{ github.sha }}

      - name: Deploy Backend to Cloud Run
        run: |
          gcloud run deploy chatbot-backend \
            --image ${{ env.REGION }}-docker.pkg.dev/${{ env.PROJECT_ID }}/chatbot/backend:${{ github.sha }} \
            --region ${{ env.REGION }} \
            --platform managed \
            --allow-unauthenticated \
            --set-env-vars "ENVIRONMENT=production"

      - name: Deploy Frontend to Cloud Run
        run: |
          gcloud run deploy chatbot-frontend \
            --image ${{ env.REGION }}-docker.pkg.dev/${{ env.PROJECT_ID }}/chatbot/frontend:${{ github.sha }} \
            --region ${{ env.REGION }} \
            --platform managed \
            --allow-unauthenticated

  notify:
    needs: build-and-deploy
    runs-on: ubuntu-latest
    if: always()
    steps:
      - name: Notify Slack
        uses: 8398a7/action-slack@v3
        with:
          status: ${{ job.status }}
          fields: repo,message,commit,author,action,eventName,ref,workflow
        env:
          SLACK_WEBHOOK_URL: ${{ secrets.SLACK_WEBHOOK }}
```

---

## 5. Key Technical Challenges

### 5.1 Challenge 1: Context Management in Long Conversations

#### Problem
As conversations grow longer, the context window fills up, increasing costs and potentially exceeding model limits. Managing relevant context while discarding outdated information is crucial.

#### Trade-offs

| Approach | Pros | Cons |
|----------|------|------|
| **Full History** | Complete context, no information loss | Expensive, hits token limits |
| **Fixed Window** | Predictable costs, simple | May lose important early context |
| **Summarization** | Preserves key info, reduces tokens | Adds latency, may lose nuance |
| **Hybrid** | Best of both worlds | More complex implementation |

#### Chosen Solution: Hybrid Approach

```python
class ContextManager:
    MAX_RECENT_MESSAGES = 10
    MAX_CONTEXT_TOKENS = 4000

    async def build_context(self, session_id: str) -> List[Message]:
        # Get all messages
        all_messages = await self.get_session_messages(session_id)

        if len(all_messages) <= self.MAX_RECENT_MESSAGES:
            return all_messages

        # Split into old and recent
        old_messages = all_messages[:-self.MAX_RECENT_MESSAGES]
        recent_messages = all_messages[-self.MAX_RECENT_MESSAGES:]

        # Summarize old messages
        summary = await self._summarize_messages(old_messages)

        # Combine summary with recent
        return [
            Message(role="system", content=f"Previous context: {summary}"),
            *recent_messages
        ]

    async def _summarize_messages(self, messages: List[Message]) -> str:
        """Use a cheap model to summarize older context."""
        prompt = "Summarize this conversation in 2-3 sentences, focusing on: " \
                 "products discussed, items in cart, user preferences."

        response = await self.cheap_model.generate(
            messages=[*messages, Message(role="user", content=prompt)]
        )
        return response.text
```

### 5.2 Challenge 2: Maintaining Conversation Quality

#### Problem
AI responses must be helpful, accurate, and consistent. The chatbot must handle edge cases gracefully (out-of-stock items, invalid requests, etc.) while maintaining a natural conversation flow.

#### Trade-offs

| Approach | Pros | Cons |
|----------|------|------|
| **Strict Guardrails** | Predictable behavior | May feel robotic |
| **More Freedom** | Natural conversation | Risk of hallucination |
| **Hybrid + Validation** | Balance of both | More complex |

#### Chosen Solution: Validation Layer + Guardrails

```python
class ResponseValidator:
    """Validate and enhance AI responses before sending to user."""

    async def validate_response(
        self,
        response: str,
        tool_results: List[dict],
        context: dict
    ) -> ValidatedResponse:

        # 1. Check for hallucinated products
        mentioned_products = self._extract_product_ids(response)
        actual_products = self._get_products_from_tools(tool_results)

        if invalid := mentioned_products - actual_products:
            response = self._remove_invalid_products(response, invalid)
            logger.warning(f"Removed hallucinated products: {invalid}")

        # 2. Validate prices mentioned
        response = await self._verify_prices(response, tool_results)

        # 3. Check stock claims
        response = await self._verify_stock_claims(response, tool_results)

        # 4. Add disclaimer if needed
        if self._mentions_guarantees(response):
            response += "\n\n*Prices and availability subject to change."

        return ValidatedResponse(
            text=response,
            products=list(actual_products),
            confidence=self._calculate_confidence(response, tool_results)
        )

    def _extract_product_ids(self, text: str) -> Set[int]:
        """Extract product IDs mentioned in response."""
        pattern = r"product[_\s]?(?:id)?[:\s]?(\d+)"
        return set(int(m) for m in re.findall(pattern, text, re.I))
```

### 5.3 Challenge 3: Handling AI Failures Gracefully

#### Problem
AI services can fail due to rate limits, API outages, or timeout. The system must continue functioning and provide meaningful responses even when AI is unavailable.

#### Trade-offs

| Approach | Pros | Cons |
|----------|------|------|
| **Hard Fail** | Simple implementation | Poor UX |
| **Queue & Retry** | Eventually succeeds | User waits longer |
| **Fallback Models** | Quick recovery | Higher cost, complexity |
| **Rule-Based Fallback** | Always available | Limited functionality |

#### Chosen Solution: Multi-Layer Fallback

```python
class ResilientChatService:
    """Chat service with multiple fallback layers."""

    async def process_message(self, message: str, context: dict) -> Response:
        # Layer 1: Primary AI (Gemini Flash)
        try:
            return await self._try_gemini_flash(message, context)
        except (RateLimitError, TimeoutError) as e:
            logger.warning(f"Flash failed: {e}")

        # Layer 2: Fallback AI (Gemini Pro - higher quota)
        try:
            return await self._try_gemini_pro(message, context)
        except Exception as e:
            logger.warning(f"Pro failed: {e}")

        # Layer 3: Rule-based system
        if response := await self._try_rule_based(message, context):
            return response

        # Layer 4: Graceful degradation
        return Response(
            text="I'm having trouble right now. Here's what I can help with:\n\n"
                 "- Type 'search [product]' to find items\n"
                 "- Type 'cart' to view your cart\n"
                 "- Type 'help' for more options\n\n"
                 "Or try again in a moment.",
            fallback=True,
            suggestions=["search headphones", "view cart", "help"]
        )

    async def _try_rule_based(self, message: str, context: dict) -> Optional[Response]:
        """Pattern-based responses for common queries."""
        patterns = {
            r"(?:show|view|what'?s in)\s+(?:my\s+)?cart": self._handle_view_cart,
            r"search\s+(.+)": self._handle_search,
            r"help|what can you do": self._handle_help,
            r"categories|browse": self._handle_categories,
        }

        for pattern, handler in patterns.items():
            if match := re.search(pattern, message, re.I):
                return await handler(match, context)

        return None
```

### 5.4 Challenge 4: Real-Time Stock Consistency

#### Problem
Stock levels change frequently. The AI might recommend a product that goes out of stock between the check and the user's action, leading to frustration.

#### Trade-offs

| Approach | Pros | Cons |
|----------|------|------|
| **Check at Display** | Simple | Stale by purchase time |
| **Check at Purchase** | Accurate | Surprise failures |
| **Optimistic + Reserve** | Best UX | Complex implementation |
| **Real-time Updates** | Always accurate | Expensive infrastructure |

#### Chosen Solution: Optimistic Locking with Reservation

```python
class StockService:
    """Handle stock with optimistic locking and reservations."""

    async def add_to_cart(
        self,
        customer_id: int,
        product_id: int
    ) -> CartResult:
        async with self.db.begin():
            # Lock the product row
            product = await self.db.execute(
                select(Product)
                .where(Product.product_id == product_id)
                .with_for_update()
            ).scalar_one_or_none()

            if not product:
                raise ProductNotFoundError(product_id)

            # Check available quantity
            available = product.stock_quantity - product.reserved_quantity

            if available <= 0:
                # Check for alternatives
                alternatives = await self._find_alternatives(product)
                raise OutOfStockError(
                    product_id=product_id,
                    alternatives=alternatives
                )

            # Reserve the item
            product.reserved_quantity += 1

            # Create cart item
            cart_item = OrderItem(
                customer_id=customer_id,
                product_id=product_id,
                # No order_id yet = cart item
            )
            self.db.add(cart_item)

            # Record movement
            await self._record_movement(
                product_id=product_id,
                movement_type="RESERVED",
                quantity=1
            )

            return CartResult(
                success=True,
                item=cart_item,
                remaining_stock=available - 1
            )

    async def release_reservation(self, order_item_id: str):
        """Release stock when item removed from cart."""
        async with self.db.begin():
            item = await self.db.get(OrderItem, order_item_id)
            if item and not item.order_id:  # Still in cart
                product = await self.db.get(Product, item.product_id)
                product.reserved_quantity -= 1
                await self.db.delete(item)
```

### 5.5 Challenge 5: Cost Control at Scale

#### Problem
AI costs can escalate quickly with increased usage. Without proper controls, a viral moment or abuse could result in unexpectedly high bills.

#### Trade-offs

| Approach | Pros | Cons |
|----------|------|------|
| **No Limits** | Best UX | Unpredictable costs |
| **Hard Caps** | Predictable costs | Users blocked |
| **Soft Limits + Degradation** | Balance | Complex logic |
| **Usage-Based Pricing** | Fair | Revenue dependency |

#### Chosen Solution: Tiered Budgets with Graceful Degradation

```python
class CostController:
    """Control AI costs with tiered budgets."""

    # Daily budgets by tier (in tokens)
    TIER_BUDGETS = {
        "guest": 10_000,
        "free": 50_000,
        "premium": 200_000,
        "enterprise": float("inf")
    }

    async def check_budget(
        self,
        customer_id: Optional[int],
        estimated_tokens: int
    ) -> BudgetCheck:
        tier = await self._get_customer_tier(customer_id)
        daily_budget = self.TIER_BUDGETS[tier]

        # Get today's usage
        usage = await self._get_daily_usage(customer_id)
        remaining = daily_budget - usage

        if remaining < estimated_tokens:
            if tier == "guest":
                return BudgetCheck(
                    allowed=False,
                    reason="sign_up_required",
                    message="Sign up for free to continue chatting!"
                )
            elif tier == "free":
                return BudgetCheck(
                    allowed=False,
                    reason="upgrade_available",
                    message="You've reached today's limit. "
                            "Upgrade to Premium for unlimited chat!"
                )
            else:
                # Premium users get degraded service
                return BudgetCheck(
                    allowed=True,
                    degraded=True,
                    message="Using simplified responses to stay within budget."
                )

        return BudgetCheck(allowed=True, remaining=remaining)

    async def record_usage(
        self,
        customer_id: Optional[int],
        tokens_used: int,
        model: str
    ):
        """Record token usage for billing and analytics."""
        await self.db.execute(
            insert(TokenUsage).values(
                customer_id=customer_id,
                tokens=tokens_used,
                model=model,
                cost=self._calculate_cost(tokens_used, model),
                recorded_at=datetime.utcnow()
            )
        )
```

---

## Summary

This technical document outlines a production-ready architecture for an AI-powered e-commerce chatbot with:

1. **Robust Architecture**: Scalable microservices on GCP with clear separation of concerns
2. **Cost-Effective AI**: Google Gemini with smart model routing and token optimization
3. **Enterprise Scalability**: Support for 10K to 100K+ concurrent users
4. **Security First**: JWT authentication, PII protection, and comprehensive monitoring
5. **Resilient Design**: Multiple fallback layers and graceful degradation

The system is designed to be maintainable, observable, and cost-efficient while providing an excellent user experience.

---

*Document Version: 1.0 | Last Updated: February 2026*
