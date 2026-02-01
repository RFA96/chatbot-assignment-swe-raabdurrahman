# E-Commerce AI Chatbot

An intelligent e-commerce shopping assistant powered by Google Gemini AI. This full-stack application provides conversational product discovery, cart management, and checkout assistance through natural language interactions.

---

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Prerequisites](#prerequisites)
- [Setup Instructions](#setup-instructions)
  - [Backend Setup](#backend-setup)
  - [Frontend Setup](#frontend-setup)
  - [Database Setup](#database-setup)
- [Environment Variables](#environment-variables)
- [Running the Application](#running-the-application)
- [Chatbot Scenarios](#chatbot-scenarios)
- [API Documentation](#api-documentation)
- [Project Structure](#project-structure)
- [Related Documentation](#related-documentation)

---

## Features

- **AI-Powered Conversations**: Natural language understanding with Google Gemini 2.5
- **Product Discovery**: Search, filter, and browse products through chat
- **Smart Recommendations**: Gift suggestions based on recipient and occasion
- **Shopping Cart Management**: Add, remove, and review cart items via conversation
- **Voucher System**: Apply and manage discount codes
- **Order Processing**: Complete checkout flow with address selection
- **Multi-Session Support**: Maintain multiple chat conversations
- **Dark/Light Theme**: User-configurable theme with system preference detection
- **Responsive Design**: Optimized for desktop and mobile devices

---

## Tech Stack

### Frontend

| Technology | Version | Purpose |
|------------|---------|---------|
| **Next.js** | 16.1.x | React framework with App Router |
| **React** | 19.x | UI library |
| **TypeScript** | 5.7.x | Type safety |
| **Tailwind CSS** | 3.4.x | Utility-first styling |
| **Zustand** | 5.x | State management with persistence |
| **Lucide React** | 0.474.x | Icon library |
| **React Markdown** | 10.x | Markdown rendering in chat |
| **Embla Carousel** | 8.5.x | Product carousels |
| **SweetAlert2** | 11.x | Alert dialogs |
| **date-fns** | 4.x | Date formatting |

### Backend

| Technology | Version | Purpose |
|------------|---------|---------|
| **FastAPI** | 0.109.x | Async web framework |
| **Python** | 3.11+ | Runtime |
| **SQLAlchemy** | 2.0.x | Async ORM |
| **asyncpg** | 0.29.x | PostgreSQL async driver |
| **Pydantic** | 2.6.x | Data validation |
| **Google GenAI SDK** | latest | Gemini AI integration |
| **python-jose** | 3.3.x | JWT authentication |
| **passlib** | 1.7.x | Password hashing |
| **Uvicorn** | 0.27.x | ASGI server |

### Database

| Technology | Purpose |
|------------|---------|
| **PostgreSQL** | Primary database |

### AI/ML

| Technology | Purpose |
|------------|---------|
| **Google Gemini 2.5 Flash** | Primary chat model |
| **Google Gemini 2.5 Pro** | Complex reasoning (optional) |

---

## Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│                 │     │                 │     │                 │
│  Next.js        │────▶│  FastAPI        │────▶│  PostgreSQL     │
│  Frontend       │     │  Backend        │     │  Database       │
│  (React 19)     │     │  (Python)       │     │                 │
│                 │     │                 │     │                 │
└─────────────────┘     └────────┬────────┘     └─────────────────┘
                                 │
                                 │
                        ┌────────▼────────┐
                        │                 │
                        │  Google Gemini  │
                        │  AI API         │
                        │                 │
                        └─────────────────┘
```

---

## Prerequisites

- **Node.js** 20.x or higher
- **Python** 3.11 or higher
- **PostgreSQL** 14 or higher
- **Google Cloud Account** with Gemini API access

---

## Setup Instructions

### Backend Setup

1. **Navigate to the backend directory**:
   ```bash
   cd src/chatbot_backend
   ```

2. **Create a virtual environment**:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

4. **Configure environment variables**:
   ```bash
   cp .env.example .env
   ```

   Edit `.env` and configure:
   ```env
   # Database
   DB_NAME=ecommerce_db
   DB_USER=postgres
   DB_PASSWORD=your_password
   DB_HOST=localhost
   DB_PORT=5432

   # JWT Secret (generate a secure key)
   JWT_SECRET_KEY=your-secure-jwt-secret-key

   # Google AI (choose one method)
   # Method 1: Google AI Studio
   GOOGLE_GENAI_USE_VERTEXAI=false
   GOOGLE_API_KEY=your-google-api-key

   # Method 2: Vertex AI
   # GOOGLE_GENAI_USE_VERTEXAI=true
   # GOOGLE_CLOUD_PROJECT=your-project-id
   # GOOGLE_CLOUD_LOCATION=asia-southeast2
   ```

5. **Run database migrations** (if applicable):
   ```bash
   # Migrations are auto-applied on startup
   ```

### Frontend Setup

1. **Navigate to the frontend directory**:
   ```bash
   cd src/chatbot_frontend
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure environment variables**:
   ```bash
   cp .env.example .env.local
   ```

   Edit `.env.local`:
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
   ```

### Database Setup

1. **Create the PostgreSQL database**:
   ```bash
   createdb ecommerce_db
   ```

2. **The backend will automatically create tables on first run**.

3. **(Optional) Seed sample data**:
   ```bash
   cd src/chatbot_backend
   python -m app.db.seed  # If seed script exists
   ```

---

## Environment Variables

### Backend (`src/chatbot_backend/.env`)

| Variable | Description | Required |
|----------|-------------|----------|
| `APP_NAME` | Application name | No |
| `DEBUG` | Enable debug mode | No |
| `HOST` | Server host | No (default: 0.0.0.0) |
| `PORT` | Server port | No (default: 8000) |
| `DB_NAME` | PostgreSQL database name | Yes |
| `DB_USER` | PostgreSQL username | Yes |
| `DB_PASSWORD` | PostgreSQL password | Yes |
| `DB_HOST` | PostgreSQL host | Yes |
| `DB_PORT` | PostgreSQL port | No (default: 5432) |
| `JWT_SECRET_KEY` | Secret key for JWT signing | Yes |
| `JWT_ALGORITHM` | JWT algorithm | No (default: HS256) |
| `GOOGLE_GENAI_USE_VERTEXAI` | Use Vertex AI instead of AI Studio | No |
| `GOOGLE_API_KEY` | Google AI Studio API key | Yes* |
| `GOOGLE_CLOUD_PROJECT` | GCP project ID (for Vertex AI) | Yes** |
| `GOOGLE_CLOUD_LOCATION` | GCP region (for Vertex AI) | Yes** |

*Required if `GOOGLE_GENAI_USE_VERTEXAI=false`
**Required if `GOOGLE_GENAI_USE_VERTEXAI=true`

### Frontend (`src/chatbot_frontend/.env.local`)

| Variable | Description | Required |
|----------|-------------|----------|
| `NEXT_PUBLIC_API_URL` | Backend API base URL | Yes |

---

## Running the Application

### Development Mode

1. **Start the backend**:
   ```bash
   cd src/chatbot_backend
   source venv/bin/activate
   uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
   ```

2. **Start the frontend** (in a new terminal):
   ```bash
   cd src/chatbot_frontend
   npm run dev
   ```

3. **Access the application**:
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8000
   - API Docs: http://localhost:8000/docs

### Production Mode

1. **Build the frontend**:
   ```bash
   cd src/chatbot_frontend
   npm run build
   npm start
   ```

2. **Run the backend with multiple workers**:
   ```bash
   cd src/chatbot_backend
   uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 4
   ```

---

## Chatbot Scenarios

The AI chatbot supports the following conversational scenarios:

### 1. Product Discovery

| Scenario | Example User Input |
|----------|-------------------|
| Search products | "Show me wireless headphones" |
| Filter by price | "Find laptops under $1000" |
| Filter by brand | "Show Nike shoes" |
| Filter by department | "Women's clothing" |
| Browse categories | "What categories do you have?" |
| View product details | "Tell me more about product #123" |

### 2. Gift Recommendations

| Scenario | Example User Input |
|----------|-------------------|
| Gift for recipient | "I need a gift for my girlfriend" |
| Gift with budget | "Birthday gift for mom under $50" |
| Gift by occasion | "Anniversary present ideas" |
| Vague requests | "Something nice for a friend" |

### 3. Stock & Availability

| Scenario | Example User Input |
|----------|-------------------|
| Check stock by ID | "Is product #456 in stock?" |
| Check stock by name | "Do you have the iPhone 15 in stock?" |
| Multiple products | "Check availability for these items" |

### 4. Shopping Cart

| Scenario | Example User Input |
|----------|-------------------|
| View cart | "What's in my cart?" |
| Add to cart | "Add this to my cart" |
| Add multiple items | "Add all these products to cart" |
| Remove from cart | "Remove the headphones from my cart" |
| Clear cart | "Empty my cart" |

### 5. Vouchers & Discounts

| Scenario | Example User Input |
|----------|-------------------|
| List vouchers | "What discounts are available?" |
| Apply voucher | "Apply code SAVE20" |
| Remove voucher | "Remove the discount" |

### 6. Checkout & Orders

| Scenario | Example User Input |
|----------|-------------------|
| View addresses | "Show my saved addresses" |
| Select address | "Ship to my home address" |
| Place order | "I want to checkout" |
| Order history | "Show my past orders" |
| Order details | "Details of order #789" |
| Track order | "Where is my order?" |

### 7. Product Comparison

| Scenario | Example User Input |
|----------|-------------------|
| Compare products | "Compare iPhone 15 and Samsung S24" |
| Side-by-side | "What's the difference between these two?" |

### 8. General Assistance

| Scenario | Example User Input |
|----------|-------------------|
| Help | "What can you help me with?" |
| Store info | "What do you sell?" |
| Return policy | "How do returns work?" |

---

## API Documentation

Once the backend is running, access the interactive API documentation:

- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

### Key Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/chat` | POST | Send chat message |
| `/api/v1/chat/sessions` | GET | List chat sessions |
| `/api/v1/products` | GET | Search products |
| `/api/v1/products/{id}` | GET | Get product details |
| `/api/v1/categories` | GET | List categories |
| `/api/v1/cart` | GET | Get cart contents |
| `/api/v1/cart` | POST | Add to cart |
| `/api/v1/orders` | POST | Create order |
| `/api/v1/auth/login` | POST | Customer login |
| `/api/v1/auth/register` | POST | Customer registration |

---

## Project Structure

```
raabdurrahman_chatbot/
├── src/
│   ├── chatbot_backend/
│   │   ├── app/
│   │   │   ├── api/v1/
│   │   │   │   ├── endpoints/      # API route handlers
│   │   │   │   ├── deps.py         # Dependencies
│   │   │   │   └── router.py       # Route aggregator
│   │   │   ├── chatbot/
│   │   │   │   ├── service.py      # Gemini integration
│   │   │   │   ├── tools.py        # Function calling tools
│   │   │   │   └── tool_executor.py
│   │   │   ├── core/
│   │   │   │   ├── config.py       # Settings
│   │   │   │   ├── security.py     # JWT handling
│   │   │   │   └── exceptions.py   # Custom exceptions
│   │   │   ├── db/
│   │   │   │   └── database.py     # DB connection
│   │   │   ├── models/             # SQLAlchemy models
│   │   │   ├── schemas/            # Pydantic schemas
│   │   │   ├── services/           # Business logic
│   │   │   └── main.py             # FastAPI app
│   │   ├── requirements.txt
│   │   └── .env.example
│   │
│   └── chatbot_frontend/
│       ├── app/                    # Next.js App Router
│       │   ├── page.tsx            # Home page
│       │   ├── chat/               # Chat page
│       │   ├── products/           # Product pages
│       │   ├── cart/               # Cart page
│       │   └── orders/             # Order pages
│       ├── components/
│       │   ├── features/           # Feature components
│       │   │   ├── chat/           # Chat widgets
│       │   │   ├── product/        # Product cards
│       │   │   └── cart/           # Cart components
│       │   ├── layout/             # Header, Footer
│       │   └── ui/                 # Base UI components
│       ├── hooks/                  # Custom React hooks
│       ├── services/               # API client layer
│       ├── stores/                 # Zustand stores
│       ├── types/                  # TypeScript types
│       ├── package.json
│       └── .env.example
│
├── docs/                           # Additional documentation
├── DESIGN_RATIONALE.md            # UX decisions & features
├── PRODUCTION_PLAN.md             # Deployment & scaling
└── README.md                      # This file
```

---

## Related Documentation

- [DESIGN_RATIONALE.md](./DESIGN_RATIONALE.md) - UX decisions and creative features
- [PRODUCTION_PLAN.md](./PRODUCTION_PLAN.md) - Architecture, scalability, and cost analysis

---

## License

This project is proprietary and confidential.

---

## Author

**Raka Admiral Abdurrahman**

*Built as part of SWE Fullstack Technical Test*
