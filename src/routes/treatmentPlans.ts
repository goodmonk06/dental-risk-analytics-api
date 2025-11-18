import { FastifyInstance } from 'fastify';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import prisma from '../db';
import {
  createTreatmentPlanSchema,
  updateTreatmentPlanSchema,
  createTreatmentPlanItemSchema,
  updateTreatmentPlanItemSchema,
  treatmentPlanIdSchema,
  treatmentPlanItemIdSchema,
} from '../schemas/treatmentPlan.schema';
import { NotFoundError } from '../lib/errors';
import { logger } from '../lib/logger';
import { eventBus } from '../events/eventBus';
import { EventType } from '../events/types';
import { businessMetrics } from '../lib/metrics';

export async function treatmentPlanRoutes(fastify: FastifyInstance) {
  const server = fastify.withTypeProvider<ZodTypeProvider>();

  // POST /treatment-plans - Create treatment plan
  server.post('/treatment-plans', { schema: { body: createTreatmentPlanSchema } }, async (request, reply) => {
    const data = request.body;

    const plan = await prisma.treatmentPlan.create({
      data,
      include: {
        patient: { select: { id: true, code: true, firstName: true, lastName: true } },
        dentist: { select: { id: true, firstName: true, lastName: true } },
      },
    });

    await eventBus.emit(EventType.TREATMENT_PLAN_CREATED, {
      planId: plan.id,
      patientId: plan.patientId,
      dentistId: plan.dentistId,
      title: plan.title,
    });

    businessMetrics.treatmentPlanCreated();
    logger.info(`Treatment plan created: ${plan.title}`, { planId: plan.id, patientId: plan.patientId });

    return reply.code(201).send(plan);
  });

  // GET /treatment-plans - List treatment plans
  server.get('/treatment-plans', async (request, reply) => {
    const plans = await prisma.treatmentPlan.findMany({
      where: {
        status: { notIn: ['CANCELLED', 'COMPLETED'] },
      },
      include: {
        patient: { select: { id: true, code: true, firstName: true, lastName: true } },
        dentist: { select: { id: true, firstName: true, lastName: true } },
        _count: { select: { items: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    return reply.send(plans);
  });

  // GET /treatment-plans/:id - Get treatment plan details
  server.get('/treatment-plans/:id', { schema: { params: treatmentPlanIdSchema } }, async (request, reply) => {
    const { id } = request.params;

    const plan = await prisma.treatmentPlan.findUnique({
      where: { id },
      include: {
        patient: true,
        dentist: true,
        items: {
          include: {
            analysis: { select: { id: true, type: true, score: true } },
          },
          orderBy: { priority: 'asc' },
        },
      },
    });

    if (!plan) {
      throw new NotFoundError('TreatmentPlan');
    }

    return reply.send(plan);
  });

  // PUT /treatment-plans/:id - Update treatment plan
  server.put('/treatment-plans/:id', { schema: { params: treatmentPlanIdSchema, body: updateTreatmentPlanSchema } }, async (request, reply) => {
    const { id } = request.params;
    const data = request.body;

    const statusChanges: Record<string, any> = {};
    if (data.status === 'PROPOSED') {
      statusChanges.proposedAt = new Date();
    } else if (data.status === 'ACCEPTED') {
      statusChanges.acceptedAt = new Date();
    } else if (data.status === 'COMPLETED') {
      statusChanges.completedAt = new Date();
    }

    const plan = await prisma.treatmentPlan.update({
      where: { id },
      data: { ...data, ...statusChanges },
    });

    // Emit events for status changes
    if (data.status === 'PROPOSED') {
      await eventBus.emit(EventType.TREATMENT_PLAN_PROPOSED, { planId: id, patientId: plan.patientId } as any);
    } else if (data.status === 'ACCEPTED') {
      await eventBus.emit(EventType.TREATMENT_PLAN_ACCEPTED, {
        planId: id,
        patientId: plan.patientId,
        acceptedAt: statusChanges.acceptedAt,
      });
    } else if (data.status === 'IN_PROGRESS') {
      await eventBus.emit(EventType.TREATMENT_PLAN_STARTED, { planId: id, patientId: plan.patientId } as any);
    } else if (data.status === 'COMPLETED') {
      await eventBus.emit(EventType.TREATMENT_PLAN_COMPLETED, {
        planId: id,
        patientId: plan.patientId,
        completedAt: statusChanges.completedAt,
      });
      businessMetrics.treatmentPlanCompleted();
    }

    logger.info(`Treatment plan updated`, { planId: id, status: data.status });
    return reply.send(plan);
  });

  // DELETE /treatment-plans/:id - Cancel treatment plan
  server.delete('/treatment-plans/:id', { schema: { params: treatmentPlanIdSchema } }, async (request, reply) => {
    const { id } = request.params;

    await prisma.treatmentPlan.update({
      where: { id },
      data: { status: 'CANCELLED' },
    });

    await eventBus.emit(EventType.TREATMENT_PLAN_CANCELLED, { planId: id } as any);
    logger.info(`Treatment plan cancelled`, { planId: id });

    return reply.code(204).send();
  });

  // POST /treatment-plans/:planId/items - Add item to treatment plan
  server.post(
    '/treatment-plans/:planId/items',
    { schema: { params: z.object({ planId: z.string().regex(/^\d+$/).transform(Number) }), body: createTreatmentPlanItemSchema } },
    async (request, reply) => {
      const { planId } = request.params;
      const data = request.body;

      const item = await prisma.treatmentPlanItem.create({
        data: {
          ...data,
          planId,
        },
      });

      logger.info(`Treatment plan item added`, { planId, itemId: item.id });
      return reply.code(201).send(item);
    }
  );

  // PUT /treatment-plans/:planId/items/:itemId - Update treatment plan item
  server.put(
    '/treatment-plans/:planId/items/:itemId',
    { schema: { params: treatmentPlanItemIdSchema, body: updateTreatmentPlanItemSchema } },
    async (request, reply) => {
      const { itemId } = request.params;
      const data = request.body;

      const statusChanges: Record<string, any> = {};
      if (data.status === 'COMPLETED') {
        statusChanges.completedDate = new Date();
      }

      const item = await prisma.treatmentPlanItem.update({
        where: { id: itemId },
        data: { ...data, ...statusChanges },
      });

      logger.info(`Treatment plan item updated`, { itemId, status: data.status });
      return reply.send(item);
    }
  );

  // DELETE /treatment-plans/:planId/items/:itemId - Remove treatment plan item
  server.delete(
    '/treatment-plans/:planId/items/:itemId',
    { schema: { params: treatmentPlanItemIdSchema } },
    async (request, reply) => {
      const { itemId } = request.params;

      await prisma.treatmentPlanItem.delete({
        where: { id: itemId },
      });

      logger.info(`Treatment plan item deleted`, { itemId });
      return reply.code(204).send();
    }
  );
}

// Import z for inline schema
import { z } from 'zod';
