# Demo Video Shot List and Narration

Target length: **2:40–2:50**. Requirement: public YouTube, under three minutes, English voiceover, working demo, and explicit Codex and GPT-5.6 coverage.

## 0:00–0:18 — Problem and boundary

**On screen:** Hero, research-prototype label, privacy badge.

**Narration:**

“Custos Gait Awareness explores a future direction for Custos Hub by Rockwell: could privacy-preserving ambient sensors notice a sustained change from an older adult’s own gait baseline? This is gait-change activity awareness for human follow-up, not a medical conclusion.”

## 0:18–0:42 — Stable baseline

**On screen:** Click Stable. Point to baseline band, measures, provenance labels.

**Narration:**

“Five synthetic observations establish the individual baseline. Footstep timing derives cadence and timing variability, relative impact energy describes the sound distribution, and simulated room transitions add context. Every value is labeled synthetic, simulated, measured, or derived.”

## 0:42–1:04 — Temporary variation

**On screen:** Click Temporary. Show the unusual middle point and the returned final point.

**Narration:**

“One unusual walk is not enough. The prototype retains this temporary variation, but the following observation returns to the personal range, so it does not become a sustained change.”

## 1:04–1:34 — Sustained change

**On screen:** Click Sustained. Switch chart tabs. Show four evidence rows and follow-up card.

**Narration:**

“Here, three consecutive observations shift together. Cadence is lower, timing variability is higher, relative impact energy changes, and room-transition duration increases. The deterministic engine calls this a sustained gait change and suggests a safety consultation to review context.”

## 1:34–1:55 — Privacy and local audio

**On screen:** Scroll to privacy model. Click Run included sample. Show seven candidate steps and no raw retention.

**Narration:**

“Audio is decoded and reduced to timestamps and relative energy entirely in the browser. Raw audio is never uploaded or saved. The included synthetic sample proves the local path without hardware or an external dataset.”

## 1:55–2:18 — GPT-5.6

**On screen:** Return to sustained result. Click Interpret with GPT-5.6 in a locally configured run. Briefly show `server/index.ts` model and schema if helpful.

**Narration:**

“GPT-5.6 receives only validated structured evidence through the Responses API. It explains which measurements changed, states uncertainty, and produces a concise follow-up summary. A second guardrail rejects altered numbers, a changed state, or unsupported health conclusions. If the API fails, the evidence dashboard stays fully usable offline.”

## 2:18–2:40 — Codex collaboration

**On screen:** Brief Codex task view, test terminal, README decision section, Git log.

**Narration:**

“I set the product, privacy, and claim boundaries. During the submission period, Codex researched the official rules and gait-measurement basis, built the architecture and accessible dashboard, implemented the tests and GPT grounding gates, and drove real-browser verification. The repository documents those decisions and the dated work.”

## 2:40–2:48 — Close

**On screen:** Return to hero or sustained summary.

**Narration:**

“Custos Gait Awareness: notice the pattern, respect the person.”

## Recording notes

- Record at 1440×900 or 1920×1080 with browser zoom at 100%.
- Use only the project UI, Codex interface, and terminal; do not add copyrighted music or third-party marks.
- Show a successful live GPT-5.6 result before recording. Do not record a credential or `.env` file.
- Keep the final upload public on YouTube only after Jose approves publication.
