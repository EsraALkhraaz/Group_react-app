import React from 'react';
import { useHistory } from 'react-router-dom';
import { useApp } from '../state/AppContext';
import logo from '../assets/darsy-logo.png';

export default function Welcome() {
  const history = useHistory();
  const { setRole } = useApp();

  const enterAs = (role, path) => {
    setRole(role);
    history.push(path);
  };

  return (
    <div className="dz-screen" style={{ background: 'var(--c-pastel)' }}>
      <div className="dz-body dz-body--pastel" style={{ display: 'flex', flexDirection: 'column' }}>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px 0' }}>
          <img src={logo} alt="درسي — Darsy" style={{ width: 210, height: 'auto' }} />
        </div>

        <h1 className="dz-h1" style={{ marginBottom: 10 }}>
          ابحث عن أفضل مدرس
          <br />
          ليحقق طفلك أهدافه
        </h1>
        <p className="dz-muted" style={{ marginTop: 0, marginBottom: 22 }}>
          ابحث، قارن، احجز وادفع — كل شيء في مكان واحد، وفي ليبيا.
        </p>

        <div className="dz-stack">
          <button type="button" className="dz-btn dz-btn--primary" onClick={() => enterAs('parent', '/home')}>
            الدخول كولي أمر
          </button>
          <button type="button" className="dz-btn dz-btn--ghost" onClick={() => enterAs('student', '/home')}>
            الدخول كطالب
          </button>
          <button type="button" className="dz-btn dz-btn--ghost" onClick={() => enterAs('teacher', '/teacher')}>
            الدخول كمدرس
          </button>
        </div>

        <p className="dz-faint" style={{ textAlign: 'center', marginTop: 16 }}>
          نموذج أولي للاستكشاف — البيانات تجريبية
        </p>
      </div>
    </div>
  );
}
