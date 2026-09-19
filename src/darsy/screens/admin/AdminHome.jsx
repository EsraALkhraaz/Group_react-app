import React from 'react';
import { useHistory } from 'react-router-dom';
import { BottomNav, Banner, EmptyState, money, formatDate } from '../../components/common';
import { IconForward, IconChart, IconUpload, IconPayout } from '../../components/Icons';
import { useApp, BOOKING_STATUS } from '../../state/AppContext';
import { platformTotals, percent } from '../../lib/money';
import mark from '../../assets/darsy-mark.png';

function Kpi({ label, value, accent }) {
  return (
    <div className={`dz-kpi__cell${accent ? ' dz-kpi__cell--accent' : ''}`}>
      <div className="dz-kpi__num">{value}<small>د.ل</small></div>
      <div className="dz-kpi__lbl">{label}</div>
    </div>
  );
}

const num = (n) => Number(n).toFixed(2).replace(/\.?0+$/, '');

export default function AdminHome() {
  const history = useHistory();
  const { transactions, payouts, bookings, settings, teacherFor } = useApp();

  const totals = platformTotals({ transactions, payouts });
  const awaitingReview = bookings.filter((b) => b.status === BOOKING_STATUS.PAYMENT_REVIEW);
  const openPayouts = payouts.filter((p) => p.status === 'requested');
  const recent = transactions.slice(0, 5);

  return (
    <div className="dz-screen">
      <header className="dz-topbar">
        <img src={mark} alt="درسي" style={{ width: 34, height: 34, objectFit: 'contain' }} />
        <div className="dz-grow">
          <h1 className="dz-topbar__title">لوحة الإدارة المالية</h1>
          <div className="dz-topbar__sub">كل الأرقام من دفتر الحركات</div>
        </div>
      </header>

      <div className="dz-body">
        <section style={{ marginBottom: 18 }}>
          <div className="dz-section-title"><span>حركة المنصة</span></div>
          <div className="dz-kpi">
            <Kpi label="إجمالي المبيعات (GMV)" value={num(totals.gmv)} accent />
            <Kpi label="عمولات درسي" value={num(totals.commission)} accent />
            <Kpi label="مستحقات لدى المدرسين" value={num(totals.dueToTeachers)} />
            <Kpi label="محجوز لحصص لم تُنفَّذ" value={num(totals.heldForTeachers)} />
            <Kpi label="مسحوب فعليًا" value={num(totals.withdrawn)} />
            <Kpi label="مبالغ مُسترجعة" value={num(totals.refunded)} />
          </div>
          <div className="dz-card" style={{ marginTop: 12 }}>
            <div className="dz-kv dz-total">
              <span className="dz-kv__k">صافي إيراد درسي</span>
              <span className="dz-kv__v">{money(totals.netRevenue)}</span>
            </div>
            <div className="dz-faint" style={{ marginTop: 8 }}>
              صافي الإيراد = عمولات الحجوزات غير المُسترجعة. أموال المدرسين ليست إيرادًا للمنصة.
            </div>
          </div>
        </section>

        <section style={{ marginBottom: 18 }}>
          <div className="dz-section-title"><span>ينتظر الإدارة</span></div>
          <div className="dz-card">
            <button type="button" className="dz-listrow" onClick={() => history.push('/admin/payments')}>
              <span className="dz-avatar dz-avatar--sm" style={{ background: 'var(--c-primary-bg)', color: 'var(--c-primary-text)' }}>
                <IconUpload size={15} />
              </span>
              <span className="dz-grow" style={{ fontSize: 13, fontWeight: 700 }}>إيصالات دفع للمراجعة</span>
              <span className={`dz-chip dz-chip--sm${awaitingReview.length ? ' dz-chip--accent' : ''}`}>{awaitingReview.length}</span>
              <IconForward size={16} />
            </button>
            <button type="button" className="dz-listrow" onClick={() => history.push('/admin/payouts')}>
              <span className="dz-avatar dz-avatar--sm" style={{ background: 'var(--c-accent-bg)', color: 'var(--c-accent-text)' }}>
                <IconPayout size={15} />
              </span>
              <span className="dz-grow" style={{ fontSize: 13, fontWeight: 700 }}>طلبات سحب من المدرسين</span>
              <span className={`dz-chip dz-chip--sm${openPayouts.length ? ' dz-chip--accent' : ''}`}>{openPayouts.length}</span>
              <IconForward size={16} />
            </button>
          </div>
        </section>

        <section style={{ marginBottom: 18 }}>
          <div className="dz-section-title">
            <span>آخر الحركات</span>
            <button type="button" className="dz-faint" style={{ background: 'none', border: 'none' }} onClick={() => history.push('/admin/payments')}>
              الدفتر كامل
            </button>
          </div>
          {recent.length === 0 ? (
            <EmptyState title="لا توجد حركات بعد" body="تُسجَّل الحركة عند تأكيد دفع الطالب." />
          ) : (
            <div className="dz-card">
              {recent.map((t) => (
                <div key={t.id} className="dz-listrow">
                  <span className="dz-grow">
                    <span style={{ fontSize: 13, fontWeight: 700, display: 'block' }}>
                      {t.learnerName} ← {teacherFor(t.teacherId)?.name.split(' ')[0]}
                    </span>
                    <span className="dz-muted" style={{ display: 'block', marginTop: 2 }}>
                      {formatDate(t.createdAt.slice(0, 10))} · عمولة {money(t.commission)}
                    </span>
                  </span>
                  <span className="dz-price">{money(t.gross)}</span>
                </div>
              ))}
            </div>
          )}
        </section>

        <section>
          <div className="dz-section-title">
            <span>النِّسب السارية</span>
            <button type="button" className="dz-btn dz-btn--ghost dz-btn--sm" onClick={() => history.push('/admin/settings')}>
              تعديل
            </button>
          </div>
          <div className="dz-card">
            <div className="dz-row" style={{ marginBottom: 10 }}>
              <IconChart size={18} />
              <span className="dz-h3">إعدادات المنصة</span>
            </div>
            {settings.commissionTiers.map((t) => (
              <div key={t.minSessions} className="dz-kv">
                <span className="dz-kv__k">{t.label} (من {t.minSessions} حصة)</span>
                <span className="dz-kv__v">{percent(t.rate)}</span>
              </div>
            ))}
            <div className="dz-kv"><span className="dz-kv__k">عمولة الحصص الجماعية</span><span className="dz-kv__v">{percent(settings.groupCommission)}</span></div>
            <div className="dz-kv"><span className="dz-kv__k">رسوم الإلغاء المتأخر</span><span className="dz-kv__v">{percent(settings.cancellationFee)}</span></div>
            <div className="dz-kv"><span className="dz-kv__k">نافذة الإلغاء المجاني</span><span className="dz-kv__v">{settings.freeCancellationHours} ساعة</span></div>
            <div className="dz-kv"><span className="dz-kv__k">الحد الأدنى للسحب</span><span className="dz-kv__v">{money(settings.minimumPayout)}</span></div>
            <div style={{ marginTop: 10 }}>
              <Banner tone="accent">تُقرأ هذه النِّسب من إعدادات المنصة — تغييرها لا يحتاج تعديل الكود.</Banner>
            </div>
          </div>
        </section>
      </div>

      <BottomNav active="home" />
    </div>
  );
}
