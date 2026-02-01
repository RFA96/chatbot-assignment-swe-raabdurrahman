# Database Documentation

This document describes the database schema for the authentication system.

## Entity Relationship Diagram

```
┌─────────────────────┐       ┌─────────────────────────┐
│    tbl_customers    │       │   tbl_customer_session  │
├─────────────────────┤       ├─────────────────────────┤
│ customer_id (PK)    │──────<│ session_id (PK)         │
│ full_name           │       │ customer_id (FK)        │
│ email (UNIQUE)      │       │ token                   │
│ password            │       │ ip_address              │
│ age                 │       │ user_agent              │
│ gender              │       │ expires_at              │
│ created_by          │       │ created_at              │
│ created_at          │       │ updated_at              │
│ updated_by          │       └─────────────────────────┘
│ updated_at          │
└─────────────────────┘

┌─────────────────────┐       ┌─────────────────────────┐
│   tbl_user_admin    │       │    tbl_admin_session    │
├─────────────────────┤       ├─────────────────────────┤
│ user_admin_id (PK)  │──────<│ session_id (PK)         │
│ full_name           │       │ user_admin_id (FK)      │
│ username (UNIQUE)   │       │ token                   │
│ password            │       │ ip_address              │
│ created_by          │       │ user_agent              │
│ created_at          │       │ expires_at              │
│ updated_by          │       │ created_at              │
│ updated_at          │       │ updated_at              │
└─────────────────────┘       └─────────────────────────┘
```

## Tables

### tbl_customers

Stores customer account information.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| customer_id | INTEGER | PRIMARY KEY | Unique customer identifier |
| full_name | VARCHAR(255) | NULLABLE | Customer's full name |
| email | VARCHAR(255) | UNIQUE, INDEXED | Customer's email address |
| password | VARCHAR(255) | NULLABLE | Bcrypt encrypted password |
| age | INTEGER | NULLABLE | Customer's age |
| gender | VARCHAR(1) | NULLABLE | M for male, F for female |
| created_by | VARCHAR(128) | NULLABLE | Creator identifier |
| created_at | TIMESTAMP | NULLABLE | Creation timestamp |
| updated_by | VARCHAR(128) | NULLABLE | Last updater identifier |
| updated_at | TIMESTAMP | NULLABLE | Last update timestamp |

### tbl_customer_session

Stores active customer sessions.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| session_id | VARCHAR(128) | PRIMARY KEY | Unique session identifier (UUID) |
| customer_id | INTEGER | FOREIGN KEY, NOT NULL | Reference to customer |
| token | VARCHAR(512) | NOT NULL, INDEXED | JWT access token |
| ip_address | VARCHAR(45) | NULLABLE | Client IP address |
| user_agent | VARCHAR(512) | NULLABLE | Client user agent |
| expires_at | TIMESTAMP | NOT NULL, INDEXED | Session expiration time |
| created_at | TIMESTAMP | NULLABLE | Session creation time |
| updated_at | TIMESTAMP | NULLABLE | Last update time |

### tbl_user_admin

Stores admin user account information.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| user_admin_id | VARCHAR(60) | PRIMARY KEY | Unique admin identifier |
| full_name | VARCHAR(255) | NULLABLE | Admin's full name |
| username | VARCHAR(128) | UNIQUE, INDEXED | Admin's username |
| password | VARCHAR(128) | NULLABLE | Bcrypt encrypted password |
| created_by | VARCHAR(128) | NULLABLE | Creator identifier |
| created_at | TIMESTAMP | NULLABLE | Creation timestamp |
| updated_by | VARCHAR(128) | NULLABLE | Last updater identifier |
| updated_at | TIMESTAMP | NULLABLE | Last update timestamp |

### tbl_admin_session

Stores active admin sessions.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| session_id | VARCHAR(128) | PRIMARY KEY | Unique session identifier (UUID) |
| user_admin_id | VARCHAR(60) | FOREIGN KEY, NOT NULL | Reference to admin |
| token | VARCHAR(512) | NOT NULL, INDEXED | JWT access token |
| ip_address | VARCHAR(45) | NULLABLE | Client IP address |
| user_agent | VARCHAR(512) | NULLABLE | Client user agent |
| expires_at | TIMESTAMP | NOT NULL, INDEXED | Session expiration time |
| created_at | TIMESTAMP | NULLABLE | Session creation time |
| updated_at | TIMESTAMP | NULLABLE | Last update time |

## DDL Scripts

### Create Tables

```sql
-- Customer table
CREATE TABLE public.tbl_customers
(
    customer_id INTEGER NOT NULL
        CONSTRAINT tbl_customers_pk PRIMARY KEY,
    full_name   VARCHAR(255),
    email       VARCHAR(255),
    password    VARCHAR(255),
    age         INTEGER,
    gender      VARCHAR(1),
    created_by  VARCHAR(128),
    created_at  TIMESTAMP,
    updated_by  VARCHAR(128),
    updated_at  TIMESTAMP
);

COMMENT ON COLUMN public.tbl_customers.password IS 'Bcrypt encrypted';
COMMENT ON COLUMN public.tbl_customers.gender IS 'M for male, F for female';

CREATE UNIQUE INDEX tbl_customers_email_idx ON public.tbl_customers (email);

-- Customer session table
CREATE TABLE public.tbl_customer_session
(
    session_id  VARCHAR(128) NOT NULL
        CONSTRAINT tbl_customer_session_pk PRIMARY KEY,
    customer_id INTEGER NOT NULL
        CONSTRAINT tbl_customer_session_customer_fk
            REFERENCES public.tbl_customers ON DELETE CASCADE,
    token       VARCHAR(512) NOT NULL,
    ip_address  VARCHAR(45),
    user_agent  VARCHAR(512),
    expires_at  TIMESTAMP NOT NULL,
    created_at  TIMESTAMP,
    updated_at  TIMESTAMP
);

CREATE INDEX tbl_customer_session_token_idx ON public.tbl_customer_session (token);
CREATE INDEX tbl_customer_session_expires_idx ON public.tbl_customer_session (expires_at);

-- Admin user table
CREATE TABLE public.tbl_user_admin
(
    user_admin_id VARCHAR(60) NOT NULL
        CONSTRAINT tbl_user_admin_pk PRIMARY KEY,
    full_name     VARCHAR(255),
    username      VARCHAR(128),
    password      VARCHAR(128),
    created_by    VARCHAR(128),
    created_at    TIMESTAMP,
    updated_by    VARCHAR(128),
    updated_at    TIMESTAMP
);

CREATE UNIQUE INDEX tbl_user_admin_username_idx ON public.tbl_user_admin (username);

-- Admin session table
CREATE TABLE public.tbl_admin_session
(
    session_id    VARCHAR(128) NOT NULL
        CONSTRAINT tbl_admin_session_pk PRIMARY KEY,
    user_admin_id VARCHAR(60) NOT NULL
        CONSTRAINT tbl_admin_session_admin_fk
            REFERENCES public.tbl_user_admin ON DELETE CASCADE,
    token         VARCHAR(512) NOT NULL,
    ip_address    VARCHAR(45),
    user_agent    VARCHAR(512),
    expires_at    TIMESTAMP NOT NULL,
    created_at    TIMESTAMP,
    updated_at    TIMESTAMP
);

CREATE INDEX tbl_admin_session_token_idx ON public.tbl_admin_session (token);
CREATE INDEX tbl_admin_session_expires_idx ON public.tbl_admin_session (expires_at);
```

## Session Management

### Session Lifecycle

1. **Creation**: Session is created upon successful login
2. **Validation**: Token is validated on each protected request
3. **Expiration**: Sessions automatically expire after configured time
4. **Termination**: Sessions are deleted on logout or cascade deletion

### Cleanup

Expired sessions can be cleaned up using the `cleanup_expired_sessions()` method:

```python
from app.services.customer_auth_service import CustomerAuthService

service = CustomerAuthService(db)
removed_count = await service.cleanup_expired_sessions()
```

Consider setting up a scheduled task to periodically clean expired sessions.

## Security Considerations

1. **Password Hashing**: All passwords are hashed using bcrypt with configurable rounds
2. **Token Storage**: JWT tokens are stored in session tables for validation and revocation
3. **Cascade Deletion**: Sessions are automatically deleted when users are deleted
4. **IP Tracking**: Client IP addresses are logged for security auditing
5. **User Agent Logging**: User agents are stored for session identification
