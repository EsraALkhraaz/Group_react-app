import Fastify, { type FastifyInstance } from 'fastify';
import cookie from '@fastify/cookie';
import rateLimit from '@fastify/rate-limit';
import { ZodError } from 'zod';
import { config, assertProductionSafe } from './config.ts';
import { ApiError } from './lib/errors.ts';
import authRoutes from './routes/auth.ts';

export async function buildApp(): Promise<FastifyInstance> {
  assertProductionSafe();

  const app = Fastify({ logger: config.env !== 'test' });

  await app.register(cookie);

  // A blunt ceiling on top of the per-account lockout: one is about the
  // account, this is about the connection.
  await app.register(rateLimit, { max: 100, timeWindow: '1 minute' });

  app.setErrorHandler((error, request, reply) => {
    if (error instanceof ApiError) {
      return reply.code(error.status).send({ error: error.code, message: error.message });
    }

    if (error instanceof ZodError) {
      const first = error.issues[0];
      return reply.code(400).send({
        error: 'validation',
        message: first?.message ?? 'بيانات غير صحيحة',
        field: first?.path.join('.'),
      });
    }

    if ((error as { statusCode?: number }).statusCode === 429) {
      return reply.code(429).send({ error: 'too_many_requests', message: 'طلبات كثيرة — أعد المحاولة بعد قليل' });
    }

    // Anything unrecognised is logged in full and reported as nothing: an
    // internal message can leak table names, queries or worse.
    request.log.error(error);
    return reply.code(500).send({ error: 'internal', message: 'حدث خطأ غير متوقع' });
  });

  app.get('/health', async () => ({ ok: true, env: config.env }));

  await app.register(authRoutes, { prefix: '/api' });

  return app;
}
