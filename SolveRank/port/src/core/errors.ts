export type ErrorCode =
  | 'INVALID_INPUT'
  | 'INVALID_SCRAMBLE'
  | 'QUEUE_FULL'
  | 'ABORTED'
  | 'TIMEOUT'
  | 'CLOSED'
  | 'ENGINE_ERROR'
  | 'EXPORT_ERROR';

export class TNoodleError extends Error {
  constructor(
    public readonly code: ErrorCode,
    message: string,
    options?: ErrorOptions,
  ) {
    super(message, options);
    this.name = 'TNoodleError';
  }
}

export function invalid(message: string): never {
  throw new TNoodleError('INVALID_INPUT', message);
}
