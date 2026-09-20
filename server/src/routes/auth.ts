import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { config } from '../config.ts';
import * as auth from '../services/auth.ts';
import { requireAuth } from '../lib/guard.ts';
import { rotateRefreshToken, revokeRefreshToken } from '../lib/tokens.ts';
import { badRequest, unauthorized } from '../lib/errors.ts';
import {
  phoneSchema, passwordSchema, roleSchema, signupRoleSchema, codeSchema,
} from '../lib/validation.ts';

// HttpOnly so no script can read it, Secure in production, SameSite=strict so a
// hostile page cannot ride the session.
const cookieOptions = {
  httpOnly: true,
  sameSite: 'strict',
  secure: config.env === 'production',
  path: '/',
  maxAge: config.refreshTokenDays * 24 * 60 * 60,
} as const;

const meta = (request: { headers: Record<string, unknown>; ip: string }) => ({
  userAgent: String(request.headers['user-agent'] ?? ''),
  ip: request.ip,
});

export default async function authRoutes(app: FastifyInstance): Promise<void> {
  app.post('/auth/signup', async (request, reply) => {
    const body = z.object({
      role: signupRoleSchema,
      fullName: z.string().trim().min(2, 'أدخل الاسم كاملًا'),
      phone: phoneSchema,
      password: passwordSchema,
      gradeCode: z.string().optional(),
      agreed: z.literal(true, { message: 'يلزم الموافقة على الشروط' }),
    }).parse(request.body);

    const result = await auth.signUp({ ...body, meta: meta(request) });
    reply.setCookie('refresh_token', result.refreshToken, cookieOptions);

    // The code leaves the response entirely once an SMS provider is wired in.
    return reply.code(201).send({
      accessToken: result.accessToken,
      user: result.user,
      ...(config.env === 'production' ? {} : { devOtp: result.otp }),
    });
  });

  app.post('/auth/login', async (request, reply) => {
    const body = z.object({
      role: roleSchema,
      phone: phoneSchema,
      password: z.string().min(1, 'أدخل كلمة المرور'),
    }).parse(request.body);

    const result = await auth.signIn({ ...body, meta: meta(request) });
    reply.setCookie('refresh_token', result.refreshToken, cookieOptions);
    return { accessToken: result.accessToken, user: result.user };
  });

  app.post('/auth/refresh', async (request, reply) => {
    const token = request.cookies?.refresh_token ?? (request.body as { refreshToken?: string })?.refreshToken;
    if (!token) throw unauthorized('لا توجد جلسة');

    const { session, refreshToken } = await rotateRefreshToken(token, meta(request));
    reply.setCookie('refresh_token', refreshToken, cookieOptions);
    return { accessToken: (await import('../lib/tokens.ts')).signAccessToken(session) };
  });

  app.post('/auth/logout', async (request, reply) => {
    const token = request.cookies?.refresh_token;
    if (token) await revokeRefreshToken(token);
    reply.clearCookie('refresh_token', { path: '/' });
    return { ok: true };
  });

  app.post('/auth/verify-phone', { preHandler: requireAuth }, async (request) => {
    const { code } = z.object({ code: codeSchema }).parse(request.body);
    await auth.confirmPhone(request.session!.userId, code);
    return { ok: true };
  });

  app.post('/auth/resend-code', { preHandler: requireAuth }, async (request) => {
    const otp = await auth.requestPhoneCode(request.session!.userId);
    return config.env === 'production' ? { ok: true } : { ok: true, devOtp: otp };
  });

  app.post('/auth/forgot', async (request) => {
    const body = z.object({ role: roleSchema, phone: phoneSchema }).parse(request.body);
    const otp = await auth.requestPasswordReset(body.role, body.phone);

    // Always the same answer, so the endpoint cannot be used to discover which
    // numbers have accounts.
    return config.env === 'production' || !otp ? { ok: true } : { ok: true, devOtp: otp };
  });

  app.post('/auth/reset', async (request) => {
    const body = z.object({
      role: roleSchema,
      phone: phoneSchema,
      code: codeSchema,
      password: passwordSchema,
    }).parse(request.body);

    await auth.resetPassword(body);
    return { ok: true };
  });

  app.post('/auth/change-password', { preHandler: requireAuth }, async (request) => {
    const body = z.object({
      current: z.string().min(1, 'أدخل كلمة المرور الحالية'),
      next: passwordSchema,
    }).parse(request.body);

    if (body.current === body.next) throw badRequest('same_password', 'اختر كلمة مرور مختلفة عن الحالية');

    await auth.changePassword(request.session!.userId, body.current, body.next);
    return { ok: true };
  });

  app.get('/auth/me', { preHandler: requireAuth }, async (request) => {
    const { one } = await import('../lib/db.ts');
    const row = await one(
      `select id, role, full_name as "fullName", phone,
              (phone_verified_at is not null) as "phoneVerified"
       from users where id = $1`,
      [request.session!.userId],
    );
    return { user: row };
  });
}
