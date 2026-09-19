import React, { useState } from 'react';
import { useHistory } from 'react-router-dom';
import { TopBar, Field, Banner, Sheet, EmptyState, money, formatDate } from '../../components/common';
import { IconWallet, IconForward, IconUpload } from '../../components/Icons';
import { subjectById, PLATFORM_BANK, COMMISSION_RATE } from '../../data/catalog';
import { useApp, BOOKING_STATUS, STATUS_LABEL, STATUS_TONE } from '../../state/AppContext';

const ME = 't1';

const PAID = [BOOKING_STATUS.CONFIRMED, BOOKING_STATUS.COMPLETED];

function LearnerPayments({ bookings, teacherFor, onOpen }) {
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

function TeacherPayouts({ bookings, payoutAccount, onEdit }) {
  const mine = bookings.filter((b) => b.teacherId === ME);
  const earned = mine.filter((b) => [BOOKING_STATUS.CONFIRMED, BOOKING_STATUS.COMPLETED].includes(b.status));
  const gross = earned.reduce((s, b) => s + b.price, 0);
  const commission = Math.round(gross * COMMISSION_RATE);

  return (
    <>
      <section style={{ marginBottom: 18 }}>
        <div className="dz-section-title">
          <span>حساب استلام المستحقات</span>
          <button type="button" className="dz-btn dz-btn--ghost dz-btn--sm" onClick={onEdit}>تعديل</button>
        </div>
        <div className="dz-card">
          {payoutAccount.accountNumber ? (
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

      <section style={{ marginBottom: 18 }}>
        <div className="dz-section-title"><span>ملخص المستحقات</span></div>
        <div className="dz-card">
          <div className="dz-kv"><span className="dz-kv__k">إجمالي الحجوزات</span><span className="dz-kv__v">{money(gross)}</span></div>
          <div className="dz-kv"><span className="dz-kv__k">عمولة المنصة ({Math.round(COMMISSION_RATE * 100)}%)</span><span className="dz-kv__v">- {money(commission)}</span></div>
          <div className="dz-kv dz-total"><span className="dz-kv__k">صافي المستحق</span><span className="dz-kv__v">{money(gross - commission)}</span></div>
        </div>
      </section>

      <section>
        <div className="dz-section-title"><span>الحصص المحتسبة</span></div>
        {earned.length === 0 ? (
          <EmptyState title="لا توجد مستحقات بعد" body="تُحتسب الحصة بعد تأكيد حجزها." />
        ) : (
          <div className="dz-card">
            {earned.map((b) => (
              <div key={b.id} className="dz-listrow">
                <span className="dz-grow">
                  <span style={{ fontSize: 13, fontWeight: 700, display: 'block' }}>
                    {b.learnerName} — {subjectById(b.subjectId)?.name}
                  </span>
                  <span className="dz-muted" style={{ display: 'block', marginTop: 2 }}>{formatDate(b.date)}</span>
                </span>
                <span className="dz-price">
                  {money(b.price - Math.round(b.price * COMMISSION_RATE))}
                  <small>بعد العمولة</small>
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
  const { base, role, bookings, teacherFor, payoutAccount, setPayoutAccount } = useApp();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(payoutAccount);

  const isTeacher = role === 'teacher';

  return (
    <div className="dz-screen">
      <TopBar
        back
        title={isTeacher ? 'المستحقات والفواتير' : 'المدفوعات والفواتير'}
        onBack={() => history.push(`${base}/account`)}
      />

      <div className="dz-body">
        {isTeacher ? (
          <TeacherPayouts
            bookings={bookings}
            payoutAccount={payoutAccount}
            onEdit={() => { setDraft(payoutAccount); setOpen(true); }}
          />
        ) : (
          <LearnerPayments
            bookings={bookings}
            teacherFor={teacherFor}
            onOpen={(id) => history.push(`${base}/booking/${id}`)}
          />
        )}
      </div>

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
