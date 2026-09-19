import React, { useState } from 'react';
import { useHistory } from 'react-router-dom';
import { TopBar, BottomNav, Sheet, Field, EmptyState } from '../components/common';
import { IconClose, IconSearch, IconForward } from '../components/Icons';
import { GRADES, gradeById, active } from '../data/catalog';
import { useApp, BOOKING_STATUS } from '../state/AppContext';

export default function Children() {
  const history = useHistory();
  const { base, children, bookings, addChild, removeChild, setActiveChild } = useApp();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [gradeId, setGradeId] = useState('g1');

  const valid = name.trim().length >= 2;

  const save = () => {
    addChild(name, gradeId);
    setName('');
    setGradeId('g1');
    setOpen(false);
  };

  return (
    <div className="dz-screen">
      <TopBar title="أبنائي" subtitle={`${children.length} مسجلون تحت حسابك`} />

      <div className="dz-body">
        {children.length === 0 ? (
          <EmptyState title="لا يوجد أبناء بعد" body="أضف ابنك لتتمكن من الحجز له ومتابعة حصصه." />
        ) : (
          <div className="dz-stack">
            {children.map((c) => {
              const mine = bookings.filter((b) => b.learnerName === c.name);
              const done = mine.filter((b) => b.status === BOOKING_STATUS.COMPLETED).length;
              return (
                <div key={c.id} className="dz-card">
                  <div className="dz-row" style={{ marginBottom: 12 }}>
                    <span className="dz-avatar" style={{ background: 'var(--c-primary-bg)', color: 'var(--c-primary-text)' }}>
                      {c.name.charAt(0)}
                    </span>
                    <span className="dz-grow">
                      <span style={{ fontWeight: 800, fontSize: 15, display: 'block' }}>{c.name}</span>
                      <span className="dz-muted" style={{ display: 'block', marginTop: 2 }}>
                        {gradeById(c.gradeId)?.name}
                      </span>
                    </span>
                    <button
                      type="button"
                      className="dz-iconbtn"
                      aria-label={`حذف ${c.name}`}
                      onClick={() => removeChild(c.id)}
                    >
                      <IconClose size={15} />
                    </button>
                  </div>

                  <div className="dz-row" style={{ gap: 6, marginBottom: 12, flexWrap: 'wrap' }}>
                    <span className="dz-chip dz-chip--sm dz-chip--primary">{mine.length} حجز</span>
                    <span className="dz-chip dz-chip--sm dz-chip--success">{done} مكتملة</span>
                  </div>

                  <div className="dz-row" style={{ gap: 8 }}>
                    <button
                      type="button"
                      className="dz-btn dz-btn--primary dz-btn--sm"
                      style={{ flex: 1 }}
                      onClick={() => { setActiveChild(c.name); history.push(`${base}/search`); }}
                    >
                      <IconSearch size={14} /> احجز له
                    </button>
                    <button
                      type="button"
                      className="dz-btn dz-btn--ghost dz-btn--sm"
                      style={{ flex: 1 }}
                      onClick={() => history.push(`${base}/bookings?child=${encodeURIComponent(c.name)}`)}
                    >
                      حصصه <IconForward size={14} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="dz-footer-cta">
        <button type="button" className="dz-btn dz-btn--primary" onClick={() => setOpen(true)}>
          + إضافة ابن/ابنة
        </button>
      </div>

      <Sheet open={open} onClose={() => setOpen(false)} title="إضافة ابن/ابنة">
        <div className="dz-stack">
          <Field label="الاسم">
            <input className="dz-input" value={name} onChange={(e) => setName(e.target.value)} placeholder="مثال: يوسف" />
          </Field>
          <Field label="الصف الدراسي">
            <select className="dz-select" value={gradeId} onChange={(e) => setGradeId(e.target.value)}>
              {active(GRADES).map((g) => (
                <option key={g.id} value={g.id}>{g.name} — {g.stage}</option>
              ))}
            </select>
          </Field>
          <button type="button" className="dz-btn dz-btn--primary" disabled={!valid} onClick={save}>
            حفظ
          </button>
        </div>
      </Sheet>

      <BottomNav active="children" />
    </div>
  );
}
