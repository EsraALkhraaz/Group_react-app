import React from 'react';

const base = (props) => ({
  width: props.size || 20,
  height: props.size || 20,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: props.strokeWidth || 2,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  'aria-hidden': true,
});

export const IconHome = (p) => (
  <svg {...base(p)}><path d="M3 11.5 12 4l9 7.5" /><path d="M5 10v10h14V10" /></svg>
);
export const IconCalendar = (p) => (
  <svg {...base(p)}><rect x="3" y="5" width="18" height="16" rx="3" /><line x1="3" y1="10" x2="21" y2="10" /><line x1="8" y1="3" x2="8" y2="7" /><line x1="16" y1="3" x2="16" y2="7" /></svg>
);
export const IconCap = (p) => (
  <svg {...base(p)}><path d="M12 3 2 8l10 5 10-5-10-5Z" /><path d="M6 10.5V16c0 1.3 2.7 3 6 3s6-1.7 6-3v-5.5" /></svg>
);
export const IconUser = (p) => (
  <svg {...base(p)}><circle cx="12" cy="8" r="4" /><path d="M4 21c0-4 4-6 8-6s8 2 8 6" /></svg>
);
export const IconGrid = (p) => (
  <svg {...base(p)}><circle cx="5" cy="5" r="1.6" /><circle cx="12" cy="5" r="1.6" /><circle cx="19" cy="5" r="1.6" /><circle cx="5" cy="12" r="1.6" /><circle cx="12" cy="12" r="1.6" /><circle cx="19" cy="12" r="1.6" /><circle cx="5" cy="19" r="1.6" /><circle cx="12" cy="19" r="1.6" /><circle cx="19" cy="19" r="1.6" /></svg>
);
export const IconSearch = (p) => (
  <svg {...base(p)}><circle cx="11" cy="11" r="7" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
);
export const IconBell = (p) => (
  <svg {...base(p)}><path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.7 21a2 2 0 0 1-3.4 0" /></svg>
);
export const IconBack = (p) => (
  <svg {...base(p)}><polyline points="15 18 9 12 15 6" /></svg>
);
export const IconForward = (p) => (
  <svg {...base(p)}><polyline points="9 18 15 12 9 6" /></svg>
);
export const IconCheck = (p) => (
  <svg {...base(p)}><polyline points="20 6 9 17 4 12" /></svg>
);
export const IconClose = (p) => (
  <svg {...base(p)}><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
);
export const IconStar = ({ size = 16, filled = true }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={filled ? '#F6B93B' : 'none'} stroke={filled ? '#F6B93B' : '#C9CEDA'} strokeWidth="1.6" strokeLinejoin="round" aria-hidden="true">
    <polygon points="12 2.5 15 9 22 9.8 17 14.5 18.3 21.5 12 18.2 5.7 21.5 7 14.5 2 9.8 9 9" />
  </svg>
);
export const IconBookmark = ({ size = 18, filled = false }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={filled ? '#F6B93B' : 'none'} stroke={filled ? '#F6B93B' : '#9AA1AE'} strokeWidth="2" strokeLinejoin="round" aria-hidden="true">
    <path d="M19 21l-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z" />
  </svg>
);
export const IconVerified = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="#2F8F72" aria-hidden="true">
    <path d="M12 2l2.2 1.6 2.7-.3 1 2.5 2.3 1.4-.7 2.6.7 2.6-2.3 1.4-1 2.5-2.7-.3L12 22l-2.2-1.6-2.7.3-1-2.5-2.3-1.4.7-2.6-.7-2.6 2.3-1.4 1-2.5 2.7.3z" />
    <polyline points="8.5 12 11 14.5 15.5 9.5" fill="none" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
export const IconVideo = (p) => (
  <svg {...base(p)}><rect x="2" y="6" width="14" height="12" rx="3" /><path d="m16 11 6-3v8l-6-3z" /></svg>
);
export const IconPin = (p) => (
  <svg {...base(p)}><path d="M12 21s7-6.2 7-11a7 7 0 1 0-14 0c0 4.8 7 11 7 11z" /><circle cx="12" cy="10" r="2.6" /></svg>
);
export const IconUsers = (p) => (
  <svg {...base(p)}><circle cx="9" cy="8" r="3.4" /><path d="M2.5 20c0-3.4 3-5.2 6.5-5.2s6.5 1.8 6.5 5.2" /><path d="M17 4.5a3.4 3.4 0 0 1 0 6.6" /><path d="M18.4 14.6c2 .7 3.1 2.2 3.1 4.4" /></svg>
);
export const IconPerson = (p) => (
  <svg {...base(p)}><circle cx="12" cy="7.5" r="3.6" /><path d="M5 20.5c0-3.7 3.1-5.8 7-5.8s7 2.1 7 5.8" /></svg>
);
export const IconWallet = (p) => (
  <svg {...base(p)}><rect x="3" y="6" width="18" height="13" rx="3" /><path d="M3 10h18" /><circle cx="17" cy="14.5" r="1.2" fill="currentColor" stroke="none" /></svg>
);
export const IconUpload = (p) => (
  <svg {...base(p)}><path d="M12 16V5" /><polyline points="8 9 12 5 16 9" /><path d="M4 16v3h16v-3" /></svg>
);
export const IconClock = (p) => (
  <svg {...base(p)}><circle cx="12" cy="12" r="9" /><polyline points="12 7 12 12 15.5 14" /></svg>
);
export const IconInbox = (p) => (
  <svg {...base(p)}><path d="M3 13h5l1.5 2.5h5L16 13h5" /><path d="M4.6 5.5h14.8l1.6 7.5v5.5a1.5 1.5 0 0 1-1.5 1.5H4.5A1.5 1.5 0 0 1 3 18.5V13z" /></svg>
);
export const IconShield = (p) => (
  <svg {...base(p)}><path d="M12 3l7 3v6c0 4.2-3 7.7-7 9-4-1.3-7-4.8-7-9V6z" /><polyline points="9 12 11.2 14.2 15 10.4" /></svg>
);
export const IconChart = (p) => (
  <svg {...base(p)}><line x1="4" y1="20" x2="20" y2="20" /><rect x="6" y="11" width="3" height="6" rx="1" /><rect x="11" y="7" width="3" height="10" rx="1" /><rect x="16" y="13" width="3" height="4" rx="1" /></svg>
);
export const IconSliders = (p) => (
  <svg {...base(p)}><line x1="4" y1="8" x2="20" y2="8" /><line x1="4" y1="16" x2="20" y2="16" /><circle cx="9" cy="8" r="2.4" /><circle cx="15" cy="16" r="2.4" /></svg>
);
export const IconPayout = (p) => (
  <svg {...base(p)}><path d="M12 4v10" /><path d="m8 10.5 4 4 4-4" /><path d="M4 18h16" /></svg>
);
