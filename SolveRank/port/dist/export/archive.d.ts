import { type PreparedDocument } from './model.js';
export declare function archive(document: PreparedDocument, pdf: Buffer, signal?: AbortSignal): Promise<Buffer>;
