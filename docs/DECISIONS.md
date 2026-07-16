# Decision Log

## July 16, 2026 — Product boundary

**Jose:** Build a non-medical gait-change awareness prototype for older adults, connected only as a future research direction for Custos Hub by Rockwell.

**Codex execution:** Enforced that boundary in UI copy, deterministic logic, GPT instructions, output validation, tests, and documentation.

## July 16, 2026 — Privacy boundary

**Jose:** Process raw audio locally, never upload or persist it, and retain only needed derived features.

**Codex execution:** Implemented browser-only decoding, an explicit derived-field network allowlist, strict server schemas, zero browser storage, and privacy tests.

## July 16, 2026 — Architecture

**Codex recommendation:** Use a small React/TypeScript app and Express API boundary rather than production Rockwell services. This reduces contest risk, keeps credentials server-side, supports an offline judge path, and preserves standalone provenance.

**Reversible choice:** The deterministic domain functions have no React or Express dependency and can be moved into a future service if the research direction is approved.

## July 16, 2026 — Evidence model

**Codex recommendation:** Use five observations for the demo baseline and require three aligned recent observations for sustained change. These are transparent prototype heuristics, not validated thresholds.

## July 16, 2026 — GPT role

**Codex recommendation:** Keep classification deterministic and use GPT-5.6 for evidence-grounded longitudinal interpretation, uncertainty explanation, and concise safety-consultation wording. Reject any GPT response that changes state or values.

This makes GPT meaningful without allowing it to invent measurements or determine the core state.

## July 16, 2026 — Judge reliability

**Codex recommendation:** Make every primary scenario and local-audio demonstration run without a credential. Live GPT is additive and clearly labeled; API failure falls back without hiding evidence.

## Authority held by Jose

Jose retains approval authority for any public deployment, repository publication, video upload, Devpost submission, paid API use, production access, real-person data, or material expansion of claims.
