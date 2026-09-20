-- 003 — the teacher: profile, what they teach, what they charge, when they work.

create table teacher_profiles (
  user_id          uuid primary key references users(id),
  bio              text,
  experience       text,
  city_id          uuid references cities(id),
  verification     verification_status not null default 'pending',
  verified_at      timestamptz,
  verified_by      uuid references users(id),
  rejection_reason text,
  rating_avg       numeric(3,2) not null default 0,
  reviews_count    int not null default 0,
  sessions_count   int not null default 0,
  legacy_sessions  int not null default 0,
  created_at       timestamptz not null default now()
);

create table teacher_subjects  (teacher_user_id uuid references users(id), subject_id  uuid references subjects(id),  primary key (teacher_user_id, subject_id));
create table teacher_grades    (teacher_user_id uuid references users(id), grade_id    uuid references grades(id),    primary key (teacher_user_id, grade_id));
create table teacher_languages (teacher_user_id uuid references users(id), language_id uuid references languages(id), primary key (teacher_user_id, language_id));
create table teacher_areas     (teacher_user_id uuid references users(id), city_id     uuid references cities(id),    primary key (teacher_user_id, city_id));

create table teacher_rates (
  teacher_user_id uuid not null references users(id),
  mode            session_mode not null,
  kind            session_type not null,
  price_per_hour  numeric(10,2) not null,
  group_seats     int,

  primary key (teacher_user_id, mode, kind),
  constraint rate_within_limits check (price_per_hour between 10 and 200),
  -- `case` and not `or`: in SQL, NULL or FALSE is NULL, and a check constraint
  -- treats NULL as a pass — so the obvious spelling lets a group rate through
  -- with no seat limit at all.
  constraint group_seats_required check (
    case kind
      when 'group'      then group_seats is not null and group_seats between 2 and 12
      when 'individual' then group_seats is null
    end
  )
);

create table teacher_availability (
  id              uuid primary key default gen_random_uuid(),
  teacher_user_id uuid not null references users(id),
  weekday         int  not null check (weekday between 0 and 6),
  starts_at       time not null,
  ends_at         time not null,
  mode            session_mode,
  constraint availability_order check (ends_at > starts_at)
);

create index availability_teacher_idx on teacher_availability(teacher_user_id, weekday);

create table teacher_time_off (
  id              uuid primary key default gen_random_uuid(),
  teacher_user_id uuid not null references users(id),
  starts_at       timestamptz not null,
  ends_at         timestamptz not null,
  reason          text,
  constraint time_off_order check (ends_at > starts_at)
);

create table teacher_documents (
  id              uuid primary key default gen_random_uuid(),
  teacher_user_id uuid not null references users(id),
  doc_type        text not null,
  storage_key     text not null,
  uploaded_at     timestamptz not null default now(),
  reviewed_at     timestamptz,
  reviewed_by     uuid references users(id)
);

-- A history, not a flag: lifting a suspension has to have its own date so the
-- apology count can start again from it.
create table teacher_suspensions (
  id              uuid primary key default gen_random_uuid(),
  teacher_user_id uuid not null references users(id),
  reason          text not null,
  auto            boolean not null default false,
  created_at      timestamptz not null default now(),
  created_by      uuid references users(id),
  lifted_at       timestamptz,
  lifted_by       uuid references users(id)
);

create unique index one_active_suspension
  on teacher_suspensions(teacher_user_id) where lifted_at is null;
