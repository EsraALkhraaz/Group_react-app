import React, { useState } from 'react';
import { useHistory } from 'react-router-dom';
import { BottomNav, Banner, Sheet, Field, money, formatDate, formatTime } from '../components/common';
import { IconVideo, IconPin, IconUsers, IconWallet, IconForward, IconBell } from '../components/Icons';
import { subjectById, COMMISSION_RATE, RATE_LIMITS } from '../data/catalog';
import { useApp, BOOKING_STATUS, STATUS_LABEL, STATUS_TONE } from '../state/AppContext';
import mark from '../assets/darsy-mark.png';

// The prototype signs the teacher in as Ahmed.
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

  const entered = Object.values(draft).filter((v) => v !== '' && v !== null).map(Number);
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
        {pricing.online && <RateInput label="حصة أونلاين — فردية" value={draft.onlineIndividual} onChange={set('onlineIndividual')} />}
        {pricing.online?.group && <RateInput label="حصة أونلاين — جماعية (للطالب)" value={draft.onlineGroup} onChange={set('onlineGroup')} />}
        {pricing.f2f && <RateInput label="حصة حضورية — فردية" value={draft.f2fIndividual} onChange={set('f2fIndividual')} />}
        {pricing.f2f?.group && <RateInput label="حصة حضورية — جماعية (للطالب)" value={draft.f2fGroup} onChange={set('f2fGroup')} />}

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

export default function TeacherHome() {
  const history = useHistory();
  const { base, bookings, notifications, teacherFor, setTeacherRates } = useApp();
  const [ratesOpen, setRatesOpen] = useState(false);

  const teacher = teacherFor(ME);
  const pricing = teacher.pricing;
  const unread = notifications.filter((n) => n.unread).length;

  const mine = bookings.filter((b) => b.teacherId === ME);
  const requests = mine.filter((b) => b.status === BOOKING_STATUS.PENDING_APPROVAL);
  const upcoming = mine.filter((b) => [BOOKING_STATUS.CONFIRMED, BOOKING_STATUS.AWAITING_PAYMENT, BOOKING_STATUS.PAYMENT_REVIEW].includes(b.status));
  const completed = mine.filter((b) => b.status === BOOKING_STATUS.COMPLETED);

  const gross = [...upcoming, ...completed].reduce((sum, b) => sum + b.price, 0);
  const commission = Math.round(gross * COMMISSION_RATE);
  const net = gross - commission;

  const next = [...upcoming].sort((a, b) => (a.date < b.date ? -1 : 1))[0];

  return (
    <div className="dz-screen">
      <header className="dz-topbar">
        <img src={mark} alt="درسي" style={{ width: 34, height: 34, objectFit: 'contain' }} />
        <div className="dz-grow">
          <h1 className="dz-topbar__title">أهلاً، {teacher.name.split(' ')[0]}</h1>
          <div className="dz-topbar__sub">لوحة المدرس</div>
        </div>
        <button type="button" className="dz-iconbtn" aria-label="الإشعارات" onClick={() => history.push(`${base}/notifications`)}>
          <IconBell size={17} />
          {unread > 0 && <span className="dz-iconbtn__dot" />}
        </button>
      </header>

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

        {requests.length > 0 && (
          <button
            type="button"
            className="dz-banner dz-banner--accent"
            style={{ width: '100%', border: 'none', marginBottom: 16, textAlign: 'start' }}
            onClick={() => history.push(`${base}/requests`)}
          >
            <span className="dz-grow">{requests.length} طلب حجز ينتظر ردك</span>
            <IconForward size={16} />
          </button>
        )}

        {next && (
          <section style={{ marginBottom: 20 }}>
            <div className="dz-section-title">
              <span>حصتي القادمة</span>
              <button type="button" className="dz-faint" style={{ background: 'none', border: 'none' }} onClick={() => history.push(`${base}/schedule`)}>
                الجدول كامل
              </button>
            </div>
            <div className="dz-card dz-card--soft">
              <div style={{ fontWeight: 700, fontSize: 14 }}>
                {next.learnerName} — {subjectById(next.subjectId)?.name}
              </div>
              <div className="dz-muted" style={{ marginTop: 3 }}>
                {formatDate(next.date)} · {formatTime(next.time)}
              </div>
              <div className="dz-row" style={{ gap: 6, marginTop: 8 }}>
                <span className={`dz-chip dz-chip--sm dz-chip--${STATUS_TONE[next.status]}`}>{STATUS_LABEL[next.status]}</span>
                <span className="dz-chip dz-chip--sm">
                  {next.mode === 'online' ? <IconVideo size={11} /> : <IconPin size={11} />}
                  {next.mode === 'online' ? 'أونلاين' : 'حضوري'}
                </span>
              </div>
            </div>
          </section>
        )}

        <section style={{ marginBottom: 20 }}>
          <div className="dz-section-title">
            <span>أسعاري</span>
            <button type="button" className="dz-btn dz-btn--ghost dz-btn--sm" onClick={() => setRatesOpen(true)}>
              تعديل الأسعار
            </button>
          </div>
          <div className="dz-card">
            {pricing.online && (
              <>
                <RateRow icon={<IconVideo size={15} />} label="أونلاين — فردية" value={pricing.online.individual} />
                {pricing.online.group && (
                  <RateRow icon={<IconUsers size={15} />} label="أونلاين — جماعية" value={pricing.online.group.price} />
                )}
              </>
            )}
            {pricing.f2f && (
              <>
                <RateRow icon={<IconPin size={15} />} label="حضوري — فردية" value={pricing.f2f.individual} />
                {pricing.f2f.group && (
                  <RateRow icon={<IconUsers size={15} />} label="حضوري — جماعية" value={pricing.f2f.group.price} />
                )}
              </>
            )}
            <div className="dz-faint" style={{ marginTop: 8 }}>
              أنت من يحدد سعر ساعتك، ويظهر للطلاب في نتائج البحث وفي ملفك.
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

      <BottomNav active="home" />
    </div>
  );
}
