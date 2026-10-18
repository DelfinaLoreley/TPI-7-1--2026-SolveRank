import { invalid } from '../core/errors.js';
export const EVENTS = Object.freeze({
    '222': { name: '2x2x2 Cube', puzzle: '222', attempts: 5 },
    '333': { name: '3x3x3 Cube', puzzle: '333', attempts: 5 },
    '444': { name: '4x4x4 Cube', puzzle: '444', attempts: 5 },
    '555': { name: '5x5x5 Cube', puzzle: '555', attempts: 5 },
    '666': { name: '6x6x6 Cube', puzzle: '666', attempts: 3 },
    '777': { name: '7x7x7 Cube', puzzle: '777', attempts: 3 },
    '333bf': { name: '3x3x3 Blindfolded', puzzle: '333ni', attempts: 5 },
    '333fm': { name: '3x3x3 Fewest Moves', puzzle: '333fm', attempts: 3 },
    '333oh': { name: '3x3x3 One-Handed', puzzle: '333', attempts: 5 },
    clock: { name: 'Clock', puzzle: 'clock', attempts: 5 },
    minx: { name: 'Megaminx', puzzle: 'minx', attempts: 5 },
    pyram: { name: 'Pyraminx', puzzle: 'pyram', attempts: 5 },
    skewb: { name: 'Skewb', puzzle: 'skewb', attempts: 5 },
    sq1: { name: 'Square-1', puzzle: 'sq1', attempts: 5 },
    '444bf': { name: '4x4x4 Blindfolded', puzzle: '444ni', attempts: 3 },
    '555bf': { name: '5x5x5 Blindfolded', puzzle: '555ni', attempts: 3 },
    '333mbf': { name: '3x3x3 Multi-Blind', puzzle: '333ni', attempts: 3 },
});
for (const event of Object.values(EVENTS))
    Object.freeze(event);
export function isEventId(value) {
    return typeof value === 'string' && Object.hasOwn(EVENTS, value);
}
export function requireEvent(value) {
    if (!isEventId(value))
        invalid('Unknown event ID. Use one of the 17 IDs in EVENTS.');
    return value;
}
//# sourceMappingURL=catalog.js.map