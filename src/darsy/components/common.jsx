import React from 'react';
import { useHistory } from 'react-router-dom';
import {
  IconBack, IconStar, IconVerified, IconHome, IconCalendar, IconCap, IconUser, IconUsers,
  IconInbox, IconChart, IconWallet, IconPayout, IconSliders, IconGrid,
} from './Icons';
import { useApp } from '../state/AppContext';

export function TopBar({ title, subtitle, back, pastel, right, onBack }) {
  const history = useHistory();
  return (
    <header className={`dz-topbar${pastel ? ' dz-topbar--pastel' : ''}`}>
      {back && (
        <button
          type="button"
          className="dz-iconbtn"
          aria-label="رجوع"
          onClick={() => (onBack ? onBack() : history.goBack())}
        >
          <IconBack size={17} />
        </button>
      )}
      <div className="dz-grow">
        <h1 className="dz-topbar__title">{title}</h1>
        {subtitle && <div className="dz-topbar__sub">{subtitle}</div>}
      </div>
      {right}
    </header>
  );
}

export function Stars({ value, size = 14, showValue = true }) {
  const rounded = Math.round(value);
  return (
    <span className="dz-row" style={{ gap: 3 }}>
      {[1, 2, 3, 4, 5].map((i) => (
        <IconStar key={i} size={size} filled={i <= rounded} />
      ))}
      {showValue && <span style={{ fontSize: 12, fontWeight: 700, marginInlineStart: 4 }}>{value.toFixed(1)}</span>}
    </span>
  );
}

export function Avatar({ teacher, size = '' }) {
  return (
    <div
      className={`dz-avatar ${size === 'lg' ? 'dz-avatar--lg' : size === 'sm' ? 'dz-avatar--sm' : ''}`}
      style={{ background: teacher.color, color: teacher.textColor }}
      aria-hidden="true"
    >
      {teacher.initials}
    </div>
  );
}

export function VerifiedMark() {
  return (
    <span title="هوية موثقة" className="dz-row" style={{ gap: 0 }}>
      <IconVerified size={15} />
    </span>
  );
}

export function StatusBadge({ status, label, tone }) {
  return <span className={`dz-chip dz-chip--sm dz-chip--${tone}`}>{label || status}</span>;
}

export function Banner({ tone = 'primary', children, icon }) {
  return (
    <div className={`dz-banner dz-banner--${tone}`}>
      {icon}
      <span className="dz-grow">{children}</span>
    </div>
  );
}

export function Field({ label, children, hint }) {
  return (
    <label className="dz-field">
      <span className="dz-label">{label}</span>
      {children}
      {hint && <span className="dz-faint">{hint}</span>}
    </label>
  );
}

export function EmptyState({ title, body }) {
  return (
    <div className="dz-empty">
      <div style={{ fontWeight: 800, color: '#14161C', marginBottom: 6 }}>{title}</div>
      <div>{body}</div>
    </div>
  );
}

// Each interface has its own tabs; nothing links across the three.
const NAV_BY_ROLE = {
  student: [
    { key: 'home', label: 'الرئيسية', path: '/home', Icon: IconHome },
    { key: 'search', label: 'المدرسون', path: '/search', Icon: IconCap },
    { key: 'bookings', label: 'حصصي', path: '/bookings', Icon: IconCalendar },
    { key: 'account', label: 'حسابي', path: '/account', Icon: IconUser },
  ],
  parent: [
    { key: 'home', label: 'الرئيسية', path: '/home', Icon: IconHome },
    { key: 'children', label: 'أبنائي', path: '/children', Icon: IconUsers },
    { key: 'bookings', label: 'الحجوزات', path: '/bookings', Icon: IconCalendar },
    { key: 'account', label: 'حسابي', path: '/account', Icon: IconUser },
  ],
  teacher: [
    { key: 'home', label: 'لوحتي', path: '/home', Icon: IconHome },
    { key: 'requests', label: 'الطلبات', path: '/requests', Icon: IconInbox },
    { key: 'schedule', label: 'جدولي', path: '/schedule', Icon: IconCalendar },
    { key: 'account', label: 'ملفي', path: '/account', Icon: IconUser },
  ],
  admin: [
    { key: 'home', label: 'اللوحة', path: '/home', Icon: IconChart },
    { key: 'payments', label: 'المدفوعات', path: '/payments', Icon: IconWallet },
    { key: 'payouts', label: 'السحوبات', path: '/payouts', Icon: IconPayout },
    { key: 'teachers', label: 'المدرسون', path: '/teachers', Icon: IconCap },
    { key: 'reference', label: 'البيانات', path: '/reference', Icon: IconGrid },
    { key: 'settings', label: 'الإعدادات', path: '/settings', Icon: IconSliders },
  ],
};

export function BottomNav({ active }) {
  const history = useHistory();
  const { role, base } = useApp();
  const items = NAV_BY_ROLE[role] || NAV_BY_ROLE.student;

  return (
    <nav className="dz-nav">
      {items.map(({ key, label, path, Icon }) => (
        <button
          key={key}
          type="button"
          className={`dz-nav__item${active === key ? ' dz-nav__item--active' : ''}`}
          onClick={() => history.push(`${base}${path}`)}
        >
          <Icon size={20} />
          <span>{label}</span>
        </button>
      ))}
    </nav>
  );
}

export function Toggle({ label, hint, checked, onChange }) {
  return (
    <label className="dz-row" style={{ padding: '12px 0', borderBottom: '1px solid var(--c-line)', cursor: 'pointer' }}>
      <span className="dz-grow">
        <span style={{ fontSize: 14, fontWeight: 600, display: 'block' }}>{label}</span>
        {hint && <span className="dz-muted" style={{ display: 'block', marginTop: 2 }}>{hint}</span>}
      </span>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        style={{ position: 'absolute', opacity: 0, width: 0, height: 0 }}
      />
      <span className={`dz-switch${checked ? ' dz-switch--on' : ''}`} aria-hidden="true">
        <span className="dz-switch__dot" />
      </span>
    </label>
  );
}

export function Sheet({ open, onClose, title, children }) {
  if (!open) return null;
  return (
    <div className="dz-sheet-backdrop" onClick={onClose} role="presentation">
      <div className="dz-sheet" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-label={title}>
        <div className="dz-sheet__handle" />
        {title && <h2 className="dz-h2" style={{ marginBottom: 12 }}>{title}</h2>}
        {children}
      </div>
    </div>
  );
}

export const money = (n) => `${Number(n).toFixed(2).replace(/\.?0+$/, '')} د.ل`;

export const formatDate = (isoDate) => {
  const d = new Date(`${isoDate}T00:00:00`);
  return d.toLocaleDateString('ar-LY', { weekday: 'long', day: 'numeric', month: 'long' });
};

export const formatTime = (hhmm) => {
  const [h, m] = hhmm.split(':').map(Number);
  const period = h >= 12 ? 'مساءً' : 'صباحًا';
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${hour12}:${String(m).padStart(2, '0')} ${period}`;
};
