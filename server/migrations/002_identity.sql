-- 002 — accounts and learners.

create table users (
  id                uuid primary key default gen_random_uuid(),
  role              user_role not null,
  full_name         text not null,
  phone             text not null,
  password_hash     text not null,
  phone_verified_at timestamptz,
  grade_id          uuid references grades(id),
  created_at        timestamptz not null default now(),
  disabled_at       timestamptz,

  -- The same number may be a parent and a teacher, but not two parents.
  constraint users_phone_per_role unique (role, phone),
  constraint users_phone_format   check (phone ~ '^09[0-9]{8}$'),
  constraint users_grade_only_student check (grade_id is null or role = 'student')
);

create index users_role_idx on users(role) where disabled_at is null;

create table children (
  id             uuid primary key default gen_random_uuid(),
  parent_user_id uuid not null references users(id),
  name           text not null,
  grade_id       uuid references grades(id),
  created_at     timestamptz not null default now(),
  disabled_at    timestamptz
);

create index children_parent_idx on children(parent_user_id) where disabled_at is null;
