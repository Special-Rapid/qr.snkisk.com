import { createHash } from 'node:crypto';
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, resolve, sep } from 'node:path';

type Replacement = { from: string; to: string; count: number };
type PatchFile = { file: string; before: string; after: string; replacements: Replacement[] };
type Manifest = { package: string; version: string; requires?: Record<string, string>; files: PatchFile[] };

const require = createRequire(import.meta.url);
const folder = new URL('./security-patches/', import.meta.url);
const manifests = readdirSync(folder).filter(name => name.endsWith('.json')).sort();
if (manifests.length === 0) throw new Error('依存互換patchのmanifestがありません。');
const digest = (source: string) => createHash('sha256').update(source).digest('hex');
const changes: { path: string; source: string }[] = [];

// 全対象を検査してから書く。未知の依存が一つでもあれば部分適用しない。
for (const name of manifests) {
  const manifest = JSON.parse(readFileSync(new URL(name, folder), 'utf8')) as Manifest;
  const packagePath = require.resolve(`${manifest.package}/package.json`);
  const root = dirname(packagePath);
  const actual = JSON.parse(readFileSync(packagePath, 'utf8')) as { version: string };
  if (actual.version !== manifest.version) throw new Error(`${manifest.package}: patch対象versionが変わりました。`);
  for (const [dependency, version] of Object.entries(manifest.requires ?? {})) {
    const entry = createRequire(packagePath).resolve(dependency);
    const installed = JSON.parse(readFileSync(resolve(dirname(entry), 'package.json'), 'utf8')) as { version: string };
    if (installed.version !== version) throw new Error(`${dependency}: 互換性を確認したversionではありません。`);
  }
  for (const file of manifest.files) {
    const path = resolve(root, file.file);
    if (!path.startsWith(root + sep)) throw new Error('patch対象はpackage内のfileに限定します。');
    const source = readFileSync(path, 'utf8');
    const hash = digest(source);
    if (hash === file.after) continue;
    if (hash !== file.before) throw new Error(`${manifest.package}/${file.file}: 未確認のsourceへpatchを適用しません。`);
    let updated = source;
    for (const replacement of file.replacements) {
      if (updated.split(replacement.from).length - 1 !== replacement.count) throw new Error('patch適用位置が一致しません。');
      updated = updated.replaceAll(replacement.from, replacement.to);
    }
    if (digest(updated) !== file.after) throw new Error('patch後のsource hashが一致しません。');
    changes.push({ path, source: updated });
  }
}
for (const change of changes) writeFileSync(change.path, change.source);
console.log(`依存互換patch ${manifests.length}件を確認しました。`);
