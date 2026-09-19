import React, { useState } from 'react';
import { useHistory } from 'react-router-dom';
import { TopBar, Banner, EmptyState, formatTime } from '../components/common';
import { IconCheck, IconClock } from '../components/Icons';
import { useApp, BOOKING_STATUS } from '../state/AppContext';

const ME = 't1';

const DAYS = [
  { index: 0, name: 'الأحد' },
  { index: 1, name: 'الإثنين' },
  { index: 2, name: 'الثلاثاء' },
  { index: 3, name: 'الأربعاء' },
  { index: 4, name: 'الخميس' },
  { index: 5, name: 'الجمعة' },
  { index: 6, name: 'السبت' },
];

// The hours a private lesson realistically falls in: after school until late evening.
const HOURS = ['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00',
  '15:00', '16:00', '17:00', '18:00', '19:00', '20:00', '21:00'];

const BOOKED = [
  BOOKING_STATUS.AWAITING_PAYMENT,
  BOOKING_STATUS.PAYMENT_REVIEW,
  BOOKING_STATUS.CONFIRMED,
];

export default function TeacherAvailability() {
  const history = useHistory();
  const { base, teacherFor, setTeacherProfile, bookings } = useApp();

  const teacher = teacherFor(ME);
  const [draft, setDraft] = useState(() => {
    const current = teacher.availability || {};
    // Normalise into a plain object with an array per weekday.
    return DAYS.reduce((acc, d) => ({ ...acc, [d.index]: [...(current[d.index] || [])] }), {});
  });
  const [saved, setSaved] = useState(false);

  const totalHours = Object.values(draft).reduce((sum, list) => sum + list.length, 0);

  // A slot the teacher already sold cannot simply be withdrawn.
  const committed = bookings.filter((b) => b.teacherId === ME && BOOKED.includes(b.status));
  const isCommitted = (weekday, time) => committed.some(
    (b) => new Date(`${b.date}T00:00:00`).getDay() === weekday && b.time === time,
  );

  const toggle = (weekday, time) => {
    if (isCommitted(weekday, time)) return;
    setSaved(false);
    setDraft((d) => {
      const list = d[weekday];
      return {
        ...d,
        [weekday]: list.includes(time)
          ? list.filter((t) => t !== time)
          : [...list, time].sort(),
      };
    });
  };

  const copyToAll = (weekday) => {
    setSaved(false);
    setDraft((d) => DAYS.reduce((acc, day) => ({ ...acc, [day.index]: [...d[weekday]] }), {}));
  };

  const clearDay = (weekday) => {
    setSaved(false);
    setDraft((d) => ({ ...d, [weekday]: d[weekday].filter((t) => isCommitted(weekday, t)) }));
  };

  const save = () => {
    // Drop empty days so the stored template stays small and readable.
    const cleaned = Object.entries(draft).reduce((acc, [day, list]) => (
      list.length ? { ...acc, [day]: list } : acc
    ), {});
    setTeacherProfile(ME, { availability: cleaned });
    setSaved(true);
  };

  return (
    <div className="dz-screen">
      <TopBar
        back
        title="أوقات توفري"
        subtitle={`${totalHours} ساعة في الأسبوع`}
        onBack={() => history.push(`${base}/home`)}
      />

      <div className="dz-body">
        {saved && (
          <div style={{ marginBottom: 14 }}>
            <Banner tone="success" icon={<IconCheck size={18} />}>
              حُفظت أوقاتك — تظهر للطلاب فورًا في صفحة الحجز.
            </Banner>
          </div>
        )}

        <div style={{ marginBottom: 16 }}>
          <Banner tone="accent" icon={<IconClock size={18} />}>
            اختر الساعات التي تقبل التدريس فيها. لن يستطيع أي طالب حجز موعد خارجها.
            الساعات المحجوزة فعلًا لا يمكن سحبها — أنت ملتزم بها.
          </Banner>
        </div>

        {totalHours === 0 && (
          <div style={{ marginBottom: 16 }}>
            <EmptyState
              title="لم تحدد أي وقت بعد"
              body="بدون أوقات متاحة لن يظهر لك أي موعد قابل للحجز، ولن تصلك طلبات."
            />
          </div>
        )}

        <div className="dz-stack">
          {DAYS.map(({ index, name }) => {
            const chosen = draft[index] || [];
            return (
              <section key={index} className="dz-card">
                <div className="dz-row" style={{ marginBottom: 10 }}>
                  <span className="dz-grow">
                    <span style={{ fontWeight: 800, fontSize: 14 }}>{name}</span>
                    <span className="dz-muted" style={{ marginInlineStart: 8 }}>
                      {chosen.length ? `${chosen.length} ساعة` : 'مغلق'}
                    </span>
                  </span>
                  {chosen.length > 0 && (
                    <>
                      <button type="button" className="dz-faint" style={{ background: 'none', border: 'none', fontWeight: 700 }} onClick={() => copyToAll(index)}>
                        نسخ للكل
                      </button>
                      <button type="button" className="dz-faint" style={{ background: 'none', border: 'none', fontWeight: 700 }} onClick={() => clearDay(index)}>
                        مسح
                      </button>
                    </>
                  )}
                </div>

                <div className="dz-chiprow" style={{ flexWrap: 'wrap', gap: 6 }}>
                  {HOURS.map((time) => {
                    const on = chosen.includes(time);
                    const locked = isCommitted(index, time);
                    return (
                      <button
                        key={time}
                        type="button"
                        className={`dz-chip dz-chip--sm${on ? ' dz-chip--active' : ''}`}
                        style={locked ? { opacity: 0.75, cursor: 'not-allowed' } : undefined}
                        onClick={() => toggle(index, time)}
                        aria-pressed={on}
                        aria-label={`${name} ${formatTime(time)}${locked ? ' — محجوز' : ''}`}
                      >
                        {formatTime(time)}
                        {locked && ' ●'}
                      </button>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>
      </div>

      <div className="dz-footer-cta">
        <button type="button" className="dz-btn dz-btn--primary" onClick={save}>
          حفظ الأوقات
        </button>
        <div className="dz-faint" style={{ textAlign: 'center' }}>
          التعديل يسري على الحجوزات القادمة — المؤكدة تبقى كما هي.
        </div>
      </div>
    </div>
  );
}
