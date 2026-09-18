import React, { useState } from 'react';
import { useHistory, useParams } from 'react-router-dom';
import { TopBar, Avatar, Stars, VerifiedMark, money, EmptyState } from '../components/common';
import { IconBookmark, IconVideo, IconPin, IconUsers, IconPerson, IconShield } from '../components/Icons';
import { subjectById, gradeById, languageById, cityById } from '../data/catalog';
import { useApp } from '../state/AppContext';

const TABS = [
  { id: 'info', label: 'المعلومات' },
  { id: 'prices', label: 'الأسعار' },
  { id: 'reviews', label: 'التقييمات' },
];

function PriceRow({ icon, title, subtitle, price, unavailable }) {
  return (
    <div className="dz-row" style={{ padding: '12px 0', borderBottom: '1px solid var(--c-line)' }}>
      <span className="dz-avatar dz-avatar--sm" style={{ background: 'var(--c-soft)', color: 'var(--c-primary-text)' }}>
        {icon}
      </span>
      <span className="dz-grow">
        <span style={{ fontWeight: 700, fontSize: 14, display: 'block' }}>{title}</span>
        <span className="dz-muted" style={{ display: 'block', marginTop: 2 }}>{subtitle}</span>
      </span>
      {unavailable ? (
        <span className="dz-chip dz-chip--sm">غير مفعّلة</span>
      ) : (
        <span className="dz-price">{money(price)}<small>للساعة</small></span>
      )}
    </div>
  );
}

export default function TeacherProfile() {
  const { id } = useParams();
  const history = useHistory();
  const { favorites, toggleFavorite, teacherFor } = useApp();
  const teacher = teacherFor(id);
  const [tab, setTab] = useState('info');

  if (!teacher) return <EmptyState title="المدرس غير موجود" body="ربما تم إيقاف الحساب." />;

  const saved = favorites.includes(teacher.id);
  const online = teacher.pricing.online;
  const f2f = teacher.pricing.f2f;

  return (
    <div className="dz-screen">
      <TopBar
        back
        title="ملف المدرس"
        right={
          <button
            type="button"
            className="dz-iconbtn"
            aria-label={saved ? 'إزالة من المفضلة' : 'حفظ في المفضلة'}
            onClick={() => toggleFavorite(teacher.id)}
          >
            <IconBookmark filled={saved} />
          </button>
        }
      />

      <div className="dz-body" style={{ paddingTop: 4 }}>
        <div className="dz-row" style={{ alignItems: 'flex-start', marginBottom: 14 }}>
          <Avatar teacher={teacher} size="lg" />
          <div className="dz-grow">
            <div className="dz-teacher__name" style={{ fontSize: 17 }}>
              {teacher.name}
              {teacher.verified && <VerifiedMark />}
            </div>
            <div className="dz-muted" style={{ marginTop: 4 }}>
              {teacher.subjects.map((s) => subjectById(s)?.name).join(' · ')}
            </div>
            <div className="dz-row" style={{ gap: 8, marginTop: 6 }}>
              <Stars value={teacher.rating} />
              <span className="dz-faint">· {teacher.lastActive}</span>
            </div>
          </div>
        </div>

        <div className="dz-stats" style={{ marginBottom: 16 }}>
          <div className="dz-stats__cell">
            <div className="dz-stats__num">{teacher.rating.toFixed(2)}</div>
            <div className="dz-stats__lbl">التقييم</div>
          </div>
          <div className="dz-stats__cell">
            <div className="dz-stats__num">{teacher.sessionsCount}</div>
            <div className="dz-stats__lbl">جلسة مكتملة</div>
          </div>
          <div className="dz-stats__cell">
            <div className="dz-stats__num">{teacher.reviewsCount}</div>
            <div className="dz-stats__lbl">تقييم</div>
          </div>
        </div>

        <div className="dz-chiprow" style={{ marginBottom: 14 }}>
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              className={`dz-chip${tab === t.id ? ' dz-chip--active' : ''}`}
              onClick={() => setTab(t.id)}
            >
              {t.label}
            </button>
          ))}
        </div>

        {tab === 'info' && (
          <div className="dz-stack">
            <div>
              <div className="dz-h3" style={{ marginBottom: 6 }}>نبذة</div>
              <p className="dz-muted" style={{ margin: 0, lineHeight: 1.8 }}>{teacher.bio}</p>
            </div>

            <div>
              <div className="dz-h3" style={{ marginBottom: 8 }}>المؤهلات والخبرة</div>
              <div className="dz-stack dz-stack--sm">
                {teacher.qualifications.map((q) => (
                  <div key={q} className="dz-row dz-card dz-card--soft" style={{ padding: '10px 12px' }}>
                    <span style={{ fontSize: 13 }}>{q}</span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <div className="dz-h3" style={{ marginBottom: 8 }}>الصفوف الدراسية</div>
              <div className="dz-chiprow" style={{ flexWrap: 'wrap' }}>
                {teacher.grades.map((g) => (
                  <span key={g} className="dz-chip dz-chip--sm dz-chip--accent">{gradeById(g)?.name}</span>
                ))}
              </div>
            </div>

            <div>
              <div className="dz-h3" style={{ marginBottom: 8 }}>لغات الشرح</div>
              <div className="dz-chiprow">
                {teacher.languages.map((l) => (
                  <span key={l} className="dz-chip dz-chip--sm dz-chip--primary">{languageById(l)?.name}</span>
                ))}
              </div>
            </div>

            <div>
              <div className="dz-h3" style={{ marginBottom: 8 }}>نمط الحصص</div>
              <div className="dz-stack dz-stack--sm">
                {online && (
                  <div className="dz-row dz-card dz-card--soft" style={{ padding: '10px 12px' }}>
                    <IconVideo size={16} />
                    <span style={{ fontSize: 13 }}>حصص أونلاين — يُرسل رابط الجلسة بعد تأكيد الحجز</span>
                  </div>
                )}
                {f2f && (
                  <div className="dz-row dz-card dz-card--soft" style={{ padding: '10px 12px' }}>
                    <IconPin size={16} />
                    <span style={{ fontSize: 13 }}>
                      حصص حضورية في {cityById(teacher.city)?.name}
                      {teacher.areas.length > 0 && ` — ${teacher.areas.join('، ')}`}
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div className="dz-card" style={{ background: 'var(--c-success-bg)', border: 'none' }}>
              <div className="dz-row" style={{ gap: 8, color: 'var(--c-success)' }}>
                <IconShield size={18} />
                <span style={{ fontSize: 13, fontWeight: 700 }}>هوية موثقة من إدارة درسي</span>
              </div>
              <div className="dz-muted" style={{ marginTop: 6 }}>
                تم التحقق من هوية المدرس ورقم هاتفه قبل ظهوره في التطبيق.
              </div>
            </div>
          </div>
        )}

        {tab === 'prices' && (
          <div className="dz-stack">
            <div className="dz-card">
              <div className="dz-h3" style={{ marginBottom: 4 }}>حصص أونلاين</div>
              {online ? (
                <>
                  <PriceRow icon={<IconPerson size={16} />} title="جلسة فردية" subtitle="1:1 مع المدرس" price={online.individual} />
                  {online.group ? (
                    <PriceRow
                      icon={<IconUsers size={16} />}
                      title="جلسة جماعية"
                      subtitle={`من ${online.group.minSeats} إلى ${online.group.maxSeats} طلاب`}
                      price={online.group.price}
                    />
                  ) : (
                    <PriceRow icon={<IconUsers size={16} />} title="جلسة جماعية" subtitle="—" unavailable />
                  )}
                </>
              ) : (
                <div className="dz-muted" style={{ paddingTop: 8 }}>هذا المدرس لا يقدم حصصًا أونلاين حاليًا.</div>
              )}
            </div>

            <div className="dz-card">
              <div className="dz-h3" style={{ marginBottom: 4 }}>حصص حضورية</div>
              {f2f ? (
                <>
                  <PriceRow icon={<IconPerson size={16} />} title="جلسة فردية" subtitle={cityById(teacher.city)?.name} price={f2f.individual} />
                  {f2f.group ? (
                    <PriceRow
                      icon={<IconUsers size={16} />}
                      title="جلسة جماعية"
                      subtitle={`من ${f2f.group.minSeats} إلى ${f2f.group.maxSeats} طلاب`}
                      price={f2f.group.price}
                    />
                  ) : (
                    <PriceRow icon={<IconUsers size={16} />} title="جلسة جماعية" subtitle="—" unavailable />
                  )}
                </>
              ) : (
                <div className="dz-muted" style={{ paddingTop: 8 }}>هذا المدرس لا يقدم حصصًا حضورية حاليًا.</div>
              )}
            </div>

            <div className="dz-banner dz-banner--accent">
              الأسعار لكل ساعة وتشمل رسوم المنصة. يتم الدفع لحساب درسي، وتُحوَّل مستحقات المدرس بعد إتمام الحصة.
            </div>
          </div>
        )}

        {tab === 'reviews' && (
          <div className="dz-stack">
            {teacher.reviews.length === 0 ? (
              <EmptyState title="لا توجد تقييمات بعد" body="كن أول من يقيّم هذا المدرس بعد حصتك." />
            ) : (
              teacher.reviews.map((r) => (
                <div key={r.id} className="dz-card dz-card--soft">
                  <div className="dz-row dz-row--between">
                    <span style={{ fontWeight: 700, fontSize: 14 }}>{r.author}</span>
                    <span className="dz-faint">{r.date}</span>
                  </div>
                  <div style={{ margin: '6px 0' }}>
                    <Stars value={r.rating} size={13} showValue={false} />
                  </div>
                  <div className="dz-muted" style={{ lineHeight: 1.7 }}>{r.text}</div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      <div className="dz-footer-cta">
        <button type="button" className="dz-btn dz-btn--primary" onClick={() => history.push(`/book/${teacher.id}`)}>
          احجز جلسة
        </button>
      </div>
    </div>
  );
}
