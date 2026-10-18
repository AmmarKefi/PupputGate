import { prisma } from '../src/prisma';

// Ensure tests never run against a non-test database by accident.
beforeAll(() => {
  const url = process.env.DATABASE_URL ?? '';
  if (!/test/i.test(url)) {
    throw new Error(
      'Refusing to run tests: DATABASE_URL must point to a *test* database ' +
        '(its name should contain "test"). See server/README/testing notes.',
    );
  }
});

afterAll(async () => {
  await prisma.$disconnect();
});
