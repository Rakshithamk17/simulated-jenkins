const express = require('express');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const { createJob, getAllJobs, getJobById } = require('./database');
const { getWorkerStatus } = require('./workers');
const { startScheduler } = require('./scheduler');

const app = express();
app.use(express.json());
app.use(express.static(path.join('C:\\simulated-jenkins', 'public')));

// Start scheduler
startScheduler();

// POST /webhook — simulates GitHub webhook
app.post('/webhook', (req, res) => {
  const { repo, branch, commit_hash, language } = req.body;

  if (!repo || !branch || !commit_hash) {
    return res.status(400).json({ error: 'Missing required fields: repo, branch, commit_hash' });
  }

  const id = uuidv4();
  const lang = language || 'general';

  createJob(id, repo, branch, commit_hash, lang);

  console.log(`\n📥 New job received!`);
  console.log(`   Repo: ${repo}`);
  console.log(`   Branch: ${branch}`);
  console.log(`   Commit: ${commit_hash}`);
  console.log(`   Language: ${lang}`);
  console.log(`   Job ID: ${id}`);

  res.status(201).json({
    message: 'Job created successfully',
    job_id: id,
    status: 'queued'
  });
});

// GET /jobs — get all jobs
app.get('/jobs', (req, res) => {
  const jobs = getAllJobs().map(job => ({
    ...job,
    stages: JSON.parse(job.stages)
  }));
  res.json(jobs);
});

// GET /jobs/:id — get specific job
app.get('/jobs/:id', (req, res) => {
  const job = getJobById(req.params.id);
  if (!job) return res.status(404).json({ error: 'Job not found' });
  res.json({ ...job, stages: JSON.parse(job.stages) });
});

// GET /workers — get worker status
app.get('/workers', (req, res) => {
  res.json(getWorkerStatus());
});

// GET /dashboard — serve dashboard
app.get('/', (req, res) => {
  res.sendFile(path.join('C:\\simulated-jenkins', 'public', 'index.html'));
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`\n🚀 Simulated Jenkins Master running!`);
  console.log(`   Dashboard: http://localhost:${PORT}`);
  console.log(`   Webhook:   POST http://localhost:${PORT}/webhook`);
  console.log(`   Jobs API:  GET  http://localhost:${PORT}/jobs`);
});