import { config } from '../config.ts';
import { query, one } from '../lib/db.ts';
import { hashPassword, verifyPassword } from '../lib/passwords.ts';
import { issueOtp, consumeOtp } from '../lib/otp.ts';
import { badRequest, tooMany, unauthorized } from '../lib/errors.ts';
import { issueRefreshToken, signAccessToken, revokeAllForUser } from '../lib/tokens.ts';

type Role = 'student' | 'parent' | 'teacher' | 'admin';

export type AuthResult = {
  accessToken: string;
  refreshToken: string;
  user: { id: string; role: Role; fullName: string; phone: string; phoneVerified: boolean };
};

const publicUser = (row: {
  id: string; role: Role; full_name: string; phone: string; phone_verified_at: Date | null;
}) => ({
  id: row.id,
  role: row.role,
  fullName: row.full_name,
  phone: row.phone,
  phoneVerified: Boolean(row.phone_verified_at),
});

// Too many wrong guesses on one number stop further attempts, whatever the
// source IP — the target is the account, not the connection.
const assertNotLockedOut = async (phone: string, role: Role): Promise<void> => {
  const row = await one<{ failures: string }>(
    `select count(*) as failures from login_attempts
     where phone = $1 and role = $2 and ok = false
       and created_at > now() - ($3 || ' minutes')::interval`,
    [phone, role, config.loginWindowMinutes],
  );

  if (Number(row?.failures ?? 0) >= config.loginMaxAttempts) {
    throw tooMany(`محاولات كثيرة — انتظر ${config.loginWindowMinutes} دقيقة ثم أعد المحاولة`);
  }
};

const record = (phone: string, role: Role, ok: boolean, ip?: string) =>
  query('insert into login_attempts (phone, role, ok, ip) values ($1,$2,$3,$4)', [phone, role, ok, ip ?? null]);

export const signUp = async (input: {
  role: Exclude<Role, 'admin'>;
  fullName: string;
  phone: string;
  password: string;
  gradeCode?: string;
  meta?: { userAgent?: string; ip?: string };
}): Promise<AuthResult & { otp: string }> => {
  const existing = await one('select 1 from users where role = $1 and phone = $2', [input.role, input.phone]);
  if (existing) throw badRequest('phone_taken', 'هذا الرقم مسجل بالفعل — سجّل الدخول بدلاً من ذلك');

  const grade = input.gradeCode
    ? await one<{ id: string }>('select id from grades where code = $1 and disabled_at is null', [input.gradeCode])
    : null;

  const user = await one<Parameters<typeof publicUser>[0]>(
    `insert into users (role, full_name, phone, password_hash, grade_id)
     values ($1, $2, $3, $4, $5)
     returning id, role, full_name, phone, phone_verified_at`,
    [input.role, input.fullName.trim(), input.phone, await hashPassword(input.password), grade?.id ?? null],
  );

  if (!user) throw badRequest('signup_failed', 'تعذّر إنشاء الحساب');

  if (input.role === 'teacher') {
    await query('insert into teacher_profiles (user_id) values ($1)', [user.id]);
  }

  // The code is returned so the prototype can show it; in production it goes to
  // the SMS provider and never comes back in the response.
  const otp = await issueOtp(user.id, 'verify_phone');

  return {
    accessToken: signAccessToken({ userId: user.id, role: user.role }),
    refreshToken: await issueRefreshToken(user.id, input.meta ?? {}),
    user: publicUser(user),
    otp,
  };
};

export const signIn = async (input: {
  role: Role;
  phone: string;
  password: string;
  meta?: { userAgent?: string; ip?: string };
}): Promise<AuthResult> => {
  await assertNotLockedOut(input.phone, input.role);

  const row = await one<Parameters<typeof publicUser>[0] & { password_hash: string; disabled_at: Date | null }>(
    `select id, role, full_name, phone, phone_verified_at, password_hash, disabled_at
     from users where role = $1 and phone = $2`,
    [input.role, input.phone],
  );

  // The same answer whether the number is unknown or the password is wrong:
  // telling them apart tells an attacker which numbers are registered.
  const ok = row ? await verifyPassword(row.password_hash, input.password) : false;
  await record(input.phone, input.role, ok, input.meta?.ip);

  if (!row || !ok) throw unauthorized('رقم الهاتف أو كلمة المرور غير صحيحة');
  if (row.disabled_at) throw unauthorized('هذا الحساب موقوف — تواصل مع إدارة درسي');

  return {
    accessToken: signAccessToken({ userId: row.id, role: row.role }),
    refreshToken: await issueRefreshToken(row.id, input.meta ?? {}),
    user: publicUser(row),
  };
};

export const confirmPhone = async (userId: string, code: string): Promise<void> => {
  await consumeOtp(userId, 'verify_phone', code);
  await query('update users set phone_verified_at = now() where id = $1', [userId]);
};

export const requestPhoneCode = (userId: string) => issueOtp(userId, 'verify_phone');

// Forgetting a password must not reveal whether an account exists, so the
// caller always gets the same answer; only a real account receives a code.
export const requestPasswordReset = async (role: Role, phone: string): Promise<string | null> => {
  const user = await one<{ id: string }>('select id from users where role = $1 and phone = $2', [role, phone]);
  if (!user) return null;
  return issueOtp(user.id, 'reset_password');
};

export const resetPassword = async (input: {
  role: Role; phone: string; code: string; password: string;
}): Promise<void> => {
  const user = await one<{ id: string }>('select id from users where role = $1 and phone = $2', [input.role, input.phone]);
  if (!user) throw badRequest('otp_missing', 'لا يوجد رمز فعّال — اطلب رمزًا جديدًا');

  await consumeOtp(user.id, 'reset_password', input.code);
  await query('update users set password_hash = $2 where id = $1', [user.id, await hashPassword(input.password)]);

  // A password change ends every session: whoever knew the old one is out.
  await revokeAllForUser(user.id);
};

export const changePassword = async (userId: string, current: string, next: string): Promise<void> => {
  const row = await one<{ password_hash: string }>('select password_hash from users where id = $1', [userId]);
  if (!row || !(await verifyPassword(row.password_hash, current))) {
    throw badRequest('wrong_password', 'كلمة المرور الحالية غير صحيحة');
  }
  await query('update users set password_hash = $2 where id = $1', [userId, await hashPassword(next)]);
  await revokeAllForUser(userId);
};
