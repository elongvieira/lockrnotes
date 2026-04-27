# LockrNotes API Documentation

Base URL: `http://localhost:3000`

---

## 📋 Table of Contents

1. [Authentication](#authentication)
2. [Auth Endpoints](#auth-endpoints)
3. [Users Endpoints](#users-endpoints)
4. [Files Endpoints](#files-endpoints)
5. [Groups Endpoints](#groups-endpoints)
6. [Error Handling](#error-handling)
7. [Usage Flow Examples](#usage-flow-examples)

---

## Authentication

### JWT Token
All authenticated endpoints require a Bearer token in the Authorization header:

```
Authorization: Bearer your_jwt_token_here
```

### Login Types
Users can authenticate via:
- **magic_link**: One-time code sent to email
- **password**: Email + password authentication
- **ad**: Active Directory / LDAP authentication (fallback)

---

## Auth Endpoints

### 1. Login with Password
**POST** `/auth/login`

**Request:**
```json
{
  "email": "user@example.com",
  "password": "SecurePassword123!"
}
```

**Response (200 OK):**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "forcePasswordChange": false,
  "user": {
    "id": "uuid-of-user",
    "name": "John Doe",
    "email": "user@example.com",
    "profile": "user",
    "forcePasswordChange": false
  }
}
```

**Errors:**
- `401 Unauthorized`: Invalid credentials
- `401 Unauthorized`: Account is disabled
- `401 Unauthorized`: Account is disabled (magic_link/AD users)

---

### 2. Request Magic Link
**POST** `/auth/magic-link/request`

**Request:**
```json
{
  "email": "user@example.com"
}
```

**Response (200 OK):**
```json
{
  "message": "If this email is registered, a code has been sent."
}
```

**Note:** Always returns success message (for security - prevents email enumeration)

---

### 3. Verify Magic Link Code
**POST** `/auth/magic-link/verify`

**Request:**
```json
{
  "email": "user@example.com",
  "code": "123456"
}
```

**Response (200 OK):**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "forcePasswordChange": false,
  "user": {
    "id": "uuid-of-user",
    "name": "John Doe",
    "email": "user@example.com",
    "profile": "user",
    "forcePasswordChange": false
  }
}
```

**Errors:**
- `401 Unauthorized`: Invalid or already used code
- `401 Unauthorized`: Code has expired
- `401 Unauthorized`: Account is disabled

---

### 4. Get Login Type
**GET** `/auth/login-type?email=user@example.com`

**Response (200 OK):**
```json
{
  "email": "user@example.com",
  "loginType": "password",
  "exists": true
}
```

**Response if user doesn't exist (200 OK):**
```json
{
  "email": "nonexistent@example.com",
  "loginType": "magic_link",
  "exists": false
}
```

---

### 5. Change Password
**POST** `/auth/change-password` ⚠️ **Requires Authentication**

**Request:**
```json
{
  "currentPassword": "OldPassword123!",
  "newPassword": "NewPassword456!"
}
```

**Response (200 OK):**
```json
{
  "message": "Password changed successfully"
}
```

**Errors:**
- `401 Unauthorized`: Current password is incorrect
- `401 Unauthorized`: Only password-based accounts can change password (LDAP/AD users)
- `401 Unauthorized`: Unauthorized

**Auto-clears:** `forcePasswordChange` flag is automatically set to `false` after successful password change

---

## Users Endpoints

### 1. List All Users
**GET** `/users` 🔐 **Admin Only**

**Response (200 OK):**
```json
[
  {
    "id": "uuid-1",
    "name": "John Doe",
    "email": "john@example.com",
    "loginType": "password",
    "isActive": true,
    "forcePasswordChange": false,
    "profileId": "uuid-profile",
    "profile": {
      "id": "uuid-profile",
      "name": "admin"
    },
    "createdAt": "2026-03-28T20:00:00Z",
    "updatedAt": "2026-03-28T21:00:00Z"
  }
]
```

---

### 2. Get User by ID
**GET** `/users/:id` 🔐 **Admin Only**

**Response (200 OK):**
```json
{
  "id": "uuid-1",
  "name": "John Doe",
  "email": "john@example.com",
  "loginType": "password",
  "isActive": true,
  "forcePasswordChange": false,
  "profileId": "uuid-profile",
  "profile": {
    "id": "uuid-profile",
    "name": "admin"
  },
  "createdAt": "2026-03-28T20:00:00Z",
  "updatedAt": "2026-03-28T21:00:00Z"
}
```

---

### 3. Create User
**POST** `/users` 🔐 **Admin Only**

**Request:**
```json
{
  "name": "Jane Smith",
  "email": "jane@example.com",
  "loginType": "magic_link"
}
```

**Response (201 Created):**
```json
{
  "id": "uuid-2",
  "name": "Jane Smith",
  "email": "jane@example.com",
  "loginType": "magic_link",
  "isActive": true,
  "forcePasswordChange": false,
  "profileId": "uuid-profile",
  "profile": {
    "id": "uuid-profile",
    "name": "user"
  },
  "createdAt": "2026-03-28T21:00:00Z",
  "updatedAt": "2026-03-28T21:00:00Z"
}
```

---

### 4. Update User
**PATCH** `/users/:id` 🔐 **Admin Only**

**Request:**
```json
{
  "name": "Jane Doe",
  "email": "jane.doe@example.com",
  "isActive": true,
  "forcePasswordChange": false
}
```

**Response (200 OK):**
```json
{
  "id": "uuid-2",
  "name": "Jane Doe",
  "email": "jane.doe@example.com",
  "loginType": "magic_link",
  "isActive": true,
  "forcePasswordChange": false,
  "profileId": "uuid-profile",
  "profile": {
    "id": "uuid-profile",
    "name": "user"
  },
  "createdAt": "2026-03-28T21:00:00Z",
  "updatedAt": "2026-03-28T21:30:00Z"
}
```

**Note:** Password field is intentionally removed. Use `/auth/change-password` endpoint instead.

---

### 5. Delete User
**DELETE** `/users/:id` 🔐 **Admin Only**

**Response (200 OK):**
```json
{
  "id": "uuid-2",
  "name": "Jane Doe",
  "email": "jane.doe@example.com",
  "loginType": "magic_link",
  "isActive": true,
  "forcePasswordChange": false,
  "profileId": "uuid-profile",
  "profile": {
    "id": "uuid-profile",
    "name": "user"
  },
  "createdAt": "2026-03-28T21:00:00Z",
  "updatedAt": "2026-03-28T21:30:00Z"
}
```

---

### 6. Activate User
**POST** `/users/:id/activate` 🔐 **Admin Only**

**Response (200 OK):**
```json
{
  "id": "uuid-2",
  "isActive": true,
  ...
}
```

---

### 7. Deactivate User
**POST** `/users/:id/deactivate` 🔐 **Admin Only**

**Response (200 OK):**
```json
{
  "id": "uuid-2",
  "isActive": false,
  ...
}
```

**Note:** Disabled users cannot login. Attempting to login returns `401 Unauthorized` with message "Account is disabled"

---

### 8. Force Password Change
**POST** `/users/:id/force-password-change` 🔐 **Admin Only**

**Response (200 OK):**
```json
{
  "id": "uuid-2",
  "forcePasswordChange": true,
  ...
}
```

**Note:** User must have `loginType="password"`. Next login will include `forcePasswordChange: true` in response.

---

## Files Endpoints

### 1. List All Files
**GET** `/files` ⚠️ **Authenticated**

**Query Parameters:**
- `parentId` (optional): Filter by parent folder ID

**Response (200 OK):**
```json
[
  {
    "id": "uuid-file-1",
    "name": "Document.md",
    "type": "file",
    "content": "# My Document\nContent here...",
    "isEncrypted": false,
    "encryptionLevel": "none",
    "encryptionType": null,
    "originalExtension": ".md",
    "version": 1,
    "userId": "uuid-user",
    "createdAt": "2026-03-28T20:00:00Z",
    "updatedAt": "2026-03-28T20:00:00Z"
  }
]
```

---

### 2. Create File/Folder
**POST** `/files` ⚠️ **Authenticated**

**Request (File):**
```json
{
  "name": "MyFile.txt",
  "type": "file",
  "content": "File content here"
}
```

**Request (Folder):**
```json
{
  "name": "MyFolder",
  "type": "folder"
}
```

**Response (201 Created):**
```json
{
  "id": "uuid-file-1",
  "name": "MyFile.txt",
  "type": "file",
  "content": "File content here",
  "isEncrypted": false,
  "encryptionLevel": "none",
  "userId": "uuid-user",
  "createdAt": "2026-03-28T20:00:00Z",
  "updatedAt": "2026-03-28T20:00:00Z"
}
```

---

### 3. Get File Details
**GET** `/files/:id` ⚠️ **Authenticated**

**Response (200 OK):**
```json
{
  "id": "uuid-file-1",
  "name": "MyFile.txt",
  "type": "file",
  "content": "File content here",
  "isEncrypted": false,
  "encryptionLevel": "none",
  "userId": "uuid-user",
  "createdAt": "2026-03-28T20:00:00Z",
  "updatedAt": "2026-03-28T20:00:00Z"
}
```

---

### 4. Get Folder Contents
**GET** `/files/folder/:id` ⚠️ **Authenticated**

**Response (200 OK):**
```json
[
  {
    "id": "uuid-file-2",
    "name": "Document.md",
    "type": "file",
    ...
  }
]
```

---

### 5. Update File
**PATCH** `/files/:id` ⚠️ **Authenticated (Owner/Admin)**

**Request:**
```json
{
  "name": "UpdatedFile.txt",
  "content": "Updated content"
}
```

**Response (200 OK):**
```json
{
  "id": "uuid-file-1",
  "name": "UpdatedFile.txt",
  "type": "file",
  "content": "Updated content",
  "version": 2,
  "updatedAt": "2026-03-28T21:00:00Z",
  ...
}
```

---

### 6. Delete File
**DELETE** `/files/:id` ⚠️ **Authenticated (Owner/Admin)**

**Response (200 OK):**
```json
{
  "id": "uuid-file-1",
  "name": "UpdatedFile.txt",
  "type": "file",
  ...
}
```

---

## Groups Endpoints

### 1. List All Groups
**GET** `/groups` ⚠️ **Authenticated**

**Response (200 OK):**
```json
[
  {
    "id": "uuid-group-1",
    "name": "Project Team",
    "encryptionKey": "hashed-key",
    "createdAt": "2026-03-28T20:00:00Z",
    "updatedAt": "2026-03-28T20:00:00Z"
  }
]
```

---

### 2. Create Group
**POST** `/groups` 🔐 **Admin Only**

**Request:**
```json
{
  "name": "Project Team"
}
```

**Response (201 Created):**
```json
{
  "id": "uuid-group-1",
  "name": "Project Team",
  "encryptionKey": "hashed-key",
  "createdAt": "2026-03-28T20:00:00Z",
  "updatedAt": "2026-03-28T20:00:00Z"
}
```

---

### 3. Get Group Details
**GET** `/groups/:id` ⚠️ **Authenticated**

**Response (200 OK):**
```json
{
  "id": "uuid-group-1",
  "name": "Project Team",
  "encryptionKey": "hashed-key",
  "members": [
    {
      "userId": "uuid-user-1",
      "groupId": "uuid-group-1",
      "createdAt": "2026-03-28T20:00:00Z"
    }
  ],
  "createdAt": "2026-03-28T20:00:00Z"
}
```

---

### 4. Update Group
**PATCH** `/groups/:id` 🔐 **Admin Only**

**Request:**
```json
{
  "name": "Updated Project Team"
}
```

**Response (200 OK):**
```json
{
  "id": "uuid-group-1",
  "name": "Updated Project Team",
  "updatedAt": "2026-03-28T21:00:00Z",
  ...
}
```

---

### 5. Delete Group
**DELETE** `/groups/:id` 🔐 **Admin Only**

**Response (200 OK):**
```json
{
  "id": "uuid-group-1",
  "name": "Updated Project Team",
  ...
}
```

---

### 6. Add Member to Group
**POST** `/groups/:id/members` 🔐 **Admin Only**

**Request:**
```json
{
  "userId": "uuid-user-2"
}
```

**Response (201 Created):**
```json
{
  "userId": "uuid-user-2",
  "groupId": "uuid-group-1",
  "createdAt": "2026-03-28T21:00:00Z"
}
```

---

### 7. Remove Member from Group
**DELETE** `/groups/:id/members/:userId` 🔐 **Admin Only**

**Response (200 OK):**
```json
{
  "userId": "uuid-user-2",
  "groupId": "uuid-group-1"
}
```

---

### 8. Share File with Group
**POST** `/groups/:id/files` ⚠️ **Authenticated**

**Request:**
```json
{
  "fileId": "uuid-file-1"
}
```

**Response (201 Created):**
```json
{
  "fileId": "uuid-file-1",
  "groupId": "uuid-group-1",
  "createdAt": "2026-03-28T21:00:00Z"
}
```

---

### 9. Get Group Files
**GET** `/groups/:id/files` ⚠️ **Authenticated**

**Response (200 OK):**
```json
[
  {
    "id": "uuid-file-1",
    "name": "Document.md",
    "type": "file",
    ...
  }
]
```

---

### 10. Remove File from Group
**DELETE** `/groups/:id/files/:fileId` 🔐 **Admin Only**

**Response (200 OK):**
```json
{
  "fileId": "uuid-file-1",
  "groupId": "uuid-group-1"
}
```

---

## Error Handling

### Standard Error Response
```json
{
  "statusCode": 400,
  "message": "Error message here",
  "error": "Bad Request"
}
```

### Common HTTP Status Codes

| Code | Meaning | Example |
|------|---------|---------|
| 200 | Success | User login successful |
| 201 | Created | User created successfully |
| 400 | Bad Request | Invalid request body |
| 401 | Unauthorized | Invalid credentials / Missing token |
| 403 | Forbidden | Admin access required |
| 404 | Not Found | User/File/Group not found |
| 409 | Conflict | Email already in use |

### Common Error Messages

```json
{
  "statusCode": 401,
  "message": "Invalid credentials",
  "error": "Unauthorized"
}
```

```json
{
  "statusCode": 401,
  "message": "Account is disabled",
  "error": "Unauthorized"
}
```

```json
{
  "statusCode": 403,
  "message": "Admin access required",
  "error": "Forbidden"
}
```

```json
{
  "statusCode": 409,
  "message": "Email already in use",
  "error": "Conflict"
}
```

---

## Usage Flow Examples

### Flow 1: Login with Password
```
1. POST /auth/login
   - Request: { email, password }
   - Response: { accessToken, forcePasswordChange, user }
   
2. Store accessToken in localStorage/sessionStorage
   
3. Add to all future requests:
   - Header: "Authorization: Bearer {accessToken}"
   
4. If forcePasswordChange === true:
   - Show password change dialog
   - POST /auth/change-password { currentPassword, newPassword }
```

### Flow 2: Check Email and Login
```
1. GET /auth/login-type?email=user@example.com
   - Response: { email, loginType, exists }
   
2. If loginType === "magic_link":
   - Show magic link flow
   
3. If loginType === "password":
   - Show password login form
   
4. If loginType === "ad":
   - Show LDAP/AD login (handled by fallback)
```

### Flow 3: Disable User and Force Password Change (Admin)
```
1. POST /users/:id/deactivate
   - User cannot login anymore

2. POST /users/:id/force-password-change
   - User will see password change prompt on next login

3. User navigates to login:
   - POST /auth/login
   - Response includes: forcePasswordChange: true
   - Frontend shows: "You must change your password"
   - User clicks continue
   - POST /auth/change-password
   - User is now fully authenticated with new password
```

### Flow 4: Share Files in Groups
```
1. POST /groups { name: "Project Team" }
   - Creates new group

2. POST /groups/:groupId/members { userId: "user-id" }
   - Adds members to group

3. POST /groups/:groupId/files { fileId: "file-id" }
   - Shares file with group

4. GET /groups/:groupId/files
   - Retrieves all shared files

5. Members can access:
   - GET /files/:fileId (if they're in the group)
```

---

## Environment Variables

```env
# Server
PORT=3000

# Database
DATABASE_URL=sqlserver://...

# JWT
JWT_SECRET=your-secret-key
JWT_EXPIRATION=3600

# LDAP (Optional)
LDAP_ENABLED=true
LDAP_URL=ldap://openldap:389
LDAP_BASE_DN=dc=lockrnotes,dc=local
LDAP_BIND_DN=cn=admin,dc=lockrnotes,dc=local
LDAP_BIND_PASSWORD=...
LDAP_USER_GROUP=cn=LOCKR_USERS,ou=groups,dc=lockrnotes,dc=local
LDAP_ADMIN_GROUP=cn=LOCKR_ADMIN,ou=groups,dc=lockrnotes,dc=local

# Email
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USER=...
MAIL_PASSWORD=...

# Magic Link
MAGIC_LINK_TOKEN_EXPIRATION_MINUTES=15
```

---

## Legend

- 🔐 **Admin Only**: Only administrators can access
- ⚠️ **Authenticated**: Requires valid JWT token
- 📌 **Dynamic Parameter**: Replace with actual value

---

**Last Updated:** March 28, 2026
**API Version:** 1.0.0
