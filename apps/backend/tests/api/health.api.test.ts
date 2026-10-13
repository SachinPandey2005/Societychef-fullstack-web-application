import { describe, it, expect } from '@jest/globals';
import request from 'supertest';
import app from '../../src/app';

describe('API: Health Check', () => {
  it('GET /api/v1/health should return 200 UP', async () => {
    const res = await request(app).get('/api/v1/health');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('status', 'UP');
    expect(res.body.services.database).toBe('UP');
  });
});
