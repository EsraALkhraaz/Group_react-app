import React from 'react';
import { useHistory } from 'react-router-dom';
import { TopBar, BottomNav, Banner } from '../components/common';
import { IconUser, IconForward, IconShield, IconCap, IconWallet } from '../components/Icons';
import { gradeById } from '../data/catalog';
import { useApp } from '../state/AppContext';

export default function Profile() {
  const history = useHistory();
  const { profile, role, children, setRole, resetPrototype, bookings } = useApp();

  const rows = [
    { label: 'بياناتي الشخصية', icon: <IconUser size={18} /> },
    { label: 'طرق الدفع والفواتير', icon: <IconWallet size={18} /> },
    { label: 'الخصوصية والأمان', icon: <IconShield size={18} /> },
  ];

  return (
    <div className="dz-screen">
      <TopBar title="حسابي" />

      <div className="dz-body">
        <div className="dz-card dz-card--raised dz-row" style={{ marginBottom: 16 }}>
          <span className="dz-avatar" style={{ background: 'var(--c-blue-bg)', color: 'var(--c-blue-text)' }}>
            {profile.name.charAt(0)}
          </span>
          <span className="dz-grow">
            <span style={{ fontWeight: 800, fontSize: 15, display: 'block' }}>{profile.name}</span>
            <span className="dz-muted" style={{ display: 'block', marginTop: 2 }}>{profile.phone}</span>
          </span>
          <span className="dz-chip dz-chip--sm dz-chip--green">
            {role === 'parent' ? 'ولي أمر' : role === 'teacher' ? 'مدرس' : 'طالب'}
          </span>
        </div>

        {role === 'parent' && (
          <section style={{ marginBottom: 18 }}>
            <div className="dz-section-title"><span>أبنائي</span></div>
            <div className="dz-stack dz-stack--sm">
              {children.map((c) => {
                const count = bookings.filter((b) => b.learnerName === c.name).length;
                return (
                  <div key={c.id} className="dz-card dz-card--soft dz-row">
                    <span className="dz-avatar dz-avatar--sm" style={{ background: '#fff', color: 'var(--c-blue-text)' }}>
                      {c.name.charAt(0)}
                    </span>
                    <span className="dz-grow">
                      <span style={{ fontWeight: 700, fontSize: 14, display: 'block' }}>{c.name}</span>
                      <span className="dz-muted" style={{ display: 'block', marginTop: 2 }}>
                        {gradeById(c.gradeId)?.name} · {count} حجز
                      </span>
                    </span>
                    <IconForward size={16} />
                  </div>
                );
              })}
              <button type="button" className="dz-btn dz-btn--ghost dz-btn--sm" style={{ width: '100%' }}>
                + إضافة ابن/ابنة
              </button>
            </div>
          </section>
        )}

        <section style={{ marginBottom: 18 }}>
          <div className="dz-section-title"><span>الإعدادات</span></div>
          <div className="dz-card">
            {rows.map((r) => (
              <button key={r.label} type="button" className="dz-listrow">
                {r.icon}
                <span className="dz-grow" style={{ fontSize: 14, fontWeight: 600 }}>{r.label}</span>
                <IconForward size={16} />
              </button>
            ))}
          </div>
        </section>

        <section>
          <div className="dz-section-title"><span>أدوات النموذج الأولي</span></div>
          <div className="dz-stack dz-stack--sm">
            <Banner tone="yellow">
              للاستكشاف فقط: يمكنك التنقل بين واجهة ولي الأمر وواجهة المدرس لرؤية دورة الحجز كاملة.
            </Banner>
            <button type="button" className="dz-btn dz-btn--ghost dz-btn--sm" style={{ width: '100%' }} onClick={() => { setRole('teacher'); history.push('/teacher'); }}>
              <IconCap size={16} /> الانتقال إلى واجهة المدرس
            </button>
            <button type="button" className="dz-btn dz-btn--ghost dz-btn--sm" style={{ width: '100%' }} onClick={() => history.push('/')}>
              تغيير نوع الحساب
            </button>
            <button type="button" className="dz-btn dz-btn--danger dz-btn--sm" style={{ width: '100%' }} onClick={resetPrototype}>
              إعادة ضبط البيانات التجريبية
            </button>
          </div>
        </section>
      </div>

      <BottomNav active="profile" />
    </div>
  );
}
