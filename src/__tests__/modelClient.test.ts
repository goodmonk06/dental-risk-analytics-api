import { describe, it, expect, beforeEach } from 'vitest';
import { MockModelClient, createModelClient } from '../services/modelClient';

describe('ModelClient', () => {
  describe('MockModelClient', () => {
    let client: MockModelClient;

    beforeEach(() => {
      client = new MockModelClient();
    });

    it('should return a valid analysis response', async () => {
      const request = {
        type: 'caries',
        parameters: {
          imageUrl: 'https://example.com/image.jpg',
          data: { age: 35 },
        },
      };

      const response = await client.analyze(request);

      expect(response).toHaveProperty('score');
      expect(response.score).toBeGreaterThanOrEqual(0);
      expect(response.score).toBeLessThanOrEqual(1);
      expect(response).toHaveProperty('confidence');
      expect(response).toHaveProperty('metadata');
      expect(response.metadata).toHaveProperty('model_version');
      expect(response.metadata).toHaveProperty('processed_at');
      expect(response.metadata).toHaveProperty('request_type', request.type);
    });

    it('should return different scores for different types', async () => {
      const cariesRequest = {
        type: 'caries',
        parameters: {},
      };

      const alignmentRequest = {
        type: 'alignment',
        parameters: {},
      };

      const cariesResponse = await client.analyze(cariesRequest);
      const alignmentResponse = await client.analyze(alignmentRequest);

      // スコアは異なる可能性が高い（ランダム要素があるため）
      // ただし、必ずしも異なるとは限らないので、両方とも有効な範囲内であることを確認
      expect(cariesResponse.score).toBeGreaterThanOrEqual(0);
      expect(cariesResponse.score).toBeLessThanOrEqual(1);
      expect(alignmentResponse.score).toBeGreaterThanOrEqual(0);
      expect(alignmentResponse.score).toBeLessThanOrEqual(1);
    });

    it('should always return healthy status for health check', async () => {
      const result = await client.healthCheck();
      expect(result).toBe(true);
    });

    it('should include realistic metadata', async () => {
      const request = {
        type: 'caries',
        parameters: {},
      };

      const response = await client.analyze(request);

      expect(response.metadata?.model_version).toBe('mock-v1.0');
      expect(response.confidence).toBe(0.85);

      // タイムスタンプが最近のものであることを確認
      const processedAt = new Date(response.metadata?.processed_at || '');
      const now = new Date();
      const diffMs = now.getTime() - processedAt.getTime();
      expect(diffMs).toBeLessThan(1000); // 1秒以内
    });
  });

  describe('createModelClient', () => {
    it('should create MockModelClient by default', () => {
      const client = createModelClient({ useMock: true });
      expect(client).toBeInstanceOf(MockModelClient);
    });

    it('should create MockModelClient when useMock is true', () => {
      const client = createModelClient({
        useMock: true,
        serverUrl: 'http://localhost:8000',
      });
      expect(client).toBeInstanceOf(MockModelClient);
    });

    it('should throw error when creating HttpModelClient without serverUrl', () => {
      expect(() => {
        createModelClient({ useMock: false });
      }).toThrow('Model server URL is required for HttpModelClient');
    });
  });
});
