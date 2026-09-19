import React, { useState } from 'react';
import { useHistory, useParams, Redirect } from 'react-router-dom';
import { Field, Banner } from '../../components/common';
import { AuthShell, PasswordField, ROLE_LABEL } from './AuthShell';
import { GRADES } from '../../data/catalog';
import { normalizePhone, isValidPhone, passwordIssue } from '../../lib/validation';
import { useApp } from '../../state/AppContext';

const NOTE_BY_ROLE = {
  student: 'ستتمكن من البحث والحجز والدفع لنفسك.',
  parent: 'ستضيف أبناءك بعد التسجيل، وتحجز لكل واحد منهم.',
  teacher: 'يُراجع فريق درسي هويتك قبل ظهور ملفك للطلاب.',
};

export default function Signup() {
  const { role } = useParams();
  const history = useHistory();
  const { signUp, accountFor } = useApp();

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [gradeId, setGradeId] = useState('g6');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [error, setError] = useState('');

  // Nobody signs themselves up as the platform's admin.
  const blocked = role === 'admin';

  const submit = (e) => {
    e.preventDefault();
    const normalized = normalizePhone(phone);

    if (name.trim().length < 3) return setError('أدخل اسمك الكامل');
    if (!isValidPhone(normalized)) return setError('أدخل رقم هاتف ليبي صحيح يبدأ بـ09');
    if (accountFor(role, normalized)) return setError('هذا الرقم مسجل بالفعل — سجّل الدخول بدلاً من ذلك');

    const issue = passwordIssue(password);
    if (issue) return setError(issue);
    if (password !== confirm) return setError('كلمتا المرور غير متطابقتين');
    if (!agreed) return setError('يجب الموافقة على الشروط للمتابعة');

    signUp({ role, name, phone: normalized, gradeId });
    history.push(`/auth/${role}/verify`);
    return undefined;
  };

  if (blocked) return <Redirect to="/auth/admin/login" />;

  return (
    <AuthShell
      title="إنشاء حساب"
      subtitle={`حساب جديد كـ${ROLE_LABEL[role]}`}
      role={role}
      onBack={() => history.push(`/auth/${role}/login`)}
      footer={
        <>
          <button type="button" className="dz-btn dz-btn--primary" onClick={submit}>
            متابعة
          </button>
          <button
            type="button"
            className="dz-btn dz-btn--ghost dz-btn--sm"
            style={{ width: '100%' }}
            onClick={() => history.push(`/auth/${role}/login`)}
          >
            لديك حساب؟ سجّل الدخول
          </button>
        </>
      }
    >
      <form className="dz-stack" onSubmit={submit}>
        <Field label="الاسم الكامل">
          <input
            className="dz-input"
            value={name}
            autoComplete="name"
            onChange={(e) => { setName(e.target.value); setError(''); }}
            placeholder="مثال: سارة المبروك"
          />
        </Field>

        <Field label="رقم الهاتف" hint="سنرسل إليه رمز تحقق">
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

        {role === 'student' && (
          <Field label="صفك الدراسي">
            <select className="dz-select" value={gradeId} onChange={(e) => setGradeId(e.target.value)}>
              {GRADES.map((g) => (
                <option key={g.id} value={g.id}>{g.name} — {g.stage}</option>
              ))}
            </select>
          </Field>
        )}

        <PasswordField
          label="كلمة المرور"
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

        <label className="dz-row" style={{ alignItems: 'flex-start', gap: 10 }}>
          <input
            type="checkbox"
            checked={agreed}
            onChange={(e) => { setAgreed(e.target.checked); setError(''); }}
            style={{ width: 20, height: 20, marginTop: 2, accentColor: 'var(--c-primary)' }}
          />
          <span className="dz-muted" style={{ lineHeight: 1.7 }}>
            أوافق على شروط الاستخدام وسياسة الخصوصية، وأقرّ بصحة البيانات المدخلة.
          </span>
        </label>

        {error && <Banner tone="danger">{error}</Banner>}

        <Banner tone="primary">{NOTE_BY_ROLE[role]}</Banner>
      </form>
    </AuthShell>
  );
}
