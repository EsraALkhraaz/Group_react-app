import crypto from 'node:crypto';
import argon2 from 'argon2';
import { config } from '../config.ts';
import { query, one } from './db.ts';
import { badRequest, tooMany } from './errors.ts';

export type OtpPurpose = 'verify_phone' | 'reset_password';

// Four digits, because it is typed off an SMS on a phone — and hashed, because
// a code that unlocks an account is a credential like any other.
const generate = (): string => String(crypto.randomInt(0, 10000)).padStart(4, '0');

export const issueOtp = async (userId: string, purpose: OtpPurpose): Promise<string> => {
  const recent = await one<{ seconds: string }>(
    `select extract(epoch from (now() - created_at)) as seconds
     from otp_codes where user_id = $1 and purpose = $2 and consumed_at is null`,
    [userId, purpose],
  );

  if (recent && Number(recent.seconds) < config.otpResendSeconds) {
    throw tooMany(`انتظر ${config.otpResendSeconds - Math.floor(Number(recent.seconds))} ثانية قبل طلب رمز جديد`);
  }

  // Asking for a new code retires the old one, so only the latest ever works.
  await query(
    `update otp_codes set consumed_at = now()
     where user_id = $1 and purpose = $2 and consumed_at is null`,
    [userId, purpose],
  );

  const code = generate();
  await query(
    `insert into otp_codes (user_id, purpose, code_hash, expires_at)
     values ($1, $2, $3, now() + ($4 || ' minutes')::interval)`,
    [userId, purpose, await argon2.hash(code), config.otpMinutes],
  );

  return code;
};

export const consumeOtp = async (userId: string, purpose: OtpPurpose, code: string): Promise<void> => {
  const row = await one<{ id: string; code_hash: string; attempts: number; expired: boolean }>(
    `select id, code_hash, attempts, (expires_at < now()) as expired
     from otp_codes where user_id = $1 and purpose = $2 and consumed_at is null`,
    [userId, purpose],
  );

  if (!row) throw badRequest('otp_missing', 'لا يوجد رمز فعّال — اطلب رمزًا جديدًا');
  if (row.expired) throw badRequest('otp_expired', 'انتهت صلاحية الرمز — اطلب رمزًا جديدًا');

  if (await argon2.verify(row.code_hash, code)) {
    await query('update otp_codes set consumed_at = now() where id = $1', [row.id]);
    return;
  }

  // A wrong guess costs an attempt; running out burns the code entirely.
  const attempts = row.attempts + 1;
  if (attempts >= config.otpMaxAttempts) {
    await query('update otp_codes set attempts = $2, consumed_at = now() where id = $1', [row.id, attempts]);
    throw tooMany('استنفدت المحاولات — اطلب رمزًا جديدًا');
  }

  await query('update otp_codes set attempts = $2 where id = $1', [row.id, attempts]);
  throw badRequest('otp_wrong', `رمز غير صحيح — بقي ${config.otpMaxAttempts - attempts} محاولة`);
};
