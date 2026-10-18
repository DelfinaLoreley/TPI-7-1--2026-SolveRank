import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdir, readFile, writeFile, readdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = fileURLToPath(new URL('../', import.meta.url));
const destination = path.join(root, 'artifacts', 'package-check');
await mkdir(destination, { recursive: true });
const npmCli = process.env.npm_execpath;
if (!npmCli) throw new Error('Run this check using npm run test:package.');
function runNpm(args, cwd) {
  return execFileSync(process.execPath, [npmCli, ...args], { cwd, encoding: 'utf8', stdio: 'pipe' });
}
const packed = JSON.parse(runNpm(['pack', '--json', '--pack-destination', destination], root))[0];
assert.ok(packed.files.some(file => file.path === 'dist/engine/native.cjs'));
assert.ok(packed.files.some(file => file.path.startsWith('tools/native/upstream/min2phase/')));
assert.ok(packed.files.some(file => file.path === 'LICENSE'));
assert.ok(!packed.files.some(file => /\.(?:class|jar|wasm|exe|zip)$/u.test(file.path)));
assert.ok(!packed.files.some(file => /(?:target|node_modules|staged|toolchain|dependency)\//u.test(file.path)));
const install = path.join(destination, 'clean-install');
await mkdir(install, { recursive: true });
await writeFile(path.join(install, 'package.json'), JSON.stringify({ private: true, type: 'module' }));
runNpm(['install', '--offline', '--ignore-scripts', '--omit=dev', '--no-audit', '--no-fund',
  path.join(destination, packed.filename)], install);

const smoke = `
import assert from 'node:assert/strict';
import fs from 'node:fs';
import childProcess from 'node:child_process';
import http from 'node:http';
import https from 'node:https';
import net from 'node:net';
import { syncBuiltinESMExports } from 'node:module';
for (const name of ['spawn', 'spawnSync', 'exec', 'execSync', 'execFile', 'execFileSync', 'fork']) {
  childProcess[name] = () => { throw Error('No subprocess permitted'); };
}
for (const transport of [http, https]) {
  transport.request = transport.get = () => { throw Error('No network permitted'); };
}
net.connect = net.createConnection = () => { throw Error('No network permitted'); };
syncBuiltinESMExports();
process.env.PATH = '';
process.env.JAVA_HOME = '';
const { TNoodle } = await import('tnoodle-native');
const client = new TNoodle();
try {
  const batch = await client.generateScrambles({event:'333',count:1,extraCount:1});
  const options = {competition:'Offline',sheets:[{batch}]};
  const pdf = await client.createScrambleSheetsPdf(options);
  const zip = await client.createScrambleArchive(options);
  assert.ok(batch.attempts[0].scrambles[0].svg.startsWith('<svg'));
  assert.equal(pdf.subarray(0,5).toString(),'%PDF-');
  assert.equal(zip.subarray(0,2).toString(),'PK');
  fs.writeFileSync('offline-result.json',JSON.stringify({
    event:batch.event,attempts:batch.attempts.length,pdfBytes:pdf.length,zipBytes:zip.length,javaHome:process.env.JAVA_HOME
  },null,2));
} finally { await client.close(); }
`;
await writeFile(path.join(install, 'smoke.mjs'), smoke);
execFileSync(process.execPath, ['smoke.mjs'], { cwd: install, encoding: 'utf8', stdio: 'pipe' });
const result = JSON.parse(await readFile(path.join(install, 'offline-result.json'), 'utf8'));
const runtime = path.join(install, 'node_modules', 'tnoodle-native', 'dist');
async function inspect(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const file = path.join(dir, entry.name);
    if (entry.isDirectory()) await inspect(file);
    else if (/\.(?:js|cjs)$/u.test(file)) {
      const text = await readFile(file, 'utf8');
      assert.ok(!/\bWebAssembly\s*(?:\.|\[|\()/u.test(text), `Unexpected WASM execution in ${file}`);
      assert.ok(!/from ['"]node:(?:child_process|http|https|net)['"]/u.test(text), `Runtime service/process dependency in ${file}`);
    }
  }
}
await inspect(runtime);
await writeFile(path.join(destination, 'report.json'), JSON.stringify({
  filename: packed.filename, packageBytes: packed.size, unpackedBytes: packed.unpackedSize,
  sourceFilesIncluded: packed.files.filter(file => file.path.startsWith('tools/native/upstream/')).length,
  offline: result,
}, null, 2) + '\n');
console.log(`PASS: clean offline installation; native text/SVG/PDF/ZIP, no Java/subprocess/network runtime dependency. Package ${packed.size} bytes.`);
