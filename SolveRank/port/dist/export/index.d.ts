import type { ExportOptions } from '../core/types.js';
import { type Renderer } from './model.js';
export declare function createPdf(options: ExportOptions, renderer: Renderer): Promise<Buffer>;
export declare function createArchive(options: ExportOptions, renderer: Renderer): Promise<Buffer>;
