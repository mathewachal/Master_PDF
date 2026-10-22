const { spawn } = require('child_process');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');

console.log('\x1b[35m[Master_PDF]\x1b[0m Starting both Backend (FastAPI) and Frontend (Vite)...\n');

// Start Backend
const api = spawn(process.execPath, [path.join(__dirname, 'start-api.js')], {
  cwd: rootDir,
  stdio: 'inherit'
});

// Start Frontend (direct node execution avoids Windows .cmd spawn EINVAL in Node 24)
const viteScript = path.join(rootDir, 'node_modules', 'vite', 'bin', 'vite.js');
const web = spawn(process.execPath, [viteScript], {
  cwd: path.join(rootDir, 'apps', 'web'),
  stdio: 'inherit'
});

function shutdown() {
  console.log('\n\x1b[35m[Master_PDF]\x1b[0m Shutting down servers...');
  try { api.kill(); } catch (e) {}
  try { web.kill(); } catch (e) {}
  process.exit(0);
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
