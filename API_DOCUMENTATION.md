# 📖 QuickBite REST & Real-Time API Documentation

Base URL: `http://localhost:5000/api` (Production: `https://<your-backend>.onrender.com/api`)

All JSON responses follow the standardized contract:
```json
{
  "success": true,
  "data": { ... },
  "message": "Optional descriptive message"
}
```
Error response:
```json
{
  "success": false,
  "message": "Human readable error description",
  "errors": [ ... ]
}
```

---

## 🔐 1. Authentication Endpoints

### 1.1 Register User
- **Method:** `POST`
- **Route:** `/auth/register`
- **Auth:** Public
- **Request Body:**
```json
{
  "name": "Jane Doe",
  "email": "jane@example.com",
  "password": "Password123!",
  "phone": "+1 555-0199",
  "address": "123 Main St, Apt 4B, Springfield"
}
```
- **Success (201 Created):**
```json
{
  "success": true,
  "message": "Registration successful",
  "data": {
    "user": {
      "id": "64f1a2...",
      "name": "Jane Doe",
      "email": "jane@example.com",
      "role": "customer"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### 1.2 Login User
- **Method:** `POST`
- **Route:** `/auth/login`
- **Auth:** Public
- **Request Body:**
```json
{
  "email": "customer@quickbite.com",
  "password": "password123"
}
```
- **Success (200 OK):**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": "64f1a2...",
      "name": "Alex Customer",
      "email": "customer@quickbite.com",
      "role": "customer"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### 1.3 Get Current User Profile
- **Method:** `GET`
- **Route:** `/auth/me`
- **Auth:** Bearer Token (`verifyToken`)
- **Headers:** `Authorization: Bearer <token>`
- **Success (200 OK):** Returns authenticated user profile without password hash.

---

## 🍕 2. Menu Endpoints

### 2.1 Get Menu Items
- **Method:** `GET`
- **Route:** `/menu`
- **Auth:** Public
- **Query Parameters:**
  - `category` (optional, string: e.g. `Pizza`, `Burger`, `Drinks`, `Dessert`)
  - `search` (optional, string: item name / keywords)
- **Success (200 OK):**
```json
{
  "success": true,
  "count": 8,
  "data": [
    {
      "_id": "64f1b3...",
      "name": "Truffle Mushroom Burger",
      "description": "Artisan brioche bun, double smashed Angus beef, Swiss cheese, sautéed wild mushrooms and truffle aioli.",
      "price": 14.99,
      "category": "Burger",
      "image": "https://images.unsplash.com/photo-1568901346375-23c9450c58cd",
      "isAvailable": true
    }
  ]
}
```

### 2.2 Create Menu Item (Admin Only)
- **Method:** `POST`
- **Route:** `/menu`
- **Auth:** Bearer Token with `role: "admin"`
- **Request Body:**
```json
{
  "name": "Margherita Artisanal Pizza",
  "description": "San Marzano tomatoes, fresh buffalo mozzarella, basil, and EVOO.",
  "price": 16.50,
  "category": "Pizza",
  "image": "https://images.unsplash.com/photo-1513104890138-7c749659a591"
}
```
- **Success (201 Created)**

---

## 📦 3. Order Management Endpoints

### 3.1 Place a New Order
- **Method:** `POST`
- **Route:** `/orders`
- **Auth:** Public / Optional Bearer Token
- **Request Body:**
```json
{
  "customerName": "John Smith",
  "customerPhone": "555-987-6543",
  "deliveryAddress": "742 Evergreen Terrace, Springfield",
  "items": [
    {
      "menuItemId": "64f1b3...",
      "quantity": 2
    }
  ],
  "autoSimulate": true
}
```
- **Success (201 Created):**
```json
{
  "success": true,
  "message": "Order placed successfully",
  "data": {
    "order": {
      "_id": "64f2c5...",
      "customerName": "John Smith",
      "customerPhone": "555-987-6543",
      "deliveryAddress": "742 Evergreen Terrace, Springfield",
      "items": [
        {
          "menuItemId": "64f1b3...",
          "name": "Truffle Mushroom Burger",
          "price": 14.99,
          "quantity": 2
        }
      ],
      "subtotal": 29.98,
      "deliveryFee": 3.99,
      "tax": 2.40,
      "totalAmount": 36.37,
      "status": "Order Received",
      "statusHistory": [
        {
          "status": "Order Received",
          "timestamp": "2026-10-13T11:15:00.000Z",
          "note": "Order has been received by the restaurant."
        }
      ],
      "createdAt": "2026-10-13T11:15:00.000Z"
    }
  }
}
```

### 3.2 Get Order by ID
- **Method:** `GET`
- **Route:** `/orders/:id`
- **Auth:** Public (or restricted to order owner / admin if logged in)
- **Success (200 OK):** Detailed order state, items, delivery details, and status history.

### 3.3 List Orders
- **Method:** `GET`
- **Route:** `/orders`
- **Auth:** Bearer Token (Customers see their orders; Admins see all orders)
- **Success (200 OK):** Array of order objects.

### 3.4 Update Order Status (Admin / Kitchen)
- **Method:** `PATCH`
- **Route:** `/orders/:id/status`
- **Auth:** Bearer Token (Admin)
- **Request Body:**
```json
{
  "status": "Preparing",
  "note": "Chef is preparing the meal"
}
```
- **Success (200 OK):** Updated order object. Automatically fires Socket.io event to room `order_<id>`.

### 3.5 Trigger Automated Status Progression Simulation
- **Method:** `POST`
- **Route:** `/orders/:id/simulate`
- **Auth:** Public / Demo trigger
- **Description:** Advances the order to the next status in the sequence (`Order Received` ➔ `Preparing` ➔ `Out for Delivery` ➔ `Delivered`) and emits the real-time WebSocket event.
- **Success (200 OK)**

---

## ⚡ 4. Real-Time Socket.io Events

### Client-to-Server
| Event | Payload | Description |
|---|---|---|
| `join_order` | `orderId` (string) | Subscribes client socket to updates for this specific order room |
| `leave_order` | `orderId` (string) | Unsubscribes client socket from the order room |

### Server-to-Client
| Event | Payload | Description |
|---|---|---|
| `order_status_updated` | `{ orderId, status, note, updatedAt, statusHistory }` | Fired in real-time when the order changes state |
