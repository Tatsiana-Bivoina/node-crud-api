import 'dotenv/config';
import { buildApp } from 'app.js';
import { createMemoryRepository } from 'lib/repository.js';

const port = Number(process.env.PORT ?? 4000);
if (!Number.isFinite(port) || port <= 0) {
  throw new Error('PORT must be set to a positive number in the environment');
}

const repo = createMemoryRepository();
const app = buildApp(repo, { logger: true });

try {
  await app.listen({ port, host: '0.0.0.0' });
} catch (err) {
  app.log.error(err);
  process.exit(1);
}
