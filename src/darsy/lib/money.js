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

// Statuses a ledger entry can hold. A late cancellation leaves an entry that is
// neither fully refunded nor fully earned, so it gets its own status.
export const TX = {
  HELD: 'held',
  RELEASED: 'released',
  REFUNDED: 'refunded',
  PARTIAL: 'partially_refunded',
};

// What the teacher has actually earned on an entry: released in full, or the
// part kept from a late cancellation.
const EARNING_STATUSES = [TX.RELEASED, TX.PARTIAL];

// What the student really paid in the end.
const net = (t) => round2(t.gross - (t.refundedAmount || 0));

export const hoursUntil = (booking, now = new Date()) => {
  const start = new Date(`${booking.date}T${booking.time || '00:00'}:00`);
  return (start - now) / 3600000;
};

// Cancelling in time refunds everything. Cancelling late keeps a fee, split
// between the teacher and Darsy exactly as the session itself would have been —
// the fee exists to protect the teacher's time, not only the platform's cut.
export const cancellationOutcome = ({ settings, booking, transaction, now }) => {
  const gross = transaction ? transaction.gross : booking.price;
  const late = hoursUntil(booking, now) < settings.freeCancellationHours;
  const retained = late ? round2(gross * settings.cancellationFee) : 0;
  const commission = round2(retained * (booking.commissionRate || 0));

  return {
    late,
    retained,
    refund: round2(gross - retained),
    commission,
    tutorEarning: round2(retained - commission),
  };
};

// What a teacher may withdraw: earnings released to them, less what already went out.
export const walletOf = ({ transactions, payouts, teacherId }) => {
  const mine = transactions.filter((t) => t.teacherId === teacherId);

  const sum = (list, key) => round2(list.reduce((total, t) => total + t[key], 0));

  const released = mine.filter((t) => EARNING_STATUSES.includes(t.status));
  const held = mine.filter((t) => t.status === TX.HELD);

  const paidOut = payouts
    .filter((p) => p.teacherId === teacherId && p.status === 'paid')
    .reduce((total, p) => total + p.amount, 0);

  const requested = payouts
    .filter((p) => p.teacherId === teacherId && p.status === 'requested')
    .reduce((total, p) => total + p.amount, 0);

  const earned = sum(released, 'tutorEarning');

  return {
    gross: round2([...released, ...held].reduce((total, t) => total + net(t), 0)),
    commission: sum([...released, ...held], 'commission'),
    earned,
    pending: sum(held, 'tutorEarning'),
    withdrawn: paidOut,
    requested,
    available: round2(earned - paidOut - requested),
  };
};

// The platform's side of the same ledger.
export const platformTotals = ({ transactions, payouts }) => {
  const sum = (list, key) => round2(list.reduce((total, t) => total + t[key], 0));

  const released = transactions.filter((t) => EARNING_STATUSES.includes(t.status));
  const held = transactions.filter((t) => t.status === TX.HELD);

  const paidOut = payouts.filter((p) => p.status === 'paid').reduce((total, p) => total + p.amount, 0);
  const releasedToTeachers = sum(released, 'tutorEarning');

  return {
    gmv: round2(transactions.reduce((total, t) => total + net(t), 0)),
    commission: sum(transactions, 'commission'),
    heldForTeachers: sum(held, 'tutorEarning'),
    releasedToTeachers,
    withdrawn: paidOut,
    dueToTeachers: round2(releasedToTeachers - paidOut),
    refunded: round2(transactions.reduce((total, t) => total + (t.refundedAmount || 0), 0)),
    netRevenue: sum(transactions, 'commission'),
  };
};
