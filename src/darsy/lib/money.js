// The money rules live here and read their numbers from platform settings,
// so a rate change is an admin edit rather than a code change.

// A teacher's rate comes from the tier their completed-session count falls in.
export const commissionRateFor = ({ settings, completedSessions, sessionType }) => {
  if (sessionType === 'group') return settings.groupCommission;

  const tier = [...settings.commissionTiers]
    .sort((a, b) => a.minSessions - b.minSessions)
    .reduce((chosen, t) => (completedSessions >= t.minSessions ? t : chosen), settings.commissionTiers[0]);

  return tier.rate;
};

// One place decides how a paid amount is split, so the booking, the ledger and
// the dashboards can never disagree about it.
const round2 = (n) => Math.round(n * 100) / 100;

export const splitAmount = (gross, rate) => {
  const commission = round2(gross * rate);
  return { gross, commission, tutorEarning: round2(gross - commission) };
};

export const percent = (rate) => `${Math.round(rate * 100)}%`;

// What a teacher may withdraw: earnings released to them, less what already went out.
export const walletOf = ({ transactions, payouts, teacherId }) => {
  const mine = transactions.filter((t) => t.teacherId === teacherId);

  const sum = (list, key) => list.reduce((total, t) => total + t[key], 0);

  const released = mine.filter((t) => t.status === 'released');
  const held = mine.filter((t) => t.status === 'held');

  const paidOut = payouts
    .filter((p) => p.teacherId === teacherId && p.status === 'paid')
    .reduce((total, p) => total + p.amount, 0);

  const requested = payouts
    .filter((p) => p.teacherId === teacherId && p.status === 'requested')
    .reduce((total, p) => total + p.amount, 0);

  const earned = sum(released, 'tutorEarning');

  return {
    gross: sum([...released, ...held], 'gross'),
    commission: sum([...released, ...held], 'commission'),
    earned,
    pending: sum(held, 'tutorEarning'),
    withdrawn: paidOut,
    requested,
    available: earned - paidOut - requested,
  };
};

// The platform's side of the same ledger.
export const platformTotals = ({ transactions, payouts }) => {
  const sum = (list, key) => list.reduce((total, t) => total + t[key], 0);

  const live = transactions.filter((t) => t.status !== 'refunded');
  const released = transactions.filter((t) => t.status === 'released');
  const held = transactions.filter((t) => t.status === 'held');
  const refunded = transactions.filter((t) => t.status === 'refunded');

  const paidOut = payouts.filter((p) => p.status === 'paid').reduce((total, p) => total + p.amount, 0);

  return {
    gmv: sum(live, 'gross'),
    commission: sum(live, 'commission'),
    heldForTeachers: sum(held, 'tutorEarning'),
    releasedToTeachers: sum(released, 'tutorEarning'),
    withdrawn: paidOut,
    dueToTeachers: sum(released, 'tutorEarning') - paidOut,
    refunded: sum(refunded, 'gross'),
    netRevenue: sum(live, 'commission'),
  };
};
