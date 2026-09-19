import React, { useState } from 'react';
import { TopBar, BottomNav, EmptyState, formatDate, formatTime, money } from '../components/common';
import { IconVideo, IconPin } from '../components/Icons';
import { subjectById } from '../data/catalog';
import { useApp, BOOKING_STATUS, STATUS_LABEL, STATUS_TONE } from '../state/AppContext';

const ME = 't1';

const UPCOMING = [
  BOOKING_STATUS.AWAITING_PAYMENT,
  BOOKING_STATUS.PAYMENT_REVIEW,
  BOOKING_STATUS.CONFIRMED,
];

const TABS = [
  { id: 'upcoming', label: 'القادمة' },
  { id: 'past', label: 'السابقة' },
];

export default function TeacherSchedule() {
  const { bookings, completeBooking } = useApp();
  const [tab, setTab] = useState('upcoming');

  const mine = bookings.filter((b) => b.teacherId === ME);
  const list = tab === 'upcoming'
    ? mine.filter((b) => UPCOMING.includes(b.status))
    : mine.filter((b) => [BOOKING_STATUS.COMPLETED, BOOKING_STATUS.CANCELLED, BOOKING_STATUS.REJECTED].includes(b.status));

  const grouped = list.reduce((acc, b) => {
    (acc[b.date] = acc[b.date] || []).push(b);
    return acc;
  }, {});

  return (
    <div className="dz-screen">
      <TopBar title="جدولي" subtitle={`${mine.filter((b) => UPCOMING.includes(b.status)).length} حصة قادمة`} />

      <div className="dz-tabs">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            className={`dz-chip${tab === t.id ? ' dz-chip--active' : ''}`}
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="dz-body" style={{ paddingTop: 4 }}>
        {list.length === 0 ? (
          <EmptyState
            title={tab === 'upcoming' ? 'لا توجد حصص قادمة' : 'لا توجد حصص سابقة'}
            body={tab === 'upcoming' ? 'الطلبات التي تقبلها تظهر هنا بعد دفع الطالب.' : ''}
          />
        ) : (
          <div className="dz-stack">
            {Object.keys(grouped).sort().map((date) => (
              <section key={date}>
                <div className="dz-faint" style={{ fontWeight: 700, marginBottom: 6 }}>{formatDate(date)}</div>
                <div className="dz-card">
                  {grouped[date].map((b) => (
                    <div key={b.id} className="dz-listrow" style={{ alignItems: 'flex-start' }}>
                      <span className="dz-grow">
                        <span style={{ fontSize: 13, fontWeight: 700, display: 'block' }}>
                          {b.learnerName} — {subjectById(b.subjectId)?.name}
                        </span>
                        <span className="dz-row" style={{ gap: 6, marginTop: 5, flexWrap: 'wrap' }}>
                          <span className={`dz-chip dz-chip--sm dz-chip--${STATUS_TONE[b.status]}`}>{STATUS_LABEL[b.status]}</span>
                          <span className="dz-chip dz-chip--sm">
                            {b.mode === 'online' ? <IconVideo size={11} /> : <IconPin size={11} />}
                            {formatTime(b.time)}
                          </span>
                          <span className="dz-chip dz-chip--sm">{money(b.price)}</span>
                        </span>
                        {b.status === BOOKING_STATUS.CONFIRMED && (
                          <button
                            type="button"
                            className="dz-btn dz-btn--ghost dz-btn--sm"
                            style={{ marginTop: 8 }}
                            onClick={() => completeBooking(b.id)}
                          >
                            تعليم الحصة كمكتملة
                          </button>
                        )}
                      </span>
                    </div>
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </div>

      <BottomNav active="schedule" />
    </div>
  );
}
