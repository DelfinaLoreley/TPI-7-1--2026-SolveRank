import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createHash } from 'node:crypto';
import { unzipSync, strFromU8 } from 'fflate';
import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs';
import { TNoodle, TNoodleError, EVENTS, ENGINE } from '../dist/index.js';
import { parseSvg, canonicalSvg } from './helpers.mjs';

test('all 17 events: text, state SVG, coherent PDF/ZIP and special sheets', { timeout: 600_000 }, async t => {
  const client = new TNoodle({ workers: 1, timeoutMs: 300_000 });
  const batches = [];
  let ticks = 0;
  let maximumTickGap = 0;
  let lastTick = performance.now();
  const timer = setInterval(() => {
    maximumTickGap = Math.max(maximumTickGap, performance.now() - lastTick);
    lastTick = performance.now();
    ticks++;
  }, 10);
  try {
    assert.equal(Object.keys(EVENTS).length, 17);
    assert.ok(!Object.hasOwn(EVENTS, 'fto'));
    for (const event of Object.keys(EVENTS)) {
      const start = performance.now();
      const batch = await client.generateScrambles({
        event, count: 1, extraCount: 1,
        ...(event === '333mbf' ? { cubesPerAttempt: 8 } : {}),
      });
      assert.equal(batch.event, event);
      assert.deepEqual(batch.engine, ENGINE);
      assert.ok(Object.isFrozen(batch));
      assert.equal(batch.attempts.length, 2);
      assert.equal(batch.attempts[0].extra, false);
      assert.equal(batch.attempts[1].extra, true);
      for (const attempt of batch.attempts) {
        assert.equal(attempt.scrambles.length, event === '333mbf' ? 8 : 1);
        for (const scramble of attempt.scrambles) {
          assert.ok(scramble.text.length > 0);
          parseSvg(scramble.svg);
          const rendered = await client.renderScrambleSvg({ event, scramble: scramble.text });
          assert.deepEqual(canonicalSvg(rendered), canonicalSvg(scramble.svg));
          if (event === '333fm') {
            assert.ok(scramble.text.startsWith("R' U' F "));
            assert.ok(scramble.text.endsWith(" R' U' F"));
          }
        }
      }
      batches.push(batch);
      t.diagnostic(`${event}: ${Math.round(performance.now() - start)} ms`);
    }
    assert.ok(ticks > 10, 'CPU work must not prevent main-thread timers from running');
    t.diagnostic(`Main thread tick count: ${ticks}; largest observed gap: ${Math.round(maximumTickGap)} ms; RSS: ${Math.round(process.memoryUsage().rss / 1048576)} MiB`);
    clearInterval(timer);

    const options = {
      competition: 'Torneo local - integración',
      sheets: batches.map((batch, i) => ({ batch, round: `Ronda ${i + 1}`, group: 'Grupo A' })),
    };
    const before = createHash('sha256').update(JSON.stringify(batches)).digest('hex');
    const output = await client.createScrambleArchive(options);
    const files = unzipSync(output);
    assert.ok(files['scrambles.pdf']);
    const manifest = JSON.parse(strFromU8(files['manifest.json']));
    assert.equal(manifest.sheets.length, 17);
    for (const [i, sheet] of manifest.sheets.entries()) {
      assert.deepEqual(sheet.batch, batches[i]);
      const prefix = `${String(i + 1).padStart(3, '0')}-${sheet.batch.event}-${sheet.batch.id}`;
      const txt = strFromU8(files[`${prefix}/scrambles.txt`]);
      for (const attempt of sheet.batch.attempts) {
        for (const [cube, scramble] of attempt.scrambles.entries()) {
          assert.ok(txt.includes(scramble.text));
          const key = `${prefix}/${attempt.extra ? 'extra' : 'attempt'}-${attempt.number}-cube-${cube + 1}.svg`;
          assert.deepEqual(canonicalSvg(strFromU8(files[key])), canonicalSvg(scramble.svg));
        }
      }
    }
    assert.ok(Object.keys(files).every(name => !name.startsWith('/') && !name.includes('..') && !name.includes('\\')));
    assert.equal(createHash('sha256').update(JSON.stringify(batches)).digest('hex'), before);

    const loading = getDocument({ data: new Uint8Array(files['scrambles.pdf']), useSystemFonts: true });
    const document = await loading.promise;
    assert.ok(document.numPages >= 20, 'Normal, FMC and Multi-Blind pagination');
    let text = '';
    let pagesWithCube = 0;
    for (let pageNumber = 1; pageNumber <= document.numPages; pageNumber++) {
      const page = await document.getPage(pageNumber);
      const content = await page.getTextContent();
      const strings = content.items.filter(item => 'str' in item);
      const pageText = strings.map(item => item.str).join(' ');
      text += pageText + '\n';
      if (pageText.includes('Cube')) pagesWithCube++;
      for (const item of strings) {
        const x = item.transform[4];
        const y = item.transform[5];
        assert.ok(x >= 0 && x + item.width <= page.view[2] + 1, `Text outside horizontal page bounds: ${item.str}`);
        assert.ok(y >= 0 && y <= page.view[3], `Text outside vertical page bounds: ${item.str}`);
      }
      await page.getOperatorList();
    }
    const plain = text.replace(/\s+/gu, ' ');
    for (const batch of batches) {
      for (const attempt of batch.attempts) {
        for (const scramble of attempt.scrambles) {
          const expected = scramble.text.replace(/\s+/gu, ' ');
          assert.ok(plain.includes(expected), `PDF must retain every algorithm for ${batch.event}`);
        }
      }
    }
    assert.ok(plain.includes('Time limit: 60 minutes'));
    assert.ok(plain.includes('Extra 1'));
    assert.ok(plain.includes('Cube 8'));
    assert.ok(pagesWithCube > 1);
    t.diagnostic(`Archive: ${output.length} bytes, PDF: ${document.numPages} readable pages`);
    await document.destroy();

    await assert.rejects(client.renderScrambleSvg({ event: 'sq1', scramble: '(1,0) / / / INVALID' }),
      error => error instanceof TNoodleError && error.code === 'INVALID_SCRAMBLE');
    await assert.rejects(client.renderScrambleSvg({ event: '333', scramble: '<script>alert(1)</script>' }),
      error => error instanceof TNoodleError && error.code === 'INVALID_SCRAMBLE');

    const imported = structuredClone(batches[0]);
    imported.attempts[0].scrambles[0].svg = '<svg><script>throw Error("injected")</script></svg>';
    const safeArchive = unzipSync(await client.createScrambleArchive({
      competition: '../Torneo', sheets: [{ batch: imported, round: '../../secret', group: '<grupo>' }],
    }));
    assert.ok(!strFromU8(safeArchive['manifest.json']).includes('<script>'));
    assert.ok(Object.keys(safeArchive).every(name => !name.includes('..')));
  } finally {
    clearInterval(timer);
    await client.close();
  }
});
