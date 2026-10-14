const request = require('supertest');
const app = require('../src/app');
const User = require('../src/models/User');

describe('Auth API Endpoints', () => {
  describe('POST /api/auth/register', () => {
    it('should register a new user successfully and return token', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Sarah Connor',
          email: 'sarah@example.com',
          password: 'password123',
          phone: '+1 555-4321',
          address: '42 Skynet Blvd'
        });

      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.email).toBe('sarah@example.com');
      expect(res.body.data.token).toBeDefined();

      const userInDb = await User.findOne({ email: 'sarah@example.com' });
      expect(userInDb).not.toBeNull();
      expect(userInDb.password).not.toBe('password123'); // Password must be hashed
    });

    it('should reject registration if email is already taken', async () => {
      await User.create({
        name: 'Existing User',
        email: 'duplicate@example.com',
        password: 'password123'
      });

      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'New Person',
          email: 'duplicate@example.com',
          password: 'newpassword123'
        });

      expect(res.statusCode).toBe(409);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/already exists/i);
    });

    it('should fail validation with invalid email format', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Sarah',
          email: 'not-an-email',
          password: 'password123'
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.errors).toBeDefined();
    });
  });

  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      await User.create({
        name: 'Login Test',
        email: 'test@quickbite.com',
        password: 'correctpassword'
      });
    });

    it('should login successfully with valid credentials', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@quickbite.com',
          password: 'correctpassword'
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.token).toBeDefined();
      expect(res.body.data.user.email).toBe('test@quickbite.com');
    });

    it('should reject login with wrong password', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@quickbite.com',
          password: 'wrongpassword'
        });

      expect(res.statusCode).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });

  describe('GET /api/auth/me', () => {
    it('should return user profile when valid bearer token is provided', async () => {
      const registerRes = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Profile User',
          email: 'profile@example.com',
          password: 'password123'
        });

      const token = registerRes.body.data.token;

      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.email).toBe('profile@example.com');
    });

    it('should return 401 when token is missing', async () => {
      const res = await request(app).get('/api/auth/me');
      expect(res.statusCode).toBe(401);
    });
  });
});
