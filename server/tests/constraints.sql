-- Each block does something the business rules forbid and expects the database
-- to refuse it. A passing run means the rule is enforced by data, not by hope.
\set ON_ERROR_STOP off
\timing off

create or replace function expect_failure(label text, stmt text) returns void as $$
begin
  begin
    execute stmt;
    raise warning '✗ FAIL % — لم تُرفض العملية', label;
  exception when others then
    raise notice '✓ PASS % — رُفضت: %', label, left(sqlerrm, 60);
  end;
end $$ language plpgsql;

create or replace function expect_success(label text, stmt text) returns void as $$
begin
  begin
    execute stmt;
    raise notice '✓ PASS % — نجحت كما يجب', label;
  exception when others then
    raise warning '✗ FAIL % — رُفضت خطأً: %', label, left(sqlerrm, 80);
  end;
end $$ language plpgsql;

-- ── seed ────────────────────────────────────────────────────────────────────
insert into subjects (code, name_ar) values ('math', 'الرياضيات');
insert into grades   (code, name_ar)  values ('g6', 'الصف السادس');

insert into users (id, role, full_name, phone, password_hash) values
  ('11111111-1111-1111-1111-111111111111', 'teacher', 'أحمد المبروك', '0911111111', 'argon2:x'),
  ('22222222-2222-2222-2222-222222222222', 'parent',  'سارة المبروك', '0912345678', 'argon2:x'),
  ('33333333-3333-3333-3333-333333333333', 'student', 'أحمد الزوي',   '0910000001', 'argon2:x');

insert into teacher_profiles (user_id) values ('11111111-1111-1111-1111-111111111111');

\echo ''
\echo '── BR-AUTH-1: صيغة رقم الهاتف ──'
select expect_failure('رقم غير ليبي مرفوض',
  $$insert into users (role, full_name, phone, password_hash)
    values ('student', 'اختبار', '0511111111', 'x')$$);

\echo ''
\echo '── BR-AUTH-2: الرقم فريد داخل الدور ──'
select expect_failure('تكرار الرقم لنفس الدور مرفوض',
  $$insert into users (role, full_name, phone, password_hash)
    values ('parent', 'مكررة', '0912345678', 'x')$$);
select expect_success('نفس الرقم بدور آخر مقبول',
  $$insert into users (role, full_name, phone, password_hash)
    values ('teacher', 'نفس الرقم مدرسًا', '0912345678', 'x')$$);

\echo ''
\echo '── BR-PAY-3: التقسيم يساوي السعر ──'
select expect_failure('تقسيم لا يساوي السعر مرفوض',
  $$insert into bookings (payer_user_id, teacher_user_id, subject_id, grade_id, kind, mode,
      starts_at, lesson_price, commission_rate, platform_fee, tutor_amount, expires_at)
    select '22222222-2222-2222-2222-222222222222','11111111-1111-1111-1111-111111111111',
      s.id, g.id, 'individual', 'online', now() + interval '2 days',
      30, 0.15, 4.50, 20.00, now() + interval '24 hours'
    from subjects s, grades g limit 1$$);

select expect_success('تقسيم صحيح مقبول',
  $$insert into bookings (id, payer_user_id, teacher_user_id, subject_id, grade_id, kind, mode,
      starts_at, lesson_price, commission_rate, platform_fee, tutor_amount, expires_at, status)
    select 'aaaaaaaa-0000-0000-0000-000000000001','22222222-2222-2222-2222-222222222222',
      '11111111-1111-1111-1111-111111111111', s.id, g.id, 'individual', 'online',
      timestamptz '2026-10-01 17:00+02', 30, 0.15, 4.50, 25.50,
      now() + interval '24 hours', 'confirmed'
    from subjects s, grades g limit 1$$);

\echo ''
\echo '── BR-BOOK-3: منع الحجز المزدوج ──'
select expect_failure('حجز ثانٍ مؤكد لنفس المدرس والموعد مرفوض',
  $$insert into bookings (payer_user_id, teacher_user_id, subject_id, grade_id, kind, mode,
      starts_at, lesson_price, commission_rate, platform_fee, tutor_amount, expires_at, status)
    select '33333333-3333-3333-3333-333333333333','11111111-1111-1111-1111-111111111111',
      s.id, g.id, 'individual', 'online', timestamptz '2026-10-01 17:00+02',
      30, 0.15, 4.50, 25.50, now() + interval '24 hours', 'confirmed'
    from subjects s, grades g limit 1$$);

select expect_success('طلب معلّق على نفس الموعد مقبول',
  $$insert into bookings (payer_user_id, teacher_user_id, subject_id, grade_id, kind, mode,
      starts_at, lesson_price, commission_rate, platform_fee, tutor_amount, expires_at, status)
    select '33333333-3333-3333-3333-333333333333','11111111-1111-1111-1111-111111111111',
      s.id, g.id, 'individual', 'online', timestamptz '2026-10-01 17:00+02',
      30, 0.15, 4.50, 25.50, now() + interval '24 hours', 'pending_approval'
    from subjects s, grades g limit 1$$);

\echo ''
\echo '── BR-PAY-8: توازن الحركة المالية ──'
select expect_success('حركة محجوزة متوازنة مقبولة',
  $$insert into transactions (id, booking_id, teacher_user_id, payer_user_id,
      gross_amount, platform_fee, tutor_earning, status, paid_with)
    values ('bbbbbbbb-0000-0000-0000-000000000001','aaaaaaaa-0000-0000-0000-000000000001',
      '11111111-1111-1111-1111-111111111111','22222222-2222-2222-2222-222222222222',
      30.00, 4.50, 25.50, 'held', 'bank_transfer')$$);

select expect_failure('حركة غير متوازنة مرفوضة',
  $$insert into transactions (booking_id, teacher_user_id, payer_user_id,
      gross_amount, platform_fee, tutor_earning, status, paid_with)
    values ('aaaaaaaa-0000-0000-0000-000000000001',
      '11111111-1111-1111-1111-111111111111','22222222-2222-2222-2222-222222222222',
      30.00, 4.50, 20.00, 'held', 'bank_transfer')$$);

select expect_failure('حركتان لحجز واحد مرفوضتان',
  $$insert into transactions (booking_id, teacher_user_id, payer_user_id,
      gross_amount, platform_fee, tutor_earning, status, paid_with)
    values ('aaaaaaaa-0000-0000-0000-000000000001',
      '11111111-1111-1111-1111-111111111111','22222222-2222-2222-2222-222222222222',
      30.00, 4.50, 25.50, 'held', 'bank_transfer')$$);

\echo ''
\echo '── BR-CNL-2: الإلغاء المتأخر يبقى متوازنًا ──'
select expect_success('إلغاء متأخر: 1.13 + 6.37 + 22.50 = 30.00',
  $$update transactions set status = 'partially_refunded', platform_fee = 1.13,
      tutor_earning = 6.37, refunded_amount = 22.50, refunded_at = now()
    where id = 'bbbbbbbb-0000-0000-0000-000000000001'$$);

select expect_failure('تعديل قيمة حركة مسجّلة مرفوض',
  $$update transactions set gross_amount = 999
    where id = 'bbbbbbbb-0000-0000-0000-000000000001'$$);

\echo ''
\echo '── BR-CRD: الرصيد لا يصبح سالبًا ──'
select expect_success('إضافة رصيد للطالب',
  $$insert into credit_entries (user_id, amount, reason, refundable)
    values ('22222222-2222-2222-2222-222222222222', 22.50, 'إلغاء متأخر', false)$$);

select expect_failure('إنفاق أكثر من الرصيد مرفوض',
  $$insert into credit_entries (user_id, amount, reason)
    values ('22222222-2222-2222-2222-222222222222', -50.00, 'دفع حصة من الرصيد')$$);

select expect_success('إنفاق ضمن الرصيد مقبول',
  $$insert into credit_entries (user_id, amount, reason)
    values ('22222222-2222-2222-2222-222222222222', -20.00, 'دفع حصة من الرصيد')$$);

\echo ''
\echo '── BR-REV-1: التقييم لحجز مكتمل فقط ──'
select expect_failure('تقييم حجز غير مكتمل مرفوض',
  $$insert into reviews (booking_id, author_id, stars)
    values ('aaaaaaaa-0000-0000-0000-000000000001','22222222-2222-2222-2222-222222222222', 5)$$);

update bookings set status = 'completed' where id = 'aaaaaaaa-0000-0000-0000-000000000001';

select expect_success('تقييم حجز مكتمل مقبول',
  $$insert into reviews (booking_id, author_id, stars, body)
    values ('aaaaaaaa-0000-0000-0000-000000000001','22222222-2222-2222-2222-222222222222', 5, 'ممتاز')$$);

select expect_failure('تقييم ثانٍ لنفس الحجز مرفوض',
  $$insert into reviews (booking_id, author_id, stars)
    values ('aaaaaaaa-0000-0000-0000-000000000001','22222222-2222-2222-2222-222222222222', 4)$$);

\echo ''
\echo '── Idempotency: نفس الـWebhook مرتين ──'
select expect_success('أول استلام مقبول',
  $$insert into webhook_events (provider, event_id, payload, signature_ok)
    values ('mypay', 'evt_1001', '{"type":"payment.success"}', true)$$);

select expect_failure('إعادة الاستلام نفسه مرفوضة',
  $$insert into webhook_events (provider, event_id, payload, signature_ok)
    values ('mypay', 'evt_1001', '{"type":"payment.success"}', true)$$);

\echo ''
\echo '── BR-DSC-3: إيقاف فعّال واحد لكل مدرس ──'
select expect_success('إيقاف أول',
  $$insert into teacher_suspensions (teacher_user_id, reason, auto)
    values ('11111111-1111-1111-1111-111111111111', '3 اعتذارات', true)$$);

select expect_failure('إيقاف ثانٍ قبل رفع الأول مرفوض',
  $$insert into teacher_suspensions (teacher_user_id, reason)
    values ('11111111-1111-1111-1111-111111111111', 'إيقاف إداري')$$);

\echo ''
\echo '── BR-PRF-1: حدود السعر ──'
select expect_failure('سعر خارج الحدود مرفوض',
  $$insert into teacher_rates (teacher_user_id, mode, kind, price_per_hour)
    values ('11111111-1111-1111-1111-111111111111', 'online', 'individual', 500)$$);

select expect_failure('جلسة جماعية بلا مقاعد مرفوضة',
  $$insert into teacher_rates (teacher_user_id, mode, kind, price_per_hour)
    values ('11111111-1111-1111-1111-111111111111', 'online', 'group', 20)$$);

select expect_success('جلسة جماعية بمقاعد مقبولة',
  $$insert into teacher_rates (teacher_user_id, mode, kind, price_per_hour, group_seats)
    values ('11111111-1111-1111-1111-111111111111', 'online', 'group', 20, 5)$$);

\echo ''
\echo '── BR-PRV-1: الحجز لمتعلّم تحت حسابك فقط ──'
insert into children (id, parent_user_id, name)
  values ('cccccccc-0000-0000-0000-000000000001','22222222-2222-2222-2222-222222222222','يوسف');

select expect_failure('حجز لابن مستخدم آخر مرفوض',
  $$insert into bookings (payer_user_id, child_id, teacher_user_id, subject_id, grade_id, kind, mode,
      starts_at, lesson_price, commission_rate, platform_fee, tutor_amount, expires_at)
    select '33333333-3333-3333-3333-333333333333','cccccccc-0000-0000-0000-000000000001',
      '11111111-1111-1111-1111-111111111111', s.id, g.id, 'individual', 'online',
      timestamptz '2026-10-05 17:00+02', 30, 0.15, 4.50, 25.50, now() + interval '24 hours'
    from subjects s, grades g limit 1$$);

select expect_success('حجز ولي الأمر لابنه مقبول',
  $$insert into bookings (payer_user_id, child_id, teacher_user_id, subject_id, grade_id, kind, mode,
      starts_at, lesson_price, commission_rate, platform_fee, tutor_amount, expires_at)
    select '22222222-2222-2222-2222-222222222222','cccccccc-0000-0000-0000-000000000001',
      '11111111-1111-1111-1111-111111111111', s.id, g.id, 'individual', 'online',
      timestamptz '2026-10-05 17:00+02', 30, 0.15, 4.50, 25.50, now() + interval '24 hours'
    from subjects s, grades g limit 1$$);

\echo ''
\echo '── الإعدادات: صف واحد لا غير ──'
select expect_failure('صف إعدادات ثانٍ مرفوض',
  $$insert into platform_settings (id) values (2)$$);

\echo ''
\echo '── محفظة المدرس مشتقّة من الدفتر ──'
select teacher_user_id, gross, commission, earned, pending from teacher_wallets;
select user_id, balance from credit_balances;
