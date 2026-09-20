-- 004 — bookings, and the constraints that make a wrong booking impossible.

create table bookings (
  id                   uuid primary key default gen_random_uuid(),

  payer_user_id        uuid not null references users(id),
  child_id             uuid references children(id),
  teacher_user_id      uuid not null references users(id),

  subject_id           uuid not null references subjects(id),
  grade_id             uuid not null references grades(id),
  kind                 session_type not null,
  mode                 session_mode not null,
  group_session_id     uuid,

  starts_at            timestamptz not null,
  duration_mins        int not null default 60,

  -- Snapshot: a later rate change never rewrites what was agreed here.
  lesson_price         numeric(10,2) not null,
  commission_rate      numeric(5,4)  not null,
  platform_fee         numeric(10,2) not null,
  tutor_amount         numeric(10,2) not null,

  status               booking_status not null default 'pending_approval',
  payment_method       payment_method,
  meeting_link         text,
  note                 text,

  responded_at         timestamptz,
  rejection_reason     text,
  expires_at           timestamptz not null,
  paid_at              timestamptz,
  completed_at         timestamptz,
  cancelled_at         timestamptz,
  cancelled_by_teacher boolean not null default false,
  cancellation_fee     numeric(10,2),
  refund_amount        numeric(10,2),

  created_at           timestamptz not null default now(),

  constraint split_matches_price check (platform_fee + tutor_amount = lesson_price),
  constraint fee_not_negative    check (platform_fee >= 0 and tutor_amount >= 0),
  constraint rate_is_a_fraction  check (commission_rate >= 0 and commission_rate <= 1),
  constraint duration_sane       check (duration_mins between 30 and 240)
);

-- Several learners may ask for the same slot; only one may pass approval.
-- A group session is the exception: its seats are meant to be shared.
create unique index no_double_booking
  on bookings (teacher_user_id, starts_at)
  where status in ('awaiting_payment', 'payment_review', 'confirmed')
    and kind = 'individual';

create index bookings_teacher_status_idx on bookings(teacher_user_id, status);
create index bookings_payer_idx          on bookings(payer_user_id, created_at desc);
create index bookings_expiring_idx       on bookings(expires_at) where status = 'pending_approval';
create index bookings_upcoming_idx       on bookings(starts_at)  where status = 'confirmed';

-- A parent books for their own children and nobody else's. This cannot be a
-- check constraint because it has to read another table.
create or replace function assert_child_belongs_to_payer() returns trigger as $$
begin
  if new.child_id is not null
     and not exists (select 1 from children c
                     where c.id = new.child_id and c.parent_user_id = new.payer_user_id) then
    raise exception 'لا يمكن الحجز لمتعلّم ليس تحت حسابك';
  end if;
  return new;
end $$ language plpgsql;

create trigger bookings_child_is_yours
  before insert or update on bookings
  for each row execute function assert_child_belongs_to_payer();

create table booking_receipts (
  id          uuid primary key default gen_random_uuid(),
  booking_id  uuid not null references bookings(id),
  storage_key text not null,
  uploaded_at timestamptz not null default now(),
  reviewed_at timestamptz,
  reviewed_by uuid references users(id),
  approved    boolean
);

create table reviews (
  id         uuid primary key default gen_random_uuid(),
  booking_id uuid not null unique references bookings(id),
  author_id  uuid not null references users(id),
  stars      int  not null check (stars between 1 and 5),
  body       text,
  created_at timestamptz not null default now(),
  hidden_at  timestamptz,
  hidden_by  uuid references users(id)
);

-- A check constraint cannot read another table, so the rule needs a trigger.
create or replace function assert_booking_completed() returns trigger as $$
begin
  if (select status from bookings where id = new.booking_id) <> 'completed' then
    raise exception 'لا يمكن تقييم حجز غير مكتمل';
  end if;
  return new;
end $$ language plpgsql;

create trigger reviews_require_completed
  before insert on reviews
  for each row execute function assert_booking_completed();
