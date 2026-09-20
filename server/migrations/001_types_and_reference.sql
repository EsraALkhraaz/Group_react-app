-- 001 — enums and the reference data the admin owns.
-- Rules that can be enforced by the database are never left to application code.

create extension if not exists pgcrypto;

create type user_role           as enum ('student', 'parent', 'teacher', 'admin');
create type session_type        as enum ('individual', 'group');
create type session_mode        as enum ('online', 'f2f');

create type booking_status      as enum (
  'pending_approval', 'rejected', 'expired',
  'awaiting_payment', 'payment_review',
  'confirmed', 'completed', 'cancelled'
);

create type transaction_status  as enum ('held', 'released', 'refunded', 'partially_refunded');
create type payout_status       as enum ('requested', 'paid', 'rejected');
create type refund_status       as enum ('requested', 'paid', 'declined');
create type verification_status as enum ('pending', 'verified', 'rejected');
create type payment_method      as enum ('bank_transfer', 'gateway', 'credit');

create table subjects (
  id          uuid primary key default gen_random_uuid(),
  code        text unique not null,
  name_ar     text not null,
  color       text,
  sort_order  int  not null default 0,
  disabled_at timestamptz
);

create table grades (
  id          uuid primary key default gen_random_uuid(),
  code        text unique not null,
  name_ar     text not null,
  stage       text,
  sort_order  int  not null default 0,
  disabled_at timestamptz
);

create table languages (
  id uuid primary key default gen_random_uuid(),
  code text unique not null, name_ar text not null, disabled_at timestamptz
);

create table cities (
  id uuid primary key default gen_random_uuid(),
  code text unique not null, name_ar text not null, disabled_at timestamptz
);
