import { test, before, after, describe } from 'node:test';
import assert from 'node:assert/strict';
import type { InjectOptions, LightMyRequestResponse } from 'fastify';
import { buildApp } from '../src/app.ts';
import { pool, query } from '../src/lib/db.ts';

process.env.NODE_ENV = 'test';

let app: Awaited<ReturnType<typeof buildApp>>;

// Typed explicitly: inject() has a chainable overload that TypeScript picks
// otherwise, and the response shape disappears with it.
const inject = (options: InjectOptions): Promise<LightMyRequestResponse> =>
  app.inject(options) as unknown as Promise<LightMyRequestResponse>;

const post = (url: string, payload: unknown, headers: Record<string, string> = {}) =>
  inject({ method: 'POST', url, payload: payload as InjectOptions['payload'], headers });

const get = (url: string, headers: Record<string, string> = {}) =>
  inject({ method: 'GET', url, headers });

const signup = (over: Record<string, unknown> = {}) =>
  post('/api/auth/signup', {
    role: 'student', fullName: 'أحمد الزوي', phone: '0910000001', password: 'darsy1234', agreed: true, ...over,
  });

before(async () => {
  app = await buildApp();
  // A clean slate, so a rerun never passes on yesterday's rows.
  await query('truncate login_attempts, otp_codes, refresh_tokens, teacher_profiles, users restart identity cascade');
});

after(async () => {
  await app.close();
  await pool.end();
});

describe('التسجيل', () => {
  test('ينشئ حسابًا ويعيد رمز تحقق', async () => {
    const res = await signup();
    assert.equal(res.statusCode, 201);
    const body = res.json();
    assert.equal(body.user.phone, '0910000001');
    assert.equal(body.user.phoneVerified, false);
    assert.match(body.devOtp, /^\d{4}$/);
    assert.ok(body.accessToken);
  });

  test('كلمة المرور لا تُخزَّن نصًا صريحًا', async () => {
    const rows = await query<{ password_hash: string }>('select password_hash from users where phone = $1', ['0910000001']);
    assert.ok(rows[0]!.password_hash.startsWith('$argon2id$'));
    assert.ok(!rows[0]!.password_hash.includes('darsy1234'));
  });

  test('يرفض رقمًا غير ليبي', async () => {
    const res = await signup({ phone: '0511111111' });
    assert.equal(res.statusCode, 400);
    assert.equal(res.json().error, 'validation');
  });

  test('يرفض كلمة مرور ضعيفة', async () => {
    const res = await signup({ phone: '0910000009', password: 'abcdefgh' });
    assert.equal(res.statusCode, 400);
    assert.match(res.json().message, /حروف وأرقام/);
  });

  test('يرفض رقمًا مسجلًا بالفعل', async () => {
    const res = await signup();
    assert.equal(res.statusCode, 400);
    assert.equal(res.json().error, 'phone_taken');
  });

  test('يقبل نفس الرقم بدور مختلف', async () => {
    const res = await signup({ role: 'teacher', fullName: 'أحمد مدرسًا' });
    assert.equal(res.statusCode, 201);
  });

  test('ينشئ ملف مدرس تلقائيًا', async () => {
    const rows = await query('select 1 from teacher_profiles');
    assert.equal(rows.length, 1);
  });

  test('لا يسمح بإنشاء حساب إدارة', async () => {
    const res = await signup({ role: 'admin', phone: '0919999999' });
    assert.equal(res.statusCode, 400);
  });

  test('يرفض التسجيل بلا موافقة على الشروط', async () => {
    const res = await signup({ phone: '0910000008', agreed: false });
    assert.equal(res.statusCode, 400);
  });

  test('يقبل الرقم بصيغة +218 ويحوّله', async () => {
    const res = await signup({ phone: '+218910000002' });
    assert.equal(res.statusCode, 201);
    assert.equal(res.json().user.phone, '0910000002');
  });
});

describe('الدخول', () => {
  test('ينجح ببيانات صحيحة ويضع كعكة الجلسة', async () => {
    const res = await post('/api/auth/login', { role: 'student', phone: '0910000001', password: 'darsy1234' });
    assert.equal(res.statusCode, 200);
    assert.ok(res.json().accessToken);

    const cookie = res.cookies.find((c) => c.name === 'refresh_token');
    assert.ok(cookie, 'لا توجد كعكة تحديث');
    assert.equal(cookie!.httpOnly, true, 'الكعكة يجب أن تكون HttpOnly');
    assert.equal(cookie!.sameSite, 'Strict');
  });

  test('يرفض كلمة مرور خاطئة برسالة لا تكشف وجود الحساب', async () => {
    const wrong = await post('/api/auth/login', { role: 'student', phone: '0910000001', password: 'wrong1234' });
    const missing = await post('/api/auth/login', { role: 'student', phone: '0917777777', password: 'wrong1234' });

    assert.equal(wrong.statusCode, 401);
    assert.equal(missing.statusCode, 401);
    assert.equal(wrong.json().message, missing.json().message, 'الرسالتان يجب أن تتطابقا');
  });

  test('يقفل الحساب بعد بلوغ حد المحاولات الفاشلة', async () => {
    // Four wrong guesses are still under the limit of five.
    for (let i = 0; i < 4; i += 1) {
      await post('/api/auth/login', { role: 'student', phone: '0910000002', password: 'nope1234' });
    }
    const stillOpen = await post('/api/auth/login', { role: 'student', phone: '0910000002', password: 'nope1234' });
    assert.equal(stillOpen.statusCode, 401, 'دون الحد يبقى الرفض عاديًا لا قفلًا');

    // The fifth failure closes the door, even to the right password.
    const locked = await post('/api/auth/login', { role: 'student', phone: '0910000002', password: 'darsy1234' });
    assert.equal(locked.statusCode, 429, 'كلمة المرور الصحيحة يجب أن تُرفض أثناء القفل');
  });

  test('القفل يخص الرقم لا كل الحسابات', async () => {
    const other = await post('/api/auth/login', { role: 'student', phone: '0910000001', password: 'darsy1234' });
    assert.equal(other.statusCode, 200, 'قفل حساب لا يجوز أن يقفل غيره');
  });
});

describe('الحماية', () => {
  test('يرفض مسارًا محميًا بلا رمز', async () => {
    const res = await get('/api/auth/me');
    assert.equal(res.statusCode, 401);
  });

  test('يرفض رمزًا ملفّقًا', async () => {
    const res = await get('/api/auth/me', { authorization: 'Bearer not.a.real.token' });
    assert.equal(res.statusCode, 401);
  });

  test('يقبل رمزًا صحيحًا', async () => {
    const login = await post('/api/auth/login', { role: 'student', phone: '0910000001', password: 'darsy1234' });
    const res = await get('/api/auth/me', { authorization: `Bearer ${login.json().accessToken}` });
    assert.equal(res.statusCode, 200);
    assert.equal(res.json().user.phone, '0910000001');
  });
});

describe('رمز التحقق', () => {
  test('يرفض رمزًا خاطئًا ويحسب المحاولة', async () => {
    const created = await signup({ phone: '0910000003' });
    const token = created.json().accessToken;
    const headers = { authorization: `Bearer ${token}` };

    const wrong = await post('/api/auth/verify-phone', { code: '0000' }, headers);
    // 0000 may be the real code; only assert on a code we know is wrong.
    const real = created.json().devOtp as string;
    const definitelyWrong = real === '0000' ? '1111' : '0000';

    const res = wrong.statusCode === 200
      ? await post('/api/auth/verify-phone', { code: definitelyWrong }, headers)
      : wrong;
    assert.equal(res.statusCode, 400);
    assert.match(res.json().message, /بقي \d محاولة/);
  });

  test('يوثّق الرقم بالرمز الصحيح', async () => {
    const created = await signup({ phone: '0910000004' });
    const headers = { authorization: `Bearer ${created.json().accessToken}` };

    const res = await post('/api/auth/verify-phone', { code: created.json().devOtp }, headers);
    assert.equal(res.statusCode, 200);

    const me = await get('/api/auth/me', headers);
    assert.equal(me.json().user.phoneVerified, true);
  });

  test('لا يقبل الرمز نفسه مرتين', async () => {
    const created = await signup({ phone: '0910000005' });
    const headers = { authorization: `Bearer ${created.json().accessToken}` };
    const code = created.json().devOtp;

    await post('/api/auth/verify-phone', { code }, headers);
    const again = await post('/api/auth/verify-phone', { code }, headers);
    assert.equal(again.statusCode, 400);
  });

  test('الرمز مخزَّن مجزّأً لا نصًا', async () => {
    const rows = await query<{ code_hash: string }>('select code_hash from otp_codes limit 1');
    assert.ok(rows[0]!.code_hash.startsWith('$argon2'));
  });
});

describe('تدوير الجلسة', () => {
  test('يمنح رمزًا جديدًا ويُبطل القديم', async () => {
    const login = await post('/api/auth/login', { role: 'student', phone: '0910000001', password: 'darsy1234' });
    const first = login.cookies.find((c) => c.name === 'refresh_token')!.value;

    const refreshed = await post('/api/auth/refresh', { refreshToken: first });
    assert.equal(refreshed.statusCode, 200);
    assert.ok(refreshed.json().accessToken);

    const reuse = await post('/api/auth/refresh', { refreshToken: first });
    assert.equal(reuse.statusCode, 401, 'إعادة استخدام الرمز القديم يجب أن تُرفض');
  });

  test('إعادة استخدام رمز مسروق تُنهي كل الجلسات', async () => {
    const login = await post('/api/auth/login', { role: 'student', phone: '0910000001', password: 'darsy1234' });
    const stolen = login.cookies.find((c) => c.name === 'refresh_token')!.value;

    const rotated = await post('/api/auth/refresh', { refreshToken: stolen });
    const fresh = rotated.cookies.find((c) => c.name === 'refresh_token')!.value;

    await post('/api/auth/refresh', { refreshToken: stolen });        // the theft
    const victim = await post('/api/auth/refresh', { refreshToken: fresh });
    assert.equal(victim.statusCode, 401, 'الجلسة السليمة يجب أن تُقطع أيضًا');
  });
});

describe('استعادة كلمة المرور', () => {
  test('لا تكشف إن كان الرقم مسجلًا', async () => {
    const known = await post('/api/auth/forgot', { role: 'student', phone: '0910000004' });
    const unknown = await post('/api/auth/forgot', { role: 'student', phone: '0918888888' });

    assert.equal(known.statusCode, 200);
    assert.equal(unknown.statusCode, 200);
    assert.equal(known.json().ok, unknown.json().ok);
  });

  test('تغيّر كلمة المرور بالرمز وتُنهي الجلسات', async () => {
    const created = await signup({ phone: '0910000006' });
    const oldRefresh = created.cookies.find((c) => c.name === 'refresh_token')!.value;

    const forgot = await post('/api/auth/forgot', { role: 'student', phone: '0910000006' });
    const res = await post('/api/auth/reset', {
      role: 'student', phone: '0910000006', code: forgot.json().devOtp, password: 'newpass123',
    });
    assert.equal(res.statusCode, 200);

    const withNew = await post('/api/auth/login', { role: 'student', phone: '0910000006', password: 'newpass123' });
    assert.equal(withNew.statusCode, 200);

    const stale = await post('/api/auth/refresh', { refreshToken: oldRefresh });
    assert.equal(stale.statusCode, 401, 'الجلسات القديمة يجب أن تنتهي بعد تغيير كلمة المرور');
  });
});
