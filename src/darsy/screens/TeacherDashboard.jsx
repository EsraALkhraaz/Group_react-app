import React, { useState } from 'react';
import { useHistory } from 'react-router-dom';
import { TopBar, Banner, Sheet, Field, EmptyState, money, formatDate, formatTime } from '../components/common';
import { IconCheck, IconClose, IconVideo, IconPin, IconWallet, IconUsers } from '../components/Icons';
import { subjectById, COMMISSION_RATE, RATE_LIMITS } from '../data/catalog';
import { useApp, BOOKING_STATUS, STATUS_LABEL, STATUS_TONE } from '../state/AppContext';

// The prototype puts the signed-in teacher in Ahmed's seat.
const ME = 't1';

function RateRow({ icon, label, value }) {
  return (
    <div className="dz-row" style={{ padding: '10px 0', borderBottom: '1px solid var(--c-line)' }}>
      <span className="dz-avatar dz-avatar--sm" style={{ width: 30, height: 30, background: 'var(--c-soft)', color: 'var(--c-primary-text)' }}>
        {icon}
      </span>
      <span className="dz-grow" style={{ fontSize: 13, fontWeight: 600 }}>{label}</span>
      <span className="dz-price">{money(value)}<small>للساعة</small></span>
    </div>
  );
}

function RateInput({ label, value, onChange }) {
  return (
    <Field label={label} hint={`بين ${RATE_LIMITS.min} و${RATE_LIMITS.max} د.ل`}>
      <input
        className="dz-input"
        type="number"
        inputMode="numeric"
        min={RATE_LIMITS.min}
        max={RATE_LIMITS.max}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </Field>
  );
}

function RatesSheet({ open, onClose, pricing, onSave }) {
  const [draft, setDraft] = useState({});

  // Seed the form from the teacher's live rates each time the sheet opens.
  React.useEffect(() => {
    if (!open) return;
    setDraft({
      onlineIndividual: pricing.online?.individual ?? '',
      onlineGroup: pricing.online?.group?.price ?? '',
      f2fIndividual: pricing.f2f?.individual ?? '',
      f2fGroup: pricing.f2f?.group?.price ?? '',
    });
  }, [open, pricing]);

  const set = (key) => (v) => setDraft((d) => ({ ...d, [key]: v }));

  const entered = Object.entries(draft)
    .filter(([, v]) => v !== '' && v !== null)
    .map(([, v]) => Number(v));
  const valid = entered.length > 0
    && entered.every((n) => Number.isFinite(n) && n >= RATE_LIMITS.min && n <= RATE_LIMITS.max);

  const save = () => {
    const num = (v) => (v === '' || v === null ? undefined : Number(v));
    onSave({
      online: { individual: num(draft.onlineIndividual), group: num(draft.onlineGroup) },
      f2f: { individual: num(draft.f2fIndividual), group: num(draft.f2fGroup) },
    });
  };

  return (
    <Sheet open={open} onClose={onClose} title="تعديل أسعاري">
      <div className="dz-stack">
        {pricing.online && (
          <RateInput label="حصة أونلاين — فردية" value={draft.onlineIndividual} onChange={set('onlineIndividual')} />
        )}
        {pricing.online?.group && (
          <RateInput label="حصة أونلاين — جماعية (للطالب)" value={draft.onlineGroup} onChange={set('onlineGroup')} />
        )}
        {pricing.f2f && (
          <RateInput label="حصة حضورية — فردية" value={draft.f2fIndividual} onChange={set('f2fIndividual')} />
        )}
        {pricing.f2f?.group && (
          <RateInput label="حصة حضورية — جماعية (للطالب)" value={draft.f2fGroup} onChange={set('f2fGroup')} />
        )}

        <Banner tone="accent">
          تسري الأسعار الجديدة على الحجوزات القادمة فقط — الحجوزات المؤكدة تبقى بسعرها الأصلي.
        </Banner>

        <button type="button" className="dz-btn dz-btn--primary" disabled={!valid} onClick={save}>
          حفظ الأسعار
        </button>
      </div>
    </Sheet>
  );
}

export default function TeacherDashboard() {
  const history = useHistory();
  const { bookings, approveBooking, rejectBooking, setRole, teacherFor, setTeacherRates } = useApp();
  const [rejectId, setRejectId] = useState(null);
  const [reason, setReason] = useState('');
  const [ratesOpen, setRatesOpen] = useState(false);

  const teacher = teacherFor(ME);
  const pricing = teacher.pricing;
  const mine = bookings.filter((b) => b.teacherId === ME);
  const requests = mine.filter((b) => b.status === BOOKING_STATUS.PENDING_APPROVAL);
  const upcoming = mine.filter((b) => [BOOKING_STATUS.CONFIRMED, BOOKING_STATUS.AWAITING_PAYMENT, BOOKING_STATUS.PAYMENT_REVIEW].includes(b.status));
  const completed = mine.filter((b) => b.status === BOOKING_STATUS.COMPLETED);

  const gross = [...upcoming, ...completed].reduce((sum, b) => sum + b.price, 0);
  const commission = Math.round(gross * COMMISSION_RATE);
  const net = gross - commission;

  return (
    <div className="dz-screen">
      <TopBar
        title="لوحة المدرس"
        subtitle={teacher.name}
        right={
          <button
            type="button"
            className="dz-btn dz-btn--ghost dz-btn--sm"
            onClick={() => { setRole('parent'); history.push('/home'); }}
          >
            واجهة الطالب
          </button>
        }
      />

      <div className="dz-body">
        <div className="dz-stats" style={{ marginBottom: 16 }}>
          <div className="dz-stats__cell">
            <div className="dz-stats__num">{requests.length}</div>
            <div className="dz-stats__lbl">طلب جديد</div>
          </div>
          <div className="dz-stats__cell">
            <div className="dz-stats__num">{upcoming.length}</div>
            <div className="dz-stats__lbl">حصة قادمة</div>
          </div>
          <div className="dz-stats__cell">
            <div className="dz-stats__num">{teacher.rating.toFixed(1)}</div>
            <div className="dz-stats__lbl">التقييم</div>
          </div>
        </div>

        <section style={{ marginBottom: 20 }}>
          <div className="dz-section-title">
            <span>ملفي الشخصي</span>
            <button
              type="button"
              className="dz-btn dz-btn--ghost dz-btn--sm"
              onClick={() => history.push('/teacher/edit')}
            >
              تعديل الملف
            </button>
          </div>
          <div className="dz-card">
            <div style={{ fontWeight: 800, fontSize: 15 }}>{teacher.name}</div>
            <div className="dz-muted" style={{ marginTop: 6, lineHeight: 1.7 }}>
              {teacher.bio.length > 120 ? `${teacher.bio.slice(0, 120)}…` : teacher.bio}
            </div>
            <div className="dz-chiprow" style={{ marginTop: 10, flexWrap: 'wrap' }}>
              {teacher.subjects.map((s) => (
                <span key={s} className="dz-chip dz-chip--sm dz-chip--primary">{subjectById(s)?.name}</span>
              ))}
              <span className="dz-chip dz-chip--sm dz-chip--accent">{teacher.grades.length} صفوف</span>
              <span className="dz-chip dz-chip--sm">{teacher.qualifications.length} مؤهلات</span>
            </div>
          </div>
        </section>

        <section style={{ marginBottom: 20 }}>
          <div className="dz-section-title"><span>طلبات بانتظار ردك</span></div>
          {requests.length === 0 ? (
            <EmptyState title="لا توجد طلبات جديدة" body="ستظهر هنا طلبات الحجز فور وصولها." />
          ) : (
            <div className="dz-stack dz-stack--sm">
              {requests.map((b) => (
                <div key={b.id} className="dz-card">
                  <div className="dz-row" style={{ marginBottom: 10 }}>
                    <span className="dz-avatar dz-avatar--sm" style={{ background: 'var(--c-soft)', color: 'var(--c-primary-text)' }}>
                      {b.learnerName.charAt(0)}
                    </span>
                    <span className="dz-grow">
                      <span style={{ fontWeight: 700, fontSize: 14, display: 'block' }}>
                        {b.learnerName} — {subjectById(b.subjectId)?.name}
                      </span>
                      <span className="dz-muted" style={{ display: 'block', marginTop: 2 }}>
                        {formatDate(b.date)} · {formatTime(b.time)}
                      </span>
                    </span>
                    <span className="dz-price">{money(b.price)}</span>
                  </div>

                  <div className="dz-row" style={{ gap: 6, marginBottom: 10, flexWrap: 'wrap' }}>
                    <span className="dz-chip dz-chip--sm dz-chip--primary">
                      {b.mode === 'online' ? <IconVideo size={11} /> : <IconPin size={11} />}
                      {b.mode === 'online' ? 'أونلاين' : 'حضوري'}
                    </span>
                    <span className="dz-chip dz-chip--sm dz-chip--accent">
                      {b.sessionType === 'group' ? 'جماعية' : 'فردية'}
                    </span>
                  </div>

                  {b.note && <div className="dz-muted" style={{ marginBottom: 12 }}>ملاحظة الطالب: {b.note}</div>}

                  <div className="dz-row" style={{ gap: 8 }}>
                    <button type="button" className="dz-btn dz-btn--success dz-btn--sm" style={{ flex: 1 }} onClick={() => approveBooking(b.id)}>
                      <IconCheck size={15} /> قبول
                    </button>
                    <button type="button" className="dz-btn dz-btn--danger dz-btn--sm" style={{ flex: 1 }} onClick={() => setRejectId(b.id)}>
                      <IconClose size={15} /> اعتذار
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section style={{ marginBottom: 20 }}>
          <div className="dz-section-title"><span>حصصي القادمة</span></div>
          {upcoming.length === 0 ? (
            <EmptyState title="لا توجد حصص قادمة" body="" />
          ) : (
            <div className="dz-card">
              {upcoming.map((b) => (
                <div key={b.id} className="dz-listrow">
                  <span className="dz-grow">
                    <span style={{ fontSize: 13, fontWeight: 700, display: 'block' }}>
                      {b.learnerName} — {subjectById(b.subjectId)?.name}
                    </span>
                    <span className="dz-muted" style={{ display: 'block', marginTop: 2 }}>
                      {formatDate(b.date)} · {formatTime(b.time)}
                    </span>
                  </span>
                  <span className={`dz-chip dz-chip--sm dz-chip--${STATUS_TONE[b.status]}`}>{STATUS_LABEL[b.status]}</span>
                </div>
              ))}
            </div>
          )}
        </section>

        <section>
          <div className="dz-section-title">
            <span>أسعاري</span>
            <button
              type="button"
              className="dz-btn dz-btn--ghost dz-btn--sm"
              onClick={() => setRatesOpen(true)}
            >
              تعديل الأسعار
            </button>
          </div>
          <div className="dz-card" style={{ marginBottom: 20 }}>
            {pricing.online ? (
              <>
                <RateRow icon={<IconVideo size={15} />} label="أونلاين — فردية" value={pricing.online.individual} />
                {pricing.online.group && (
                  <RateRow icon={<IconUsers size={15} />} label="أونلاين — جماعية" value={pricing.online.group.price} />
                )}
              </>
            ) : null}
            {pricing.f2f ? (
              <>
                <RateRow icon={<IconPin size={15} />} label="حضوري — فردية" value={pricing.f2f.individual} />
                {pricing.f2f.group && (
                  <RateRow icon={<IconUsers size={15} />} label="حضوري — جماعية" value={pricing.f2f.group.price} />
                )}
              </>
            ) : null}
            <div className="dz-faint" style={{ marginTop: 8 }}>
              أنت من يحدد سعر ساعتك. يظهر السعر للطلاب في نتائج البحث وفي ملفك، وتُخصم منه عمولة المنصة.
            </div>
          </div>
        </section>

        <section>
          <div className="dz-section-title"><span>أرباحي</span></div>
          <div className="dz-card">
            <div className="dz-row" style={{ marginBottom: 10 }}>
              <IconWallet size={18} />
              <span className="dz-h3">ملخص مالي</span>
            </div>
            <div className="dz-kv"><span className="dz-kv__k">إجمالي الحجوزات</span><span className="dz-kv__v">{money(gross)}</span></div>
            <div className="dz-kv"><span className="dz-kv__k">عمولة المنصة ({Math.round(COMMISSION_RATE * 100)}%)</span><span className="dz-kv__v">- {money(commission)}</span></div>
            <div className="dz-kv dz-total"><span className="dz-kv__k">صافي المستحق</span><span className="dz-kv__v">{money(net)}</span></div>
            <div style={{ marginTop: 12 }}>
              <Banner tone="primary">تُحوَّل المستحقات بعد إتمام الحصص وفق دورة الصرف المعتمدة.</Banner>
            </div>
          </div>
        </section>
      </div>

      <RatesSheet
        open={ratesOpen}
        onClose={() => setRatesOpen(false)}
        pricing={pricing}
        onSave={(rates) => {
          setTeacherRates(ME, rates);
          setRatesOpen(false);
        }}
      />

      <Sheet open={Boolean(rejectId)} onClose={() => setRejectId(null)} title="الاعتذار عن الطلب">
        <div className="dz-muted" style={{ marginBottom: 12 }}>
          لن يُخصم أي مبلغ من الطالب — سيصله إشعار بالاعتذار.
        </div>
        <Field label="السبب (اختياري)">
          <textarea className="dz-textarea" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="مثال: الموعد لم يعد متاحًا" />
        </Field>
        <button
          type="button"
          className="dz-btn dz-btn--danger"
          style={{ marginTop: 14 }}
          onClick={() => {
            rejectBooking(rejectId, reason);
            setReason('');
            setRejectId(null);
          }}
        >
          إرسال الاعتذار
        </button>
      </Sheet>
    </div>
  );
}
