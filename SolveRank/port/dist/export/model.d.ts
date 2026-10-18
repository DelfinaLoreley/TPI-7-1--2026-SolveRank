import { type ExportOptions, type RenderOptions, type ScrambleBatch } from '../core/types.js';
export interface Renderer {
    renderScrambleSvg(options: RenderOptions): Promise<string>;
}
export interface PreparedSheet {
    batch: ScrambleBatch;
    round: string;
    group: string;
}
export interface PreparedDocument {
    competition: string;
    sheets: PreparedSheet[];
}
export declare function checkAbort(signal?: AbortSignal): void;
export declare function prepare(options: ExportOptions, renderer: Renderer): Promise<PreparedDocument>;
