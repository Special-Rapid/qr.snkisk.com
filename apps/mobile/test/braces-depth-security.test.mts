import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import test from 'node:test';
const require = createRequire(import.meta.url);
const braces = require('braces');

test('braces: 通常結果、深度128と129、未閉鎖・混合nest', () => {
  assert.deepEqual(braces.expand('a{b,c}{1..2}'), ['ab1', 'ab2', 'ac1', 'ac2']);
  assert.equal(braces.compile('a{b,c}'), 'a(b|c)');
  for (const depth of [127, 128]) assert.doesNotThrow(() => braces.compile('{'.repeat(depth) + 'a' + '}'.repeat(depth)));
  for (const pattern of ['{'.repeat(129) + 'a' + '}'.repeat(129), '('.repeat(129) + 'a', '{('.repeat(65) + 'a']) {
    for (const options of [{}, { expand: true, rangeLimit: false }, { escapeInvalid: true }]) assert.throws(() => braces(pattern, options), /maximum depth/);
  }
});

test('braces: 直接AST、深い共有参照、child cycleを処理前に拒否する', () => {
  const make = (depth: number, end: object = { type: 'text', value: 'a' }) => {
    let result: object = end;
    for (let i = 0; i < depth; i++) result = { type: 'brace', nodes: [result] };
    return { type: 'root', nodes: [result] };
  };
  for (const method of ['compile', 'stringify', 'expand']) {
    assert.doesNotThrow(() => braces[method](make(128)));
    const ast = make(129);
    const before = JSON.stringify(ast);
    assert.throws(() => braces[method](ast), /maximum depth/);
    assert.equal(JSON.stringify(ast), before);
    const shared = { type: 'brace', nodes: [{ type: 'text', value: 'a' }] };
    const dag = make(128, shared);
    dag.nodes.push(shared);
    assert.throws(() => braces[method](dag), /maximum depth/);
    const cycle: { type: string; nodes: object[] } = { type: 'root', nodes: [] };
    cycle.nodes.push(cycle);
    assert.throws(() => braces[method](cycle), /maximum depth/);
  }
});
