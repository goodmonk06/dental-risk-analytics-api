import Fastify from 'fastify';
import { config } from './config';
import { createModelClient } from './services/modelClient';
import { patientRoutes } from './routes/patients';
import prisma from './db';

const fastify = Fastify({
  logger: true,
});

// モデルクライアントをfastifyインスタンスに登録
const modelClient = createModelClient({
  useMock: true, // 開発時はモックを使用
  serverUrl: config.modelServerUrl,
});

// fastifyインスタンスにモデルクライアントを追加
(fastify as any).modelClient = modelClient;

// ルート登録
fastify.register(patientRoutes);

// ヘルスチェックエンドポイント
fastify.get('/health', async () => {
  const modelServerHealthy = await modelClient.healthCheck();
  return {
    status: 'ok',
    timestamp: new Date().toISOString(),
    modelServer: modelServerHealthy ? 'healthy' : 'unhealthy',
  };
});

// サーバ起動
const start = async () => {
  try {
    await fastify.listen({ port: config.port, host: config.host });
    console.log(`Server is running on http://${config.host}:${config.port}`);
  } catch (err) {
    fastify.log.error(err);
    await prisma.$disconnect();
    process.exit(1);
  }
};

// グレースフルシャットダウン
process.on('SIGINT', async () => {
  console.log('\nShutting down gracefully...');
  await fastify.close();
  await prisma.$disconnect();
  process.exit(0);
});

start();
