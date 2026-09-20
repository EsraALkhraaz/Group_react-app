import 'dotenv/config';

const required = (name: string, fallback?: string): string => {
  const value = process.env[name] ?? fallback;
  if (!value) throw new Error(`متغيّر البيئة ${name} مفقود`);
  return value;
};

export const config = {
  port: Number(process.env.PORT ?? 3000),
  env: process.env.NODE_ENV ?? 'development',
  databaseUrl: required('DATABASE_URL', 'postgres://darsy:darsy@localhost:5432/darsy'),

  // A development fallback exists so the app runs out of the box; production
  // refuses to start without a real secret — see assertProductionSafe below.
  jwtSecret: required('JWT_SECRET', 'dev-only-secret-change-me'),

  accessTokenMinutes: 15,
  refreshTokenDays: 30,

  otpMinutes: 5,
  otpMaxAttempts: 3,
  otpResendSeconds: 60,

  loginMaxAttempts: 5,
  loginWindowMinutes: 15,
} as const;

export function assertProductionSafe(): void {
  if (config.env !== 'production') return;
  if (config.jwtSecret.startsWith('dev-only')) {
    throw new Error('لا يجوز تشغيل الإنتاج بمفتاح التطوير — عيّن JWT_SECRET');
  }
}
