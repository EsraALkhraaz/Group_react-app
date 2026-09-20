import { query, one, transaction } from '../lib/db.ts';
import { badRequest, forbidden, notFound } from '../lib/errors.ts';

type Mode = 'online' | 'f2f';
type Kind = 'individual' | 'group';

// What a learner is allowed to see. Verification and suspension are applied
// here, once, rather than remembered at each call site.
const LISTABLE = `
  p.verification = 'verified'
  and not exists (
    select 1 from teacher_suspensions s
    where s.teacher_user_id = p.user_id and s.lifted_at is null
  )
`;

const TEACHER_COLUMNS = `
  u.id, u.full_name as "name", p.bio, p.experience,
  p.rating_avg as "rating", p.reviews_count as "reviewsCount",
  (p.sessions_count + p.legacy_sessions) as "sessionsCount",
  c.code as "city",
  coalesce((select json_agg(s.code order by s.code) from teacher_subjects ts
            join subjects s on s.id = ts.subject_id where ts.teacher_user_id = u.id), '[]') as subjects,
  coalesce((select json_agg(g.code order by g.sort_order) from teacher_grades tg
            join grades g on g.id = tg.grade_id where tg.teacher_user_id = u.id), '[]') as grades,
  coalesce((select json_agg(l.code) from teacher_languages tl
            join languages l on l.id = tl.language_id where tl.teacher_user_id = u.id), '[]') as languages,
  coalesce((select json_agg(json_build_object('mode', r.mode, 'kind', r.kind,
             'price', r.price_per_hour, 'seats', r.group_seats))
            from teacher_rates r where r.teacher_user_id = u.id), '[]') as rates
`;

export const search = (filters: {
  subject?: string; grade?: string; language?: string; city?: string;
  mode?: Mode; kind?: Kind; sort?: 'rating' | 'price' | 'sessions';
}) => {
  const where: string[] = [LISTABLE];
  const params: unknown[] = [];

  const add = (clause: string, value: unknown) => {
    params.push(value);
    where.push(clause.replace('$?', `$${params.length}`));
  };

  if (filters.subject) add(`exists (select 1 from teacher_subjects ts join subjects s on s.id = ts.subject_id
                                    where ts.teacher_user_id = u.id and s.code = $?)`, filters.subject);
  if (filters.grade) add(`exists (select 1 from teacher_grades tg join grades g on g.id = tg.grade_id
                                  where tg.teacher_user_id = u.id and g.code = $?)`, filters.grade);
  if (filters.language) add(`exists (select 1 from teacher_languages tl join languages l on l.id = tl.language_id
                                     where tl.teacher_user_id = u.id and l.code = $?)`, filters.language);
  if (filters.city) add('c.code = $?', filters.city);
  if (filters.mode) add(`exists (select 1 from teacher_rates r where r.teacher_user_id = u.id and r.mode = $?::session_mode)`, filters.mode);
  if (filters.kind) add(`exists (select 1 from teacher_rates r where r.teacher_user_id = u.id and r.kind = $?::session_type)`, filters.kind);

  const orderBy = filters.sort === 'price'
    ? '(select min(price_per_hour) from teacher_rates r where r.teacher_user_id = u.id) asc'
    : filters.sort === 'sessions'
      ? '(p.sessions_count + p.legacy_sessions) desc'
      : 'p.rating_avg desc';

  return query(
    `select ${TEACHER_COLUMNS}
     from users u
     join teacher_profiles p on p.user_id = u.id
     left join cities c on c.id = p.city_id
     where ${where.join(' and ')}
     order by ${orderBy}`,
    params,
  );
};

export const publicProfile = async (id: string) => {
  const row = await one(
    `select ${TEACHER_COLUMNS}
     from users u join teacher_profiles p on p.user_id = u.id
     left join cities c on c.id = p.city_id
     where u.id = $1 and ${LISTABLE}`,
    [id],
  );
  if (!row) throw notFound('المدرس غير موجود أو غير متاح');
  return row;
};

// The teacher's own view: it shows the parts a learner never sees, such as
// where their verification stands and why it was refused.
export const ownProfile = async (id: string) => {
  const row = await one(
    `select ${TEACHER_COLUMNS}, p.verification, p.rejection_reason as "rejectionReason",
            (select json_build_object('reason', s.reason, 'at', s.created_at)
             from teacher_suspensions s
             where s.teacher_user_id = u.id and s.lifted_at is null limit 1) as suspension
     from users u join teacher_profiles p on p.user_id = u.id
     left join cities c on c.id = p.city_id
     where u.id = $1`,
    [id],
  );
  if (!row) throw notFound('لا يوجد ملف مدرس لهذا الحساب');
  return row;
};

const replaceLinks = async (
  client: Parameters<Parameters<typeof transaction>[0]>[0],
  table: string, column: string, refTable: string,
  teacherId: string, codes: string[],
) => {
  await client.query(`delete from ${table} where teacher_user_id = $1`, [teacherId]);
  if (!codes.length) return;
  await client.query(
    `insert into ${table} (teacher_user_id, ${column})
     select $1, r.id from ${refTable} r where r.code = any($2) and r.disabled_at is null`,
    [teacherId, codes],
  );
};

export const updateProfile = async (teacherId: string, input: {
  bio?: string; experience?: string; city?: string;
  subjects?: string[]; grades?: string[]; languages?: string[]; areas?: string[];
}) => {
  await transaction(async (client) => {
    const city = input.city
      ? await one<{ id: string }>('select id from cities where code = $1', [input.city])
      : null;

    await client.query(
      `update teacher_profiles
         set bio = coalesce($2, bio), experience = coalesce($3, experience),
             city_id = coalesce($4, city_id)
       where user_id = $1`,
      [teacherId, input.bio ?? null, input.experience ?? null, city?.id ?? null],
    );

    if (input.subjects)  await replaceLinks(client, 'teacher_subjects',  'subject_id',  'subjects',  teacherId, input.subjects);
    if (input.grades)    await replaceLinks(client, 'teacher_grades',    'grade_id',    'grades',    teacherId, input.grades);
    if (input.languages) await replaceLinks(client, 'teacher_languages', 'language_id', 'languages', teacherId, input.languages);
    if (input.areas)     await replaceLinks(client, 'teacher_areas',     'city_id',     'cities',    teacherId, input.areas);
  });

  // Read back only after the commit: a read on the pool cannot see rows the
  // transaction has not finished writing.
  return ownProfile(teacherId);
};

export const setRates = async (teacherId: string, rates: Array<{
  mode: Mode; kind: Kind; price: number; seats?: number;
}>) => {
  await transaction(async (client) => {
    await client.query('delete from teacher_rates where teacher_user_id = $1', [teacherId]);

    for (const rate of rates) {
      // The price limits and the seat rule are constraints in the schema, so a
      // bad value is refused here whatever the route forgot to check.
      await client.query(
        `insert into teacher_rates (teacher_user_id, mode, kind, price_per_hour, group_seats)
         values ($1, $2, $3, $4, $5)`,
        [teacherId, rate.mode, rate.kind, rate.price, rate.kind === 'group' ? (rate.seats ?? 5) : null],
      );
    }
  });

  return query(
    'select mode, kind, price_per_hour as price, group_seats as seats from teacher_rates where teacher_user_id = $1',
    [teacherId],
  );
};

export const availability = (teacherId: string) =>
  query(
    `select weekday, to_char(starts_at, 'HH24:MI') as "startsAt",
            to_char(ends_at, 'HH24:MI') as "endsAt", mode
     from teacher_availability where teacher_user_id = $1
     order by weekday, starts_at`,
    [teacherId],
  );

// Withdrawing an hour a learner already paid for is not a scheduling change,
// it is breaking a commitment — so the server refuses it too, not just the UI.
export const setAvailability = async (teacherId: string, slots: Array<{
  weekday: number; startsAt: string; endsAt: string; mode?: Mode;
}>) => {
  const sold = await query<{ weekday: number; time: string }>(
    `select extract(dow from starts_at)::int as weekday, to_char(starts_at, 'HH24:MI') as time
     from bookings
     where teacher_user_id = $1
       and status in ('awaiting_payment', 'payment_review', 'confirmed')
       and starts_at > now()`,
    [teacherId],
  );

  const covers = (weekday: number, time: string) => slots.some(
    (s) => s.weekday === weekday && s.startsAt <= time && s.endsAt > time,
  );

  const orphan = sold.find((b) => !covers(b.weekday, b.time));
  if (orphan) {
    throw badRequest('slot_committed', 'لا يمكن سحب ساعة عليها حجز قائم — ألغِ الحجز أولًا أو اعتذر عنه');
  }

  await transaction(async (client) => {
    await client.query('delete from teacher_availability where teacher_user_id = $1', [teacherId]);

    for (const slot of slots) {
      await client.query(
        `insert into teacher_availability (teacher_user_id, weekday, starts_at, ends_at, mode)
         values ($1, $2, $3::time, $4::time, $5)`,
        [teacherId, slot.weekday, slot.startsAt, slot.endsAt, slot.mode ?? null],
      );
    }
  });

  return availability(teacherId);
};

export const submitDocument = async (teacherId: string, storageKey: string, docType = 'national_id') => {
  await transaction(async (client) => {
    await client.query(
      'insert into teacher_documents (teacher_user_id, doc_type, storage_key) values ($1,$2,$3)',
      [teacherId, docType, storageKey],
    );
    await client.query(
      `update teacher_profiles set verification = 'pending', rejection_reason = null
       where user_id = $1`,
      [teacherId],
    );
  });
  return ownProfile(teacherId);
};

export const pendingVerifications = () =>
  query(
    `select u.id, u.full_name as "name", u.phone, p.verification,
            (select json_build_object('key', d.storage_key, 'at', d.uploaded_at)
             from teacher_documents d where d.teacher_user_id = u.id
             order by d.uploaded_at desc limit 1) as document
     from users u join teacher_profiles p on p.user_id = u.id
     where p.verification = 'pending'
     order by u.created_at`,
  );

export const reviewVerification = async (adminId: string, teacherId: string, approved: boolean, reason?: string) => {
  if (!approved && !reason?.trim()) {
    throw badRequest('reason_required', 'اكتب سبب الرفض — يصل المدرس');
  }

  const row = await one(
    `update teacher_profiles
       set verification = $2::verification_status,
           verified_at = case when $2 = 'verified' then now() else null end,
           verified_by = $3,
           rejection_reason = $4
     where user_id = $1
     returning user_id as "teacherId", verification`,
    [teacherId, approved ? 'verified' : 'rejected', adminId, approved ? null : reason!.trim()],
  );

  if (!row) throw notFound('المدرس غير موجود');

  await query(
    `insert into audit_log (actor_id, action, entity, entity_id, metadata)
     values ($1, $2, 'teacher', $3, $4)`,
    [adminId, approved ? 'teacher.verify' : 'teacher.reject', teacherId, JSON.stringify({ reason: reason ?? null })],
  );

  await query(
    `insert into notifications (user_id, title, body, tone)
     values ($1, $2, $3, $4)`,
    approved
      ? [teacherId, 'وُثِّقت هويتك', 'ملفك ظاهر الآن للطلاب في نتائج البحث', 'success']
      : [teacherId, 'لم يُقبل مستند الهوية', reason!.trim(), 'danger'],
  );

  return row;
};

export const assertTeacher = (session: { userId: string; role: string }) => {
  if (session.role !== 'teacher') throw forbidden('هذا المسار للمدرسين');
  return session.userId;
};
