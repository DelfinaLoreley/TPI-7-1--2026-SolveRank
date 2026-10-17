import type { ExportOptions } from '../core/types.js';
import { prepare, type Renderer } from './model.js';
import { pdf } from './pdf.js';
import { archive } from './archive.js';

export async function createPdf(options: ExportOptions, renderer: Renderer): Promise<Buffer> {
  return pdf(await prepare(options, renderer), options.signal);
}

export async function createArchive(options: ExportOptions, renderer: Renderer): Promise<Buffer> {
  const document = await prepare(options, renderer);
  return archive(document, await pdf(document, options.signal), options.signal);
}
