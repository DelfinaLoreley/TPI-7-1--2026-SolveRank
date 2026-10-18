import { createRequire } from 'node:module';
import { randomFillSync } from 'node:crypto';
import type { PuzzleId } from '../events/catalog.js';

interface Engine {
  generate(puzzle: PuzzleId): string;
  render(puzzle: PuzzleId, algorithm: string): string;
}

const words = new Int32Array(1024);
let offset = words.length;
Object.defineProperty(globalThis, '__tnoodleRandomWord', {
  value: () => {
    if (offset === words.length) {
      randomFillSync(words);
      offset = 0;
    }
    return words[offset++]!;
  },
  configurable: false,
  writable: false,
});

const require = createRequire(import.meta.url);
const engine: Engine = require('./native.cjs');
export default engine;
