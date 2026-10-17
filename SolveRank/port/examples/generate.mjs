import { mkdir, writeFile } from 'node:fs/promises';
import { TNoodle } from '../dist/index.js';

const client = new TNoodle({ workers: 1 });
try {
  const batch = await client.generateScrambles({ event: '333', count: 5, extraCount: 2 });
  const options = { competition: 'Torneo local', sheets: [{ batch, round: 'Ronda 1', group: 'Grupo A' }] };
  await mkdir(new URL('../artifacts/', import.meta.url), { recursive: true });
  await writeFile(new URL('../artifacts/scrambles.json', import.meta.url), JSON.stringify(batch, null, 2));
  await writeFile(new URL('../artifacts/scrambles.pdf', import.meta.url), await client.createScrambleSheetsPdf(options));
  await writeFile(new URL('../artifacts/scrambles.zip', import.meta.url), await client.createScrambleArchive(options));
  console.log('Created artifacts/scrambles.json, scrambles.pdf and scrambles.zip.');
} finally {
  await client.close();
}
