import * as z from 'zod';

export const uuidParamSchema = z.uuid();

export const createProductBodySchema = z.object({
  name: z.string().trim().min(1, 'name is required'),
  description: z.string().trim().min(1, 'description is required'),
  price: z.number().positive('price must be a positive number'),
  category: z.string().trim().min(1, 'category is required'),
  inStock: z.boolean(),
});

export const updateProductBodySchema = createProductBodySchema;

export const patchProductBodySchema = createProductBodySchema
  .partial()
  .refine(
    (body) => Object.keys(body).length > 0,
    'at least one field must be provided',
  );

export type CreateProductBody = z.infer<typeof createProductBodySchema>;
export type UpdateProductBody = z.infer<typeof updateProductBodySchema>;
export type PatchProductBody = z.infer<typeof patchProductBodySchema>;

export type Product = CreateProductBody & { id: string };
