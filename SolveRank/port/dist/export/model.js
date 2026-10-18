import { TNoodleError } from '../core/errors.js';
import { ENGINE } from '../core/types.js';
import { exportOptions } from '../core/validate.js';
export function checkAbort(signal) {
    if (signal?.aborted)
        throw new TNoodleError('ABORTED', 'The export was cancelled.');
}
export async function prepare(options, renderer) {
    exportOptions(options);
    checkAbort(options.signal);
    // Snapshot before the first await: caller mutations cannot make the PDF and
    // archive manifest disagree, or change validated private document metadata.
    const snapshot = {
        competition: options.competition,
        sheets: options.sheets.map(sheet => ({
            round: sheet.round ?? 'Round 1',
            group: sheet.group ?? 'Group A',
            batch: {
                schemaVersion: 1,
                id: sheet.batch.id,
                createdAt: sheet.batch.createdAt,
                event: sheet.batch.event,
                puzzle: sheet.batch.puzzle,
                engine: ENGINE,
                count: sheet.batch.count,
                extraCount: sheet.batch.extraCount,
                cubesPerAttempt: sheet.batch.cubesPerAttempt,
                attempts: sheet.batch.attempts.map(attempt => ({
                    number: attempt.number,
                    extra: attempt.extra,
                    scrambles: attempt.scrambles.map(scramble => ({ text: scramble.text, svg: '' })),
                })),
            },
        })),
    };
    for (const sheet of snapshot.sheets) {
        for (const attempt of sheet.batch.attempts) {
            for (const scramble of attempt.scrambles) {
                checkAbort(options.signal);
                const renderOptions = {
                    event: sheet.batch.event,
                    scramble: scramble.text,
                    ...(options.signal ? { signal: options.signal } : {}),
                };
                scramble.svg = await renderer.renderScrambleSvg(renderOptions);
            }
        }
    }
    return snapshot;
}
//# sourceMappingURL=model.js.map