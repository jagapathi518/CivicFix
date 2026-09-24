# 🏛️ CivicFix

![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Node.js](https://img.shields.io/badge/Node.js-43853D?style=for-the-badge&logo=node.js&logoColor=white)
![Express.js](https://img.shields.io/badge/Express.js-404D59?style=for-the-badge)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white)

**Unified Public Complaint & Infrastructure Issue Management Platform**

> "Report it. Track it. Fix it."

CivicFix is a citizen-powered platform where people can report public infrastructure problems, track their resolution, and verify fixes. It connects citizens with government departments responsible for maintaining roads, hospitals, schools, water systems, and other public services.

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** 18+
- **PostgreSQL** database (Supabase free tier recommended)

### 1. Database Setup

1. Create a free project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor** and run the schema:
   ```
   Copy the contents of server/src/db/schema.sql and execute it
   ```
3. Copy your database connection string from **Settings > Database > Connection string (URI)**

### 2. Backend Setup

```bash
cd server

# Configure environment
cp .env.example .env
# Edit .env and set your DATABASE_URL

# Install dependencies
npm install

# Seed demo data
npm run seed

# Start server
npm run dev
```

The API server will start at `http://localhost:5000`

### 3. Frontend Setup

```bash
cd client

# Install dependencies
npm install

# Start dev server
npm run dev
```

The frontend will start at `http://localhost:5173`

---

## 📋 Demo Accounts

| Role | Email | Password |
|------|-------|----------|
| Citizen | citizen@example.com | password123 |
| Admin | admin@example.com | password123 |
| Worker | worker@example.com | password123 |
| Super Admin | superadmin@example.com | password123 |

> ⚠️ These are development-only credentials. Change them in production.

---

## 🏗️ Architecture

```text
civicFix-prjct/
├── client/                 # React + Vite frontend
│   └── src/
│       ├── components/     # Reusable UI components
│       ├── contexts/       # Auth context
│       ├── layouts/        # Dashboard layout
│       ├── pages/          # Route pages
│       │   ├── admin/      # Admin pages
│       │   ├── citizen/    # Citizen pages
│       │   └── worker/     # Worker pages
│       └── services/       # API client
├── server/                 # Node.js + Express backend
│   └── src/
│       ├── config/         # Database config
│       ├── controllers/    # Route handlers
│       ├── db/             # Schema + seed
│       ├── middleware/     # Auth, error handler, uploads
│       └── routes/         # API routes
```

## 🔑 Features

### Phase 1 ✅ (Current)
- JWT Authentication with role-based access
- Multi-step complaint creation with image upload
- Citizen dashboard with stats
- Admin dashboard with filters
- Worker dashboard with assignments
- Public complaint tracking
- Status timeline
- Comments system
- SLA tracking

### Phase 2+ (Upcoming)
- AI complaint categorization
- Analytics charts
- Notification system UI
- Department/user management UI
- Audit log viewer

---

## 🔒 Security

- JWT tokens with expiration
- Role-based route guards (frontend + backend)
- Password hashing with bcrypt (12 rounds)
- File type/size validation
- Parameterized SQL queries (no injection)
- CORS configured
- Environment variables for secrets
