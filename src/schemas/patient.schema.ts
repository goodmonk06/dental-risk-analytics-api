import { z } from 'zod';

// 患者作成スキーマ
export const createPatientSchema = z.object({
  code: z.string().min(1, 'Patient code is required').max(50),
  age: z.number().int().min(0).max(150),
  gender: z.enum(['male', 'female', 'other']),
  memo: z.string().max(500).optional(),
});

export type CreatePatientInput = z.infer<typeof createPatientSchema>;

// 患者更新スキーマ
export const updatePatientSchema = z.object({
  code: z.string().min(1).max(50).optional(),
  age: z.number().int().min(0).max(150).optional(),
  gender: z.enum(['male', 'female', 'other']).optional(),
  memo: z.string().max(500).optional(),
});

export type UpdatePatientInput = z.infer<typeof updatePatientSchema>;

// パラメータスキーマ
export const patientIdSchema = z.object({
  id: z.string().regex(/^\d+$/, 'Invalid patient ID').transform(Number),
});

export type PatientIdParams = z.infer<typeof patientIdSchema>;

// 分析リクエストスキーマ
export const analyzeRequestSchema = z.object({
  type: z.enum(['caries', 'alignment', 'periodontal', 'occlusion']),
  parameters: z.object({
    imageUrl: z.string().url().optional(),
    data: z.record(z.any()).optional(),
  }),
});

export type AnalyzeRequestInput = z.infer<typeof analyzeRequestSchema>;
