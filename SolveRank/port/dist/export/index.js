import { prepare } from './model.js';
import { pdf } from './pdf.js';
import { archive } from './archive.js';
export async function createPdf(options, renderer) {
    return pdf(await prepare(options, renderer), options.signal);
}
export async function createArchive(options, renderer) {
    const document = await prepare(options, renderer);
    return archive(document, await pdf(document, options.signal), options.signal);
}
//# sourceMappingURL=index.js.map