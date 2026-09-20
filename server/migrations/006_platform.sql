-- 006 — settings, and the records that explain what the platform did.

create table platform_settings (
  id                      int primary key default 1,
  group_commission        numeric(5,4)  not null default 0.15,
  cancellation_fee        numeric(5,4)  not null default 0.25,
  payment_fee             numeric(5,4)  not null default 0.00,
  minimum_payout          numeric(10,2) not null default 100,
  free_cancellation_hours int not null default 24,
  request_expiry_hours    int not null default 24,
  apology_limit           int not null default 3,
  apology_window_days     int not null default 30,
  updated_at              timestamptz not null default now(),
  updated_by              uuid references users(id),

  constraint settings_singleton check (id = 1),
  constraint rates_sane check (
    group_commission between 0 and 0.6 and
    cancellation_fee between 0 and 1   and
    payment_fee      between 0 and 0.1
  )
);

insert into platform_settings (id) values (1);

create table commission_tiers (
  id           uuid primary key default gen_random_uuid(),
  min_sessions int not null check (min_sessions >= 0),
  rate         numeric(5,4) not null check (rate between 0 and 0.6),
  label        text not null,
  constraint tier_unique unique (min_sessions)
);

insert into commission_tiers (min_sessions, rate, label) values
  (0,  0.20, 'مدرس جديد'),
  (10, 0.17, 'بعد 10 حصص'),
  (30, 0.15, 'مدرس نشط');

-- Asked "why was I charged 20%?", the answer has to come from a record.
create table settings_history (
  id         uuid primary key default gen_random_uuid(),
  changed_at timestamptz not null default now(),
  changed_by uuid references users(id),
  before     jsonb not null,
  after      jsonb not null
);

create table audit_log (
  id        uuid primary key default gen_random_uuid(),
  actor_id  uuid references users(id),
  action    text not null,
  entity    text not null,
  entity_id uuid,
  metadata  jsonb,
  ip        inet,
  created_at timestamptz not null default now()
);

create index audit_entity_idx on audit_log(entity, entity_id);

create table notifications (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references users(id),
  title      text not null,
  body       text,
  tone       text,
  booking_id uuid references bookings(id),
  read_at    timestamptz,
  created_at timestamptz not null default now()
);

create index notifications_unread_idx on notifications(user_id) where read_at is null;

create table favorites (
  user_id         uuid not null references users(id),
  teacher_user_id uuid not null references users(id),
  created_at      timestamptz not null default now(),
  primary key (user_id, teacher_user_id)
);
