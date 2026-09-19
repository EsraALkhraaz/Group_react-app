import React, { useState } from 'react';
import { BottomNav, Banner, Sheet, Field, EmptyState } from '../../components/common';
import { IconCheck, IconGrid } from '../../components/Icons';
import { useApp } from '../../state/AppContext';

// Everything a teacher, a learner or a booking can point at.
const KINDS = [
  { key: 'subjects', label: 'المواد', hasColor: true },
  { key: 'grades', label: 'السنوات الدراسية', hasStage: true },
  { key: 'languages', label: 'اللغات' },
  { key: 'cities', label: 'المدن' },
];

// An id the rest of the app can store on a booking without surprises.
const slug = (name, existing) => {
  const base = `c${Date.now().toString(36)}`;
  return existing.some((i) => i.id === base) ? `${base}x` : base;
};

export default function AdminReference() {
  const { refData, updateRefData } = useApp();

  const [kind, setKind] = useState('subjects');
  const [editing, setEditing] = useState(null);
  const [name, setName] = useState('');
  const [extra, setExtra] = useState('');
  const [saved, setSaved] = useState('');

  const meta = KINDS.find((k) => k.key === kind);
  const list = refData[kind] || [];

  const open = (item) => {
    setEditing(item || { isNew: true });
    setName(item ? item.name : '');
    setExtra(item ? (item.stage || item.color || '') : '');
    setSaved('');
  };

  const save = () => {
    const value = name.trim();
    if (!value) return;

    const next = editing.isNew
      ? [...list, {
        id: slug(value, list),
        name: value,
        ...(meta.hasStage && extra.trim() ? { stage: extra.trim() } : {}),
        ...(meta.hasColor ? { color: extra.trim() || '#5B7DB1' } : {}),
      }]
      : list.map((i) => (i.id === editing.id
        ? {
          ...i,
          name: value,
          ...(meta.hasStage ? { stage: extra.trim() } : {}),
          ...(meta.hasColor ? { color: extra.trim() || i.color } : {}),
        }
        : i));

    updateRefData(kind, next);
    setEditing(null);
    setSaved(editing.isNew ? 'أُضيف العنصر' : 'حُفظ التعديل');
  };

  const toggleDisabled = (item) => {
    updateRefData(kind, list.map((i) => (i.id === item.id ? { ...i, disabled: !i.disabled } : i)));
    setSaved(item.disabled ? 'أُعيد تفعيل العنصر' : 'أُخفي العنصر من القوائم');
  };

  return (
    <div className="dz-screen">
      <header className="dz-topbar">
        <div className="dz-grow">
          <h1 className="dz-topbar__title">البيانات المرجعية</h1>
          <div className="dz-topbar__sub">المواد والسنوات واللغات والمدن</div>
        </div>
      </header>

      <div className="dz-tabs" style={{ flexWrap: 'wrap' }}>
        {KINDS.map((k) => (
          <button
            key={k.key}
            type="button"
            className={`dz-chip${kind === k.key ? ' dz-chip--active' : ''}`}
            onClick={() => { setKind(k.key); setSaved(''); }}
          >
            {k.label}
          </button>
        ))}
      </div>

      <div className="dz-body" style={{ paddingTop: 4 }}>
        {saved && (
          <div style={{ marginBottom: 14 }}>
            <Banner tone="success" icon={<IconCheck size={18} />}>{saved}</Banner>
          </div>
        )}

        <div className="dz-section-title">
          <span>{meta.label} ({list.filter((i) => !i.disabled).length})</span>
          <button type="button" className="dz-btn dz-btn--ghost dz-btn--sm" onClick={() => open(null)}>
            إضافة
          </button>
        </div>

        {list.length === 0 ? (
          <EmptyState title="القائمة فارغة" body="أضف أول عنصر ليظهر في كل الواجهات." />
        ) : (
          <div className="dz-card">
            {list.map((item) => (
              <div key={item.id} className="dz-listrow">
                {meta.hasColor && (
                  <span
                    className="dz-avatar dz-avatar--sm"
                    style={{ background: item.color, width: 26, height: 26 }}
                    aria-hidden="true"
                  />
                )}
                <span className="dz-grow">
                  <span style={{ fontSize: 13, fontWeight: 700, display: 'block', opacity: item.disabled ? 0.5 : 1 }}>
                    {item.name}
                  </span>
                  <span className="dz-muted" style={{ display: 'block', marginTop: 2 }}>
                    {item.stage || item.id}
                    {item.disabled && ' · مخفي'}
                  </span>
                </span>
                <button type="button" className="dz-btn dz-btn--ghost dz-btn--sm" onClick={() => open(item)}>
                  تعديل
                </button>
                <button type="button" className="dz-btn dz-btn--ghost dz-btn--sm" onClick={() => toggleDisabled(item)}>
                  {item.disabled ? 'إظهار' : 'إخفاء'}
                </button>
              </div>
            ))}
          </div>
        )}

        <div style={{ marginTop: 12 }}>
          <Banner tone="primary">
            الإخفاء يمنع اختيار العنصر في أي قائمة جديدة، ولا يمسّ حجزًا قائمًا يشير إليه —
            ولهذا لا يوجد حذف نهائي هنا.
          </Banner>
        </div>
      </div>

      <Sheet
        open={Boolean(editing)}
        onClose={() => setEditing(null)}
        title={editing?.isNew ? `إضافة إلى ${meta.label}` : 'تعديل العنصر'}
      >
        {editing && (
          <div className="dz-stack">
            <div className="dz-row">
              <IconGrid size={18} />
              <span className="dz-h3">{meta.label}</span>
            </div>

            <Field label="الاسم">
              <input className="dz-input" value={name} onChange={(e) => setName(e.target.value)} />
            </Field>

            {meta.hasStage && (
              <Field label="المرحلة" hint="ابتدائي · إعدادي · ثانوي · جامعي">
                <input className="dz-input" value={extra} onChange={(e) => setExtra(e.target.value)} />
              </Field>
            )}

            {meta.hasColor && (
              <Field label="لون المادة" hint="يظهر في بطاقات البحث — مثال: ‎#14717A">
                <input
                  className="dz-input"
                  value={extra}
                  onChange={(e) => setExtra(e.target.value)}
                  style={{ direction: 'ltr', textAlign: 'right' }}
                  placeholder="#5B7DB1"
                />
              </Field>
            )}

            <button type="button" className="dz-btn dz-btn--primary" disabled={!name.trim()} onClick={save}>
              حفظ
            </button>
          </div>
        )}
      </Sheet>

      <BottomNav active="reference" />
    </div>
  );
}
