import { type PreparedDocument } from './model.js';
export declare function pdf(document: PreparedDocument, signal?: AbortSignal): Promise<Buffer>;
