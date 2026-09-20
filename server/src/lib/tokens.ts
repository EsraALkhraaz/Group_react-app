import crypto from 'node:crypto';
import jwt from 'jsonwebtoken';
import { config } from '../config.ts';
import { query, one } from './db.ts';
import { unauthorized } from './errors.ts';

export type Session = { userId: string; role: string };

export const signAccessToken = (session: Session): string =>
  jwt.sign(session, config.jwtSecret, { expiresIn: `${config.accessTokenMinutes}m` });

export const readAccessToken = (token: string): Session => {
  try {
    return jwt.verify(token, config.jwtSecret) as Session;
  } catch {
    throw unauthorized('انتهت الجلسة — سجّل الدخول من جديد');
  }
};

// The refresh token itself is random and never stored; only its hash is kept,
// so a stolen database still cannot resume anyone's session.
const hash = (token: string): string => crypto.createHash('sha256').update(token).digest('hex');

export const issueRefreshToken = async (
  userId: string,
  meta: { userAgent?: string; ip?: string } = {},
): Promise<string> => {
  const token = crypto.randomBytes(48).toString('base64url');
  await query(
    `insert into refresh_tokens (user_id, token_hash, expires_at, user_agent, ip)
     values ($1, $2, now() + ($3 || ' days')::interval, $4, $5)`,
    [userId, hash(token), config.refreshTokenDays, meta.userAgent ?? null, meta.ip ?? null],
  );
  return token;
};

// Rotation: using a refresh token consumes it and hands back a new one. A token
// that is used twice was copied, so every session of that user is cut off.
export const rotateRefreshToken = async (
  token: string,
  meta: { userAgent?: string; ip?: string } = {},
): Promise<{ session: Session; refreshToken: string }> => {
  const row = await one<{
    id: string; user_id: string; role: string; revoked_at: Date | null; expired: boolean;
  }>(
    `select t.id, t.user_id, u.role, t.revoked_at, (t.expires_at < now()) as expired
     from refresh_tokens t join users u on u.id = t.user_id
     where t.token_hash = $1`,
    [hash(token)],
  );

  if (!row) throw unauthorized('جلسة غير صالحة');

  if (row.revoked_at) {
    await revokeAllForUser(row.user_id);
    throw unauthorized('استُخدم رمز الجلسة مرتين — أُنهيت كل الجلسات احتياطًا');
  }

  if (row.expired) throw unauthorized('انتهت صلاحية الجلسة');

  const next = await issueRefreshToken(row.user_id, meta);
  await query(
    `update refresh_tokens set revoked_at = now(),
       replaced_by = (select id from refresh_tokens where token_hash = $2)
     where id = $1`,
    [row.id, hash(next)],
  );

  return { session: { userId: row.user_id, role: row.role }, refreshToken: next };
};

export const revokeRefreshToken = async (token: string): Promise<void> => {
  await query('update refresh_tokens set revoked_at = now() where token_hash = $1 and revoked_at is null', [hash(token)]);
};

export const revokeAllForUser = async (userId: string): Promise<void> => {
  await query('update refresh_tokens set revoked_at = now() where user_id = $1 and revoked_at is null', [userId]);
};
