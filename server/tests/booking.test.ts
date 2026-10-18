import request from 'supertest';
import { createApp } from '../src/app';
import { resetDb, seedFixture, futureSlotIso } from './helpers';

const app = createApp();

async function login(email: string): Promise<string> {
  const res = await request(app).post('/auth/login').send({ email, password: 'Password123!' });
  return res.body.token as string;
}

beforeEach(async () => {
  await resetDb();
});

describe('appointment booking', () => {
  it('books an available slot', async () => {
    const f = await seedFixture();
    const token = await login(f.customer.email);
    const startIso = futureSlotIso();
    const res = await request(app)
      .post('/appointments')
      .set('authorization', `Bearer ${token}`)
      .send({ businessId: f.barber.id, serviceId: f.service.id, startIso });
    expect(res.status).toBe(201);
    expect(res.body.appointment.status).toBe('PENDING');
    expect(res.body.appointment.priceMillimes).toBe(15000);
  });

  it('prevents a second booking of the same slot (capacity 1)', async () => {
    const f = await seedFixture();
    const t1 = await login(f.customer.email);
    const t2 = await login(f.customer2.email);
    const startIso = futureSlotIso();

    const first = await request(app)
      .post('/appointments')
      .set('authorization', `Bearer ${t1}`)
      .send({ businessId: f.barber.id, serviceId: f.service.id, startIso });
    expect(first.status).toBe(201);

    const second = await request(app)
      .post('/appointments')
      .set('authorization', `Bearer ${t2}`)
      .send({ businessId: f.barber.id, serviceId: f.service.id, startIso });
    expect(second.status).toBe(409);
    expect(second.body.code).toBe('SLOT_TAKEN');
  });

  it('allows the slot again after the first booking is cancelled', async () => {
    const f = await seedFixture();
    const t1 = await login(f.customer.email);
    const startIso = futureSlotIso();
    const first = await request(app)
      .post('/appointments').set('authorization', `Bearer ${t1}`)
      .send({ businessId: f.barber.id, serviceId: f.service.id, startIso });
    await request(app).post(`/appointments/${first.body.appointment.id}/cancel`).set('authorization', `Bearer ${t1}`);

    const t2 = await login(f.customer2.email);
    const retry = await request(app)
      .post('/appointments').set('authorization', `Bearer ${t2}`)
      .send({ businessId: f.barber.id, serviceId: f.service.id, startIso });
    expect(retry.status).toBe(201);
  });

  it('rejects a past slot', async () => {
    const f = await seedFixture();
    const token = await login(f.customer.email);
    const past = new Date(Date.now() - 3600_000).toISOString();
    const res = await request(app)
      .post('/appointments').set('authorization', `Bearer ${token}`)
      .send({ businessId: f.barber.id, serviceId: f.service.id, startIso: past });
    expect(res.status).toBe(400);
  });

  it('exposes slots that reflect existing bookings', async () => {
    const f = await seedFixture();
    const t1 = await login(f.customer.email);
    const startIso = futureSlotIso();
    await request(app).post('/appointments').set('authorization', `Bearer ${t1}`)
      .send({ businessId: f.barber.id, serviceId: f.service.id, startIso });

    const date = startIso.slice(0, 10);
    const slots = await request(app).get(`/businesses/${f.barber.id}/slots?serviceId=${f.service.id}&date=${date}`);
    expect(slots.status).toBe(200);
    const booked = slots.body.days[0].slots.find((s: { startIso: string }) => s.startIso === startIso);
    // The booked slot should now be unavailable (capacity 1).
    expect(booked?.available).toBe(false);
  });
});
