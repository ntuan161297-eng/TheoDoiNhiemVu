import { fileURLToPath } from 'node:url';
import { readFile } from 'node:fs/promises';
import { createReadStream } from 'node:fs';
import { createHash } from 'node:crypto';

// Shared by Wrangler dev, D1 --local and D1 integration tests. No system changes.
export async function localWorkerdEnvironment(base = process.env) {
  const env = { ...base };
  if (process.platform !== 'win32' || env.MINIFLARE_WORKERD_PATH) return env;
  const runtime = new URL('../.local/cloudflare/workerd-runtime/', import.meta.url);
  let manifest;
  try { manifest = JSON.parse(await readFile(new URL('manifest.json', runtime), 'utf8')); }
  catch (error) { if (error.code !== 'ENOENT') throw error; }
  if (!manifest) return env;
  const hashFile = async path => {
    const hash = createHash('sha256');
    for await (const chunk of createReadStream(path)) hash.update(chunk);
    return hash.digest('hex');
  };
  for (const file of manifest.files) {
    if (!/^[a-zA-Z0-9_.-]+$/.test(file.name) || !/^[a-f0-9]{64}$/.test(file.sha256)
      || await hashFile(new URL(file.name, runtime)) !== file.sha256) throw Error('Local runtime changed. Re-run prepare:worker-runtime after review.');
  }
  const executable = manifest.files.find(file => file.name === 'workerd.exe');
  if (!executable || await hashFile(new URL('../node_modules/@cloudflare/workerd-windows-64/bin/workerd.exe', import.meta.url)) !== executable.sha256) {
    throw Error('workerd version changed. Stop local servers and re-run npm run prepare:worker-runtime.');
  }
  env.MINIFLARE_WORKERD_PATH = fileURLToPath(new URL('workerd.exe', runtime));
  return env;
}
