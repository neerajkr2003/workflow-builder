# Auth Module — API Documentation

Base URL: `http://localhost:5000/api/v1`

All responses follow this envelope:

```json
{
  "success": true | false,
  "message": "Human-readable message",
  "data": { ... },
  "errors": { "field": ["message"] }
}
```

---

## Public Endpoints

### POST `/auth/register`
Register a new user account. Sends a 6-digit OTP to the provided email.

**Body**
| Field | Type | Rules |
|-------|------|-------|
| name | string | 2–100 chars |
| email | string | valid email |
| phone | string | E.164 format, e.g. `+14155552671` |
| password | string | min 8 chars, uppercase, lowercase, digit, special char |

**201 Created**
```json
{
  "success": true,
  "message": "Registration successful. Please check your email for the OTP to verify your account.",
  "data": { "userId": "<mongoId>" }
}
```

---

### POST `/auth/verify-email`
Verify email address using the 6-digit OTP received after registration.

**Body**
| Field | Type | Rules |
|-------|------|-------|
| userId | string | required |
| otp | string | exactly 6 digits |

**200 OK**
```json
{ "success": true, "message": "Email verified successfully. Welcome aboard!" }
```

---

### POST `/auth/resend-otp`
Resend OTP. Subject to 60-second cooldown and a maximum of 5 resends per session.

**Body**
| Field | Type | Values |
|-------|------|--------|
| userId | string | required |
| purpose | string | `email_verification` \| `login` \| `password_reset` |

**200 OK**
```json
{ "success": true, "message": "OTP resent successfully. Please check your email." }
```

---

### POST `/auth/login`
Login with email and password. Requires email verification.

**Body**
| Field | Type |
|-------|------|
| email | string |
| password | string |

**200 OK**
```json
{
  "success": true,
  "message": "Login successful.",
  "data": {
    "user": {
      "id": "<mongoId>",
      "name": "John Doe",
      "email": "john.doe@example.com",
      "phone": "+14155552671",
      "role": "user",
      "isVerified": true
    },
    "tokens": {
      "accessToken": "<jwt — 15 min TTL>",
      "refreshToken": "<opaque — 7 day TTL>"
    }
  }
}
```

---

### POST `/auth/login/request-otp`
Request a one-time passwordless login OTP.

**Body**
| Field | Type |
|-------|------|
| email | string |

**200 OK** (always, to prevent email enumeration)
```json
{
  "success": true,
  "message": "If an account exists with this email, an OTP has been sent.",
  "data": { "userId": "<mongoId or undefined>" }
}
```

---

### POST `/auth/login/otp`
Login using a previously requested OTP.

**Body**
| Field | Type |
|-------|------|
| userId | string |
| otp | string (6 digits) |

**200 OK** — same shape as `/auth/login`

---

### POST `/auth/refresh-token`
Exchange a valid refresh token for a new access + refresh token pair (rotation).

**Body**
| Field | Type |
|-------|------|
| refreshToken | string |

**200 OK**
```json
{
  "success": true,
  "message": "Tokens refreshed successfully.",
  "data": {
    "tokens": {
      "accessToken": "<new jwt>",
      "refreshToken": "<new opaque>"
    }
  }
}
```

---

### POST `/auth/forgot-password`
Trigger a password reset email with a signed JWT link (15 min expiry).

**Body**
| Field | Type |
|-------|------|
| email | string |

**200 OK** (always, to prevent enumeration)
```json
{
  "success": true,
  "message": "If an account exists with this email, a password reset link has been sent."
}
```

---

### POST `/auth/reset-password`
Reset password using the token from the reset email.

**Body**
| Field | Type |
|-------|------|
| token | string |
| password | string (new, follows password rules) |
| confirmPassword | string (must match password) |

**200 OK**
```json
{
  "success": true,
  "message": "Password reset successfully. All sessions have been invalidated. Please log in again."
}
```

---

## Protected Endpoints

All protected routes require:
```
Authorization: Bearer <accessToken>
```

---

### GET `/auth/me`
Return the currently authenticated user's profile.

**200 OK**
```json
{
  "success": true,
  "message": "Profile fetched successfully.",
  "data": { "user": { ... } }
}
```

---

### POST `/auth/logout`
Revoke a specific refresh token.

**Body**
| Field | Type |
|-------|------|
| refreshToken | string (optional) |

**200 OK**
```json
{ "success": true, "message": "Logged out successfully." }
```

---

### POST `/auth/logout-all`
Revoke all refresh tokens for the current user (all devices).

**200 OK**
```json
{ "success": true, "message": "Logged out from all devices successfully." }
```

---

### GET `/auth/sessions`
List all active (non-revoked, non-expired) sessions.

**200 OK**
```json
{
  "success": true,
  "data": {
    "sessions": [
      {
        "_id": "<tokenId>",
        "deviceInfo": "Mozilla/5.0 ...",
        "ipAddress": "192.168.1.1",
        "createdAt": "2024-06-01T12:00:00.000Z",
        "expiresAt": "2024-06-08T12:00:00.000Z"
      }
    ]
  }
}
```

---

### DELETE `/auth/sessions/:tokenId`
Revoke a specific session by its ID.

**200 OK**
```json
{ "success": true, "message": "Session revoked successfully." }
```

---

### GET `/auth/login-history`
Retrieve the last 20 login events for the current user.

**200 OK**
```json
{
  "success": true,
  "data": {
    "history": [
      {
        "ipAddress": "192.168.1.1",
        "deviceInfo": "Mozilla/5.0 ...",
        "status": "success",
        "createdAt": "2024-06-01T12:00:00.000Z"
      }
    ]
  }
}
```

---

## Role-Based Routes

### GET `/admin/dashboard`
Requires role: `admin` or `super_admin`

### GET `/super-admin/settings`
Requires role: `super_admin`

---

## Error Codes

| Code | Meaning |
|------|---------|
| 400 | Bad request / invalid OTP / expired token |
| 401 | Unauthenticated / invalid or expired access token |
| 403 | Forbidden / email not verified / account inactive |
| 404 | Resource not found |
| 409 | Conflict / email or phone already exists |
| 422 | Validation error |
| 423 | Account locked due to too many failed login attempts |
| 429 | Rate limit exceeded |
| 500 | Internal server error |

---

## Security Notes

- Passwords are hashed with `bcrypt` (12 salt rounds)
- Access tokens: JWT, 15-minute TTL
- Refresh tokens: opaque random hex, 7-day TTL, stored in MongoDB
- Refresh token rotation: each refresh issues a new pair and revokes the old one
- Account lockout: after 5 failed login attempts, locked for 30 minutes
- OTP: 6 digits, 5-minute TTL, max 3 verification attempts, max 5 resends
- Password reset tokens: JWT, 15-minute TTL, single-use
- All sensitive fields excluded from API responses (`password`, `__v`)
- Login history auto-expires after 90 days (MongoDB TTL index)
