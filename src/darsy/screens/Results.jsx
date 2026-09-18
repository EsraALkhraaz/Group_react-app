import React, { useMemo, useState } from 'react';
import { useHistory, useLocation } from 'react-router-dom';
import { TopBar, EmptyState, BottomNav } from '../components/common';
import TeacherCard from '../components/TeacherCard';
import { TEACHERS } from '../data/teachers';
import { subjectById, gradeById, languageById, cityById } from '../data/catalog';

const SORTS = [
  { id: 'rating', label: 'الأعلى تقييمًا' },
  { id: 'price', label: 'الأقل سعرًا' },
  { id: 'sessions', label: 'الأكثر حجزًا' },
];

export default function Results() {
  const history = useHistory();
  const query = new URLSearchParams(useLocation().search);
  const [sort, setSort] = useState('rating');

  const filters = {
    subject: query.get('subject') || '',
    grade: query.get('grade') || '',
    language: query.get('language') || '',
    mode: query.get('mode') || '',
    sessionType: query.get('sessionType') || '',
    city: query.get('city') || '',
  };

  const results = useMemo(() => {
    const priceOf = (t) => Math.min(...[t.pricing.online?.individual, t.pricing.f2f?.individual].filter(Boolean));

    const matched = TEACHERS.filter((t) => {
      if (!t.verified) return false; // unverified teachers are never listed publicly
      if (filters.subject && !t.subjects.includes(filters.subject)) return false;
      if (filters.grade && !t.grades.includes(filters.grade)) return false;
      if (filters.language && !t.languages.includes(filters.language)) return false;
      if (filters.mode === 'online' && !t.pricing.online) return false;
      if (filters.mode === 'f2f' && !t.pricing.f2f) return false;
      if (filters.city && t.city !== filters.city) return false;
      if (filters.sessionType === 'group') {
        const hasGroup = Boolean(t.pricing.online?.group || t.pricing.f2f?.group);
        if (!hasGroup) return false;
      }
      return true;
    });

    return matched.sort((a, b) => {
      if (sort === 'price') return priceOf(a) - priceOf(b);
      if (sort === 'sessions') return b.sessionsCount - a.sessionsCount;
      return b.rating - a.rating;
    });
  }, [filters.subject, filters.grade, filters.language, filters.mode, filters.sessionType, filters.city, sort]);

  const activeFilters = [
    subjectById(filters.subject)?.name,
    gradeById(filters.grade)?.name,
    languageById(filters.language)?.name,
    filters.mode === 'online' ? 'أونلاين' : filters.mode === 'f2f' ? 'حضوري' : null,
    filters.sessionType === 'group' ? 'جلسات جماعية' : filters.sessionType === 'individual' ? 'جلسات فردية' : null,
    cityById(filters.city)?.name,
  ].filter(Boolean);

  return (
    <div className="dz-screen">
      <TopBar
        back
        title="المدرسون المتاحون"
        subtitle={`${results.length} مدرس مطابق لبحثك`}
        right={
          <button type="button" className="dz-btn dz-btn--ghost dz-btn--sm" onClick={() => history.push('/search')}>
            تعديل البحث
          </button>
        }
      />

      {activeFilters.length > 0 && (
        <div className="dz-chiprow" style={{ padding: '0 20px 10px' }}>
          {activeFilters.map((f) => (
            <span key={f} className="dz-chip dz-chip--sm dz-chip--blue">{f}</span>
          ))}
        </div>
      )}

      <div className="dz-chiprow" style={{ padding: '0 20px 12px' }}>
        {SORTS.map((s) => (
          <button
            key={s.id}
            type="button"
            className={`dz-chip${sort === s.id ? ' dz-chip--active' : ''}`}
            onClick={() => setSort(s.id)}
          >
            {s.label}
          </button>
        ))}
      </div>

      <div className="dz-body" style={{ paddingTop: 4 }}>
        {results.length === 0 ? (
          <EmptyState
            title="لا يوجد مدرس مطابق"
            body="جرّب توسيع البحث: أزل فلتر اللغة أو المدينة، أو اختر نمط أونلاين."
          />
        ) : (
          <div className="dz-stack">
            {results.map((t) => (
              <TeacherCard key={t.id} teacher={t} />
            ))}
          </div>
        )}
      </div>

      <BottomNav active="search" />
    </div>
  );
}
