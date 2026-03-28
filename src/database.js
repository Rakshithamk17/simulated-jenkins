const Database = require('better-sqlite3');
const path = require('path');

const db = new Database(path.join('C:\\simulated-jenkins', 'jobs.db'));

db.exec(`
  CREATE TABLE IF NOT EXISTS jobs (
    id TEXT PRIMARY KEY,
    repo TEXT NOT NULL,
    branch TEXT NOT NULL,
    commit_hash TEXT NOT NULL,
    language TEXT NOT NULL,
    status TEXT DEFAULT 'queued',
    worker_id TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    started_at DATETIME,
    completed_at DATETIME,
    stages TEXT DEFAULT '[]',
    result TEXT
  )
`);

function createJob(id, repo, branch, commit_hash, language) {
  const stages = JSON.stringify([
    { name: 'Build', status: 'pending' },
    { name: 'Test', status: 'pending' },
    { name: 'Deploy', status: 'pending' }
  ]);
  const stmt = db.prepare(`
    INSERT INTO jobs (id, repo, branch, commit_hash, language, stages)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  stmt.run(id, repo, branch, commit_hash, language, stages);
}

function getQueuedJobs() {
  return db.prepare(`SELECT * FROM jobs WHERE status = 'queued' ORDER BY created_at ASC`).all();
}

function getAllJobs() {
  return db.prepare(`SELECT * FROM jobs ORDER BY created_at DESC`).all();
}

function updateJobStatus(id, status, workerId = null) {
  if (status === 'in_progress') {
    db.prepare(`UPDATE jobs SET status = ?, worker_id = ?, started_at = CURRENT_TIMESTAMP WHERE id = ?`)
      .run(status, workerId, id);
  } else if (status === 'completed' || status === 'failed') {
    db.prepare(`UPDATE jobs SET status = ?, completed_at = CURRENT_TIMESTAMP, result = ? WHERE id = ?`)
      .run(status, status === 'completed' ? 'SUCCESS' : 'FAILURE', id);
  }
}

function updateJobStages(id, stages) {
  db.prepare(`UPDATE jobs SET stages = ? WHERE id = ?`)
    .run(JSON.stringify(stages), id);
}

function getJobById(id) {
  return db.prepare(`SELECT * FROM jobs WHERE id = ?`).get(id);
}

module.exports = { createJob, getQueuedJobs, getAllJobs, updateJobStatus, updateJobStages, getJobById };