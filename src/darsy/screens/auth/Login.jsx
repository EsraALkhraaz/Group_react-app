import React, { useState } from 'react';
import { useHistory, useParams } from 'react-router-dom';
import { Field, Banner } from '../../components/common';
import { AuthShell, PasswordField, ROLE_LABEL } from './AuthShell';
import { normalizePhone, isValidPhone } from '../../lib/validation';
import { useApp, BASE_BY_ROLE, DEMO_ACCOUNTS } from '../../state/AppContext';

export default function Login() {
  const { role } = useParams();
  const history = useHistory();
  const { signIn } = useApp();

  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const demo = DEMO_ACCOUNTS.find((a) => a.role === role);

  const submit = (e) => {
    e.preventDefault();
    const normalized = normalizePhone(phone);

    if (!isValidPhone(normalized)) {
      setError('أدخل رقم هاتف ليبي صحيح يبدأ بـ09');
      return;
    }
    if (!password) {
      setError('أدخل كلمة المرور');
      return;
    }
    if (!signIn({ role, phone: normalized })) {
      setError('لا يوجد حساب بهذا الرقم — أنشئ حسابًا جديدًا');
      return;
    }
    history.push(`${BASE_BY_ROLE[role]}/home`);
  };

  return (
    <AuthShell
      title="تسجيل الدخول"
      subtitle={`ادخل إلى حسابك كـ${ROLE_LABEL[role]}`}
      role={role}
      onBack={() => history.push('/')}
      footer={
        <>
          <button type="button" className="dz-btn dz-btn--primary" onClick={submit}>
            دخول
          </button>
          {/* Admin accounts are issued, not signed up for. */}
          {role !== 'admin' && (
            <button
              type="button"
              className="dz-btn dz-btn--ghost dz-btn--sm"
              style={{ width: '100%' }}
              onClick={() => history.push(`/auth/${role}/signup`)}
            >
              ليس لديك حساب؟ أنشئ حسابًا
            </button>
          )}
        </>
      }
    >
      <form className="dz-stack" onSubmit={submit}>
        <Field label="رقم الهاتف" hint="مثال: 0912345678">
          <input
            className="dz-input"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            value={phone}
            onChange={(e) => { setPhone(e.target.value); setError(''); }}
            placeholder="09XXXXXXXX"
            style={{ direction: 'ltr', textAlign: 'right' }}
          />
        </Field>

        <PasswordField
          label="كلمة المرور"
          value={password}
          autoComplete="current-password"
          onChange={(v) => { setPassword(v); setError(''); }}
        />

        <button
          type="button"
          className="dz-faint"
          style={{ background: 'none', border: 'none', textAlign: 'start', padding: 0, fontWeight: 700 }}
          onClick={() => history.push(`/auth/${role}/forgot`)}
        >
          نسيت كلمة المرور؟
        </button>

        {error && <Banner tone="danger">{error}</Banner>}

        {demo && (
          <Banner tone="accent">
            للتجربة: {demo.phone} مع أي كلمة مرور — نموذج أولي بلا خادم فعلي.
          </Banner>
        )}
      </form>
    </AuthShell>
  );
}
