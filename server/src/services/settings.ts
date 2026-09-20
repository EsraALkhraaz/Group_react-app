import { query, one } from '../lib/db.ts';
import { ApiError } from '../lib/errors.ts';
import type { Tier } from '../lib/money.ts';

export type PlatformSettings = {
  groupCommission: number;
  cancellationFee: number;
  paymentFee: number;
  minimumPayout: number;
  freeCancellationHours: number;
  requestExpiryHours: number;
  apologyLimit: number;
  apologyWindowDays: number;
  tiers: Tier[];
};

// Every rate the app applies is read from here, never written in code — so
// changing one is an admin edit, not a release.
export const load = async (): Promise<PlatformSettings> => {
  const row = await one<Record<string, string | number>>(
    `select group_commission, cancellation_fee, payment_fee, minimum_payout,
            free_cancellation_hours, request_expiry_hours, apology_limit, apology_window_days
     from platform_settings where id = 1`,
  );

  // Without these rows nothing can be priced. Say so plainly rather than
  // failing later on a null field.
  if (!row) throw new ApiError(500, 'settings_missing', 'إعدادات المنصة غير موجودة — راجع الهجرات');

  const tiers = await query<{ min_sessions: number; rate: string; label: string }>(
    'select min_sessions, rate, label from commission_tiers order by min_sessions',
  );

  if (tiers.length === 0) throw new ApiError(500, 'tiers_missing', 'شرائح العمولة غير معرّفة');

  return {
    groupCommission: Number(row.group_commission),
    cancellationFee: Number(row.cancellation_fee),
    paymentFee: Number(row.payment_fee),
    minimumPayout: Number(row.minimum_payout),
    freeCancellationHours: Number(row.free_cancellation_hours),
    requestExpiryHours: Number(row.request_expiry_hours),
    apologyLimit: Number(row.apology_limit),
    apologyWindowDays: Number(row.apology_window_days),
    tiers: tiers.map((t) => ({ minSessions: t.min_sessions, rate: Number(t.rate), label: t.label })),
  };
};

export const update = async (adminId: string, patch: Partial<Record<string, number>>) => {
  const before = await load();

  const columns: Record<string, string> = {
    groupCommission: 'group_commission',
    cancellationFee: 'cancellation_fee',
    paymentFee: 'payment_fee',
    minimumPayout: 'minimum_payout',
    freeCancellationHours: 'free_cancellation_hours',
    requestExpiryHours: 'request_expiry_hours',
    apologyLimit: 'apology_limit',
    apologyWindowDays: 'apology_window_days',
  };

  const sets: string[] = [];
  const params: unknown[] = [adminId];

  for (const [key, column] of Object.entries(columns)) {
    if (patch[key] === undefined) continue;
    params.push(patch[key]);
    sets.push(`${column} = $${params.length}`);
  }

  if (sets.length) {
    await query(
      `update platform_settings set ${sets.join(', ')}, updated_at = now(), updated_by = $1 where id = 1`,
      params,
    );
  }

  const after = await load();

  // Asked later why a teacher was charged what they were charged, the answer
  // has to come from a record rather than from memory.
  await query(
    'insert into settings_history (changed_by, before, after) values ($1, $2, $3)',
    [adminId, JSON.stringify(before), JSON.stringify(after)],
  );

  return after;
};
