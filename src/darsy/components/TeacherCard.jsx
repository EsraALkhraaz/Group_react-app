import React from 'react';
import { useHistory } from 'react-router-dom';
import { Avatar, Stars, VerifiedMark, money } from './common';
import { IconBookmark, IconPin, IconVideo } from './Icons';
import { subjectById, cityById } from '../data/catalog';
import { useApp } from '../state/AppContext';

export default function TeacherCard({ teacher }) {
  const history = useHistory();
  const { favorites, toggleFavorite, base } = useApp();
  const pricing = teacher.pricing;
  const saved = favorites.includes(teacher.id);

  const cheapest = Math.min(
    ...[pricing.online?.individual, pricing.f2f?.individual].filter(Boolean),
  );

  return (
    <div className="dz-teacher">
      <button
        type="button"
        className="dz-row dz-grow"
        style={{ background: 'none', border: 'none', padding: 0, textAlign: 'start', alignItems: 'flex-start', gap: 12 }}
        onClick={() => history.push(`${base}/teacher/${teacher.id}`)}
      >
        <Avatar teacher={teacher} />
        <span className="dz-grow">
          <span className="dz-teacher__name">
            {teacher.name}
            {teacher.verified && <VerifiedMark />}
          </span>
          <span className="dz-teacher__meta" style={{ display: 'block' }}>
            {teacher.subjects.map((s) => subjectById(s)?.name).filter(Boolean).join(' · ')}
          </span>
          <span className="dz-row" style={{ gap: 10, marginTop: 6 }}>
            <Stars value={teacher.rating} size={13} />
            <span className="dz-faint">({teacher.reviewsCount} تقييم)</span>
          </span>
          <span className="dz-row" style={{ gap: 10, marginTop: 6, flexWrap: 'wrap' }}>
            {pricing.online && (
              <span className="dz-chip dz-chip--sm dz-chip--primary">
                <IconVideo size={12} /> أونلاين
              </span>
            )}
            {pricing.f2f && (
              <span className="dz-chip dz-chip--sm dz-chip--success">
                <IconPin size={12} /> {cityById(teacher.city)?.name}
              </span>
            )}
          </span>
        </span>
      </button>

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', justifyContent: 'space-between' }}>
        <button
          type="button"
          className="dz-iconbtn dz-iconbtn--plain"
          aria-label={saved ? 'إزالة من المفضلة' : 'حفظ في المفضلة'}
          onClick={() => toggleFavorite(teacher.id)}
        >
          <IconBookmark filled={saved} />
        </button>
        <div className="dz-price">
          {money(cheapest)}
          <small>للساعة</small>
        </div>
      </div>
    </div>
  );
}
