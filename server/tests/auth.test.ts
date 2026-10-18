import request from 'supertest';
import { createApp } from '../src/app';
import { resetDb, seedFixture } from './helpers';

const app = createApp();

beforeEach(async () => {
  await resetDb();
});

describe('authentication', () => {
  it('registers a customer and returns a token + role', async () => {
    const res = await request(app).post('/auth/register').send({
      fullName: 'Amel Test',
      email: 'amel@test.local',
      phone: '20123456',
      password: 'Password123!',
    });
    expect(res.status).toBe(201);
    expect(res.body.token).toBeTruthy();
    expect(res.body.user.role).toBe('CUSTOMER');
  });

  it('never allows self-registration as ADMIN', async () => {
    const res = await request(app).post('/auth/register').send({
      fullName: 'Hacker',
      email: 'hacker@test.local',
      phone: '20123456',
      password: 'Password123!',
      role: 'ADMIN',
    });
    expect(res.status).toBe(400); // role enum rejects ADMIN
  });

  it('rejects duplicate email', async () => {
    const body = { fullName: 'Ali Dup', email: 'dup@test.local', phone: '20123456', password: 'Password123!' };
    await request(app).post('/auth/register').send(body);
    const res = await request(app).post('/auth/register').send(body);
    expect(res.status).toBe(409);
    expect(res.body.code).toBe('EMAIL_TAKEN');
  });

  it('logs in with correct credentials and reads the real role from the backend', async () => {
    const { merchant } = await seedFixture();
    const res = await request(app).post('/auth/login').send({ email: merchant.email, password: 'Password123!' });
    expect(res.status).toBe(200);
    expect(res.body.user.role).toBe('MERCHANT');
  });

  it('rejects invalid credentials', async () => {
    await seedFixture();
    const res = await request(app).post('/auth/login').send({ email: 'c1@test.local', password: 'wrong' });
    expect(res.status).toBe(401);
  });

  it('rejects /auth/me without a token', async () => {
    const res = await request(app).get('/auth/me');
    expect(res.status).toBe(401);
  });

  it('suspended user cannot authenticate', async () => {
    const { customer } = await seedFixture();
    const { prisma } = await import('../src/prisma');
    await prisma.user.update({ where: { id: customer.id }, data: { suspended: true } });
    const res = await request(app).post('/auth/login').send({ email: customer.email, password: 'Password123!' });
    expect(res.status).toBe(403);
  });
});
