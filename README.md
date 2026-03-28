# Simulated Jenkins CI/CD System

A simulated Jenkins Master built with Node.js that mimics a real CI/CD pipeline system.

## Features
- Webhook triggers via POST API
- Job queue with SQLite database
- Pipeline manager and scheduler
- 3 workers (Python, Node, General)
- Real-world randomness in job execution
- Live dashboard at http://localhost:3000

## How to run
npm install
node src/server.js

## Architecture
GitHub Webhook → Express Server → SQLite Queue → Scheduler → Workers → Dashboard