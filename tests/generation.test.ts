import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import {
  buildPrompt,
  handleGeneration,
  parseInput,
  ready,
  type Dependencies,
  type GenerationInput,
} from '../netlify/lib/generation';

const photo = `data:image/webp;base64,${(await readFile(new URL('../public/images/room.webp', import.meta.url))).toString('base64')}`;
const input: GenerationInput = {
  photo,
  color: 'jade',
  material: 'granite',
  notes: 'Offene Regale',
  consent: true,
};
const defaults: Dependencies = {
  enabled: true,
  configured: true,
  allowedEmails: 'team@example.com',
  getUser: async () => ({ id: '1', email: 'team@example.com', confirmedAt: '2026-01-01' }),
  render: async () => photo,
};
function request(body: unknown = input, headers: Record<string, string> = {}, method = 'POST') {
  return new Request('https://pilot.example/api/generate', {
    method,
    headers: { origin: 'https://pilot.example', 'content-type': 'application/json', ...headers },
    ...(method !== 'GET' ? { body: JSON.stringify(body) } : {}),
  });
}
test('generation fails closed when any configuration gate is missing', async () => {
  for (const patch of [{ enabled: false }, { configured: false }, { allowedEmails: '' }]) {
    let called = false;
    const deps = {
      ...defaults,
      ...patch,
      render: async () => {
        called = true;
        return photo;
      },
    };
    assert.equal(ready(deps), false);
    assert.equal((await handleGeneration(request(), deps)).status, 503);
    assert.equal(called, false);
  }
});
test('method, origin and content type are enforced before model calls', async () => {
  assert.equal((await handleGeneration(request(null, {}, 'GET'), defaults)).status, 405);
  assert.equal(
    (await handleGeneration(request(input, { origin: 'https://attacker.example' }), defaults))
      .status,
    403,
  );
  assert.equal((await handleGeneration(request(input, { origin: '' }), defaults)).status, 403);
  assert.equal(
    (await handleGeneration(request(input, { 'content-type': 'text/plain' }), defaults)).status,
    415,
  );
});
test('verified allowlisted identity is required', async () => {
  assert.equal(
    (await handleGeneration(request(), { ...defaults, getUser: async () => null })).status,
    401,
  );
  for (const user of [
    { id: '1', email: 'team@example.com' },
    { id: '2', email: 'other@example.com', confirmedAt: 'yes' },
  ])
    assert.equal(
      (await handleGeneration(request(), { ...defaults, getUser: async () => user })).status,
      403,
    );
  assert.equal(
    (
      await handleGeneration(request(), {
        ...defaults,
        getUser: async () => {
          throw new Error('secret');
        },
      })
    ).status,
    401,
  );
});
test('request requires explicit consent, known selections, bounded notes and valid raster signature', async () => {
  for (const patch of [
    { consent: false },
    { photo: 'https://example.com/x' },
    { photo: 'data:image/jpeg;base64,YWJj' },
    { color: 'red' },
    { material: 'none' },
    { notes: 'x'.repeat(1001) },
  ]) {
    assert.equal(parseInput({ ...input, ...patch }), null);
    assert.equal((await handleGeneration(request({ ...input, ...patch }), defaults)).status, 400);
  }
});
test('oversized bodies and content length rejected', async () => {
  assert.equal(
    (await handleGeneration(request(input, { 'content-length': '4000000' }), defaults)).status,
    413,
  );
  assert.equal(
    (await handleGeneration(request({ photo: 'x'.repeat(3_100_001) }), defaults)).status,
    413,
  );
});
test('successful generation returns only validated image and model with no-store', async () => {
  const result = await handleGeneration(request(), defaults);
  assert.equal(result.status, 200);
  assert.equal(result.headers.get('cache-control'), 'no-store');
  assert.equal((await result.json()).image, photo);
});
test('no-image and upstream failures do not leak secrets or trigger retries', async () => {
  assert.equal(
    (await handleGeneration(request(), { ...defaults, render: async () => '' })).status,
    422,
  );
  for (const [error, expected] of [
    [{ status: 429 }, 429],
    [{ name: 'TimeoutError' }, 504],
    [new Error('GEMINI_API_KEY=secret'), 502],
  ] as const) {
    let calls = 0;
    const r = await handleGeneration(request(), {
      ...defaults,
      render: async () => {
        calls++;
        throw error;
      },
    });
    assert.equal(r.status, expected);
    assert.equal(calls, 1);
    assert.ok(!(await r.text()).includes('secret'));
  }
});
test('prompt uses photograph as reference and explicitly forbids dimensions', () => {
  const p = buildPrompt(input);
  assert.match(p, /preserve its viewpoint/);
  assert.match(p, /do NOT draw dimensions/);
  assert.match(p, /natural grey granite/);
  assert.match(p, /optional aesthetic preference/);
});
