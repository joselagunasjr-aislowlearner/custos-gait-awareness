# Privacy Model

## Data minimization contract

The prototype operates on the smallest evidence needed for the demonstration:

- footfall timestamps;
- relative per-footfall energy values;
- simulated motion-event counts;
- simulated room-transition duration;
- sensor and occupant confidence;
- derived aggregate features and provenance.

It does not need speech content, continuous audio, names, addresses, account identifiers, health records, or production Rockwell data.

## Raw-audio lifecycle

1. A user explicitly selects a local audio file or runs the bundled synthetic sample.
2. `AudioContext.decodeAudioData` decodes it in browser memory.
3. A 20 ms RMS energy envelope is computed.
4. Separated candidate peaks become timestamps and relative energies.
5. The audio buffer and file reference leave scope; the file input is cleared.
6. No raw audio is sent to the server or written to browser storage.

The browser payload builder has an explicit field allowlist, and the server request schema is strict. Unexpected fields are rejected.

## Storage behavior

| Surface | Prototype behavior |
|---|---|
| Browser application state | Derived metrics only; cleared on reload |
| `localStorage` | Not used |
| `sessionStorage` | Not used |
| Cookies | Not used |
| Server database | None |
| Server logs | Error class only; credential values are redacted |
| GPT request | Baseline, derived features, confidence, provenance, deterministic state |

## Occupant boundary

The prototype does not perform biometric identification. Seeded data includes an occupant-confidence field solely to demonstrate an exclusion rule: if the occupant is not confirmed by a hypothetical upstream system, the observation is not compared with the personal baseline.

## Threats addressed

| Threat | Control |
|---|---|
| Browser credential exposure | Credential exists only in the server process |
| Raw-audio upload | Client code never places audio bytes in a network payload |
| Accidental raw-data persistence | No storage API use; file input cleared; no database |
| Cross-person baseline contamination | Unknown-occupant exclusion |
| Model fabrication | Strict schema plus value and state grounding |
| Hidden uncertainty | Confidence, missing sensors, and provenance visible in UI |
| Production data crossover | Standalone repository with no Rockwell service integration |

## Out of scope

This prototype has not undergone an external privacy audit, penetration test, accessibility certification, consent study, or field evaluation. Any real-world implementation would require explicit consent design, retention policy, security review, household-context testing, and applicable legal review before collection.
