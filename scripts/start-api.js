const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const rootDir = path.resolve(__dirname, '..');
const winVenvPython = path.join(rootDir, 'apps', 'api', '.venv', 'Scripts', 'python.exe');
const unixVenvPython = path.join(rootDir, 'apps', 'api', '.venv', 'bin', 'python');

let pythonBin = 'python';
if (fs.existsSync(winVenvPython)) {
  pythonBin = winVenvPython;
} else if (fs.existsSync(unixVenvPython)) {
  pythonBin = unixVenvPython;
}

const args = [
  '-m',
  'uvicorn',
  'app.main:app',
  '--app-dir',
  'apps/api',
  '--reload',
  '--reload-dir',
  'apps/api',
  '--port',
  '8000',
  ...process.argv.slice(2)
];

console.log(`\x1b[36m[Backend]\x1b[0m Starting FastAPI using: ${pythonBin}`);

const proc = spawn(pythonBin, args, {
  cwd: rootDir,
  stdio: 'inherit'
});

proc.on('error', (err) => {
  console.error('\x1b[31m[Backend Error]\x1b[0m Failed to start backend:', err);
  process.exit(1);
});

proc.on('exit', (code) => {
  process.exit(code || 0);
});
