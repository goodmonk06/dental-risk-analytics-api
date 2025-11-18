import { FastifyInstance } from 'fastify';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import prisma from '../db';
import { createDentistSchema, updateDentistSchema, dentistIdSchema } from '../schemas/dentist.schema';
import { NotFoundError } from '../lib/errors';
import { logger } from '../lib/logger';
import { eventBus } from '../events/eventBus';
import { EventType } from '../events/types';

export async function dentistRoutes(fastify: FastifyInstance) {
  const server = fastify.withTypeProvider<ZodTypeProvider>();

  // POST /dentists - Add dentist
  server.post('/dentists', { schema: { body: createDentistSchema } }, async (request, reply) => {
    const data = request.body;

    const dentist = await prisma.dentist.create({
      data,
      include: { clinic: true },
    });

    await eventBus.emit(EventType.DENTIST_ADDED, {
      dentistId: dentist.id,
      clinicId: dentist.clinicId,
      name: `${dentist.firstName} ${dentist.lastName}`,
      email: dentist.email,
    });

    logger.info(`Dentist added: ${dentist.firstName} ${dentist.lastName}`, { dentistId: dentist.id, clinicId: dentist.clinicId });
    return reply.code(201).send(dentist);
  });

  // GET /dentists - List dentists
  server.get('/dentists', async (request, reply) => {
    const dentists = await prisma.dentist.findMany({
      where: { isActive: true },
      include: {
        clinic: { select: { id: true, name: true } },
        _count: {
          select: { appointments: true, treatmentPlans: true },
        },
      },
      orderBy: { lastName: 'asc' },
    });

    return reply.send(dentists);
  });

  // GET /dentists/:id - Get dentist details
  server.get('/dentists/:id', { schema: { params: dentistIdSchema } }, async (request, reply) => {
    const { id } = request.params;

    const dentist = await prisma.dentist.findUnique({
      where: { id },
      include: {
        clinic: true,
        appointments: {
          where: { scheduledAt: { gte: new Date() } },
          orderBy: { scheduledAt: 'asc' },
          take: 10,
        },
      },
    });

    if (!dentist) {
      throw new NotFoundError('Dentist');
    }

    return reply.send(dentist);
  });

  // PUT /dentists/:id - Update dentist
  server.put('/dentists/:id', { schema: { params: dentistIdSchema, body: updateDentistSchema } }, async (request, reply) => {
    const { id } = request.params;
    const data = request.body;

    const dentist = await prisma.dentist.update({
      where: { id },
      data,
    });

    await eventBus.emit(EventType.DENTIST_UPDATED, { dentistId: dentist.id, changes: data });
    logger.info(`Dentist updated`, { dentistId: id });

    return reply.send(dentist);
  });

  // DELETE /dentists/:id - Deactivate dentist
  server.delete('/dentists/:id', { schema: { params: dentistIdSchema } }, async (request, reply) => {
    const { id } = request.params;

    await prisma.dentist.update({
      where: { id },
      data: { isActive: false },
    });

    await eventBus.emit(EventType.DENTIST_REMOVED, { dentistId: id });
    logger.info(`Dentist deactivated`, { dentistId: id });

    return reply.code(204).send();
  });
}
