import React, { useState } from 'react';
import { useHistory, useParams, useLocation } from 'react-router-dom';
import { TopBar, Avatar, Banner, Sheet, Field, money, formatDate, formatTime, EmptyState, Stars } from '../components/common';
import { IconVideo, IconPin, IconCheck, IconUpload, IconClock, IconStar } from '../components/Icons';
import { subjectById, PLATFORM_BANK } from '../data/catalog';
import { percent, cancellationOutcome } from '../lib/money';
import { useApp, BOOKING_STATUS, STATUS_LABEL, STATUS_TONE } from '../state/AppContext';

const TIMELINE = [
  { status: BOOKING_STATUS.PENDING_APPROVAL, label: 'أُرسل الطلب للمدرس' },
  { status: BOOKING_STATUS.AWAITING_PAYMENT, label: 'وافق المدرس — بانتظار الدفع' },
  { status: BOOKING_STATUS.PAYMENT_REVIEW, label: 'مراجعة إيصال الدفع' },
  { status: BOOKING_STATUS.CONFIRMED, label: 'الحجز مؤكد' },
];

const order = (status) => TIMELINE.findIndex((t) => t.status === status);

export default function BookingDetails() {
  const { id } = useParams();
  const history = useHistory();
  const isNew = new URLSearchParams(useLocation().search).get('new') === '1';
  const {
    bookings, submitPayment, cancelBooking, addReview, teacherFor, base, settings, transactions,
  } = useApp();

  const [payOpen, setPayOpen] = useState(false);
  const [receipt, setReceipt] = useState('');
  const [reviewOpen, setReviewOpen] = useState(false);
  const [stars, setStars] = useState(5);
  const [reviewText, setReviewText] = useState('');
  const [cancelOpen, setCancelOpen] = useState(false);

  const booking = bookings.find((b) => b.id === id);
  if (!booking) return <EmptyState title="الحجز غير موجود" body="" />;

  const teacher = teacherFor(booking.teacherId);
  const commission = booking.platformFee ?? 0;
  const currentStep = order(booking.status);
  // What cancelling right now would cost, by the platform's own rule.
  const paid = transactions.find((t) => t.bookingId === booking.id && t.status === 'held');
  const ifCancelled = cancellationOutcome({ settings, booking, transaction: paid });
  const isDead = [BOOKING_STATUS.REJECTED, BOOKING_STATUS.CANCELLED].includes(booking.status);

  return (
    <div className="dz-screen">
      <TopBar back title="تفاصيل الحجز" subtitle={`رقم الحجز ${booking.id.slice(-6)}`} onBack={() => history.push(`${base}/bookings`)} />

      <div className="dz-body" style={{ paddingTop: 4 }}>
        {isNew && (
          <div style={{ marginBottom: 14 }}>
            <Banner tone="success" icon={<IconCheck size={18} />}>
              تم إرسال طلبك بنجاح — بانتظار رد المدرس.
            </Banner>
          </div>
        )}

        <div className="dz-card dz-card--raised" style={{ marginBottom: 16 }}>
          <div className="dz-row" style={{ marginBottom: 12 }}>
            <Avatar teacher={teacher} />
            <div className="dz-grow">
              <div style={{ fontWeight: 800, fontSize: 15 }}>{teacher.name}</div>
              <div className="dz-muted" style={{ marginTop: 2 }}>{subjectById(booking.subjectId)?.name}</div>
            </div>
            <span className={`dz-chip dz-chip--sm dz-chip--${STATUS_TONE[booking.status]}`}>
              {STATUS_LABEL[booking.status]}
            </span>
          </div>

          <div className="dz-kv"><span className="dz-kv__k">الطالب</span><span className="dz-kv__v">{booking.learnerName}</span></div>
          <div className="dz-kv"><span className="dz-kv__k">الموعد</span><span className="dz-kv__v">{formatDate(booking.date)} — {formatTime(booking.time)}</span></div>
          <div className="dz-kv">
            <span className="dz-kv__k">النوع</span>
            <span className="dz-kv__v">
              {booking.sessionType === 'group' ? 'جماعية' : 'فردية'} · {booking.mode === 'online' ? 'أونلاين' : 'حضوري'}
            </span>
          </div>
          <div className="dz-kv"><span className="dz-kv__k">المدة</span><span className="dz-kv__v">{booking.durationMins} دقيقة</span></div>
          {booking.note && <div className="dz-kv"><span className="dz-kv__k">ملاحظتك</span><span className="dz-kv__v">{booking.note}</span></div>}
          <div className="dz-kv dz-total"><span className="dz-kv__k">الإجمالي</span><span className="dz-kv__v">{money(booking.price)}</span></div>
          <div className="dz-faint">
            منها {commission} د.ل عمولة المنصة{booking.commissionRate ? ` (${percent(booking.commissionRate)})` : ''}،
            و{booking.tutorAmount ?? booking.price - commission} د.ل مستحقة للمدرس بعد إتمام الحصة.
          </div>
        </div>

        {!isDead && (
          <div className="dz-card" style={{ marginBottom: 16 }}>
            <div className="dz-h3" style={{ marginBottom: 12 }}>مسار الحجز</div>
            {TIMELINE.map((t, i) => {
              const finished = [BOOKING_STATUS.CONFIRMED, BOOKING_STATUS.COMPLETED].includes(booking.status);
              const done = finished || currentStep > i;
              const active = !finished && currentStep === i;
              return (
                <div key={t.status} className="dz-row" style={{ alignItems: 'flex-start', paddingBottom: 14 }}>
                  <span
                    className="dz-avatar dz-avatar--sm"
                    style={{
                      width: 26, height: 26,
                      background: done ? 'var(--c-success-bg)' : active ? 'var(--c-primary-bg)' : '#EFF4F3',
                      color: done ? 'var(--c-success)' : active ? 'var(--c-primary-text)' : 'var(--c-faint)',
                      fontSize: 12,
                    }}
                  >
                    {done ? <IconCheck size={13} /> : i + 1}
                  </span>
                  <span className="dz-grow" style={{ fontSize: 13, fontWeight: active ? 800 : 600, color: done || active ? 'var(--c-ink)' : 'var(--c-faint)' }}>
                    {t.label}
                  </span>
                </div>
              );
            })}
          </div>
        )}

        {booking.status === BOOKING_STATUS.REJECTED && (
          <Banner tone="danger">
            اعتذر المدرس عن هذا الموعد{booking.rejectionReason ? `: ${booking.rejectionReason}` : ''}. لم يُخصم أي مبلغ.
          </Banner>
        )}

        {booking.status === BOOKING_STATUS.CONFIRMED && booking.mode === 'online' && (
          <div className="dz-card" style={{ marginTop: 16 }}>
            <div className="dz-row" style={{ marginBottom: 10 }}>
              <IconVideo size={18} />
              <span className="dz-h3">رابط الجلسة</span>
            </div>
            <div className="dz-muted" style={{ wordBreak: 'break-all', marginBottom: 12 }}>{booking.meetingLink}</div>
            <button type="button" className="dz-btn dz-btn--success dz-btn--sm" style={{ width: '100%' }}>
              الدخول إلى الحصة
            </button>
            <div className="dz-faint" style={{ marginTop: 8, textAlign: 'center' }}>
              يُفعّل الزر قبل الموعد بـ 10 دقائق
            </div>
          </div>
        )}

        {booking.status === BOOKING_STATUS.CONFIRMED && booking.mode === 'f2f' && (
          <div className="dz-card" style={{ marginTop: 16 }}>
            <div className="dz-row" style={{ marginBottom: 10 }}>
              <IconPin size={18} />
              <span className="dz-h3">مكان الحصة</span>
            </div>
            <div className="dz-muted">
              {teacher.areas.join('، ')} — يتواصل معك المدرس على رقم هاتفك لتحديد العنوان الدقيق.
            </div>
          </div>
        )}

        {booking.status === BOOKING_STATUS.PAYMENT_REVIEW && (
          <Banner tone="primary" icon={<IconClock size={18} />}>
            استلمنا إيصالك ({booking.receipt?.fileName}) وتتم مراجعته من الإدارة.
          </Banner>
        )}

        {booking.cancellation && (
          <div className="dz-card" style={{ marginTop: 16 }}>
            <div className="dz-h3" style={{ marginBottom: 8 }}>تفاصيل الإلغاء</div>
            <div className="dz-kv"><span className="dz-kv__k">المبلغ المدفوع</span><span className="dz-kv__v">{money(booking.price)}</span></div>
            {booking.cancellation.fee > 0 && (
              <div className="dz-kv">
                <span className="dz-kv__k">رسوم إلغاء متأخر ({percent(settings.cancellationFee)})</span>
                <span className="dz-kv__v">- {money(booking.cancellation.fee)}</span>
              </div>
            )}
            <div className="dz-kv dz-total"><span className="dz-kv__k">المبلغ المُسترجع</span><span className="dz-kv__v">{money(booking.cancellation.refund)}</span></div>
            <div className="dz-faint" style={{ marginTop: 8 }}>
              {booking.cancellation.late
                ? 'أُلغي الحجز داخل نافذة الإلغاء المتأخر، وتُعوَّض رسوم الإلغاء وقت المدرس.'
                : 'أُلغي الحجز قبل الموعد بوقت كافٍ، فاسترُجع كامل المبلغ.'}
            </div>
          </div>
        )}

        {booking.status === BOOKING_STATUS.COMPLETED && (
          <div className="dz-card" style={{ marginTop: 16 }}>
            <div className="dz-h3" style={{ marginBottom: 8 }}>تقييم الحصة</div>
            {booking.review ? (
              <>
                <Stars value={booking.review.stars} size={15} />
                <div className="dz-muted" style={{ marginTop: 8 }}>{booking.review.text || 'بدون تعليق'}</div>
              </>
            ) : (
              <>
                <div className="dz-muted" style={{ marginBottom: 12 }}>شاركنا رأيك ليستفيد بقية أولياء الأمور.</div>
                <button type="button" className="dz-btn dz-btn--primary dz-btn--sm" style={{ width: '100%' }} onClick={() => setReviewOpen(true)}>
                  أضف تقييمك
                </button>
              </>
            )}
          </div>
        )}
      </div>

      <div className="dz-footer-cta">
        {booking.status === BOOKING_STATUS.AWAITING_PAYMENT && (
          <button type="button" className="dz-btn dz-btn--primary" onClick={() => setPayOpen(true)}>
            ادفع الآن — {money(booking.price)}
          </button>
        )}
        {booking.status === BOOKING_STATUS.PAYMENT_REVIEW && (
          <div className="dz-faint" style={{ textAlign: 'center', padding: '4px 0 8px' }}>
            تراجع إدارة درسي الإيصال وتؤكد الاستلام — يصلك إشعار فور التأكيد.
          </div>
        )}
        {[BOOKING_STATUS.PENDING_APPROVAL, BOOKING_STATUS.AWAITING_PAYMENT, BOOKING_STATUS.CONFIRMED].includes(booking.status) && (
          <button
            type="button"
            className="dz-btn dz-btn--danger dz-btn--sm"
            style={{ width: '100%' }}
            onClick={() => (paid ? setCancelOpen(true) : cancelBooking(booking.id))}
          >
            إلغاء الحجز
          </button>
        )}
        {booking.status === BOOKING_STATUS.CONFIRMED && (
          <div className="dz-faint" style={{ textAlign: 'center' }}>
            {ifCancelled.late
              ? `الإلغاء الآن متأخر — تُخصم رسوم إلغاء ${percent(settings.cancellationFee)}`
              : `الإلغاء المجاني متاح حتى ${settings.freeCancellationHours} ساعة قبل الموعد`}
          </div>
        )}
      </div>

      <Sheet open={cancelOpen} onClose={() => setCancelOpen(false)} title="تأكيد الإلغاء">
        <div className="dz-stack">
          <div className="dz-card dz-card--soft">
            <div className="dz-kv"><span className="dz-kv__k">المبلغ المدفوع</span><span className="dz-kv__v">{money(booking.price)}</span></div>
            {ifCancelled.retained > 0 && (
              <div className="dz-kv">
                <span className="dz-kv__k">رسوم إلغاء متأخر ({percent(settings.cancellationFee)})</span>
                <span className="dz-kv__v">- {money(ifCancelled.retained)}</span>
              </div>
            )}
            <div className="dz-kv dz-total"><span className="dz-kv__k">يُسترجع لك</span><span className="dz-kv__v">{money(ifCancelled.refund)}</span></div>
          </div>

          <Banner tone={ifCancelled.late ? 'danger' : 'primary'}>
            {ifCancelled.late
              ? `بقي أقل من ${settings.freeCancellationHours} ساعة على الموعد، لذلك تُخصم رسوم الإلغاء وتذهب للمدرس ودرسي.`
              : 'الإلغاء ضمن الوقت المسموح — يُسترجع كامل المبلغ.'}
          </Banner>

          <button
            type="button"
            className="dz-btn dz-btn--danger"
            onClick={() => { cancelBooking(booking.id); setCancelOpen(false); }}
          >
            تأكيد الإلغاء
          </button>
          <button type="button" className="dz-btn dz-btn--ghost dz-btn--sm" style={{ width: '100%' }} onClick={() => setCancelOpen(false)}>
            تراجع
          </button>
        </div>
      </Sheet>

      <Sheet open={payOpen} onClose={() => setPayOpen(false)} title="إتمام الدفع">
        <Banner tone="accent">
          التحويل يتم لحساب منصة درسي، ويُحوَّل للمدرس بعد إتمام الحصة (نظام ضمان).
        </Banner>

        <div className="dz-card dz-card--soft" style={{ margin: '14px 0' }}>
          <div className="dz-kv"><span className="dz-kv__k">المصرف</span><span className="dz-kv__v">{PLATFORM_BANK.bankName}</span></div>
          <div className="dz-kv"><span className="dz-kv__k">اسم الحساب</span><span className="dz-kv__v">{PLATFORM_BANK.accountName}</span></div>
          <div className="dz-kv"><span className="dz-kv__k">رقم الحساب</span><span className="dz-kv__v">{PLATFORM_BANK.accountNumber}</span></div>
          <div className="dz-kv dz-total"><span className="dz-kv__k">المبلغ المطلوب</span><span className="dz-kv__v">{money(booking.price)}</span></div>
        </div>

        <Field label="أرفق صورة إيصال التحويل">
          <label className="dz-btn dz-btn--ghost" style={{ cursor: 'pointer' }}>
            <IconUpload size={18} />
            {receipt || 'اختر صورة الإيصال'}
            <input
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={(e) => setReceipt(e.target.files?.[0]?.name || 'receipt.jpg')}
            />
          </label>
        </Field>

        <button
          type="button"
          className="dz-btn dz-btn--primary"
          style={{ marginTop: 14 }}
          disabled={!receipt}
          onClick={() => {
            submitPayment(booking.id, receipt);
            setPayOpen(false);
          }}
        >
          إرسال الإيصال للمراجعة
        </button>
      </Sheet>

      <Sheet open={reviewOpen} onClose={() => setReviewOpen(false)} title="تقييم المدرس">
        <div className="dz-row" style={{ justifyContent: 'center', gap: 6, marginBottom: 14 }}>
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              aria-label={`${n} نجوم`}
              style={{ background: 'none', border: 'none', padding: 4 }}
              onClick={() => setStars(n)}
            >
              <IconStar size={30} filled={n <= stars} />
            </button>
          ))}
        </div>
        <Field label="تعليقك (اختياري)">
          <textarea className="dz-textarea" value={reviewText} onChange={(e) => setReviewText(e.target.value)} />
        </Field>
        <button
          type="button"
          className="dz-btn dz-btn--primary"
          style={{ marginTop: 14 }}
          onClick={() => {
            addReview(booking.id, stars, reviewText);
            setReviewOpen(false);
          }}
        >
          إرسال التقييم
        </button>
      </Sheet>
    </div>
  );
}
