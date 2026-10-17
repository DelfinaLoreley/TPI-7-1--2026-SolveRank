import type { EventId, PuzzleId } from '../events/catalog.js';

export const ENGINE = Object.freeze({
  name: 'TNoodle',
  version: '0.20.0',
  revision: 'b7f9bfeca5d43856e551e975ba305c36a3b86fcb',
  portVersion: '0.1.0',
  backend: 'javascript-aot',
} as const);

export const LIMITS = Object.freeze({
  maxAttempts: 100,
  maxExtras: 20,
  maxCubesPerAttempt: 100,
  maxScramblesPerBatch: 200,
  maxAlgorithmLength: 20_000,
  maxExportBatches: 100,
  maxExportScrambles: 1_000,
  maxLabelLength: 160,
  maxWorkers: 4,
  maxQueue: 64,
  maxTimeoutMs: 3_600_000,
});

export interface GenerateOptions {
  event: EventId;
  /** Main attempts, excluding extras. Defaults to the event's full round. */
  count?: number;
  extraCount?: number;
  /** Required for Multi-Blind; each attempt contains this many scrambles. */
  cubesPerAttempt?: number;
  signal?: AbortSignal;
}

export interface Scramble {
  readonly text: string;
  readonly svg: string;
}

export interface ScrambleAttempt {
  readonly number: number;
  readonly extra: boolean;
  readonly scrambles: readonly Scramble[];
}

export interface ScrambleBatch {
  readonly schemaVersion: 1;
  readonly id: string;
  readonly createdAt: string;
  readonly event: EventId;
  readonly puzzle: PuzzleId;
  readonly engine: typeof ENGINE;
  readonly count: number;
  readonly extraCount: number;
  readonly cubesPerAttempt: number;
  readonly attempts: readonly ScrambleAttempt[];
}

export interface RenderOptions {
  event: EventId;
  scramble: string;
  signal?: AbortSignal;
}

export interface ClientOptions {
  /** Defaults to 1: the 4x4 tables consume substantial memory per worker. */
  workers?: number;
  /** Maximum waiting jobs, excluding jobs already running. Defaults to 8. */
  maxQueue?: number;
  /** Includes time in queue and solver/table initialization. Defaults to 5 minutes. */
  timeoutMs?: number;
}

export interface Sheet {
  batch: ScrambleBatch;
  round?: string;
  group?: string;
}

export interface ExportOptions {
  competition: string;
  sheets: readonly Sheet[];
  signal?: AbortSignal;
}
