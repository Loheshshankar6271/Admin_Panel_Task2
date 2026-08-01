# Multi-Role Admin Dashboard

A full-stack admin dashboard with role-based access control built with React, Node.js, Express, and PostgreSQL.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Vite + React, Tailwind CSS, React Router, Recharts |
| Backend | Node.js, Express.js, REST API |
| Database | PostgreSQL |
| Auth | JWT (JSON Web Tokens) + bcrypt |

## Roles & Permissions

| Feature | Super Admin | Manager | Staff |
|---------|-------------|---------|-------|
| Dashboard | ✅ | ✅ | ✅ |
| View Orders | ✅ | ✅ | ✅ |
| Edit Orders | ✅ | ✅ | ❌ |
| Delete Orders | ✅ | ❌ | ❌ |
| View Users | ✅ | ❌ | ❌ |
| Manage Users | ✅ | ❌ | ❌ |
| Reports | ✅ | ✅ | ❌ |

## Project Structure

```
admin-dashboard/
├── backend/
│   ├── src/
│   │   ├── config/db.js          # PostgreSQL connection
│   │   ├── middleware/auth.js    # JWT auth + role guard
│   │   ├── routes/
│   │   │   ├── auth.js           # /api/auth/*
│   │   │   ├── users.js          # /api/users/* (Super Admin only)
│   │   │   ├── orders.js         # /api/orders/*
│   │   │   └── dashboard.js      # /api/dashboard/summary
│   │   └── index.js              # Express entry point
│   ├── schema.sql                # DB schema + seed data
│   └── .env.example
└── frontend/
    └── src/
        ├── context/AuthContext.jsx
        ├── pages/
        │   ├── LoginPage.jsx
        │   ├── DashboardPage.jsx
        │   ├── OrdersPage.jsx
        │   ├── UsersPage.jsx
        │   ├── ReportsPage.jsx
        │   └── AccessDenied.jsx
        ├── components/layout/
        │   ├── Layout.jsx
        │   └── Sidebar.jsx
        └── utils/api.js
```

## Setup Instructions

### Prerequisites
- Node.js 18+
- PostgreSQL 14+

### 1. Database Setup

```bash
# Create database
createdb admin_dashboard

# Run schema (creates tables + seeds data)
psql -d admin_dashboard -f backend/schema.sql
```

### 2. Backend Setup

```bash
cd backend

# Create .env file
cp .env.example .env
# Edit .env with your PostgreSQL credentials

# Install dependencies
npm install

# Start server
npm start
# or for development with auto-reload:
npm run dev
```

Backend runs on **http://localhost:5000**

### 3. Frontend Setup

```bash
cd frontend

npm install
npm run dev
```

Frontend runs on **http://localhost:5173**

## Demo Accounts

All demo accounts use password: `Admin@123`

| Role | Email |
|------|-------|
| Super Admin | admin@example.com |
| Manager | manager@example.com |
| Staff | staff@example.com |

## API Endpoints

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/auth/login | Login |
| GET | /api/auth/me | Current user |
| POST | /api/auth/logout | Logout |

### Users (Super Admin only)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/users | List users (paginated) |
| POST | /api/users | Create user |
| PUT | /api/users/:id | Update user |
| DELETE | /api/users/:id | Delete user |

### Orders
| Method | Endpoint | Role Required |
|--------|----------|---------------|
| GET | /api/orders | All roles |
| GET | /api/orders/:id | All roles |
| PUT | /api/orders/:id | Manager, Super Admin |
| DELETE | /api/orders/:id | Super Admin only |

### Dashboard
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/dashboard/summary | Stats summary |

## Security Features

- JWT authentication on all protected routes
- Role-based middleware on every sensitive endpoint
- Backend validates permissions — bypassing frontend won't work
- Passwords hashed with bcrypt (cost factor 10)
- CORS restricted to frontend origin
- HTTP security headers via Helmet
