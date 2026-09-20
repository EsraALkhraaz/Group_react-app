import { test, before, after, describe } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import type { InjectOptions, LightMyRequestResponse } from 'fastify';
import { buildApp } from '../src/app.ts';
import { pool, query, one } from '../src/lib/db.ts';
import { signAccessToken } from '../src/lib/tokens.ts';
import { expireStaleRequests } from '../src/services/bookings.ts';

process.env.NODE_ENV = 'test';

let app: Awaited<ReturnType<typeof buildApp>>;
let teacher: { token: string; id: string };
let parent: { token: string; id: string };
let student: { token: string; id: string };
let outsider: { token: string; id: string };
let admin: { token: string };
let childId: string;
let slot: string;

const inject = (o: InjectOptions): Promise<LightMyRequestResponse> =>
  app.inject(o) as unknown as Promise<LightMyRequestResponse>;

const auth = (t: string) => ({ authorization: `Bearer ${t}` });
const post = (url: string, payload: unknown, token?: string) =>
  inject({ method: 'POST', url, payload: payload as InjectOptions['payload'], headers: token ? auth(token) : {} });
const get = (url: string, token?: string) =>
  inject({ method: 'GET', url, headers: token ? auth(token) : {} });
const put = (url: string, payload: unknown, token: string) =>
  inject({ method: 'PUT', url, payload: payload as InjectOptions['payload'], headers: auth(token) });

const signup = async (role: string, phone: string, name: string) => {
  const res = await post('/api/auth/signup', { role, fullName: name, phone, password: 'darsy1234', agreed: true });
  return { token: res.json().accessToken as string, id: res.json().user.id as string };
};

// The next occurrence of a weekday the teacher works, at a whole hour.
const nextSlotAt = (weekday: number, hour: number): Date => {
  const d = new Date();
  d.setMinutes(0, 0, 0);
  d.setDate(d.getDate() + ((weekday - d.getDay() + 7) % 7 || 7));
  d.setHours(hour);
  return d;
};

before(async () => {
  app = await buildApp();
  await query(`truncate notifications, audit_log, bookings, teacher_documents, teacher_suspensions,
               teacher_availability, teacher_rates, teacher_subjects, teacher_grades,
               teacher_languages, teacher_areas, children, login_attempts, otp_codes,
               refresh_tokens, teacher_profiles, users, subjects, grades, languages, cities
               restart identity cascade`);
  await query(await readFile(new URL('../migrations/008_seed_reference.sql', import.meta.url), 'utf8'));

  // truncate ... cascade reaches platform_settings through its updated_by
  // reference to users, so the rates have to be put back.
  await query('insert into platform_settings (id) values (1) on conflict (id) do nothing');
  await query(`insert into commission_tiers (min_sessions, rate, label) values
               (0, 0.20, 'مدرس جديد'), (10, 0.17, 'بعد 10 حصص'), (30, 0.15, 'مدرس نشط')
               on conflict (min_sessions) do nothing`);

  teacher = await signup('teacher', '0911111111', 'أحمد المبروك');
  parent = await signup('parent', '0912345678', 'سارة المبروك');
  student = await signup('student', '0910000001', 'أحمد الزوي');
  outsider = await signup('student', '0913333333', 'طرف ثالث');

  const adminRow = await one<{ id: string }>(
    `insert into users (role, full_name, phone, password_hash)
     values ('admin', 'إدارة درسي', '0919999999', 'x') returning id`);
  admin = { token: signAccessToken({ userId: adminRow!.id, role: 'admin' }) };

  const child = await one<{ id: string }>(
    'insert into children (parent_user_id, name) values ($1, $2) returning id',
    [parent.id, 'يوسف']);
  childId = child!.id;

  // A teacher who is verified, priced, and open on Mondays.
  await query("update teacher_profiles set verification = 'verified', legacy_sessions = 0 where user_id = $1", [teacher.id]);
  await put('/api/me/teacher/rates', {
    rates: [
      { mode: 'online', kind: 'individual', price: 30 },
      { mode: 'online', kind: 'group', price: 20, seats: 5 },
    ],
  }, teacher.token);
  await put('/api/me/teacher/availability', {
    slots: [{ weekday: 1, startsAt: '16:00', endsAt: '20:00' }],
  }, teacher.token);

  slot = nextSlotAt(1, 17).toISOString();
});

after(async () => {
  await app.close();
  await pool.end();
});

const book = (token: string, over: Record<string, unknown> = {}) =>
  post('/api/bookings', {
    teacherId: teacher.id, subject: 'math', grade: 'g6',
    kind: 'individual', mode: 'online', startsAt: slot, ...over,
  }, token);

describe('المواعيد المتاحة', () => {
  test('تُشتق من توفر المدرس', async () => {
    const res = await get(`/api/teachers/${teacher.id}/slots`);
    assert.equal(res.statusCode, 200);
    const slots = res.json().slots as Array<{ startsAt: string; taken: boolean }>;
    assert.ok(slots.length > 0, 'يجب أن تظهر مواعيد');
    assert.ok(slots.every((s) => [16, 17, 18, 19].includes(new Date(s.startsAt).getHours())));
    assert.ok(slots.every((s) => new Date(s.startsAt).getDay() === 1));
  });
});

describe('إنشاء الحجز', () => {
  test('الخادم هو من يحسب السعر والعمولة', async () => {
    const res = await book(student.token);
    assert.equal(res.statusCode, 201);

    const b = res.json().booking;
    assert.equal(Number(b.price), 30);
    // A teacher with no completed sessions sits in the first tier: 20%.
    assert.equal(Number(b.commissionRate), 0.2);
    assert.equal(Number(b.platformFee), 6);
    assert.equal(Number(b.tutorAmount), 24);
    assert.equal(Number(b.platformFee) + Number(b.tutorAmount), Number(b.price));
    assert.equal(b.status, 'pending_approval');
  });

  test('يتجاهل أي مبلغ يرسله العميل', async () => {
    const res = await post('/api/bookings', {
      teacherId: teacher.id, subject: 'math', grade: 'g6', kind: 'individual', mode: 'online',
      startsAt: nextSlotAt(1, 18).toISOString(),
      price: 1, platformFee: 0, tutorAmount: 1, commissionRate: 0,
    }, student.token);

    assert.equal(res.statusCode, 201);
    assert.equal(Number(res.json().booking.price), 30, 'السعر من قاعدة البيانات لا من الطلب');
    assert.equal(Number(res.json().booking.platformFee), 6);
  });

  test('يرفض موعدًا خارج أوقات المدرس', async () => {
    const res = await book(student.token, { startsAt: nextSlotAt(1, 9).toISOString() });
    assert.equal(res.statusCode, 400);
    assert.equal(res.json().error, 'slot_unavailable');
  });

  test('يرفض موعدًا مضى', async () => {
    const past = new Date(Date.now() - 3_600_000).toISOString();
    const res = await book(student.token, { startsAt: past });
    assert.equal(res.statusCode, 400);
  });

  test('يرفض نوع حصة لا يقدمه المدرس', async () => {
    const res = await book(student.token, { mode: 'f2f' });
    assert.equal(res.statusCode, 400);
    assert.equal(res.json().error, 'no_rate');
  });

  test('يرفض الحجز لابن مستخدم آخر', async () => {
    const res = await book(student.token, { childId });
    assert.equal(res.statusCode, 500, 'المشغّل في القاعدة يرفض');
  });

  test('يقبل حجز ولي الأمر لابنه ويسمّي المتعلّم', async () => {
    const res = await book(parent.token, { childId, startsAt: nextSlotAt(1, 19).toISOString() });
    assert.equal(res.statusCode, 201);
    assert.equal(res.json().booking.learnerName, 'يوسف');
  });

  test('لا يحجز المدرس', async () => {
    const res = await book(teacher.token);
    assert.equal(res.statusCode, 403);
  });
});

describe('منع الحجز المزدوج', () => {
  test('طلبان معلّقان على الموعد نفسه مسموحان', async () => {
    const second = await book(outsider.token);
    assert.equal(second.statusCode, 201, 'المدرس هو من يختار بينهما');
  });

  test('لا يتجاوز اثنان مرحلة القبول على موعد واحد', async () => {
    const pending = await query<{ id: string }>(
      `select id from bookings where teacher_user_id = $1 and starts_at = $2
         and status = 'pending_approval' order by created_at`,
      [teacher.id, slot]);

    const first = await post(`/api/bookings/${pending[0]!.id}/approve`, {}, teacher.token);
    assert.equal(first.statusCode, 200);

    const second = await post(`/api/bookings/${pending[1]!.id}/approve`, {}, teacher.token);
    assert.equal(second.statusCode, 500, 'الفهرس الفريد في القاعدة يمنع الثاني');
  });
});

describe('رد المدرس', () => {
  test('لا يرد مدرس على طلب غيره', async () => {
    const mine = await one<{ id: string }>(
      "select id from bookings where status = 'pending_approval' limit 1");
    const other = await signup('teacher', '0914444444', 'مدرس آخر');
    const res = await post(`/api/bookings/${mine!.id}/approve`, {}, other.token);
    assert.equal(res.statusCode, 403);
  });

  test('الاعتذار يسجّل السبب ويصل الطالب', async () => {
    const pending = await one<{ id: string; payer: string }>(
      "select id, payer_user_id as payer from bookings where status = 'pending_approval' limit 1");

    const res = await post(`/api/bookings/${pending!.id}/reject`,
      { reason: 'الموعد صار مشغولًا' }, teacher.token);
    assert.equal(res.statusCode, 200);
    assert.equal(res.json().booking.status, 'rejected');

    const notice = await one<{ body: string }>(
      'select body from notifications where user_id = $1 and booking_id = $2',
      [pending!.payer, pending!.id]);
    assert.equal(notice!.body, 'الموعد صار مشغولًا');
  });

  test('لا يُقبل طلب سبق الرد عليه', async () => {
    const rejected = await one<{ id: string }>("select id from bookings where status = 'rejected' limit 1");
    const res = await post(`/api/bookings/${rejected!.id}/approve`, {}, teacher.token);
    assert.equal(res.statusCode, 400);
    assert.equal(res.json().error, 'bad_transition');
  });
});

describe('آلة الحالات', () => {
  test('لا تُحتسب حصة مكتملة قبل تأكيد الدفع', async () => {
    const awaiting = await one<{ id: string }>(
      "select id from bookings where status = 'awaiting_payment' limit 1");
    const res = await post(`/api/bookings/${awaiting!.id}/complete`, {}, teacher.token);
    assert.equal(res.statusCode, 400);
  });

  test('الإتمام يرفع عدد حصص المدرس', async () => {
    const awaiting = await one<{ id: string }>(
      "select id from bookings where status = 'awaiting_payment' limit 1");
    await query("update bookings set status = 'confirmed' where id = $1", [awaiting!.id]);

    const before = await one<{ n: number }>(
      'select sessions_count as n from teacher_profiles where user_id = $1', [teacher.id]);
    const res = await post(`/api/bookings/${awaiting!.id}/complete`, {}, teacher.token);
    assert.equal(res.statusCode, 200);

    const after = await one<{ n: number }>(
      'select sessions_count as n from teacher_profiles where user_id = $1', [teacher.id]);
    assert.equal(after!.n, before!.n + 1);
  });
});

describe('من يرى الحجز', () => {
  test('الطرفان والإدارة فقط', async () => {
    const booking = await one<{ id: string; payer: string }>(
      'select id, payer_user_id as payer from bookings limit 1');

    const owner = booking!.payer === student.id ? student.token
      : booking!.payer === parent.id ? parent.token : outsider.token;

    assert.equal((await get(`/api/bookings/${booking!.id}`, owner)).statusCode, 200);
    assert.equal((await get(`/api/bookings/${booking!.id}`, teacher.token)).statusCode, 200);
    assert.equal((await get(`/api/bookings/${booking!.id}`, admin.token)).statusCode, 200);

    const stranger = booking!.payer === student.id ? outsider.token : student.token;
    assert.equal((await get(`/api/bookings/${booking!.id}`, stranger)).statusCode, 403);
    assert.equal((await get(`/api/bookings/${booking!.id}`)).statusCode, 401);
  });
});

describe('انتهاء الطلب تلقائيًا', () => {
  test('ينتهي الطلب بعد مهلته ويُشعَر الطالب', async () => {
    const res = await book(student.token, { startsAt: nextSlotAt(1, 16).toISOString() });
    const id = res.json().booking.id as string;

    // Age it past its own deadline rather than waiting a day.
    await query("update bookings set expires_at = now() - interval '1 minute' where id = $1", [id]);

    const expired = await expireStaleRequests();
    assert.ok(expired >= 1);

    const after = await get(`/api/bookings/${id}`, student.token);
    assert.equal(after.json().booking.status, 'expired');

    const notice = await one<{ title: string }>(
      'select title from notifications where booking_id = $1 order by created_at desc limit 1', [id]);
    assert.match(notice!.title, /انتهت مدة/);
  });

  test('لا يمسّ طلبًا ما زال في مهلته', async () => {
    const fresh = await book(student.token, { startsAt: nextSlotAt(1, 16).toISOString() });
    assert.equal(fresh.statusCode, 201);
    await expireStaleRequests();

    const after = await get(`/api/bookings/${fresh.json().booking.id}`, student.token);
    assert.equal(after.json().booking.status, 'pending_approval');
  });
});

describe('الإلغاء', () => {
  test('طلب لم يُدفع يُلغى بلا رسوم', async () => {
    const pending = await one<{ id: string; payer: string }>(
      "select id, payer_user_id as payer from bookings where status = 'pending_approval' limit 1");
    const token = pending!.payer === student.id ? student.token : parent.token;

    const res = await post(`/api/bookings/${pending!.id}/cancel`, {}, token);
    assert.equal(res.statusCode, 200);
    assert.equal(res.json().booking.status, 'cancelled');
    assert.equal(Number(res.json().booking.cancellationFee), 0);
  });

  test('لا يلغي غريب حجزًا ليس له', async () => {
    // Explicitly a booking the outsider is neither side of.
    const notTheirs = await one<{ id: string }>(
      `select id from bookings
       where status not in ('cancelled','expired','rejected')
         and payer_user_id <> $1 and teacher_user_id <> $1 limit 1`,
      [outsider.id]);

    assert.ok(notTheirs, 'يلزم وجود حجز لطرف آخر لإجراء الاختبار');
    const res = await post(`/api/bookings/${notTheirs!.id}/cancel`, {}, outsider.token);
    assert.equal(res.statusCode, 403);
  });
});
