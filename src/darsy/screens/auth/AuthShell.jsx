import React, { useState } from 'react';
import { useHistory } from 'react-router-dom';
import { Field } from '../../components/common';
import { IconBack } from '../../components/Icons';
import logo from '../../assets/darsy-logo.png';

export const ROLE_LABEL = {
  student: 'طالب', parent: 'ولي أمر', teacher: 'مدرس', admin: 'إدارة درسي',
};

export function AuthShell({ title, subtitle, role, onBack, children, footer }) {
  const history = useHistory();
  return (
    <div className="dz-screen" style={{ background: 'var(--c-pastel)' }}>
      <div className="dz-body dz-body--pastel" style={{ display: 'flex', flexDirection: 'column' }}>
        <div className="dz-row" style={{ paddingBottom: 6 }}>
          <button
            type="button"
            className="dz-iconbtn"
            aria-label="رجوع"
            onClick={() => (onBack ? onBack() : history.goBack())}
          >
            <IconBack size={17} />
          </button>
          <span className="dz-grow" />
          {role && <span className="dz-chip dz-chip--sm dz-chip--primary">{ROLE_LABEL[role]}</span>}
        </div>

        <div style={{ textAlign: 'center', padding: '6px 0 18px' }}>
          <img src={logo} alt="درسي — Darsy" style={{ width: 110, height: 'auto' }} />
        </div>

        <h1 className="dz-h1" style={{ fontSize: 22, marginBottom: 6 }}>{title}</h1>
        {subtitle && <p className="dz-muted" style={{ marginTop: 0, marginBottom: 18 }}>{subtitle}</p>}

        {children}
      </div>

      {footer && <div className="dz-footer-cta" style={{ background: 'var(--c-pastel)', borderTop: 'none' }}>{footer}</div>}
    </div>
  );
}

// A password field that can reveal what was typed — on a phone, a hidden
// password is the most common reason a correct one gets rejected.
export function PasswordField({ label, value, onChange, error, hint, autoComplete }) {
  const [shown, setShown] = useState(false);
  return (
    <Field label={label} hint={error || hint}>
      <span style={{ position: 'relative', display: 'block' }}>
        <input
          className="dz-input"
          type={shown ? 'text' : 'password'}
          value={value}
          autoComplete={autoComplete}
          onChange={(e) => onChange(e.target.value)}
          style={{ paddingInlineEnd: 68, borderColor: error ? 'var(--c-danger)' : undefined }}
        />
        <button
          type="button"
          onClick={() => setShown(!shown)}
          style={{
            position: 'absolute', insetInlineEnd: 10, top: '50%', transform: 'translateY(-50%)',
            background: 'none', border: 'none', color: 'var(--c-primary-text)',
            fontSize: 12, fontWeight: 700, padding: 6,
          }}
        >
          {shown ? 'إخفاء' : 'إظهار'}
        </button>
      </span>
    </Field>
  );
}

// Four separate boxes so the code is easy to read back from an SMS.
export function CodeInput({ value, onChange }) {
  const set = (i, digit) => {
    const next = value.split('');
    next[i] = digit.replace(/\D/g, '').slice(-1) || '';
    onChange(next.join('').slice(0, 4));
  };

  return (
    <div className="dz-row" style={{ justifyContent: 'center', gap: 10, direction: 'ltr' }}>
      {[0, 1, 2, 3].map((i) => (
        <input
          key={i}
          className="dz-input"
          inputMode="numeric"
          maxLength={1}
          aria-label={`الرقم ${i + 1} من رمز التحقق`}
          value={value[i] || ''}
          onChange={(e) => {
            set(i, e.target.value);
            const next = e.target.parentNode.children[i + 1];
            if (e.target.value && next) next.focus();
          }}
          style={{ width: 56, textAlign: 'center', fontSize: 20, fontWeight: 800, padding: 0 }}
        />
      ))}
    </div>
  );
}
