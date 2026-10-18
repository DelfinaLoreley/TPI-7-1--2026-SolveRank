import type { PuzzleId } from '../events/catalog.js';
import type { Scramble } from '../core/types.js';
import type { ErrorCode } from '../core/errors.js';
export type Work = {
    op: 'generate';
    puzzle: PuzzleId;
    count: number;
} | {
    op: 'render';
    puzzle: PuzzleId;
    algorithm: string;
};
export interface WorkRequest {
    id: number;
    work: Work;
}
export type WorkValue = string | Scramble[];
export type WorkResponse = {
    id: number;
    ok: true;
    value: WorkValue;
} | {
    id: number;
    ok: false;
    code: ErrorCode;
    message: string;
};
