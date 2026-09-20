import type { FastifyInstance } from 'fastify';
import { expireStaleRequests } from '../services/bookings.ts';

// The rules that depend on time passing, not on anyone opening the app. A timer
// is enough while the server is one process; pg-boss takes over before launch,
// so a restart cannot skip a run.
const EVERY_FIVE_MINUTES = 5 * 60 * 1000;

export function startJobs(app: FastifyInstance): () => void {
  const run = async () => {
    try {
      const expired = await expireStaleRequests();
      if (expired > 0) app.log.info({ expired }, 'انتهت طلبات حجز لم يُرد عليها');
    } catch (error) {
      app.log.error(error, 'فشل تنفيذ مهمة انتهاء الطلبات');
    }
  };

  void run();
  const timer = setInterval(run, EVERY_FIVE_MINUTES);
  timer.unref();

  return () => clearInterval(timer);
}
