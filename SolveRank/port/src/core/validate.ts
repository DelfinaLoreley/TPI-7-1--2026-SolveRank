import { invalid } from './errors.js';
import { ENGINE, LIMITS, type ExportOptions, type GenerateOptions, type RenderOptions } from './types.js';
import { EVENTS, requireEvent } from '../events/catalog.js';

export function integer(value: unknown, label: string, min: number, max: number): number {
  if (typeof value !== 'number' || !Number.isSafeInteger(value) || value < min || value > max) {
    invalid(`${label} must be an integer between ${min} and ${max}.`);
  }
  return value;
}

export function record(value: unknown, label: string): asserts value is Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) invalid(`${label} must be an object.`);
}

export function signal(value: unknown): void {
  if (value !== undefined && !(value instanceof AbortSignal)) invalid('signal must be an AbortSignal.');
}

export function generateOptions(options: GenerateOptions) {
  record(options, 'options');
  const event = requireEvent(options.event);
  const count = integer(options.count === undefined ? EVENTS[event].attempts : options.count, 'count', 1, LIMITS.maxAttempts);
  const extraCount = integer(options.extraCount === undefined ? 0 : options.extraCount, 'extraCount', 0, LIMITS.maxExtras);
  let cubesPerAttempt = 1;
  if (event === '333mbf') {
    cubesPerAttempt = integer(options.cubesPerAttempt, 'cubesPerAttempt', 1, LIMITS.maxCubesPerAttempt);
  } else if (options.cubesPerAttempt !== undefined) {
    invalid('cubesPerAttempt is only valid for 333mbf.');
  }
  if ((count + extraCount) * cubesPerAttempt > LIMITS.maxScramblesPerBatch) {
    invalid(`A batch cannot contain more than ${LIMITS.maxScramblesPerBatch} individual scrambles.`);
  }
  signal(options.signal);
  return { event, puzzle: EVENTS[event].puzzle, count, extraCount, cubesPerAttempt };
}

export function renderOptions(options: RenderOptions) {
  record(options, 'options');
  const event = requireEvent(options.event);
  if (typeof options.scramble !== 'string' || options.scramble.length > LIMITS.maxAlgorithmLength) {
    invalid(`scramble must be a string no longer than ${LIMITS.maxAlgorithmLength} characters.`);
  }
  signal(options.signal);
  return { puzzle: EVENTS[event].puzzle, algorithm: options.scramble };
}

export function label(value: unknown, name: string): string {
  if (typeof value !== 'string' || value.length === 0 || value.length > LIMITS.maxLabelLength ||
      /[\u0000-\u001f\u007f]/u.test(value)) {
    invalid(`${name} must contain 1-${LIMITS.maxLabelLength} characters without control characters.`);
  }
  // The bundled PDF font is Helvetica/WinAnsi. Reject unsupported glyphs rather
  // than silently printing incorrect text in private tournament documents.
  if (!/^[\u0020-\u007e\u00a0-\u00ff\u20ac]*$/u.test(value)) {
    invalid(`${name} contains characters unsupported by the bundled PDF font (Latin-1/Euro).`);
  }
  return value;
}

export function exportOptions(options: ExportOptions): void {
  record(options, 'options');
  label(options.competition, 'competition');
  signal(options.signal);
  if (!Array.isArray(options.sheets) || options.sheets.length === 0 || options.sheets.length > LIMITS.maxExportBatches) {
    invalid(`sheets must contain 1-${LIMITS.maxExportBatches} sheets.`);
  }
  let total = 0;
  const ids = new Set<string>();
  for (const sheet of options.sheets) {
    record(sheet, 'sheet');
    if (sheet.round !== undefined) label(sheet.round, 'round');
    if (sheet.group !== undefined) label(sheet.group, 'group');
    const batch = sheet.batch;
    record(batch, 'batch');
    const event = requireEvent(batch.event);
    if (batch.schemaVersion !== 1 || batch.puzzle !== EVENTS[event].puzzle) invalid('Unsupported batch schema or puzzle.');
    record(batch.engine, 'batch.engine');
    if (batch.engine.version !== ENGINE.version || batch.engine.revision !== ENGINE.revision ||
        batch.engine.portVersion !== ENGINE.portVersion || batch.engine.backend !== ENGINE.backend) {
      invalid('Batch engine metadata does not match this port.');
    }
    if (typeof batch.createdAt !== 'string' || !Number.isFinite(Date.parse(batch.createdAt)) ||
        new Date(batch.createdAt).toISOString() !== batch.createdAt) {
      invalid('Invalid batch creation date.');
    }
    if (typeof batch.id !== 'string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/iu.test(batch.id) || ids.has(batch.id)) {
      invalid('Every exported batch must have a distinct UUID.');
    }
    ids.add(batch.id);
    const count = integer(batch.count, 'batch.count', 1, LIMITS.maxAttempts);
    const extraCount = integer(batch.extraCount, 'batch.extraCount', 0, LIMITS.maxExtras);
    const cubesPerAttempt = integer(batch.cubesPerAttempt, 'batch.cubesPerAttempt', 1, LIMITS.maxCubesPerAttempt);
    if ((count + extraCount) * cubesPerAttempt > LIMITS.maxScramblesPerBatch) {
      invalid('Batch exceeds the individual scramble limit.');
    }
    if (event !== '333mbf' && cubesPerAttempt !== 1) invalid('Only Multi-Blind supports multiple cubes.');
    if (!Array.isArray(batch.attempts) || batch.attempts.length !== count + extraCount) {
      invalid('Batch attempt count does not match its metadata.');
    }
    for (const [index, attempt] of batch.attempts.entries()) {
      record(attempt, 'attempt');
      const extra = index >= count;
      if (attempt.number !== (extra ? index - count + 1 : index + 1) || attempt.extra !== extra ||
          !Array.isArray(attempt.scrambles) || attempt.scrambles.length !== cubesPerAttempt) {
        invalid('Invalid attempt numbering, extras or cube grouping.');
      }
      for (const scramble of attempt.scrambles) {
        record(scramble, 'scramble');
        if (typeof scramble.text !== 'string' || scramble.text.length === 0 ||
            scramble.text.length > LIMITS.maxAlgorithmLength) invalid('Invalid scramble text in batch.');
        // SVG is never trusted on import; exports re-render the stored text.
      }
      total += attempt.scrambles.length;
    }
  }
  if (total > LIMITS.maxExportScrambles) invalid(`Exports are limited to ${LIMITS.maxExportScrambles} scrambles.`);
}
