import React, { useState } from 'react';
import { useHistory, useParams } from 'react-router-dom';
import { Field, Banner } from '../../components/common';
import { AuthShell } from './AuthShell';
import { normalizePhone, isValidPhone } from '../../lib/validation';
import { useApp } from '../../state/AppContext';

export default function ForgotPassword() {
  const { role } = useParams();
  const history = useHistory();
  const { accountFor } = useApp();

  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');

  const submit = (e) => {
    e.preventDefault();
    const normalized = normalizePhone(phone);

    if (!isValidPhone(normalized)) {
      setError('أدخل رقم هاتف ليبي صحيح يبدأ بـ09');
      return;
    }
    if (!accountFor(role, normalized)) {
      setError('لا يوجد حساب بهذا الرقم');
      return;
    }
    history.push(`/auth/${role}/reset?phone=${normalized}`);
  };

  return (
    <AuthShell
      title="استعادة كلمة المرور"
      subtitle="أدخل رقم هاتفك وسنرسل إليك رمزًا لإعادة التعيين"
      role={role}
      onBack={() => history.push(`/auth/${role}/login`)}
      footer={
        <button type="button" className="dz-btn dz-btn--primary" onClick={submit}>
          إرسال رمز التحقق
        </button>
      }
    >
      <form className="dz-stack" onSubmit={submit}>
        <Field label="رقم الهاتف" hint="نفس الرقم المسجل في حسابك">
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

        {error && <Banner tone="danger">{error}</Banner>}

        <button
          type="button"
          className="dz-btn dz-btn--ghost dz-btn--sm"
          style={{ width: '100%' }}
          onClick={() => history.push(`/auth/${role}/login`)}
        >
          تذكرتها؟ عد لتسجيل الدخول
        </button>
      </form>
    </AuthShell>
  );
}
