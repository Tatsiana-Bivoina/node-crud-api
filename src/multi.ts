import 'dotenv/config';
import cluster from 'node:cluster';
import { availableParallelism } from 'node:os';
import { createRoundRobinBalancer } from 'balancer.js';
import {
  createClusterPrimaryStore,
  wireWorkerDbMessages,
} from 'lib/cluster-store.js';

const basePort = Number(process.env.PORT ?? 4000);
if (!Number.isFinite(basePort) || basePort <= 0) {
  throw new Error('PORT must be set to a positive number in the environment');
}

const workerCount = Math.max(1, availableParallelism() - 1);
const workerPorts = Array.from(
  { length: workerCount },
  (_, index) => basePort + 1 + index,
);

if (cluster.isPrimary) {
  const store = createClusterPrimaryStore();

  for (let i = 0; i < workerCount; i++) {
    const worker = cluster.fork({
      CLUSTER_WORKER: '1',
      WORKER_PORT: String(workerPorts[i]),
    });
    wireWorkerDbMessages(worker, store);
  }

  createRoundRobinBalancer(basePort, workerPorts);

  process.stdout.write(
    `Load balancer: http://127.0.0.1:${basePort}/api — workers: ${workerPorts.map((p) => `http://127.0.0.1:${p}/api`).join(', ')}\n`,
  );
} else {
  const { startWorkerServer } = await import('worker-server.js');
  await startWorkerServer();
}
