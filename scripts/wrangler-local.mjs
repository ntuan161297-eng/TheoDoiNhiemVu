// The npm commands use the project-pinned CLI and keep dev state/logs in the workspace.
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { mkdir } from 'node:fs/promises';
import { localWorkerdEnvironment } from './local-workerd-runtime.mjs';
const root = fileURLToPath(new URL('../', import.meta.url));
const logs = fileURLToPath(new URL('../.local/cloudflare/logs/', import.meta.url));
await mkdir(logs, { recursive: true });
const cliArgs = process.argv.slice(2);
let childEnv = { ...process.env, WRANGLER_SEND_METRICS: 'false', WRANGLER_LOG_PATH: logs };
if (cliArgs[0] === 'dev' || (cliArgs[0] === 'd1' && cliArgs.includes('--local'))) {
  childEnv = await localWorkerdEnvironment(childEnv);
}
const child = spawn(process.execPath, [fileURLToPath(new URL('../node_modules/wrangler/bin/wrangler.js', import.meta.url)), ...process.argv.slice(2)], {
  cwd: root, stdio: 'inherit', windowsHide: true,
  env: childEnv,
});
child.on('error', error => { console.error(error.message); process.exitCode = 1; });
child.on('exit', code => { process.exitCode = code ?? 1; });
