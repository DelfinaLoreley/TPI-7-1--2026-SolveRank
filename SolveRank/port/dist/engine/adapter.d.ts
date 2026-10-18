import type { PuzzleId } from '../events/catalog.js';
interface Engine {
    generate(puzzle: PuzzleId): string;
    render(puzzle: PuzzleId, algorithm: string): string;
}
declare const engine: Engine;
export default engine;
