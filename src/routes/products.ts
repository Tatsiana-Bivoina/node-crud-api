import type { FastifyPluginAsync } from 'fastify';
import * as z from 'zod';
import {
  createProductBodySchema,
  patchProductBodySchema,
  uuidParamSchema,
} from 'lib/product-schema.js';
import type { ProductRepository } from 'lib/repository.js';

function formatBodyError(error: z.ZodError) {
  const first = error.issues[0];
  return first?.message ?? 'Invalid request body';
}

function normalizeProductId(raw: string) {
  return raw.trim();
}

export const productsRoutesPlugin: FastifyPluginAsync<{
  repo: ProductRepository;
}> = async (fastify, opts) => {
  const { repo } = opts;

  fastify.get('/products', async () => {
    const products = await repo.findAll();
    return products;
  });

  fastify.get<{ Params: { productId: string } }>(
    '/products/:productId',
    async (request, reply) => {
      const idParse = uuidParamSchema.safeParse(
        normalizeProductId(request.params.productId),
      );
      if (!idParse.success) {
        return reply.status(400).send({
          message: 'product id must be a valid UUID',
        });
      }
      const product = await repo.findById(idParse.data);
      if (!product) {
        return reply.status(404).send({ message: 'Product not found' });
      }
      return product;
    },
  );

  fastify.post('/products', async (request, reply) => {
    const parsed = createProductBodySchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({
        message: formatBodyError(parsed.error),
      });
    }
    const created = await repo.create(parsed.data);
    return reply.status(201).send(created);
  });

  fastify.put<{ Params: { productId: string } }>(
    '/products/:productId',
    async (request, reply) => {
      const idParse = uuidParamSchema.safeParse(
        normalizeProductId(request.params.productId),
      );
      if (!idParse.success) {
        return reply.status(400).send({
          message: 'product id must be a valid UUID',
        });
      }
      const parsed = createProductBodySchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.status(400).send({
          message: formatBodyError(parsed.error),
        });
      }
      const updated = await repo.update(idParse.data, parsed.data);
      if (!updated) {
        return reply.status(404).send({ message: 'Product not found' });
      }
      return updated;
    },
  );

  fastify.patch<{ Params: { productId: string } }>(
    '/products/:productId',
    async (request, reply) => {
      const idParse = uuidParamSchema.safeParse(
        normalizeProductId(request.params.productId),
      );
      if (!idParse.success) {
        return reply.status(400).send({
          message: 'product id must be a valid UUID',
        });
      }
      const parsed = patchProductBodySchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.status(400).send({
          message: formatBodyError(parsed.error),
        });
      }
      const updated = await repo.patch(idParse.data, parsed.data);
      if (!updated) {
        return reply.status(404).send({ message: 'Product not found' });
      }
      return updated;
    },
  );

  fastify.delete<{ Params: { productId: string } }>(
    '/products/:productId',
    async (request, reply) => {
      const idParse = uuidParamSchema.safeParse(
        normalizeProductId(request.params.productId),
      );
      if (!idParse.success) {
        return reply.status(400).send({
          message: 'product id must be a valid UUID',
        });
      }
      const removed = await repo.delete(idParse.data);
      if (!removed) {
        return reply.status(404).send({ message: 'Product not found' });
      }
      return reply.status(204).send();
    },
  );
};
