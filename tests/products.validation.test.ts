import { describe, expect, it } from 'vitest';
import { buildApp } from 'app.js';
import { createMemoryRepository } from 'lib/repository.js';

describe('Product catalog API — validation and errors', () => {
  it('rejects invalid UUID in path with 400', async () => {
    const app = buildApp(createMemoryRepository(), { logger: false });
    const res = await app.inject({
      method: 'GET',
      url: '/api/products/not-a-uuid',
    });
    expect(res.statusCode).toBe(400);
    expect(JSON.parse(res.body).message).toContain('UUID');
  });

  it('rejects POST when price is not positive', async () => {
    const app = buildApp(createMemoryRepository(), { logger: false });
    const res = await app.inject({
      method: 'POST',
      url: '/api/products',
      payload: {
        name: 'A',
        description: 'B',
        price: 0,
        category: 'books',
        inStock: false,
      },
    });
    expect(res.statusCode).toBe(400);
  });

  it('returns 404 for unknown routes', async () => {
    const app = buildApp(createMemoryRepository(), { logger: false });
    const res = await app.inject({
      method: 'GET',
      url: '/some-non/existing/resource',
    });
    expect(res.statusCode).toBe(404);
    expect(JSON.parse(res.body).message).toBeTruthy();
  });
});
