import 'dotenv/config';
import { buildApp } from 'app.js';
import { createIpcProductRepository } from 'lib/ipc-repository.js';
import { createMemoryRepository } from 'lib/repository.js';

export async function startWorkerServer() {
  const workerPortEnv = process.env.WORKER_PORT;
  const port = workerPortEnv ? Number(workerPortEnv) : Number(process.env.PORT);
  if (!Number.isFinite(port) || port <= 0) {
    throw new Error(
      'WORKER_PORT or PORT must be set to a positive number in the environment',
    );
  }

  const useIpc = process.env.CLUSTER_WORKER === '1';
  const repo = useIpc ? createIpcProductRepository() : createMemoryRepository();
  const app = buildApp(repo, {
    logger: useIpc ? false : true,
  });

  await app.listen({ port, host: '0.0.0.0' });
  return app;
}
