import { randomUUID } from 'node:crypto';
import type { Worker } from 'node:cluster';
import type { CreateProductBody, PatchProductBody, Product } from 'lib/product-schema.js';

export function createClusterPrimaryStore() {
  const store = new Map<string, Product>();

  return {
    findAll(): Product[] {
      return [...store.values()];
    },
    findById(id: string): Product | undefined {
      return store.get(id);
    },
    create(input: CreateProductBody): Product {
      const product: Product = { id: randomUUID(), ...input };
      store.set(product.id, product);
      return product;
    },
    update(id: string, input: CreateProductBody): Product | undefined {
      if (!store.has(id)) return undefined;
      const updated: Product = { id, ...input };
      store.set(id, updated);
      return updated;
    },
    patch(id: string, input: PatchProductBody): Product | undefined {
      const existing = store.get(id);
      if (!existing) return undefined;
      const updated: Product = { ...existing, ...input, id };
      store.set(id, updated);
      return updated;
    },
    delete(id: string): boolean {
      return store.delete(id);
    },
  };
}

export type DbRequest =
  | { op: 'findAll' }
  | { op: 'findById'; id: string }
  | { op: 'create'; input: CreateProductBody }
  | { op: 'update'; id: string; input: CreateProductBody }
  | { op: 'patch'; id: string; input: PatchProductBody }
  | { op: 'delete'; id: string };

export type DbResponse =
  | { ok: true; data: unknown }
  | { ok: false; statusCode: number; message: string };

export function handleDbRequest(
  store: ReturnType<typeof createClusterPrimaryStore>,
  req: DbRequest,
): DbResponse {
  try {
    switch (req.op) {
      case 'findAll':
        return { ok: true, data: store.findAll() };
      case 'findById': {
        const found = store.findById(req.id);
        return { ok: true, data: found ?? null };
      }
      case 'create':
        return { ok: true, data: store.create(req.input) };
      case 'update': {
        const updated = store.update(req.id, req.input);
        if (!updated) {
          return { ok: false, statusCode: 404, message: 'Product not found' };
        }
        return { ok: true, data: updated };
      }
      case 'patch': {
        const updated = store.patch(req.id, req.input);
        if (!updated) {
          return { ok: false, statusCode: 404, message: 'Product not found' };
        }
        return { ok: true, data: updated };
      }
      case 'delete': {
        const removed = store.delete(req.id);
        if (!removed) {
          return { ok: false, statusCode: 404, message: 'Product not found' };
        }
        return { ok: true, data: null };
      }
      default:
        return {
          ok: false,
          statusCode: 500,
          message: 'Unsupported database operation',
        };
    }
  } catch {
    return {
      ok: false,
      statusCode: 500,
      message: 'Unexpected error while accessing data',
    };
  }
}

export function wireWorkerDbMessages(
  worker: Worker,
  store: ReturnType<typeof createClusterPrimaryStore>,
) {
  worker.on('message', (message: unknown) => {
    if (
      !message ||
      typeof message !== 'object' ||
      !('type' in message) ||
      (message as { type: string }).type !== 'db-req'
    ) {
      return;
    }
    const msg = message as { type: 'db-req'; id: string; payload: DbRequest };
    const result = handleDbRequest(store, msg.payload);
    worker.send({ type: 'db-res', id: msg.id, result });
  });
}
