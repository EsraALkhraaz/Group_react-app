import React from 'react';
import { useHistory } from 'react-router-dom';
import { TopBar, BottomNav, Banner } from '../components/common';
import { IconUser, IconForward, IconShield, IconWallet, IconBell } from '../components/Icons';
import { subjectById } from '../data/catalog';
import { useApp } from '../state/AppContext';

const ME = 't1';

const ROLE_LABEL = { student: 'طالب', parent: 'ولي أمر', teacher: 'مدرس' };

export default function Account() {
  const history = useHistory();
  const { base, role, profile, resetPrototype, teacherFor, signOut } = useApp();

  const isTeacher = role === 'teacher';
  const teacher = isTeacher ? teacherFor(ME) : null;
  const displayName = isTeacher ? teacher.name : profile.name;

  return (
    <div className="dz-screen">
      <TopBar title={isTeacher ? 'ملفي' : 'حسابي'} />

      <div className="dz-body">
        <div className="dz-card dz-card--raised dz-row" style={{ marginBottom: 16 }}>
          <span className="dz-avatar" style={{ background: 'var(--c-primary-bg)', color: 'var(--c-primary-text)' }}>
            {displayName.charAt(0)}
          </span>
          <span className="dz-grow">
            <span style={{ fontWeight: 800, fontSize: 15, display: 'block' }}>{displayName}</span>
            <span className="dz-muted" style={{ display: 'block', marginTop: 2 }}>{profile.phone}</span>
          </span>
          <span className="dz-chip dz-chip--sm dz-chip--success">{ROLE_LABEL[role]}</span>
        </div>

        {isTeacher && (
          <section style={{ marginBottom: 18 }}>
            <div className="dz-section-title">
              <span>ملفي العام</span>
              <button type="button" className="dz-btn dz-btn--ghost dz-btn--sm" onClick={() => history.push(`${base}/edit`)}>
                تعديل الملف
              </button>
            </div>
            <div className="dz-card">
              <div className="dz-muted" style={{ lineHeight: 1.7 }}>
                {teacher.bio.length > 140 ? `${teacher.bio.slice(0, 140)}…` : teacher.bio}
              </div>
              <div className="dz-chiprow" style={{ marginTop: 10, flexWrap: 'wrap' }}>
                {teacher.subjects.map((s) => (
                  <span key={s} className="dz-chip dz-chip--sm dz-chip--primary">{subjectById(s)?.name}</span>
                ))}
                <span className="dz-chip dz-chip--sm dz-chip--accent">{teacher.grades.length} صفوف</span>
                <span className="dz-chip dz-chip--sm">{teacher.qualifications.length} مؤهلات</span>
              </div>
              <button
                type="button"
                className="dz-btn dz-btn--ghost dz-btn--sm"
                style={{ width: '100%', marginTop: 12 }}
                onClick={() => history.push(`${base}/preview`)}
              >
                معاينة ملفي كما يراه الطالب
              </button>
            </div>
          </section>
        )}

        <section style={{ marginBottom: 18 }}>
          <div className="dz-section-title"><span>الإعدادات</span></div>
          <div className="dz-card">
            <button type="button" className="dz-listrow" onClick={() => history.push(`${base}/account/profile`)}>
              <IconUser size={18} />
              <span className="dz-grow" style={{ fontSize: 14, fontWeight: 600 }}>بياناتي الشخصية</span>
              <IconForward size={16} />
            </button>
            <button type="button" className="dz-listrow" onClick={() => history.push(`${base}/notifications`)}>
              <IconBell size={18} />
              <span className="dz-grow" style={{ fontSize: 14, fontWeight: 600 }}>الإشعارات</span>
              <IconForward size={16} />
            </button>
            <button type="button" className="dz-listrow" onClick={() => history.push(`${base}/account/payments`)}>
              <IconWallet size={18} />
              <span className="dz-grow" style={{ fontSize: 14, fontWeight: 600 }}>
                {isTeacher ? 'المستحقات والفواتير' : 'المدفوعات والفواتير'}
              </span>
              <IconForward size={16} />
            </button>
            <button type="button" className="dz-listrow" onClick={() => history.push(`${base}/account/security`)}>
              <IconShield size={18} />
              <span className="dz-grow" style={{ fontSize: 14, fontWeight: 600 }}>الخصوصية والأمان</span>
              <IconForward size={16} />
            </button>
          </div>
        </section>

        <section>
          <div className="dz-section-title"><span>الحساب</span></div>
          <div className="dz-stack dz-stack--sm">
            <Banner tone="accent">
              نموذج أولي: تسجيل الخروج يعيدك إلى المدخل الرئيسي لتجرّب واجهة أخرى.
            </Banner>
            <button
              type="button"
              className="dz-btn dz-btn--ghost dz-btn--sm"
              style={{ width: '100%' }}
              onClick={() => { signOut(); history.push('/'); }}
            >
              تسجيل الخروج
            </button>
            <button type="button" className="dz-btn dz-btn--danger dz-btn--sm" style={{ width: '100%' }} onClick={resetPrototype}>
              إعادة ضبط البيانات التجريبية
            </button>
          </div>
        </section>
      </div>

      <BottomNav active="account" />
    </div>
  );
}
