import { TNoodle } from './client.js';
export { TNoodle } from './client.js';
export { TNoodleError } from './core/errors.js';
export { EVENTS, isEventId } from './events/catalog.js';
export { ENGINE, LIMITS } from './core/types.js';
const defaultClient = new TNoodle();
export const generateScrambles = (options) => defaultClient.generateScrambles(options);
export const renderScrambleSvg = (options) => defaultClient.renderScrambleSvg(options);
export const createScrambleSheetsPdf = (options) => defaultClient.createScrambleSheetsPdf(options);
export const createScrambleArchive = (options) => defaultClient.createScrambleArchive(options);
export const closeWorkers = () => defaultClient.close();
//# sourceMappingURL=index.js.map