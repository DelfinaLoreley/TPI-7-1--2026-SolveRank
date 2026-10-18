import { cp, mkdir, readFile, readdir, writeFile, access } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const root = fileURLToPath(new URL('../../', import.meta.url));
const here = path.join(root, 'tools', 'native');
const checkout = path.join(root, 'tools', 'reference', 'tnoodle-lib');
const vendor = path.join(here, 'upstream');
const sources = JSON.parse(await readFile(path.join(root, 'tools', 'reference', 'sources.json'), 'utf8'));
let upstream = vendor;
try {
  await access(path.join(checkout, '.git'));
  upstream = checkout;
} catch (error) {
  if (error.code !== 'ENOENT') throw error;
}
if (upstream === checkout) {
  const revision = execFileSync('git', ['-c', `safe.directory=${checkout.replaceAll('\\', '/')}`, '-C', checkout, 'rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
  if (revision !== sources.engine.commit) throw new Error(`Expected upstream ${sources.engine.commit}, got ${revision}`);
  const dirty = execFileSync('git', ['-c', `safe.directory=${checkout.replaceAll('\\', '/')}`, '-C', checkout, 'status', '--porcelain'], { encoding: 'utf8' }).trim();
  if (dirty) throw new Error('The pinned reference checkout contains local changes.');
  for (const module of [...sources.engine.modules, 'fto3phase']) {
    await mkdir(path.join(vendor, module, 'src', 'main'), { recursive: true });
    await cp(path.join(upstream, module, 'src', 'main', 'java'),
      path.join(vendor, module, 'src', 'main', 'java'), { recursive: true });
  }
  await cp(path.join(upstream, 'LICENSE'), path.join(vendor, 'LICENSE'));
}
async function sourceHashes(dir) {
  const result = {};
  async function visit(current) {
    for (const entry of await readdir(current, { withFileTypes: true })) {
      const filename = path.join(current, entry.name);
      if (entry.isDirectory()) await visit(filename);
      else result[path.relative(dir, filename).replaceAll('\\', '/')] = createHash('sha256').update(await readFile(filename)).digest('hex');
    }
  }
  await visit(dir);
  return Object.fromEntries(Object.entries(result).sort(([a], [b]) => a.localeCompare(b)));
}
const vendorHashes = await sourceHashes(vendor);
if (upstream === checkout) await writeFile(path.join(here, 'upstream-hashes.json'), JSON.stringify(vendorHashes, null, 2) + '\n');
else {
  const expected = JSON.parse(await readFile(path.join(here, 'upstream-hashes.json'), 'utf8'));
  if (JSON.stringify(expected) !== JSON.stringify(vendorHashes)) throw new Error('Vendored upstream source checksums differ.');
}
const staged = path.join(here, 'staged');
await mkdir(staged, { recursive: true });
for (const module of [...sources.engine.modules, 'fto3phase']) {
  await cp(path.join(upstream, module, 'src', 'main', 'java'), staged, { recursive: true });
}
await cp(path.join(here, 'java'), staged, { recursive: true });

async function rewrite(relative, transform) {
  const filename = path.join(staged, relative);
  const original = await readFile(filename, 'utf8');
  const result = transform(original);
  if (result === original) throw new Error(`Port transformation did not match: ${relative}`);
  await writeFile(filename, '// Modified for the native JavaScript port; see tools/native/prepare.mjs and NOTICE.\n' + result);
}
const puzzleBase = path.join('org', 'worldcubeassociation', 'tnoodle');
await rewrite(path.join(puzzleBase, 'scrambles', 'Puzzle.java'), text => {
  const start = text.indexOf('    public static final SecureRandom getSecureRandom() {');
  const end = text.indexOf('\n    @Export', start);
  if (start < 0 || end < 0) throw new Error('Cannot find entropy factory');
  return (text.slice(0, start) +
    '    public static final Random getSecureRandom() {\n        return new local.tnoodle.NativeRandom();\n    }\n' +
    text.slice(end)).replaceAll('SecureRandom r =', 'Random r =')
      .replace(/    \/\*\*\s+\* seeded scrambles[\s\S]*?(?=    \/\*\*\s+\* @return Simply returns)/u, '');
});
await rewrite(path.join(puzzleBase, 'puzzle', 'ThreeByThreeCubePuzzle.java'),
  text => text.replace('System.getenv("TNOODLE_333_MIN_DISTANCE")', 'null')
    .replace(/l\.severe\(solution \+ " while searching for solution to " \+ cs\.toFaceCube\(\)\);[\s\S]*?return null;/u,
      'throw new IllegalStateException("3x3 solver failure: " + solution);'));
await rewrite(path.join(puzzleBase, 'scrambles', 'AlgorithmBuilder.java'),
  text => text.replace('        l.fine("appendMove(" + newMove + ")");', ''));
for (const [module, name] of [
  ...['Tools', 'Search', 'Edge3', 'Center1'].map(name => ['threephase', name]),
  ...['Shape', 'Square'].map(name => ['sq12phase', name]),
]) {
  await rewrite(path.join('cs', module, `${name}.java`), text =>
    text.replaceAll('import org.slf4j.Logger;', 'import java.util.logging.Logger;')
      .replaceAll('import org.slf4j.LoggerFactory;', '')
      .replaceAll(`LoggerFactory.getLogger(${name}.class)`, `Logger.getLogger(${name}.class.getName())`)
      .replaceAll('logger.debug(', 'logger.fine(')
      .replace(/^[ \t]*logger\.(fine|info)\([^\r\n]*\);\r?\n/gmu, ''));
}
for (const relative of [
  path.join('cs', 'min2phase', 'Tools.java'),
  path.join('cs', 'threephase', 'Tools.java'),
  path.join('cs', 'sq12phase', 'FullCube.java'),
  path.join(puzzleBase, 'puzzle', 'SkewbSolver.java'),
  path.join(puzzleBase, 'puzzle', 'PyraminxSolver.java'),
]) {
  await rewrite(relative, text => text.replaceAll('new Random()', 'new local.tnoodle.NativeRandom()'));
}
// svglite receives only engine-generated attributes; escaping still makes the
// serialization correct for text labels and future callers.
await rewrite(path.join(puzzleBase, 'svglite', 'Element.java'), text =>
  text.replace('sb.append(key).append("=").append(\'"\').append(value).append(\'"\');',
    'sb.append(key).append("=").append(\'"\').append(escapeXml(value)).append(\'"\');')
    .replace('sb.append(content);', 'sb.append(escapeXml(content));')
    .replace('    public void buildString(StringBuilder sb, int level) {',
      '    private static String escapeXml(String value) {\n' +
      '        return value.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;").replace("\\\"", "&quot;").replace("\\\'", "&apos;");\n' +
      '    }\n\n    public void buildString(StringBuilder sb, int level) {'));

await mkdir(path.join(root, 'licenses'), { recursive: true });
await cp(path.join(upstream, 'LICENSE'), path.join(root, 'LICENSE'));
for (const module of ['min2phase', 'threephase', 'sq12phase']) {
  await cp(path.join(upstream, module, 'src', 'main', 'java', 'cs', module, 'README.md'),
    path.join(root, 'licenses', `${module}-README.md`));
}
const hashes = [];
async function walk(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const filename = path.join(dir, entry.name);
    if (entry.isDirectory()) await walk(filename);
    else if (filename.endsWith('.java')) {
      hashes.push([path.relative(staged, filename).replaceAll('\\', '/'), createHash('sha256').update(await readFile(filename)).digest('hex')]);
    }
  }
}
await walk(staged);
await writeFile(path.join(here, 'source-hashes.json'), JSON.stringify(Object.fromEntries(hashes.sort()), null, 2) + '\n');
console.log(`Prepared pinned engine ${sources.engine.commit} (${hashes.length} Java development sources).`);
