import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { COMMISSION_RATE } from '../data/catalog';

const STORAGE_KEY = 'darsy.prototype.v1';

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

const seedState = () => ({
  role: 'student',
  profile: { name: 'سارة المبروك', phone: '0912345678' },
  children: [
    { id: 'c1', name: 'يوسف', gradeId: 'g6' },
    { id: 'c2', name: 'ليان', gradeId: 'g3' },
  ],
  favorites: ['t2'],
  // Rates a teacher changed themselves; they win over the directory's listed rates.
  teacherRates: {},
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
    if (raw) return { ...seedState(), ...JSON.parse(raw) };
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

      setRole: (role) => setState((s) => ({ ...s, role })),

      toggleFavorite: (teacherId) =>
        setState((s) => ({
          ...s,
          favorites: s.favorites.includes(teacherId)
            ? s.favorites.filter((f) => f !== teacherId)
            : [...s.favorites, teacherId],
        })),

      // Booking always starts as a request awaiting the teacher's approval.
      createBooking: (draft) => {
        const id = `b${Date.now()}`;
        setState((s) => ({
          ...s,
          bookings: [
            {
              id,
              status: BOOKING_STATUS.PENDING_APPROVAL,
              createdAt: new Date().toISOString().slice(0, 10),
              durationMins: 60,
              ...draft,
            },
            ...s.bookings,
          ],
          notifications: [
            { id: `n${Date.now()}`, title: 'أُرسل طلب الحجز', body: 'سيصلك إشعار فور رد المدرس على طلبك', tone: 'accent', unread: true },
            ...s.notifications,
          ],
        }));
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

      // Stands in for the admin confirming the transfer landed in the platform account.
      confirmPayment: (id) => {
        patchBooking(id, {
          status: BOOKING_STATUS.CONFIRMED,
          meetingLink: 'https://meet.example.com/darsy-' + id.slice(-4),
        });
        pushNotification({ title: 'تم تأكيد حجزك', body: 'ستصلك رسالة تذكير قبل الموعد', tone: 'success' });
      },

      cancelBooking: (id) => patchBooking(id, { status: BOOKING_STATUS.CANCELLED }),

      completeBooking: (id) => patchBooking(id, { status: BOOKING_STATUS.COMPLETED }),

      // A review can only be attached to a completed booking (business rule).
      addReview: (id, stars, text) =>
        patchBooking(id, { review: { stars, text, at: new Date().toISOString() } }),

      markNotificationsRead: () =>
        setState((s) => ({ ...s, notifications: s.notifications.map((n) => ({ ...n, unread: false })) })),

      // What every screen should read — never teacher.pricing directly.
      pricingFor: (teacher) => mergePricing(teacher, state.teacherRates[teacher.id]),

      setTeacherRates: (teacherId, rates) =>
        setState((s) => ({ ...s, teacherRates: { ...s.teacherRates, [teacherId]: rates } })),

      resetPrototype: () => setState(seedState()),

      commissionRate: COMMISSION_RATE,
    };
  }, [state]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export const useApp = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used inside AppProvider');
  return ctx;
};
