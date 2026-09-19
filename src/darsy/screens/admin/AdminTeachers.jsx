import React, { useState } from 'react';
import { BottomNav, Banner, EmptyState, Sheet, Field, Avatar, money, formatDate } from '../../components/common';
import { IconShield, IconCap, IconUpload, IconCheck } from '../../components/Icons';
import { subjectById } from '../../data/catalog';
import { useApp } from '../../state/AppContext';

export default function AdminTeachers() {
  const {
    allTeachers, apologiesOf, isSuspended, setTeacherSuspended, settings, teacherStatus,
    reviewVerification,
  } = useApp();

  const [lifting, setLifting] = useState(null);
  const [suspending, setSuspending] = useState(null);
  const [rejecting, setRejecting] = useState(null);
  const [reason, setReason] = useState('');

  const teachers = allTeachers().map((t) => ({
    ...t,
    apologies: apologiesOf(t.id),
    suspended: isSuspended(t.id),
    status: teacherStatus[t.id],
  }));

  const awaitingReview = teachers.filter((t) => t.verification?.status === 'pending');
  const rejected = teachers.filter((t) => t.verification?.status === 'rejected');
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
          <div className="dz-section-title"><span>بانتظار توثيق الهوية</span></div>
          {awaitingReview.length === 0 ? (
            <EmptyState
              title="لا توجد طلبات توثيق"
              body="لا يظهر أي مدرس في نتائج البحث قبل أن تراجع هويته هنا."
            />
          ) : (
            <div className="dz-stack dz-stack--sm">
              {awaitingReview.map((t) => (
                <div key={t.id} className="dz-card">
                  <div className="dz-row" style={{ marginBottom: 10 }}>
                    <Avatar teacher={t} size="sm" />
                    <span className="dz-grow">
                      <span style={{ fontWeight: 700, fontSize: 14, display: 'block' }}>{t.name}</span>
                      <span className="dz-muted" style={{ display: 'block', marginTop: 2 }}>
                        {t.subjects?.map((id) => subjectById(id)?.name).filter(Boolean).join('، ')}
                      </span>
                    </span>
                  </div>

                  <div className="dz-row" style={{ gap: 6, marginBottom: 10 }}>
                    <span className="dz-chip dz-chip--sm">
                      <IconUpload size={11} /> {t.verification.document}
                    </span>
                    <span className="dz-chip dz-chip--sm">
                      رُفع في {formatDate(t.verification.submittedAt.slice(0, 10))}
                    </span>
                  </div>

                  <div className="dz-faint" style={{ marginBottom: 10 }}>
                    راجع تطابق الاسم مع المستند قبل الاعتماد — التوثيق هو ما يحمي ثقة المنصة.
                  </div>

                  <div className="dz-row" style={{ gap: 8 }}>
                    <button
                      type="button"
                      className="dz-btn dz-btn--success dz-btn--sm"
                      style={{ flex: 1 }}
                      onClick={() => reviewVerification(t.id, true)}
                    >
                      <IconCheck size={15} /> اعتماد
                    </button>
                    <button
                      type="button"
                      className="dz-btn dz-btn--danger dz-btn--sm"
                      style={{ flex: 1 }}
                      onClick={() => { setRejecting(t); setReason(''); }}
                    >
                      رفض
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {rejected.length > 0 && (
          <section style={{ marginBottom: 18 }}>
            <div className="dz-section-title"><span>مستندات مرفوضة</span></div>
            <div className="dz-card">
              {rejected.map((t) => (
                <div key={t.id} className="dz-listrow">
                  <span className="dz-grow">
                    <span style={{ fontSize: 13, fontWeight: 700, display: 'block' }}>{t.name}</span>
                    <span className="dz-muted" style={{ display: 'block', marginTop: 2 }}>
                      {t.verification.reason || 'بلا سبب مسجّل'}
                    </span>
                  </span>
                  <span className="dz-chip dz-chip--sm dz-chip--danger">غير موثّق</span>
                </div>
              ))}
            </div>
          </section>
        )}

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

      <Sheet open={Boolean(rejecting)} onClose={() => setRejecting(null)} title="رفض مستند الهوية">
        {rejecting && (
          <div className="dz-stack">
            <div className="dz-row">
              <IconCap size={18} />
              <span className="dz-h3">{rejecting.name}</span>
            </div>
            <Banner tone="accent">
              يصل السبب للمدرس ليعيد الرفع. الرفض لا يمنعه من المحاولة مرة أخرى.
            </Banner>
            <Field label="سبب الرفض (يصل المدرس)">
              <textarea
                className="dz-textarea"
                rows={3}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="مثال: الصورة غير واضحة، أو الاسم لا يطابق الملف"
              />
            </Field>
            <button
              type="button"
              className="dz-btn dz-btn--danger"
              disabled={!reason.trim()}
              onClick={() => { reviewVerification(rejecting.id, false, reason.trim()); setRejecting(null); }}
            >
              تأكيد الرفض
            </button>
          </div>
        )}
      </Sheet>

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
