// A booking request the teacher never answers cannot sit there forever: the
// learner needs to know when to stop waiting and book someone else.

export const requestDeadline = (booking, settings) => {
  const created = new Date(booking.createdAt).getTime();
  return created + settings.requestExpiryHours * 3600000;
};

export const hoursLeftToAnswer = (booking, settings, now = Date.now()) =>
  (requestDeadline(booking, settings) - now) / 3600000;

export const isExpired = (booking, settings, now = Date.now()) =>
  hoursLeftToAnswer(booking, settings, now) <= 0;

// "يتبقى 19 ساعة" reads better than a timestamp on a card the teacher scans.
export const timeLeftLabel = (booking, settings, now = Date.now()) => {
  const hours = hoursLeftToAnswer(booking, settings, now);
  if (hours <= 0) return 'انتهت المدة';
  if (hours < 1) return `يتبقى ${Math.max(1, Math.round(hours * 60))} دقيقة للرد`;
  return `يتبقى ${Math.floor(hours)} ساعة للرد`;
};
