# Dependency compatibility patches

<a id="依存互換patch"></a>

Manifests manage limited dependency fixes while retaining SDK57. `postinstall` applies a patch only when its target version, before/after SHA256 hashes, and replacement locations all match. A known already-patched hash permits rerunning; unknown contents fail installation. No files are rewritten until all targets have been checked.

See each manifest's `description` for its target and intended limits, and the corresponding `test/*.test.mts` for regression coverage. When updating dependencies, reassess whether patches are needed and check public API and Metro compatibility. Installation with `--ignore-scripts` alone completes neither these fixes nor asset preparation.

Treat runtime validation of local backports separately from version advisories used by Dependabot. Do not spoof versions or suppress alerts and call them resolved. These patches do not complete distribution, production adoption, or remaining release acceptance.
