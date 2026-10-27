# Handoff

**Goal:** v1 of Sightglass (see `SPEC.md`). Working through the build order, one issue per PR.

**Done:**
- Issue #1 serial decoder, merged (PR #10). Rules in `public/js/serial/rules.js`.
- Issue #2 app shell, on branch `issue-2-app-shell` (PR open, waiting for Chris to approve).
  Home and results screens, photo shrink plus EXIF/GPS strip, trust labels, PWA (manifest,
  icons, `sw.js`). Final design and flame logo applied (`icons/logo.svg`, cache `sightglass-v3`).
  49 tests pass (`npm test`). Tested in Chrome on the PC. Mockups: claude.ai artifact
  9ggpCfbeNZkEEQVM4PHKno (the "Final" row is what was built).

**Next:**
1. Chris looks at the app and approves the PR.
2. Issue #3, the Worker `/api/scan` with a mock Claude response first.
3. Real plates: Chris is collecting photos in the Google Drive folder "sightglass plates"
   (Navien and Rinnai tags from online this week). Add each as a `from: 'plate'` case in
   `test/serial-cases.js` (brand, serial, printed date only, never the photo).

**Open questions:** the Navien date format. Do Lochinvar residential tanks use 13-digit serials?
Final app name.

**Gotchas:**
- Run locally: on the PC `$env:PORT='8090'; npm start` (8080 is taken), on the laptop `npm start`.
- The service worker is cache-first. Bump `CACHE` in `sw.js` for changes, or unregister it in
  DevTools while working.
- Add any new file in `public/` to `SHELL` in `sw.js`, or a test fails.
- Icons come from `npm run icons` (`scripts/make-icons.js`).
