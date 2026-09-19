import React, { useState } from 'react';
import { TopBar, BottomNav, Sheet, Field, EmptyState, money, formatDate, formatTime } from '../components/common';
import { IconCheck, IconClose, IconVideo, IconPin, IconClock } from '../components/Icons';
import { subjectById } from '../data/catalog';
import { useApp, BOOKING_STATUS } from '../state/AppContext';
import { timeLeftLabel, hoursLeftToAnswer } from '../lib/requests';

const ME = 't1';

export default function TeacherRequests() {
  const { bookings, approveBooking, rejectBooking, settings } = useApp();
  const [rejectId, setRejectId] = useState(null);
  const [reason, setReason] = useState('');

  const requests = bookings.filter(
    (b) => b.teacherId === ME && b.status === BOOKING_STATUS.PENDING_APPROVAL,
  );

  return (
    <div className="dz-screen">
      <TopBar title="طلبات الحجز" subtitle={`${requests.length} طلب بانتظار ردك`} />

      <div className="dz-body">
        {requests.length === 0 ? (
          <EmptyState
            title="لا توجد طلبات جديدة"
            body={`ستظهر هنا طلبات الحجز فور وصولها. لديك ${settings.requestExpiryHours} ساعة للرد على كل طلب قبل أن ينتهي تلقائيًا.`}
          />
        ) : (
          <div className="dz-stack">
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
                  <span className={`dz-chip dz-chip--sm${hoursLeftToAnswer(b, settings) < 6 ? ' dz-chip--danger' : ''}`}>
                    <IconClock size={11} /> {timeLeftLabel(b, settings)}
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
      </div>

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

      <BottomNav active="requests" />
    </div>
  );
}
