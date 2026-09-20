import type { FastifyReply, FastifyRequest } from 'fastify';
import { readAccessToken, type Session } from './tokens.ts';
import { forbidden, unauthorized } from './errors.ts';

declare module 'fastify' {
  interface FastifyRequest { session?: Session }
}

const sessionFrom = (request: FastifyRequest): Session => {
  const header = request.headers.authorization;
  const token = header?.startsWith('Bearer ') ? header.slice(7) : request.cookies?.access_token;
  if (!token) throw unauthorized();
  return readAccessToken(token);
};

// Every protected route states the roles it serves. Hiding a button in the
// interface is presentation; this is the part that actually refuses.
export const requireRole = (...roles: Session['role'][]) =>
  async (request: FastifyRequest, _reply: FastifyReply): Promise<void> => {
    const session = sessionFrom(request);
    if (roles.length && !roles.includes(session.role)) throw forbidden();
    request.session = session;
  };

export const requireAuth = requireRole();
