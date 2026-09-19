import React, { useState } from 'react';
import { useHistory } from 'react-router-dom';
import { TopBar, Field, Banner, EmptyState } from '../components/common';
import { IconClose, IconCheck } from '../components/Icons';
import { SUBJECTS, GRADES, LANGUAGES, CITIES } from '../data/catalog';
import { useApp } from '../state/AppContext';

// The prototype signs the teacher in as Ahmed.
const ME = 't1';

function Toggles({ options, selected, onToggle }) {
  return (
    <div className="dz-chiprow" style={{ flexWrap: 'wrap', overflowX: 'visible' }}>
      {options.map((o) => {
        const on = selected.includes(o.id);
        return (
          <button
            key={o.id}
            type="button"
            className={`dz-chip${on ? ' dz-chip--active' : ''}`}
            onClick={() => onToggle(o.id)}
          >
            {on && <IconCheck size={12} />}
            {o.name}
          </button>
        );
      })}
    </div>
  );
}

export default function TeacherProfileEdit() {
  const history = useHistory();
  const { teacherFor, setTeacherProfile } = useApp();
  const teacher = teacherFor(ME);

  const [name, setName] = useState(teacher?.name || '');
  const [bio, setBio] = useState(teacher?.bio || '');
  const [qualifications, setQualifications] = useState(teacher?.qualifications || []);
  const [subjects, setSubjects] = useState(teacher?.subjects || []);
  const [grades, setGrades] = useState(teacher?.grades || []);
  const [languages, setLanguages] = useState(teacher?.languages || []);
  const [city, setCity] = useState(teacher?.city || '');
  const [areas, setAreas] = useState((teacher?.areas || []).join('، '));
  const [saved, setSaved] = useState(false);

  if (!teacher) return <EmptyState title="لا يوجد ملف" body="" />;

  const toggle = (list, setList) => (id) =>
    setList(list.includes(id) ? list.filter((x) => x !== id) : [...list, id]);

  const setQualification = (i, value) =>
    setQualifications(qualifications.map((q, idx) => (idx === i ? value : q)));

  const valid = name.trim().length >= 3 && bio.trim().length >= 20 && subjects.length > 0 && grades.length > 0;

  const save = () => {
    setTeacherProfile(ME, {
      name: name.trim(),
      bio: bio.trim(),
      qualifications: qualifications.map((q) => q.trim()).filter(Boolean),
      subjects,
      grades,
      languages,
      city,
      areas: areas.split(/[،,]/).map((a) => a.trim()).filter(Boolean),
    });
    setSaved(true);
    window.setTimeout(() => history.push('/teacher/account'), 700);
  };

  return (
    <div className="dz-screen">
      <TopBar
        back
        title="ملفي الشخصي"
        subtitle="ما يراه الطلاب عنك"
        onBack={() => history.push('/teacher/account')}
        right={
          <button
            type="button"
            className="dz-btn dz-btn--ghost dz-btn--sm"
            onClick={() => history.push('/teacher/preview')}
          >
            معاينة
          </button>
        }
      />

      <div className="dz-body" style={{ paddingTop: 4 }}>
        <div className="dz-stack">
          <Field label="الاسم الكامل" hint="يظهر في نتائج البحث وفي ملفك">
            <input className="dz-input" value={name} onChange={(e) => setName(e.target.value)} />
          </Field>

          <Field label="نبذة عنك" hint="اشرح أسلوبك في التدريس — 20 حرفًا على الأقل">
            <textarea
              className="dz-textarea"
              style={{ minHeight: 120 }}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="مثال: مدرس رياضيات بخبرة 9 سنوات، أركّز على بناء الأساس قبل الحفظ..."
            />
          </Field>

          <div>
            <div className="dz-label" style={{ marginBottom: 8 }}>المؤهلات والخبرات</div>
            <div className="dz-stack dz-stack--sm">
              {qualifications.length === 0 && (
                <div className="dz-faint">لم تضف أي مؤهل بعد.</div>
              )}
              {qualifications.map((q, i) => (
                <div key={i} className="dz-row" style={{ gap: 8 }}>
                  <input
                    className="dz-input dz-grow"
                    value={q}
                    onChange={(e) => setQualification(i, e.target.value)}
                    placeholder="مثال: بكالوريوس رياضيات — جامعة طرابلس"
                  />
                  <button
                    type="button"
                    className="dz-iconbtn"
                    aria-label="حذف المؤهل"
                    onClick={() => setQualifications(qualifications.filter((_, idx) => idx !== i))}
                  >
                    <IconClose size={15} />
                  </button>
                </div>
              ))}
              <button
                type="button"
                className="dz-btn dz-btn--ghost dz-btn--sm"
                style={{ width: '100%' }}
                onClick={() => setQualifications([...qualifications, ''])}
              >
                + إضافة مؤهل أو خبرة
              </button>
            </div>
          </div>

          <div>
            <div className="dz-label" style={{ marginBottom: 8 }}>المواد التي تدرّسها</div>
            <Toggles options={SUBJECTS} selected={subjects} onToggle={toggle(subjects, setSubjects)} />
          </div>

          <div>
            <div className="dz-label" style={{ marginBottom: 8 }}>الصفوف الدراسية</div>
            <Toggles options={GRADES} selected={grades} onToggle={toggle(grades, setGrades)} />
          </div>

          <div>
            <div className="dz-label" style={{ marginBottom: 8 }}>لغات الشرح</div>
            <Toggles options={LANGUAGES} selected={languages} onToggle={toggle(languages, setLanguages)} />
          </div>

          {teacher.pricing.f2f && (
            <>
              <Field label="المدينة">
                <select className="dz-select" value={city} onChange={(e) => setCity(e.target.value)}>
                  {CITIES.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </Field>

              <Field label="مناطق التدريس الحضوري" hint="افصل بين المناطق بفاصلة — العنوان الدقيق يُتبادل بعد تأكيد الحجز">
                <input
                  className="dz-input"
                  value={areas}
                  onChange={(e) => setAreas(e.target.value)}
                  placeholder="حي الأندلس، قرقارش"
                />
              </Field>
            </>
          )}

          <Banner tone="accent">
            تعديل الاسم أو المؤهلات قد يستدعي إعادة التحقق من الإدارة قبل ظهوره للطلاب.
          </Banner>
        </div>
      </div>

      <div className="dz-footer-cta">
        {!valid && (
          <div className="dz-faint" style={{ textAlign: 'center' }}>
            أكمل الاسم والنبذة واختر مادة وصفًا واحدًا على الأقل
          </div>
        )}
        <button type="button" className="dz-btn dz-btn--primary" disabled={!valid || saved} onClick={save}>
          {saved ? 'تم الحفظ' : 'حفظ التغييرات'}
        </button>
      </div>
    </div>
  );
}
