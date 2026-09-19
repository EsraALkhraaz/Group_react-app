import React, { useState } from 'react';
import { useHistory } from 'react-router-dom';
import { TopBar, Field, Banner, Sheet, EmptyState, money, formatDate } from '../../components/common';
import { IconWallet, IconForward, IconUpload, IconPayout } from '../../components/Icons';
import { subjectById, PLATFORM_BANK } from '../../data/catalog';
import { useApp, BOOKING_STATUS, STATUS_LABEL, STATUS_TONE } from '../../state/AppContext';
import { walletOf, commissionRateFor, percent } from '../../lib/money';

const ME = 't1';

const PAID = [BOOKING_STATUS.CONFIRMED, BOOKING_STATUS.COMPLETED];

const TX_LABEL = {
  held: 'محجوز حتى الحصة',
  released: 'أُضيف لرصيدك',
  refunded: 'مُسترجع للطالب',
  partially_refunded: 'إلغاء متأخر — تعويض لك',
};
const TX_TONE = {
  held: 'accent', released: 'success', refunded: 'danger', partially_refunded: 'accent',
};

const PAYOUT_LABEL = { requested: 'طلب سحب قيد التنفيذ', paid: 'تم التحويل' };

// A zero deduction reads better without a minus sign in front of it.
const minus = (n) => (n > 0 ? `- ${money(n)}` : money(n));

function CreditCard({ credit }) {
  return (
    <section style={{ marginBottom: 18 }}>
      <div className="dz-section-title"><span>رصيدي في درسي</span></div>
      <div className="dz-card">
        <div className="dz-row" style={{ marginBottom: 10 }}>
          <IconWallet size={18} />
          <span className="dz-h3">{money(credit.balance)}</span>
        </div>
        <div className="dz-muted" style={{ marginBottom: 10 }}>
          يُستخدم الرصيد مباشرةً في أي حجز قادم بدل التحويل المصرفي، ولا ينتهي بالتقادم.
        </div>
        <Banner tone="accent">
          الرصيد لا يُحوَّل إلى حساب مصرفي — قيمته تبقى داخل درسي وتُستخدم في الحجوزات فقط.
        </Banner>
        <div style={{ height: credit.entries.length ? 12 : 0 }} />
        {credit.entries.map((e) => (
          <div key={e.id} className="dz-kv">
            <span className="dz-kv__k">{e.reason} · {formatDate(e.at.slice(0, 10))}</span>
            <span className="dz-kv__v" style={{ color: e.amount < 0 ? 'var(--c-muted)' : 'var(--c-success)' }}>
              {e.amount < 0 ? `- ${money(-e.amount)}` : `+ ${money(e.amount)}`}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}

function LearnerPayments({ bookings, teacherFor, onOpen, credit }) {
  const paid = bookings.filter((b) => PAID.includes(b.status));
  const due = bookings.filter((b) => b.status === BOOKING_STATUS.AWAITING_PAYMENT);
  const reviewing = bookings.filter((b) => b.status === BOOKING_STATUS.PAYMENT_REVIEW);
  const billed = [...due, ...reviewing, ...paid];

  return (
    <>
      <div className="dz-stats" style={{ marginBottom: 16 }}>
        <div className="dz-stats__cell">
          <div className="dz-stats__num">{paid.reduce((s, b) => s + b.price, 0)}</div>
          <div className="dz-stats__lbl">د.ل مدفوعة</div>
        </div>
        <div className="dz-stats__cell">
          <div className="dz-stats__num">{due.length}</div>
          <div className="dz-stats__lbl">بانتظار الدفع</div>
        </div>
        <div className="dz-stats__cell">
          <div className="dz-stats__num">{reviewing.length}</div>
          <div className="dz-stats__lbl">قيد المراجعة</div>
        </div>
      </div>

      {(credit.balance > 0 || credit.entries.length > 0) && <CreditCard credit={credit} />}

      <section style={{ marginBottom: 18 }}>
        <div className="dz-section-title"><span>حساب التحويل</span></div>
        <div className="dz-card">
          <div className="dz-row" style={{ marginBottom: 10 }}>
            <IconWallet size={18} />
            <span className="dz-h3">حساب منصة درسي</span>
          </div>
          <div className="dz-kv"><span className="dz-kv__k">المصرف</span><span className="dz-kv__v">{PLATFORM_BANK.bankName}</span></div>
          <div className="dz-kv"><span className="dz-kv__k">اسم الحساب</span><span className="dz-kv__v">{PLATFORM_BANK.accountName}</span></div>
          <div className="dz-kv"><span className="dz-kv__k">رقم الحساب</span><span className="dz-kv__v" style={{ direction: 'ltr' }}>{PLATFORM_BANK.accountNumber}</span></div>
          <Banner tone="accent">
            يُحوَّل المبلغ لحساب المنصة، ثم تُصرف مستحقات المدرس بعد إتمام الحصة.
          </Banner>
        </div>
      </section>

      <section>
        <div className="dz-section-title"><span>الفواتير</span></div>
        {billed.length === 0 ? (
          <EmptyState title="لا توجد فواتير بعد" body="ستظهر هنا كل حصة دفعت أو ستدفع مقابلها." />
        ) : (
          <div className="dz-card">
            {billed.map((b) => (
              <button key={b.id} type="button" className="dz-listrow" onClick={() => onOpen(b.id)}>
                <span className="dz-grow">
                  <span style={{ fontSize: 13, fontWeight: 700, display: 'block' }}>
                    {subjectById(b.subjectId)?.name} — {teacherFor(b.teacherId).name.split(' ')[0]}
                  </span>
                  <span className="dz-muted" style={{ display: 'block', marginTop: 2 }}>
                    {formatDate(b.date)} · {b.learnerName}
                  </span>
                  <span className="dz-row" style={{ gap: 6, marginTop: 6, flexWrap: 'wrap' }}>
                    <span className={`dz-chip dz-chip--sm dz-chip--${STATUS_TONE[b.status]}`}>{STATUS_LABEL[b.status]}</span>
                    {b.receipt && (
                      <span className="dz-chip dz-chip--sm">
                        <IconUpload size={11} /> {b.receipt.fileName}
                      </span>
                    )}
                  </span>
                </span>
                <span className="dz-price">{money(b.price)}</span>
                <IconForward size={16} />
              </button>
            ))}
          </div>
        )}
      </section>
    </>
  );
}

// The teacher's side of the ledger: what Darsy collected for them, what it
// still holds, what was released, and what already went out.
function TeacherWallet({ onEdit, onWithdraw }) {
  const {
    transactions, payouts, payoutAccount, settings, completedSessionsOf,
  } = useApp();

  const wallet = walletOf({ transactions, payouts, teacherId: ME });
  const mine = transactions.filter((t) => t.teacherId === ME);
  const myPayouts = payouts.filter((p) => p.teacherId === ME);

  const rate = commissionRateFor({
    settings,
    completedSessions: completedSessionsOf(ME),
    sessionType: 'individual',
  });

  const hasAccount = Boolean(payoutAccount.accountNumber);
  const belowMinimum = wallet.available < settings.minimumPayout;
  const canWithdraw = hasAccount && !belowMinimum;

  return (
    <>
      <section style={{ marginBottom: 18 }}>
        <div className="dz-section-title"><span>محفظتي</span></div>
        <div className="dz-card">
          <div className="dz-row" style={{ marginBottom: 10 }}>
            <IconWallet size={18} />
            <span className="dz-h3">الرصيد</span>
          </div>
          <div className="dz-kv"><span className="dz-kv__k">إجمالي الحجوزات المدفوعة</span><span className="dz-kv__v">{money(wallet.gross)}</span></div>
          <div className="dz-kv"><span className="dz-kv__k">عمولة درسي</span><span className="dz-kv__v">{minus(wallet.commission)}</span></div>
          <div className="dz-kv"><span className="dz-kv__k">أرباح مُفرج عنها</span><span className="dz-kv__v">{money(wallet.earned)}</span></div>
          <div className="dz-kv"><span className="dz-kv__k">قيد الانتظار (حصص لم تُنفَّذ)</span><span className="dz-kv__v">{money(wallet.pending)}</span></div>
          <div className="dz-kv"><span className="dz-kv__k">المسحوب</span><span className="dz-kv__v">{minus(wallet.withdrawn)}</span></div>
          {wallet.requested > 0 && (
            <div className="dz-kv"><span className="dz-kv__k">طلب سحب قيد التنفيذ</span><span className="dz-kv__v">{minus(wallet.requested)}</span></div>
          )}
          <div className="dz-kv dz-total"><span className="dz-kv__k">الرصيد المتاح للسحب</span><span className="dz-kv__v">{money(wallet.available)}</span></div>

          <div style={{ marginTop: 12 }}>
            <button
              type="button"
              className="dz-btn dz-btn--primary"
              style={{ width: '100%' }}
              disabled={!canWithdraw}
              onClick={onWithdraw}
            >
              <IconPayout size={16} /> طلب سحب الرصيد
            </button>
            {!hasAccount && (
              <div style={{ marginTop: 10 }}>
                <Banner tone="danger">أضف حساب استلام المستحقات أولاً.</Banner>
              </div>
            )}
            {hasAccount && belowMinimum && (
              <div className="dz-faint" style={{ marginTop: 8, textAlign: 'center' }}>
                الحد الأدنى للسحب {money(settings.minimumPayout)} — رصيدك الآن {money(wallet.available)}.
              </div>
            )}
          </div>

          <div style={{ marginTop: 12 }}>
            <Banner tone="primary">
              عمولتك الحالية {percent(rate)} بعد {completedSessionsOf(ME)} حصة مكتملة.
            </Banner>
          </div>
        </div>
      </section>

      <section style={{ marginBottom: 18 }}>
        <div className="dz-section-title">
          <span>حساب استلام المستحقات</span>
          <button type="button" className="dz-btn dz-btn--ghost dz-btn--sm" onClick={onEdit}>تعديل</button>
        </div>
        <div className="dz-card">
          {hasAccount ? (
            <>
              <div className="dz-kv"><span className="dz-kv__k">المصرف</span><span className="dz-kv__v">{payoutAccount.bankName}</span></div>
              <div className="dz-kv"><span className="dz-kv__k">اسم صاحب الحساب</span><span className="dz-kv__v">{payoutAccount.holder}</span></div>
              <div className="dz-kv"><span className="dz-kv__k">رقم الحساب</span><span className="dz-kv__v" style={{ direction: 'ltr' }}>{payoutAccount.accountNumber}</span></div>
            </>
          ) : (
            <Banner tone="danger">لم تضف حساب استلام بعد — أضفه لتصل مستحقاتك.</Banner>
          )}
        </div>
      </section>

      {myPayouts.length > 0 && (
        <section style={{ marginBottom: 18 }}>
          <div className="dz-section-title"><span>طلبات السحب</span></div>
          <div className="dz-card">
            {myPayouts.map((p) => (
              <div key={p.id} className="dz-listrow">
                <span className="dz-grow">
                  <span style={{ fontSize: 13, fontWeight: 700, display: 'block' }}>{money(p.amount)}</span>
                  <span className="dz-muted" style={{ display: 'block', marginTop: 2 }}>
                    {formatDate(p.requestedAt.slice(0, 10))}
                  </span>
                </span>
                <span className={`dz-chip dz-chip--sm dz-chip--${p.status === 'paid' ? 'success' : 'accent'}`}>
                  {PAYOUT_LABEL[p.status]}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      <section>
        <div className="dz-section-title"><span>كشف الحركات</span></div>
        {mine.length === 0 ? (
          <EmptyState title="لا توجد حركات بعد" body="تُسجَّل الحركة عند تأكيد دفع الطالب." />
        ) : (
          <div className="dz-card">
            {mine.map((t) => (
              <div key={t.id} className="dz-listrow">
                <span className="dz-grow">
                  <span style={{ fontSize: 13, fontWeight: 700, display: 'block' }}>
                    {t.learnerName} — {money(t.gross)}
                  </span>
                  <span className="dz-muted" style={{ display: 'block', marginTop: 2 }}>
                    عمولة درسي {money(t.commission)} · {formatDate(t.createdAt.slice(0, 10))}
                  </span>
                  <span className="dz-row" style={{ gap: 6, marginTop: 6 }}>
                    <span className={`dz-chip dz-chip--sm dz-chip--${TX_TONE[t.status]}`}>{TX_LABEL[t.status]}</span>
                  </span>
                </span>
                <span className="dz-price">
                  {money(t.tutorEarning)}
                  <small>نصيبك</small>
                </span>
              </div>
            ))}
          </div>
        )}
      </section>
    </>
  );
}

export default function Payments() {
  const history = useHistory();
  const {
    base, role, bookings, teacherFor, payoutAccount, setPayoutAccount,
    transactions, payouts, settings, requestPayout, creditOf,
  } = useApp();

  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(payoutAccount);
  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const [done, setDone] = useState(false);

  const isTeacher = role === 'teacher';
  const wallet = walletOf({ transactions, payouts, teacherId: ME });

  return (
    <div className="dz-screen">
      <TopBar
        back
        title={isTeacher ? 'محفظتي والمستحقات' : 'المدفوعات والفواتير'}
        onBack={() => history.push(`${base}/account`)}
      />

      <div className="dz-body">
        {done && (
          <div style={{ marginBottom: 14 }}>
            <Banner tone="success">أُرسل طلب السحب — تراجعه إدارة درسي ثم تُحوَّل لحسابك.</Banner>
          </div>
        )}

        {isTeacher ? (
          <TeacherWallet
            onEdit={() => { setDraft(payoutAccount); setOpen(true); }}
            onWithdraw={() => { setDone(false); setWithdrawOpen(true); }}
          />
        ) : (
          <LearnerPayments
            bookings={bookings}
            teacherFor={teacherFor}
            credit={creditOf(role)}
            onOpen={(id) => history.push(`${base}/booking/${id}`)}
          />
        )}
      </div>

      <Sheet open={withdrawOpen} onClose={() => setWithdrawOpen(false)} title="طلب سحب الرصيد">
        <div className="dz-stack">
          <div className="dz-card">
            <div className="dz-kv"><span className="dz-kv__k">المبلغ المطلوب</span><span className="dz-kv__v">{money(wallet.available)}</span></div>
            <div className="dz-kv"><span className="dz-kv__k">الحد الأدنى</span><span className="dz-kv__v">{money(settings.minimumPayout)}</span></div>
            <div className="dz-kv"><span className="dz-kv__k">يُحوَّل إلى</span><span className="dz-kv__v">{payoutAccount.bankName}</span></div>
            <div className="dz-kv"><span className="dz-kv__k">رقم الحساب</span><span className="dz-kv__v" style={{ direction: 'ltr' }}>{payoutAccount.accountNumber}</span></div>
          </div>
          <Banner tone="accent">
            يُخصم المبلغ من رصيدك فور إرسال الطلب، ويُسجَّل كمسحوب بعد تحويل الإدارة له.
          </Banner>
          <button
            type="button"
            className="dz-btn dz-btn--primary"
            onClick={() => {
              requestPayout(ME, wallet.available);
              setWithdrawOpen(false);
              setDone(true);
            }}
          >
            تأكيد طلب السحب
          </button>
        </div>
      </Sheet>

      <Sheet open={open} onClose={() => setOpen(false)} title="حساب استلام المستحقات">
        <div className="dz-stack">
          <Field label="اسم المصرف">
            <input className="dz-input" value={draft.bankName} onChange={(e) => setDraft({ ...draft, bankName: e.target.value })} />
          </Field>
          <Field label="اسم صاحب الحساب">
            <input className="dz-input" value={draft.holder} onChange={(e) => setDraft({ ...draft, holder: e.target.value })} />
          </Field>
          <Field label="رقم الحساب">
            <input
              className="dz-input"
              value={draft.accountNumber}
              onChange={(e) => setDraft({ ...draft, accountNumber: e.target.value })}
              style={{ direction: 'ltr', textAlign: 'right' }}
            />
          </Field>
          <button
            type="button"
            className="dz-btn dz-btn--primary"
            disabled={!draft.bankName.trim() || !draft.holder.trim() || draft.accountNumber.trim().length < 6}
            onClick={() => { setPayoutAccount(draft); setOpen(false); }}
          >
            حفظ
          </button>
        </div>
      </Sheet>
    </div>
  );
}
