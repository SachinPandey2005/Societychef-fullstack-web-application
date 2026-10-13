import { describe, it, expect } from '@jest/globals';
import request from 'supertest';
import app from '../../src/app';

describe('API: CORS Policy Verification', () => {
  it('should allow requests from CRM origin https://societychef-crm.onrender.com with credentials', async () => {
    const res = await request(app)
      .options('/api/v1/auth/admin-login')
      .set('Origin', 'https://societychef-crm.onrender.com')
      .set('Access-Control-Request-Method', 'POST')
      .set('Access-Control-Request-Headers', 'Content-Type, Authorization');

    expect(res.headers['access-control-allow-origin']).toBe('https://societychef-crm.onrender.com');
    expect(res.headers['access-control-allow-credentials']).toBe('true');
    expect(res.status).toBe(200);
  });

  it('should allow requests from admin origin https://admin.societychef.com', async () => {
    const res = await request(app)
      .options('/api/v1/auth/admin-login')
      .set('Origin', 'https://admin.societychef.com')
      .set('Access-Control-Request-Method', 'POST');

    expect(res.headers['access-control-allow-origin']).toBe('https://admin.societychef.com');
    expect(res.headers['access-control-allow-credentials']).toBe('true');
  });

  it('should allow requests from local origins http://localhost:5173 and http://localhost:3000', async () => {
    const res5173 = await request(app)
      .options('/api/v1/auth/admin-login')
      .set('Origin', 'http://localhost:5173')
      .set('Access-Control-Request-Method', 'POST');

    expect(res5173.headers['access-control-allow-origin']).toBe('http://localhost:5173');

    const res3000 = await request(app)
      .options('/api/v1/auth/admin-login')
      .set('Origin', 'http://localhost:3000')
      .set('Access-Control-Request-Method', 'POST');

    expect(res3000.headers['access-control-allow-origin']).toBe('http://localhost:3000');
  });

  it('should reject requests from unauthorized origins', async () => {
    const res = await request(app)
      .options('/api/v1/auth/admin-login')
      .set('Origin', 'https://malicious-site.com')
      .set('Access-Control-Request-Method', 'POST');

    expect(res.headers['access-control-allow-origin']).toBeUndefined();
  });

  it('should handle GET requests with correct Access-Control-Allow-Origin header for CRM', async () => {
    const res = await request(app)
      .get('/health')
      .set('Origin', 'https://societychef-crm.onrender.com');

    expect(res.headers['access-control-allow-origin']).toBe('https://societychef-crm.onrender.com');
    expect(res.headers['access-control-allow-credentials']).toBe('true');
  });
});
