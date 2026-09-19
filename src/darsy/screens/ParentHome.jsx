import React from 'react';
import { useHistory } from 'react-router-dom';
import { BottomNav, Avatar, EmptyState, formatDate, formatTime, money } from '../components/common';
import { IconBell, IconForward, IconSearch, IconVideo, IconPin } from '../components/Icons';
import { subjectById, gradeById } from '../data/catalog';
import { useApp, BOOKING_STATUS, STATUS_LABEL, STATUS_TONE } from '../state/AppContext';
import mark from '../assets/darsy-mark.png';

const LIVE = [
  BOOKING_STATUS.PENDING_APPROVAL,
  BOOKING_STATUS.AWAITING_PAYMENT,
  BOOKING_STATUS.PAYMENT_REVIEW,
  BOOKING_STATUS.CONFIRMED,
];

export default function ParentHome() {
  const history = useHistory();
  const { base, profile, children, bookings, notifications, teacherFor, setActiveChild } = useApp();

  const unread = notifications.filter((n) => n.unread).length;
  const awaitingPayment = bookings.filter((b) => b.status === BOOKING_STATUS.AWAITING_PAYMENT);
  const spend = bookings
    .filter((b) => [BOOKING_STATUS.CONFIRMED, BOOKING_STATUS.COMPLETED].includes(b.status))
    .reduce((sum, b) => sum + b.price, 0);

  return (
    <div className="dz-screen">
      <header className="dz-topbar">
        <img src={mark} alt="درسي" style={{ width: 34, height: 34, objectFit: 'contain' }} />
        <div className="dz-grow">
          <h1 className="dz-topbar__title">أهلاً، {profile.name.split(' ')[0]}</h1>
          <div className="dz-topbar__sub">متابعة تعليم {children.length} من الأبناء</div>
        </div>
        <button type="button" className="dz-iconbtn" aria-label="الإشعارات" onClick={() => history.push(`${base}/notifications`)}>
          <IconBell size={17} />
          {unread > 0 && <span className="dz-iconbtn__dot" />}
        </button>
      </header>

      <div className="dz-body">
        {awaitingPayment.length > 0 && (
          <button
            type="button"
            className="dz-banner dz-banner--accent"
            style={{ width: '100%', border: 'none', marginBottom: 16, textAlign: 'start' }}
            onClick={() => history.push(`${base}/bookings`)}
          >
            <span className="dz-grow">
              {awaitingPayment.length} حجز بانتظار الدفع — أكمل الدفع لتأكيد الحصة
            </span>
            <IconForward size={16} />
          </button>
        )}

        <div className="dz-stats" style={{ marginBottom: 18 }}>
          <div className="dz-stats__cell">
            <div className="dz-stats__num">{bookings.filter((b) => LIVE.includes(b.status)).length}</div>
            <div className="dz-stats__lbl">حصة قادمة</div>
          </div>
          <div className="dz-stats__cell">
            <div className="dz-stats__num">{children.length}</div>
            <div className="dz-stats__lbl">أبناء</div>
          </div>
          <div className="dz-stats__cell">
            <div className="dz-stats__num">{spend}</div>
            <div className="dz-stats__lbl">د.ل هذا الشهر</div>
          </div>
        </div>

        {children.length === 0 ? (
          <EmptyState title="لم تضف أبناءك بعد" body="أضف ابنك من تبويب «أبنائي» لتحجز له حصة." />
        ) : (
          children.map((child) => {
            const mine = bookings.filter((b) => b.learnerName === child.name);
            const next = mine
              .filter((b) => LIVE.includes(b.status))
              .sort((a, b) => (a.date < b.date ? -1 : 1))[0];

            return (
              <section key={child.id} style={{ marginBottom: 18 }}>
                <div className="dz-section-title">
                  <span>{child.name} — {gradeById(child.gradeId)?.name}</span>
                  <button
                    type="button"
                    className="dz-btn dz-btn--ghost dz-btn--sm"
                    onClick={() => { setActiveChild(child.name); history.push(`${base}/search`); }}
                  >
                    <IconSearch size={14} /> احجز له
                  </button>
                </div>

                {next ? (
                  <button
                    type="button"
                    className="dz-card dz-card--soft dz-row"
                    style={{ width: '100%', textAlign: 'start', border: 'none' }}
                    onClick={() => history.push(`${base}/booking/${next.id}`)}
                  >
                    <Avatar teacher={teacherFor(next.teacherId)} />
                    <span className="dz-grow">
                      <span style={{ fontWeight: 700, fontSize: 14, display: 'block' }}>
                        {subjectById(next.subjectId)?.name} — {teacherFor(next.teacherId).name.split(' ')[0]}
                      </span>
                      <span className="dz-muted" style={{ display: 'block', marginTop: 2 }}>
                        {formatDate(next.date)} · {formatTime(next.time)}
                      </span>
                      <span className="dz-row" style={{ gap: 6, marginTop: 6 }}>
                        <span className={`dz-chip dz-chip--sm dz-chip--${STATUS_TONE[next.status]}`}>
                          {STATUS_LABEL[next.status]}
                        </span>
                        <span className="dz-chip dz-chip--sm">
                          {next.mode === 'online' ? <IconVideo size={11} /> : <IconPin size={11} />}
                          {money(next.price)}
                        </span>
                      </span>
                    </span>
                    <IconForward size={16} />
                  </button>
                ) : (
                  <div className="dz-card dz-card--soft">
                    <div className="dz-muted">لا توجد حصص قادمة لـ{child.name}.</div>
                  </div>
                )}

                <div className="dz-faint" style={{ marginTop: 8 }}>
                  {mine.filter((b) => b.status === BOOKING_STATUS.COMPLETED).length} حصة مكتملة · {mine.length} حجز إجمالاً
                </div>
              </section>
            );
          })
        )}
      </div>

      <BottomNav active="home" />
    </div>
  );
}
