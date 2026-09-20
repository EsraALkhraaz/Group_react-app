// The money rules, restated on the side that decides. The interface has the
// same functions so it can show the figure before sending, but only this copy
// is authoritative — the server never accepts an amount from a client.

export const round2 = (n: number): number => Math.round(n * 100) / 100;

export type Split = { gross: number; commission: number; tutorEarning: number };

// Commission first, then the remainder: computing the two shares independently
// loses a dirham whenever the percentage does not divide evenly.
export const splitAmount = (gross: number, rate: number): Split => {
  const commission = round2(gross * rate);
  return { gross: round2(gross), commission, tutorEarning: round2(gross - commission) };
};

export type Tier = { minSessions: number; rate: number; label: string };

export const commissionRateFor = (input: {
  tiers: Tier[];
  groupCommission: number;
  completedSessions: number;
  kind: 'individual' | 'group';
}): number => {
  if (input.kind === 'group') return input.groupCommission;

  return [...input.tiers]
    .sort((a, b) => a.minSessions - b.minSessions)
    .reduce((chosen, tier) => (input.completedSessions >= tier.minSessions ? tier : chosen),
      input.tiers[0]!)
    .rate;
};

// Cancelling in time returns everything. Cancelling late keeps a fee, split by
// the booking's own rate so the teacher is compensated for the held time.
export const cancellationOutcome = (input: {
  gross: number;
  commissionRate: number;
  cancellationFee: number;
  freeCancellationHours: number;
  startsAt: Date;
  byTeacher: boolean;
  now?: Date;
}): { late: boolean; fee: number; refund: number; commission: number; tutorEarning: number } => {
  const now = input.now ?? new Date();
  const hoursLeft = (input.startsAt.getTime() - now.getTime()) / 3_600_000;

  // A teacher's own change of plan never costs the learner anything.
  const late = !input.byTeacher && hoursLeft < input.freeCancellationHours;
  const fee = late ? round2(input.gross * input.cancellationFee) : 0;
  const commission = round2(fee * input.commissionRate);

  return {
    late,
    fee,
    refund: round2(input.gross - fee),
    commission,
    tutorEarning: round2(fee - commission),
  };
};
