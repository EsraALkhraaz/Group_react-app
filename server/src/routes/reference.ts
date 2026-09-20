import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import * as reference from '../services/reference.ts';
import { requireRole } from '../lib/guard.ts';
import { badRequest } from '../lib/errors.ts';

const kindParam = z.object({
  kind: z.string().refine(reference.isReferenceKind, 'قائمة غير معروفة'),
});

const itemBody = z.object({
  code: z.string().trim().min(2).regex(/^[a-z0-9_]+$/, 'الرمز بحروف إنجليزية صغيرة وأرقام'),
  name: z.string().trim().min(2, 'أدخل الاسم'),
  color: z.string().trim().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  stage: z.string().trim().optional(),
});

export default async function referenceRoutes(app: FastifyInstance): Promise<void> {
  // Public: every picker in the app reads from here.
  app.get('/reference', async () => reference.listAll(false));

  app.get('/admin/reference', { preHandler: requireRole('admin') }, async () =>
    reference.listAll(true));

  app.post('/admin/reference/:kind', { preHandler: requireRole('admin') }, async (request, reply) => {
    const { kind } = kindParam.parse(request.params);
    const body = itemBody.parse(request.body);
    return reply.code(201).send(await reference.create(kind as reference.ReferenceKind, body));
  });

  app.patch('/admin/reference/:kind/:id', { preHandler: requireRole('admin') }, async (request) => {
    const { kind } = kindParam.parse(request.params);
    const { id } = z.object({ id: z.string().uuid() }).parse(request.params);
    const body = itemBody.partial().omit({ code: true }).parse(request.body);

    if (Object.keys(body).length === 0) throw badRequest('nothing_to_update', 'لا يوجد ما يُحدَّث');
    return reference.rename(kind as reference.ReferenceKind, id, body);
  });

  // Retire, never delete — an old booking still has to name its subject.
  app.post('/admin/reference/:kind/:id/disabled', { preHandler: requireRole('admin') }, async (request) => {
    const { kind } = kindParam.parse(request.params);
    const { id } = z.object({ id: z.string().uuid() }).parse(request.params);
    const { disabled } = z.object({ disabled: z.boolean() }).parse(request.body);
    return reference.setDisabled(kind as reference.ReferenceKind, id, disabled);
  });
}
