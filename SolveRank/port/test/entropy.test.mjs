import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createRequire } from 'node:module';
import { randomFillSync } from 'node:crypto';

const require = createRequire(import.meta.url);
const engine = require('../src/engine/native.cjs');

test('CSPRNG boundary and exact rejection thresholds, never Math.random', () => {
  const original = Math.random;
  Math.random = () => { throw new Error('Math.random is forbidden for production sampling'); };
  let calls = 0;
  let words = [];
  globalThis.__tnoodleRandomWord = () => {
    calls++;
    assert.ok(words.length > 0);
    return words.shift();
  };
  try {
    words = [-1, 8];
    assert.equal(engine.sampleForTest(3), 1);
    assert.equal(calls, 2, 'The overflowing 31-bit candidate must be rejected, not reduced modulo 3');
    calls = 0;
    words = [-1, 2];
    assert.equal(engine.sampleForTest(1073741825), 1);
    assert.equal(calls, 2, 'Large non-power-of-two bounds require rejection');
    words = [-2147483648];
    assert.equal(engine.sampleForTest(1024), 512);
    words = [-1];
    assert.equal(engine.sampleForTest(1), 0);
    assert.throws(() => engine.sampleForTest(0));
    globalThis.__tnoodleRandomWord = () => randomFillSync(new Int32Array(1))[0];
    assert.ok(engine.generate('222').length > 0);
    globalThis.__tnoodleRandomWord = () => { throw new Error('entropy unavailable'); };
    assert.throws(() => engine.generate('clock'), /entropy unavailable/);
  } finally {
    Math.random = original;
    delete globalThis.__tnoodleRandomWord;
  }
});
