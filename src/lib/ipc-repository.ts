import { randomUUID } from 'node:crypto';
import type {
  CreateProductBody,
  PatchProductBody,
  Product,
} from 'lib/product-schema.js';
import type { ProductRepository } from 'lib/repository.js';
import type { DbRequest, DbResponse } from 'lib/cluster-store.js';

type Pending = {
  resolve: (value: unknown) => void;
  reject: (reason?: unknown) => void;
};

function getSend() {
  const send = process.send?.bind(process);
  if (!send) {
    throw new Error('IPC is not available in this process');
  }
  return send;
}

export function createIpcProductRepository(): ProductRepository {
  const pending = new Map<string, Pending>();
  const send = getSend();

  process.on('message', (message: unknown) => {
    if (
      !message ||
      typeof message !== 'object' ||
      !('type' in message) ||
      (message as { type: string }).type !== 'db-res'
    ) {
      return;
    }
    const msg = message as { type: 'db-res'; id: string; result: DbResponse };
    const entry = pending.get(msg.id);
    if (!entry) return;
    pending.delete(msg.id);
    if (msg.result.ok) {
      entry.resolve(msg.result.data);
    } else {
      const err = Object.assign(new Error(msg.result.message), {
        statusCode: msg.result.statusCode,
      });
      entry.reject(err);
    }
  });

  function request(payload: DbRequest): Promise<unknown> {
    const id = randomUUID();
    return new Promise((resolve, reject) => {
      pending.set(id, { resolve, reject });
      send({ type: 'db-req', id, payload });
    });
  }

  return {
    async findAll() {
      return (await request({ op: 'findAll' })) as Product[];
    },
    async findById(id: string) {
      const data = (await request({ op: 'findById', id })) as Product | null;
      return data ?? undefined;
    },
    async create(input: CreateProductBody) {
      return (await request({ op: 'create', input })) as Product;
    },
    async update(id: string, input: CreateProductBody) {
      try {
        return (await request({ op: 'update', id, input })) as Product;
      } catch (e) {
        if (
          e instanceof Error &&
          'statusCode' in e &&
          (e as { statusCode: number }).statusCode === 404
        ) {
          return undefined;
        }
        throw e;
      }
    },
    async patch(id: string, input: PatchProductBody) {
      try {
        return (await request({ op: 'patch', id, input })) as Product;
      } catch (e) {
        if (
          e instanceof Error &&
          'statusCode' in e &&
          (e as { statusCode: number }).statusCode === 404
        ) {
          return undefined;
        }
        throw e;
      }
    },
    async delete(id: string) {
      try {
        await request({ op: 'delete', id });
        return true;
      } catch (e) {
        if (
          e instanceof Error &&
          'statusCode' in e &&
          (e as { statusCode: number }).statusCode === 404
        ) {
          return false;
        }
        throw e;
      }
    },
  };
}
