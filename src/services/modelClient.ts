/**
 * Pythonモデルサーバとの連携を抽象化するクライアント
 *
 * 将来的に実際のモデルサーバに接続する際は、MockModelClientをHttpModelClientに
 * 置き換えることで対応可能。
 */

export interface AnalysisRequest {
  type: 'caries' | 'alignment' | string;
  parameters: {
    imageUrl?: string;
    data?: Record<string, any>;
  };
}

export interface AnalysisResponse {
  score: number;
  confidence?: number;
  metadata?: Record<string, any>;
}

/**
 * モデルサーバクライアントのインターフェース
 */
export interface IModelClient {
  analyze(request: AnalysisRequest): Promise<AnalysisResponse>;
  healthCheck(): Promise<boolean>;
}

/**
 * モック実装 - 開発用
 * ランダムなスコアを返す
 */
export class MockModelClient implements IModelClient {
  async analyze(request: AnalysisRequest): Promise<AnalysisResponse> {
    // モックレスポンス: typeに応じて異なる範囲のスコアを返す
    const baseScore = request.type === 'caries' ? 0.3 : 0.5;
    const randomOffset = Math.random() * 0.4 - 0.2; // -0.2 ~ 0.2
    const score = Math.max(0, Math.min(1, baseScore + randomOffset));

    // 実際のサーバをシミュレートするために少し待機
    await new Promise(resolve => setTimeout(resolve, 100));

    return {
      score: parseFloat(score.toFixed(3)),
      confidence: 0.85,
      metadata: {
        model_version: 'mock-v1.0',
        processed_at: new Date().toISOString(),
        request_type: request.type,
      },
    };
  }

  async healthCheck(): Promise<boolean> {
    return true;
  }
}

/**
 * HTTP実装 - 本番用（未実装）
 * 実際のPythonサーバに接続する際はこちらを使用
 */
export class HttpModelClient implements IModelClient {
  constructor(private baseUrl: string) {}

  async analyze(request: AnalysisRequest): Promise<AnalysisResponse> {
    // TODO: 実際のHTTPリクエストを実装
    // const response = await fetch(`${this.baseUrl}/analyze`, {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify(request),
    // });
    // return await response.json();

    throw new Error('HttpModelClient is not implemented yet. Use MockModelClient for development.');
  }

  async healthCheck(): Promise<boolean> {
    // TODO: 実際のヘルスチェックを実装
    // const response = await fetch(`${this.baseUrl}/health`);
    // return response.ok;

    return false;
  }
}

/**
 * クライアントファクトリー
 * 環境変数や設定に応じて適切なクライアントを返す
 */
export function createModelClient(config: { useMock?: boolean; serverUrl?: string }): IModelClient {
  if (config.useMock !== false) {
    return new MockModelClient();
  }

  if (!config.serverUrl) {
    throw new Error('Model server URL is required for HttpModelClient');
  }

  return new HttpModelClient(config.serverUrl);
}
