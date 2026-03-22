# 🔐 Auth Module

> **Production-ready Authentication Backend** — Node.js · Express · TypeScript · MongoDB · JWT

A complete, secure, and scalable authentication system with email OTP, JWT access/refresh tokens, role-based access control, account lockout, session management, and login history tracking.

---

## ✨ Features

| Feature | Details |
|---------|---------|
| **Registration** | Email + phone + password, OTP email verification |
| **Login** | Email/password or passwordless OTP login |
| **JWT Tokens** | 15-min access token + 7-day refresh token with rotation |
| **OTP System** | 6-digit, 5-min expiry, 3 attempt limit, 5 resend limit, 60s cooldown |
| **Forgot Password** | Signed JWT reset link emailed, 15-min expiry |
| **Account Lockout** | Locked after 5 failed attempts, auto-unlocks after 30 min |
| **Session Management** | View and revoke individual sessions per device |
| **Login History** | Last 20 events with IP, device, status; auto-expires in 90 days |
| **RBAC** | `user`, `admin`, `super_admin` roles with middleware guards |
| **Security** | bcrypt hashing, Helmet, CORS, rate limiting, input validation (Zod) |

---

## 🏗 Project Structure

```
src/
├── config/
│   ├── index.ts          # All config via environment variables
│   └── database.ts       # Mongoose connection with graceful reconnect
├── controllers/
│   └── auth.controller.ts
├── middlewares/
│   ├── auth.middleware.ts       # JWT verify
│   ├── role.middleware.ts       # RBAC
│   ├── validate.middleware.ts   # Zod validation
│   ├── rateLimiter.middleware.ts
│   └── error.middleware.ts      # Global error handler + 404
├── models/
│   ├── User.ts
│   ├── Otp.ts
│   ├── RefreshToken.ts
│   └── LoginHistory.ts
├── routes/
│   ├── index.ts
│   └── auth.routes.ts
├── services/
│   ├── auth.service.ts   # Core business logic
│   ├── jwt.service.ts    # Token generation/validation
│   ├── otp.service.ts    # OTP creation/verification
│   └── email.service.ts  # Nodemailer templates
├── types/
│   └── index.ts          # All TypeScript interfaces & enums
├── utils/
│   ├── AppError.ts       # Custom error class
│   ├── response.ts       # Centralized API responses
│   └── asyncHandler.ts   # Async route wrapper
├── validations/
│   └── auth.validation.ts  # Zod schemas
├── app.ts                # Express app factory
└── server.ts             # Entry point + graceful shutdown
docs/
├── API.md                    # Full API reference
└── postman_collection.json   # Ready-to-import Postman collection
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- MongoDB 6+ (local or Atlas)
- A Gmail account (or any SMTP) for sending emails

### Installation

```bash
# Clone or unzip the project
cd auth-module

# Install dependencies
npm install

# Copy and edit environment variables
cp .env.example .env
# → Edit .env with your MongoDB URI, JWT secrets, and SMTP credentials
```

### Running the Server

```bash
# Development (hot reload)
npm run dev

# Production build
npm run build
npm start
```

The server starts at `http://localhost:5000`.

---

## ⚙️ Environment Variables

Copy `.env.example` to `.env` and fill in:

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | `5000` |
| `MONGO_URI` | MongoDB connection string | `mongodb://localhost:27017/auth_module` |
| `JWT_ACCESS_SECRET` | Secret for access tokens | *(required)* |
| `JWT_REFRESH_SECRET` | Secret for refresh tokens | *(required)* |
| `RESET_PASSWORD_SECRET` | Secret for reset tokens | *(required)* |
| `SMTP_HOST` | SMTP server host | `smtp.gmail.com` |
| `SMTP_USER` | SMTP email address | *(required for emails)* |
| `SMTP_PASS` | SMTP password / app password | *(required for emails)* |
| `CLIENT_URL` | Frontend URL (for reset link) | `http://localhost:3000` |

> **Dev tip:** In development, if `SMTP_USER` is empty, emails are printed to the console — no SMTP config needed to test.

---

## 📋 API Overview

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| POST | `/api/v1/auth/register` | ❌ | Register user |
| POST | `/api/v1/auth/verify-email` | ❌ | Verify email with OTP |
| POST | `/api/v1/auth/resend-otp` | ❌ | Resend OTP |
| POST | `/api/v1/auth/login` | ❌ | Login with password |
| POST | `/api/v1/auth/login/request-otp` | ❌ | Request login OTP |
| POST | `/api/v1/auth/login/otp` | ❌ | Login with OTP |
| POST | `/api/v1/auth/refresh-token` | ❌ | Rotate tokens |
| POST | `/api/v1/auth/forgot-password` | ❌ | Send reset email |
| POST | `/api/v1/auth/reset-password` | ❌ | Reset password |
| GET | `/api/v1/auth/me` | ✅ | Get profile |
| POST | `/api/v1/auth/logout` | ✅ | Logout (revoke token) |
| POST | `/api/v1/auth/logout-all` | ✅ | Logout all devices |
| GET | `/api/v1/auth/sessions` | ✅ | List active sessions |
| DELETE | `/api/v1/auth/sessions/:id` | ✅ | Revoke session |
| GET | `/api/v1/auth/login-history` | ✅ | Login history |
| GET | `/api/v1/admin/dashboard` | ✅ Admin | RBAC demo |
| GET | `/api/v1/super-admin/settings` | ✅ Super Admin | RBAC demo |
| GET | `/api/v1/health` | ❌ | Health check |

See [`docs/API.md`](./docs/API.md) for full request/response documentation.

---

## 🔬 Testing with Postman

1. Import `docs/postman_collection.json` into Postman
2. Collection variables are pre-set: `baseUrl`, `accessToken`, `refreshToken`, `userId`
3. Test scripts auto-save tokens after login — just run **Register → Verify Email → Login** in order

---

## 🔒 Security Architecture

```
Request → Rate Limiter → Helmet/CORS → Route
         → Zod Validation → Auth Middleware (JWT)
         → Role Middleware → Controller
         → Service (business logic)
         → Model (MongoDB)
         → Centralized Error Handler
```

### Token Flow

```
Login → [accessToken (JWT, 15m)] + [refreshToken (opaque, 7d)]
  ↓
Access token expires →
  POST /refresh-token → revoke old refresh → issue new pair (rotation)
  ↓
Logout → revoke refresh token in DB
```

### Account Protection

- Passwords hashed with bcrypt (12 rounds)
- 5 failed logins → 30-minute lock (auto-unlock)
- OTP: max 3 attempts, max 5 resends, 60s cooldown between resends
- Refresh token rotation: compromised tokens auto-invalidated on next use
- Password change → all sessions revoked

---

## 🧩 Extending the Module

### Add a new protected route

```typescript
import { authenticate } from '../middlewares/auth.middleware';
import { authorize } from '../middlewares/role.middleware';
import { UserRole } from '../types';

router.get(
  '/billing',
  authenticate,
  authorize(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  billingController.getDashboard
);
```

### Add a new role

1. Add to `UserRole` enum in `src/types/index.ts`
2. Update the Mongoose enum in `src/models/User.ts`
3. Use `authorize(UserRole.YOUR_ROLE)` in routes

---

## 📦 Tech Stack

| Package | Purpose |
|---------|---------|
| `express` | HTTP server |
| `mongoose` | MongoDB ODM |
| `jsonwebtoken` | JWT signing/verification |
| `bcryptjs` | Password hashing |
| `nodemailer` | Email delivery |
| `zod` | Runtime input validation |
| `helmet` | Security HTTP headers |
| `cors` | Cross-origin resource sharing |
| `express-rate-limit` | Rate limiting |
| `dotenv` | Environment variable loading |
| `typescript` | Type safety |

---

## 📄 License

MIT © Auth Module
