import { z } from 'zod';

const treatmentPlanStatusEnum = z.enum(['DRAFT', 'PROPOSED', 'ACCEPTED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']);
const treatmentItemStatusEnum = z.enum(['PENDING', 'IN_PROGRESS', 'COMPLETED', 'SKIPPED']);

export const createTreatmentPlanSchema = z.object({
  patientId: z.number().int().positive(),
  dentistId: z.number().int().positive(),
  title: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).default('medium'),
  estimatedCost: z.number().min(0).optional(),
  estimatedDuration: z.number().int().min(1).optional(),
  startDate: z.string().datetime().or(z.date()).transform(v => typeof v === 'string' ? new Date(v) : v).optional(),
  endDate: z.string().datetime().or(z.date()).transform(v => typeof v === 'string' ? new Date(v) : v).optional(),
  notes: z.string().max(2000).optional(),
});

export const updateTreatmentPlanSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(2000).optional(),
  status: treatmentPlanStatusEnum.optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
  estimatedCost: z.number().min(0).optional(),
  estimatedDuration: z.number().int().min(1).optional(),
  startDate: z.string().datetime().or(z.date()).transform(v => typeof v === 'string' ? new Date(v) : v).optional(),
  endDate: z.string().datetime().or(z.date()).transform(v => typeof v === 'string' ? new Date(v) : v).optional(),
  notes: z.string().max(2000).optional(),
});

export const createTreatmentPlanItemSchema = z.object({
  analysisId: z.number().int().positive().optional(),
  title: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  category: z.string().max(100),
  priority: z.number().int().min(0).default(0),
  estimatedCost: z.number().min(0).optional(),
  estimatedDuration: z.number().int().min(1).optional(),
  scheduledDate: z.string().datetime().or(z.date()).transform(v => typeof v === 'string' ? new Date(v) : v).optional(),
  notes: z.string().max(1000).optional(),
});

export const updateTreatmentPlanItemSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(1000).optional(),
  category: z.string().max(100).optional(),
  status: treatmentItemStatusEnum.optional(),
  priority: z.number().int().min(0).optional(),
  estimatedCost: z.number().min(0).optional(),
  actualCost: z.number().min(0).optional(),
  estimatedDuration: z.number().int().min(1).optional(),
  scheduledDate: z.string().datetime().or(z.date()).transform(v => typeof v === 'string' ? new Date(v) : v).optional(),
  completedDate: z.string().datetime().or(z.date()).transform(v => typeof v === 'string' ? new Date(v) : v).optional(),
  notes: z.string().max(1000).optional(),
});

export const treatmentPlanIdSchema = z.object({
  id: z.string().regex(/^\d+$/).transform(Number),
});

export const treatmentPlanItemIdSchema = z.object({
  planId: z.string().regex(/^\d+$/).transform(Number),
  itemId: z.string().regex(/^\d+$/).transform(Number),
});

export type CreateTreatmentPlanInput = z.infer<typeof createTreatmentPlanSchema>;
export type UpdateTreatmentPlanInput = z.infer<typeof updateTreatmentPlanSchema>;
export type CreateTreatmentPlanItemInput = z.infer<typeof createTreatmentPlanItemSchema>;
export type UpdateTreatmentPlanItemInput = z.infer<typeof updateTreatmentPlanItemSchema>;
