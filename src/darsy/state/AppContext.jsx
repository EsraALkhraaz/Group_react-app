import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { commissionRateFor, splitAmount, cancellationOutcome, TX } from '../lib/money';
import { TEACHERS, teacherById } from '../data/teachers';

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
};

export const STATUS_LABEL = {
  pending_approval: 'بانتظار موافقة المدرس',
  rejected: 'مرفوض من المدرس',
  awaiting_payment: 'بانتظار الدفع',
  payment_review: 'قيد مراجعة الإدارة',
  confirmed: 'مؤكد',
  completed: 'مكتملة',
  cancelled: 'ملغاة',
};

export const STATUS_TONE = {
  pending_approval: 'accent',
  rejected: 'danger',
  awaiting_payment: 'accent',
  payment_review: 'primary',
  confirmed: 'success',
  completed: 'primary',
  cancelled: 'danger',
};

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
  prefs: { inApp: true, reminders: true, sms: false },
  payoutAccount: { bankName: 'مصرف الوحدة', holder: 'أحمد علي المبروك', accountNumber: '0044-7781-2290' },
  // What a teacher edited about themselves — rates and profile fields both win
  // over what the directory lists for them.
  teacherRates: {},
  teacherProfiles: {},
  bookings: [
    {
      id: 'b1',
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
      createdAt: iso(-1),
      note: 'تركيز على المحادثة من فضلك',
    },
    {
      id: 'b3',
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

// The directory entry is the starting point; whatever the teacher edited wins.
const mergeTeacher = (base, profile, rates) => ({
  ...base,
  ...(profile || {}),
  pricing: mergePricing(base, rates),
});

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [state, setState] = useState(load);

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
              status: BOOKING_STATUS.PENDING_APPROVAL,
              createdAt: new Date().toISOString().slice(0, 10),
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
            notifications: [
              {
                id: `n${Date.now()}`,
                title: 'أُلغي الحجز',
                body: outcome.late
                  ? `إلغاء متأخر — يُسترجع ${outcome.refund} د.ل بعد خصم رسوم الإلغاء`
                  : `يُسترجع كامل المبلغ ${outcome.refund} د.ل`,
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

      // A review can only be attached to a completed booking (business rule).
      addReview: (id, stars, text) =>
        patchBooking(id, { review: { stars, text, at: new Date().toISOString() } }),

      markNotificationsRead: () =>
        setState((s) => ({ ...s, notifications: s.notifications.map((n) => ({ ...n, unread: false })) })),

      // What every screen should read — never the raw directory entry.
      teacherFor: (id) => {
        const base = teacherById(id);
        return base ? mergeTeacher(base, state.teacherProfiles[id], state.teacherRates[id]) : null;
      },

      allTeachers: () =>
        TEACHERS.map((t) => mergeTeacher(t, state.teacherProfiles[t.id], state.teacherRates[t.id])),

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
