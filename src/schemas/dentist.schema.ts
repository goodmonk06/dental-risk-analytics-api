import { z } from 'zod';

export const createDentistSchema = z.object({
  clinicId: z.number().int().positive(),
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  email: z.string().email(),
  phone: z.string().max(50).optional(),
  licenseNumber: z.string().max(100).optional(),
  specialties: z.array(z.string()).default([]),
  bio: z.string().max(2000).optional(),
  yearsOfExperience: z.number().int().min(0).max(70).optional(),
  education: z.record(z.any()).optional(),
  availability: z.record(z.any()).optional(),
});

export const updateDentistSchema = createDentistSchema.partial().omit({ clinicId: true });

export const dentistIdSchema = z.object({
  id: z.string().regex(/^\d+$/).transform(Number),
});

export type CreateDentistInput = z.infer<typeof createDentistSchema>;
export type UpdateDentistInput = z.infer<typeof updateDentistSchema>;
