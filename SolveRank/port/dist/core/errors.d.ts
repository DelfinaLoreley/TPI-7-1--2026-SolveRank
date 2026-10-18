export type ErrorCode = 'INVALID_INPUT' | 'INVALID_SCRAMBLE' | 'QUEUE_FULL' | 'ABORTED' | 'TIMEOUT' | 'CLOSED' | 'ENGINE_ERROR' | 'EXPORT_ERROR';
export declare class TNoodleError extends Error {
    readonly code: ErrorCode;
    constructor(code: ErrorCode, message: string, options?: ErrorOptions);
}
export declare function invalid(message: string): never;
