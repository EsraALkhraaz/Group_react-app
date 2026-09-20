import { query, one, transaction } from '../lib/db.ts';
import { badRequest, forbidden, notFound } from '../lib/errors.ts';
import { commissionRateFor, splitAmount, cancellationOutcome } from '../lib/money.ts';
import * as settingsService from './settings.ts';

type Mode = 'online' | 'f2f';
type Kind = 'individual' | 'group';

const BLOCKING = ['awaiting_payment', 'payment_review', 'confirmed'];

// What the learner may still pick: inside the teacher's weekly template, not
// during time off, not already taken, and not in the past.
export const availableSlots = async (teacherId: string, days = 30) => {
  const rows = await query<{ starts_at: string; taken: boolean; kind: Kind | null; seats: number | null }>(
    `with slots as (
       select generate_series(
         date_trunc('hour', now()) + interval '1 hour',
         now() + ($2 || ' days')::interval,
         interval '1 hour'
       ) as starts_at
     )
     select s.starts_at,
            exists (
              select 1 from bookings b
              where b.teacher_user_id = $1
                and b.starts_at = s.starts_at
                and b.status = any($3)
                and b.kind = 'individual'
            ) as taken,
            (select r.kind from teacher_rates r where r.teacher_user_id = $1 limit 1) as kind,
            (select r.group_seats from teacher_rates r
             where r.teacher_user_id = $1 and r.kind = 'group' limit 1) as seats
     from slots s
     where exists (
       select 1 from teacher_availability a
       where a.teacher_user_id = $1
         and a.weekday = extract(dow from s.starts_at)::int
         and s.starts_at::time >= a.starts_at
         and s.starts_at::time < a.ends_at
     )
     and not exists (
       select 1 from teacher_time_off t
       where t.teacher_user_id = $1
         and s.starts_at >= t.starts_at and s.starts_at < t.ends_at
     )
     order by s.starts_at`,
    [teacherId, days, BLOCKING],
  );

  return rows.map((r) => ({ startsAt: r.starts_at, taken: r.taken }));
};

const priceFor = async (teacherId: string, mode: Mode, kind: Kind): Promise<number> => {
  const rate = await one<{ price_per_hour: string }>(
    'select price_per_hour from teacher_rates where teacher_user_id = $1 and mode = $2 and kind = $3',
    [teacherId, mode, kind],
  );
  if (!rate) throw badRequest('no_rate', 'المدرس لا يقدم هذا النوع من الحصص');
  return Number(rate.price_per_hour);
};

export const create = async (payerId: string, input: {
  teacherId: string; childId?: string; subject: string; grade: string;
  kind: Kind; mode: Mode; startsAt: string; note?: string;
}) => {
  const teacher = await one<{ id: string; sessions: number; listed: boolean }>(
    `select u.id, (p.sessions_count + p.legacy_sessions) as sessions,
            (p.verification = 'verified' and not exists (
               select 1 from teacher_suspensions s
               where s.teacher_user_id = u.id and s.lifted_at is null)) as listed
     from users u join teacher_profiles p on p.user_id = u.id
     where u.id = $1`,
    [input.teacherId],
  );

  if (!teacher) throw notFound('المدرس غير موجود');
  if (!teacher.listed) throw badRequest('teacher_unavailable', 'هذا المدرس غير متاح للحجز حاليًا');

  const startsAt = new Date(input.startsAt);
  if (Number.isNaN(startsAt.getTime())) throw badRequest('bad_date', 'موعد غير صالح');
  if (startsAt.getTime() <= Date.now()) throw badRequest('past_slot', 'لا يمكن حجز موعد مضى');

  // The slot has to be one the teacher actually offers.
  const offered = await one(
    `select 1 from teacher_availability a
     where a.teacher_user_id = $1
       and a.weekday = extract(dow from $2::timestamptz)::int
       and $2::timestamptz::time >= a.starts_at
       and $2::timestamptz::time < a.ends_at`,
    [input.teacherId, startsAt.toISOString()],
  );
  if (!offered) throw badRequest('slot_unavailable', 'هذا الموعد خارج أوقات المدرس');

  const [subject, grade] = await Promise.all([
    one<{ id: string }>('select id from subjects where code = $1 and disabled_at is null', [input.subject]),
    one<{ id: string }>('select id from grades where code = $1 and disabled_at is null', [input.grade]),
  ]);
  if (!subject) throw badRequest('bad_subject', 'مادة غير معروفة');
  if (!grade) throw badRequest('bad_grade', 'سنة دراسية غير معروفة');

  // Everything about the money is decided here, from the database and the
  // platform settings. Nothing about it came from the request.
  const settings = await settingsService.load();
  const price = await priceFor(input.teacherId, input.mode, input.kind);
  const rate = commissionRateFor({
    tiers: settings.tiers,
    groupCommission: settings.groupCommission,
    completedSessions: Number(teacher.sessions),
    kind: input.kind,
  });
  const split = splitAmount(price, rate);

  try {
    const booking = await one<{ id: string }>(
      `insert into bookings (payer_user_id, child_id, teacher_user_id, subject_id, grade_id,
         kind, mode, starts_at, lesson_price, commission_rate, platform_fee, tutor_amount,
         expires_at, note)
       values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,
               now() + ($13 || ' hours')::interval, $14)
       returning id`,
      [payerId, input.childId ?? null, input.teacherId, subject.id, grade.id,
        input.kind, input.mode, startsAt.toISOString(), split.gross, rate,
        split.commission, split.tutorEarning, settings.requestExpiryHours, input.note ?? null],
    );

    await query(
      `insert into notifications (user_id, title, body, tone, booking_id)
       values ($1, 'طلب حجز جديد', 'لديك طلب ينتظر ردك', 'accent', $2)`,
      [input.teacherId, booking!.id],
    );

    return getById(booking!.id, { userId: payerId, role: 'student' });
  } catch (error) {
    // The partial unique index is what actually prevents two people holding one
    // slot; this turns its error into something a person can read.
    if ((error as { code?: string }).code === '23505') {
      throw badRequest('slot_taken', 'حُجز هذا الموعد للتو — اختر موعدًا آخر');
    }
    throw error;
  }
};

const BOOKING_COLUMNS = `
  b.id, b.status, b.kind, b.mode, b.starts_at as "startsAt", b.duration_mins as "durationMins",
  b.lesson_price as "price", b.commission_rate as "commissionRate",
  b.platform_fee as "platformFee", b.tutor_amount as "tutorAmount",
  b.expires_at as "expiresAt", b.note, b.meeting_link as "meetingLink",
  b.rejection_reason as "rejectionReason", b.cancelled_by_teacher as "cancelledByTeacher",
  b.cancellation_fee as "cancellationFee", b.refund_amount as "refundAmount",
  s.code as subject, g.code as grade,
  t.full_name as "teacherName", b.teacher_user_id as "teacherId",
  coalesce(c.name, p.full_name) as "learnerName"
`;

const BOOKING_JOINS = `
  from bookings b
  join subjects s on s.id = b.subject_id
  join grades g on g.id = b.grade_id
  join users t on t.id = b.teacher_user_id
  join users p on p.id = b.payer_user_id
  left join children c on c.id = b.child_id
`;

export const getById = async (id: string, session: { userId: string; role: string }) => {
  const row = await one<Record<string, unknown> & { payerId: string; teacherId: string }>(
    `select ${BOOKING_COLUMNS}, b.payer_user_id as "payerId" ${BOOKING_JOINS} where b.id = $1`,
    [id],
  );
  if (!row) throw notFound('الحجز غير موجود');

  // Only the two sides of the booking and the admin may read it.
  const mine = row.payerId === session.userId || row.teacherId === session.userId;
  if (!mine && session.role !== 'admin') throw forbidden('هذا الحجز ليس لك');

  const { payerId, ...visible } = row;
  void payerId;
  return visible;
};

export const listForPayer = (payerId: string) =>
  query(`select ${BOOKING_COLUMNS} ${BOOKING_JOINS}
         where b.payer_user_id = $1 order by b.starts_at desc`, [payerId]);

export const listForTeacher = (teacherId: string, status?: string) =>
  query(`select ${BOOKING_COLUMNS} ${BOOKING_JOINS}
         where b.teacher_user_id = $1 ${status ? 'and b.status = $2::booking_status' : ''}
         order by b.starts_at`, status ? [teacherId, status] : [teacherId]);

// Every transition states which status it may start from, so an out-of-order
// call is refused rather than quietly doing the wrong thing.
const move = async (id: string, from: string[], to: string, extra = '', params: unknown[] = []) => {
  const row = await one<{ id: string; status: string }>(
    `update bookings set status = $2::booking_status ${extra ? `, ${extra}` : ''}
     where id = $1 and status = any($3) returning id, status`,
    [id, to, from, ...params],
  );

  if (!row) {
    const current = await one<{ status: string }>('select status from bookings where id = $1', [id]);
    if (!current) throw notFound('الحجز غير موجود');
    throw badRequest('bad_transition', `لا يمكن تنفيذ هذا الإجراء على حجز حالته «${current.status}»`);
  }

  return row;
};

const assertTeacherOwns = async (id: string, teacherId: string) => {
  const row = await one('select 1 from bookings where id = $1 and teacher_user_id = $2', [id, teacherId]);
  if (!row) throw forbidden('هذا الحجز ليس لك');
};

export const approve = async (id: string, teacherId: string) => {
  await assertTeacherOwns(id, teacherId);
  await move(id, ['pending_approval'], 'awaiting_payment', 'responded_at = now()');

  const booking = await one<{ payer: string }>('select payer_user_id as payer from bookings where id = $1', [id]);
  await query(
    `insert into notifications (user_id, title, body, tone, booking_id)
     values ($1, 'وافق المدرس على طلبك', 'أكمل الدفع لتأكيد الحجز', 'primary', $2)`,
    [booking!.payer, id],
  );

  return getById(id, { userId: teacherId, role: 'teacher' });
};

export const reject = async (id: string, teacherId: string, reason?: string) => {
  await assertTeacherOwns(id, teacherId);
  await move(id, ['pending_approval'], 'rejected',
    'responded_at = now(), rejection_reason = $4', [reason ?? null]);

  const booking = await one<{ payer: string }>('select payer_user_id as payer from bookings where id = $1', [id]);
  await query(
    `insert into notifications (user_id, title, body, tone, booking_id)
     values ($1, 'اعتذر المدرس عن الموعد', $2, 'danger', $3)`,
    [booking!.payer, reason ?? 'يمكنك اختيار موعد آخر أو مدرس آخر', id],
  );

  return getById(id, { userId: teacherId, role: 'teacher' });
};

export const complete = async (id: string, teacherId: string) => {
  await assertTeacherOwns(id, teacherId);

  await transaction(async (client) => {
    const row = await client.query(
      `update bookings set status = 'completed', completed_at = now()
       where id = $1 and status = 'confirmed' returning id`,
      [id],
    );
    if (row.rowCount === 0) throw badRequest('bad_transition', 'لا تُحتسب الحصة مكتملة إلا بعد تأكيد الدفع');

    // The count that decides the teacher's commission tier.
    await client.query(
      'update teacher_profiles set sessions_count = sessions_count + 1 where user_id = $1',
      [teacherId],
    );
  });

  return getById(id, { userId: teacherId, role: 'teacher' });
};

export const cancel = async (id: string, session: { userId: string; role: string }, reason?: string) => {
  const booking = await one<{
    payer: string; teacher: string; status: string; price: string;
    commission_rate: string; starts_at: Date;
  }>(
    `select payer_user_id as payer, teacher_user_id as teacher, status,
            lesson_price as price, commission_rate, starts_at
     from bookings where id = $1`,
    [id],
  );

  if (!booking) throw notFound('الحجز غير موجود');

  const byTeacher = booking.teacher === session.userId;
  const byPayer = booking.payer === session.userId;
  if (!byTeacher && !byPayer && session.role !== 'admin') throw forbidden('هذا الحجز ليس لك');

  const settings = await settingsService.load();
  const outcome = cancellationOutcome({
    gross: Number(booking.price),
    commissionRate: Number(booking.commission_rate),
    cancellationFee: settings.cancellationFee,
    freeCancellationHours: settings.freeCancellationHours,
    startsAt: new Date(booking.starts_at),
    byTeacher,
  });

  // Nothing has been paid before this point, so no fee can apply yet; the
  // ledger side of a paid cancellation arrives with the money stage.
  const paid = ['payment_review', 'confirmed'].includes(booking.status);
  const fee = paid ? outcome.fee : 0;
  const refund = paid ? outcome.refund : 0;

  await move(id, ['pending_approval', 'awaiting_payment', 'payment_review', 'confirmed'], 'cancelled',
    `cancelled_at = now(), cancelled_by_teacher = $4, cancellation_fee = $5, refund_amount = $6`,
    [byTeacher, fee, refund]);

  await query(
    `insert into notifications (user_id, title, body, tone, booking_id)
     values ($1, $2, $3, $4, $5)`,
    byTeacher
      ? [booking.payer, 'اعتذر المدرس عن الحصة', reason ?? 'أُلغي الحجز', 'danger', id]
      : [booking.teacher, 'أُلغي حجز', reason ?? 'ألغى الطالب الحجز', 'danger', id],
  );

  return getById(id, session);
};

// A request nobody answered closes itself. With no scheduler yet this runs on
// a timer; the architecture note puts it in pg-boss before launch.
export const expireStaleRequests = async (): Promise<number> => {
  const rows = await query<{ id: string; payer: string }>(
    `update bookings set status = 'expired'
     where status = 'pending_approval' and expires_at < now()
     returning id, payer_user_id as payer`,
  );

  for (const row of rows) {
    await query(
      `insert into notifications (user_id, title, body, tone, booking_id)
       values ($1, 'انتهت مدة طلب الحجز', 'لم يرد المدرس في الوقت المحدد — اختر موعدًا آخر', 'danger', $2)`,
      [row.payer, row.id],
    );
  }

  return rows.length;
};
