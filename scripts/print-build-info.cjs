const { execSync } = require('node:child_process');

function readGit(command, fallback) {
  try {
    return execSync(command, { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim();
  } catch {
    return fallback;
  }
}

const commit = readGit('git rev-parse --short HEAD', 'unknown');
const branch = readGit('git rev-parse --abbrev-ref HEAD', 'unknown');

console.log(`[build-info] branch=${branch} commit=${commit}`);
