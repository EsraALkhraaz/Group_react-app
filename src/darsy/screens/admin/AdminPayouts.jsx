import React from 'react';
import { BottomNav, Banner, EmptyState, money, formatDate } from '../../components/common';
import { IconPayout } from '../../components/Icons';
import { useApp } from '../../state/AppContext';
import { walletOf } from '../../lib/money';

export default function AdminPayouts() {
  const {
    payouts, transactions, settings, payoutAccount, markPayoutPaid, teacherFor,
    refundRequests, settleBankRefund,
  } = useApp();

  const open = payouts.filter((p) => p.status === 'requested');
  const paid = payouts.filter((p) => p.status === 'paid');
  const refunds = refundRequests.filter((r) => r.status === 'requested');
  const settledRefunds = refundRequests.filter((r) => r.status !== 'requested');

  // Teachers who have a balance but have not asked for it yet.
  const balances = [...new Set(transactions.map((t) => t.teacherId))]
    .map((id) => ({ id, wallet: walletOf({ transactions, payouts, teacherId: id }) }))
    .filter(({ wallet }) => wallet.available > 0);

  return (
    <div className="dz-screen">
      <header className="dz-topbar">
        <div className="dz-grow">
          <h1 className="dz-topbar__title">السحوبات</h1>
          <div className="dz-topbar__sub">صرف مستحقات المدرسين</div>
        </div>
      </header>

      <div className="dz-body">
        <section style={{ marginBottom: 18 }}>
          <div className="dz-section-title"><span>طلبات بانتظار التحويل</span></div>
          {open.length === 0 ? (
            <EmptyState title="لا توجد طلبات سحب" body={`يطلب المدرس السحب عند بلوغ رصيده ${money(settings.minimumPayout)}.`} />
          ) : (
            <div className="dz-stack dz-stack--sm">
              {open.map((p) => (
                <div key={p.id} className="dz-card">
                  <div className="dz-row" style={{ marginBottom: 8 }}>
                    <span className="dz-avatar dz-avatar--sm" style={{ background: 'var(--c-accent-bg)', color: 'var(--c-accent-text)' }}>
                      <IconPayout size={15} />
                    </span>
                    <span className="dz-grow">
                      <span style={{ fontWeight: 700, fontSize: 14, display: 'block' }}>
                        {teacherFor(p.teacherId)?.name}
                      </span>
                      <span className="dz-muted" style={{ display: 'block', marginTop: 2 }}>
                        طُلب في {formatDate(p.requestedAt.slice(0, 10))}
                      </span>
                    </span>
                    <span className="dz-price">{money(p.amount)}</span>
                  </div>

                  <div className="dz-kv"><span className="dz-kv__k">المصرف</span><span className="dz-kv__v">{payoutAccount.bankName}</span></div>
                  <div className="dz-kv"><span className="dz-kv__k">رقم الحساب</span><span className="dz-kv__v" style={{ direction: 'ltr' }}>{payoutAccount.accountNumber}</span></div>

                  <button
                    type="button"
                    className="dz-btn dz-btn--success dz-btn--sm"
                    style={{ width: '100%', marginTop: 10 }}
                    onClick={() => markPayoutPaid(p.id)}
                  >
                    تأكيد التحويل
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>

        <section style={{ marginBottom: 18 }}>
          <div className="dz-section-title"><span>استرجاعات بنكية للطلاب</span></div>
          {refunds.length === 0 ? (
            <EmptyState
              title="لا توجد طلبات استرجاع"
              body="يطلبها الطالب عن المبالغ التي اعتذر عنها المدرس فقط."
            />
          ) : (
            <div className="dz-stack dz-stack--sm">
              {refunds.map((r) => (
                <div key={r.id} className="dz-card">
                  <div className="dz-row" style={{ marginBottom: 8 }}>
                    <span className="dz-grow">
                      <span style={{ fontWeight: 700, fontSize: 14, display: 'block' }}>
                        {r.payerRole === 'parent' ? 'ولي أمر' : 'طالب'} · حجز {r.bookingId.slice(-6)}
                      </span>
                      <span className="dz-muted" style={{ display: 'block', marginTop: 2 }}>
                        طُلب في {formatDate(r.requestedAt.slice(0, 10))}
                      </span>
                    </span>
                    <span className="dz-price">{money(r.amount)}</span>
                  </div>

                  <div className="dz-kv"><span className="dz-kv__k">المصرف</span><span className="dz-kv__v">{r.account.bankName}</span></div>
                  <div className="dz-kv"><span className="dz-kv__k">صاحب الحساب</span><span className="dz-kv__v">{r.account.holder}</span></div>
                  <div className="dz-kv"><span className="dz-kv__k">رقم الحساب</span><span className="dz-kv__v" style={{ direction: 'ltr' }}>{r.account.accountNumber}</span></div>

                  <div className="dz-row" style={{ gap: 8, marginTop: 10 }}>
                    <button
                      type="button"
                      className="dz-btn dz-btn--success dz-btn--sm"
                      style={{ flex: 1 }}
                      onClick={() => settleBankRefund(r.id, true)}
                    >
                      تأكيد التحويل
                    </button>
                    <button
                      type="button"
                      className="dz-btn dz-btn--ghost dz-btn--sm"
                      style={{ flex: 1 }}
                      onClick={() => settleBankRefund(r.id, false)}
                    >
                      تعذّر — أعده للرصيد
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
          {settledRefunds.length > 0 && (
            <div className="dz-card" style={{ marginTop: 10 }}>
              {settledRefunds.map((r) => (
                <div key={r.id} className="dz-listrow">
                  <span className="dz-grow">
                    <span style={{ fontSize: 13, fontWeight: 700, display: 'block' }}>حجز {r.bookingId.slice(-6)}</span>
                    <span className="dz-muted" style={{ display: 'block', marginTop: 2 }}>
                      {formatDate(r.settledAt.slice(0, 10))}
                    </span>
                  </span>
                  <span className={`dz-chip dz-chip--sm dz-chip--${r.status === 'paid' ? 'success' : 'danger'}`}>
                    {r.status === 'paid' ? 'حُوِّل' : 'أُعيد للرصيد'}
                  </span>
                  <span className="dz-price">{money(r.amount)}</span>
                </div>
              ))}
            </div>
          )}
        </section>

        <section style={{ marginBottom: 18 }}>
          <div className="dz-section-title"><span>أرصدة لم تُطلب بعد</span></div>
          {balances.length === 0 ? (
            <EmptyState title="لا توجد أرصدة مستحقة" body="يظهر الرصيد بعد تنفيذ الحصص المدفوعة." />
          ) : (
            <div className="dz-card">
              {balances.map(({ id, wallet }) => (
                <div key={id} className="dz-listrow">
                  <span className="dz-grow">
                    <span style={{ fontSize: 13, fontWeight: 700, display: 'block' }}>{teacherFor(id)?.name}</span>
                    <span className="dz-muted" style={{ display: 'block', marginTop: 2 }}>
                      محجوز له {money(wallet.pending)} · مسحوب {money(wallet.withdrawn)}
                    </span>
                  </span>
                  <span className="dz-price">{money(wallet.available)}<small>متاح</small></span>
                </div>
              ))}
            </div>
          )}
        </section>

        <section>
          <div className="dz-section-title"><span>تحويلات منفّذة</span></div>
          {paid.length === 0 ? (
            <EmptyState title="لا توجد تحويلات بعد" body="يُسجَّل التحويل هنا بعد تأكيده." />
          ) : (
            <div className="dz-card">
              {paid.map((p) => (
                <div key={p.id} className="dz-listrow">
                  <span className="dz-grow">
                    <span style={{ fontSize: 13, fontWeight: 700, display: 'block' }}>{teacherFor(p.teacherId)?.name}</span>
                    <span className="dz-muted" style={{ display: 'block', marginTop: 2 }}>
                      حُوِّل في {formatDate(p.paidAt.slice(0, 10))}
                    </span>
                  </span>
                  <span className="dz-price">{money(p.amount)}</span>
                </div>
              ))}
            </div>
          )}
          <div style={{ marginTop: 12 }}>
            <Banner tone="accent">
              لا يُصرف للمدرس إلا ما أُفرج عنه بعد تنفيذ الحصة — المبالغ المحجوزة تبقى لدى درسي.
            </Banner>
          </div>
        </section>
      </div>

      <BottomNav active="payouts" />
    </div>
  );
}
