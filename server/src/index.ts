import { createApp } from './app';
import { env } from './env';
import { prisma } from './prisma';

const app = createApp();

const server = app.listen(env.port, () => {
  // eslint-disable-next-line no-console
  console.log(`PupputGate API listening on http://0.0.0.0:${env.port}`);
  // eslint-disable-next-line no-console
  console.log('Tip: on a physical device, the app reaches this via your LAN IP.');
});

async function shutdown() {
  server.close();
  await prisma.$disconnect();
  process.exit(0);
}
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
