# 🍲 QuickBite — Backend API & Real-Time Engine

The backend API and WebSocket server for **QuickBite**, built with **Node.js**, **Express**, **MongoDB (Mongoose)**, and **Socket.io**.

---

## 🚀 Features

- **RESTful API**: Clean REST endpoints for authentication, menu items, and order processing.
- **WebSocket Engine (Socket.io)**: Room-based real-time events (`order_placed`, `order_status_updated`, `kitchen_alert`).
- **Security & Hardening**:
  - Helmet for secure HTTP headers.
  - Express Rate Limiting (General and Auth-specific tiers).
  - Price tampering defense (server-enforced menu prices).
  - Multi-tenant order isolation (customers can only access their own orders).
- **Role-Based Access Control (RBAC)**: Enforced separation between `customer` and `kitchen` staff.
- **In-Memory Testing Suite**: Complete Jest + Supertest suite with `mongodb-memory-server` for zero external DB dependency during testing.

---

## 🛠️ Tech Stack

- **Runtime**: Node.js `>= 18.0.0`
- **Framework**: Express 4
- **Database**: MongoDB with Mongoose ODM
- **Real-Time Engine**: Socket.io
- **Auth**: JWT (`jsonwebtoken`) & `bcryptjs`
- **Testing**: Jest, Supertest, MongoDB Memory Server

---

## 💻 Getting Started

### 1. Prerequisites
- Node.js `>= 18.0.0`
- MongoDB local instance running OR MongoDB Atlas URI

### 2. Installation
```bash
npm install
```

### 3. Environment Setup
Copy the example environment file:
```bash
cp .env.example .env
```

Configure `.env`:
```env
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:5173
MONGODB_URI=mongodb://127.0.0.1:27017/quickbite_db
JWT_SECRET=super_secret_jwt_key_assessment_2026_quickbite
JWT_EXPIRES_IN=7d
```

### 4. Seed Database (Demo Data)
Populates initial menu items and kitchen/customer test accounts:
```bash
npm run seed
```

### 5. Start Development Server
```bash
npm run dev
```
Server will start on `http://localhost:5000`.

---

## 🧪 Testing

```bash
# Run complete test suite (Auth, Menu, Orders, Security)
npm test
```

---

## 📖 API Documentation

Detailed endpoint specifications, request/response payloads, and status codes are available in [API_DOCUMENTATION.md](./API_DOCUMENTATION.md).

---

## 🌐 Deploying to Render / Railway

1. Push this repository to your GitHub account (e.g. `quickbite-backend`).
2. Log into [Render](https://render.com) and click **New + ➔ Web Service**.
3. Select your `quickbite-backend` repository.
4. Settings:
   - **Environment**: Node
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
5. Configure Environment Variables:
   - `NODE_ENV`: `production`
   - `MONGODB_URI`: `<your-mongodb-atlas-uri>`
   - `JWT_SECRET`: `<secure-random-string>`
   - `CLIENT_URL`: `https://<your-frontend>.vercel.app`
6. Click **Create Web Service**.
