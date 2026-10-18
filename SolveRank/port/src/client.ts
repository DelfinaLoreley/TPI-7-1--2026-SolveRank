import { randomUUID } from 'node:crypto';
import { TNoodleError } from './core/errors.js';
import { ENGINE, type ClientOptions, type ExportOptions, type GenerateOptions, type RenderOptions, type ScrambleBatch } from './core/types.js';
import { generateOptions, renderOptions } from './core/validate.js';
import { WorkerPool } from './workers/pool.js';
import { createArchive, createPdf } from './export/index.js';

export class TNoodle {
  private readonly pool: WorkerPool;

  constructor(options: ClientOptions = {}) {
    this.pool = new WorkerPool(options);
  }

  async generateScrambles(options: GenerateOptions): Promise<ScrambleBatch> {
    const { event, puzzle, count, extraCount, cubesPerAttempt } = generateOptions(options);
    const value = await this.pool.run({
      op: 'generate', puzzle, count: (count + extraCount) * cubesPerAttempt,
    }, options.signal);
    if (!Array.isArray(value)) throw new TNoodleError('ENGINE_ERROR', 'Unexpected generation response.');
    const attempts = [];
    for (let index = 0; index < count + extraCount; index++) {
      attempts.push(Object.freeze({
        number: index < count ? index + 1 : index - count + 1,
        extra: index >= count,
        scrambles: Object.freeze(value.slice(index * cubesPerAttempt, (index + 1) * cubesPerAttempt)
          .map(scramble => Object.freeze(scramble))),
      }));
    }
    return Object.freeze({
      schemaVersion: 1, id: randomUUID(), createdAt: new Date().toISOString(),
      event, puzzle, engine: ENGINE, count, extraCount, cubesPerAttempt,
      attempts: Object.freeze(attempts),
    });
  }

  async renderScrambleSvg(options: RenderOptions): Promise<string> {
    const { puzzle, algorithm } = renderOptions(options);
    const value = await this.pool.run({ op: 'render', puzzle, algorithm }, options.signal);
    if (typeof value !== 'string') throw new TNoodleError('ENGINE_ERROR', 'Unexpected rendering response.');
    return value;
  }

  close(): Promise<void> {
    return this.pool.close();
  }

  createScrambleSheetsPdf(options: ExportOptions): Promise<Buffer> {
    return createPdf(options, this);
  }

  createScrambleArchive(options: ExportOptions): Promise<Buffer> {
    return createArchive(options, this);
  }

  async [Symbol.asyncDispose](): Promise<void> {
    await this.close();
  }
}
