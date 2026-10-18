import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import test from 'node:test';
const require = createRequire(import.meta.url);
import { spawnSync } from 'node:child_process';
const query = require('query-string');
const decode = require('decode-uri-component').default;

test('decoder: CJS、plus、whole-component復旧と長さ境界', () => {
  assert.equal(query.parse('a=x+y&b=%E3%81%82').a, 'x y');
  assert.equal(query.parse('a=x+y&b=%E3%81%82').b, 'あ');
  assert.equal(query.parseUrl('https://example.com#x+y', { parseFragmentIdentifier: true }).fragmentIdentifier, 'x y');
  for (const value of ['%25C2%FF', '%C2%25C2', '%E0%A4%A', '%FE%FF', '%']) assert.equal(query.parse('a=' + value).a, decode(value));
  assert.equal(query.parse('a=' + 'x'.repeat(65536) + '%41').a.length, 65537);
  assert.equal(query.parse('a=' + 'x'.repeat(65535) + '%').a.length, 65536);
  assert.throws(() => query.parse('a=' + 'x'.repeat(65536) + '%'), URIError);
  assert.throws(() => query.parseUrl('https://example.com#' + 'x'.repeat(65536) + '%', { parseFragmentIdentifier: true }), URIError);
});

test('decoder: 多数の異なる不正runを時間内に拒否する', () => {
  const source = `const q=require('query-string');const v=Array.from({length:12000},(_,i)=>'%FF'+i.toString(16)+'z').join('');try{q.parse('a='+v);process.exit(2)}catch(e){if(!(e instanceof URIError))throw e}`;
  const result = spawnSync(process.execPath, ['-e', source], { cwd: new URL('../', import.meta.url), timeout: 3000 });
  assert.equal(result.error, undefined);
  assert.equal(result.status, 0, result.stderr?.toString());
});
