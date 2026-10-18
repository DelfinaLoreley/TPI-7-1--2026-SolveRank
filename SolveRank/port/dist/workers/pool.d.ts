import { type ClientOptions } from '../core/types.js';
import type { Work, WorkValue } from './protocol.js';
export declare class WorkerPool {
    private readonly concurrency;
    private readonly maxQueue;
    private readonly timeoutMs;
    private readonly slots;
    private readonly queue;
    private readonly terminating;
    private nextId;
    private closed;
    private closing;
    constructor(options?: ClientOptions);
    run(work: Work, signal?: AbortSignal): Promise<WorkValue>;
    private dispatch;
    private spawn;
    private settle;
    private retire;
    private fail;
    private cancel;
    close(): Promise<void>;
}
