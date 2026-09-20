-- 007 — what a session and a one-time code look like.

-- Refresh tokens are stored hashed, exactly like passwords: a leaked database
-- must not hand anyone a working session.
create table refresh_tokens (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references users(id),
  token_hash  text not null unique,
  issued_at   timestamptz not null default now(),
  expires_at  timestamptz not null,
  revoked_at  timestamptz,
  replaced_by uuid references refresh_tokens(id),
  user_agent  text,
  ip          inet
);

create index refresh_user_idx on refresh_tokens(user_id) where revoked_at is null;

-- The code itself is never stored in the clear either.
create table otp_codes (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references users(id),
  purpose     text not null,                       -- 'verify_phone' | 'reset_password'
  code_hash   text not null,
  attempts    int  not null default 0,
  expires_at  timestamptz not null,
  consumed_at timestamptz,
  created_at  timestamptz not null default now(),

  constraint otp_attempts_bounded check (attempts >= 0 and attempts <= 3)
);

create index otp_open_idx on otp_codes(user_id, purpose) where consumed_at is null;

-- One live code per purpose: asking for a new one invalidates the old.
create unique index otp_one_live
  on otp_codes(user_id, purpose) where consumed_at is null;

-- Enough history to lock out a guesser without keeping anything sensitive.
create table login_attempts (
  id         uuid primary key default gen_random_uuid(),
  phone      text not null,
  role       user_role not null,
  ok         boolean not null,
  ip         inet,
  created_at timestamptz not null default now()
);

create index login_attempts_recent_idx on login_attempts(phone, role, created_at desc);
