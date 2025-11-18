import { FastifyInstance } from 'fastify';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import prisma from '../db';
import {
  createPatientSchema,
  updatePatientSchema,
  patientIdSchema,
  analyzeRequestSchema,
} from '../schemas/patient.schema';
import { NotFoundError } from '../lib/errors';

export async function patientRoutes(fastify: FastifyInstance) {
  const server = fastify.withTypeProvider<ZodTypeProvider>();

  // POST /patients - 患者を新規作成
  server.post(
    '/patients',
    {
      schema: {
        body: createPatientSchema,
        response: {
          201: createPatientSchema.extend({
            id: createPatientSchema.shape.code.transform(Number),
            createdAt: createPatientSchema.shape.code,
            updatedAt: createPatientSchema.shape.code,
          }),
        },
      },
    },
    async (request, reply) => {
      const { code, age, gender, memo } = request.body;

      const patient = await prisma.patient.create({
        data: {
          code,
          age,
          gender,
          memo,
        },
      });

      return reply.code(201).send(patient);
    }
  );

  // GET /patients - 患者一覧を取得
  server.get('/patients', async (request, reply) => {
    const patients = await prisma.patient.findMany({
      orderBy: {
        createdAt: 'desc',
      },
    });

    return reply.send(patients);
  });

  // GET /patients/:id - 特定の患者を取得
  server.get(
    '/patients/:id',
    {
      schema: {
        params: patientIdSchema,
      },
    },
    async (request, reply) => {
      const { id: patientId } = request.params;

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
        throw new NotFoundError('Patient');
      }

      return reply.send(patient);
    }
  );

  // PUT /patients/:id - 患者情報を更新
  server.put(
    '/patients/:id',
    {
      schema: {
        params: patientIdSchema,
        body: updatePatientSchema,
      },
    },
    async (request, reply) => {
      const { id: patientId } = request.params;
      const updateData = request.body;

      const patient = await prisma.patient.update({
        where: { id: patientId },
        data: updateData,
      });

      return reply.send(patient);
    }
  );

  // DELETE /patients/:id - 患者を削除
  server.delete(
    '/patients/:id',
    {
      schema: {
        params: patientIdSchema,
      },
    },
    async (request, reply) => {
      const { id: patientId } = request.params;

      await prisma.patient.delete({
        where: { id: patientId },
      });

      return reply.code(204).send();
    }
  );

  // GET /patients/:id/analyses - 患者の分析履歴を取得
  server.get(
    '/patients/:id/analyses',
    {
      schema: {
        params: patientIdSchema,
      },
    },
    async (request, reply) => {
      const { id: patientId } = request.params;

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
  server.post(
    '/patients/:id/analyze',
    {
      schema: {
        params: patientIdSchema,
        body: analyzeRequestSchema,
      },
    },
    async (request, reply) => {
      const { id: patientId } = request.params;
      const { type, parameters } = request.body;

      // 患者の存在確認
      const patient = await prisma.patient.findUnique({
        where: { id: patientId },
      });

      if (!patient) {
        throw new NotFoundError('Patient');
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
