import { randomUUID } from 'node:crypto';
import type {
  CreateProductBody,
  PatchProductBody,
  Product,
} from 'lib/product-schema.js';

export interface ProductRepository {
  findAll(): Promise<Product[]>;
  findById(id: string): Promise<Product | undefined>;
  create(input: CreateProductBody): Promise<Product>;
  update(id: string, input: CreateProductBody): Promise<Product | undefined>;
  patch(id: string, input: PatchProductBody): Promise<Product | undefined>;
  delete(id: string): Promise<boolean>;
}

export function createMemoryRepository(): ProductRepository {
  const store = new Map<string, Product>();

  return {
    async findAll() {
      return [...store.values()];
    },
    async findById(id: string) {
      return store.get(id);
    },
    async create(input: CreateProductBody) {
      const product: Product = { id: randomUUID(), ...input };
      store.set(product.id, product);
      return product;
    },
    async update(id: string, input: CreateProductBody) {
      if (!store.has(id)) return undefined;
      const updated: Product = { id, ...input };
      store.set(id, updated);
      return updated;
    },
    async patch(id: string, input: PatchProductBody) {
      const existing = store.get(id);
      if (!existing) return undefined;
      const updated: Product = { ...existing, ...input, id };
      store.set(id, updated);
      return updated;
    },
    async delete(id: string) {
      return store.delete(id);
    },
  };
}
