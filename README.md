# Dental Risk Analytics API

歯科向けリスク分析APIサーバ - 患者の歯科リスク（虫歯、歯列矯正、歯周病など）を機械学習モデルで評価し、治療計画をサポートするバックエンドシステム

## Overview

このAPIは、歯科医療における予防医療と治療計画の最適化を支援するために設計されています。患者の口腔内画像や診療データをPythonベースの機械学習モデルサーバに送信し、リスクスコアを取得・保存することで、データドリブンな診療支援を実現します。

現在はPhase 2の開発段階で、完全に動作する垂直スライス（患者登録→リスク分析→履歴参照）が実装されています。

### Key Features

- **患者管理**: CRUD操作による患者情報の管理
- **リスク分析**: 虫歯、歯列矯正、歯周病、咬合などの多角的リスク評価
- **分析履歴**: 時系列でのリスク推移の追跡
- **モデルサーバ連携**: 実際のMLモデルサーバと簡単に統合可能な抽象化レイヤー
- **型安全**: TypeScript + Zod による完全な型安全性
- **エラーハンドリング**: 一貫したエラーレスポンス形式

## Tech Stack

- **Backend**: Node.js 20 + TypeScript 5.3
- **Web Framework**: Fastify 4.x (高速・軽量)
- **Database**: PostgreSQL 16 + Prisma ORM
- **Validation**: Zod (スキーマベースバリデーション)
- **Testing**: Vitest (高速ユニットテスト)
- **ML Integration**: Python モデルサーバ（HTTP連携）
- **Infrastructure**: Docker + Docker Compose

## Domain Model

### Entities

#### Patient（患者）
- `id`: 自動採番ID
- `code`: 患者コード（ユニーク）
- `age`: 年齢
- `gender`: 性別 (male/female/other)
- `memo`: メモ（任意）
- `analyses[]`: リスク分析履歴（1対多）

#### RiskAnalysis（リスク分析）
- `id`: 自動採番ID
- `patientId`: 患者ID（外部キー）
- `type`: 分析タイプ (caries, alignment, periodontal, occlusion)
- `score`: リスクスコア (0.0〜1.0)
- `inputMeta`: 入力パラメータ（JSON）
- `createdAt`: 分析実行日時

### Relationships

```
Patient 1 ─── * RiskAnalysis
```

各患者は複数の分析履歴を持ち、時系列でリスクの推移を追跡できます。

## Getting Started

### Requirements

- Node.js 20+
- Docker & Docker Compose
- PostgreSQL 16（またはDocker経由）

### Setup Steps

#### 1. リポジトリのクローン

```bash
git clone <repository-url>
cd dental-risk-analytics-api
```

#### 2. 依存関係のインストール

```bash
npm install
```

#### 3. 環境変数の設定

`.env.example` をコピーして `.env` を作成します。

```bash
cp .env.example .env
```

`.env` の内容（デフォルト設定）:
```env
DATABASE_URL="postgresql://dental_user:dental_pass@localhost:5432/dental_risk_db?schema=public"
PORT=3000
HOST=0.0.0.0
MODEL_SERVER_URL="http://localhost:8000"
```

#### 4. Dockerでデータベースを起動

開発用のPostgreSQLをDocker Composeで起動します。

```bash
docker compose -f docker-compose.dev.yml up -d
```

#### 5. データベースのセットアップ

Prismaでマイグレーションを実行し、スキーマを作成します。

```bash
npm run db:generate
npm run db:migrate
```

#### 6. Seedデータの投入

デモ用のサンプルデータを投入します。

```bash
npm run db:seed
```

これにより、5人の患者と10件のリスク分析データが作成されます。

#### 7. 開発サーバの起動

```bash
npm run dev
```

サーバは `http://localhost:3000` で起動します。

#### 8. 動作確認

ヘルスチェックエンドポイントにアクセスして、サーバが正常に起動しているか確認します。

```bash
curl http://localhost:3000/health
```

期待されるレスポンス:
```json
{
  "status": "ok",
  "timestamp": "2024-01-15T10:00:00.000Z",
  "modelServer": "healthy"
}
```

### Alternative: Docker Composeで全体を起動

アプリとデータベースを一括で起動する場合:

```bash
docker compose up -d
```

この場合、アプリは本番モードで起動します。

## Example Flow: 完全な垂直スライス

以下は、患者登録からリスク分析、履歴参照までの完全なエンドツーエンドフローです。

### 1. 患者の新規登録

```bash
curl -X POST http://localhost:3000/patients \
  -H "Content-Type: application/json" \
  -d '{
    "code": "P100",
    "age": 32,
    "gender": "female",
    "memo": "初診・定期検診希望"
  }'
```

レスポンス例:
```json
{
  "id": 6,
  "code": "P100",
  "age": 32,
  "gender": "female",
  "memo": "初診・定期検診希望",
  "createdAt": "2024-01-15T10:00:00.000Z",
  "updatedAt": "2024-01-15T10:00:00.000Z"
}
```

### 2. リスク分析の実行

患者ID 6 に対して虫歯リスク分析を実行します。

```bash
curl -X POST http://localhost:3000/patients/6/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "type": "caries",
    "parameters": {
      "imageUrl": "https://example.com/xray/p100.jpg",
      "data": {
        "previousCavities": 1,
        "sugarIntake": "medium",
        "brushingFrequency": 2
      }
    }
  }'
```

レスポンス例（モックモデルによる結果）:
```json
{
  "id": 11,
  "patientId": 6,
  "type": "caries",
  "score": 0.423,
  "inputMeta": {
    "imageUrl": "https://example.com/xray/p100.jpg",
    "data": {
      "previousCavities": 1,
      "sugarIntake": "medium",
      "brushingFrequency": 2
    }
  },
  "createdAt": "2024-01-15T10:01:00.000Z",
  "modelMetadata": {
    "model_version": "mock-v1.0",
    "processed_at": "2024-01-15T10:01:00.000Z",
    "request_type": "caries",
    "confidence": 0.85
  }
}
```

### 3. 患者情報と分析履歴の取得

```bash
curl http://localhost:3000/patients/6
```

レスポンス例:
```json
{
  "id": 6,
  "code": "P100",
  "age": 32,
  "gender": "female",
  "memo": "初診・定期検診希望",
  "analyses": [
    {
      "id": 11,
      "patientId": 6,
      "type": "caries",
      "score": 0.423,
      "inputMeta": { "imageUrl": "...", "data": {...} },
      "createdAt": "2024-01-15T10:01:00.000Z"
    }
  ],
  "createdAt": "2024-01-15T10:00:00.000Z",
  "updatedAt": "2024-01-15T10:00:00.000Z"
}
```

### 4. 全患者の一覧取得

```bash
curl http://localhost:3000/patients
```

### 5. 患者情報の更新

```bash
curl -X PUT http://localhost:3000/patients/6 \
  -H "Content-Type: application/json" \
  -d '{
    "age": 33,
    "memo": "定期検診（6ヶ月後）"
  }'
```

### 6. 患者の削除

```bash
curl -X DELETE http://localhost:3000/patients/6
```

## API Documentation

### 患者管理

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST   | `/patients` | 患者を新規作成 |
| GET    | `/patients` | 全患者の一覧を取得 |
| GET    | `/patients/:id` | 特定患者の詳細を取得 |
| PUT    | `/patients/:id` | 患者情報を更新 |
| DELETE | `/patients/:id` | 患者を削除 |

### リスク分析

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST   | `/patients/:id/analyze` | リスク分析を実行 |
| GET    | `/patients/:id/analyses` | 患者の分析履歴を取得 |

### その他

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET    | `/health` | サーバとモデルサーバのヘルスチェック |

詳細なリクエスト/レスポンス形式は、`src/schemas/patient.schema.ts` を参照してください。

## Development Commands

```bash
# 開発サーバ起動（ホットリロード）
npm run dev

# ビルド
npm run build

# 本番サーバ起動
npm start

# テスト実行
npm test

# テスト（ウォッチモード）
npm run test:watch

# テストUI起動
npm run test:ui

# 型チェック
npm run lint

# Prismaクライアント生成
npm run db:generate

# マイグレーション実行
npm run db:migrate

# データベースpush（開発用）
npm run db:push

# Seedデータ投入
npm run db:seed

# Prisma Studio起動（DB GUI）
npm run db:studio

# Docker起動
npm run docker:up

# Docker停止
npm run docker:down

# Dockerログ表示
npm run docker:logs
```

## Testing

### テストの実行

```bash
npm test
```

### テストカバレッジ

現在のテストカバレッジ:
- モデルクライアント: MockModelClient の全機能
- バリデーションスキーマ: 全スキーマの正常/異常系

### テストの追加

`src/__tests__/` ディレクトリに `.test.ts` ファイルを追加してください。

例:
```typescript
import { describe, it, expect } from 'vitest';

describe('MyFeature', () => {
  it('should work correctly', () => {
    expect(true).toBe(true);
  });
});
```

## Python Model Server Integration

### Current Status

現在はモック実装（`MockModelClient`）を使用しており、ランダムなスコアを返します。実際のPythonモデルサーバに接続する準備は整っています。

### Model Server Interface

実際のPythonモデルサーバを実装する際は、以下のインターフェースに準拠してください。

#### Endpoint: `POST /analyze`

**Request:**
```json
{
  "type": "caries",
  "parameters": {
    "imageUrl": "https://example.com/image.jpg",
    "data": {
      "age": 35,
      "previousCavities": 2
    }
  }
}
```

**Response:**
```json
{
  "score": 0.67,
  "confidence": 0.89,
  "metadata": {
    "model_version": "v2.1.0",
    "processed_at": "2024-01-15T10:05:00.000Z",
    "inference_time_ms": 120
  }
}
```

#### Endpoint: `GET /health`

**Response:**
```json
{
  "status": "ok"
}
```

### Switching to Real Model Server

`src/index.ts` の以下の行を変更してください:

```typescript
// 開発時（モック使用）
const modelClient = createModelClient({
  useMock: true,
  serverUrl: config.modelServerUrl,
});

// 本番時（実サーバ使用）
const modelClient = createModelClient({
  useMock: false,
  serverUrl: config.modelServerUrl, // .envで設定
});
```

さらに、`src/services/modelClient.ts` の `HttpModelClient` の実装を完成させてください（現在はスケルトン）。

### Python Server Example

```python
from fastapi import FastAPI
from pydantic import BaseModel
import uvicorn

app = FastAPI()

class AnalysisRequest(BaseModel):
    type: str
    parameters: dict

class AnalysisResponse(BaseModel):
    score: float
    confidence: float
    metadata: dict

@app.post("/analyze")
async def analyze(request: AnalysisRequest) -> AnalysisResponse:
    # TODO: 実際のモデル推論ロジック
    score = your_model.predict(request.parameters)

    return AnalysisResponse(
        score=score,
        confidence=0.89,
        metadata={
            "model_version": "v2.1.0",
            "processed_at": datetime.now().isoformat(),
        }
    )

@app.get("/health")
async def health():
    return {"status": "ok"}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
```

## Seed Data

`npm run db:seed` で投入されるデモデータ:

### 患者

| Code | Age | Gender | Memo |
|------|-----|--------|------|
| P001 | 35  | male   | 定期検診、虫歯治療歴あり |
| P002 | 28  | female | 矯正治療検討中 |
| P003 | 42  | male   | 歯周病治療中 |
| P004 | 19  | female | 初診、予防歯科希望 |
| P005 | 56  | other  | インプラント治療後のメンテナンス |

### リスク分析例

- P001: 虫歯リスク 0.72（高）、歯周病リスク 0.45（中）
- P002: 歯列矯正リスク 0.68（高）、虫歯リスク 0.23（低）
- P003: 歯周病リスク 0.81（高）、虫歯リスク 0.58（中）
- P004: 虫歯リスク 0.15（低）
- P005: 咬合リスク 0.42（中）、歯周病リスク 0.36（低）

これらのデータを使って、APIの動作確認やフロントエンドの開発が可能です。

## Project Structure

```
dental-risk-analytics-api/
├── prisma/
│   ├── schema.prisma          # データベーススキーマ
│   └── seed.ts                # Seedデータスクリプト
├── src/
│   ├── __tests__/             # テストファイル
│   │   ├── modelClient.test.ts
│   │   └── schemas.test.ts
│   ├── lib/
│   │   └── errors.ts          # エラーハンドリング
│   ├── routes/
│   │   └── patients.ts        # 患者・分析API
│   ├── schemas/
│   │   └── patient.schema.ts  # Zodバリデーションスキーマ
│   ├── services/
│   │   └── modelClient.ts     # モデルサーバクライアント
│   ├── config.ts              # 環境設定
│   ├── db.ts                  # Prismaクライアント
│   └── index.ts               # メインサーバ
├── .dockerignore
├── .env.example               # 環境変数テンプレート
├── .gitignore
├── docker-compose.yml         # 本番用Docker構成
├── docker-compose.dev.yml     # 開発用Docker構成
├── Dockerfile
├── package.json
├── tsconfig.json
├── vitest.config.ts           # テスト設定
└── README.md
```

## Future Extensions

Phase 3以降の拡張案:

### 機能追加
- [ ] 認証・認可（JWT、OAuth）
- [ ] ロールベースアクセス制御（歯科医師、衛生士、受付など）
- [ ] リアルタイム通知（WebSocket）
- [ ] レポート生成（PDF出力）
- [ ] 画像アップロード機能（S3連携）
- [ ] 治療計画テンプレート機能
- [ ] 患者ポータル（セルフサービス）

### 技術改善
- [ ] GraphQL API（オプション）
- [ ] Redis キャッシング
- [ ] 非同期ジョブキュー（Bull）
- [ ] ログ集約（ELK Stack）
- [ ] メトリクス収集（Prometheus + Grafana）
- [ ] E2Eテスト（Playwright）
- [ ] CI/CD パイプライン（GitHub Actions）

### データモデル拡張
- [ ] Clinic（診療所）エンティティ
- [ ] Dentist（歯科医師）エンティティ
- [ ] Appointment（予約）エンティティ
- [ ] Treatment（治療履歴）エンティティ
- [ ] Payment（支払い）エンティティ

### MLモデル連携
- [ ] 複数モデルサーバの負荷分散
- [ ] モデルバージョン管理
- [ ] A/Bテスト機能
- [ ] モデル性能モニタリング

## License

MIT

---

**Built with ❤️ for better dental care**
