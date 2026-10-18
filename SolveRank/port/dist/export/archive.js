import { zip, strToU8 } from 'fflate';
import { TNoodleError } from '../core/errors.js';
import { ENGINE } from '../core/types.js';
import { checkAbort } from './model.js';
export function archive(document, pdf, signal) {
    checkAbort(signal);
    const entries = {
        'scrambles.pdf': pdf,
        'manifest.json': strToU8(JSON.stringify({
            schemaVersion: 1, competition: document.competition, engine: ENGINE, sheets: document.sheets,
        }, null, 2)),
    };
    for (const [index, sheet] of document.sheets.entries()) {
        const batch = sheet.batch;
        // Never put caller-supplied competition, round or group names into ZIP paths.
        const base = `${String(index + 1).padStart(3, '0')}-${batch.event}-${batch.id}`;
        const text = [document.competition, `${sheet.round} / ${sheet.group}`, ''];
        for (const attempt of batch.attempts) {
            text.push(`${attempt.extra ? 'Extra' : 'Attempt'} ${attempt.number}`);
            for (const [cube, scramble] of attempt.scrambles.entries()) {
                text.push(`${cube + 1}. ${scramble.text}`);
                entries[`${base}/${attempt.extra ? 'extra' : 'attempt'}-${attempt.number}-cube-${cube + 1}.svg`] = strToU8(scramble.svg);
            }
            text.push('');
        }
        entries[`${base}/scrambles.txt`] = strToU8(text.join('\n') + '\n');
    }
    return new Promise((resolve, reject) => {
        const onAbort = () => {
            cancel();
            reject(new TNoodleError('ABORTED', 'The archive export was cancelled.'));
        };
        const cancel = zip(entries, { level: 6 }, (error, data) => {
            signal?.removeEventListener('abort', onAbort);
            if (error)
                reject(new TNoodleError('EXPORT_ERROR', 'Unable to create scramble archive.', { cause: error }));
            else
                resolve(Buffer.from(data));
        });
        signal?.addEventListener('abort', onAbort, { once: true });
        if (signal?.aborted)
            onAbort();
    });
}
//# sourceMappingURL=archive.js.map