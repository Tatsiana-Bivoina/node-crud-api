import Fastify from 'fastify';
import type { ProductRepository } from 'lib/repository.js';
import { productsRoutesPlugin } from 'routes/products.js';

export type BuildAppOptions = {
  logger?: boolean;
};

export function buildApp(
  repo: ProductRepository,
  options: BuildAppOptions = {},
) {
  const app = Fastify({
    logger: options.logger ?? true,
  });

  app.register(productsRoutesPlugin, {
    prefix: '/api',
    repo,
  });

  app.setNotFoundHandler((_request, reply) => {
    reply.status(404).send({
      message: 'The requested resource was not found',
    });
  });

  app.setErrorHandler((error, _request, reply) => {
    if (reply.sent) {
      return;
    }
    app.log.error(error);
    reply.status(500).send({
      message:
        'Something went wrong on the server while processing your request.',
    });
  });

  return app;
}
