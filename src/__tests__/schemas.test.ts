import { describe, it, expect } from 'vitest';
import {
  createPatientSchema,
  updatePatientSchema,
  patientIdSchema,
  analyzeRequestSchema,
} from '../schemas/patient.schema';
import { ZodError } from 'zod';

describe('Patient Schemas', () => {
  describe('createPatientSchema', () => {
    it('should validate a valid patient creation request', () => {
      const validData = {
        code: 'P001',
        age: 35,
        gender: 'male',
        memo: 'Regular checkup',
      };

      const result = createPatientSchema.parse(validData);
      expect(result).toEqual(validData);
    });

    it('should accept optional memo field', () => {
      const validData = {
        code: 'P001',
        age: 35,
        gender: 'female',
      };

      const result = createPatientSchema.parse(validData);
      expect(result).toEqual(validData);
    });

    it('should reject empty patient code', () => {
      const invalidData = {
        code: '',
        age: 35,
        gender: 'male',
      };

      expect(() => createPatientSchema.parse(invalidData)).toThrow(ZodError);
    });

    it('should reject negative age', () => {
      const invalidData = {
        code: 'P001',
        age: -1,
        gender: 'male',
      };

      expect(() => createPatientSchema.parse(invalidData)).toThrow(ZodError);
    });

    it('should reject age over 150', () => {
      const invalidData = {
        code: 'P001',
        age: 151,
        gender: 'male',
      };

      expect(() => createPatientSchema.parse(invalidData)).toThrow(ZodError);
    });

    it('should reject invalid gender', () => {
      const invalidData = {
        code: 'P001',
        age: 35,
        gender: 'invalid',
      };

      expect(() => createPatientSchema.parse(invalidData)).toThrow(ZodError);
    });

    it('should reject memo longer than 500 characters', () => {
      const invalidData = {
        code: 'P001',
        age: 35,
        gender: 'male',
        memo: 'a'.repeat(501),
      };

      expect(() => createPatientSchema.parse(invalidData)).toThrow(ZodError);
    });
  });

  describe('updatePatientSchema', () => {
    it('should allow partial updates', () => {
      const validData = {
        age: 36,
      };

      const result = updatePatientSchema.parse(validData);
      expect(result).toEqual(validData);
    });

    it('should allow updating all fields', () => {
      const validData = {
        code: 'P002',
        age: 40,
        gender: 'other',
        memo: 'Updated memo',
      };

      const result = updatePatientSchema.parse(validData);
      expect(result).toEqual(validData);
    });

    it('should allow empty update', () => {
      const validData = {};

      const result = updatePatientSchema.parse(validData);
      expect(result).toEqual(validData);
    });
  });

  describe('patientIdSchema', () => {
    it('should parse valid numeric string ID', () => {
      const validData = { id: '123' };

      const result = patientIdSchema.parse(validData);
      expect(result).toEqual({ id: 123 });
      expect(typeof result.id).toBe('number');
    });

    it('should reject non-numeric ID', () => {
      const invalidData = { id: 'abc' };

      expect(() => patientIdSchema.parse(invalidData)).toThrow(ZodError);
    });

    it('should reject negative ID', () => {
      const invalidData = { id: '-1' };

      expect(() => patientIdSchema.parse(invalidData)).toThrow(ZodError);
    });

    it('should reject floating point ID', () => {
      const invalidData = { id: '1.5' };

      expect(() => patientIdSchema.parse(invalidData)).toThrow(ZodError);
    });
  });

  describe('analyzeRequestSchema', () => {
    it('should validate a valid analyze request with imageUrl', () => {
      const validData = {
        type: 'caries',
        parameters: {
          imageUrl: 'https://example.com/image.jpg',
        },
      };

      const result = analyzeRequestSchema.parse(validData);
      expect(result).toEqual(validData);
    });

    it('should validate a valid analyze request with data', () => {
      const validData = {
        type: 'alignment',
        parameters: {
          data: {
            previousCavities: 2,
            sugarIntake: 'high',
          },
        },
      };

      const result = analyzeRequestSchema.parse(validData);
      expect(result).toEqual(validData);
    });

    it('should validate all analysis types', () => {
      const types = ['caries', 'alignment', 'periodontal', 'occlusion'];

      types.forEach((type) => {
        const validData = {
          type,
          parameters: {},
        };

        const result = analyzeRequestSchema.parse(validData);
        expect(result.type).toBe(type);
      });
    });

    it('should reject invalid analysis type', () => {
      const invalidData = {
        type: 'invalid_type',
        parameters: {},
      };

      expect(() => analyzeRequestSchema.parse(invalidData)).toThrow(ZodError);
    });

    it('should reject invalid imageUrl', () => {
      const invalidData = {
        type: 'caries',
        parameters: {
          imageUrl: 'not-a-url',
        },
      };

      expect(() => analyzeRequestSchema.parse(invalidData)).toThrow(ZodError);
    });

    it('should allow empty parameters', () => {
      const validData = {
        type: 'caries',
        parameters: {},
      };

      const result = analyzeRequestSchema.parse(validData);
      expect(result).toEqual(validData);
    });
  });
});
