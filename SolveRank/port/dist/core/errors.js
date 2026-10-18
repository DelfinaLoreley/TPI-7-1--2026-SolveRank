export class TNoodleError extends Error {
    code;
    constructor(code, message, options) {
        super(message, options);
        this.code = code;
        this.name = 'TNoodleError';
    }
}
export function invalid(message) {
    throw new TNoodleError('INVALID_INPUT', message);
}
//# sourceMappingURL=errors.js.map