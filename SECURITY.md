# Security

## Supported status

Custos Gait Awareness is a time-bounded research prototype, not a production service. Report security concerns privately to the repository owner before any public disclosure.

## Security properties

- OpenAI credentials remain server-side.
- `.env` files are ignored by Git.
- Raw audio is handled only in browser memory.
- GPT requests use an explicit derived-field allowlist.
- Server input and model output use strict schemas.
- Model evidence is checked against the exact baseline and latest observation.
- HTTP responses disable the Express signature; GPT responses use `no-store`.
- There is no auth, database, PII, production service, or public deployment in the repository.

## Before any deployment

Add deployment-specific security headers, rate limiting, origin policy, request logging policy, dependency scanning, abuse controls, and a formal privacy/security review. Do not accept real-person data until consent, retention, deletion, incident-response, and legal requirements are defined.
