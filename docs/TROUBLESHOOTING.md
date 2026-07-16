# Troubleshooting

## Port already in use

The development UI expects port 4173 and the local API expects port 8787. Stop the conflicting process, then restart `npm run dev`.

## Live GPT mode is not configured

This is expected for the credential-free judge path. The deterministic offline summary remains active. To test GPT-5.6 locally, copy `.env.example`, supply your own server-only credential, and restart the app. Do not place the credential in any `VITE_` variable or browser file.

## GPT request fails

- Confirm the server process is running.
- Confirm the account has access to `gpt-5.6`.
- Check network access and API account limits.
- Keep the offline summary visible; API failure should never blank the dashboard.

## Included audio sample does not run

- Use a current Chromium, Safari, or Firefox release with Web Audio support.
- Confirm `public/sample-footsteps.wav` exists.
- Regenerate it with `npm run sample:generate`.

## Local recording finds too few footfalls

The demo requires at least four separated energy peaks. Try a 4–10 second recording with distinct steps, limited background sound, and a consistent phone position. The file remains local.

## Production-style server shows no UI

Run `npm run build` before `npm start`, or use `npm run judge`, which performs both steps.
