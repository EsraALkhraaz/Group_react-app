import React from 'react';
import { useHistory } from 'react-router-dom';
import { IconPerson, IconUsers, IconCap, IconForward } from '../components/Icons';
import { useApp, BASE_BY_ROLE } from '../state/AppContext';
import logo from '../assets/darsy-logo.png';

// Three interfaces, three doors. Nothing inside one leads into another.
const DOORS = [
  {
    role: 'student',
    title: 'طالب',
    body: 'ابحث عن مدرسك، احجز حصتك، وادفع — لنفسك مباشرة.',
    Icon: IconPerson,
    tint: 'var(--c-primary-bg)',
    color: 'var(--c-primary-text)',
  },
  {
    role: 'parent',
    title: 'ولي أمر',
    body: 'أدر تعليم أبنائك: احجز لكل ابن، وتابع حصصه ومدفوعاته.',
    Icon: IconUsers,
    tint: 'var(--c-accent-bg)',
    color: 'var(--c-accent-text)',
  },
  {
    role: 'teacher',
    title: 'مدرس',
    body: 'اعرض ملفك وأسعارك، استقبل الطلبات، وتابع أرباحك.',
    Icon: IconCap,
    tint: 'var(--c-success-bg)',
    color: 'var(--c-success)',
  },
];

export default function Entrance() {
  const history = useHistory();
  const { setRole, session } = useApp();

  const enter = (role) => {
    setRole(role);
    // Signed in already for this role? Go straight in, otherwise sign in first.
    const signedIn = session && session.role === role;
    history.push(signedIn ? `${BASE_BY_ROLE[role]}/home` : `/auth/${role}/login`);
  };

  return (
    <div className="dz-screen" style={{ background: 'var(--c-pastel)' }}>
      <div className="dz-body dz-body--pastel" style={{ display: 'flex', flexDirection: 'column' }}>
        <div style={{ textAlign: 'center', paddingTop: 18, paddingBottom: 10 }}>
          <img src={logo} alt="درسي — Darsy" style={{ width: 150, height: 'auto' }} />
        </div>

        <h1 className="dz-h1" style={{ fontSize: 22, textAlign: 'center', marginBottom: 6 }}>
          كيف تريد استخدام درسي؟
        </h1>
        <p className="dz-muted" style={{ textAlign: 'center', marginTop: 0, marginBottom: 20 }}>
          لكل نوع حساب واجهته الخاصة
        </p>

        <div className="dz-stack">
          {DOORS.map(({ role, title, body, Icon, tint, color }) => (
            <button
              key={role}
              type="button"
              aria-label={`الدخول كـ${title}`}
              className="dz-card dz-card--raised dz-row"
              style={{ width: '100%', textAlign: 'start', padding: 16, gap: 14 }}
              onClick={() => enter(role)}
            >
              <span
                className="dz-avatar"
                style={{ background: tint, color, width: 52, height: 52 }}
                aria-hidden="true"
              >
                <Icon size={24} />
              </span>
              <span className="dz-grow">
                <span style={{ fontWeight: 800, fontSize: 16, display: 'block' }}>{title}</span>
                <span className="dz-muted" style={{ display: 'block', marginTop: 4, lineHeight: 1.6 }}>
                  {body}
                </span>
              </span>
              <IconForward size={18} />
            </button>
          ))}
        </div>

        {/* Staff, not a fourth kind of user: kept out of the three doors. */}
        <button
          type="button"
          className="dz-faint"
          style={{
            background: 'none', border: 'none', marginTop: 18,
            fontWeight: 700, textDecoration: 'underline', alignSelf: 'center',
          }}
          onClick={() => enter('admin')}
        >
          دخول فريق درسي
        </button>

        <p className="dz-faint" style={{ textAlign: 'center', marginTop: 14 }}>
          نموذج أولي للاستكشاف — البيانات تجريبية
        </p>
      </div>
    </div>
  );
}
