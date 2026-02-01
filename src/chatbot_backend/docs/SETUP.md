# Setup Guide

This document provides instructions for setting up the Chatbot Backend project.

## Prerequisites

- Python 3.11+
- PostgreSQL 14+
- pip (Python package manager)

## Installation

### 1. Clone and Navigate

```bash
cd chatbot_backend
```

### 2. Create Virtual Environment

```bash
python -m venv venv

# On macOS/Linux
source venv/bin/activate

# On Windows
.\venv\Scripts\activate
```

### 3. Install Dependencies

```bash
pip install -r requirements.txt
```

### 4. Configure Environment

Copy the example environment file and update with your settings:

```bash
cp .env.example .env
```

Edit `.env` with your configuration:

```env
# Database
DATABASE_URL=postgresql+asyncpg://postgres:password@localhost:5432/chatbot_db

# JWT (IMPORTANT: Change this in production!)
JWT_SECRET_KEY=your-super-secret-key-minimum-32-characters
```

### 5. Setup Database

Run the following SQL to create the database schema:

```sql
-- Create database
CREATE DATABASE chatbot_db;

-- Connect to the database and run the DDL scripts
-- (See docs/DATABASE.md for complete schema)
```

### 6. Create Test Users

Generate password hashes:

```bash
python -m app.utils.password "yourpassword"
```

Insert test customer:

```sql
INSERT INTO tbl_customers (customer_id, full_name, email, password, age, gender, created_at)
VALUES (1, 'Test Customer', 'customer@example.com', '$2b$12$...hashed...', 25, 'M', NOW());
```

Insert test admin:

```sql
INSERT INTO tbl_user_admin (user_admin_id, full_name, username, password, created_at)
VALUES ('admin-001', 'Admin User', 'admin', '$2b$12$...hashed...', NOW());
```

## Running the Application

### Development Mode

```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Or using the main module:

```bash
python -m app.main
```

### Production Mode

```bash
uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 4
```

## API Documentation

Once the application is running, access:

- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

## Project Structure

```
chatbot_backend/
├── app/
│   ├── api/
│   │   ├── v1/
│   │   │   ├── endpoints/
│   │   │   │   ├── addresses.py      # Customer addresses
│   │   │   │   ├── admin_auth.py     # Admin authentication
│   │   │   │   ├── cart.py           # Shopping cart
│   │   │   │   ├── categories.py     # Product categories
│   │   │   │   ├── customer_auth.py  # Customer authentication
│   │   │   │   ├── health.py         # Health check
│   │   │   │   ├── orders.py         # Orders & vouchers
│   │   │   │   └── products.py       # Products
│   │   │   └── router.py
│   │   └── deps.py
│   ├── core/
│   │   ├── config.py
│   │   ├── exceptions.py
│   │   └── security.py
│   ├── db/
│   │   └── database.py
│   ├── models/
│   │   ├── address.py
│   │   ├── admin.py
│   │   ├── customer.py
│   │   ├── order.py
│   │   ├── product.py
│   │   └── voucher.py
│   ├── schemas/
│   │   ├── address.py
│   │   ├── auth.py
│   │   ├── cart.py
│   │   ├── order.py
│   │   ├── product.py
│   │   └── voucher.py
│   ├── services/
│   │   ├── address_service.py
│   │   ├── admin_auth_service.py
│   │   ├── cart_service.py
│   │   ├── customer_auth_service.py
│   │   ├── order_service.py
│   │   └── product_service.py
│   ├── utils/
│   │   ├── password.py
│   │   └── response_utils.py
│   └── main.py
├── docs/
│   ├── API.md
│   ├── DATABASE.md
│   └── SETUP.md
├── .env
├── .env.example
└── requirements.txt
```

## Troubleshooting

### Database Connection Issues

1. Ensure PostgreSQL is running
2. Verify connection string in `.env`
3. Check if the database exists
4. Verify user permissions

### JWT Token Issues

1. Ensure `JWT_SECRET_KEY` is at least 32 characters
2. Check token expiration settings
3. Verify token is included in Authorization header

### Import Errors

1. Ensure virtual environment is activated
2. Reinstall dependencies: `pip install -r requirements.txt`
3. Verify Python version: `python --version`
