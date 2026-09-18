import React from 'react';
import { useHistory } from 'react-router-dom';
import { BottomNav, Avatar, formatDate, formatTime, money } from '../components/common';
import { IconSearch, IconBell, IconForward, IconVideo, IconPin } from '../components/Icons';
import { SUBJECTS, subjectById } from '../data/catalog';
import { useApp, BOOKING_STATUS, STATUS_LABEL, STATUS_TONE } from '../state/AppContext';
import mark from '../assets/darsy-mark.png';

export default function Home() {
  const history = useHistory();
  const { profile, role, bookings, notifications, children, teacherFor, allTeachers } = useApp();

  const unread = notifications.filter((n) => n.unread).length;
  const upcoming = bookings
    .filter((b) => [BOOKING_STATUS.CONFIRMED, BOOKING_STATUS.PENDING_APPROVAL, BOOKING_STATUS.AWAITING_PAYMENT, BOOKING_STATUS.PAYMENT_REVIEW].includes(b.status))
    .sort((a, b) => (a.date < b.date ? -1 : 1))
    .slice(0, 3);

  const topRated = [...allTeachers()].sort((a, b) => b.rating - a.rating).slice(0, 4);

  return (
    <div className="dz-screen">
      <header className="dz-topbar">
        <img src={mark} alt="درسي" style={{ width: 34, height: 34, objectFit: 'contain' }} />
        <div className="dz-grow">
          <h1 className="dz-topbar__title">أهلاً، {profile.name.split(' ')[0]}</h1>
          <div className="dz-topbar__sub">{role === 'parent' ? `${children.length} أبناء مسجلون` : 'حساب طالب'}</div>
        </div>
        <button type="button" className="dz-iconbtn" aria-label="بحث" onClick={() => history.push('/search')}>
          <IconSearch size={17} />
        </button>
        <button type="button" className="dz-iconbtn" aria-label="الإشعارات" onClick={() => history.push('/notifications')}>
          <IconBell size={17} />
          {unread > 0 && <span className="dz-iconbtn__dot" />}
        </button>
      </header>

      <div className="dz-body">
        <button
          type="button"
          onClick={() => history.push('/search')}
          className="dz-card dz-card--raised"
          style={{ width: '100%', textAlign: 'start', marginBottom: 18, border: 'none' }}
        >
          <div className="dz-h3" style={{ marginBottom: 4 }}>ماذا تريد أن تتعلم اليوم؟</div>
          <div className="dz-muted" style={{ marginBottom: 12 }}>اختر المادة والصف واللغة، وسنعرض لك المدرسين المناسبين</div>
          <span className="dz-btn dz-btn--primary dz-btn--sm" style={{ width: '100%' }}>
            <IconSearch size={16} /> ابحث عن مدرس
          </span>
        </button>

        {upcoming.length > 0 && (
          <section style={{ marginBottom: 20 }}>
            <div className="dz-section-title">
              <span>حصصك القادمة</span>
              <button type="button" className="dz-faint" style={{ background: 'none', border: 'none' }} onClick={() => history.push('/bookings')}>
                عرض الكل
              </button>
            </div>
            <div className="dz-stack dz-stack--sm">
              {upcoming.map((b) => {
                const teacher = teacherFor(b.teacherId);
                return (
                  <button
                    key={b.id}
                    type="button"
                    className="dz-card dz-card--soft dz-row"
                    style={{ width: '100%', textAlign: 'start', border: 'none' }}
                    onClick={() => history.push(`/booking/${b.id}`)}
                  >
                    <Avatar teacher={teacher} />
                    <span className="dz-grow">
                      <span style={{ fontWeight: 700, fontSize: 14, display: 'block' }}>
                        {subjectById(b.subjectId)?.name} — {teacher.name.split(' ')[0]} {teacher.name.split(' ')[1]}
                      </span>
                      <span className="dz-muted" style={{ display: 'block', marginTop: 2 }}>
                        {formatDate(b.date)} · {formatTime(b.time)}
                      </span>
                      <span className="dz-row" style={{ gap: 6, marginTop: 6 }}>
                        <span className={`dz-chip dz-chip--sm dz-chip--${STATUS_TONE[b.status]}`}>{STATUS_LABEL[b.status]}</span>
                        <span className="dz-chip dz-chip--sm">
                          {b.mode === 'online' ? <IconVideo size={11} /> : <IconPin size={11} />}
                          {b.mode === 'online' ? 'أونلاين' : 'حضوري'}
                        </span>
                      </span>
                    </span>
                    <IconForward size={16} />
                  </button>
                );
              })}
            </div>
          </section>
        )}

        <section style={{ marginBottom: 20 }}>
          <div className="dz-section-title"><span>المواد الأكثر طلبًا</span></div>
          <div className="dz-chiprow">
            {SUBJECTS.slice(0, 6).map((s) => (
              <button
                key={s.id}
                type="button"
                className="dz-chip"
                onClick={() => history.push(`/results?subject=${s.id}`)}
              >
                <span style={{ width: 8, height: 8, borderRadius: 4, background: s.color }} />
                {s.name}
              </button>
            ))}
          </div>
        </section>

        <section>
          <div className="dz-section-title">
            <span>الأعلى تقييمًا</span>
            <button type="button" className="dz-faint" style={{ background: 'none', border: 'none' }} onClick={() => history.push('/results')}>
              عرض الكل
            </button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 12 }}>
            {topRated.map((t) => (
              <button
                key={t.id}
                type="button"
                className="dz-card"
                style={{ textAlign: 'start', padding: 12 }}
                onClick={() => history.push(`/teacher/${t.id}`)}
              >
                <div
                  className="dz-thumb"
                  style={{ background: `linear-gradient(135deg, ${subjectById(t.subjects[0])?.color}, ${subjectById(t.subjects[0])?.color}CC)`, marginBottom: 10 }}
                >
                  {subjectById(t.subjects[0])?.name}
                </div>
                <div style={{ fontWeight: 700, fontSize: 13 }}>{t.name.split(' ').slice(0, 2).join(' ')}</div>
                <div className="dz-row dz-row--between" style={{ marginTop: 4 }}>
                  <span className="dz-faint">⭐ {t.rating.toFixed(1)}</span>
                  <span style={{ fontSize: 12, fontWeight: 800 }}>
                    {money(t.pricing.online?.individual || t.pricing.f2f?.individual)}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </section>
      </div>

      <BottomNav active="home" />
    </div>
  );
}
