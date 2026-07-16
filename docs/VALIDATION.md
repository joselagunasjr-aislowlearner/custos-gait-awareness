# Validation Record

Validation date: July 16, 2026.

## Automated checks

Command:

```bash
npm run check
```

Result:

- 7 test files passed
- 23 tests passed
- TypeScript strict compilation passed
- Vite production build passed
- Production bundle generated successfully

Coverage includes feature calculations, baseline construction, sustained-change logic, insufficient data, local peak detection, missing/noisy sensors, unknown occupants, privacy payloads, GPT schemas, evidence grounding, unsupported-conclusion rejection, and public-copy language rules.

## Dependency and security checks

- `npm install`: 0 vulnerabilities
- `npm audit`: 0 vulnerabilities at validation time
- Production licenses: MIT, ISC, Apache-2.0, and BSD-3-Clause only
- No external gait dataset or third-party media included

## Real-browser verification

Browser: current Chromium driven with Playwright CLI.

Verified:

- desktop full-page layout at a wide viewport;
- mobile full-page layout at 390×844;
- semantic headings, buttons, tabs, table, status regions, skip link, and chart labels;
- stable scenario resolves to “Recent gait measures remain near baseline”;
- temporary scenario resolves to “A temporary variation did not persist”;
- sustained scenario resolves to “A sustained gait change is visible”;
- unknown occupant is excluded;
- noisy recent evidence becomes low confidence;
- missing sensors remain visible without invented values;
- included synthetic WAV yields seven locally derived candidate footfalls;
- GPT-unconfigured response preserves the deterministic offline summary;
- no browser console errors after favicon fix;
- no `localStorage` or `sessionStorage` entries after audio analysis.
- Lighthouse accessibility score: **100/100** after contrast and accessible-name fixes.

Artifacts are generated under `output/playwright/` and intentionally ignored by Git. The contest-ready dashboard screenshot is stored in `docs/assets/dashboard.png`.

## Not executed without Jose approval

- paid OpenAI API request;
- public deployment;
- repository publication;
- public YouTube upload;
- Devpost submission.

Those actions are listed in the submission checklist and require explicit approval.
