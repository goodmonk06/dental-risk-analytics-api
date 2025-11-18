import { z } from 'zod';

export const createClinicSchema = z.object({
  name: z.string().min(1, 'Clinic name is required').max(200),
  code: z.string().min(1).max(50),
  email: z.string().email().optional(),
  phone: z.string().max(50).optional(),
  address: z.string().max(500).optional(),
  city: z.string().max(100).optional(),
  state: z.string().max(100).optional(),
  zipCode: z.string().max(20).optional(),
  country: z.string().max(100).default('Japan'),
  website: z.string().url().optional(),
  settings: z.record(z.any()).optional(),
});

export const updateClinicSchema = createClinicSchema.partial();

export const clinicIdSchema = z.object({
  id: z.string().regex(/^\d+$/).transform(Number),
});

export type CreateClinicInput = z.infer<typeof createClinicSchema>;
export type UpdateClinicInput = z.infer<typeof updateClinicSchema>;
