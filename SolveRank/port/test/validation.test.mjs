import assert from 'node:assert/strict';
import { test } from 'node:test';
import { TNoodle, TNoodleError, EVENTS } from '../dist/index.js';

const code = expected => error => error instanceof TNoodleError && error.code === expected;

test('strict validation rejects invalid requests without starting solvers', async () => {
  const client = new TNoodle();
  try {
    for (const options of [
      undefined, null, {}, [], { event: 'fto' }, { event: '__proto__' },
      { event: '333', count: 0 }, { event: '333', count: 1.5 },
      { event: '333', count: null }, { event: '333', extraCount: null },
      { event: '333', count: NaN }, { event: '333', count: Infinity },
      { event: '333', count: 101 }, { event: '333', count: '5' },
      { event: '333', extraCount: -1 }, { event: '333', extraCount: 21 },
      { event: '333', cubesPerAttempt: 1 }, { event: '333mbf' },
      { event: '333mbf', cubesPerAttempt: 0 }, { event: '333mbf', count: 3, cubesPerAttempt: 100 },
      { event: '333', signal: {} },
    ]) await assert.rejects(client.generateScrambles(options), code('INVALID_INPUT'));
    for (const options of [
      null, {}, { event: '333', scramble: 5 }, { event: '333', scramble: 'R '.repeat(10001) },
    ]) await assert.rejects(client.renderScrambleSvg(options), code('INVALID_INPUT'));
    for (const options of [
      null, {}, { competition: 'Test', sheets: [] }, { competition: '\u0000', sheets: [{}] },
      { competition: 'Torneo 🧩', sheets: [{}] },
    ]) await assert.rejects(client.createScrambleSheetsPdf(options), code('INVALID_INPUT'));
    assert.equal(EVENTS['333oh'].puzzle, '333');
    assert.equal(EVENTS['333mbf'].puzzle, '333ni');
    assert.equal(EVENTS['333bf'].attempts, 5);
    for (const options of [{ workers: null }, { maxQueue: null }, { timeoutMs: null }, { workers: 5 }]) {
      assert.throws(() => new TNoodle(options), code('INVALID_INPUT'));
    }
  } finally {
    await client.close();
  }
});

test('bounded queue, active/queued cancellation, close and no partial success', { timeout: 30_000 }, async () => {
  const client = new TNoodle({ workers: 1, maxQueue: 1 });
  const first = new AbortController();
  const queued = new AbortController();
  const a = assert.rejects(client.generateScrambles({ event: '444', count: 5, signal: first.signal }), code('ABORTED'));
  const b = assert.rejects(client.generateScrambles({ event: '333', count: 5, signal: queued.signal }), code('ABORTED'));
  await assert.rejects(client.generateScrambles({ event: '222', count: 1 }), code('QUEUE_FULL'));
  queued.abort();
  first.abort();
  await Promise.all([a, b]);
  // A terminated solver must not poison subsequent jobs.
  const recovered = await client.renderScrambleSvg({ event: '222', scramble: "R U R' U'" });
  assert.ok(recovered.startsWith('<svg'));
  const pending = assert.rejects(client.generateScrambles({ event: '444', count: 1 }), code('CLOSED'));
  await Promise.all([client.close(), client.close()]);
  await pending;
  await assert.rejects(client.generateScrambles({ event: '333', count: 1 }), code('CLOSED'));
});

test('timeout includes initialization; already-aborted requests do not consume queue space', async () => {
  const timed = new TNoodle({ timeoutMs: 1 });
  try {
    await assert.rejects(timed.generateScrambles({ event: '444', count: 1 }), code('TIMEOUT'));
  } finally {
    await timed.close();
  }
  const aborted = new AbortController();
  aborted.abort();
  const client = new TNoodle({ maxQueue: 0 });
  try {
    await assert.rejects(client.generateScrambles({ event: '333', signal: aborted.signal }), code('ABORTED'));
    const batch = await client.generateScrambles({ event: 'clock', count: 1 });
    assert.equal(batch.count, 1);
    const broken = structuredClone(batch);
    broken.id = '-'.repeat(36);
    await assert.rejects(client.createScrambleSheetsPdf({ competition: 'Test', sheets: [{ batch: broken }] }), code('INVALID_INPUT'));
    broken.id = batch.id;
    broken.createdAt = '2000-01-01';
    await assert.rejects(client.createScrambleArchive({ competition: 'Test', sheets: [{ batch: broken }] }), code('INVALID_INPUT'));
    await assert.rejects(client.createScrambleArchive({
      competition: 'Test', sheets: [{ batch }, { batch }],
    }), code('INVALID_INPUT'));
    await assert.rejects(client.createScrambleSheetsPdf({
      competition: 'Test', sheets: [{ batch }], signal: aborted.signal,
    }), code('ABORTED'));
  } finally {
    await client.close();
  }
});
