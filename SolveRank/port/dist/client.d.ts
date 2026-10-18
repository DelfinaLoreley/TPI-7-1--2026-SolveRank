import { type ClientOptions, type ExportOptions, type GenerateOptions, type RenderOptions, type ScrambleBatch } from './core/types.js';
export declare class TNoodle {
    private readonly pool;
    constructor(options?: ClientOptions);
    generateScrambles(options: GenerateOptions): Promise<ScrambleBatch>;
    renderScrambleSvg(options: RenderOptions): Promise<string>;
    close(): Promise<void>;
    createScrambleSheetsPdf(options: ExportOptions): Promise<Buffer>;
    createScrambleArchive(options: ExportOptions): Promise<Buffer>;
    [Symbol.asyncDispose](): Promise<void>;
}
