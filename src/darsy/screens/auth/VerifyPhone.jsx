import React, { useState } from 'react';
import { useHistory, useParams } from 'react-router-dom';
import { Banner } from '../../components/common';
import { AuthShell, CodeInput } from './AuthShell';
import { isValidCode } from '../../lib/validation';
import { useApp, BASE_BY_ROLE } from '../../state/AppContext';

export default function VerifyPhone() {
  const { role } = useParams();
  const history = useHistory();
  const { session, confirmPhone } = useApp();

  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [resent, setResent] = useState(false);

  const submit = () => {
    if (!isValidCode(code)) {
      setError('أدخل الرمز المكوّن من 4 أرقام');
      return;
    }
    confirmPhone();
    history.push(`${BASE_BY_ROLE[role]}/home`);
  };

  return (
    <AuthShell
      title="تأكيد رقم هاتفك"
      subtitle={session ? `أرسلنا رمزًا إلى ${session.phone}` : 'أرسلنا رمز تحقق إلى رقمك'}
      role={role}
      onBack={() => history.push(`/auth/${role}/signup`)}
      footer={
        <button type="button" className="dz-btn dz-btn--primary" disabled={!isValidCode(code)} onClick={submit}>
          تأكيد ومتابعة
        </button>
      }
    >
      <div className="dz-stack">
        <CodeInput value={code} onChange={(v) => { setCode(v); setError(''); }} />

        <button
          type="button"
          className="dz-btn dz-btn--ghost dz-btn--sm"
          style={{ width: '100%' }}
          onClick={() => setResent(true)}
        >
          {resent ? 'أُعيد إرسال الرمز' : 'لم يصلك الرمز؟ أعد الإرسال'}
        </button>

        {error && <Banner tone="danger">{error}</Banner>}

        <Banner tone="accent">
          نموذج أولي: أي 4 أرقام تُقبل — لا تُرسل رسائل فعلية بعد.
        </Banner>
      </div>
    </AuthShell>
  );
}
