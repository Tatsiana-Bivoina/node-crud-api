import { describe, expect, it } from 'vitest';
import { buildApp } from 'app.js';
import { createMemoryRepository } from 'lib/repository.js';

const validBody = {
  name: 'Test',
  description: 'Desc',
  price: 10,
  category: 'electronics',
  inStock: true,
};

describe('Product catalog API — full flow', () => {
  it('returns an empty list, then creates, reads, updates, deletes, and finally 404s', async () => {
    const repo = createMemoryRepository();
    const app = buildApp(repo, { logger: false });

    const list0 = await app.inject({ method: 'GET', url: '/api/products' });
    expect(list0.statusCode).toBe(200);
    expect(JSON.parse(list0.body)).toEqual([]);

    const created = await app.inject({
      method: 'POST',
      url: '/api/products',
      payload: validBody,
    });
    expect(created.statusCode).toBe(201);
    const product = JSON.parse(created.body) as {
      id: string;
      name: string;
      price: number;
    };
    expect(product.name).toBe('Test');
    expect(product.price).toBe(10);
    expect(product.id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    );

    const getOne = await app.inject({
      method: 'GET',
      url: `/api/products/${product.id}`,
    });
    expect(getOne.statusCode).toBe(200);
    expect(JSON.parse(getOne.body).id).toBe(product.id);

    const updated = await app.inject({
      method: 'PUT',
      url: `/api/products/${product.id}`,
      payload: { ...validBody, name: 'Updated', price: 20 },
    });
    expect(updated.statusCode).toBe(200);
    const updatedBody = JSON.parse(updated.body);
    expect(updatedBody.id).toBe(product.id);
    expect(updatedBody.name).toBe('Updated');
    expect(updatedBody.price).toBe(20);

    const del = await app.inject({
      method: 'DELETE',
      url: `/api/products/${product.id}`,
    });
    expect(del.statusCode).toBe(204);

    const gone = await app.inject({
      method: 'GET',
      url: `/api/products/${product.id}`,
    });
    expect(gone.statusCode).toBe(404);
  });

  it('PATCH updates only provided fields', async () => {
    const repo = createMemoryRepository();
    const app = buildApp(repo, { logger: false });

    const created = await app.inject({
      method: 'POST',
      url: '/api/products',
      payload: validBody,
    });
    const { id } = JSON.parse(created.body) as { id: string };

    const patched = await app.inject({
      method: 'PATCH',
      url: `/api/products/${id}`,
      payload: { price: 99 },
    });
    expect(patched.statusCode).toBe(200);
    const body = JSON.parse(patched.body) as {
      name: string;
      price: number;
      description: string;
    };
    expect(body.name).toBe('Test');
    expect(body.price).toBe(99);
    expect(body.description).toBe('Desc');
  });
});
