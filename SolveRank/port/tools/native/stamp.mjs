import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';

const file = new URL('../../src/engine/native.cjs', import.meta.url);
const header = `/*
 * TNoodle native JavaScript engine, generated ahead of time by TeaVM 0.12.3.
 * Derived from thewca/tnoodle-lib v0.20.0 (GPL-3.0); see LICENSE and NOTICE.
 * TeaVM runtime helpers: Copyright Alexey Andreev and contributors, Apache-2.0.
 * No JVM, bytecode interpreter or WebAssembly is used at runtime.
 * Regenerate with npm run engine:build. Do not edit generated code.
 */
`;
const content = await readFile(file, 'utf8');
const result = header + content;
await writeFile(file, result);
await writeFile(new URL('engine-sha256.txt', import.meta.url), createHash('sha256').update(result).digest('hex') + '\n');
