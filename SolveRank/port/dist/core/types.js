export const ENGINE = Object.freeze({
    name: 'TNoodle',
    version: '0.20.0',
    revision: 'b7f9bfeca5d43856e551e975ba305c36a3b86fcb',
    portVersion: '0.1.0',
    backend: 'javascript-aot',
});
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
//# sourceMappingURL=types.js.map