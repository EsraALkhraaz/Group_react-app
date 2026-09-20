import { buildApp } from './app.ts';
import { config } from './config.ts';
import { startJobs } from './jobs/index.ts';

const app = await buildApp();
startJobs(app);

try {
  await app.listen({ port: config.port, host: '0.0.0.0' });
} catch (error) {
  app.log.error(error);
  process.exit(1);
}
