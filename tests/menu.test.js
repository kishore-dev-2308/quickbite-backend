const request = require('supertest');
const app = require('../src/app');
const MenuItem = require('../src/models/MenuItem');
const User = require('../src/models/User');
const { ROLES } = require('../src/config/constants');

describe('Menu API Endpoints', () => {
  let adminToken;
  let customerToken;
  let sampleItem;

  beforeEach(async () => {
    // Create admin user
    const admin = await User.create({
      name: 'Chef Admin',
      email: 'admin@test.com',
      password: 'password123',
      role: ROLES.ADMIN
    });

    const adminLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@test.com', password: 'password123' });
    adminToken = adminLogin.body.data.token;

    // Create customer user
    const customer = await User.create({
      name: 'Regular Customer',
      email: 'cust@test.com',
      password: 'password123',
      role: ROLES.CUSTOMER
    });

    const custLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: 'cust@test.com', password: 'password123' });
    customerToken = custLogin.body.data.token;

    // Seed sample menu item
    sampleItem = await MenuItem.create({
      name: 'Classic Margherita',
      description: 'Classic cheese and basil pizza',
      price: 12.99,
      image: 'https://images.unsplash.com/photo-1513104890138-7c749659a591',
      category: 'Pizza'
    });

    await MenuItem.create({
      name: 'Double Cheeseburger',
      description: 'Juicy beef patties with cheddar',
      price: 11.50,
      image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd',
      category: 'Burger'
    });
  });

  describe('GET /api/menu', () => {
    it('should retrieve all menu items', async () => {
      const res = await request(app).get('/api/menu');
      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBe(2);
    });

    it('should filter menu items by category', async () => {
      const res = await request(app).get('/api/menu?category=Pizza');
      expect(res.statusCode).toBe(200);
      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0].name).toBe('Classic Margherita');
    });

    it('should search menu items by keyword', async () => {
      const res = await request(app).get('/api/menu?search=Cheeseburger');
      expect(res.statusCode).toBe(200);
      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0].category).toBe('Burger');
    });
  });

  describe('POST /api/menu (Admin Protected)', () => {
    it('should allow admin to create a new menu item', async () => {
      const res = await request(app)
        .post('/api/menu')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Crispy Onion Rings',
          description: 'Crunchy golden onion rings with dip',
          price: 6.99,
          image: 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877',
          category: 'Sides'
        });

      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe('Crispy Onion Rings');
    });

    it('should deny non-admin users from creating menu items with 403', async () => {
      const res = await request(app)
        .post('/api/menu')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          name: 'Hacker Pizza',
          description: 'Not allowed',
          price: 9.99,
          image: 'https://images.unsplash.com/photo-1513104890138-7c749659a591',
          category: 'Pizza'
        });

      expect(res.statusCode).toBe(403);
    });
  });
});
