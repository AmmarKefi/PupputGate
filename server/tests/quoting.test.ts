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

async function makeRequest(token: string, businessId: string) {
  return request(app).post('/requests').set('authorization', `Bearer ${token}`).send({
    businessId,
    problemType: 'Fuite',
    description: "Fuite sous l'évier de la cuisine",
    zoneSlug: 'medina',
    address: '10 Rue Privée, Médina',
    urgent: true,
  });
}

describe('quotations & privacy', () => {
  it('runs request → quote → accept and enforces transitions', async () => {
    const f = await seedFixture();
    const tc = await login(f.customer.email);
    const tm = await login(f.merchant.email); // owns plumber

    const req = await makeRequest(tc, f.plumber.id);
    expect(req.status).toBe(201);
    const id = req.body.request.id;

    const quote = await request(app).post(`/merchant/requests/${id}/quote`)
      .set('authorization', `Bearer ${tm}`)
      .send({ amountMillimes: 55000, advanceMillimes: 10000, scope: 'Remplacement joint' });
    expect(quote.status).toBe(200);
    expect(quote.body.request.status).toBe('QUOTE_SENT');
    expect(quote.body.request.quotation.amountMillimes).toBe(55000);

    const accept = await request(app).post(`/requests/${id}/accept`).set('authorization', `Bearer ${tc}`);
    expect(accept.status).toBe(200);
    expect(accept.body.request.status).toBe('ACCEPTED');

    // Accepting again is an illegal transition.
    const again = await request(app).post(`/requests/${id}/accept`).set('authorization', `Bearer ${tc}`);
    expect(again.status).toBe(409);
  });

  it('keeps the private address visible to owner/merchant but hidden from others', async () => {
    const f = await seedFixture();
    const tc = await login(f.customer.email);
    const tm = await login(f.merchant.email);
    const tOther = await login(f.customer2.email);

    const req = await makeRequest(tc, f.plumber.id);
    const id = req.body.request.id;

    const asOwner = await request(app).get(`/requests/${id}`).set('authorization', `Bearer ${tc}`);
    expect(asOwner.body.request.address).toBe('10 Rue Privée, Médina');

    const asMerchant = await request(app).get(`/requests/${id}`).set('authorization', `Bearer ${tm}`);
    expect(asMerchant.body.request.address).toBe('10 Rue Privée, Médina');

    const asOther = await request(app).get(`/requests/${id}`).set('authorization', `Bearer ${tOther}`);
    expect(asOther.status).toBe(403); // unrelated customer cannot even read it
  });

  it('blocks a merchant from quoting a request that is not theirs', async () => {
    const f = await seedFixture();
    const tc = await login(f.customer.email);
    const tArtisan = await login(f.artisan.email); // does NOT own plumber
    const req = await makeRequest(tc, f.plumber.id);
    const res = await request(app).post(`/merchant/requests/${req.body.request.id}/quote`)
      .set('authorization', `Bearer ${tArtisan}`)
      .send({ amountMillimes: 55000 });
    expect(res.status).toBe(403);
  });
});

describe('authorization', () => {
  it('forbids a customer from calling merchant endpoints', async () => {
    const f = await seedFixture();
    const tc = await login(f.customer.email);
    const res = await request(app).get('/merchant/businesses').set('authorization', `Bearer ${tc}`);
    expect(res.status).toBe(403);
  });

  it('forbids a non-admin from admin endpoints', async () => {
    const f = await seedFixture();
    const tm = await login(f.merchant.email);
    const res = await request(app).get('/admin/overview').set('authorization', `Bearer ${tm}`);
    expect(res.status).toBe(403);
  });

  it('prevents an admin from suspending their own account', async () => {
    const f = await seedFixture();
    const ta = await login(f.admin.email);
    const res = await request(app).post(`/admin/users/${f.admin.id}/suspend`).set('authorization', `Bearer ${ta}`);
    expect(res.status).toBe(403);
  });
});
