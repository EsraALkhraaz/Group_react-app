import React, { useMemo, useState } from 'react';
import { useHistory, useParams } from 'react-router-dom';
import { TopBar, Avatar, Banner, Field, money, formatDate, formatTime, EmptyState } from '../components/common';
import { IconVideo, IconPin, IconPerson, IconUsers, IconCheck, IconClock } from '../components/Icons';
import { teacherById } from '../data/teachers';
import { subjectById, gradeById, COMMISSION_RATE } from '../data/catalog';
import { monthMatrix, toISODate, slotsForDate, hasAnySlot } from '../lib/availability';
import { useApp } from '../state/AppContext';

const STEPS = ['نوع الجلسة', 'نمط الحصة', 'التاريخ', 'الوقت'];
const DOW = ['ح', 'ن', 'ث', 'ر', 'خ', 'ج', 'س'];
const MONTHS = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];

export default function Booking() {
  const { id } = useParams();
  const history = useHistory();
  const teacher = teacherById(id);
  const { bookings, createBooking, role, children, profile, pricingFor } = useApp();

  const [step, setStep] = useState(0);
  const [sessionType, setSessionType] = useState('');
  const [mode, setMode] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [subjectId, setSubjectId] = useState(teacher ? teacher.subjects[0] : '');
  const [learner, setLearner] = useState(role === 'parent' ? children[0]?.name : profile.name);
  const [note, setNote] = useState('');
  const [cursor, setCursor] = useState(() => new Date());

  const cells = useMemo(() => monthMatrix(cursor.getFullYear(), cursor.getMonth()), [cursor]);
  const slots = useMemo(
    () => (teacher && date ? slotsForDate(teacher, date, bookings, sessionType) : []),
    [teacher, date, bookings, sessionType],
  );

  if (!teacher) return <EmptyState title="المدرس غير موجود" body="" />;

  const livePricing = pricingFor(teacher);
  const pricing = livePricing[mode] || null;
  const groupConfig = pricing?.group;
  const price = sessionType === 'group' ? groupConfig?.price : pricing?.individual;

  const modesAvailable = [
    livePricing.online && { id: 'online', label: 'أونلاين', icon: <IconVideo size={18} />, hint: 'رابط الجلسة يصلك بعد تأكيد الحجز' },
    livePricing.f2f && { id: 'f2f', label: 'حضوري', icon: <IconPin size={18} />, hint: `في ${teacher.areas.join('، ') || 'مناطق المدرس'}` },
  ].filter(Boolean);

  const typeAvailableIn = (type) =>
    Boolean(livePricing.online?.[type === 'group' ? 'group' : 'individual'] || livePricing.f2f?.[type === 'group' ? 'group' : 'individual']);

  const canContinue = [
    Boolean(sessionType),
    Boolean(mode),
    Boolean(date),
    Boolean(time),
  ][step];

  const goNext = () => {
    if (step < 3) {
      setStep(step + 1);
      return;
    }
    const bookingId = createBooking({
      teacherId: teacher.id,
      learnerName: learner,
      subjectId,
      gradeId: role === 'parent' ? children.find((c) => c.name === learner)?.gradeId : 'uni',
      sessionType,
      mode,
      date,
      time,
      price,
      note,
    });
    history.replace(`/booking/${bookingId}?new=1`);
  };

  const goBack = () => {
    if (step === 0) history.goBack();
    else setStep(step - 1);
  };

  const commission = price ? Math.round(price * COMMISSION_RATE) : 0;

  return (
    <div className="dz-screen">
      <TopBar back onBack={goBack} title="حجز جلسة" subtitle={teacher.name} />

      <div className="dz-body" style={{ paddingTop: 4 }}>
        <div className="dz-steps" style={{ marginBottom: 16 }}>
          {STEPS.map((label, i) => (
            <div key={label} className="dz-step">
              <div className={`dz-step__bullet${i < step ? ' dz-step__bullet--done' : i === step ? ' dz-step__bullet--current' : ''}`}>
                {i < step ? <IconCheck size={14} /> : i + 1}
              </div>
              <div className="dz-step__label">{label}</div>
            </div>
          ))}
        </div>

        {step === 0 && (
          <div className="dz-stack">
            <div className="dz-h3">اختر نوع الجلسة</div>
            {[
              { id: 'individual', label: 'جلسة فردية', icon: <IconPerson size={20} />, hint: 'أنت والمدرس فقط' },
              { id: 'group', label: 'جلسة جماعية', icon: <IconUsers size={20} />, hint: 'مشاركة الحصة مع طلاب آخرين بسعر أقل' },
            ].map((opt) => {
              const available = typeAvailableIn(opt.id);
              return (
                <button
                  key={opt.id}
                  type="button"
                  disabled={!available}
                  className="dz-card dz-row"
                  style={{
                    width: '100%',
                    textAlign: 'start',
                    borderColor: sessionType === opt.id ? 'var(--c-primary)' : 'var(--c-line)',
                    background: sessionType === opt.id ? 'var(--c-primary-bg)' : '#fff',
                    opacity: available ? 1 : 0.5,
                  }}
                  onClick={() => { setSessionType(opt.id); setMode(''); setDate(''); setTime(''); }}
                >
                  {opt.icon}
                  <span className="dz-grow">
                    <span style={{ fontWeight: 800, fontSize: 14, display: 'block' }}>{opt.label}</span>
                    <span className="dz-muted" style={{ display: 'block', marginTop: 2 }}>
                      {available ? opt.hint : 'غير مفعّلة لدى هذا المدرس'}
                    </span>
                  </span>
                  {sessionType === opt.id && <IconCheck size={18} />}
                </button>
              );
            })}

            <Field label="المادة">
              <select className="dz-select" value={subjectId} onChange={(e) => setSubjectId(e.target.value)}>
                {teacher.subjects.map((s) => (
                  <option key={s} value={s}>{subjectById(s)?.name}</option>
                ))}
              </select>
            </Field>

            {role === 'parent' && (
              <Field label="الحصة لمن؟">
                <select className="dz-select" value={learner} onChange={(e) => setLearner(e.target.value)}>
                  {children.map((c) => (
                    <option key={c.id} value={c.name}>{c.name} — {gradeById(c.gradeId)?.name}</option>
                  ))}
                </select>
              </Field>
            )}
          </div>
        )}

        {step === 1 && (
          <div className="dz-stack">
            <div className="dz-h3">اختر نمط الحصة</div>
            {modesAvailable.map((m) => {
              const supported = sessionType === 'group'
                ? Boolean(livePricing[m.id]?.group)
                : Boolean(livePricing[m.id]?.individual);
              return (
                <button
                  key={m.id}
                  type="button"
                  disabled={!supported}
                  className="dz-card dz-row"
                  style={{
                    width: '100%',
                    textAlign: 'start',
                    borderColor: mode === m.id ? 'var(--c-primary)' : 'var(--c-line)',
                    background: mode === m.id ? 'var(--c-primary-bg)' : '#fff',
                    opacity: supported ? 1 : 0.5,
                  }}
                  onClick={() => { setMode(m.id); setDate(''); setTime(''); }}
                >
                  {m.icon}
                  <span className="dz-grow">
                    <span style={{ fontWeight: 800, fontSize: 14, display: 'block' }}>{m.label}</span>
                    <span className="dz-muted" style={{ display: 'block', marginTop: 2 }}>
                      {supported ? m.hint : 'غير متاحة لهذا النوع من الجلسات'}
                    </span>
                  </span>
                  {supported && (
                    <span className="dz-price">
                      {money(sessionType === 'group' ? livePricing[m.id].group.price : livePricing[m.id].individual)}
                      <small>للساعة</small>
                    </span>
                  )}
                </button>
              );
            })}

            {sessionType === 'group' && groupConfig && (
              <Banner tone="accent">
                الجلسة الجماعية تنعقد بحد أدنى {groupConfig.minSeats} طلاب وبحد أقصى {groupConfig.maxSeats}.
              </Banner>
            )}
          </div>
        )}

        {step === 2 && (
          <div>
            <div className="dz-h3" style={{ marginBottom: 12 }}>اختر التاريخ</div>
            <div className="dz-card">
              <div className="dz-cal__head">
                <button
                  type="button"
                  className="dz-iconbtn dz-iconbtn--plain"
                  aria-label="الشهر السابق"
                  onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))}
                >
                  ‹
                </button>
                <span style={{ fontWeight: 700 }}>{MONTHS[cursor.getMonth()]} {cursor.getFullYear()}</span>
                <button
                  type="button"
                  className="dz-iconbtn dz-iconbtn--plain"
                  aria-label="الشهر القادم"
                  onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))}
                >
                  ›
                </button>
              </div>

              <div className="dz-cal__grid">
                {DOW.map((d) => (
                  <div key={d} className="dz-cal__dow">{d}</div>
                ))}
                {cells.map((cell, i) => {
                  if (!cell) return <div key={`pad${i}`} />;
                  const iso = toISODate(cell);
                  const past = iso < toISODate(new Date());
                  const free = !past && hasAnySlot(teacher, iso, bookings, sessionType);
                  return (
                    <button
                      key={iso}
                      type="button"
                      disabled={!free}
                      className={`dz-cal__day${date === iso ? ' dz-cal__day--selected' : ''}`}
                      onClick={() => { setDate(iso); setTime(''); }}
                    >
                      {cell.getDate()}
                      {free && <span className="dz-cal__dot" />}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="dz-faint" style={{ marginTop: 10, textAlign: 'center' }}>
              الأيام التي تحتها نقطة تحتوي مواعيد متاحة لدى المدرس
            </div>
          </div>
        )}

        {step === 3 && (
          <div>
            <div className="dz-h3" style={{ marginBottom: 4 }}>اختر الوقت</div>
            <div className="dz-muted" style={{ marginBottom: 14 }}>{formatDate(date)}</div>

            {slots.length === 0 ? (
              <EmptyState title="لا توجد مواعيد" body="اختر تاريخًا آخر من الخطوة السابقة." />
            ) : (
              <div className="dz-stack dz-stack--sm">
                {slots.map((s) => {
                  const disabled = s.state !== 'free';
                  const selected = time === s.time;
                  return (
                    <div key={s.time} className="dz-slotrow">
                      <span className="dz-slot__time">{formatTime(s.time)}</span>
                      <button
                        type="button"
                        disabled={disabled}
                        className={`dz-slot${selected ? ' dz-slot--selected' : ''}${disabled ? ' dz-slot--taken' : ''}`}
                        onClick={() => setTime(s.time)}
                      >
                        {selected ? <IconCheck size={16} /> : <IconClock size={16} />}
                        <span className="dz-grow" style={{ textAlign: 'start' }}>
                          {s.state === 'free' && (selected ? 'تم الاختيار' : 'متاح')}
                          {s.state === 'taken' && 'محجوز'}
                          {s.state === 'full' && 'اكتمل العدد'}
                        </span>
                        {sessionType === 'group' && s.maxSeats && (
                          <span style={{ fontSize: 11, fontWeight: 700 }}>
                            {s.seatsTaken}/{s.maxSeats} مقعد
                          </span>
                        )}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}

            {time && (
              <div className="dz-card dz-card--soft" style={{ marginTop: 16 }}>
                <div className="dz-h3" style={{ marginBottom: 10 }}>ملخص الحجز</div>
                <div className="dz-row" style={{ marginBottom: 10 }}>
                  <Avatar teacher={teacher} size="sm" />
                  <span className="dz-grow" style={{ fontSize: 13, fontWeight: 700 }}>{teacher.name}</span>
                </div>
                <div className="dz-kv"><span className="dz-kv__k">المادة</span><span className="dz-kv__v">{subjectById(subjectId)?.name}</span></div>
                <div className="dz-kv"><span className="dz-kv__k">الطالب</span><span className="dz-kv__v">{learner}</span></div>
                <div className="dz-kv"><span className="dz-kv__k">النوع</span><span className="dz-kv__v">{sessionType === 'group' ? 'جماعية' : 'فردية'} · {mode === 'online' ? 'أونلاين' : 'حضوري'}</span></div>
                <div className="dz-kv"><span className="dz-kv__k">الموعد</span><span className="dz-kv__v">{formatDate(date)} — {formatTime(time)}</span></div>
                <div className="dz-kv"><span className="dz-kv__k">المدة</span><span className="dz-kv__v">60 دقيقة</span></div>
                <div className="dz-kv dz-total"><span className="dz-kv__k">الإجمالي</span><span className="dz-kv__v">{money(price)}</span></div>
                <div className="dz-faint" style={{ marginTop: 4 }}>
                  يشمل عمولة المنصة ({commission} د.ل). الدفع بعد موافقة المدرس على الطلب.
                </div>

                <div style={{ marginTop: 12 }}>
                  <Field label="ملاحظة للمدرس (اختياري)">
                    <textarea
                      className="dz-textarea"
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      placeholder="مثال: نحتاج تركيز على الكسور قبل الاختبار"
                    />
                  </Field>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="dz-footer-cta">
        {step === 3 && (
          <Banner tone="primary">لن يتم خصم أي مبلغ الآن — يُطلب الدفع بعد موافقة المدرس.</Banner>
        )}
        <button type="button" className="dz-btn dz-btn--primary" disabled={!canContinue} onClick={goNext}>
          {step === 3 ? 'إرسال طلب الحجز' : 'متابعة'}
        </button>
      </div>
    </div>
  );
}
