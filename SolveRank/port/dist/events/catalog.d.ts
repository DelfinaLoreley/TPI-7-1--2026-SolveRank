export declare const EVENTS: Readonly<{
    readonly '222': {
        readonly name: "2x2x2 Cube";
        readonly puzzle: "222";
        readonly attempts: 5;
    };
    readonly '333': {
        readonly name: "3x3x3 Cube";
        readonly puzzle: "333";
        readonly attempts: 5;
    };
    readonly '444': {
        readonly name: "4x4x4 Cube";
        readonly puzzle: "444";
        readonly attempts: 5;
    };
    readonly '555': {
        readonly name: "5x5x5 Cube";
        readonly puzzle: "555";
        readonly attempts: 5;
    };
    readonly '666': {
        readonly name: "6x6x6 Cube";
        readonly puzzle: "666";
        readonly attempts: 3;
    };
    readonly '777': {
        readonly name: "7x7x7 Cube";
        readonly puzzle: "777";
        readonly attempts: 3;
    };
    readonly '333bf': {
        readonly name: "3x3x3 Blindfolded";
        readonly puzzle: "333ni";
        readonly attempts: 5;
    };
    readonly '333fm': {
        readonly name: "3x3x3 Fewest Moves";
        readonly puzzle: "333fm";
        readonly attempts: 3;
    };
    readonly '333oh': {
        readonly name: "3x3x3 One-Handed";
        readonly puzzle: "333";
        readonly attempts: 5;
    };
    readonly clock: {
        readonly name: "Clock";
        readonly puzzle: "clock";
        readonly attempts: 5;
    };
    readonly minx: {
        readonly name: "Megaminx";
        readonly puzzle: "minx";
        readonly attempts: 5;
    };
    readonly pyram: {
        readonly name: "Pyraminx";
        readonly puzzle: "pyram";
        readonly attempts: 5;
    };
    readonly skewb: {
        readonly name: "Skewb";
        readonly puzzle: "skewb";
        readonly attempts: 5;
    };
    readonly sq1: {
        readonly name: "Square-1";
        readonly puzzle: "sq1";
        readonly attempts: 5;
    };
    readonly '444bf': {
        readonly name: "4x4x4 Blindfolded";
        readonly puzzle: "444ni";
        readonly attempts: 3;
    };
    readonly '555bf': {
        readonly name: "5x5x5 Blindfolded";
        readonly puzzle: "555ni";
        readonly attempts: 3;
    };
    readonly '333mbf': {
        readonly name: "3x3x3 Multi-Blind";
        readonly puzzle: "333ni";
        readonly attempts: 3;
    };
}>;
export type EventId = keyof typeof EVENTS;
export type PuzzleId = (typeof EVENTS)[EventId]['puzzle'];
export declare function isEventId(value: unknown): value is EventId;
export declare function requireEvent(value: unknown): EventId;
