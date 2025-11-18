# dental-risk-analytics-api

歯列画像や問診データから虫歯リスク・矯正リスクスコアを返すAPIサーバの土台。実際のMLモデルは差し替え可能な構造に。

## Tech Stack

- **Backend**: Node.js + TypeScript + Fastify
- **Database**: PostgreSQL + Prisma ORM
- **ML Integration**: Python モデルサーバ（HTTP連携）

## Getting Started

### 1. 依存関係のインストール

```bash
npm install
```

### 2. 環境変数の設定

`.env.example` をコピーして `.env` を作成し、データベース接続情報を設定してください。

```bash
cp .env.example .env
```

`.env` の例:
```
DATABASE_URL="postgresql://user:password@localhost:5432/dental_risk_db?schema=public"
PORT=3000
HOST=0.0.0.0
MODEL_SERVER_URL="http://localhost:8000"
```

### 3. データベースのセットアップ

```bash
# Prisma クライアントの生成
npm run prisma:generate

# マイグレーションの実行
npm run prisma:migrate
```

### 4. サーバの起動

```bash
# 開発モード（ホットリロード付き）
npm run dev

# 本番モード
npm run build
npm start
```

サーバは `http://localhost:3000` で起動します。

## API エンドポイント

### 患者管理

#### `POST /patients`
新しい患者を作成します。

**Request Body:**
```json
{
  "code": "P001",
  "age": 35,
  "gender": "male",
  "memo": "定期検診"
}
```

**Response (201):**
```json
{
  "id": 1,
  "code": "P001",
  "age": 35,
  "gender": "male",
  "memo": "定期検診",
  "createdAt": "2024-01-15T10:00:00.000Z",
  "updatedAt": "2024-01-15T10:00:00.000Z"
}
```

#### `GET /patients`
全患者の一覧を取得します。

**Response (200):**
```json
[
  {
    "id": 1,
    "code": "P001",
    "age": 35,
    "gender": "male",
    "memo": "定期検診",
    "createdAt": "2024-01-15T10:00:00.000Z",
    "updatedAt": "2024-01-15T10:00:00.000Z"
  }
]
```

#### `GET /patients/:id`
特定の患者と分析履歴を取得します。

**Response (200):**
```json
{
  "id": 1,
  "code": "P001",
  "age": 35,
  "gender": "male",
  "memo": "定期検診",
  "analyses": [
    {
      "id": 1,
      "patientId": 1,
      "type": "caries",
      "score": 0.35,
      "inputMeta": { "imageUrl": "https://..." },
      "createdAt": "2024-01-15T10:05:00.000Z"
    }
  ],
  "createdAt": "2024-01-15T10:00:00.000Z",
  "updatedAt": "2024-01-15T10:00:00.000Z"
}
```

### リスク分析

#### `POST /patients/:id/analyze`
患者のリスク分析を実行します。

**Request Body:**
```json
{
  "type": "caries",
  "parameters": {
    "imageUrl": "https://example.com/dental-xray.jpg",
    "data": {
      "previousCavities": 2,
      "sugarIntake": "high"
    }
  }
}
```

**Response (201):**
```json
{
  "id": 1,
  "patientId": 1,
  "type": "caries",
  "score": 0.67,
  "inputMeta": {
    "imageUrl": "https://example.com/dental-xray.jpg",
    "data": {
      "previousCavities": 2,
      "sugarIntake": "high"
    }
  },
  "createdAt": "2024-01-15T10:05:00.000Z",
  "modelMetadata": {
    "model_version": "mock-v1.0",
    "processed_at": "2024-01-15T10:05:00.000Z",
    "request_type": "caries"
  }
}
```

**分析タイプ:**
- `caries`: 虫歯リスク
- `alignment`: 矯正リスク
- その他、カスタムタイプも指定可能

#### `GET /patients/:id/analyses`
特定の患者の全分析履歴を取得します。

**Response (200):**
```json
[
  {
    "id": 1,
    "patientId": 1,
    "type": "caries",
    "score": 0.67,
    "inputMeta": { "imageUrl": "https://..." },
    "createdAt": "2024-01-15T10:05:00.000Z"
  }
]
```

### ヘルスチェック

#### `GET /health`
サーバとモデルサーバの健全性を確認します。

**Response (200):**
```json
{
  "status": "ok",
  "timestamp": "2024-01-15T10:00:00.000Z",
  "modelServer": "healthy"
}
```

## Pythonモデルサーバとの連携

### アーキテクチャ

このAPIは、機械学習モデルの推論をPythonサーバに委託する設計です。現在はモック実装（`MockModelClient`）を使用していますが、実際のモデルサーバに簡単に切り替えられます。

### モデルサーバインターフェース仕様

実際のPythonモデルサーバを実装する際は、以下のインターフェースに準拠してください。

#### エンドポイント: `POST /analyze`

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

- **score**: リスクスコア（0.0～1.0の範囲）
- **confidence**: 予測の信頼度（オプション）
- **metadata**: モデルのバージョンや処理時刻などのメタ情報（オプション）

#### エンドポイント: `GET /health`

**Response:**
```json
{
  "status": "ok"
}
```

### モック実装から本番実装への切り替え

`src/index.ts` の以下の部分を変更します：

```typescript
// 開発時（モック使用）
const modelClient = createModelClient({
  useMock: true,
  serverUrl: config.modelServerUrl,
});

// 本番時（実サーバ使用）
const modelClient = createModelClient({
  useMock: false,
  serverUrl: config.modelServerUrl, // 実際のサーバURL
});
```

または、`HttpModelClient` の実装（`src/services/modelClient.ts`）を完成させてください。

### Pythonサーバの実装例

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
    # モデル推論ロジック
    # score = your_model.predict(request.parameters)

    return AnalysisResponse(
        score=0.67,
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

## 開発ツール

```bash
# Prisma Studio（DB GUI）を起動
npm run prisma:studio

# TypeScriptのビルド
npm run build

# 開発サーバ（ホットリロード）
npm run dev
```

## プロジェクト構造

```
dental-risk-analytics-api/
├── prisma/
│   └── schema.prisma       # データベーススキーマ
├── src/
│   ├── routes/
│   │   └── patients.ts     # 患者・分析API
│   ├── services/
│   │   └── modelClient.ts  # モデルサーバクライアント
│   ├── config.ts           # 環境設定
│   ├── db.ts               # Prismaクライアント
│   └── index.ts            # メインサーバ
├── .env.example            # 環境変数テンプレート
├── package.json
├── tsconfig.json
└── README.md
```

## License

MIT
