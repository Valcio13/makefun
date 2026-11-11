import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { createServer } from 'node:http';
import { once } from 'node:events';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ids = Array.from({ length: 25 }, (_, i) => `p${String(i + 1).padStart(2, '0')}`);
let received;
const server = createServer(async (req, res) => {
  if (req.method === 'GET' && req.url === '/photos') {
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify({ photos: ids.map((id) => ({ id, url: `/photos/${id}.jpg`, answered: false })) }));
    return;
  }
  if (req.method === 'GET' && req.url?.endsWith('.jpg')) {
    res.setHeader('content-type', 'image/jpeg');
    res.end(Buffer.from([0xff, 0xd8, 0xff, 0xd9]));
    return;
  }
  if (req.method === 'POST' && req.url === '/answers') {
    let body = '';
    for await (const chunk of req) body += chunk;
    received = JSON.parse(body).answers;
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify({ accepted: received.map((a) => a.id), answered: received.length, left: 0 }));
    return;
  }
  res.writeHead(404).end();
});
server.listen(0, '127.0.0.1');
await once(server, 'listening');
const { port } = server.address();
const child = spawn(process.execPath, [path.join(root, 'main.ts')], {
  cwd: root,
  env: { ...process.env, MAKEFUN_ENV_URL: `http://127.0.0.1:${port}` },
  stdio: ['ignore', 'pipe', 'pipe'],
});
let stdout = '';
let stderr = '';
child.stdout.setEncoding('utf8').on('data', (chunk) => { stdout += chunk; });
child.stderr.setEncoding('utf8').on('data', (chunk) => { stderr += chunk; });
const [code] = await once(child, 'exit');
server.close();
assert.equal(code, 0, `agent exited ${code}: ${stderr}`);
assert.equal(received?.length, 25, 'agent should submit all 25 photos');
assert.deepEqual(received.map((a) => a.id), ids, 'answers should preserve photo order');
for (const answer of received) {
  assert.ok(Number.isFinite(answer.lat) && answer.lat >= -90 && answer.lat <= 90, `${answer.id} latitude out of range`);
  assert.ok(Number.isFinite(answer.lon) && answer.lon >= -180 && answer.lon <= 180, `${answer.id} longitude out of range`);
}
assert.match(stdout, /Submitted 25 of 25 photos/);
console.log('PASS: submits 25 valid, ordered coordinates without model credentials');
