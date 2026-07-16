# Devpost Project Description Draft

## Project name

Custos Gait Awareness

## Category

Apps for Your Life

## Tagline

Privacy-preserving gait-change awareness built around a person’s own baseline.

## Inspiration

Meaningful changes in daily movement may happen between scheduled human check-ins, but placing cameras or sending continuous household audio to the cloud creates an unacceptable privacy tradeoff. As a firefighter/paramedic and founder of Rockwell Home Management, Jose wanted to explore a narrower question: can ambient evidence become useful measurements before it leaves the room?

Custos Gait Awareness is a research prototype connected to a future direction for Custos Hub by Rockwell. It focuses on gait-change and activity awareness for older adults aging in place, while keeping interpretation human-centered and explicitly non-medical.

## What it does

The app combines synthetic or locally derived footstep evidence with simulated motion and room-transition events. It derives cadence, step-interval variability, relative impact-energy distribution, transition duration, and sensor confidence.

Five observations establish an individual baseline. New observations are compared with that baseline, allowing the app to distinguish:

- a stable personal pattern;
- one temporary variation that does not persist;
- a sustained change across three consecutive observations;
- insufficient, noisy, missing-sensor, or unknown-occupant evidence.

The accessible dashboard shows the baseline band, trend, confidence, contributing sensors, provenance, privacy state, and a concise safety-consultation summary. Three seeded stories and an included synthetic audio sample run instantly with no account, hardware, or external dataset.

## How GPT-5.6 is used

GPT-5.6 interprets the structured longitudinal evidence after deterministic feature calculation and classification. Through strict Responses API structured output, it explains which measurements changed, identifies uncertainty, and suggests a concise human follow-up step.

GPT does not receive raw audio and does not choose or alter the deterministic awareness state. A grounding gate rejects any response that changes numeric evidence, cites unavailable measurements, changes the state, or introduces unsupported health conclusions. If the API is unavailable, the complete deterministic demo remains usable offline.

## How we built it

- React 19, TypeScript, and Vite for the accessible browser experience
- Web Audio API for local energy-envelope footfall extraction
- Deterministic feature, baseline, and sustained-change modules
- Express and the OpenAI JavaScript SDK for the server-only GPT-5.6 boundary
- Zod for input and output validation
- Vitest for deterministic domain, privacy, and grounding tests
- Codex for research, implementation, debugging, testing, browser verification, documentation, and submission packaging

## Privacy by architecture

Raw audio is decoded in browser memory, reduced to candidate footfall timestamps and relative energy, and released. It is never uploaded or persisted. The app uses no cookies or browser storage and contains no PII, production Rockwell data, or production integrations.

## Challenges

The hardest design problem was making GPT meaningful without letting it invent the core conclusion. We solved that by separating deterministic measurement and state classification from language interpretation, then validating the model’s structured evidence against the exact supplied values.

The second challenge was making uncertainty visible. Missing sensors, noisy evidence, unknown occupants, API failure, and insufficient data each produce an explicit state rather than a silent guess.

## Accomplishments

- A complete, coherent product experience rather than a chart-only proof of concept
- Three instant longitudinal stories that demonstrate stable, isolated, and sustained behavior
- Local audio derivation with no raw-data upload or retention
- Evidence-grounded GPT-5.6 structured output with rejection guardrails
- Deterministic tests across calculations, privacy behavior, edge cases, and output validation
- Fully documented architecture, limitations, research basis, licenses, and contest provenance

## What we learned

Privacy is strongest when it is a data-flow constraint, not a promise added after implementation. We also learned that a language model is most trustworthy in this experience when it explains bounded evidence while deterministic code owns measurements and state transitions.

## What’s next

Any next phase would require consent design, sensor and household-context research, real-world protocol review, security work, and independent evaluation before using real-person data. If Rockwell later explores this direction, the human entry point would remain a $150 Home Safety and Readiness Audit and a safety consultation about whether Custos Hub by Rockwell is appropriate.

No live gait-awareness capability or field result is claimed today.

## Built with

Codex, GPT-5.6, OpenAI Responses API, React, TypeScript, Vite, Express, Zod, Vitest, Web Audio API
