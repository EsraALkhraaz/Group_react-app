import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import * as bookings from '../services/bookings.ts';
import { requireAuth, requireRole } from '../lib/guard.ts';
import { forbidden } from '../lib/errors.ts';

const idParam = z.object({ id: z.string().uuid() });

export default async function bookingRoutes(app: FastifyInstance): Promise<void> {
  app.get('/teachers/:id/slots', async (request) => {
    const { id } = idParam.parse(request.params);
    const { days } = z.object({ days: z.coerce.number().int().min(1).max(60).default(30) })
      .parse(request.query);

    return { slots: await bookings.availableSlots(id, days) };
  });

  app.post('/bookings', { preHandler: requireAuth }, async (request, reply) => {
    const session = request.session!;
    if (!['student', 'parent'].includes(session.role)) {
      throw forbidden('الحجز للطلاب وأولياء الأمور');
    }

    // Note what is absent: no price, no commission, no split. The client asks
    // for a lesson; the server decides what it costs.
    const body = z.object({
      teacherId: z.string().uuid(),
      childId: z.string().uuid().optional(),
      subject: z.string(),
      grade: z.string(),
      kind: z.enum(['individual', 'group']),
      mode: z.enum(['online', 'f2f']),
      startsAt: z.string(),
      note: z.string().trim().max(500).optional(),
    }).parse(request.body);

    return reply.code(201).send({ booking: await bookings.create(session.userId, body) });
  });

  app.get('/me/bookings', { preHandler: requireAuth }, async (request) => {
    const session = request.session!;
    return {
      bookings: session.role === 'teacher'
        ? await bookings.listForTeacher(session.userId)
        : await bookings.listForPayer(session.userId),
    };
  });

  app.get('/bookings/:id', { preHandler: requireAuth }, async (request) => {
    const { id } = idParam.parse(request.params);
    return { booking: await bookings.getById(id, request.session!) };
  });

  app.post('/bookings/:id/approve', { preHandler: requireRole('teacher') }, async (request) => {
    const { id } = idParam.parse(request.params);
    return { booking: await bookings.approve(id, request.session!.userId) };
  });

  app.post('/bookings/:id/reject', { preHandler: requireRole('teacher') }, async (request) => {
    const { id } = idParam.parse(request.params);
    const { reason } = z.object({ reason: z.string().trim().max(300).optional() }).parse(request.body ?? {});
    return { booking: await bookings.reject(id, request.session!.userId, reason) };
  });

  app.post('/bookings/:id/complete', { preHandler: requireRole('teacher') }, async (request) => {
    const { id } = idParam.parse(request.params);
    return { booking: await bookings.complete(id, request.session!.userId) };
  });

  app.post('/bookings/:id/cancel', { preHandler: requireAuth }, async (request) => {
    const { id } = idParam.parse(request.params);
    const { reason } = z.object({ reason: z.string().trim().max(300).optional() }).parse(request.body ?? {});
    return { booking: await bookings.cancel(id, request.session!, reason) };
  });
}
