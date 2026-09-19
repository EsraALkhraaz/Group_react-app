import React, { useState } from 'react';
import { useHistory } from 'react-router-dom';
import { BottomNav, Banner, Field, money } from '../../components/common';
import { IconCheck, IconSliders } from '../../components/Icons';
import { useApp } from '../../state/AppContext';
import { percent } from '../../lib/money';

// The admin edits percentages; the app stores fractions.
const toPercent = (rate) => String(Math.round(rate * 1000) / 10);
const toRate = (value) => Number(value) / 100;

const draftFrom = (settings) => ({
  tiers: settings.commissionTiers.map((t) => ({
    label: t.label,
    minSessions: String(t.minSessions),
    rate: toPercent(t.rate),
  })),
  groupCommission: toPercent(settings.groupCommission),
  cancellationFee: toPercent(settings.cancellationFee),
  paymentFee: toPercent(settings.paymentFee),
  minimumPayout: String(settings.minimumPayout),
});

const validPercent = (v) => {
  const n = Number(v);
  return v !== '' && Number.isFinite(n) && n >= 0 && n <= 60;
};

const validCount = (v) => {
  const n = Number(v);
  return v !== '' && Number.isFinite(n) && n >= 0;
};

function PercentInput({ label, hint, value, onChange }) {
  return (
    <Field label={label} hint={hint}>
      <input
        className="dz-input"
        type="number"
        inputMode="decimal"
        min="0"
        max="60"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </Field>
  );
}

export default function AdminSettings() {
  const history = useHistory();
  const { settings, updateSettings, signOut } = useApp();

  const [draft, setDraft] = useState(() => draftFrom(settings));
  const [saved, setSaved] = useState(false);

  const setTier = (i, key) => (v) =>
    setDraft((d) => ({
      ...d,
      tiers: d.tiers.map((t, idx) => (idx === i ? { ...t, [key]: v } : t)),
    }));

  const set = (key) => (v) => { setDraft((d) => ({ ...d, [key]: v })); setSaved(false); };

  const valid = draft.tiers.every((t) => validPercent(t.rate) && validCount(t.minSessions))
    && validPercent(draft.groupCommission)
    && validPercent(draft.cancellationFee)
    && validPercent(draft.paymentFee)
    && validCount(draft.minimumPayout);

  const save = () => {
    updateSettings({
      commissionTiers: draft.tiers
        .map((t) => ({ label: t.label, minSessions: Number(t.minSessions), rate: toRate(t.rate) }))
        .sort((a, b) => a.minSessions - b.minSessions),
      groupCommission: toRate(draft.groupCommission),
      cancellationFee: toRate(draft.cancellationFee),
      paymentFee: toRate(draft.paymentFee),
      minimumPayout: Number(draft.minimumPayout),
    });
    setSaved(true);
  };

  return (
    <div className="dz-screen">
      <header className="dz-topbar">
        <div className="dz-grow">
          <h1 className="dz-topbar__title">إعدادات المنصة</h1>
          <div className="dz-topbar__sub">النِّسب والحدود المالية</div>
        </div>
      </header>

      <div className="dz-body">
        {saved && (
          <div style={{ marginBottom: 14 }}>
            <Banner tone="success" icon={<IconCheck size={18} />}>
              حُفظت الإعدادات — تسري على الحجوزات الجديدة فقط.
            </Banner>
          </div>
        )}

        <section style={{ marginBottom: 18 }}>
          <div className="dz-section-title"><span>شرائح العمولة</span></div>
          <div className="dz-card">
            <div className="dz-row" style={{ marginBottom: 10 }}>
              <IconSliders size={18} />
              <span className="dz-h3">كلما زادت حصص المدرس قلّت عمولته</span>
            </div>
            <div className="dz-stack">
              {draft.tiers.map((t, i) => (
                <div key={t.label} className="dz-card dz-card--soft">
                  <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 8 }}>{t.label}</div>
                  <div className="dz-row" style={{ gap: 10, alignItems: 'flex-start' }}>
                    <span className="dz-grow">
                      <Field label="من عدد حصص">
                        <input
                          className="dz-input"
                          type="number"
                          inputMode="numeric"
                          min="0"
                          value={t.minSessions}
                          onChange={(e) => { setTier(i, 'minSessions')(e.target.value); setSaved(false); }}
                        />
                      </Field>
                    </span>
                    <span className="dz-grow">
                      <Field label="العمولة %">
                        <input
                          className="dz-input"
                          type="number"
                          inputMode="decimal"
                          min="0"
                          max="60"
                          value={t.rate}
                          onChange={(e) => { setTier(i, 'rate')(e.target.value); setSaved(false); }}
                        />
                      </Field>
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section style={{ marginBottom: 18 }}>
          <div className="dz-section-title"><span>نِسب أخرى</span></div>
          <div className="dz-card">
            <div className="dz-stack">
              <PercentInput
                label="عمولة الحصص الجماعية %"
                hint="تُطبَّق بدل الشرائح على الحصة الجماعية"
                value={draft.groupCommission}
                onChange={set('groupCommission')}
              />
              <PercentInput
                label="رسوم الإلغاء المتأخر %"
                hint="تُخصم من المبلغ المُسترجع للطالب"
                value={draft.cancellationFee}
                onChange={set('cancellationFee')}
              />
              <PercentInput
                label="رسوم بوابة الدفع %"
                hint="صفر حاليًا — التحويل المصرفي بلا رسوم منصة"
                value={draft.paymentFee}
                onChange={set('paymentFee')}
              />
              <Field label="الحد الأدنى للسحب (د.ل)" hint={`الحالي ${money(settings.minimumPayout)}`}>
                <input
                  className="dz-input"
                  type="number"
                  inputMode="numeric"
                  min="0"
                  value={draft.minimumPayout}
                  onChange={(e) => set('minimumPayout')(e.target.value)}
                />
              </Field>
            </div>
          </div>
        </section>

        <section style={{ marginBottom: 18 }}>
          <div className="dz-card">
            <div className="dz-kv"><span className="dz-kv__k">مثال: حصة 50 د.ل لمدرس نشط</span><span className="dz-kv__v">&nbsp;</span></div>
            <div className="dz-kv"><span className="dz-kv__k">عمولة درسي</span><span className="dz-kv__v">{percent(toRate(draft.tiers[draft.tiers.length - 1].rate) || 0)}</span></div>
            <div className="dz-kv dz-total">
              <span className="dz-kv__k">يصل المدرس</span>
              <span className="dz-kv__v">{money(50 - 50 * (toRate(draft.tiers[draft.tiers.length - 1].rate) || 0))}</span>
            </div>
          </div>
        </section>

        <div className="dz-stack dz-stack--sm">
          <button type="button" className="dz-btn dz-btn--primary" disabled={!valid} onClick={save}>
            حفظ الإعدادات
          </button>
          <button
            type="button"
            className="dz-btn dz-btn--ghost dz-btn--sm"
            style={{ width: '100%' }}
            onClick={() => { setDraft(draftFrom(settings)); setSaved(false); }}
          >
            استرجاع القيم المحفوظة
          </button>
          <button
            type="button"
            className="dz-btn dz-btn--ghost dz-btn--sm"
            style={{ width: '100%' }}
            onClick={() => { signOut(); history.push('/'); }}
          >
            تسجيل الخروج
          </button>
        </div>
      </div>

      <BottomNav active="settings" />
    </div>
  );
}
