# Chatbot Backend

A production-ready FastAPI backend with JWT authentication for both customer and admin users.

## Features

- JWT-based authentication
- Separate authentication flows for customers and admins
- Session management with database persistence
- Bcrypt password hashing
- Async PostgreSQL support
- Comprehensive API documentation
- Unit tests included

## Quick Start

### 1. Install Dependencies

```bash
python -m venv venv
source venv/bin/activate  # On Windows: .\venv\Scripts\activate
pip install -r requirements.txt
```

### 2. Configure Environment

```bash
cp .env.example .env
# Edit .env with your database credentials and JWT secret
```

### 3. Setup Database

Run the DDL scripts from `docs/DATABASE.md` to create the required tables.

### 4. Run the Application

```bash
uvicorn app.main:app --reload
```

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/health` | GET | Health check |
| `/api/v1/customer/auth/login` | POST | Customer login |
| `/api/v1/customer/auth/me` | GET | Get customer profile |
| `/api/v1/customer/auth/logout` | POST | Customer logout |
| `/api/v1/admin/auth/login` | POST | Admin login |
| `/api/v1/admin/auth/me` | GET | Get admin profile |
| `/api/v1/admin/auth/logout` | POST | Admin logout |

## Documentation

- **API Docs**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc
- [API Documentation](docs/API.md)
- [Setup Guide](docs/SETUP.md)
- [Database Schema](docs/DATABASE.md)

## Testing

```bash
pip install aiosqlite
pytest
```

## Project Structure

```
chatbot_backend/
├── app/
│   ├── api/           # API routes and dependencies
│   ├── core/          # Configuration and security
│   ├── db/            # Database connection
│   ├── models/        # SQLAlchemy models
│   ├── schemas/       # Pydantic schemas
│   ├── services/      # Business logic
│   └── main.py        # Application entry point
├── docs/              # Documentation
├── tests/             # Unit tests
└── requirements.txt
```

## License

MIT
