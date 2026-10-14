const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../src/app');
const MenuItem = require('../src/models/MenuItem');
const User = require('../src/models/User');
const Order = require('../src/models/Order');
const { ROLES } = require('../src/config/constants');

describe('Security & Protection Controls (Production Grade)', () => {
  let customerUser;
  let customerToken;
  let adminToken;
  let sampleItem;

  beforeEach(async () => {
    // Customer
    customerUser = await User.create({
      name: 'Security Test Customer',
      email: 'sec-customer@test.com',
      password: 'password123',
      role: ROLES.CUSTOMER
    });
    const cLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: 'sec-customer@test.com', password: 'password123' });
    customerToken = cLogin.body.data.token;

    // Admin
    const adminUser = await User.create({
      name: 'Security Test Admin',
      email: 'sec-admin@test.com',
      password: 'adminpassword',
      role: ROLES.ADMIN
    });
    const aLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: 'sec-admin@test.com', password: 'adminpassword' });
    adminToken = aLogin.body.data.token;

    // Authentic Menu Item ($18.50)
    sampleItem = await MenuItem.create({
      name: 'Artisan Truffle Pizza',
      description: 'Gourmet pizza with white truffles',
      price: 18.50,
      image: 'https://images.unsplash.com/photo-1513104890138-7c749659a591',
      category: 'Pizza'
    });
  });

  describe('1. HTTP Security Headers (Helmet)', () => {
    it('should include Helmet security headers on responses', async () => {
      const res = await request(app).get('/api/health');

      expect(res.headers['x-content-type-options']).toBe('nosniff');
      expect(res.headers['x-dns-prefetch-control']).toBe('off');
    });
  });

  describe('2. Price Tampering Defense (Never Trust Client)', () => {
    it('should calculate order pricing strictly from DB and ignore client price overrides', async () => {
      // Attacker attempts to forge price to $0.01 instead of DB price ($18.50)
      const res = await request(app)
        .post('/api/orders')
        .send({
          customerName: 'Hacker',
          customerPhone: '555-000-0000',
          deliveryAddress: '123 Dark Web Lane',
          items: [
            {
              menuItemId: sampleItem._id,
              quantity: 2,
              price: 0.01 // Tampered price attempt
            }
          ],
          autoSimulate: false
        });

      expect(res.statusCode).toBe(201);
      const order = res.body.data.order;

      // Authentic subtotal must be 2 * $18.50 = $37.00, NOT $0.02
      expect(order.subtotal).toBe(37.00);
      expect(order.items[0].price).toBe(18.50);
      expect(order.totalAmount).toBeGreaterThan(37.00);
    });
  });

  describe('3. Role-Based Access Control (RBAC) Enforcement', () => {
    it('should block non-admin users from creating menu items (403 Forbidden)', async () => {
      const res = await request(app)
        .post('/api/menu')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          name: 'Unauthorized Dish',
          description: 'Hacked dish',
          price: 5.0,
          image: 'https://images.unsplash.com/photo-1513104890138-7c749659a591',
          category: 'Sides'
        });

      expect(res.statusCode).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/Forbidden/i);
    });

    it('should block non-admin users from updating order status directly (403 Forbidden)', async () => {
      const order = await Order.create({
        customerName: 'Tester',
        customerPhone: '555-1234',
        deliveryAddress: 'Street 1',
        items: [{
          menuItem: sampleItem._id,
          name: sampleItem.name,
          price: sampleItem.price,
          quantity: 1
        }],
        subtotal: 18.5,
        deliveryFee: 3.99,
        tax: 1.48,
        totalAmount: 23.97,
        status: 'Order Received'
      });

      const res = await request(app)
        .patch(`/api/orders/${order._id}/status`)
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ status: 'Delivered' });

      expect(res.statusCode).toBe(403);
    });

    it('should block unauthenticated requests to protected admin list (401 Unauthorized)', async () => {
      const res = await request(app).get('/api/orders/all');
      expect(res.statusCode).toBe(401);
    });

    it('should block admin/kitchen staff from placing customer orders (403 Forbidden)', async () => {
      const res = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          customerName: 'Admin Staff',
          customerPhone: '555-999-8888',
          deliveryAddress: 'Admin Kitchen Desk',
          items: [
            {
              menuItemId: sampleItem._id,
              quantity: 1
            }
          ]
        });

      expect(res.statusCode).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/Kitchen staff.*cannot place.*order/i);
    });

    it('should strictly isolate order history and prevent cross-user data exposure', async () => {
      // Create user B
      const userB = await User.create({
        name: 'User B',
        email: 'userb@test.com',
        password: 'password123',
        role: ROLES.CUSTOMER
      });
      const bLogin = await request(app)
        .post('/api/auth/login')
        .send({ email: 'userb@test.com', password: 'password123' });
      const userBToken = bLogin.body.data.token;

      // Create order for user A
      await Order.create({
        user: customerUser._id,
        customerName: 'Customer A',
        customerPhone: '555-111-2222',
        deliveryAddress: 'Customer A House',
        items: [{ menuItem: sampleItem._id, name: sampleItem.name, price: 18.5, quantity: 1 }],
        subtotal: 18.5,
        deliveryFee: 3.99,
        tax: 1.48,
        totalAmount: 23.97,
        status: 'Order Received'
      });

      // Create order for user B
      const orderB = await Order.create({
        user: userB._id,
        customerName: 'Customer B',
        customerPhone: '555-333-4444',
        deliveryAddress: 'Customer B House',
        items: [{ menuItem: sampleItem._id, name: sampleItem.name, price: 18.5, quantity: 1 }],
        subtotal: 18.5,
        deliveryFee: 3.99,
        tax: 1.48,
        totalAmount: 23.97,
        status: 'Order Received'
      });

      // User A orders history only contains Order A
      const resA = await request(app)
        .get('/api/orders')
        .set('Authorization', `Bearer ${customerToken}`);
      expect(resA.statusCode).toBe(200);
      expect(resA.body.data.length).toBe(1);
      expect(resA.body.data[0].customerName).toBe('Customer A');

      // User B orders history only contains Order B
      const resB = await request(app)
        .get('/api/orders')
        .set('Authorization', `Bearer ${userBToken}`);
      expect(resB.statusCode).toBe(200);
      expect(resB.body.data.length).toBe(1);
      expect(resB.body.data[0].customerName).toBe('Customer B');

      // User A attempts to inspect User B order by ID -> must be 403 Forbidden
      const crossInspect = await request(app)
        .get(`/api/orders/${orderB._id}`)
        .set('Authorization', `Bearer ${customerToken}`);
      expect(crossInspect.statusCode).toBe(403);
      expect(crossInspect.body.success).toBe(false);
      expect(crossInspect.body.message).toMatch(/Access denied/i);
    });
  });

  describe('4. Token Security & Forgery Protection', () => {
    it('should reject tampered or forged JWT tokens', async () => {
      const forgedToken = jwt.sign(
        { id: customerUser._id, role: 'admin' },
        'wrong_secret_key_used_by_attacker'
      );

      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${forgedToken}`);

      expect(res.statusCode).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });
});
