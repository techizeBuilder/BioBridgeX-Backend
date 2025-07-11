# API Documentation

## Base URL
```
http://localhost:3010/api
```

## Authentication Endpoints

### Register User
```http
POST /auth/register
```

**Request Body:**
```json
{
  "name": "string",
  "email": "string",
  "password": "string"
}
```

**Response (201):**
```json
{
  "message": "User registered successfully",
  "user": {
    "_id": "string",
    "name": "string",
    "email": "string",
    "createdAt": "string",
    "updatedAt": "string"
  }
}
```

### Login
```http
POST /auth/login
```

**Request Body:**
```json
{
  "email": "string",
  "password": "string"
}
```

**Response (200):**
```json
{
  "token": "string"
}
```

### Forgot Password
```http
POST /auth/forgot-password
```

**Request Body:**
```json
{
  "email": "string"
}
```

**Response (200):**
```json
{
  "message": "Password reset token generated",
  "resetToken": "string"
}
```

### Reset Password
```http
POST /auth/reset-password
```

**Request Body:**
```json
{
  "token": "string",
  "newPassword": "string"
}
```

**Response (200):**
```json
{
  "message": "Password updated successfully"
}
```

## Chat Endpoints

### Create Message
```http
POST /chats
```

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "chatId": "string",
  "message": "string"
}
```

**Response (201):**
```json
{
  "status": "success",
  "data": {
    "_id": "string",
    "chatId": "string",
    "userId": "string",
    "message": "string",
    "timestamp": "string",
    "createdAt": "string"
  }
}
```

### Get Chat History
```http
GET /chats/:chatId
```

**Headers:**
```
Authorization: Bearer <token>
```

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20)

**Response (200):**
```json
{
  "status": "success",
  "data": {
    "messages": [
      {
        "_id": "string",
        "chatId": "string",
        "userId": "string",
        "message": "string",
        "timestamp": "string",
        "createdAt": "string"
      }
    ],
    "pagination": {
      "page": "number",
      "limit": "number",
      "total": "number",
      "pages": "number"
    }
  }
}
```

### Search Messages
```http
GET /chats/search
```

**Headers:**
```
Authorization: Bearer <token>
```

**Query Parameters:**
- `keyword` (optional): Search keyword
- `chatId` (optional): Filter by chat ID
- `userId` (optional): Filter by user ID

**Response (200):**
```json
{
  "status": "success",
  "data": [
    {
      "_id": "string",
      "chatId": "string",
      "userId": "string",
      "message": "string",
      "timestamp": "string",
      "createdAt": "string"
    }
  ]
}
```

### Delete Chat
```http
DELETE /chats/:chatId
```

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "status": "success",
  "data": {
    "deletedCount": "number"
  }
}
```

### Get Chat Summary
```http
GET /chats/:chatId/summary
```

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "status": "success",
  "data": {
    "summary": "string"
  }
}
```

## Error Responses

All endpoints may return the following error responses:

### 400 Bad Request
```json
{
  "status": "error",
  "errors": [
    {
      "msg": "string",
      "param": "string",
      "location": "string"
    }
  ]
}
```

### 401 Unauthorized
```json
{
  "error": "Authentication required"
}
```

### 403 Forbidden
```json
{
  "status": "error",
  "message": "Not authorized to access this resource"
}
```

### 404 Not Found
```json
{
  "status": "error",
  "message": "Resource not found"
}
```

### 429 Too Many Requests
```json
{
  "error": "Too many attempts. Please try again later."
}
```

### 500 Server Error
```json
{
  "status": "error",
  "message": "Server error"
}
```

## Rate Limiting

- Login endpoint: 5 requests per 15 minutes
- All other endpoints: No rate limiting

## Authentication

All chat endpoints require JWT authentication. Include the JWT token in the Authorization header:
```
Authorization: Bearer <token>
```

The token is obtained from the login endpoint and expires in 24 hours.