
import assert from 'node:assert/strict';
import fs from 'node:fs';
import childProcess from 'node:child_process';
import http from 'node:http';
import https from 'node:https';
import net from 'node:net';
import { syncBuiltinESMExports } from 'node:module';
for (const name of ['spawn', 'spawnSync', 'exec', 'execSync', 'execFile', 'execFileSync', 'fork']) {
  childProcess[name] = () => { throw Error('No subprocess permitted'); };
}
for (const transport of [http, https]) {
  transport.request = transport.get = () => { throw Error('No network permitted'); };
}
net.connect = net.createConnection = () => { throw Error('No network permitted'); };
syncBuiltinESMExports();
process.env.PATH = '';
process.env.JAVA_HOME = '';
const { TNoodle } = await import('tnoodle-native');
const client = new TNoodle();
try {
  const batch = await client.generateScrambles({event:'333',count:1,extraCount:1});
  const options = {competition:'Offline',sheets:[{batch}]};
  const pdf = await client.createScrambleSheetsPdf(options);
  const zip = await client.createScrambleArchive(options);
  assert.ok(batch.attempts[0].scrambles[0].svg.startsWith('<svg'));
  assert.equal(pdf.subarray(0,5).toString(),'%PDF-');
  assert.equal(zip.subarray(0,2).toString(),'PK');
  fs.writeFileSync('offline-result.json',JSON.stringify({
    event:batch.event,attempts:batch.attempts.length,pdfBytes:pdf.length,zipBytes:zip.length,javaHome:process.env.JAVA_HOME
  },null,2));
} finally { await client.close(); }
