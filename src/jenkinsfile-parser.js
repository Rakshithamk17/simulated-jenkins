const axios = require('axios');

async function fetchJenkinsfileStages(repo, branch) {
  try {
    // Extract owner and repo name from full repo URL or name
    // Works with both "owner/repo" and full GitHub URLs
    let repoPath = repo;
    if (repo.includes('github.com')) {
      repoPath = repo.split('github.com/')[1].replace('.git', '');
    }

    const url = `https://raw.githubusercontent.com/${repoPath}/${branch}/Jenkinsfile`;
    console.log(`  📄 Fetching Jenkinsfile from: ${url}`);

    const response = await axios.get(url, { timeout: 5000 });
    const content = response.data;

    // Parse stage names from Jenkinsfile
    const stages = parseStages(content);

    if (stages.length > 0) {
      console.log(`  ✅ Found stages: ${stages.join(', ')}`);
      return stages;
    } else {
      console.log(`  ⚠️ No stages found, using defaults`);
      return getDefaultStages();
    }
  } catch (error) {
    console.log(`  ⚠️ Could not fetch Jenkinsfile: ${error.message}`);
    console.log(`  📋 Using default stages`);
    return getDefaultStages();
  }
}

function parseStages(jenkinsfileContent) {
  const stages = [];
  // Match stage('StageName') or stage("StageName")
  const stageRegex = /stage\s*\(\s*['"]([^'"]+)['"]\s*\)/g;
  let match;
  while ((match = stageRegex.exec(jenkinsfileContent)) !== null) {
    const stageName = match[1];
    // Skip declarative stages added by Jenkins itself
    if (!stageName.startsWith('Declarative:')) {
      stages.push(stageName);
    }
  }
  return stages;
}

function getDefaultStages() {
  return ['Build', 'Test', 'Deploy'];
}

module.exports = { fetchJenkinsfileStages };