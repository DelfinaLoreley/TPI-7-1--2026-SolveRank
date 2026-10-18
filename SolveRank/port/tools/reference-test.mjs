import assert from 'node:assert/strict';
import { readdir, readFile, mkdir, writeFile } from 'node:fs/promises';
import { createInterface } from 'node:readline';
import { spawn, execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { randomFillSync, createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { canonicalSvg } from '../test/helpers.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const nativeRoot = path.join(root, 'tools', 'native');
const jdk = process.env.JAVA_HOME ?? path.join(root, 'tools', 'toolchain',
  (await readdir(path.join(root, 'tools', 'toolchain'))).find(name => name.startsWith('jdk-')));
const java = path.join(jdk, 'bin', process.platform === 'win32' ? 'java.exe' : 'java');
const javac = path.join(jdk, 'bin', process.platform === 'win32' ? 'javac.exe' : 'javac');
const dependencies = path.join(nativeRoot, 'dependency', '*');
const classes = path.join(nativeRoot, 'target', 'reference-classes');
await mkdir(classes, { recursive: true });
const sources = [];
let referenceSource = path.join(root, 'tools', 'reference', 'tnoodle-lib');
try { await readdir(referenceSource); }
catch (error) {
  if (error.code !== 'ENOENT') throw error;
  referenceSource = path.join(nativeRoot, 'upstream');
}
async function collect(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const filename = path.join(dir, entry.name);
    if (entry.isDirectory()) await collect(filename);
    else if (filename.endsWith('.java')) sources.push(filename);
  }
}
for (const module of ['scrambles', 'svglite', 'min2phase', 'threephase', 'sq12phase', 'fto3phase']) {
  await collect(path.join(referenceSource, module, 'src', 'main', 'java'));
}
for (const name of ['Engine', 'ReferenceMain']) sources.push(path.join(nativeRoot, 'java', 'local', 'tnoodle', `${name}.java`));
for (const module of ['min2phase', 'threephase', 'sq12phase']) {
  sources.push(path.join(nativeRoot, 'java', 'cs', module, 'NativeTableProbe.java'));
}
const argsFile = path.join(nativeRoot, 'target', 'reference-javac.txt');
await writeFile(argsFile, sources.map(file => `"${file.replaceAll('\\', '/')}"`).join('\n'));
execFileSync(javac, ['-encoding', 'UTF-8', '-cp', dependencies, '-d', classes, `@${argsFile}`], { stdio: 'pipe' });
const child = spawn(java, ['-ea', '-Xmx768m', '-cp', `${classes}${path.delimiter}${dependencies}`, 'local.tnoodle.ReferenceMain'],
  { stdio: ['pipe', 'pipe', 'pipe'] });
let stderr = '';
child.stderr.on('data', chunk => { stderr += chunk.toString(); });
const responses = createInterface({ input: child.stdout });
const pending = [];
responses.on('line', line => {
  const next = pending.shift();
  if (!next) throw new Error(`Unexpected JVM output: ${line}`);
  const [status, data] = line.split('\t');
  if (status !== 'OK') next.reject(new Error(`Java reference rejected input: ${data}`));
  else next.resolve(data === '-' ? null : Buffer.from(data, 'base64').toString('utf8'));
});
child.on('exit', code => {
  for (const next of pending.splice(0)) next.reject(new Error(`Java reference exited ${code}: ${stderr}`));
});
function reference(op, id, algorithm = '', number = 0) {
  return new Promise((resolve, reject) => {
    pending.push({ resolve, reject });
    child.stdin.write(`${op}\t${id}\t${Buffer.from(algorithm).toString('base64')}\t${number}\n`);
  });
}

globalThis.__tnoodleRandomWord = () => randomFillSync(new Int32Array(1))[0];
const require = createRequire(import.meta.url);
const native = require('../src/engine/native.cjs');
const puzzles = process.env.PUZZLES?.split(',') ?? ['222', '333', '444', '555', '666', '777', '333ni', '444ni', '555ni', '333fm', 'clock', 'minx', 'pyram', 'skewb', 'sq1'];
const minimum = { '222': 4, pyram: 6, skewb: 7 };
const report = { reference: 'unmodified tnoodle-lib v0.20.0 on OpenJDK', compiler: 'TeaVM 0.12.3', puzzles: {}, tables: {}, vectors: 0, upstreamRegressions: [] };
try {
  for (const seed of [0, 1, -1, -2147483648, 2147483647]) {
    for (const bound of [1, 2, 3, 7, 12, 729, 5040, 479001600, 1073741825, 2147483647]) {
      assert.equal(native.randomForTest(seed, bound), await reference('random', String(bound), '', seed),
        `Java integer rejection sampling: seed ${seed}, bound ${bound}`);
    }
  }
  for (const id of puzzles) {
    const started = performance.now();
    let vectors = 0;
    async function compare(algorithm, includeSvg = true) {
      assert.equal(native.state(id, algorithm), await reference('state', id, algorithm), `${id} state/normalized hash/facelets`);
      assert.equal(native.moves(id, algorithm), await reference('moves', id, algorithm), `${id} successor moves`);
      // Megaminx draws disjoint faces by enum-keyed HashMap iteration. Identity
      // hashes can change face draw order without changing geometry or colors.
      const svgOptions = { unorderedSiblings: id === 'minx' };
      if (includeSvg) assert.deepEqual(canonicalSvg(native.render(id, algorithm), svgOptions),
        canonicalSvg(await reference('render', id, algorithm), svgOptions), `${id} state rendering`);
      vectors++;
    }
    await compare('');
    // Every legal move from solved, plus controlled multi-move walks.
    for (const move of native.moves(id, '').split('\n')) await compare(move, false);
    let algorithm = '';
    for (let i = 0; i < 12; i++) {
      const moves = native.moves(id, algorithm).split('\n');
      const move = moves[(i * 17 + 3) % moves.length];
      algorithm = [algorithm, move].filter(Boolean).join(' ');
      await compare(algorithm, i % 3 === 0);
    }
    for (const seed of [1, 87, -2147483648]) {
      const generated = native.generateForTest(id, seed);
      const original = await reference('generate', id, '', seed);
      await compare(generated);
      await compare(original);
      // Timed searches may differ in move sequences, but the sampled target
      // must be the same modulo the puzzle's rotational normalization.
      assert.equal(native.state(id, generated).split(':')[1], native.state(id, original).split(':')[1],
        `${id}: generated and reference algorithms must reach the same normalized sampled target`);
      assert.equal(native.solveIn(id, generated, (minimum[id] ?? 2) - 1), null, `${id} minimum distance filter`);
      assert.equal(await reference('solve', id, generated, (minimum[id] ?? 2) - 1), null, `${id} JVM minimum distance filter`);
      let canonical;
      try {
        canonical = native.normalize(id, generated);
      } catch (error) {
        // Some custom generators deliberately return non-canonical algorithms
        // (notably Clock and 4BLD reorientations). Only accept an assertion
        // when the unmodified, assertion-enabled JVM rejects the same input.
        if (!(error instanceof Error) || error.constructor.name !== 'JavaError') throw error;
        await assert.rejects(reference('normalize', id, generated), /AssertionError/u);
        report.upstreamRegressions.push({ puzzle: id, seed, operation: 'post-generation canonicalization',
          reference: 'AlgorithmBuilder assertion in unmodified JVM source; not used by generation/render/export' });
      }
      if (canonical !== undefined) {
        assert.equal(native.state(id, canonical).split(':')[1],
          native.state(id, generated).split(':')[1], `${id} canonicalization preserves normalized state`);
      }
      if (id === '333fm') {
        assert.ok(generated.startsWith("R' U' F "));
        assert.ok(generated.endsWith(" R' U' F"));
        assert.equal(native.normalize(id, generated).length, generated.length);
      }
    }
    report.puzzles[id] = { vectors, milliseconds: Math.round(performance.now() - started) };
    report.vectors += vectors;
    console.log(`${id}: ${vectors} differential state vectors`);
  }
  for (const id of ['333', '444', 'sq1']) {
    const expected = await reference('tables', id);
    const actual = native.tables(id);
    assert.equal(actual, expected, `${id} transition/pruning table checksums`);
    report.tables[id] = actual;
  }
  for (const id of ['222', '333', '444', '555', '666', '777']) {
    for (const move of ['R', 'U', 'F', 'L', 'D', 'B', 'Rw', 'Uw']) {
      if (!native.moves(id, '').split('\n').includes(move)) continue;
      assert.equal(native.state(id, `${move} ${move} ${move} ${move}`), native.state(id, ''), `${id}: fourth power of ${move}`);
    }
  }
  assert.equal(native.normalize('333', "R R U U'"), 'R2');
  for (const [id, algorithm] of [['333', 'R3'], ['sq1', '(20,0)'], ['clock', 'UR99+'], ['pyram', 'X']]) {
    assert.throws(() => native.render(id, algorithm));
    await assert.rejects(reference('render', id, algorithm));
  }
  await mkdir(path.join(root, 'artifacts'), { recursive: true });
  report.engineSha256 = createHash('sha256').update(await readFile(new URL('../src/engine/native.cjs', import.meta.url))).digest('hex');
  await writeFile(path.join(root, 'artifacts', 'differential-report.json'), JSON.stringify(report, null, 2) + '\n');
  console.log(`PASS: ${report.vectors} state vectors and full table fingerprints for min2phase, threephase and sq12phase.`);
} finally {
  child.stdin.end();
  responses.close();
}
