import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { cp, mkdir, mkdtemp, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const { version } = JSON.parse(await readFile(join(root, 'package.json'), 'utf8'));
const name = `classless-survivors-${version}.zip`;
const output = join(root, 'release');
const staging = await mkdtemp(join(tmpdir(), 'classless-package-'));
try {
  // Build first: never package an old dist directory after a failed check.
  execFileSync('npm', ['run', 'build'], { cwd: root, stdio: 'inherit' });
  await cp(join(root, 'dist'), join(staging, 'web'), { recursive: true });
  for (const file of ['PLAYING.md', 'DEPLOYMENT.md']) await cp(join(root, file), join(staging, file));
  await writeFile(join(staging, 'START-HERE.txt'),
    `Classless Survivors ${version}\n\nUpload the CONTENTS of web/ to an HTTPS static host.\nOpen that site's trailing-slash address in your browser.\nDo not double-click index.html; the game needs a web server.\n\nPLAYING.md explains controls, builds, saves and offline play.\nDEPLOYMENT.md explains GitHub Pages, other hosts and local testing.\nrelease-manifest.json lists the SHA-256 digest of each supplied file.\n`);
  const files = {};
  for (const path of (await readdir(staging, { recursive: true, withFileTypes: true }))
    .filter((entry) => entry.isFile())
    .map((entry) => join(entry.parentPath, entry.name).slice(staging.length + 1).replaceAll('\\', '/')).sort()) {
    const bytes = await readFile(join(staging, path));
    files[path] = { bytes: bytes.length, sha256: createHash('sha256').update(bytes).digest('hex') };
  }
  await writeFile(join(staging, 'release-manifest.json'), JSON.stringify({ version, webRoot: 'web/', files }, null, 2) + '\n');
  await mkdir(output, { recursive: true });
  const archive = join(output, name);
  await rm(archive, { force: true });
  execFileSync('zip', ['-X', '-q', archive, ...Object.keys(files), 'release-manifest.json'], { cwd: staging });
  const bytes = await readFile(archive);
  await writeFile(join(output, `${name}.sha256`), `${createHash('sha256').update(bytes).digest('hex')}  ${name}\n`);
  // A previous smoke report must never imply that a newly packaged ZIP passed.
  await rm(join(output, 'smoke-results.json'), { force: true });
  await rm(join(output, 'screenshots'), { recursive: true, force: true });
  console.log(`Release: ${archive} (${bytes.length} bytes). Next: npm run test:release`);
} finally {
  await rm(staging, { recursive: true, force: true });
}
