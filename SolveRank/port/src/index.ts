import { TNoodle } from './client.js';
import type { ExportOptions, GenerateOptions, RenderOptions } from './core/types.js';

export { TNoodle } from './client.js';
export { TNoodleError, type ErrorCode } from './core/errors.js';
export { EVENTS, isEventId, type EventId, type PuzzleId } from './events/catalog.js';
export { ENGINE, LIMITS } from './core/types.js';
export type {
  ClientOptions, ExportOptions, GenerateOptions, RenderOptions,
  Scramble, ScrambleAttempt, ScrambleBatch, Sheet,
} from './core/types.js';

const defaultClient = new TNoodle();

export const generateScrambles = (options: GenerateOptions) => defaultClient.generateScrambles(options);
export const renderScrambleSvg = (options: RenderOptions) => defaultClient.renderScrambleSvg(options);
export const createScrambleSheetsPdf = (options: ExportOptions) => defaultClient.createScrambleSheetsPdf(options);
export const createScrambleArchive = (options: ExportOptions) => defaultClient.createScrambleArchive(options);
export const closeWorkers = () => defaultClient.close();
