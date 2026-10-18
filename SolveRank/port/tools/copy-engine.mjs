import { cp, mkdir, readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';

const engine = new URL('../src/engine/native.cjs', import.meta.url);
const expected = (await readFile(new URL('native/engine-sha256.txt', import.meta.url), 'utf8')).trim();
const actual = createHash('sha256').update(await readFile(engine)).digest('hex');
if (actual !== expected) throw new Error('Generated engine checksum differs. Regenerate with npm run engine:build.');
await mkdir(new URL('../dist/engine/', import.meta.url), { recursive: true });
await cp(engine, new URL('../dist/engine/native.cjs', import.meta.url));
