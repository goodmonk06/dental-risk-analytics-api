import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import prisma from '../db';

interface CreatePatientBody {
  code: string;
  age: number;
  gender: string;
  memo?: string;
}

interface AnalyzeRequestBody {
  type: string;
  parameters: {
    imageUrl?: string;
    data?: Record<string, any>;
  };
}

export async function patientRoutes(fastify: FastifyInstance) {
  // POST /patients - 患者を新規作成
  fastify.post<{ Body: CreatePatientBody }>(
    '/patients',
    async (request: FastifyRequest<{ Body: CreatePatientBody }>, reply: FastifyReply) => {
      try {
        const { code, age, gender, memo } = request.body;

        // バリデーション
        if (!code || !age || !gender) {
          return reply.code(400).send({
            error: 'code, age, gender are required',
          });
        }

        const patient = await prisma.patient.create({
          data: {
            code,
            age,
            gender,
            memo,
          },
        });

        return reply.code(201).send(patient);
      } catch (error: any) {
        if (error.code === 'P2002') {
          return reply.code(409).send({
            error: 'Patient code already exists',
          });
        }
        throw error;
      }
    }
  );

  // GET /patients - 患者一覧を取得
  fastify.get('/patients', async (request, reply) => {
    const patients = await prisma.patient.findMany({
      orderBy: {
        createdAt: 'desc',
      },
    });

    return reply.send(patients);
  });

  // GET /patients/:id - 特定の患者を取得
  fastify.get<{ Params: { id: string } }>(
    '/patients/:id',
    async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      const patientId = parseInt(request.params.id, 10);

      if (isNaN(patientId)) {
        return reply.code(400).send({ error: 'Invalid patient ID' });
      }

      const patient = await prisma.patient.findUnique({
        where: { id: patientId },
        include: {
          analyses: {
            orderBy: {
              createdAt: 'desc',
            },
          },
        },
      });

      if (!patient) {
        return reply.code(404).send({ error: 'Patient not found' });
      }

      return reply.send(patient);
    }
  );

  // GET /patients/:id/analyses - 患者の分析履歴を取得
  fastify.get<{ Params: { id: string } }>(
    '/patients/:id/analyses',
    async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      const patientId = parseInt(request.params.id, 10);

      if (isNaN(patientId)) {
        return reply.code(400).send({ error: 'Invalid patient ID' });
      }

      const analyses = await prisma.riskAnalysis.findMany({
        where: { patientId },
        orderBy: {
          createdAt: 'desc',
        },
      });

      return reply.send(analyses);
    }
  );

  // POST /patients/:id/analyze - リスク分析を実行
  fastify.post<{ Params: { id: string }; Body: AnalyzeRequestBody }>(
    '/patients/:id/analyze',
    async (
      request: FastifyRequest<{ Params: { id: string }; Body: AnalyzeRequestBody }>,
      reply: FastifyReply
    ) => {
      const patientId = parseInt(request.params.id, 10);
      const { type, parameters } = request.body;

      if (isNaN(patientId)) {
        return reply.code(400).send({ error: 'Invalid patient ID' });
      }

      if (!type) {
        return reply.code(400).send({ error: 'type is required' });
      }

      // 患者の存在確認
      const patient = await prisma.patient.findUnique({
        where: { id: patientId },
      });

      if (!patient) {
        return reply.code(404).send({ error: 'Patient not found' });
      }

      // モデルサーバにリクエスト
      const modelClient = (fastify as any).modelClient;
      const analysisResult = await modelClient.analyze({
        type,
        parameters,
      });

      // 分析結果を保存
      const riskAnalysis = await prisma.riskAnalysis.create({
        data: {
          patientId,
          type,
          inputMeta: parameters as any,
          score: analysisResult.score,
        },
      });

      return reply.code(201).send({
        ...riskAnalysis,
        modelMetadata: analysisResult.metadata,
      });
    }
  );
}
