import { describe, it, expect } from '@jest/globals';
import request from 'supertest';
import app from '../../src/app';

describe('API: Admin Authentication Flow', () => {
  it('POST /api/v1/auth/admin-login should successfully authenticate admin@gmail.com', async () => {
    const res = await request(app)
      .post('/api/v1/auth/admin-login')
      .send({
        email: 'admin@gmail.com',
        password: 'Admin@1234'
      })
      .set('Accept', 'application/json');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('session');
    expect(res.body.data).toHaveProperty('profile');
    expect(res.body.data.session).toHaveProperty('access_token');
    expect(res.body.data.profile.role).toBe('admin');
  });

  it('POST /api/v1/auth/admin-login should reject invalid passwords with 401', async () => {
    const res = await request(app)
      .post('/api/v1/auth/admin-login')
      .send({
        email: 'admin@gmail.com',
        password: 'WrongPassword123'
      })
      .set('Accept', 'application/json');

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe('Invalid email or password');
  });
});
