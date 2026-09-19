import React, { useState } from 'react';
import { BottomNav, Banner, EmptyState, Sheet, Field, Avatar, money, formatDate } from '../../components/common';
import { IconShield, IconCap } from '../../components/Icons';
import { subjectById } from '../../data/catalog';
import { useApp } from '../../state/AppContext';

export default function AdminTeachers() {
  const {
    allTeachers, apologiesOf, isSuspended, setTeacherSuspended, settings, teacherStatus,
  } = useApp();

  const [lifting, setLifting] = useState(null);
  const [suspending, setSuspending] = useState(null);
  const [reason, setReason] = useState('');

  const teachers = allTeachers().map((t) => ({
    ...t,
    apologies: apologiesOf(t.id),
    suspended: isSuspended(t.id),
    status: teacherStatus[t.id],
  }));

  const suspended = teachers.filter((t) => t.suspended);
  const withApologies = teachers.filter((t) => !t.suspended && t.apologies.length > 0);
  const clean = teachers.filter((t) => !t.suspended && t.apologies.length === 0);

  return (
    <div className="dz-screen">
      <header className="dz-topbar">
        <div className="dz-grow">
          <h1 className="dz-topbar__title">المدرسون</h1>
          <div className="dz-topbar__sub">الاعتذارات والإيقاف</div>
        </div>
      </header>

      <div className="dz-body">
        <section style={{ marginBottom: 18 }}>
          <div className="dz-section-title"><span>موقوفون</span></div>
          {suspended.length === 0 ? (
            <EmptyState
              title="لا يوجد مدرسون موقوفون"
              body={`يُوقف المدرس تلقائيًا عند ${settings.apologyLimit} اعتذارات خلال ${settings.apologyWindowDays} يومًا.`}
            />
          ) : (
            <div className="dz-stack dz-stack--sm">
              {suspended.map((t) => (
                <div key={t.id} className="dz-card">
                  <div className="dz-row" style={{ marginBottom: 10 }}>
                    <Avatar teacher={t} size="sm" />
                    <span className="dz-grow">
                      <span style={{ fontWeight: 700, fontSize: 14, display: 'block' }}>{t.name}</span>
                      <span className="dz-muted" style={{ display: 'block', marginTop: 2 }}>
                        {t.status?.reason}
                      </span>
                    </span>
                    <span className="dz-chip dz-chip--sm dz-chip--danger">موقوف</span>
                  </div>

                  <div className="dz-card dz-card--soft" style={{ marginBottom: 10 }}>
                    {t.apologies.map((b) => (
                      <div key={b.id} className="dz-kv">
                        <span className="dz-kv__k">
                          {b.learnerName} — {subjectById(b.subjectId)?.name} · {formatDate(b.date)}
                        </span>
                        <span className="dz-kv__v">{money(b.cancellation.refund)}</span>
                      </div>
                    ))}
                    {t.apologies.some((b) => b.cancellation.reason) && (
                      <div className="dz-faint" style={{ marginTop: 8 }}>
                        آخر سبب: {t.apologies.find((b) => b.cancellation.reason)?.cancellation.reason}
                      </div>
                    )}
                  </div>

                  <button
                    type="button"
                    className="dz-btn dz-btn--success dz-btn--sm"
                    style={{ width: '100%' }}
                    onClick={() => setLifting(t)}
                  >
                    إعادة التفعيل بعد التواصل
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>

        {withApologies.length > 0 && (
          <section style={{ marginBottom: 18 }}>
            <div className="dz-section-title"><span>تحت المراقبة</span></div>
            <div className="dz-card">
              {withApologies.map((t) => (
                <div key={t.id} className="dz-listrow">
                  <span className="dz-grow">
                    <span style={{ fontSize: 13, fontWeight: 700, display: 'block' }}>{t.name}</span>
                    <span className="dz-muted" style={{ display: 'block', marginTop: 2 }}>
                      {t.apologies.length} من {settings.apologyLimit} اعتذارات
                    </span>
                  </span>
                  <button
                    type="button"
                    className="dz-btn dz-btn--ghost dz-btn--sm"
                    onClick={() => { setSuspending(t); setReason(''); }}
                  >
                    إيقاف
                  </button>
                </div>
              ))}
            </div>
          </section>
        )}

        <section>
          <div className="dz-section-title"><span>بقية المدرسين</span></div>
          <div className="dz-card">
            {clean.map((t) => (
              <div key={t.id} className="dz-listrow">
                <span className="dz-avatar dz-avatar--sm" style={{ background: 'var(--c-success-bg)', color: 'var(--c-success)' }}>
                  <IconShield size={15} />
                </span>
                <span className="dz-grow">
                  <span style={{ fontSize: 13, fontWeight: 700, display: 'block' }}>{t.name}</span>
                  <span className="dz-muted" style={{ display: 'block', marginTop: 2 }}>
                    {t.sessionsCount} حصة · بلا اعتذارات
                  </span>
                </span>
                <button
                  type="button"
                  className="dz-btn dz-btn--ghost dz-btn--sm"
                  onClick={() => { setSuspending(t); setReason(''); }}
                >
                  إيقاف
                </button>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 12 }}>
            <Banner tone="primary">
              الإيقاف يخفي المدرس من البحث ويمنع وصول طلبات جديدة، ولا يلغي حجوزاته المؤكدة.
            </Banner>
          </div>
        </section>
      </div>

      <Sheet open={Boolean(lifting)} onClose={() => setLifting(null)} title="إعادة تفعيل المدرس">
        {lifting && (
          <div className="dz-stack">
            <div className="dz-row">
              <IconCap size={18} />
              <span className="dz-h3">{lifting.name}</span>
            </div>
            <Banner tone="accent">
              أعد التفعيل بعد التواصل مع المدرس والاتفاق على عدم تكرار الاعتذار. يعود ملفه
              للظهور في البحث فورًا، ويصله إشعار بذلك.
            </Banner>
            <button
              type="button"
              className="dz-btn dz-btn--success"
              onClick={() => { setTeacherSuspended(lifting.id, false); setLifting(null); }}
            >
              تأكيد إعادة التفعيل
            </button>
            <button type="button" className="dz-btn dz-btn--ghost dz-btn--sm" style={{ width: '100%' }} onClick={() => setLifting(null)}>
              تراجع
            </button>
          </div>
        )}
      </Sheet>

      <Sheet open={Boolean(suspending)} onClose={() => setSuspending(null)} title="إيقاف المدرس">
        {suspending && (
          <div className="dz-stack">
            <div className="dz-row">
              <IconCap size={18} />
              <span className="dz-h3">{suspending.name}</span>
            </div>
            <Field label="سبب الإيقاف (يصل المدرس)">
              <textarea
                className="dz-textarea"
                rows={3}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="مثال: تكرار الاعتذار عن حصص مدفوعة"
              />
            </Field>
            <button
              type="button"
              className="dz-btn dz-btn--danger"
              onClick={() => { setTeacherSuspended(suspending.id, true, reason.trim()); setSuspending(null); }}
            >
              تأكيد الإيقاف
            </button>
          </div>
        )}
      </Sheet>

      <BottomNav active="teachers" />
    </div>
  );
}
