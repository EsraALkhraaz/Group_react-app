import React from 'react';
import { useHistory } from 'react-router-dom';
import { IconCap } from '../components/Icons';
import { useApp } from '../state/AppContext';

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
        <div className="dz-row dz-row--between" style={{ paddingTop: 8 }}>
          <span className="dz-logo">
            درسي
            <span className="dz-logo__dot" />
          </span>
          <span className="dz-faint">Darsy</span>
        </div>

        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '28px 0' }}>
          <div className="dz-illustration">
            <div className="dz-illustration__ring">
              <IconCap size={58} strokeWidth={1.5} />
            </div>
            <span className="dz-illustration__dot" style={{ top: -10, insetInlineEnd: -10, width: 26, height: 26, background: 'var(--c-yellow)' }} />
            <span className="dz-illustration__dot" style={{ bottom: 8, insetInlineStart: -14, width: 18, height: 18, background: 'var(--c-coral)' }} />
          </div>
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
