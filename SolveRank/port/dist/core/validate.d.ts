import { type ExportOptions, type GenerateOptions, type RenderOptions } from './types.js';
export declare function integer(value: unknown, label: string, min: number, max: number): number;
export declare function record(value: unknown, label: string): asserts value is Record<string, unknown>;
export declare function signal(value: unknown): void;
export declare function generateOptions(options: GenerateOptions): {
    event: "222" | "333" | "444" | "555" | "666" | "777" | "333bf" | "333fm" | "333oh" | "clock" | "minx" | "pyram" | "skewb" | "sq1" | "444bf" | "555bf" | "333mbf";
    puzzle: "222" | "333" | "444" | "555" | "666" | "777" | "333ni" | "333fm" | "clock" | "minx" | "pyram" | "skewb" | "sq1" | "444ni" | "555ni";
    count: number;
    extraCount: number;
    cubesPerAttempt: number;
};
export declare function renderOptions(options: RenderOptions): {
    puzzle: "222" | "333" | "444" | "555" | "666" | "777" | "333ni" | "333fm" | "clock" | "minx" | "pyram" | "skewb" | "sq1" | "444ni" | "555ni";
    algorithm: string;
};
export declare function label(value: unknown, name: string): string;
export declare function exportOptions(options: ExportOptions): void;
