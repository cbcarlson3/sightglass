# Handoff

**Goal:** v1 of Sightglass (see `SPEC.md`). Working through the build order, one issue per PR.

**Done:**
- Issue #1 serial decoder, merged (PR #10). Rules in `public/js/serial/rules.js`.
- Issue #2 app shell, merged (PR #11). Final design (soft steel colors, Manrope font, age gauge)
  and the flame sight-glass logo (`icons/logo.svg`, PNGs from `npm run icons`). Cache
  `sightglass-v3`. Mockups: claude.ai artifact 9ggpCfbeNZkEEQVM4PHKno ("Final" row).
- Issue #12 Navien dates, on branch `issue-12-navien` (PR open, waiting for Chris). Rule from
  CPSC recall 19-057 plus building-center.org; 5 real tags from Drive "sightglass plates" are
  test cases, plus 3 real Rinnai tags (one prints "May 2008", confirming the rule). PR #13.
- Issue #14 type-in serial, on branch `issue-14-manual-serial` (built on #12, PR #15). Home
  button, form (`js/manual.js`), "Typed in" trust label. Cache `sightglass-v5`. 65 tests pass.

**Next:**
1. Chris tests, then merge PR #13 first, then PR #15.
2. Issue #3, the Worker `/api/scan` with a mock Claude response first.
3. More real tags in Drive "sightglass plates" (Rinnai next). Add each as a `from: 'plate'` case
   in `test/serial-cases.js` (brand, serial, date only, never the photo).

**Open questions:** Navien Y/Z months (Nov/Dec) are unconfirmed, so they show the year only; a
tag with a known Nov/Dec date would settle it. Do Lochinvar residential tanks use 13-digit
serials? Final app name.

**Gotchas:**
- Run locally: on the PC `$env:PORT='8090'; npm start` (8080 is taken), on the laptop `npm start`.
- The service worker is cache-first. Bump `CACHE` in `sw.js` for changes, or unregister it in
  DevTools while working.
- Add any new file in `public/` to `SHELL` in `sw.js`, or a test fails.
- PowerShell 5.1: use `gh ... --body-file` and `git commit -F <file>`; inline multi-line text breaks.
