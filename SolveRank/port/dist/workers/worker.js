import { parentPort } from 'node:worker_threads';
import engine from '../engine/adapter.js';
if (!parentPort)
    throw new Error('The TNoodle worker must run in a worker thread.');
const port = parentPort;
port.on('message', ({ id, work }) => {
    let response;
    try {
        if (work.op === 'render') {
            response = { id, ok: true, value: engine.render(work.puzzle, work.algorithm) };
        }
        else {
            const scrambles = [];
            for (let i = 0; i < work.count; i++) {
                const text = engine.generate(work.puzzle);
                scrambles.push({ text, svg: engine.render(work.puzzle, text) });
            }
            response = { id, ok: true, value: scrambles };
        }
    }
    catch (error) {
        const invalid = error instanceof Error && 'code' in error && error.code === 'INVALID_SCRAMBLE';
        response = {
            id, ok: false,
            code: invalid ? 'INVALID_SCRAMBLE' : 'ENGINE_ERROR',
            message: invalid
                ? 'The algorithm contains an invalid or illegal move for this puzzle.'
                : `TNoodle engine failed (${error instanceof Error ? error.name : 'engine exception'}).`,
        };
    }
    port.postMessage(response);
});
//# sourceMappingURL=worker.js.map