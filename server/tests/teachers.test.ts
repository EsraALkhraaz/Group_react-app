import { test, before, after, describe } from 'node:test';
import assert from 'node:assert/strict';
import type { InjectOptions, LightMyRequestResponse } from 'fastify';
import { readFile } from 'node:fs/promises';
import { buildApp } from '../src/app.ts';
import { pool, query, one } from '../src/lib/db.ts';

process.env.NODE_ENV = 'test';

let app: Awaited<ReturnType<typeof buildApp>>;
let teacher: { token: string; id: string };
let admin: { token: string; id: string };
let learner: { token: string };

const inject = (options: InjectOptions): Promise<LightMyRequestResponse> =>
  app.inject(options) as unknown as Promise<LightMyRequestResponse>;

const auth = (token: string) => ({ authorization: `Bearer ${token}` });

const send = (method: 'POST' | 'PATCH' | 'PUT', url: string, payload: unknown, token?: string) =>
  inject({ method, url, payload: payload as InjectOptions['payload'], headers: token ? auth(token) : {} });

const get = (url: string, token?: string) =>
  inject({ method: 'GET', url, headers: token ? auth(token) : {} });

const signup = async (role: string, phone: string, name: string) => {
  const res = await send('POST', '/api/auth/signup',
    { role, fullName: name, phone, password: 'darsy1234', agreed: true });
  return { token: res.json().accessToken as string, id: res.json().user.id as string };
};

before(async () => {
  app = await buildApp();

  // Reference data is reset and reseeded too, so the suite never depends on
  // what a previous run left behind.
  await query(`truncate bookings, teacher_documents, teacher_suspensions, teacher_availability,
               teacher_rates, teacher_subjects, teacher_grades, teacher_languages, teacher_areas,
               notifications, audit_log, login_attempts, otp_codes, refresh_tokens,
               teacher_profiles, users, subjects, grades, languages, cities
               restart identity cascade`);
  await query(await readFile(new URL('../migrations/008_seed_reference.sql', import.meta.url), 'utf8'));

  teacher = await signup('teacher', '0911111111', 'أحمد المبروك');
  learner = await signup('student', '0910000001', 'أحمد الزوي');

  // An admin is created directly: the API deliberately offers no way to do it.
  const row = await one<{ id: string }>(
    `insert into users (role, full_name, phone, password_hash)
     values ('admin', 'إدارة درسي', '0919999999', 'x') returning id`,
  );
  const login = await send('POST', '/api/auth/login', { role: 'admin', phone: '0919999999', password: 'x' });
  admin = { id: row!.id, token: login.statusCode === 200 ? login.json().accessToken : '' };

  // The stored hash is not a real argon2 hash, so sign a token the same way the
  // service would rather than going through the password path.
  if (!admin.token) {
    const { signAccessToken } = await import('../src/lib/tokens.ts');
    admin.token = signAccessToken({ userId: row!.id, role: 'admin' });
  }
});

after(async () => {
  await app.close();
  await pool.end();
});

describe('البيانات المرجعية', () => {
  test('تُقرأ بلا تسجيل دخول', async () => {
    const res = await get('/api/reference');
    assert.equal(res.statusCode, 200);
    const body = res.json();
    assert.ok(body.subjects.length >= 8);
    assert.ok(body.grades.some((g: { code: string }) => g.code === 'g6'));
  });

  test('لا يعدّلها إلا الإدارة', async () => {
    const asLearner = await send('POST', '/api/admin/reference/subjects',
      { code: 'islamic', name: 'التربية الإسلامية' }, learner.token);
    assert.equal(asLearner.statusCode, 403);

    const anonymous = await send('POST', '/api/admin/reference/subjects',
      { code: 'islamic', name: 'التربية الإسلامية' });
    assert.equal(anonymous.statusCode, 401);
  });

  test('تضيف الإدارة مادة فتظهر للجميع', async () => {
    const created = await send('POST', '/api/admin/reference/subjects',
      { code: 'islamic', name: 'التربية الإسلامية', color: '#3F9A6A' }, admin.token);
    assert.equal(created.statusCode, 201);

    const list = await get('/api/reference');
    assert.ok(list.json().subjects.some((s: { code: string }) => s.code === 'islamic'));
  });

  test('ترفض رمزًا مكررًا', async () => {
    const res = await send('POST', '/api/admin/reference/subjects',
      { code: 'islamic', name: 'مكررة' }, admin.token);
    assert.equal(res.statusCode, 400);
    assert.equal(res.json().error, 'code_taken');
  });

  test('الإخفاء يمنع الاختيار ولا يحذف', async () => {
    const list = await get('/api/reference');
    const french = list.json().subjects.find((s: { code: string }) => s.code === 'french');

    const hidden = await send('POST', `/api/admin/reference/subjects/${french.id}/disabled`,
      { disabled: true }, admin.token);
    assert.equal(hidden.statusCode, 200);

    const after = await get('/api/reference');
    assert.ok(!after.json().subjects.some((s: { code: string }) => s.code === 'french'));

    // Still in the table, so an old booking can still name it.
    const rows = await query('select 1 from subjects where code = $1', ['french']);
    assert.equal(rows.length, 1);
  });
});

describe('ملف المدرس', () => {
  test('يعدّل المدرس ملفه', async () => {
    const res = await send('PATCH', '/api/me/teacher', {
      bio: 'مدرس رياضيات بخبرة 8 سنوات',
      city: 'tripoli',
      subjects: ['math', 'physics'],
      grades: ['g6', 'g7'],
      languages: ['ar', 'en'],
    }, teacher.token);

    assert.equal(res.statusCode, 200);
    assert.deepEqual(res.json().teacher.subjects.sort(), ['math', 'physics']);
    assert.equal(res.json().teacher.city, 'tripoli');
  });

  test('لا يصل الطالب لمسار المدرس', async () => {
    const res = await get('/api/me/teacher', learner.token);
    assert.equal(res.statusCode, 403);
  });

  test('يضبط أسعاره', async () => {
    const res = await send('PUT', '/api/me/teacher/rates', {
      rates: [
        { mode: 'online', kind: 'individual', price: 30 },
        { mode: 'online', kind: 'group', price: 20, seats: 5 },
        { mode: 'f2f', kind: 'individual', price: 50 },
      ],
    }, teacher.token);

    assert.equal(res.statusCode, 200);
    assert.equal(res.json().rates.length, 3);
  });

  test('يرفض سعرًا خارج الحدود', async () => {
    const res = await send('PUT', '/api/me/teacher/rates', {
      rates: [{ mode: 'online', kind: 'individual', price: 500 }],
    }, teacher.token);
    assert.equal(res.statusCode, 400);
  });
});

describe('التوثيق يحكم الظهور', () => {
  test('المدرس غير الموثّق لا يظهر في البحث', async () => {
    const res = await get('/api/teachers');
    assert.equal(res.json().teachers.length, 0, 'لا ينبغي ظهور أي مدرس قبل التوثيق');
  });

  test('ملفه العام غير متاح كذلك', async () => {
    const res = await get(`/api/teachers/${teacher.id}`);
    assert.equal(res.statusCode, 404);
  });

  test('يرفع مستنده فيدخل طابور المراجعة', async () => {
    const uploaded = await send('POST', '/api/me/teacher/documents',
      { storageKey: 'docs/ahmed-id.jpg' }, teacher.token);
    assert.equal(uploaded.statusCode, 200);

    const queue = await get('/api/admin/verification', admin.token);
    assert.equal(queue.json().pending.length, 1);
    assert.equal(queue.json().pending[0].document.key, 'docs/ahmed-id.jpg');
  });

  test('الرفض يحتاج سببًا', async () => {
    const res = await send('POST', `/api/admin/verification/${teacher.id}`,
      { approved: false }, admin.token);
    assert.equal(res.statusCode, 400);
    assert.equal(res.json().error, 'reason_required');
  });

  test('الرفض يصل المدرس بسببه ولا يظهره', async () => {
    await send('POST', `/api/admin/verification/${teacher.id}`,
      { approved: false, reason: 'الصورة غير واضحة' }, admin.token);

    const own = await get('/api/me/teacher', teacher.token);
    assert.equal(own.json().teacher.verification, 'rejected');
    assert.equal(own.json().teacher.rejectionReason, 'الصورة غير واضحة');

    const search = await get('/api/teachers');
    assert.equal(search.json().teachers.length, 0);

    const notice = await query<{ title: string }>(
      'select title from notifications where user_id = $1 order by created_at desc limit 1', [teacher.id]);
    assert.match(notice[0]!.title, /لم يُقبل/);
  });

  test('الاعتماد يُظهره فورًا', async () => {
    await send('POST', '/api/me/teacher/documents', { storageKey: 'docs/ahmed-id-v2.jpg' }, teacher.token);
    const approved = await send('POST', `/api/admin/verification/${teacher.id}`,
      { approved: true }, admin.token);
    assert.equal(approved.statusCode, 200);

    const search = await get('/api/teachers');
    assert.equal(search.json().teachers.length, 1);
    assert.equal(search.json().teachers[0].name, 'أحمد المبروك');

    const profile = await get(`/api/teachers/${teacher.id}`);
    assert.equal(profile.statusCode, 200);
  });

  test('لا يوثّق المدرس نفسه', async () => {
    const res = await send('POST', `/api/admin/verification/${teacher.id}`,
      { approved: true }, teacher.token);
    assert.equal(res.statusCode, 403);
  });

  test('الإيقاف يخفيه من البحث دون حذفه', async () => {
    await query(
      `insert into teacher_suspensions (teacher_user_id, reason, auto) values ($1, '3 اعتذارات', true)`,
      [teacher.id]);

    const search = await get('/api/teachers');
    assert.equal(search.json().teachers.length, 0);

    const own = await get('/api/me/teacher', teacher.token);
    assert.equal(own.json().teacher.suspension.reason, '3 اعتذارات');

    await query('update teacher_suspensions set lifted_at = now() where teacher_user_id = $1', [teacher.id]);
    const back = await get('/api/teachers');
    assert.equal(back.json().teachers.length, 1, 'يعود بعد رفع الإيقاف');
  });
});

describe('البحث', () => {
  test('يصفّي بالمادة', async () => {
    const match = await get('/api/teachers?subject=math');
    assert.equal(match.json().teachers.length, 1);

    const miss = await get('/api/teachers?subject=arabic');
    assert.equal(miss.json().teachers.length, 0);
  });

  test('يصفّي بالمدينة والنمط', async () => {
    assert.equal((await get('/api/teachers?city=tripoli')).json().teachers.length, 1);
    assert.equal((await get('/api/teachers?city=benghazi')).json().teachers.length, 0);
    assert.equal((await get('/api/teachers?mode=online')).json().teachers.length, 1);
  });
});

describe('التوفر', () => {
  test('يحفظ المدرس أوقاته', async () => {
    const res = await send('PUT', '/api/me/teacher/availability', {
      slots: [
        { weekday: 0, startsAt: '16:00', endsAt: '20:00' },
        { weekday: 2, startsAt: '17:00', endsAt: '19:00' },
      ],
    }, teacher.token);

    assert.equal(res.statusCode, 200);
    assert.equal(res.json().availability.length, 2);
  });

  test('يرفض فترة تنتهي قبل أن تبدأ', async () => {
    const res = await send('PUT', '/api/me/teacher/availability', {
      slots: [{ weekday: 0, startsAt: '20:00', endsAt: '16:00' }],
    }, teacher.token);
    assert.equal(res.statusCode, 400);
  });

  test('لا يسحب ساعة عليها حجز قائم', async () => {
    const subject = await one<{ id: string }>("select id from subjects where code = 'math'");
    const grade = await one<{ id: string }>("select id from grades where code = 'g6'");
    const learnerRow = await one<{ id: string }>("select id from users where phone = '0910000001'");

    // A confirmed booking next Sunday at 17:00, inside the saved window.
    await query(
      `insert into bookings (payer_user_id, teacher_user_id, subject_id, grade_id, kind, mode,
         starts_at, lesson_price, commission_rate, platform_fee, tutor_amount, expires_at, status)
       values ($1,$2,$3,$4,'individual','online',
         date_trunc('week', now() + interval '1 week') - interval '1 day' + interval '17 hours',
         30, 0.15, 4.50, 25.50, now() + interval '1 day', 'confirmed')`,
      [learnerRow!.id, teacher.id, subject!.id, grade!.id],
    );

    const booked = await one<{ weekday: number }>(
      `select extract(dow from starts_at)::int as weekday from bookings where teacher_user_id = $1`,
      [teacher.id]);

    const withdraw = await send('PUT', '/api/me/teacher/availability', {
      slots: [{ weekday: booked!.weekday === 0 ? 2 : 0, startsAt: '10:00', endsAt: '12:00' }],
    }, teacher.token);

    assert.equal(withdraw.statusCode, 400);
    assert.equal(withdraw.json().error, 'slot_committed');
  });
});
