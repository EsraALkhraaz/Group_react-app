import React, { useState } from 'react';
import { useHistory } from 'react-router-dom';
import { TopBar, BottomNav, Avatar, EmptyState, formatDate, formatTime, money } from '../components/common';
import TeacherCard from '../components/TeacherCard';
import { IconForward, IconVideo, IconPin } from '../components/Icons';
import { subjectById } from '../data/catalog';
import { useApp, BOOKING_STATUS, STATUS_LABEL, STATUS_TONE } from '../state/AppContext';

const TABS = [
  { id: 'upcoming', label: 'القادمة' },
  { id: 'past', label: 'السابقة' },
  { id: 'saved', label: 'المفضلة' },
];

const UPCOMING = [
  BOOKING_STATUS.PENDING_APPROVAL,
  BOOKING_STATUS.AWAITING_PAYMENT,
  BOOKING_STATUS.PAYMENT_REVIEW,
  BOOKING_STATUS.CONFIRMED,
];

export default function MyBookings() {
  const history = useHistory();
  const { bookings, favorites, teacherFor, allTeachers } = useApp();
  const [tab, setTab] = useState('upcoming');

  const upcoming = bookings.filter((b) => UPCOMING.includes(b.status));
  const past = bookings.filter((b) => !UPCOMING.includes(b.status));
  const saved = allTeachers().filter((t) => favorites.includes(t.id));

  const list = tab === 'upcoming' ? upcoming : tab === 'past' ? past : [];

  const grouped = list.reduce((acc, b) => {
    (acc[b.date] = acc[b.date] || []).push(b);
    return acc;
  }, {});

  return (
    <div className="dz-screen">
      <TopBar title="حجوزاتي" subtitle={`${upcoming.length} حجز قادم`} />

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
        {tab === 'saved' ? (
          saved.length === 0 ? (
            <EmptyState title="لا يوجد مدرسون محفوظون" body="اضغط على أيقونة الحفظ في ملف أي مدرس ليظهر هنا." />
          ) : (
            <div className="dz-stack">
              {saved.map((t) => <TeacherCard key={t.id} teacher={t} />)}
            </div>
          )
        ) : list.length === 0 ? (
          <EmptyState
            title={tab === 'upcoming' ? 'لا توجد حجوزات قادمة' : 'لا توجد حجوزات سابقة'}
            body={tab === 'upcoming' ? 'ابحث عن مدرس واحجز حصتك الأولى.' : 'ستظهر هنا الحصص المكتملة والملغاة.'}
          />
        ) : (
          <div className="dz-stack">
            {Object.keys(grouped).sort().map((date) => (
              <section key={date}>
                <div className="dz-faint" style={{ fontWeight: 700, marginBottom: 6 }}>{formatDate(date)}</div>
                {grouped[date].map((b) => {
                  const teacher = teacherFor(b.teacherId);
                  return (
                    <button
                      key={b.id}
                      type="button"
                      className="dz-listrow"
                      onClick={() => history.push(`/booking/${b.id}`)}
                    >
                      <Avatar teacher={teacher} size="sm" />
                      <span className="dz-grow">
                        <span style={{ fontSize: 13, fontWeight: 700, display: 'block' }}>
                          {subjectById(b.subjectId)?.name} — {b.learnerName}
                        </span>
                        <span className="dz-row" style={{ gap: 6, marginTop: 5, flexWrap: 'wrap' }}>
                          <span className={`dz-chip dz-chip--sm dz-chip--${STATUS_TONE[b.status]}`}>{STATUS_LABEL[b.status]}</span>
                          <span className="dz-chip dz-chip--sm">
                            {b.mode === 'online' ? <IconVideo size={11} /> : <IconPin size={11} />}
                            {formatTime(b.time)}
                          </span>
                          <span className="dz-chip dz-chip--sm">{money(b.price)}</span>
                        </span>
                      </span>
                      <IconForward size={16} />
                    </button>
                  );
                })}
              </section>
            ))}
          </div>
        )}
      </div>

      <BottomNav active="bookings" />
    </div>
  );
}
