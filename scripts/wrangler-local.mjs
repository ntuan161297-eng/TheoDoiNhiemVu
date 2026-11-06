// The npm commands use the project-pinned CLI and keep dev state/logs in the workspace.
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { mkdir } from 'node:fs/promises';
import { readFile } from 'node:fs/promises';
import { createReadStream } from 'node:fs';
import { createHash } from 'node:crypto';
const root = fileURLToPath(new URL('../', import.meta.url));
const logs = fileURLToPath(new URL('../.local/cloudflare/logs/', import.meta.url));
await mkdir(logs, { recursive: true });
const cliArgs = process.argv.slice(2);
const childEnv = { ...process.env, WRANGLER_SEND_METRICS: 'false', WRANGLER_LOG_PATH: logs };
if (process.platform === 'win32' && cliArgs[0] === 'pages' && cliArgs[1] === 'dev' && !childEnv.MINIFLARE_WORKERD_PATH) {
  const runtime = new URL('../.local/cloudflare/workerd-runtime/', import.meta.url);
  let manifest;
  try { manifest = JSON.parse(await readFile(new URL('manifest.json', runtime), 'utf8')); }
  catch (error) { if (error.code !== 'ENOENT') throw error; }
  if (manifest) {
    const hashFile = async path => {
      const hash = createHash('sha256');
      for await (const chunk of createReadStream(path)) hash.update(chunk);
      return hash.digest('hex');
    };
    for (const file of manifest.files) {
      if (!/^[a-zA-Z0-9_.-]+$/.test(file.name) || !/^[a-f0-9]{64}$/.test(file.sha256)
        || await hashFile(new URL(file.name, runtime)) !== file.sha256) throw Error('Local runtime changed. Re-run prepare:pages-runtime after review.');
    }
    const executable = manifest.files.find(file => file.name === 'workerd.exe');
    if (!executable || await hashFile(new URL('../node_modules/@cloudflare/workerd-windows-64/bin/workerd.exe', import.meta.url)) !== executable.sha256) {
      throw Error('workerd version changed. Stop the dev server and re-run npm run prepare:pages-runtime.');
    }
    childEnv.MINIFLARE_WORKERD_PATH = fileURLToPath(new URL('workerd.exe', runtime));
    console.log('Using verified project-local Microsoft runtime; Windows configuration unchanged.');
  }
}
const child = spawn(process.execPath, [fileURLToPath(new URL('../node_modules/wrangler/bin/wrangler.js', import.meta.url)), ...process.argv.slice(2)], {
  cwd: root, stdio: 'inherit', windowsHide: true,
  env: childEnv,
});
child.on('error', error => { console.error(error.message); process.exitCode = 1; });
child.on('exit', code => { process.exitCode = code ?? 1; });
