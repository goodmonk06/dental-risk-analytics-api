import { FastifyInstance } from 'fastify';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import prisma from '../db';
import { createAppointmentSchema, updateAppointmentSchema, appointmentIdSchema } from '../schemas/appointment.schema';
import { NotFoundError } from '../lib/errors';
import { logger } from '../lib/logger';
import { eventBus } from '../events/eventBus';
import { EventType } from '../events/types';
import { businessMetrics } from '../lib/metrics';

export async function appointmentRoutes(fastify: FastifyInstance) {
  const server = fastify.withTypeProvider<ZodTypeProvider>();

  // POST /appointments - Schedule appointment
  server.post('/appointments', { schema: { body: createAppointmentSchema } }, async (request, reply) => {
    const data = request.body;

    const appointment = await prisma.appointment.create({
      data,
      include: {
        patient: { select: { id: true, code: true, firstName: true, lastName: true } },
        dentist: { select: { id: true, firstName: true, lastName: true } },
        clinic: { select: { id: true, name: true } },
      },
    });

    await eventBus.emit(EventType.APPOINTMENT_SCHEDULED, {
      appointmentId: appointment.id,
      patientId: appointment.patientId,
      dentistId: appointment.dentistId,
      clinicId: appointment.clinicId,
      scheduledAt: appointment.scheduledAt,
      type: appointment.type,
    });

    businessMetrics.appointmentScheduled(appointment.type, appointment.clinicId);
    logger.info(`Appointment scheduled`, { appointmentId: appointment.id, patientId: appointment.patientId });

    return reply.code(201).send(appointment);
  });

  // GET /appointments - List appointments
  server.get('/appointments', async (request, reply) => {
    const appointments = await prisma.appointment.findMany({
      where: {
        scheduledAt: { gte: new Date() },
        status: { notIn: ['CANCELLED', 'COMPLETED'] },
      },
      include: {
        patient: { select: { id: true, code: true, firstName: true, lastName: true } },
        dentist: { select: { id: true, firstName: true, lastName: true } },
        clinic: { select: { id: true, name: true } },
      },
      orderBy: { scheduledAt: 'asc' },
      take: 50,
    });

    return reply.send(appointments);
  });

  // GET /appointments/:id - Get appointment details
  server.get('/appointments/:id', { schema: { params: appointmentIdSchema } }, async (request, reply) => {
    const { id } = request.params;

    const appointment = await prisma.appointment.findUnique({
      where: { id },
      include: {
        patient: true,
        dentist: true,
        clinic: true,
      },
    });

    if (!appointment) {
      throw new NotFoundError('Appointment');
    }

    return reply.send(appointment);
  });

  // PUT /appointments/:id - Update appointment
  server.put('/appointments/:id', { schema: { params: appointmentIdSchema, body: updateAppointmentSchema } }, async (request, reply) => {
    const { id } = request.params;
    const data = request.body;

    // Handle status transitions
    const statusChanges: Record<string, any> = {};
    if (data.status === 'COMPLETED') {
      statusChanges.completedAt = new Date();
    } else if (data.status === 'CANCELLED') {
      statusChanges.cancelledAt = new Date();
    }

    const appointment = await prisma.appointment.update({
      where: { id },
      data: { ...data, ...statusChanges },
      include: {
        patient: { select: { id: true } },
        dentist: { select: { id: true } },
        clinic: { select: { id: true } },
      },
    });

    // Emit appropriate events
    if (data.status === 'CONFIRMED') {
      await eventBus.emit(EventType.APPOINTMENT_CONFIRMED, {
        appointmentId: id,
        patientId: appointment.patientId,
        dentistId: appointment.dentistId,
        clinicId: appointment.clinicId,
      } as any);
    } else if (data.status === 'IN_PROGRESS') {
      await eventBus.emit(EventType.APPOINTMENT_STARTED, {
        appointmentId: id,
        patientId: appointment.patientId,
        dentistId: appointment.dentistId,
        clinicId: appointment.clinicId,
      } as any);
    } else if (data.status === 'COMPLETED') {
      await eventBus.emit(EventType.APPOINTMENT_COMPLETED, {
        appointmentId: id,
        patientId: appointment.patientId,
        dentistId: appointment.dentistId,
        clinicId: appointment.clinicId,
        completedAt: statusChanges.completedAt,
      });
      businessMetrics.appointmentCompleted(appointment.type, appointment.clinicId);
    } else if (data.status === 'CANCELLED') {
      await eventBus.emit(EventType.APPOINTMENT_CANCELLED, {
        appointmentId: id,
        patientId: appointment.patientId,
        reason: data.cancellationReason,
      });
    }

    logger.info(`Appointment updated`, { appointmentId: id, status: data.status });
    return reply.send(appointment);
  });

  // DELETE /appointments/:id - Cancel appointment
  server.delete('/appointments/:id', { schema: { params: appointmentIdSchema } }, async (request, reply) => {
    const { id } = request.params;

    await prisma.appointment.update({
      where: { id },
      data: {
        status: 'CANCELLED',
        cancelledAt: new Date(),
        cancellationReason: 'Cancelled via API',
      },
    });

    logger.info(`Appointment cancelled`, { appointmentId: id });
    return reply.code(204).send();
  });
}
