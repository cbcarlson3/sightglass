# Handoff

**Goal:** v1 of Sightglass (see `SPEC.md`). Working through the build order, one issue per PR.

**Done (2026-10-27):** issue #1 serial decoder, on branch `issue-1-serial-decoder`.
- `public/js/serial/rules.js` holds brand rules as data with sources. `decode.js` is the engine.
- `test/serial-cases.js` holds the cases, and `npm test` runs them (38 passing).
- Covered: Rheem/Ruud/Richmond, A.O. Smith/State/American/Reliance, Lochinvar, Rinnai.

**Next:**
1. Chris reviews the PR and merges it.
2. Add real plates as Chris collects them: he drops photos in a Google Drive folder
   ("sightglass plates"). Add each as a `from: 'plate'` case (brand, serial, printed date only).
3. Navien: turn on a rule once 2+ real plates (or Navien tech support) confirm one.
4. Issue #2, the app shell.

**Open questions:** Navien date format. Do Lochinvar residential tanks use 13-digit serials
(and which order)? Is the Rheem MMYY format pre-2000?

**Gotchas:** the decoder takes an `equipment` id (see `public/js/equipment.js`), and 13-digit
Lochinvar serials need it to be `boiler`. Tests pin "today" to 2026-10-27 so the future-date
checks stay stable.
