-- 005 — the ledger. Every rule here exists because money is involved.

create table transactions (
  id              uuid primary key default gen_random_uuid(),
  booking_id      uuid not null unique references bookings(id),
  teacher_user_id uuid not null references users(id),
  payer_user_id   uuid not null references users(id),

  gross_amount    numeric(10,2) not null,
  platform_fee    numeric(10,2) not null,
  tutor_earning   numeric(10,2) not null,
  refunded_amount numeric(10,2) not null default 0,

  status          transaction_status not null default 'held',
  paid_with       payment_method not null,
  gateway_ref     text,

  created_at      timestamptz not null default now(),
  released_at     timestamptz,
  refunded_at     timestamptz,

  -- The heart of the system: the three parts always add up to what was paid.
  constraint tx_split_matches     check (platform_fee + tutor_earning + refunded_amount = gross_amount),
  constraint tx_refund_bounds     check (refunded_amount between 0 and gross_amount),
  constraint tx_released_has_time check (status <> 'released' or released_at is not null)
);

create index tx_teacher_idx on transactions(teacher_user_id, status);

-- History is never rewritten: a mistake is corrected with an opposing entry.
create or replace function freeze_transaction_gross() returns trigger as $$
begin
  if new.gross_amount <> old.gross_amount then
    raise exception 'لا يجوز تعديل قيمة حركة مسجّلة';
  end if;
  return new;
end $$ language plpgsql;

create trigger transactions_gross_is_final
  before update on transactions
  for each row execute function freeze_transaction_gross();

create table payout_accounts (
  teacher_user_id uuid primary key references users(id),
  bank_name       text not null,
  holder_name     text not null,
  account_number  text not null,
  updated_at      timestamptz not null default now()
);

create table payouts (
  id              uuid primary key default gen_random_uuid(),
  teacher_user_id uuid not null references users(id),
  amount          numeric(10,2) not null check (amount > 0),
  status          payout_status not null default 'requested',
  requested_at    timestamptz not null default now(),
  settled_at      timestamptz,
  settled_by      uuid references users(id),
  note            text
);

create index payouts_open_idx on payouts(status) where status = 'requested';

-- Derived, never stored: a wallet figure cannot drift from the ledger it sums.
create view teacher_wallets as
select
  t.teacher_user_id,
  coalesce(sum(t.gross_amount)  filter (where t.status <> 'refunded'), 0)                        as gross,
  coalesce(sum(t.platform_fee), 0)                                                               as commission,
  coalesce(sum(t.tutor_earning) filter (where t.status in ('released','partially_refunded')), 0) as earned,
  coalesce(sum(t.tutor_earning) filter (where t.status = 'held'), 0)                             as pending,
  coalesce((select sum(p.amount) from payouts p
            where p.teacher_user_id = t.teacher_user_id and p.status = 'paid'), 0)               as withdrawn,
  coalesce((select sum(p.amount) from payouts p
            where p.teacher_user_id = t.teacher_user_id and p.status = 'requested'), 0)          as requested
from transactions t
group by t.teacher_user_id;

create table credit_entries (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references users(id),
  amount      numeric(10,2) not null check (amount <> 0),
  reason      text not null,
  booking_id  uuid references bookings(id),
  refundable  boolean not null default false,
  refunded_at timestamptz,
  created_at  timestamptz not null default now()
);

create index credit_user_idx on credit_entries(user_id);

create view credit_balances as
select user_id, sum(amount) as balance from credit_entries group by user_id;

-- Spending the same credit twice is a race, not a bug in arithmetic: the row
-- lock is what actually prevents it.
create or replace function assert_credit_not_negative() returns trigger as $$
declare total numeric(10,2);
begin
  perform 1 from users where id = new.user_id for update;
  select coalesce(sum(amount), 0) into total from credit_entries where user_id = new.user_id;
  if total < 0 then
    raise exception 'الرصيد لا يكفي';
  end if;
  return new;
end $$ language plpgsql;

-- Immediate, not deferred: the caller must be told at once that the balance is
-- short. A deferred check only fails at commit, long after the API replied.
create trigger credit_never_negative
  after insert on credit_entries
  for each row execute function assert_credit_not_negative();

create table refund_requests (
  id              uuid primary key default gen_random_uuid(),
  credit_entry_id uuid not null unique references credit_entries(id),
  user_id         uuid not null references users(id),
  amount          numeric(10,2) not null check (amount > 0),
  bank_name       text not null,
  holder_name     text not null,
  account_number  text not null,
  status          refund_status not null default 'requested',
  requested_at    timestamptz not null default now(),
  settled_at      timestamptz,
  settled_by      uuid references users(id)
);

create table payment_sessions (
  id           uuid primary key default gen_random_uuid(),
  booking_id   uuid not null references bookings(id),
  provider     text not null default 'mypay',
  provider_ref text not null,
  gateway      text,
  amount       numeric(10,2) not null,
  status       text not null default 'open',
  expires_at   timestamptz not null,
  created_at   timestamptz not null default now(),
  paid_at      timestamptz,
  constraint session_ref_unique unique (provider, provider_ref)
);

-- Idempotency in one line: a repeated delivery cannot be inserted twice.
create table webhook_events (
  id           uuid primary key default gen_random_uuid(),
  provider     text not null,
  event_id     text not null,
  payload      jsonb not null,
  signature_ok boolean not null,
  processed_at timestamptz,
  received_at  timestamptz not null default now(),
  constraint webhook_unique unique (provider, event_id)
);
