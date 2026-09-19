import React, { useState } from 'react';
import { useHistory } from 'react-router-dom';
import { TopBar, Banner, Sheet, Toggle, EmptyState } from '../../components/common';
import { PasswordField } from '../auth/AuthShell';
import { IconShield, IconCheck } from '../../components/Icons';
import { passwordIssue } from '../../lib/validation';
import { useApp } from '../../state/AppContext';

export default function Security() {
  const history = useHistory();
  const {
    base, role, session, accounts, prefs, setPref, signOut, confirmPhone,
  } = useApp();

  const [pwOpen, setPwOpen] = useState(false);
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [error, setError] = useState('');
  const [changed, setChanged] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  if (!session) return <EmptyState title="غير مسجل الدخول" body="" />;

  const account = accounts.find((a) => a.role === session.role && a.phone === session.phone);
  const verified = Boolean(account && account.verified);

  const savePassword = () => {
    if (!current) return setError('أدخل كلمة المرور الحالية');
    const issue = passwordIssue(next);
    if (issue) return setError(issue);
    if (next !== confirmPw) return setError('كلمتا المرور غير متطابقتين');
    if (next === current) return setError('اختر كلمة مرور مختلفة عن الحالية');

    // No backend: the form validates, then the values are dropped.
    setChanged(true);
    setCurrent('');
    setNext('');
    setConfirmPw('');
    setError('');
    setPwOpen(false);
    return undefined;
  };

  return (
    <div className="dz-screen">
      <TopBar back title="الخصوصية والأمان" onBack={() => history.push(`${base}/account`)} />

      <div className="dz-body">
        {changed && (
          <div style={{ marginBottom: 14 }}>
            <Banner tone="success" icon={<IconCheck size={18} />}>تم تغيير كلمة المرور</Banner>
          </div>
        )}

        <section style={{ marginBottom: 18 }}>
          <div className="dz-section-title"><span>حالة الحساب</span></div>
          <div className="dz-card">
            <div className="dz-row" style={{ marginBottom: 10 }}>
              <span
                className="dz-avatar dz-avatar--sm"
                style={{
                  background: verified ? 'var(--c-success-bg)' : 'var(--c-accent-bg)',
                  color: verified ? 'var(--c-success)' : 'var(--c-accent-text)',
                }}
              >
                <IconShield size={16} />
              </span>
              <span className="dz-grow">
                <span style={{ fontWeight: 700, fontSize: 14, display: 'block' }}>
                  {verified ? 'رقم الهاتف موثّق' : 'رقم الهاتف غير موثّق'}
                </span>
                <span className="dz-muted" style={{ display: 'block', marginTop: 2, direction: 'ltr', textAlign: 'right' }}>
                  {session.phone}
                </span>
              </span>
            </div>
            {!verified && (
              <button
                type="button"
                className="dz-btn dz-btn--accent dz-btn--sm"
                style={{ width: '100%' }}
                onClick={confirmPhone}
              >
                تأكيد الرقم الآن
              </button>
            )}
            {role === 'teacher' && (
              <div className="dz-faint" style={{ marginTop: 10 }}>
                توثيق الهوية يتم من إدارة درسي قبل ظهور ملفك في نتائج البحث.
              </div>
            )}
          </div>
        </section>

        <section style={{ marginBottom: 18 }}>
          <div className="dz-section-title"><span>كلمة المرور</span></div>
          <div className="dz-card">
            <div className="dz-muted" style={{ marginBottom: 12 }}>
              ننصح بتغييرها كل فترة، وبعدم مشاركتها مع أحد.
            </div>
            <button
              type="button"
              className="dz-btn dz-btn--ghost dz-btn--sm"
              style={{ width: '100%' }}
              onClick={() => { setPwOpen(true); setChanged(false); }}
            >
              تغيير كلمة المرور
            </button>
          </div>
        </section>

        <section style={{ marginBottom: 18 }}>
          <div className="dz-section-title"><span>الإشعارات</span></div>
          <div className="dz-card">
            <Toggle
              label="إشعارات داخل التطبيق"
              hint="تأكيد الحجز، رد المدرس، وحالة الدفع"
              checked={prefs.inApp}
              onChange={(v) => setPref('inApp', v)}
            />
            <Toggle
              label="تذكير قبل الحصة"
              hint="تنبيه قبل موعد الحصة بـ30 دقيقة"
              checked={prefs.reminders}
              onChange={(v) => setPref('reminders', v)}
            />
            <Toggle
              label="رسائل SMS"
              hint="لم تُفعّل بعد — مرحلة لاحقة"
              checked={prefs.sms}
              onChange={(v) => setPref('sms', v)}
            />
          </div>
        </section>

        <section style={{ marginBottom: 18 }}>
          <div className="dz-section-title"><span>خصوصية البيانات</span></div>
          <div className="dz-card">
            <div className="dz-muted" style={{ lineHeight: 1.8 }}>
              {role === 'parent'
                ? 'بيانات أبنائك تظهر للمدرس المحجوز له فقط، ولا تُعرض في البحث. العنوان الدقيق لا يُخزَّن — يُتبادل بينكما بعد تأكيد الحجز.'
                : 'لا تُعرض بياناتك للمدرس إلا بعد تأكيد الحجز، ولا يُخزَّن عنوانك في التطبيق.'}
            </div>
          </div>
        </section>

        <section>
          <div className="dz-section-title"><span>إجراءات الحساب</span></div>
          <div className="dz-stack dz-stack--sm">
            <button
              type="button"
              className="dz-btn dz-btn--ghost dz-btn--sm"
              style={{ width: '100%' }}
              onClick={() => { signOut(); history.push('/'); }}
            >
              تسجيل الخروج
            </button>
            <button
              type="button"
              className="dz-btn dz-btn--danger dz-btn--sm"
              style={{ width: '100%' }}
              onClick={() => setDeleteOpen(true)}
            >
              حذف الحساب
            </button>
          </div>
        </section>
      </div>

      <Sheet open={pwOpen} onClose={() => setPwOpen(false)} title="تغيير كلمة المرور">
        <div className="dz-stack">
          <PasswordField
            label="كلمة المرور الحالية"
            value={current}
            autoComplete="current-password"
            onChange={(v) => { setCurrent(v); setError(''); }}
          />
          <PasswordField
            label="كلمة المرور الجديدة"
            value={next}
            autoComplete="new-password"
            hint="8 أحرف على الأقل، وتجمع بين حروف وأرقام"
            onChange={(v) => { setNext(v); setError(''); }}
          />
          <PasswordField
            label="تأكيد كلمة المرور الجديدة"
            value={confirmPw}
            autoComplete="new-password"
            onChange={(v) => { setConfirmPw(v); setError(''); }}
          />
          {error && <Banner tone="danger">{error}</Banner>}
          <button type="button" className="dz-btn dz-btn--primary" onClick={savePassword}>
            حفظ كلمة المرور
          </button>
        </div>
      </Sheet>

      <Sheet open={deleteOpen} onClose={() => setDeleteOpen(false)} title="حذف الحساب">
        <div className="dz-stack">
          <Banner tone="danger">
            سيُحذف حسابك وحجوزاتك نهائيًا ولا يمكن التراجع. الحجوزات المؤكدة تُلغى وفق سياسة الإلغاء.
          </Banner>
          <button
            type="button"
            className="dz-btn dz-btn--danger"
            onClick={() => { signOut(); history.push('/'); }}
          >
            تأكيد الحذف
          </button>
          <button type="button" className="dz-btn dz-btn--ghost dz-btn--sm" style={{ width: '100%' }} onClick={() => setDeleteOpen(false)}>
            تراجع
          </button>
        </div>
      </Sheet>
    </div>
  );
}
