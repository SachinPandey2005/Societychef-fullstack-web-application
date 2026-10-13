import request from 'supertest';
import app from '../app';
import { SessionService } from '../services/session.service';

describe('Authentication & Two-Account Identity Isolation Tests', () => {
  const phoneA = '+919876543210';
  const phoneB = '+919123456789';
  const testOtp6 = '123456';
  const testOtp5 = '12345';

  let tokenA: string;
  let tokenB: string;
  let userAId: string;
  let userBId: string;

  it('1. Should send and verify 6-digit test OTP for Phone A', async () => {
    const sendRes = await request(app)
      .post('/api/v1/auth/send-otp')
      .send({ phone: phoneA });

    expect(sendRes.status).toBe(200);
    expect(sendRes.body.success).toBe(true);

    const verifyRes = await request(app)
      .post('/api/v1/auth/verify-otp')
      .send({ phone: phoneA, token: testOtp6 });

    expect(verifyRes.status).toBe(200);
    expect(verifyRes.body.success).toBe(true);
    expect(verifyRes.body.data.session).toBeDefined();

    tokenA = verifyRes.body.data.session.access_token;
    userAId = verifyRes.body.data.session.user.id;

    expect(tokenA).toBeDefined();
    expect(userAId).toBe('00000000-0000-4000-8000-919876543210');
  });

  it('2. Should verify 5-digit test OTP for backwards compatibility', async () => {
    const verifyRes = await request(app)
      .post('/api/v1/auth/verify-otp')
      .send({ phone: phoneA, token: testOtp5 });

    expect(verifyRes.status).toBe(200);
    expect(verifyRes.body.success).toBe(true);
  });

  it('3. Should send and verify 6-digit test OTP for Phone B with isolated identity', async () => {
    const verifyRes = await request(app)
      .post('/api/v1/auth/verify-otp')
      .send({ phone: phoneB, token: testOtp6 });

    expect(verifyRes.status).toBe(200);
    expect(verifyRes.body.success).toBe(true);

    tokenB = verifyRes.body.data.session.access_token;
    userBId = verifyRes.body.data.session.user.id;

    expect(tokenB).toBeDefined();
    expect(userBId).toBe('00000000-0000-4000-8000-919123456789');
    expect(userAId).not.toEqual(userBId);
  });

  it('4. Should return User A profile when authenticated with Token A', async () => {
    const meRes = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${tokenA}`);

    expect(meRes.status).toBe(200);
    expect(meRes.body.data.id).toBe(userAId);
    expect(meRes.body.data.phone).toBe(phoneA);
  });

  it('5. Should return User B profile when authenticated with Token B', async () => {
    const meRes = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${tokenB}`);

    expect(meRes.status).toBe(200);
    expect(meRes.body.data.id).toBe(userBId);
    expect(meRes.body.data.phone).toBe(phoneB);
  });

  it('6. Should reject requests with invalid or expired tokens', async () => {
    const invalidRes = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', 'Bearer invalid_garbage_token');

    expect(invalidRes.status).toBe(401);
  });

  it('7. Should revoke session on explicit logout and prevent access', async () => {
    const logoutRes = await request(app)
      .post('/api/v1/auth/logout')
      .set('Authorization', `Bearer ${tokenA}`);

    expect(logoutRes.status).toBe(200);

    const postLogoutMe = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${tokenA}`);

    expect(postLogoutMe.status).toBe(401);
  });
});
