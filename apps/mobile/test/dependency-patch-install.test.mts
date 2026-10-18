import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import test from 'node:test';
const require = createRequire(import.meta.url);
import { spawnSync } from 'node:child_process';

test('patch適用: 再実行を許可し未知sourceでは全対象を変更しない', async () => {
  const { mkdtempSync, mkdirSync, readFileSync, readdirSync, writeFileSync, copyFileSync, rmSync } = await import('node:fs');
  const { tmpdir } = await import('node:os');
  const { join, dirname } = await import('node:path');
  const temp = mkdtempSync(join(tmpdir(), 'dependency-patch-'));
  try {
    const scripts = join(temp, 'scripts');
    mkdirSync(join(scripts, 'security-patches'), { recursive: true });
    copyFileSync(new URL('../scripts/patch-dependency-security.mts', import.meta.url), join(scripts, 'patch-dependency-security.mts'));
    const files: string[] = [];
    for (const name of readdirSync(new URL('../scripts/security-patches/', import.meta.url)).filter(name => name.endsWith('.json'))) {
      const source = readFileSync(new URL('../scripts/security-patches/' + name, import.meta.url), 'utf8');
      const manifest = JSON.parse(source) as { package: string; version: string; files: { file: string; replacements: { from: string; to: string }[] }[] };
      writeFileSync(join(scripts, 'security-patches', name), source);
      const packageRoot = join(temp, 'node_modules', manifest.package);
      mkdirSync(packageRoot, { recursive: true });
      writeFileSync(join(packageRoot, 'package.json'), JSON.stringify({ version: manifest.version }));
      for (const file of manifest.files) {
        const actual = join(dirname(require.resolve(manifest.package + '/package.json')), file.file);
        let original = readFileSync(actual, 'utf8');
        for (const replacement of [...file.replacements].reverse()) original = original.replaceAll(replacement.to, replacement.from);
        const target = join(packageRoot, file.file);
        mkdirSync(dirname(target), { recursive: true });
        writeFileSync(target, original);
        files.push(target);
      }
    }
    const decoder = join(temp, 'node_modules', 'decode-uri-component');
    mkdirSync(decoder, { recursive: true });
    writeFileSync(join(decoder, 'package.json'), JSON.stringify({ version: '0.5.0', main: 'index.js' }));
    writeFileSync(join(decoder, 'index.js'), '');
    const run = () => spawnSync(process.execPath, [join(scripts, 'patch-dependency-security.mts')], { cwd: temp });
    assert.equal(run().status, 0);
    const patched = files.map(file => readFileSync(file, 'utf8'));
    assert.equal(run().status, 0);
    assert.deepEqual(files.map(file => readFileSync(file, 'utf8')), patched);
    writeFileSync(files[files.length - 1], 'unknown upstream source');
    const before = files.map(file => readFileSync(file, 'utf8'));
    assert.notEqual(run().status, 0);
    assert.deepEqual(files.map(file => readFileSync(file, 'utf8')), before);
    writeFileSync(join(decoder, 'package.json'), JSON.stringify({ version: '0.4.2', main: 'index.js' }));
    assert.notEqual(run().status, 0);
    assert.deepEqual(files.map(file => readFileSync(file, 'utf8')), before);
  } finally { rmSync(temp, { recursive: true, force: true }); }
});
