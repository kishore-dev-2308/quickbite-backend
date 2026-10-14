const request = require('supertest');
const app = require('../src/app');
const MenuItem = require('../src/models/MenuItem');
const User = require('../src/models/User');
const Order = require('../src/models/Order');
const { ROLES } = require('../src/config/constants');

describe('Order API Endpoints (TDD)', () => {
  let adminToken;
  let customerToken;
  let customerUser;
  let burgerItem;
  let pizzaItem;

  beforeEach(async () => {
    // 1. Create Admin
    await User.create({
      name: 'Chef Admin',
      email: 'admin@quickbite.com',
      password: 'adminpassword',
      role: ROLES.ADMIN
    });
    const adminLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@quickbite.com', password: 'adminpassword' });
    adminToken = adminLogin.body.data.token;

    // 2. Create Customer
    customerUser = await User.create({
      name: 'David Miller',
      email: 'david@quickbite.com',
      password: 'customerpass',
      role: ROLES.CUSTOMER,
      phone: '+1 555-0144',
      address: '100 Sunset Blvd'
    });
    const custLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: 'david@quickbite.com', password: 'customerpass' });
    customerToken = custLogin.body.data.token;

    // 3. Seed Menu Items
    burgerItem = await MenuItem.create({
      name: 'Signature Burger',
      description: 'Gourmet beef burger',
      price: 15.00,
      image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd',
      category: 'Burger',
      isAvailable: true
    });

    pizzaItem = await MenuItem.create({
      name: 'Rustic Truffle Pizza',
      description: 'Hand-tossed pizza with truffle',
      price: 20.00,
      image: 'https://images.unsplash.com/photo-1513104890138-7c749659a591',
      category: 'Pizza',
      isAvailable: true
    });
  });

  describe('POST /api/orders (Order Placement)', () => {
    it('should create an order with accurate pricing and subtotal', async () => {
      const res = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          customerName: 'David Miller',
          customerPhone: '+1 555-0144',
          deliveryAddress: '100 Sunset Blvd',
          items: [
            { menuItemId: burgerItem._id, quantity: 2 }, // 2 * $15 = $30
            { menuItemId: pizzaItem._id, quantity: 1 }   // 1 * $20 = $20
          ],
          autoSimulate: false
        });

      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);

      const order = res.body.data.order;
      expect(order.status).toBe('Order Received');
      expect(order.subtotal).toBe(50.00); // 30 + 20
      // Subtotal >= 40 gets free delivery (0)
      expect(order.deliveryFee).toBe(0);
      expect(order.tax).toBe(4.00); // 50 * 0.08
      expect(order.totalAmount).toBe(54.00);
      expect(order.statusHistory.length).toBe(1);
    });

    it('should charge standard delivery fee when subtotal is below threshold', async () => {
      const res = await request(app)
        .post('/api/orders')
        .send({
          customerName: 'Guest User',
          customerPhone: '555-000-1111',
          deliveryAddress: 'Guest Street 1',
          items: [{ menuItemId: burgerItem._id, quantity: 1 }], // $15
          autoSimulate: false
        });

      expect(res.statusCode).toBe(201);
      const order = res.body.data.order;
      expect(order.subtotal).toBe(15.00);
      expect(order.deliveryFee).toBe(3.99);
      expect(order.tax).toBe(1.20); // 15 * 0.08
      expect(order.totalAmount).toBe(20.19);
    });

    it('should fail validation when delivery details are missing', async () => {
      const res = await request(app)
        .post('/api/orders')
        .send({
          // Missing customerName, customerPhone, deliveryAddress
          items: [{ menuItemId: burgerItem._id, quantity: 1 }]
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.errors.length).toBeGreaterThanOrEqual(3);
    });

    it('should fail validation when cart is empty', async () => {
      const res = await request(app)
        .post('/api/orders')
        .send({
          customerName: 'Test',
          customerPhone: '555-1234',
          deliveryAddress: '123 St',
          items: []
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  describe('GET /api/orders/:id (Retrieve Order Status)', () => {
    it('should retrieve order details by order ID', async () => {
      const order = await Order.create({
        customerName: 'David Miller',
        customerPhone: '+1 555-0144',
        deliveryAddress: '100 Sunset Blvd',
        items: [{
          menuItem: burgerItem._id,
          name: burgerItem.name,
          price: burgerItem.price,
          quantity: 1
        }],
        subtotal: 15,
        deliveryFee: 3.99,
        tax: 1.20,
        totalAmount: 20.19,
        status: 'Order Received'
      });

      const res = await request(app).get(`/api/orders/${order._id}`);
      expect(res.statusCode).toBe(200);
      expect(res.body.data.order._id).toBe(order._id.toString());
      expect(res.body.data.order.status).toBe('Order Received');
    });

    it('should return 404 for non-existent order ID', async () => {
      const fakeId = '507f1f77bcf86cd799439011';
      const res = await request(app).get(`/api/orders/${fakeId}`);
      expect(res.statusCode).toBe(404);
    });
  });

  describe('PATCH /api/orders/:id/status (Status Updates)', () => {
    let order;

    beforeEach(async () => {
      order = await Order.create({
        customerName: 'David Miller',
        customerPhone: '+1 555-0144',
        deliveryAddress: '100 Sunset Blvd',
        items: [{
          menuItem: burgerItem._id,
          name: burgerItem.name,
          price: burgerItem.price,
          quantity: 1
        }],
        subtotal: 15,
        deliveryFee: 3.99,
        tax: 1.20,
        totalAmount: 20.19,
        status: 'Order Received'
      });
    });

    it('should allow admin to update order status to "Preparing"', async () => {
      const res = await request(app)
        .patch(`/api/orders/${order._id}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          status: 'Preparing',
          note: 'Chef is baking the burger bun'
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.data.order.status).toBe('Preparing');
      expect(res.body.data.order.statusHistory.length).toBe(2);
      expect(res.body.data.order.statusHistory[1].status).toBe('Preparing');
    });

    it('should reject invalid status string', async () => {
      const res = await request(app)
        .patch(`/api/orders/${order._id}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          status: 'NonExistentStatus'
        });

      expect(res.statusCode).toBe(400);
    });

    it('should reject status update from unauthorized customer', async () => {
      const res = await request(app)
        .patch(`/api/orders/${order._id}/status`)
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          status: 'Delivered'
        });

      expect(res.statusCode).toBe(403);
    });
  });

  describe('POST /api/orders/:id/simulate (Simulate Progression)', () => {
    it('should advance order status to the next sequential stage', async () => {
      const order = await Order.create({
        customerName: 'Demo Tester',
        customerPhone: '555-999-8888',
        deliveryAddress: 'Demo Lane',
        items: [{
          menuItem: burgerItem._id,
          name: burgerItem.name,
          price: burgerItem.price,
          quantity: 1
        }],
        subtotal: 15,
        deliveryFee: 3.99,
        tax: 1.20,
        totalAmount: 20.19,
        status: 'Order Received'
      });

      // 1st step: Order Received -> Preparing
      const step1 = await request(app).post(`/api/orders/${order._id}/simulate`);
      expect(step1.statusCode).toBe(200);
      expect(step1.body.data.newStatus).toBe('Preparing');

      // 2nd step: Preparing -> Out for Delivery
      const step2 = await request(app).post(`/api/orders/${order._id}/simulate`);
      expect(step2.statusCode).toBe(200);
      expect(step2.body.data.newStatus).toBe('Out for Delivery');

      // 3rd step: Out for Delivery -> Delivered
      const step3 = await request(app).post(`/api/orders/${order._id}/simulate`);
      expect(step3.statusCode).toBe(200);
      expect(step3.body.data.newStatus).toBe('Delivered');
    });
  });
});
