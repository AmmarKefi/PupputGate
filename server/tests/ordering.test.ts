import request from 'supertest';
import { createApp } from '../src/app';
import { resetDb, seedFixture } from './helpers';

const app = createApp();
async function login(email: string): Promise<string> {
  const res = await request(app).post('/auth/login').send({ email, password: 'Password123!' });
  return res.body.token as string;
}
beforeEach(async () => {
  await resetDb();
});

describe('orders & stock', () => {
  it('reserves a unique piece once; a second active reservation is blocked', async () => {
    const f = await seedFixture();
    const t1 = await login(f.customer.email);
    const t2 = await login(f.customer2.email);

    const first = await request(app).post('/orders').set('authorization', `Bearer ${t1}`)
      .send({ businessId: f.dar.id, lines: [{ productId: f.unique.id, quantity: 1 }] });
    expect(first.status).toBe(201);

    const second = await request(app).post('/orders').set('authorization', `Bearer ${t2}`)
      .send({ businessId: f.dar.id, lines: [{ productId: f.unique.id, quantity: 1 }] });
    expect(second.status).toBe(409);
    expect(second.body.code).toBe('UNIQUE_TAKEN');
  });

  it('allows re-reserving a unique piece after the first order is cancelled', async () => {
    const f = await seedFixture();
    const t1 = await login(f.customer.email);
    const first = await request(app).post('/orders').set('authorization', `Bearer ${t1}`)
      .send({ businessId: f.dar.id, lines: [{ productId: f.unique.id, quantity: 1 }] });
    await request(app).post(`/orders/${first.body.order.id}/cancel`).set('authorization', `Bearer ${t1}`);

    const t2 = await login(f.customer2.email);
    const retry = await request(app).post('/orders').set('authorization', `Bearer ${t2}`)
      .send({ businessId: f.dar.id, lines: [{ productId: f.unique.id, quantity: 1 }] });
    expect(retry.status).toBe(201);
  });

  it('rejects quantity > 1 for a unique piece', async () => {
    const f = await seedFixture();
    const t1 = await login(f.customer.email);
    const res = await request(app).post('/orders').set('authorization', `Bearer ${t1}`)
      .send({ businessId: f.dar.id, lines: [{ productId: f.unique.id, quantity: 2 }] });
    expect(res.status).toBe(400);
  });

  it('decrements in-stock quantity and blocks overselling', async () => {
    const f = await seedFixture(); // inStock qty = 2
    const t1 = await login(f.customer.email);

    const ok = await request(app).post('/orders').set('authorization', `Bearer ${t1}`)
      .send({ businessId: f.dar.id, lines: [{ productId: f.inStock.id, quantity: 2 }] });
    expect(ok.status).toBe(201);
    expect(ok.body.order.totalMillimes).toBe(70000);

    const over = await request(app).post('/orders').set('authorization', `Bearer ${t1}`)
      .send({ businessId: f.dar.id, lines: [{ productId: f.inStock.id, quantity: 1 }] });
    expect(over.status).toBe(409);
    expect(over.body.code).toBe('INSUFFICIENT_STOCK');
  });

  it('merchant transitions an order and stock is restored on reject', async () => {
    const f = await seedFixture();
    const tc = await login(f.customer.email);
    const order = await request(app).post('/orders').set('authorization', `Bearer ${tc}`)
      .send({ businessId: f.dar.id, lines: [{ productId: f.inStock.id, quantity: 1 }] });

    const ta = await login(f.artisan.email);
    const rejected = await request(app)
      .post(`/merchant/orders/${order.body.order.id}/transition`)
      .set('authorization', `Bearer ${ta}`)
      .send({ to: 'REJECTED' });
    expect(rejected.status).toBe(200);

    const { prisma } = await import('../src/prisma');
    const product = await prisma.product.findUnique({ where: { id: f.inStock.id } });
    expect(product?.stockQty).toBe(2); // restored
  });
});
