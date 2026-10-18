import { Worker } from 'node:worker_threads';
import { TNoodleError } from '../core/errors.js';
import { integer, record } from '../core/validate.js';
import { LIMITS, type ClientOptions } from '../core/types.js';
import type { Work, WorkRequest, WorkResponse, WorkValue } from './protocol.js';

interface Job {
  id: number;
  work: Work;
  resolve(value: WorkValue): void;
  reject(error: Error): void;
  timer: NodeJS.Timeout;
  signal: AbortSignal | undefined;
  abort: () => void;
}

interface Slot {
  worker: Worker;
  job: Job | undefined;
  retired: boolean;
}

export class WorkerPool {
  private readonly concurrency: number;
  private readonly maxQueue: number;
  private readonly timeoutMs: number;
  private readonly slots = new Set<Slot>();
  private readonly queue: Job[] = [];
  private readonly terminating = new Set<Promise<number>>();
  private nextId = 0;
  private closed = false;
  private closing: Promise<void> | undefined;

  constructor(options: ClientOptions = {}) {
    record(options, 'client options');
    this.concurrency = integer(options.workers === undefined ? 1 : options.workers, 'workers', 1, LIMITS.maxWorkers);
    this.maxQueue = integer(options.maxQueue === undefined ? 8 : options.maxQueue, 'maxQueue', 0, LIMITS.maxQueue);
    this.timeoutMs = integer(options.timeoutMs === undefined ? 300_000 : options.timeoutMs, 'timeoutMs', 1, LIMITS.maxTimeoutMs);
  }

  run(work: Work, signal?: AbortSignal): Promise<WorkValue> {
    if (this.closed) return Promise.reject(new TNoodleError('CLOSED', 'The TNoodle client is closed.'));
    if (signal?.aborted) return Promise.reject(new TNoodleError('ABORTED', 'The operation was cancelled.'));
    if (this.slots.size >= this.concurrency &&
        ![...this.slots].some(slot => !slot.job) && this.queue.length >= this.maxQueue) {
      return Promise.reject(new TNoodleError('QUEUE_FULL', 'The TNoodle worker queue is full.'));
    }
    return new Promise((resolve, reject) => {
      const abort = () => this.cancel(job, new TNoodleError('ABORTED', 'The operation was cancelled.'));
      const timer = setTimeout(() => this.cancel(job,
        new TNoodleError('TIMEOUT', 'The operation exceeded its queue/solver time limit.')), this.timeoutMs);
      const job: Job = { id: ++this.nextId, work, resolve, reject, timer, signal, abort };
      signal?.addEventListener('abort', abort, { once: true });
      this.queue.push(job);
      this.dispatch();
    });
  }

  private dispatch(): void {
    while (!this.closed && this.queue.length > 0) {
      let slot = [...this.slots].find(candidate => !candidate.job);
      if (!slot) {
        if (this.slots.size >= this.concurrency) return;
        try {
          slot = this.spawn();
        } catch (cause) {
          const job = this.queue.shift()!;
          this.settle(job, new TNoodleError('ENGINE_ERROR', 'Unable to start TNoodle worker.', { cause }));
          continue;
        }
      }
      const job = this.queue.shift()!;
      slot.job = job;
      slot.worker.ref();
      const request: WorkRequest = { id: job.id, work: job.work };
      slot.worker.postMessage(request);
    }
  }

  private spawn(): Slot {
    const worker = new Worker(new URL('./worker.js', import.meta.url), {
      // Compiled workers need no host loaders, test-runner flags or V8 switches.
      // Some valid parent-process flags are forbidden in Worker.execArgv.
      execArgv: [],
      resourceLimits: { maxOldGenerationSizeMb: 512 },
    });
    const slot: Slot = { worker, job: undefined, retired: false };
    this.slots.add(slot);
    worker.on('message', (response: WorkResponse) => {
      if (slot.retired) return;
      const job = slot.job;
      if (!job || response.id !== job.id) {
        this.fail(slot, new TNoodleError('ENGINE_ERROR', 'Invalid worker response.'));
        return;
      }
      slot.job = undefined;
      worker.unref();
      if (response.ok) this.settle(job, undefined, response.value);
      else this.settle(job, new TNoodleError(response.code, response.message));
      this.dispatch();
    });
    worker.on('error', cause => this.fail(slot,
      new TNoodleError('ENGINE_ERROR', 'TNoodle worker failed.', { cause })));
    worker.on('exit', code => {
      if (!slot.retired) this.fail(slot,
        new TNoodleError('ENGINE_ERROR', `TNoodle worker exited unexpectedly (code ${code}).`));
    });
    return slot;
  }

  private settle(job: Job, error?: Error, value?: WorkValue): void {
    clearTimeout(job.timer);
    job.signal?.removeEventListener('abort', job.abort);
    if (error) job.reject(error);
    else if (value !== undefined) job.resolve(value);
    else job.reject(new TNoodleError('ENGINE_ERROR', 'TNoodle returned no result.'));
  }

  private retire(slot: Slot): void {
    slot.retired = true;
    this.slots.delete(slot);
    const terminating = slot.worker.terminate();
    this.terminating.add(terminating);
    void terminating.then(() => this.terminating.delete(terminating));
  }

  private fail(slot: Slot, error: Error): void {
    if (slot.retired) return;
    if (slot.job) this.settle(slot.job, error);
    slot.job = undefined;
    this.retire(slot);
    this.dispatch();
  }

  private cancel(job: Job, error: Error): void {
    const index = this.queue.indexOf(job);
    if (index >= 0) {
      this.queue.splice(index, 1);
      this.settle(job, error);
      return;
    }
    const slot = [...this.slots].find(candidate => candidate.job === job);
    if (slot) this.fail(slot, error);
  }

  close(): Promise<void> {
    if (this.closing) return this.closing;
    this.closed = true;
    const error = new TNoodleError('CLOSED', 'The TNoodle client is closed.');
    for (const job of this.queue.splice(0)) this.settle(job, error);
    for (const slot of this.slots) {
      if (slot.job) this.settle(slot.job, error);
      slot.job = undefined;
      this.retire(slot);
    }
    this.closing = Promise.all([...this.terminating]).then(() => undefined);
    return this.closing;
  }
}
