import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import test from 'node:test';
const require = createRequire(import.meta.url);
import { generateKeyPairSync, privateEncrypt, constants } from 'node:crypto';
const forge = require('node-forge');

test('forge: DigestAlgorithm構造を検証し、正常署名を維持する', () => {
  const pair = generateKeyPairSync('rsa', { modulusLength: 2048, publicExponent: 3 });
  const publicKey = forge.pki.publicKeyFromPem(pair.publicKey.export({ type: 'spki', format: 'pem' }));
  const a = forge.asn1;
  const node = (tag: number, value: unknown, constructed = false) => a.create(a.Class.UNIVERSAL, tag, constructed, value);
  const oid = node(a.Type.OID, a.oidToDer(forge.oids.sha256).getBytes());
  const nil = () => node(a.Type.NULL, '');
  const md = forge.md.sha256.create().update('boundary');
  const digest = md.digest().getBytes();
  const verify = (algorithm: unknown[], extra: unknown[] = []) => {
    const info = node(a.Type.SEQUENCE, [node(a.Type.SEQUENCE, algorithm, true), node(a.Type.OCTETSTRING, digest), ...extra], true);
    const signature = privateEncrypt({ key: pair.privateKey, padding: constants.RSA_PKCS1_PADDING }, Buffer.from(a.toDer(info).getBytes(), 'binary'));
    return publicKey.verify(digest, signature.toString('binary'));
  };
  assert.equal(verify([oid, nil()]), true);
  assert.equal(verify([oid]), true);
  assert.throws(() => verify([oid, nil(), nil()]), /DigestInfo/);
  assert.throws(() => verify([oid, node(a.Type.OID, a.oidToDer(forge.oids.sha1).getBytes())]), /DigestInfo/);
  assert.throws(() => verify([oid, node(a.Type.NULL, 'garbage')]), /DigestInfo/);
  assert.throws(() => verify([oid, nil()], [nil()]), /DigestInfo/);
  const key = forge.pki.privateKeyFromPem(pair.privateKey.export({ type: 'pkcs1', format: 'pem' }));
  const md5 = forge.md.md5.create().update('boundary');
  assert.equal(publicKey.verify(md5.digest().getBytes(), key.sign(md5)), true);
  const pss = forge.pss.create({ md: forge.md.sha256.create(), mgf: forge.mgf.mgf1.create(forge.md.sha256.create()), saltLength: 20 });
  assert.equal(publicKey.verify(digest, key.sign(md, pss), pss), true);
});
