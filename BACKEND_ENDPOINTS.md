# Backend Endpoints Specification

## Authentication Endpoints

### POST /auth/login

**Description:** Authenticate user with email/login and password

**Request:**

```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response (200 OK):**

```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",
  "forcePasswordChange": false,
  "user": {
    "id": "uuid",
    "name": "User Name",
    "email": "user@example.com",
    "profile": "user", // or "admin"
    "loginType": "password", // or "magic_link"
    "forcePasswordChange": false
  }
}
```

**Error (401, 400, etc.):**

```json
{
  "message": "Invalid credentials",
  "error": "INVALID_CREDENTIALS"
}
```

---

### POST /auth/change-password

**Description:** Change password for logged-in user (only for users with loginType="password")

**Requirements:**

- User must be authenticated (Bearer token required)
- User's loginType must be "password" (reject if "magic_link" or other)
- Current password must be correct
- New password must meet complexity requirements
- Triggers forcePasswordChange=false if it was true

**Headers:**

```
Authorization: Bearer <accessToken>
Content-Type: application/json
```

**Request:**

```json
{
  "currentPassword": "oldPassword123",
  "newPassword": "newPassword456"
}
```

**Response (200 OK):**

```json
{
  "success": true,
  "message": "Password changed successfully"
}
```

**Errors:**

- **403 Forbidden** - User's loginType is not "password":

```json
{
  "message": "Cannot change password for non-password login types",
  "error": "INVALID_LOGIN_TYPE"
}
```

- **401 Unauthorized** - Current password is incorrect:

```json
{
  "message": "Current password is incorrect",
  "error": "INVALID_CURRENT_PASSWORD"
}
```

- **400 Bad Request** - Invalid new password:

```json
{
  "message": "Password does not meet complexity requirements",
  "error": "WEAK_PASSWORD"
}
```

- **401 Unauthorized** - Not authenticated:

```json
{
  "message": "Not authenticated",
  "error": "UNAUTHORIZED"
}
```

---

## User Management Endpoints (Admin Only)

### GET /users

**Description:** List all users (admin only)

**Headers:**

```
Authorization: Bearer <accessToken>
```

**Response (200 OK):**

```json
{
  "users": [
    {
      "id": "uuid",
      "name": "User Name",
      "email": "user@example.com",
      "profile": "user", // or "admin"
      "loginType": "password", // or "magic_link"
      "isActive": true,
      "forcePasswordChange": false,
      "createdAt": "2024-01-15T10:30:00Z",
      "updatedAt": "2024-01-15T10:30:00Z"
    }
  ]
}
```

---

### POST /users

**Description:** Create a new user (admin only)

**Headers:**

```
Authorization: Bearer <accessToken>
Content-Type: application/json
```

**Request:**

```json
{
  "name": "New User",
  "email": "newuser@example.com",
  "profileId": "admin-uuid", // or user profile UUID
  "loginType": "password", // or "magic_link"
  "password": "tempPassword123", // required if loginType="password"
  "forcePasswordChange": true // optional, defaults to false
}
```

**Response (201 Created):**

```json
{
  "user": {
    "id": "uuid",
    "name": "New User",
    "email": "newuser@example.com",
    "profile": "admin",
    "loginType": "password",
    "isActive": true,
    "forcePasswordChange": true,
    "createdAt": "2024-01-15T10:30:00Z"
  }
}
```

---

### PATCH /users/:id

**Description:** Update user details (admin only)

**Headers:**

```
Authorization: Bearer <accessToken>
Content-Type: application/json
```

**Request:**

```json
{
  "name": "Updated Name",
  "email": "updated@example.com",
  "profileId": "user-uuid",
  "isActive": true,
  "forcePasswordChange": false
}
```

**Response (200 OK):**

```json
{
  "user": {
    "id": "uuid",
    "name": "Updated Name",
    "email": "updated@example.com",
    "profile": "user",
    "isActive": true,
    "forcePasswordChange": false
  }
}
```

---

### DELETE /users/:id

**Description:** Delete a user (admin only)

**Headers:**

```
Authorization: Bearer <accessToken>
```

**Response (200 OK):**

```json
{
  "success": true,
  "message": "User deleted successfully"
}
```

---

### POST /users/:id/activate

**Description:** Activate a user (admin only)

**Headers:**

```
Authorization: Bearer <accessToken>
```

**Response (200 OK):**

```json
{
  "success": true,
  "user": {
    "id": "uuid",
    "isActive": true
  }
}
```

---

### POST /users/:id/deactivate

**Description:** Deactivate a user (admin only)

**Headers:**

```
Authorization: Bearer <accessToken>
```

**Response (200 OK):**

```json
{
  "success": true,
  "user": {
    "id": "uuid",
    "isActive": false
  }
}
```

---

### POST /users/:id/force-password-change

**Description:** Force user to change password on next login (admin only)

**Headers:**

```
Authorization: Bearer <accessToken>
```

**Response (200 OK):**

```json
{
  "success": true,
  "user": {
    "id": "uuid",
    "forcePasswordChange": true
  }
}
```

---

## Profile/Role Endpoints

### GET /profiles

**Description:** List available user profiles/roles

**Headers:**

```
Authorization: Bearer <accessToken>
```

**Response (200 OK):**

```json
{
  "profiles": [
    {
      "id": "uuid-1",
      "name": "admin",
      "displayName": "Administrator"
    },
    {
      "id": "uuid-2",
      "name": "user",
      "displayName": "User"
    }
  ]
}
```

---

## Notes

- All timestamps are in ISO 8601 format (UTC)
- All passwords are hashed and never returned in responses
- forcePasswordChange=true means user MUST change password before accessing other features
- loginType can be "password" or "magic_link" (and potentially others in future)
- User email must be unique
- Admin operations require user to have profile="admin"
