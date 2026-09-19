import React, { useState } from 'react';
import { useHistory } from 'react-router-dom';
import { TopBar, Field, Banner } from '../../components/common';
import { IconCheck } from '../../components/Icons';
import { GRADES } from '../../data/catalog';
import { normalizePhone, isValidPhone } from '../../lib/validation';
import { useApp } from '../../state/AppContext';

const ME = 't1';

export default function PersonalDetails() {
  const history = useHistory();
  const {
    base, role, profile, children, studentGradeId,
    updateProfile, teacherFor,
  } = useApp();

  const [name, setName] = useState(profile.name);
  const [phone, setPhone] = useState(profile.phone);
  const [gradeId, setGradeId] = useState(studentGradeId || 'g6');
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);

  const phoneChanged = normalizePhone(phone) !== profile.phone;

  const save = () => {
    const normalized = normalizePhone(phone);
    if (name.trim().length < 3) return setError('أدخل اسمك الكامل');
    if (!isValidPhone(normalized)) return setError('أدخل رقم هاتف ليبي صحيح يبدأ بـ09');

    updateProfile({ name: name.trim(), phone: normalized, gradeId });
    setSaved(true);
    window.setTimeout(() => history.push(`${base}/account`), 700);
    return undefined;
  };

  return (
    <div className="dz-screen">
      <TopBar back title="بياناتي الشخصية" onBack={() => history.push(`${base}/account`)} />

      <div className="dz-body">
        <div className="dz-stack">
          <Field label="الاسم الكامل">
            <input
              className="dz-input"
              value={name}
              onChange={(e) => { setName(e.target.value); setError(''); }}
            />
          </Field>

          <Field
            label="رقم الهاتف"
            hint={phoneChanged ? 'تغيير الرقم يتطلب تأكيده برمز جديد' : 'رقم الدخول إلى حسابك'}
          >
            <input
              className="dz-input"
              type="tel"
              inputMode="tel"
              value={phone}
              onChange={(e) => { setPhone(e.target.value); setError(''); }}
              style={{ direction: 'ltr', textAlign: 'right' }}
            />
          </Field>

          {role === 'student' && (
            <Field label="صفي الدراسي" hint="يُستخدم لترشيح المدرسين المناسبين لك">
              <select className="dz-select" value={gradeId} onChange={(e) => setGradeId(e.target.value)}>
                {GRADES.map((g) => (
                  <option key={g.id} value={g.id}>{g.name} — {g.stage}</option>
                ))}
              </select>
            </Field>
          )}

          {role === 'parent' && (
            <div className="dz-card dz-card--soft">
              <div className="dz-h3" style={{ marginBottom: 6 }}>أبنائي</div>
              <div className="dz-muted" style={{ marginBottom: 10 }}>
                {children.length} مسجلون — بيانات كل ابن تُدار من تبويب «أبنائي».
              </div>
              <button
                type="button"
                className="dz-btn dz-btn--ghost dz-btn--sm"
                style={{ width: '100%' }}
                onClick={() => history.push(`${base}/children`)}
              >
                إدارة الأبناء
              </button>
            </div>
          )}

          {role === 'teacher' && (
            <div className="dz-card dz-card--soft">
              <div className="dz-h3" style={{ marginBottom: 6 }}>ملفك العام</div>
              <div className="dz-muted" style={{ marginBottom: 10 }}>
                النبذة والمؤهلات والمواد يراها الطلاب، وتُعدّل من صفحة الملف.
              </div>
              <button
                type="button"
                className="dz-btn dz-btn--ghost dz-btn--sm"
                style={{ width: '100%' }}
                onClick={() => history.push('/teacher/edit')}
              >
                تعديل ملفي العام
              </button>
              <div className="dz-faint" style={{ marginTop: 8 }}>
                الاسم المعروض حاليًا: {teacherFor(ME).name}
              </div>
            </div>
          )}

          {error && <Banner tone="danger">{error}</Banner>}
          {saved && <Banner tone="success" icon={<IconCheck size={18} />}>تم حفظ بياناتك</Banner>}
        </div>
      </div>

      <div className="dz-footer-cta">
        <button type="button" className="dz-btn dz-btn--primary" disabled={saved} onClick={save}>
          {saved ? 'تم الحفظ' : 'حفظ التغييرات'}
        </button>
      </div>
    </div>
  );
}
