import React, { useState } from 'react';
import { BottomNav, Banner, EmptyState, money, formatDate } from '../../components/common';
import { IconUpload } from '../../components/Icons';
import { subjectById } from '../../data/catalog';
import { useApp, BOOKING_STATUS } from '../../state/AppContext';
import { percent } from '../../lib/money';

const TX_LABEL = {
  held: 'محجوز',
  released: 'مُفرج عنه',
  refunded: 'مُسترجع بالكامل',
  partially_refunded: 'إلغاء متأخر — رسوم محتجزة',
};
const TX_TONE = {
  held: 'accent', released: 'success', refunded: 'danger', partially_refunded: 'accent',
};

const FILTERS = [
  { key: 'all', label: 'الكل' },
  { key: 'held', label: 'محجوز' },
  { key: 'released', label: 'مُفرج عنه' },
  { key: 'refunded', label: 'مُسترجع' },
  { key: 'partially_refunded', label: 'إلغاء متأخر' },
];

export default function AdminPayments() {
  const { bookings, transactions, confirmPayment, teacherFor } = useApp();
  const [filter, setFilter] = useState('all');

  const toReview = bookings.filter((b) => b.status === BOOKING_STATUS.PAYMENT_REVIEW);
  const ledger = filter === 'all' ? transactions : transactions.filter((t) => t.status === filter);

  return (
    <div className="dz-screen">
      <header className="dz-topbar">
        <div className="dz-grow">
          <h1 className="dz-topbar__title">المدفوعات</h1>
          <div className="dz-topbar__sub">مراجعة الإيصالات ودفتر الحركات</div>
        </div>
      </header>

      <div className="dz-body">
        <section style={{ marginBottom: 18 }}>
          <div className="dz-section-title"><span>إيصالات بانتظار المراجعة</span></div>
          {toReview.length === 0 ? (
            <EmptyState title="لا توجد إيصالات للمراجعة" body="يظهر هنا كل تحويل رفعه طالب ولم يُؤكَّد بعد." />
          ) : (
            <div className="dz-stack dz-stack--sm">
              {toReview.map((b) => (
                <div key={b.id} className="dz-card">
                  <div className="dz-row" style={{ marginBottom: 8 }}>
                    <span className="dz-grow">
                      <span style={{ fontWeight: 700, fontSize: 14, display: 'block' }}>
                        {b.learnerName} — {subjectById(b.subjectId)?.name}
                      </span>
                      <span className="dz-muted" style={{ display: 'block', marginTop: 2 }}>
                        {teacherFor(b.teacherId)?.name} · {formatDate(b.date)}
                      </span>
                    </span>
                    <span className="dz-price">{money(b.price)}</span>
                  </div>

                  {b.receipt && (
                    <div className="dz-row" style={{ gap: 6, marginBottom: 8 }}>
                      <span className="dz-chip dz-chip--sm">
                        <IconUpload size={11} /> {b.receipt.fileName}
                      </span>
                    </div>
                  )}

                  <div className="dz-kv"><span className="dz-kv__k">عمولة درسي ({percent(b.commissionRate)})</span><span className="dz-kv__v">{money(b.platformFee)}</span></div>
                  <div className="dz-kv"><span className="dz-kv__k">نصيب المدرس</span><span className="dz-kv__v">{money(b.tutorAmount)}</span></div>

                  <button
                    type="button"
                    className="dz-btn dz-btn--primary dz-btn--sm"
                    style={{ width: '100%', marginTop: 10 }}
                    onClick={() => confirmPayment(b.id)}
                  >
                    تأكيد استلام المبلغ
                  </button>
                  <div className="dz-faint" style={{ marginTop: 8 }}>
                    يؤكِّد الحجز ويفتح حركة محجوزة باسم المدرس حتى تُنفَّذ الحصة.
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section>
          <div className="dz-section-title"><span>دفتر الحركات</span></div>
          <div className="dz-chiprow" style={{ marginBottom: 10 }}>
            {FILTERS.map((f) => (
              <button
                key={f.key}
                type="button"
                className={`dz-chip${filter === f.key ? ' dz-chip--active' : ''}`}
                onClick={() => setFilter(f.key)}
              >
                {f.label}
              </button>
            ))}
          </div>

          {ledger.length === 0 ? (
            <EmptyState title="لا توجد حركات" body="غيّر التصفية أو انتظر أول دفعة مؤكدة." />
          ) : (
            <div className="dz-card">
              {ledger.map((t) => (
                <div key={t.id} className="dz-listrow">
                  <span className="dz-grow">
                    <span style={{ fontSize: 13, fontWeight: 700, display: 'block' }}>
                      {t.learnerName} ← {teacherFor(t.teacherId)?.name.split(' ')[0]}
                    </span>
                    <span className="dz-muted" style={{ display: 'block', marginTop: 2 }}>
                      عمولة {money(t.commission)} · للمدرس {money(t.tutorEarning)}
                      {t.refundedAmount > 0 && ` · مُسترجع ${money(t.refundedAmount)}`}
                    </span>
                    <span className="dz-row" style={{ gap: 6, marginTop: 6 }}>
                      <span className={`dz-chip dz-chip--sm dz-chip--${TX_TONE[t.status]}`}>{TX_LABEL[t.status]}</span>
                      <span className="dz-chip dz-chip--sm">{formatDate(t.createdAt.slice(0, 10))}</span>
                    </span>
                  </span>
                  <span className="dz-price">{money(t.gross)}</span>
                </div>
              ))}
            </div>
          )}

          <div style={{ marginTop: 12 }}>
            <Banner tone="primary">
              يدفع الطالب لدرسي، ويبقى المبلغ محجوزًا حتى يؤكد المدرس تنفيذ الحصة، ثم يُقسَّم.
            </Banner>
          </div>
        </section>
      </div>

      <BottomNav active="payments" />
    </div>
  );
}
