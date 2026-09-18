import React, { useState } from 'react';
import { useHistory } from 'react-router-dom';
import { BottomNav, TopBar, Field } from '../components/common';
import { SUBJECTS, GRADES, LANGUAGES, CITIES } from '../data/catalog';

export default function Search() {
  const history = useHistory();
  const [subject, setSubject] = useState('');
  const [grade, setGrade] = useState('');
  const [language, setLanguage] = useState('');
  const [mode, setMode] = useState('');
  const [sessionType, setSessionType] = useState('');
  const [city, setCity] = useState('');

  const submit = (e) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (subject) params.set('subject', subject);
    if (grade) params.set('grade', grade);
    if (language) params.set('language', language);
    if (mode) params.set('mode', mode);
    if (sessionType) params.set('sessionType', sessionType);
    if (city) params.set('city', city);
    history.push(`/results?${params.toString()}`);
  };

  return (
    <div className="dz-screen">
      <TopBar title="ابحث عن مدرس" subtitle="حدد ما تحتاجه وسنعرض المدرسين المطابقين" />

      <form className="dz-body" onSubmit={submit}>
        <div className="dz-stack">
          <Field label="المادة">
            <select className="dz-select" value={subject} onChange={(e) => setSubject(e.target.value)}>
              <option value="">كل المواد</option>
              {SUBJECTS.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </Field>

          <Field label="الصف الدراسي">
            <select className="dz-select" value={grade} onChange={(e) => setGrade(e.target.value)}>
              <option value="">كل الصفوف</option>
              {GRADES.map((g) => (
                <option key={g.id} value={g.id}>{g.name} — {g.stage}</option>
              ))}
            </select>
          </Field>

          <Field label="لغة الشرح">
            <select className="dz-select" value={language} onChange={(e) => setLanguage(e.target.value)}>
              <option value="">أي لغة</option>
              {LANGUAGES.map((l) => (
                <option key={l.id} value={l.id}>{l.name}</option>
              ))}
            </select>
          </Field>

          <div>
            <div className="dz-label" style={{ marginBottom: 8 }}>نمط الحصة</div>
            <div className="dz-chiprow">
              {[
                { v: '', l: 'الكل' },
                { v: 'online', l: 'أونلاين' },
                { v: 'f2f', l: 'حضوري' },
              ].map((o) => (
                <button
                  key={o.v || 'all'}
                  type="button"
                  className={`dz-chip${mode === o.v ? ' dz-chip--active' : ''}`}
                  onClick={() => setMode(o.v)}
                >
                  {o.l}
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="dz-label" style={{ marginBottom: 8 }}>نوع الجلسة</div>
            <div className="dz-chiprow">
              {[
                { v: '', l: 'الكل' },
                { v: 'individual', l: 'فردية' },
                { v: 'group', l: 'جماعية' },
              ].map((o) => (
                <button
                  key={o.v || 'all'}
                  type="button"
                  className={`dz-chip${sessionType === o.v ? ' dz-chip--active' : ''}`}
                  onClick={() => setSessionType(o.v)}
                >
                  {o.l}
                </button>
              ))}
            </div>
          </div>

          {mode !== 'online' && (
            <Field label="المدينة" hint="تظهر للحصص الحضورية فقط — المدرس يحدد مناطق التدريس، والعنوان الدقيق يُتبادل بعد تأكيد الحجز">
              <select className="dz-select" value={city} onChange={(e) => setCity(e.target.value)}>
                <option value="">كل المدن</option>
                {CITIES.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </Field>
          )}
        </div>
      </form>

      <div className="dz-footer-cta">
        <button type="button" className="dz-btn dz-btn--primary" onClick={submit}>
          عرض المدرسين
        </button>
      </div>

      <BottomNav active="search" />
    </div>
  );
}
