import React, { useState } from 'react';
import { useHistory, useParams, useLocation } from 'react-router-dom';
import { Banner } from '../../components/common';
import { AuthShell, PasswordField, CodeInput } from './AuthShell';
import { isValidCode, passwordIssue } from '../../lib/validation';
import { IconCheck } from '../../components/Icons';

export default function ResetPassword() {
  const { role } = useParams();
  const history = useHistory();
  const phone = new URLSearchParams(useLocation().search).get('phone') || '';

  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  const submit = () => {
    if (!isValidCode(code)) return setError('أدخل الرمز المكوّن من 4 أرقام');

    const issue = passwordIssue(password);
    if (issue) return setError(issue);
    if (password !== confirm) return setError('كلمتا المرور غير متطابقتين');

    // No backend to store a password against; the flow ends at the confirmation.
    setDone(true);
    return undefined;
  };

  if (done) {
    return (
      <AuthShell title="تم تغيير كلمة المرور" role={role} onBack={() => history.push(`/auth/${role}/login`)}>
        <div className="dz-stack" style={{ alignItems: 'center', textAlign: 'center', paddingTop: 20 }}>
          <span
            className="dz-avatar"
            style={{ width: 72, height: 72, background: 'var(--c-success-bg)', color: 'var(--c-success)' }}
          >
            <IconCheck size={32} />
          </span>
          <p className="dz-muted" style={{ lineHeight: 1.8 }}>
            يمكنك الآن تسجيل الدخول بكلمة المرور الجديدة.
          </p>
          <button
            type="button"
            className="dz-btn dz-btn--primary"
            onClick={() => history.push(`/auth/${role}/login`)}
          >
            تسجيل الدخول
          </button>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title="كلمة مرور جديدة"
      subtitle={phone ? `أدخل الرمز المرسل إلى ${phone}` : 'أدخل الرمز المرسل إلى هاتفك'}
      role={role}
      onBack={() => history.push(`/auth/${role}/forgot`)}
      footer={
        <button type="button" className="dz-btn dz-btn--primary" onClick={submit}>
          حفظ كلمة المرور
        </button>
      }
    >
      <div className="dz-stack">
        <CodeInput value={code} onChange={(v) => { setCode(v); setError(''); }} />

        <PasswordField
          label="كلمة المرور الجديدة"
          value={password}
          autoComplete="new-password"
          hint="8 أحرف على الأقل، وتجمع بين حروف وأرقام"
          onChange={(v) => { setPassword(v); setError(''); }}
        />

        <PasswordField
          label="تأكيد كلمة المرور"
          value={confirm}
          autoComplete="new-password"
          onChange={(v) => { setConfirm(v); setError(''); }}
        />

        {error && <Banner tone="danger">{error}</Banner>}

        <Banner tone="accent">نموذج أولي: أي 4 أرقام تُقبل كرمز تحقق.</Banner>
      </div>
    </AuthShell>
  );
}
