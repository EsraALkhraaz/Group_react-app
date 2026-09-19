import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { commissionRateFor, splitAmount, cancellationOutcome, TX } from '../lib/money';
import { isExpired } from '../lib/requests';
import { TEACHERS, teacherById } from '../data/teachers';
import {
  SUBJECTS, GRADES, LANGUAGES, CITIES, applyRefData,
} from '../data/catalog';

const STORAGE_KEY = 'darsy.prototype.v1';

// Each role is its own interface with its own entrance and URL space.
export const BASE_BY_ROLE = {
  student: '/student', parent: '/parent', teacher: '/teacher', admin: '/admin',
};

export const BOOKING_STATUS = {
  PENDING_APPROVAL: 'pending_approval',
  REJECTED: 'rejected',
  AWAITING_PAYMENT: 'awaiting_payment',
  PAYMENT_REVIEW: 'payment_review',
  CONFIRMED: 'confirmed',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
  EXPIRED: 'expired',
};

export const STATUS_LABEL = {
  pending_approval: 'بانتظار موافقة المدرس',
  rejected: 'مرفوض من المدرس',
  awaiting_payment: 'بانتظار الدفع',
  payment_review: 'قيد مراجعة الإدارة',
  confirmed: 'مؤكد',
  completed: 'مكتملة',
  cancelled: 'ملغاة',
  expired: 'انتهت مدة الطلب',
};

export const STATUS_TONE = {
  pending_approval: 'accent',
  rejected: 'danger',
  awaiting_payment: 'accent',
  payment_review: 'primary',
  confirmed: 'success',
  completed: 'primary',
  cancelled: 'danger',
  expired: 'danger',
};

// A timestamp a few hours back, so the seeded pending request still has time
// left on it rather than expiring the moment the app opens.
const hoursAgo = (hours) => new Date(Date.now() - hours * 3600000).toISOString();

const iso = (daysFromNow) => {
  const d = new Date();
  d.setDate(d.getDate() + daysFromNow);
  return d.toISOString().slice(0, 10);
};

// The prototype has no backend: a password is validated in the form and then
// thrown away, never stored here or in localStorage. Accounts hold identity only.
export const DEMO_ACCOUNTS = [
  { role: 'student', name: 'أحمد الزوي', phone: '0910000001', verified: true },
  { role: 'parent', name: 'سارة المبروك', phone: '0912345678', verified: true },
  { role: 'teacher', name: 'أحمد علي المبروك', phone: '0911111111', verified: true },
  { role: 'admin', name: 'إدارة درسي', phone: '0919999999', verified: true },
];

const seedState = () => ({
  role: 'student',
  session: null,
  accounts: DEMO_ACCOUNTS,
  profile: { name: 'سارة المبروك', phone: '0912345678' },
  children: [
    { id: 'c1', name: 'يوسف', gradeId: 'g6' },
    { id: 'c2', name: 'ليان', gradeId: 'g3' },
  ],
  favorites: ['t2'],
  activeChild: null,
  studentGradeId: 'g6',
  // Every rate the money code uses — changed from the admin interface, never in code.
  settings: {
    commissionTiers: [
      { minSessions: 0, rate: 0.2, label: 'مدرس جديد' },
      { minSessions: 10, rate: 0.17, label: 'بعد 10 حصص' },
      { minSessions: 30, rate: 0.15, label: 'مدرس نشط' },
    ],
    groupCommission: 0.15,
    cancellationFee: 0.25,
    freeCancellationHours: 24,
    requestExpiryHours: 24,
    apologyLimit: 3,
    apologyWindowDays: 30,
    paymentFee: 0,
    minimumPayout: 100,
  },
  transactions: [
    // b1 is paid and confirmed: Darsy holds the money until the session happens.
    { id: 'tx1', bookingId: 'b1', teacherId: 't1', learnerName: 'يوسف', gross: 30, commission: 4.5, tutorEarning: 25.5, status: TX.HELD, createdAt: iso(-3) },
    // b3 happened: the teacher's share was released into their balance.
    { id: 'tx2', bookingId: 'b3', teacherId: 't3', learnerName: 'يوسف', gross: 50, commission: 7.5, tutorEarning: 42.5, status: TX.RELEASED, createdAt: iso(-12), releasedAt: iso(-6) },
  ],
  payouts: [],
  // A learner asking for apology credit back in cash instead.
  refundRequests: [],
  // Money Darsy owes back to a payer. A refund lands here instead of going out
  // through a bank transfer that nobody can execute automatically yet.
  credits: {
    student: { balance: 0, entries: [] },
    parent: { balance: 0, entries: [] },
  },
  prefs: { inApp: true, reminders: true, sms: false },
  payoutAccount: { bankName: 'مصرف الوحدة', holder: 'أحمد علي المبروك', accountNumber: '0044-7781-2290' },
  // What a teacher edited about themselves — rates and profile fields both win
  // over what the directory lists for them.
  teacherRates: {},
  teacherProfiles: {},
  // A teacher stopped from receiving new bookings until the admin lifts it.
  teacherStatus: {},
  // The lists the admin owns. Seeded from the catalog, then edited from the panel.
  refData: {
    subjects: SUBJECTS, grades: GRADES, languages: LANGUAGES, cities: CITIES,
  },
  // Identity review. A teacher is not listed publicly until Darsy approves it.
  teacherVerification: {
    t6: { status: 'pending', document: 'national-id.jpg', submittedAt: hoursAgo(20) },
  },
  bookings: [
    {
      id: 'b1',
      payerRole: 'parent',
      teacherId: 't1',
      learnerName: 'يوسف',
      subjectId: 'math',
      gradeId: 'g6',
      sessionType: 'individual',
      mode: 'online',
      date: iso(2),
      time: '17:00',
      durationMins: 60,
      price: 30,
      commissionRate: 0.15,
      platformFee: 4.5,
      tutorAmount: 25.5,
      status: BOOKING_STATUS.CONFIRMED,
      meetingLink: 'https://meet.example.com/darsy-ys-4412',
      createdAt: iso(-3),
      note: '',
    },
    {
      id: 'b2',
      payerRole: 'parent',
      teacherId: 't2',
      learnerName: 'ليان',
      subjectId: 'english',
      gradeId: 'g3',
      sessionType: 'group',
      mode: 'online',
      date: iso(4),
      time: '16:00',
      durationMins: 60,
      price: 20,
      commissionRate: 0.15,
      platformFee: 3,
      tutorAmount: 17,
      status: BOOKING_STATUS.PENDING_APPROVAL,
      createdAt: hoursAgo(5),
      note: 'تركيز على المحادثة من فضلك',
    },
    {
      id: 'b3',
      payerRole: 'parent',
      teacherId: 't3',
      learnerName: 'يوسف',
      subjectId: 'science',
      gradeId: 'g6',
      sessionType: 'individual',
      mode: 'f2f',
      date: iso(-6),
      time: '18:00',
      durationMins: 60,
      price: 50,
      commissionRate: 0.15,
      platformFee: 7.5,
      tutorAmount: 42.5,
      status: BOOKING_STATUS.COMPLETED,
      createdAt: iso(-12),
      note: '',
    },
  ],
  notifications: [
    { id: 'n1', title: 'تم تأكيد حجزك مع أ. أحمد علي', body: 'حصة الرياضيات بعد يومين — 5:00 مساءً', tone: 'success', unread: true },
    { id: 'n2', title: 'طلب حجزك بانتظار موافقة المدرسة', body: 'أرسلنا طلبك إلى أ. سارة محمد', tone: 'accent', unread: true },
    { id: 'n3', title: 'قيّم حصتك السابقة', body: 'كيف كانت حصة العلوم مع أ. منى سالم؟', tone: 'primary', unread: false },
  ],
});

const load = () => {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const seed = seedState();
      const stored = JSON.parse(raw);
      // Settings merge key by key, so a setting added after this browser last
      // saved still has its default instead of coming back undefined.
      return { ...seed, ...stored, settings: { ...seed.settings, ...(stored.settings || {}) } };
    }
  } catch (e) {
    /* storage unavailable — fall back to seed */
  }
  return seedState();
};

// A teacher's own rates override the listed ones, keeping the modes and seat
// limits they offer untouched.
const mergePricing = (teacher, override) => {
  if (!override) return teacher.pricing;
  const apply = (mode) => {
    const base = teacher.pricing[mode];
    if (!base) return null;
    const edited = override[mode] || {};
    return {
      individual: edited.individual ?? base.individual,
      group: base.group ? { ...base.group, price: edited.group ?? base.group.price } : null,
    };
  };
  return { online: apply('online'), f2f: apply('f2f') };
};

// A teacher who keeps cancelling paid sessions is a trust problem, not a
// scheduling one: apologies are counted over a window and stop the teacher
// once they cross the limit.
const apologiesWithin = (bookings, teacherId, windowDays, status) => {
  // Lifting a suspension is a fresh start: what the admin already dealt with
  // is not counted again, or the next apology would re-suspend at once.
  const lifted = status && status.liftedAt ? new Date(status.liftedAt).getTime() : 0;
  const since = Math.max(Date.now() - windowDays * 86400000, lifted);
  return bookings.filter(
    (b) => b.teacherId === teacherId
      && b.cancellation
      && b.cancellation.byTeacher
      && new Date(b.cancellation.at).getTime() >= since,
  );
};

// Credit is money Darsy already holds and now owes back to the payer. It is
// added and spent in one place so the balance and its statement never drift.
const addCredit = (credits, payerRole, entry) => {
  const key = payerRole || 'parent';
  const wallet = credits[key] || { balance: 0, entries: [] };
  return {
    ...credits,
    [key]: {
      balance: Math.round((wallet.balance + entry.amount) * 100) / 100,
      entries: [{ id: `cr${Date.now()}`, at: new Date().toISOString(), ...entry }, ...wallet.entries],
    },
  };
};

// The directory entry is the starting point; whatever the teacher edited wins.
const mergeTeacher = (base, profile, rates, verification) => ({
  ...base,
  ...(profile || {}),
  pricing: mergePricing(base, rates),
  // The directory says verified; the admin's review overrides it.
  verified: verification ? verification.status === 'verified' : base.verified,
  verification: verification || { status: base.verified ? 'verified' : 'pending' },
});

const s_credit = (state, role) => state.credits[role || state.role] || { balance: 0, entries: [] };

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [state, setState] = useState(load);

  // Push the admin's lists into the catalog before anything renders, so a screen
  // that imports SUBJECTS directly still sees what the admin saved.
  applyRefData(state.refData);

  // A request nobody answered expires on its own. With no server to run this,
  // the app sweeps on open and once a minute while it stays open.
  useEffect(() => {
    const sweep = () => setState((s) => {
      const stale = s.bookings.filter(
        (b) => b.status === BOOKING_STATUS.PENDING_APPROVAL && isExpired(b, s.settings),
      );
      if (stale.length === 0) return s;

      const ids = stale.map((b) => b.id);
      return {
        ...s,
        bookings: s.bookings.map((b) =>
          ids.includes(b.id)
            ? { ...b, status: BOOKING_STATUS.EXPIRED, expiredAt: new Date().toISOString() }
            : b,
        ),
        notifications: [
          ...stale.map((b, i) => ({
            id: `n${Date.now() + i}`,
            title: 'انتهت مدة طلب الحجز',
            body: `لم يرد المدرس خلال ${s.settings.requestExpiryHours} ساعة — يمكنك اختيار موعد آخر أو مدرس آخر`,
            tone: 'danger',
            unread: true,
          })),
          ...s.notifications,
        ],
      };
    });

    sweep();
    const timer = window.setInterval(sweep, 60000);
    return () => window.clearInterval(timer);
    // Shortening the window in the admin settings takes effect at once, rather
    // than waiting for the next tick.
  }, [state.settings.requestExpiryHours]);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      /* ignore */
    }
  }, [state]);

  const value = useMemo(() => {
    const patchBooking = (id, patch) =>
      setState((s) => ({
        ...s,
        bookings: s.bookings.map((b) => (b.id === id ? { ...b, ...patch } : b)),
      }));

    const pushNotification = (n) =>
      setState((s) => ({
        ...s,
        notifications: [{ id: `n${Date.now()}`, unread: true, ...n }, ...s.notifications],
      }));

    return {
      ...state,

      base: BASE_BY_ROLE[state.role] || BASE_BY_ROLE.student,

      setRole: (role) => setState((s) => ({ ...s, role })),

      addChild: (name, gradeId) =>
        setState((s) => ({
          ...s,
          children: [...s.children, { id: `c${Date.now()}`, name: name.trim(), gradeId }],
        })),

      setActiveChild: (name) => setState((s) => ({ ...s, activeChild: name })),

      accountFor: (role, phone) =>
        state.accounts.find((a) => a.role === role && a.phone === phone) || null,

      signIn: ({ role, phone }) => {
        const account = state.accounts.find((a) => a.role === role && a.phone === phone);
        if (!account) return false;
        setState((s) => ({
          ...s,
          role,
          session: { role, name: account.name, phone: account.phone },
          profile: { name: account.name, phone: account.phone },
        }));
        return true;
      },

      signUp: ({ role, name, phone, gradeId }) => {
        const account = { role, name: name.trim(), phone, verified: false };
        setState((s) => ({
          ...s,
          role,
          accounts: [...s.accounts.filter((a) => !(a.role === role && a.phone === phone)), account],
          session: { role, name: account.name, phone },
          profile: { name: account.name, phone },
          children: role === 'parent' ? [] : s.children,
          studentGradeId: role === 'student' ? gradeId : s.studentGradeId,
        }));
      },

      // Stands in for the code sent by SMS being accepted.
      confirmPhone: () =>
        setState((s) => ({
          ...s,
          accounts: s.accounts.map((a) =>
            s.session && a.role === s.session.role && a.phone === s.session.phone
              ? { ...a, verified: true }
              : a,
          ),
        })),

      signOut: () => setState((s) => ({ ...s, session: null })),

      updateProfile: ({ name, phone, gradeId }) =>
        setState((s) => {
          const phoneChanged = s.session && phone !== s.session.phone;
          return {
            ...s,
            profile: { name, phone },
            studentGradeId: gradeId ?? s.studentGradeId,
            session: s.session ? { ...s.session, name, phone } : s.session,
            accounts: s.accounts.map((a) =>
              s.session && a.role === s.session.role && a.phone === s.session.phone
                // A new number has to be confirmed again before it counts as verified.
                ? { ...a, name, phone, verified: phoneChanged ? false : a.verified }
                : a,
            ),
          };
        }),

      setPref: (key, value) => setState((s) => ({ ...s, prefs: { ...s.prefs, [key]: value } })),

      setPayoutAccount: (account) => setState((s) => ({ ...s, payoutAccount: account })),

      requestPayout: (teacherId, amount) =>
        setState((s) => ({
          ...s,
          payouts: [
            {
              id: `po${Date.now()}`,
              teacherId,
              amount,
              status: 'requested',
              requestedAt: new Date().toISOString(),
            },
            ...s.payouts,
          ],
        })),

      markPayoutPaid: (payoutId) =>
        setState((s) => ({
          ...s,
          payouts: s.payouts.map((p) =>
            p.id === payoutId ? { ...p, status: 'paid', paidAt: new Date().toISOString() } : p,
          ),
        })),

      updateSettings: (patch) => setState((s) => ({ ...s, settings: { ...s.settings, ...patch } })),

      // Reference data is never deleted — an old booking still has to be able to
      // name its subject. Retiring an item hides it from pickers instead.
      updateRefData: (kind, list) =>
        setState((s) => ({ ...s, refData: { ...s.refData, [kind]: list } })),

      completedSessionsOf: (teacherId) => {
        const listed = teacherById(teacherId);
        const onPlatform = state.bookings.filter(
          (b) => b.teacherId === teacherId && b.status === BOOKING_STATUS.COMPLETED,
        ).length;
        return (listed ? listed.sessionsCount : 0) + onPlatform;
      },

      removeChild: (id) =>
        setState((s) => ({ ...s, children: s.children.filter((c) => c.id !== id) })),

      toggleFavorite: (teacherId) =>
        setState((s) => ({
          ...s,
          favorites: s.favorites.includes(teacherId)
            ? s.favorites.filter((f) => f !== teacherId)
            : [...s.favorites, teacherId],
        })),

      // Booking always starts as a request awaiting the teacher's approval.
      // The commission rate is snapshotted now, so a later rate change never
      // rewrites what this booking was agreed at.
      createBooking: (draft) => {
        const id = `b${Date.now()}`;
        setState((s) => {
          // The same count the booking screen quoted from, so the agreed rate
          // is the rate the learner was shown.
          const listed = teacherById(draft.teacherId);
          const completedSessions = (listed ? listed.sessionsCount : 0)
            + s.bookings.filter(
              (b) => b.teacherId === draft.teacherId && b.status === BOOKING_STATUS.COMPLETED,
            ).length;
          const rate = commissionRateFor({
            settings: s.settings,
            completedSessions,
            sessionType: draft.sessionType,
          });
          const split = splitAmount(draft.price, rate);

          return {
          ...s,
          bookings: [
            {
              id,
              payerRole: s.role,
              status: BOOKING_STATUS.PENDING_APPROVAL,
              createdAt: new Date().toISOString(),
              durationMins: 60,
              ...draft,
              commissionRate: rate,
              platformFee: split.commission,
              tutorAmount: split.tutorEarning,
            },
            ...s.bookings,
          ],
          notifications: [
            { id: `n${Date.now()}`, title: 'أُرسل طلب الحجز', body: 'سيصلك إشعار فور رد المدرس على طلبك', tone: 'accent', unread: true },
            ...s.notifications,
          ],
          };
        });
        return id;
      },

      approveBooking: (id) => {
        patchBooking(id, { status: BOOKING_STATUS.AWAITING_PAYMENT });
        pushNotification({ title: 'وافق المدرس على طلبك', body: 'أكمل الدفع لتأكيد الحجز', tone: 'primary' });
      },

      rejectBooking: (id, reason) => {
        patchBooking(id, { status: BOOKING_STATUS.REJECTED, rejectionReason: reason || '' });
        pushNotification({ title: 'اعتذر المدرس عن الموعد', body: reason || 'يمكنك اختيار موعد آخر أو مدرس آخر', tone: 'danger' });
      },

      // Escrow: the learner transfers to the platform account and uploads a receipt.
      submitPayment: (id, receiptName) => {
        patchBooking(id, {
          status: BOOKING_STATUS.PAYMENT_REVIEW,
          receipt: { fileName: receiptName, uploadedAt: new Date().toISOString() },
        });
        pushNotification({ title: 'استلمنا إيصال الدفع', body: 'تراجعه الإدارة خلال وقت قصير', tone: 'primary' });
      },

      // The admin confirms the transfer landed in the platform account. The money
      // is now held by Darsy — the teacher is not paid until the session happens.
      confirmPayment: (id) => {
        setState((s) => {
          const booking = s.bookings.find((b) => b.id === id);
          if (!booking) return s;
          return {
            ...s,
            bookings: s.bookings.map((b) =>
              b.id === id
                ? { ...b, status: BOOKING_STATUS.CONFIRMED, meetingLink: `https://meet.example.com/darsy-${id.slice(-4)}` }
                : b,
            ),
            transactions: [
              {
                id: `tx${Date.now()}`,
                bookingId: id,
                teacherId: booking.teacherId,
                learnerName: booking.learnerName,
                gross: booking.price,
                commission: booking.platformFee,
                tutorEarning: booking.tutorAmount,
                status: TX.HELD,
                createdAt: new Date().toISOString(),
              },
              ...s.transactions,
            ],
            notifications: [
              { id: `n${Date.now()}`, title: 'تم تأكيد حجزك', body: 'ستصلك رسالة تذكير قبل الموعد', tone: 'success', unread: true },
              ...s.notifications,
            ],
          };
        });
      },

      // Cancelling in time refunds everything. Cancelling late keeps the platform's
      // cancellation fee, and the teacher keeps their share of it.
      cancelBooking: (id) =>
        setState((s) => {
          const booking = s.bookings.find((b) => b.id === id);
          const paid = s.transactions.find((t) => t.bookingId === id && t.status === TX.HELD);

          // Nothing was paid yet, so there is nothing to refund.
          if (!booking || !paid) {
            return {
              ...s,
              bookings: s.bookings.map((b) => (b.id === id ? { ...b, status: BOOKING_STATUS.CANCELLED } : b)),
            };
          }

          const outcome = cancellationOutcome({ settings: s.settings, booking, transaction: paid });
          const at = new Date().toISOString();

          return {
            ...s,
            bookings: s.bookings.map((b) =>
              b.id === id
                ? {
                  ...b,
                  status: BOOKING_STATUS.CANCELLED,
                  cancellation: { late: outcome.late, fee: outcome.retained, refund: outcome.refund, at },
                }
                : b,
            ),
            transactions: s.transactions.map((t) =>
              t.id === paid.id
                ? {
                  ...t,
                  status: outcome.retained > 0 ? TX.PARTIAL : TX.REFUNDED,
                  commission: outcome.commission,
                  tutorEarning: outcome.tutorEarning,
                  refundedAmount: outcome.refund,
                  refundedAt: at,
                }
                : t,
            ),
            credits: addCredit(s.credits, booking.payerRole, {
              amount: outcome.refund,
              reason: outcome.late ? 'إلغاء متأخر — بعد خصم الرسوم' : 'إلغاء حجز — استرجاع كامل',
              bookingId: booking.id,
            }),
            notifications: [
              {
                id: `n${Date.now()}`,
                title: 'أُلغي الحجز',
                body: outcome.late
                  ? `أُضيف ${outcome.refund} د.ل لرصيدك بعد خصم رسوم الإلغاء المتأخر`
                  : `أُضيف كامل المبلغ ${outcome.refund} د.ل لرصيدك`,
                tone: outcome.late ? 'accent' : 'primary',
                unread: true,
              },
              ...s.notifications,
            ],
          };
        }),

      // Session happened: the held amount is released into the teacher's balance.
      completeBooking: (id) =>
        setState((s) => ({
          ...s,
          bookings: s.bookings.map((b) => (b.id === id ? { ...b, status: BOOKING_STATUS.COMPLETED } : b)),
          transactions: s.transactions.map((t) =>
            t.bookingId === id && t.status === TX.HELD
              ? { ...t, status: TX.RELEASED, releasedAt: new Date().toISOString() }
              : t,
          ),
        })),

      // The teacher apologises for a booking that was already paid for. The
      // learner never loses money to the teacher's own change of plan: the full
      // amount goes back as credit, whatever the timing.
      teacherApologize: (id, reason) =>
        setState((s) => {
          const booking = s.bookings.find((b) => b.id === id);
          if (!booking) return s;

          const paid = s.transactions.find((t) => t.bookingId === id && t.status === TX.HELD);
          const at = new Date().toISOString();
          const amount = paid ? paid.gross : 0;

          const bookings = s.bookings.map((b) =>
            b.id === id
              ? {
                ...b,
                status: BOOKING_STATUS.CANCELLED,
                cancellation: {
                  byTeacher: true, late: false, fee: 0, refund: amount, credited: amount > 0, reason: reason || '', at,
                },
              }
              : b,
          );

          const apologies = apologiesWithin(
            bookings, booking.teacherId, s.settings.apologyWindowDays, s.teacherStatus[booking.teacherId],
          );
          const nowSuspended = apologies.length >= s.settings.apologyLimit;

          return {
            ...s,
            bookings,
            teacherStatus: nowSuspended
              ? {
                ...s.teacherStatus,
                [booking.teacherId]: {
                  suspended: true,
                  at,
                  reason: `${apologies.length} اعتذارات خلال ${s.settings.apologyWindowDays} يومًا`,
                },
              }
              : s.teacherStatus,
            transactions: paid
              ? s.transactions.map((t) =>
                t.id === paid.id
                  ? {
                    ...t,
                    status: TX.REFUNDED,
                    commission: 0,
                    tutorEarning: 0,
                    refundedAmount: t.gross,
                    refundedAt: at,
                    creditedToLearner: true,
                  }
                  : t,
              )
              : s.transactions,
            credits: amount > 0
              ? addCredit(s.credits, booking.payerRole, {
                amount,
                reason: 'اعتذار المدرس عن الحصة',
                bookingId: id,
                // The learner paid and got nothing, through no fault of their
                // own: this much they may ask back in cash, not only as credit.
                refundable: true,
              })
              : s.credits,
            notifications: [
              ...(nowSuspended ? [{
                id: `n${Date.now() + 1}`,
                title: 'أُوقف ظهورك مؤقتًا',
                body: `بلغت ${apologies.length} اعتذارات خلال ${s.settings.apologyWindowDays} يومًا — تواصل مع إدارة درسي لإعادة التفعيل`,
                tone: 'danger',
                unread: true,
              }] : []),
              {
                id: `n${Date.now()}`,
                title: 'اعتذر المدرس عن الحصة',
                body: amount > 0
                  ? `أُضيف ${amount} د.ل كاملة لرصيدك — استخدمه في أي حجز قادم`
                  : reason || 'يمكنك اختيار موعد آخر أو مدرس آخر',
                tone: 'danger',
                unread: true,
              },
              ...s.notifications,
            ],
          };
        }),

      // Paying from credit needs no transfer and no receipt: Darsy already holds
      // the money, so the booking is confirmed on the spot.
      payFromCredit: (id) =>
        setState((s) => {
          const booking = s.bookings.find((b) => b.id === id);
          if (!booking) return s;

          const key = booking.payerRole || 'parent';
          const wallet = s.credits[key] || { balance: 0, entries: [] };
          if (wallet.balance < booking.price) return s;

          const at = new Date().toISOString();

          return {
            ...s,
            bookings: s.bookings.map((b) =>
              b.id === id
                ? {
                  ...b,
                  status: BOOKING_STATUS.CONFIRMED,
                  paidWithCredit: true,
                  meetingLink: `https://meet.example.com/darsy-${id.slice(-4)}`,
                }
                : b,
            ),
            credits: {
              ...s.credits,
              [key]: {
                balance: Math.round((wallet.balance - booking.price) * 100) / 100,
                entries: [
                  {
                    id: `cr${Date.now()}`, at, amount: -booking.price, reason: 'دفع حصة من الرصيد', bookingId: id,
                  },
                  ...wallet.entries,
                ],
              },
            },
            transactions: [
              {
                id: `tx${Date.now()}`,
                bookingId: id,
                teacherId: booking.teacherId,
                learnerName: booking.learnerName,
                gross: booking.price,
                commission: booking.platformFee,
                tutorEarning: booking.tutorAmount,
                status: TX.HELD,
                paidWithCredit: true,
                createdAt: at,
              },
              ...s.transactions,
            ],
            notifications: [
              {
                id: `n${Date.now()}`, title: 'تم تأكيد حجزك', body: 'دُفعت الحصة من رصيدك', tone: 'success', unread: true,
              },
              ...s.notifications,
            ],
          };
        }),

      creditOf: (role) => s_credit(state, role),

      // The balance is debited as soon as the request is made, so the same
      // money cannot be spent on a booking while the transfer is pending.
      requestBankRefund: (payerRole, entryId, account) =>
        setState((s) => {
          const key = payerRole || 'parent';
          const wallet = s.credits[key] || { balance: 0, entries: [] };
          const entry = wallet.entries.find((e) => e.id === entryId);
          if (!entry || !entry.refundable || entry.refundRequestedAt) return s;
          if (wallet.balance < entry.amount) return s;

          const at = new Date().toISOString();

          return {
            ...s,
            credits: {
              ...s.credits,
              [key]: {
                balance: Math.round((wallet.balance - entry.amount) * 100) / 100,
                entries: [
                  {
                    id: `cr${Date.now()}`, at, amount: -entry.amount, reason: 'طلب استرجاع بنكي', bookingId: entry.bookingId,
                  },
                  ...wallet.entries.map((e) => (e.id === entryId ? { ...e, refundRequestedAt: at } : e)),
                ],
              },
            },
            refundRequests: [
              {
                id: `rr${Date.now()}`,
                payerRole: key,
                entryId,
                bookingId: entry.bookingId,
                amount: entry.amount,
                account,
                status: 'requested',
                requestedAt: at,
              },
              ...s.refundRequests,
            ],
            notifications: [
              {
                id: `n${Date.now()}`,
                title: 'أُرسل طلب الاسترجاع البنكي',
                body: `${entry.amount} د.ل — تراجعه الإدارة ثم تُحوَّل لحسابك`,
                tone: 'primary',
                unread: true,
              },
              ...s.notifications,
            ],
          };
        }),

      settleBankRefund: (requestId, paid) =>
        setState((s) => {
          const request = s.refundRequests.find((r) => r.id === requestId);
          if (!request || request.status !== 'requested') return s;

          const at = new Date().toISOString();

          return {
            ...s,
            refundRequests: s.refundRequests.map((r) =>
              r.id === requestId
                ? { ...r, status: paid ? 'paid' : 'declined', settledAt: at }
                : r,
            ),
            // A declined request puts the money back where it was.
            credits: paid ? s.credits : addCredit(s.credits, request.payerRole, {
              amount: request.amount,
              reason: 'تعذّر الاسترجاع البنكي — أُعيد للرصيد',
              bookingId: request.bookingId,
              refundable: true,
            }),
            notifications: [
              {
                id: `n${Date.now()}`,
                title: paid ? 'حُوِّل مبلغ الاسترجاع' : 'تعذّر الاسترجاع البنكي',
                body: paid
                  ? `${request.amount} د.ل في طريقها لحسابك المصرفي`
                  : `أُعيد ${request.amount} د.ل إلى رصيدك — راجع بيانات حسابك`,
                tone: paid ? 'success' : 'danger',
                unread: true,
              },
              ...s.notifications,
            ],
          };
        }),

      apologiesOf: (teacherId) =>
        apologiesWithin(
          state.bookings, teacherId, state.settings.apologyWindowDays, state.teacherStatus[teacherId],
        ),

      isSuspended: (teacherId) => Boolean(state.teacherStatus[teacherId]?.suspended),

      // The teacher hands in their identity document and waits — they are not
      // listed publicly until someone at Darsy has actually looked at it.
      submitVerification: (teacherId, document) =>
        setState((s) => ({
          ...s,
          teacherVerification: {
            ...s.teacherVerification,
            [teacherId]: { status: 'pending', document, submittedAt: new Date().toISOString() },
          },
          notifications: [
            {
              id: `n${Date.now()}`,
              title: 'استلمنا مستند هويتك',
              body: 'تراجعه إدارة درسي، ويظهر ملفك في البحث فور اعتماده',
              tone: 'primary',
              unread: true,
            },
            ...s.notifications,
          ],
        })),

      reviewVerification: (teacherId, approved, reason) =>
        setState((s) => {
          const current = s.teacherVerification[teacherId] || {};
          return {
            ...s,
            teacherVerification: {
              ...s.teacherVerification,
              [teacherId]: {
                ...current,
                status: approved ? 'verified' : 'rejected',
                reviewedAt: new Date().toISOString(),
                reason: approved ? '' : (reason || ''),
              },
            },
            notifications: [
              {
                id: `n${Date.now()}`,
                title: approved ? 'وُثِّقت هويتك' : 'لم يُقبل مستند الهوية',
                body: approved
                  ? 'ملفك ظاهر الآن للطلاب في نتائج البحث'
                  : (reason || 'أعد رفع صورة أوضح للمستند'),
                tone: approved ? 'success' : 'danger',
                unread: true,
              },
              ...s.notifications,
            ],
          };
        }),

      // Only the admin lifts a suspension, and only deliberately.
      setTeacherSuspended: (teacherId, suspended, reason) =>
        setState((s) => ({
          ...s,
          teacherStatus: {
            ...s.teacherStatus,
            [teacherId]: suspended
              ? { suspended: true, at: new Date().toISOString(), reason: reason || 'إيقاف إداري' }
              : { suspended: false, liftedAt: new Date().toISOString() },
          },
          notifications: [
            {
              id: `n${Date.now()}`,
              title: suspended ? 'أُوقف ظهورك مؤقتًا' : 'أُعيد تفعيل ظهورك',
              body: suspended
                ? (reason || 'تواصل مع إدارة درسي')
                : 'عاد ملفك للظهور في نتائج البحث — نشكر تعاونك',
              tone: suspended ? 'danger' : 'success',
              unread: true,
            },
            ...s.notifications,
          ],
        })),

      // A review can only be attached to a completed booking (business rule).
      addReview: (id, stars, text) =>
        patchBooking(id, { review: { stars, text, at: new Date().toISOString() } }),

      markNotificationsRead: () =>
        setState((s) => ({ ...s, notifications: s.notifications.map((n) => ({ ...n, unread: false })) })),

      // What every screen should read — never the raw directory entry.
      teacherFor: (id) => {
        const base = teacherById(id);
        return base
          ? mergeTeacher(base, state.teacherProfiles[id], state.teacherRates[id], state.teacherVerification[id])
          : null;
      },

      allTeachers: () =>
        TEACHERS.map((t) => mergeTeacher(
          t, state.teacherProfiles[t.id], state.teacherRates[t.id], state.teacherVerification[t.id],
        )),

      // What search may show: neither a suspended teacher nor an unverified one.
      listedTeachers: () =>
        TEACHERS
          .filter((t) => !state.teacherStatus[t.id]?.suspended)
          .map((t) => mergeTeacher(
            t, state.teacherProfiles[t.id], state.teacherRates[t.id], state.teacherVerification[t.id],
          ))
          .filter((t) => t.verified),

      setTeacherRates: (teacherId, rates) =>
        setState((s) => ({ ...s, teacherRates: { ...s.teacherRates, [teacherId]: rates } })),

      setTeacherProfile: (teacherId, patch) =>
        setState((s) => ({
          ...s,
          teacherProfiles: {
            ...s.teacherProfiles,
            [teacherId]: { ...(s.teacherProfiles[teacherId] || {}), ...patch },
          },
        })),

      resetPrototype: () => setState(seedState()),

    };
  }, [state]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export const useApp = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used inside AppProvider');
  return ctx;
};
