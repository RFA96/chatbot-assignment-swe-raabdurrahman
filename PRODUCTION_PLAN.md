# Production Deployment Plan

This document outlines the production architecture, scalability strategy, and cost analysis for deploying the AI-powered e-commerce chatbot on Google Cloud Platform.

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Infrastructure Components](#infrastructure-components)
3. [Deployment Configuration](#deployment-configuration)
4. [Scalability Strategy](#scalability-strategy)
5. [Google Gen AI SDK Token Management](#google-gen-ai-sdk-token-management)
6. [Security Considerations](#security-considerations)
7. [Cost Analysis](#cost-analysis)
8. [Monitoring & Observability](#monitoring--observability)

---

## Architecture Overview

### High-Level Architecture Diagram

```
                                    ┌─────────────────────────────────────────────────────────────┐
                                    │                    Google Cloud Platform                     │
                                    │                                                             │
┌──────────┐     ┌──────────────┐   │   ┌─────────────────┐       ┌─────────────────┐           │
│          │     │              │   │   │                 │       │                 │           │
│  Users   │────▶│ Cloud Load   │──────▶│  Cloud Run      │       │  Cloud Run      │           │
│          │     │  Balancer    │   │   │  (Frontend)     │       │  (Backend)      │           │
└──────────┘     └──────────────┘   │   │  Next.js 16     │──────▶│  FastAPI        │           │
                                    │   │                 │       │                 │           │
                                    │   └─────────────────┘       └────────┬────────┘           │
                                    │                                      │                     │
                                    │                                      │ VPC Connector       │
                                    │                                      ▼                     │
                                    │   ┌─────────────────┐       ┌─────────────────┐           │
                                    │   │                 │       │                 │           │
                                    │   │  Secret Manager │       │   Cloud SQL     │           │
                                    │   │  (API Keys,     │◀──────│   PostgreSQL    │           │
                                    │   │   DB Creds)     │       │                 │           │
                                    │   └─────────────────┘       └─────────────────┘           │
                                    │                                                             │
                                    │   ┌─────────────────┐       ┌─────────────────┐           │
                                    │   │  Cloud Storage  │       │  Google Gemini  │           │
                                    │   │  (Static Assets)│       │  AI API         │           │
                                    │   └─────────────────┘       └─────────────────┘           │
                                    │                                                             │
                                    └─────────────────────────────────────────────────────────────┘
```

### Service Communication Flow

1. **User Request** → Cloud Load Balancer (HTTPS termination)
2. **Frontend** → Cloud Run (Next.js SSR + static assets)
3. **API Calls** → Cloud Run (FastAPI backend)
4. **Database** → Cloud SQL PostgreSQL (via VPC connector)
5. **AI Processing** → Google Gemini API (external)

---

## Infrastructure Components

### 1. Cloud Run - Frontend Service

| Configuration | Value | Rationale |
|---------------|-------|-----------|
| **Image** | `gcr.io/{project}/chatbot-frontend:latest` | Next.js 16 production build |
| **Region** | `asia-southeast2` (Jakarta) | Located in Indonesia for lowest latency |
| **CPU** | 2 vCPU | Handles SSR and concurrent requests efficiently |
| **Memory** | 4 Gi | Comfortable headroom for Next.js SSR + caching |
| **Min Instances** | 1 | Avoid cold start for first users |
| **Max Instances** | 10 | Handle traffic spikes |
| **Concurrency** | 100 | Higher concurrency with more resources |
| **CPU Allocation** | On-request | Cost optimization |

### 2. Cloud Run - Backend Service

| Configuration | Value | Rationale |
|---------------|-------|-----------|
| **Image** | `gcr.io/{project}/chatbot-backend:latest` | FastAPI with uvicorn |
| **Region** | `asia-southeast2` (Jakarta) | Co-located with frontend |
| **CPU** | 2 vCPU | AI processing + concurrent tool calls |
| **Memory** | 4 Gi | Gemini SDK + SQLAlchemy pools + tool execution |
| **Min Instances** | 1 | Always-on for chat responsiveness |
| **Max Instances** | 20 | Handle concurrent chat sessions |
| **Concurrency** | 80 | Higher concurrency with 4GB RAM |
| **Timeout** | 300s | Long-running AI conversations |
| **VPC Connector** | Required | Private Cloud SQL access |

### 3. Cloud SQL - PostgreSQL

| Configuration | Value | Rationale |
|---------------|-------|-----------|
| **Database Version** | PostgreSQL 15 | Latest stable with JSONB support |
| **Instance Type** | `db-custom-2-4096` | 2 vCPU, 4 GB RAM |
| **Storage** | 20 GB SSD (auto-increase) | Initial size with growth |
| **Region** | `asia-southeast2` (Jakarta) | Same region as Cloud Run |
| **High Availability** | Enabled (Production) | Automatic failover |
| **Backups** | Daily, 7-day retention | Point-in-time recovery |
| **Private IP** | Enabled | Secure VPC connection |
| **Connection Pooling** | PgBouncer or Cloud SQL Proxy | Efficient connection management |

---

## Deployment Configuration

### Terraform Configuration (Cloud Run Backend)

```hcl
module "cloud_run_backend" {
  source  = "GoogleCloudPlatform/cloud-run/google//modules/v2"
  version = "~> 0.21"

  project_id   = var.project_id
  service_name = "chatbot-backend"
  location     = "asia-southeast2"

  containers = [
    {
      container_name  = "backend"
      container_image = "gcr.io/${var.project_id}/chatbot-backend:${var.image_tag}"

      ports = {
        name           = "http1"
        container_port = 8000
      }

      resources = {
        limits = {
          cpu    = "2000m"
          memory = "4Gi"
        }
        cpu_idle = true  # Scale to zero when idle
      }

      env_vars = {
        ENVIRONMENT     = "production"
        DATABASE_HOST   = "/cloudsql/${var.cloud_sql_connection_name}"
        GEMINI_MODEL    = "gemini-2.5-flash"
      }

      # Secret Manager integration
      env_vars_secrets = [
        {
          name = "DATABASE_PASSWORD"
          secret_key_ref = {
            secret  = "db-password"
            version = "latest"
          }
        },
        {
          name = "GEMINI_API_KEY"
          secret_key_ref = {
            secret  = "gemini-api-key"
            version = "latest"
          }
        }
      ]

      startup_probe = {
        http_get = {
          path = "/api/v1/health"
          port = 8000
        }
        failure_threshold     = 3
        initial_delay_seconds = 10
        timeout_seconds       = 5
      }

      liveness_probe = {
        http_get = {
          path = "/api/v1/health"
          port = 8000
        }
        period_seconds  = 30
        timeout_seconds = 5
      }
    }
  ]

  # VPC connector for Cloud SQL
  template_annotations = {
    "run.googleapis.com/vpc-access-connector" = var.vpc_connector_id
    "run.googleapis.com/vpc-access-egress"    = "private-ranges-only"
    "run.googleapis.com/cloudsql-instances"   = var.cloud_sql_connection_name
  }

  template_scaling = {
    min_instance_count = 1
    max_instance_count = 20
  }

  max_instance_request_concurrency = 40
  timeout                          = "300s"

  # IAM: Allow authenticated invocations only
  members = []  # No public access, frontend uses service account
}
```

### Cloud SQL Python Connector (Backend)

```python
# app/db/database.py
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from google.cloud.sql.connector import Connector, create_async_connector
import os

async def init_connection_pool():
    """Initialize async connection pool with Cloud SQL Connector."""
    connector = await create_async_connector()

    instance_connection_name = os.environ["CLOUD_SQL_CONNECTION_NAME"]

    engine = create_async_engine(
        "postgresql+asyncpg://",
        async_creator=lambda: connector.connect_async(
            instance_connection_name,
            "asyncpg",
            user=os.environ["DATABASE_USER"],
            password=os.environ["DATABASE_PASSWORD"],
            db=os.environ["DATABASE_NAME"],
            ip_type="private"  # Use private IP via VPC
        ),
        pool_size=5,
        max_overflow=10,
        pool_pre_ping=True,
        pool_recycle=1800,  # Recycle connections every 30 minutes
    )

    return engine, connector

# Async session factory
AsyncSessionLocal = sessionmaker(
    class_=AsyncSession,
    expire_on_commit=False
)
```

### Docker Configuration

**Frontend Dockerfile:**
```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
EXPOSE 3000
CMD ["node", "server.js"]
```

**Backend Dockerfile:**
```dockerfile
FROM python:3.11-slim
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends gcc libpq-dev
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY ./app ./app
EXPOSE 8000
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "2"]
```

---

## Scalability Strategy

### Horizontal Scaling (Cloud Run)

| Metric | Frontend | Backend |
|--------|----------|---------|
| **CPU / Memory** | 2 vCPU / 4 GB | 2 vCPU / 4 GB |
| **Min Instances** | 1 | 1 |
| **Max Instances** | 10 | 20 |
| **Concurrency** | 100 req/instance | 80 req/instance |
| **Scale Trigger** | CPU > 60% | Concurrent requests |
| **Scale-to-Zero** | Disabled (min=1) | Disabled (min=1) |
| **Cold Start** | ~2-3s | ~4-5s |

### Database Scaling (Cloud SQL)

| Stage | Configuration | When to Upgrade |
|-------|---------------|-----------------|
| **Initial** | db-custom-2-4096 (2 vCPU, 4GB) | < 100 concurrent users |
| **Growth** | db-custom-4-8192 (4 vCPU, 8GB) | 100-500 concurrent users |
| **Scale** | db-custom-8-16384 (8 vCPU, 16GB) | 500-2000 concurrent users |
| **Enterprise** | Read Replicas + db-custom-16-32768 | > 2000 concurrent users |

### Connection Pool Sizing

```
Max Connections = (Cloud Run Max Instances) × (Pool Size per Instance)
                = 20 × 5 = 100 connections

Cloud SQL Recommended: 100-150 max_connections (db-custom-2-4096)
```

### Caching Strategy (Future Enhancement)

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│ Cloud Run   │────▶│ Memorystore │────▶│ Cloud SQL   │
│ (Backend)   │     │ (Redis)     │     │ PostgreSQL  │
└─────────────┘     └─────────────┘     └─────────────┘
      │                    │
      │  Cache: Products   │
      │  Cache: Categories │
      │  Cache: Sessions   │
      └────────────────────┘
```

---

## Google Gen AI SDK Token Management

### Token Architecture Overview

The chatbot uses Google Gemini API via the `google-genai` SDK. Understanding token consumption is critical for cost management and performance optimization.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         Token Flow per Chat Request                          │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐                  │
│  │   System     │ +  │   Chat       │ +  │   User       │ = INPUT TOKENS   │
│  │   Prompt     │    │   History    │    │   Message    │                  │
│  │  (~2,000)    │    │  (variable)  │    │  (~50-200)   │                  │
│  └──────────────┘    └──────────────┘    └──────────────┘                  │
│                                                                             │
│                              ↓ Gemini API                                   │
│                                                                             │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐                  │
│  │   AI        │ +  │   Tool       │ +  │   Final      │ = OUTPUT TOKENS  │
│  │   Reasoning │    │   Calls      │    │   Response   │                  │
│  │  (~100-300) │    │  (0-5 calls) │    │  (~200-500)  │                  │
│  └──────────────┘    └──────────────┘    └──────────────┘                  │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Token Breakdown per Interaction

| Component | Tokens (Estimated) | Description |
|-----------|-------------------|-------------|
| **System Prompt** | ~2,000 | E-commerce assistant instructions, persona, tool definitions |
| **Tool Definitions** | ~1,500 | 20+ tools (search, cart, checkout, etc.) |
| **Chat History** | 100-2,000 | Previous messages in session (capped) |
| **User Message** | 50-200 | Current user input |
| **Tool Call Results** | 200-1,000 | Product data, cart contents, etc. |
| **AI Response** | 200-500 | Final text response to user |

### Estimated Token Usage per Chat Session

| Session Type | Turns | Input Tokens | Output Tokens | Total Tokens |
|--------------|-------|--------------|---------------|--------------|
| **Quick Query** (1-2 turns) | 2 | ~8,000 | ~1,000 | ~9,000 |
| **Product Search** (3-5 turns) | 4 | ~20,000 | ~3,000 | ~23,000 |
| **Full Purchase Flow** (5-10 turns) | 8 | ~45,000 | ~6,000 | ~51,000 |
| **Complex Assistance** (10+ turns) | 12 | ~80,000 | ~10,000 | ~90,000 |

### Model Selection Strategy

| Model | Use Case | Input Price | Output Price | Recommended For |
|-------|----------|-------------|--------------|-----------------|
| **Gemini 2.5 Flash** | Primary | $0.15/1M | $0.60/1M | All chat interactions, tool calling |
| **Gemini 2.5 Pro** | Complex | $1.25/1M | $10.00/1M | Product comparisons, detailed analysis, complex reasoning |

**Recommendation**: Use **Gemini 2.5 Flash** as the default model for optimal balance of cost, speed, and quality. Escalate to **Gemini 2.5 Pro** for complex multi-step reasoning or when higher accuracy is required.

#### Model Routing Logic

```python
# app/chatbot/model_router.py

class ModelRouter:
    """Route requests to appropriate Gemini model based on complexity."""

    FLASH_MODEL = "gemini-2.5-flash"
    PRO_MODEL = "gemini-2.5-pro"

    # Keywords/intents that trigger Pro model
    PRO_TRIGGERS = [
        "compare",
        "analyze",
        "recommend best",
        "detailed explanation",
        "why should i",
        "pros and cons"
    ]

    def select_model(self, user_message: str, context: dict) -> str:
        """Select model based on query complexity."""

        message_lower = user_message.lower()

        # Use Pro for complex queries
        if any(trigger in message_lower for trigger in self.PRO_TRIGGERS):
            return self.PRO_MODEL

        # Use Pro for multi-product comparisons
        if context.get("products_to_compare", 0) > 2:
            return self.PRO_MODEL

        # Use Pro for long conversation context (better reasoning)
        if context.get("turn_count", 0) > 10:
            return self.PRO_MODEL

        # Default to Flash for everything else
        return self.FLASH_MODEL
```

### Token Optimization Strategies

#### 1. System Prompt Optimization

```python
# BAD: Verbose system prompt (~4,000 tokens)
SYSTEM_PROMPT_VERBOSE = """
You are a helpful e-commerce shopping assistant. Your role is to help
customers find products, answer questions about our store, assist with
the checkout process, and provide excellent customer service. You should
always be polite, professional, and helpful. When customers ask about
products, you should use the search tools available to you...
[continues for 2000+ words]
"""

# GOOD: Concise system prompt (~1,500 tokens)
SYSTEM_PROMPT_OPTIMIZED = """
You are an e-commerce assistant for [Store Name].

CAPABILITIES:
- Search products by name, category, price range
- Manage cart (add, remove, view)
- Process checkout with saved addresses
- Apply vouchers and check stock

GUIDELINES:
- Be concise and helpful
- Always confirm before checkout
- Suggest alternatives if out of stock
- Use tools to fetch real data, never fabricate

TONE: Professional, friendly, efficient.
"""
```

**Savings**: ~500 tokens per request = ~15M tokens/month at 1K chats/day

#### 2. Chat History Management

```python
# app/chatbot/service.py

class ChatHistoryManager:
    MAX_HISTORY_TOKENS = 4000  # Cap history at 4K tokens
    MAX_MESSAGES = 10          # Keep last 10 messages

    def truncate_history(self, messages: list[dict]) -> list[dict]:
        """Truncate chat history to fit token budget."""

        # Strategy 1: Keep only recent messages
        recent_messages = messages[-self.MAX_MESSAGES:]

        # Strategy 2: Summarize older messages
        if len(messages) > self.MAX_MESSAGES:
            summary = self._summarize_old_messages(messages[:-self.MAX_MESSAGES])
            recent_messages.insert(0, {
                "role": "system",
                "content": f"Previous conversation summary: {summary}"
            })

        return recent_messages

    def _summarize_old_messages(self, messages: list[dict]) -> str:
        """Create brief summary of older messages."""
        # Use Gemini Flash-Lite for cheap summarization
        return "User searched for electronics, added headphones to cart."
```

#### 3. Tool Response Compression

```python
# app/chatbot/tool_executor.py

class ToolResponseOptimizer:
    """Compress tool outputs to reduce token usage."""

    def compress_product_list(self, products: list[dict]) -> list[dict]:
        """Return only essential product fields."""
        return [
            {
                "id": p["id"],
                "name": p["name"],
                "price": p["price"],
                "stock": p["stock_quantity"] > 0  # Boolean instead of count
            }
            for p in products[:10]  # Limit to 10 products
        ]

    def compress_cart(self, cart: dict) -> dict:
        """Return minimal cart representation."""
        return {
            "items": len(cart["items"]),
            "total": cart["total_price"],
            "products": [item["product_name"] for item in cart["items"][:5]]
        }
```

#### 4. Context Caching (Gemini Feature)

```python
# app/chatbot/service.py
from google import genai
from google.genai.types import CachedContent

class GeminiService:
    def __init__(self):
        self.client = genai.Client()
        self._setup_cached_context()

    def _setup_cached_context(self):
        """Cache static content to reduce per-request tokens."""

        # Cache system prompt + tool definitions (valid for 1 hour)
        self.cached_context = self.client.caches.create(
            model="gemini-2.5-flash",
            contents=[
                {
                    "role": "system",
                    "parts": [{"text": SYSTEM_PROMPT}]
                }
            ],
            config={
                "display_name": "ecommerce-assistant-context",
                "ttl": "3600s"  # 1 hour cache
            }
        )

    async def chat(self, user_message: str, history: list) -> str:
        """Use cached context for cheaper requests."""

        response = await self.client.aio.models.generate_content(
            model="gemini-2.5-flash",
            contents=history + [{"role": "user", "parts": [{"text": user_message}]}],
            config={
                "cached_content": self.cached_context.name
            }
        )

        return response.text
```

**Context Caching Savings**:
- System prompt cached: ~2,000 tokens saved per request
- Cached tokens billed at 75% discount
- Potential savings: 40-50% on input token costs

### Rate Limiting & Quota Management

#### API Quota Configuration

| Quota Type | Free Tier | Pay-as-you-go | Recommended Limit |
|------------|-----------|---------------|-------------------|
| **RPM** (Requests/min) | 15 | 1,000 | 500 |
| **TPM** (Tokens/min) | 1M | 4M | 2M |
| **RPD** (Requests/day) | 1,500 | Unlimited | 50,000 |

#### Rate Limiter Implementation

```python
# app/chatbot/rate_limiter.py
from datetime import datetime, timedelta
import asyncio

class TokenBucketRateLimiter:
    """Rate limiter for Gemini API calls."""

    def __init__(self):
        self.requests_per_minute = 500
        self.tokens_per_minute = 2_000_000
        self.request_bucket = self.requests_per_minute
        self.token_bucket = self.tokens_per_minute
        self.last_refill = datetime.now()

    async def acquire(self, estimated_tokens: int) -> bool:
        """Check if request can proceed within rate limits."""
        self._refill_buckets()

        if self.request_bucket < 1 or self.token_bucket < estimated_tokens:
            wait_time = 60 - (datetime.now() - self.last_refill).seconds
            await asyncio.sleep(wait_time)
            self._refill_buckets()

        self.request_bucket -= 1
        self.token_bucket -= estimated_tokens
        return True

    def _refill_buckets(self):
        now = datetime.now()
        if (now - self.last_refill) >= timedelta(minutes=1):
            self.request_bucket = self.requests_per_minute
            self.token_bucket = self.tokens_per_minute
            self.last_refill = now
```

### Token Budget by User Tier

| User Tier | Daily Token Budget | Monthly Budget | Soft Limit Action |
|-----------|-------------------|----------------|-------------------|
| **Guest** | 10,000 tokens | N/A | Prompt to sign up |
| **Free User** | 50,000 tokens | 500,000 tokens | Show upgrade prompt |
| **Premium** | 200,000 tokens | 3,000,000 tokens | Warning at 80% |
| **Enterprise** | Unlimited | Unlimited | Monitor only |

```python
# app/chatbot/token_budget.py

class TokenBudgetManager:
    TIER_LIMITS = {
        "guest": {"daily": 10_000, "monthly": None},
        "free": {"daily": 50_000, "monthly": 500_000},
        "premium": {"daily": 200_000, "monthly": 3_000_000},
        "enterprise": {"daily": float("inf"), "monthly": float("inf")}
    }

    async def check_budget(self, user_id: str, estimated_tokens: int) -> dict:
        """Check if user has sufficient token budget."""
        user = await self.get_user_usage(user_id)
        tier = user.get("tier", "guest")
        limits = self.TIER_LIMITS[tier]

        daily_remaining = limits["daily"] - user["daily_usage"]

        if daily_remaining < estimated_tokens:
            return {
                "allowed": False,
                "reason": "daily_limit_exceeded",
                "remaining": daily_remaining,
                "reset_in": self._time_until_reset()
            }

        return {"allowed": True, "remaining": daily_remaining}
```

### Token Usage Monitoring & Alerts

```python
# app/chatbot/token_tracker.py

class TokenUsageTracker:
    """Track and log token usage for monitoring."""

    async def log_usage(
        self,
        user_id: str,
        session_id: str,
        input_tokens: int,
        output_tokens: int,
        model: str,
        cached_tokens: int = 0
    ):
        """Log token usage to database and monitoring."""

        usage_record = {
            "timestamp": datetime.utcnow(),
            "user_id": user_id,
            "session_id": session_id,
            "model": model,
            "input_tokens": input_tokens,
            "output_tokens": output_tokens,
            "cached_tokens": cached_tokens,
            "total_tokens": input_tokens + output_tokens,
            "estimated_cost": self._calculate_cost(
                input_tokens, output_tokens, cached_tokens, model
            )
        }

        # Store in database
        await self.db.token_usage.insert_one(usage_record)

        # Send to Cloud Monitoring
        await self._emit_metrics(usage_record)

    def _calculate_cost(
        self,
        input_tokens: int,
        output_tokens: int,
        cached_tokens: int,
        model: str
    ) -> float:
        """Calculate estimated cost in USD."""
        PRICING = {
            "gemini-2.5-flash": {"input": 0.15, "output": 0.60, "cached": 0.0375},
            "gemini-2.5-pro": {"input": 1.25, "output": 10.00, "cached": 0.3125}
        }

        rates = PRICING.get(model, PRICING["gemini-2.5-flash"])

        return (
            ((input_tokens - cached_tokens) / 1_000_000) * rates["input"] +
            (cached_tokens / 1_000_000) * rates["cached"] +
            (output_tokens / 1_000_000) * rates["output"]
        )
```

### Monthly Token Projection

| Traffic Level | Daily Chats | Avg Tokens/Chat | Monthly Tokens | Monthly Cost (Flash) | Monthly Cost (Mixed)* |
|---------------|-------------|-----------------|----------------|---------------------|----------------------|
| **Low** | 500 | 15,000 | 225M | ~$47 | ~$56 |
| **Medium** | 2,000 | 20,000 | 1.2B | ~$252 | ~$302 |
| **High** | 5,000 | 25,000 | 3.75B | ~$788 | ~$945 |
| **Very High** | 10,000 | 30,000 | 9B | ~$1,890 | ~$2,268 |

*Assumes 70% input tokens, 30% output tokens with Gemini 2.5 Flash pricing ($0.15/1M input, $0.60/1M output)*

**Mixed pricing assumes 90% Flash + 10% Pro for complex queries*

### Token Optimization Checklist

- [ ] System prompt optimized to < 2,000 tokens
- [ ] Chat history capped at 10 messages or 4,000 tokens
- [ ] Tool responses compressed (essential fields only)
- [ ] Context caching enabled for static content
- [ ] Rate limiter implemented (500 RPM, 2M TPM)
- [ ] User tier token budgets enforced
- [ ] Token usage logged to Cloud Monitoring
- [ ] Budget alerts configured at 80% threshold
- [ ] Model routing implemented (Flash default, Pro for complex)
- [ ] Weekly token usage reports automated

---

## Security Considerations

### Network Security

1. **VPC Connector**: Cloud Run → Cloud SQL via private network
2. **No Public IP**: Cloud SQL accessible only via VPC
3. **IAM Authentication**: Service accounts for inter-service communication
4. **Secret Manager**: All credentials stored securely

### Application Security

1. **HTTPS Only**: TLS termination at load balancer
2. **CORS Configuration**: Whitelist production domains only
3. **Rate Limiting**: 100 requests/minute per user (configurable)
4. **Input Validation**: Pydantic schemas on all endpoints
5. **SQL Injection Prevention**: SQLAlchemy ORM with parameterized queries

### Authentication Flow

```
User → Frontend → Backend (JWT Validation) → Cloud SQL
         │
         └── JWT signed with RS256, 24h expiry
             Refresh token: 7 days, stored in HttpOnly cookie
```

---

## Cost Analysis

### Monthly Cost Estimate (Production)

#### Cloud Run - Frontend

| Item | Calculation | Monthly Cost |
|------|-------------|--------------|
| **vCPU** | 2 vCPU × 730 hrs × $0.000024/vCPU-sec | ~$126 |
| **Memory** | 4 GB × 730 hrs × $0.0000025/GB-sec | ~$26 |
| **Requests** | 1M requests × $0.40/million | $0.40 |
| **Networking** | 50 GB egress × $0.12/GB | $6 |
| **Subtotal** | | **~$158/month** |

#### Cloud Run - Backend

| Item | Calculation | Monthly Cost |
|------|-------------|--------------|
| **vCPU** | 2 vCPU × 730 hrs × $0.000024/vCPU-sec | ~$126 |
| **Memory** | 4 GB × 730 hrs × $0.0000025/GB-sec | ~$26 |
| **Requests** | 500K requests × $0.40/million | $0.20 |
| **Networking** | 20 GB egress × $0.12/GB | $2.40 |
| **Subtotal** | | **~$155/month** |

#### Cloud SQL - PostgreSQL

| Item | Specification | Monthly Cost |
|------|---------------|--------------|
| **Instance** | db-custom-2-4096 (2 vCPU, 4GB) | ~$97 |
| **Storage** | 20 GB SSD | ~$3.40 |
| **Backups** | 20 GB (7 days retention) | ~$1.60 |
| **HA Standby** | Regional (optional) | +$97 |
| **Subtotal (No HA)** | | **~$102/month** |
| **Subtotal (With HA)** | | **~$199/month** |

#### Google Gemini API

| Usage Tier | Input Tokens | Output Tokens | Monthly Cost |
|------------|--------------|---------------|--------------|
| **Light** (1K chats/day) | 30M tokens | 15M tokens | ~$4.50 + $9.00 = **$13.50** |
| **Medium** (5K chats/day) | 150M tokens | 75M tokens | ~$22.50 + $45.00 = **$67.50** |
| **Heavy** (20K chats/day) | 600M tokens | 300M tokens | ~$90 + $180 = **$270** |

*Pricing based on Gemini 2.5 Flash: $0.15/1M input, $0.60/1M output tokens*

> **Note**: If using Gemini 2.5 Pro for complex queries (~10% of requests), add approximately 20-30% to the above estimates.

#### Additional Services

| Service | Purpose | Monthly Cost |
|---------|---------|--------------|
| **Secret Manager** | API keys, credentials | ~$0.50 |
| **Cloud Load Balancer** | HTTPS, routing | ~$18 |
| **Cloud Armor** | WAF (optional) | ~$5 + $0.75/million requests |
| **Cloud Logging** | Log storage (50GB) | ~$25 |
| **Cloud Monitoring** | Metrics, alerts | Free tier |

### Total Monthly Cost Summary

| Scenario | Configuration | Estimated Cost |
|----------|---------------|----------------|
| **Development** | Min instances=0, no HA | **~$300/month** |
| **Staging** | Min instances=1, no HA | **~$550/month** |
| **Production (Light)** | Min instances=1, no HA, 1K chats/day | **~$600/month** |
| **Production (Medium)** | Min instances=1, HA enabled, 5K chats/day | **~$900/month** |
| **Production (Heavy)** | Scaled instances, HA, 20K chats/day | **~$1,500-2,000/month** |

*Costs include Cloud Run (FE+BE), Cloud SQL, Gemini API (2.5 Flash primary), and additional services*

### Cost Optimization Strategies

1. **CPU Allocation**: Use "CPU only during request processing" for cost savings (up to 50%)
2. **Committed Use Discounts**: 1-year commitment = 20% savings on Cloud SQL
3. **Gemini Caching**: Cache common product queries to reduce API calls
4. **Regional Deployment**: Single region deployment vs. multi-region
5. **Scale-to-Zero**: Enable for development/staging environments

---

## Monitoring & Observability

### Key Metrics to Track

| Metric | Target | Alert Threshold |
|--------|--------|-----------------|
| **API Latency (p95)** | < 500ms | > 1000ms |
| **Error Rate** | < 1% | > 5% |
| **Cloud SQL CPU** | < 70% | > 85% |
| **Cloud SQL Connections** | < 80% of max | > 90% |
| **Gemini API Errors** | < 0.1% | > 1% |
| **Chat Session Duration** | Baseline | +50% deviation |
| **Daily Token Usage** | Within budget | > 80% of daily limit |
| **Token Cost (Daily)** | < $50 | > $75 |
| **Avg Tokens/Request** | < 25,000 | > 40,000 |
| **Cache Hit Rate** | > 60% | < 40% |

### Logging Structure

```json
{
  "timestamp": "2026-02-01T10:30:00Z",
  "severity": "INFO",
  "service": "chatbot-backend",
  "trace_id": "abc123",
  "user_id": "user_456",
  "session_id": "session_789",
  "endpoint": "/api/v1/chat",
  "latency_ms": 245,
  "gemini_tokens": {
    "input": 150,
    "output": 320
  }
}
```

### Alerting Policy

| Alert | Condition | Action |
|-------|-----------|--------|
| **High Latency** | p95 > 2s for 5 min | PagerDuty notification |
| **Error Spike** | Error rate > 5% for 2 min | Slack + PagerDuty |
| **Database Full** | Storage > 80% | Email + auto-increase |
| **Instance Scaling** | Max instances reached | Email notification |
| **Budget Alert** | 80% of monthly budget | Email to finance team |
| **Token Spike** | Daily usage > 150% of average | Slack notification |
| **Gemini Rate Limit** | 429 errors > 10/min | PagerDuty + auto-throttle |
| **Token Budget Exceeded** | User tier limit reached | In-app notification |
| **Gemini API Down** | 5xx errors > 5% for 1 min | PagerDuty + fallback model |

---

## Deployment Checklist

### Pre-Deployment

- [ ] All environment variables configured in Secret Manager
- [ ] Database migrations tested on staging
- [ ] Load testing completed (target: 100 concurrent users)
- [ ] Security scan passed (OWASP ZAP)
- [ ] Backup and restore procedure tested

### Deployment Steps

1. Build and push Docker images to GCR
2. Run database migrations
3. Deploy backend Cloud Run service
4. Deploy frontend Cloud Run service
5. Configure Cloud Load Balancer
6. Update DNS records
7. Verify health checks
8. Enable monitoring alerts

### Post-Deployment

- [ ] Smoke tests passed
- [ ] Error rates within threshold
- [ ] Performance metrics baseline established
- [ ] Rollback procedure documented and tested

---

*Document Version: 1.2 | Last Updated: February 2026*
