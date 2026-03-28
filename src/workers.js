const { updateJobStatus, updateJobStages, getJobById } = require('./database');

const workers = [
  { id: 'worker-1', name: 'Python Worker', language: 'python', busy: false },
  { id: 'worker-2', name: 'Node Worker', language: 'node', busy: false },
  { id: 'worker-3', name: 'General Worker', language: 'general', busy: false }
];

function getAvailableWorker(language) {
  // First try to find a matching language worker
  let worker = workers.find(w => !w.busy && w.language === language);
  // If no match, use general worker
  if (!worker) worker = workers.find(w => !w.busy && w.language === 'general');
  // If still no match, use any available worker
  if (!worker) worker = workers.find(w => !w.busy);
  return worker || null;
}

function getRandomDuration(min, max) {
  return Math.floor(Math.random() * (max - min + 1) + min) * 1000;
}

async function runStage(jobId, stages, stageIndex) {
  return new Promise((resolve) => {
    stages[stageIndex].status = 'running';
    updateJobStages(jobId, stages);

    // Random duration between 2-5 seconds per stage
    const duration = getRandomDuration(2, 5);

    setTimeout(() => {
      // 90% success rate per stage
      const success = Math.random() > 0.1;
      stages[stageIndex].status = success ? 'success' : 'failed';
      updateJobStages(jobId, stages);
      resolve(success);
    }, duration);
  });
}

async function executeJob(job) {
  const worker = getAvailableWorker(job.language);

  if (!worker) {
    console.log(`⏳ No worker available for job ${job.id} — staying in queue`);
    return;
  }

  worker.busy = true;
  console.log(`🔧 ${worker.name} picked up job ${job.id} (${job.repo})`);
  updateJobStatus(job.id, 'in_progress', worker.id);

  const stages = JSON.parse(job.stages);

  let success = true;
  for (let i = 0; i < stages.length; i++) {
    console.log(`  ▶ Running stage: ${stages[i].name}`);
    const stageSuccess = await runStage(job.id, stages, i);
    if (!stageSuccess) {
      console.log(`  ❌ Stage ${stages[i].name} failed!`);
      // Mark remaining stages as skipped
      for (let j = i + 1; j < stages.length; j++) {
        stages[j].status = 'skipped';
      }
      updateJobStages(job.id, stages);
      success = false;
      break;
    }
    console.log(`  ✅ Stage ${stages[i].name} passed`);
  }

  updateJobStatus(job.id, success ? 'completed' : 'failed');
  console.log(`${success ? '✅' : '❌'} Job ${job.id} ${success ? 'completed' : 'failed'}!`);

  worker.busy = false;
}

function getWorkerStatus() {
  return workers.map(w => ({ ...w }));
}

module.exports = { executeJob, getWorkerStatus };