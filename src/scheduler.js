const { getQueuedJobs } = require('./database');
const { executeJob, getWorkerStatus } = require('./workers');

let schedulerRunning = false;

function startScheduler() {
  if (schedulerRunning) return;
  schedulerRunning = true;
  console.log('🕐 Scheduler started — checking queue every 5 seconds...');

  setInterval(async () => {
    const queuedJobs = getQueuedJobs();
    const workers = getWorkerStatus();
    const availableWorkers = workers.filter(w => !w.busy);

    if (queuedJobs.length === 0) {
      return;
    }

    console.log(`\n📋 Queue: ${queuedJobs.length} job(s) | Available workers: ${availableWorkers.length}`);

    for (const job of queuedJobs) {
      if (availableWorkers.length === 0) {
        console.log('⏳ All workers busy — waiting...');
        break;
      }
      executeJob(job);
    }
  }, 5000);
}

module.exports = { startScheduler };