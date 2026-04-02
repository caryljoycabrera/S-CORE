// ===== Job Scheduler Service =====
// Registers all recurring background jobs using node-cron.
// Call initScheduler() once at application startup (in server.js).

const cron = require('node-cron');
const { runArchivingTasks } = require('./archivingService');

/**
 * initScheduler()
 * Registers all cron jobs and starts them.
 * Should be called after the database connection is established.
 */
const initScheduler = () => {
  // ── Archiving Job ─────────────────────────────────────────────────────────
  // Runs every day at midnight (server local time / UTC depending on timezone config).
  // Cron pattern: '0 0 * * *' → minute=0, hour=0, every day, every month, every weekday
  const archivingJob = cron.schedule('0 0 * * *', async () => {
    try {
      console.log('[JobScheduler] Running nightly archiving job...');
      const result = await runArchivingTasks();
      console.log(`[JobScheduler] Nightly archiving complete. Total archived: ${result.totalArchived}`);
    } catch (error) {
      console.error('[JobScheduler] Archiving job failed:', error);
    }
  }, {
    scheduled: true,
    timezone: process.env.TIMEZONE || 'Asia/Manila'
  });

  console.log('[JobScheduler] All scheduled jobs initialized:');
  console.log('  → Archiving job: runs daily at midnight (Asia/Manila)');

  return { archivingJob };
};

module.exports = { initScheduler };
