import React, { useEffect } from 'react';
import { TopBar, EmptyState } from '../components/common';
import { IconBell } from '../components/Icons';
import { useApp } from '../state/AppContext';

export default function Notifications() {
  const { notifications, markNotificationsRead } = useApp();

  useEffect(() => {
    const t = setTimeout(markNotificationsRead, 800);
    return () => clearTimeout(t);
  }, [markNotificationsRead]);

  return (
    <div className="dz-screen">
      <TopBar back title="الإشعارات" subtitle={`${notifications.length} إشعار`} />
      <div className="dz-body">
        {notifications.length === 0 ? (
          <EmptyState title="لا توجد إشعارات" body="ستصلك هنا تحديثات الحجوزات والتذكيرات." />
        ) : (
          <div className="dz-stack dz-stack--sm">
            {notifications.map((n) => (
              <div key={n.id} className="dz-card dz-row" style={{ alignItems: 'flex-start', background: n.unread ? 'var(--c-soft)' : '#fff' }}>
                <span className={`dz-avatar dz-avatar--sm dz-chip--${n.tone}`} style={{ width: 34, height: 34 }}>
                  <IconBell size={15} />
                </span>
                <span className="dz-grow">
                  <span style={{ fontWeight: 700, fontSize: 13, display: 'block' }}>{n.title}</span>
                  <span className="dz-muted" style={{ display: 'block', marginTop: 3 }}>{n.body}</span>
                </span>
                {n.unread && <span style={{ width: 8, height: 8, borderRadius: 4, background: 'var(--c-danger)' }} />}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
