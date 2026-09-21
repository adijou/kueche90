import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createProject, estimate, parseLength, parseProject, isRasterDataUrl } from '../src/domain';
import { MATERIALS } from '../src/data';

test('Swiss countertop estimates use linear metres, not m²', () => {
  assert.deepEqual(estimate('granite', '4,0'), { min: 1600, max: 4000, length: 4 });
  assert.deepEqual(estimate('ceramic', '2.5'), { min: 1750, max: 3500, length: 2.5 });
  assert.equal(estimate('quartz', ''), null);
  for (const m of MATERIALS) assert.ok(m.max >= m.min && m.min > 0);
});
test('length parser rejects malformed and unreasonable input', () => {
  for (const value of ['', '0', '-1', '31', '1e2', '1,2.3', '1.234', 'Infinity', '2m'])
    assert.equal(parseLength(value), null, value);
  assert.equal(parseLength('0,01'), 0.01);
  assert.equal(parseLength('30'), 30);
});
test('demo project round trips; variant metadata remains independent', () => {
  const p = createProject(true);
  p.color = 'blue';
  assert.equal(p.variants[0].color, 'jade');
  assert.deepEqual(parseProject(JSON.parse(JSON.stringify(p))), p);
});
test('import rejects executable and external image URLs', () => {
  for (const photo of [
    'javascript:alert(1)',
    'https://example.com/image.png',
    'data:image/svg+xml;base64,PHN2Zz4=',
  ]) {
    assert.throws(() => parseProject({ ...createProject(true), photo }));
  }
  assert.equal(isRasterDataUrl('data:text/html;base64,PHNjcmlwdD4='), false);
});
test('import rejects duplicates, unknown selections, missing images and dangling IDs', () => {
  const p = createProject(true);
  for (const patch of [
    { color: 'red' },
    { material: 'gold' },
    { length: '-4' },
    { activeId: 'missing' },
    { variants: [p.variants[0], p.variants[0]] },
    { photo: null },
    { demo: false },
  ])
    assert.throws(() => parseProject({ ...p, ...patch }));
});
test('project import has bounded strings and variants', () => {
  const p = createProject(true);
  assert.throws(() => parseProject({ ...p, title: 'x'.repeat(101) }));
  assert.throws(() => parseProject({ ...p, notes: 'x'.repeat(1001) }));
  assert.throws(() =>
    parseProject({
      ...p,
      variants: Array.from({ length: 7 }, (_, i) => ({ ...p.variants[0], id: `${i}` })),
    }),
  );
});
