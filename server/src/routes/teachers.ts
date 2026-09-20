import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import * as teachers from '../services/teachers.ts';
import { requireRole } from '../lib/guard.ts';

const modeSchema = z.enum(['online', 'f2f']);
const kindSchema = z.enum(['individual', 'group']);

const rateSchema = z.object({
  mode: modeSchema,
  kind: kindSchema,
  price: z.number().min(10, 'أقل سعر 10 د.ل').max(200, 'أعلى سعر 200 د.ل'),
  seats: z.number().int().min(2).max(12).optional(),
});

const slotSchema = z.object({
  weekday: z.number().int().min(0).max(6),
  startsAt: z.string().regex(/^\d{2}:\d{2}$/),
  endsAt: z.string().regex(/^\d{2}:\d{2}$/),
  mode: modeSchema.optional(),
}).refine((s) => s.endsAt > s.startsAt, 'نهاية الفترة يجب أن تلي بدايتها');

export default async function teacherRoutes(app: FastifyInstance): Promise<void> {
  app.get('/teachers', async (request) => {
    const filters = z.object({
      subject: z.string().optional(),
      grade: z.string().optional(),
      language: z.string().optional(),
      city: z.string().optional(),
      mode: modeSchema.optional(),
      kind: kindSchema.optional(),
      sort: z.enum(['rating', 'price', 'sessions']).optional(),
    }).parse(request.query);

    return { teachers: await teachers.search(filters) };
  });

  app.get('/teachers/:id', async (request) => {
    const { id } = z.object({ id: z.string().uuid() }).parse(request.params);
    return { teacher: await teachers.publicProfile(id) };
  });

  app.get('/me/teacher', { preHandler: requireRole('teacher') }, async (request) =>
    ({ teacher: await teachers.ownProfile(request.session!.userId) }));

  app.patch('/me/teacher', { preHandler: requireRole('teacher') }, async (request) => {
    const body = z.object({
      bio: z.string().trim().max(1000).optional(),
      experience: z.string().trim().max(1000).optional(),
      city: z.string().optional(),
      subjects: z.array(z.string()).optional(),
      grades: z.array(z.string()).optional(),
      languages: z.array(z.string()).optional(),
      areas: z.array(z.string()).optional(),
    }).parse(request.body);

    return { teacher: await teachers.updateProfile(request.session!.userId, body) };
  });

  app.put('/me/teacher/rates', { preHandler: requireRole('teacher') }, async (request) => {
    const { rates } = z.object({ rates: z.array(rateSchema).min(1, 'حدد سعرًا واحدًا على الأقل') }).parse(request.body);
    return { rates: await teachers.setRates(request.session!.userId, rates) };
  });

  app.get('/me/teacher/availability', { preHandler: requireRole('teacher') }, async (request) =>
    ({ availability: await teachers.availability(request.session!.userId) }));

  app.put('/me/teacher/availability', { preHandler: requireRole('teacher') }, async (request) => {
    const { slots } = z.object({ slots: z.array(slotSchema) }).parse(request.body);
    return { availability: await teachers.setAvailability(request.session!.userId, slots) };
  });

  app.post('/me/teacher/documents', { preHandler: requireRole('teacher') }, async (request) => {
    const body = z.object({
      storageKey: z.string().trim().min(3),
      docType: z.enum(['national_id', 'certificate']).optional(),
    }).parse(request.body);

    return { teacher: await teachers.submitDocument(request.session!.userId, body.storageKey, body.docType) };
  });

  app.get('/admin/verification', { preHandler: requireRole('admin') }, async () =>
    ({ pending: await teachers.pendingVerifications() }));

  app.post('/admin/verification/:id', { preHandler: requireRole('admin') }, async (request) => {
    const { id } = z.object({ id: z.string().uuid() }).parse(request.params);
    const body = z.object({
      approved: z.boolean(),
      reason: z.string().trim().optional(),
    }).parse(request.body);

    return teachers.reviewVerification(request.session!.userId, id, body.approved, body.reason);
  });
}
