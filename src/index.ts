import Fastify from 'fastify';
import {
  serializerCompiler,
  validatorCompiler,
  ZodTypeProvider,
} from 'fastify-type-provider-zod';
import { config } from './config';
import { createModelClient } from './services/modelClient';
import { patientRoutes } from './routes/patients';
import { clinicRoutes } from './routes/clinics';
import { dentistRoutes } from './routes/dentists';
import { appointmentRoutes } from './routes/appointments';
import { treatmentPlanRoutes } from './routes/treatmentPlans';
import { errorHandler } from './lib/errors';
import { logger } from './lib/logger';
import { metrics } from './lib/metrics';
import prisma from './db';

const fastify = Fastify({
  logger: process.env.NODE_ENV !== 'production',
}).withTypeProvider<ZodTypeProvider>();

// Zodバリデーター設定
fastify.setValidatorCompiler(validatorCompiler);
fastify.setSerializerCompiler(serializerCompiler);

// エラーハンドラ設定
fastify.setErrorHandler(errorHandler);

// Request logging middleware
fastify.addHook('onRequest', async (request) => {
  const requestLogger = logger.child({
    requestId: request.id,
    method: request.method,
    url: request.url,
  });
  (request as any).logger = requestLogger;
});

// Metrics middleware
fastify.addHook('onResponse', async (request, reply) => {
  metrics.incrementCounter('http_requests_total', {
    method: request.method,
    route: request.routerPath || request.url,
    status: reply.statusCode,
  });

  metrics.recordHistogram('http_request_duration_ms', Date.now() - request.startTime, {
    method: request.method,
    route: request.routerPath || request.url,
  });
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
fastify.register(clinicRoutes);
fastify.register(dentistRoutes);
fastify.register(appointmentRoutes);
fastify.register(treatmentPlanRoutes);

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
