import { FastifyInstance } from 'fastify';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import prisma from '../db';
import { createClinicSchema, updateClinicSchema, clinicIdSchema } from '../schemas/clinic.schema';
import { NotFoundError } from '../lib/errors';
import { logger } from '../lib/logger';
import { eventBus } from '../events/eventBus';
import { EventType } from '../events/types';

export async function clinicRoutes(fastify: FastifyInstance) {
  const server = fastify.withTypeProvider<ZodTypeProvider>();

  // POST /clinics - Create clinic
  server.post('/clinics', { schema: { body: createClinicSchema } }, async (request, reply) => {
    const data = request.body;

    const clinic = await prisma.clinic.create({ data });

    await eventBus.emit(EventType.CLINIC_CREATED, {
      clinicId: clinic.id,
      name: clinic.name,
      code: clinic.code,
    });

    logger.info(`Clinic created: ${clinic.name}`, { clinicId: clinic.id });
    return reply.code(201).send(clinic);
  });

  // GET /clinics - List all clinics
  server.get('/clinics', async (request, reply) => {
    const clinics = await prisma.clinic.findMany({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { dentists: true, patients: true, appointments: true },
        },
      },
    });

    return reply.send(clinics);
  });

  // GET /clinics/:id - Get clinic details
  server.get('/clinics/:id', { schema: { params: clinicIdSchema } }, async (request, reply) => {
    const { id } = request.params;

    const clinic = await prisma.clinic.findUnique({
      where: { id },
      include: {
        dentists: { where: { isActive: true } },
        _count: {
          select: { patients: true, appointments: true },
        },
      },
    });

    if (!clinic) {
      throw new NotFoundError('Clinic');
    }

    return reply.send(clinic);
  });

  // PUT /clinics/:id - Update clinic
  server.put('/clinics/:id', { schema: { params: clinicIdSchema, body: updateClinicSchema } }, async (request, reply) => {
    const { id } = request.params;
    const data = request.body;

    const clinic = await prisma.clinic.update({
      where: { id },
      data,
    });

    await eventBus.emit(EventType.CLINIC_UPDATED, { clinicId: clinic.id, changes: data });
    logger.info(`Clinic updated: ${clinic.name}`, { clinicId: clinic.id });

    return reply.send(clinic);
  });

  // DELETE /clinics/:id - Soft delete clinic
  server.delete('/clinics/:id', { schema: { params: clinicIdSchema } }, async (request, reply) => {
    const { id } = request.params;

    await prisma.clinic.update({
      where: { id },
      data: { isActive: false },
    });

    logger.info(`Clinic deactivated`, { clinicId: id });
    return reply.code(204).send();
  });
}
