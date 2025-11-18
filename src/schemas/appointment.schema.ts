import { z } from 'zod';

const appointmentTypeEnum = z.enum(['CHECKUP', 'CLEANING', 'CONSULTATION', 'TREATMENT', 'EMERGENCY', 'FOLLOW_UP']);
const appointmentStatusEnum = z.enum(['SCHEDULED', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'NO_SHOW']);

export const createAppointmentSchema = z.object({
  clinicId: z.number().int().positive(),
  patientId: z.number().int().positive(),
  dentistId: z.number().int().positive(),
  scheduledAt: z.string().datetime().or(z.date()).transform(v => typeof v === 'string' ? new Date(v) : v),
  duration: z.number().int().min(15).max(480).default(30),
  type: appointmentTypeEnum.default('CHECKUP'),
  reason: z.string().max(500).optional(),
  notes: z.string().max(2000).optional(),
});

export const updateAppointmentSchema = z.object({
  scheduledAt: z.string().datetime().or(z.date()).transform(v => typeof v === 'string' ? new Date(v) : v).optional(),
  duration: z.number().int().min(15).max(480).optional(),
  type: appointmentTypeEnum.optional(),
  status: appointmentStatusEnum.optional(),
  reason: z.string().max(500).optional(),
  notes: z.string().max(2000).optional(),
  internalNotes: z.string().max(2000).optional(),
  cancellationReason: z.string().max(500).optional(),
});

export const appointmentIdSchema = z.object({
  id: z.string().regex(/^\d+$/).transform(Number),
});

export type CreateAppointmentInput = z.infer<typeof createAppointmentSchema>;
export type UpdateAppointmentInput = z.infer<typeof updateAppointmentSchema>;
