# Build log

What was built, what broke, and what I learned, one entry per step.

## 2026-10-24: Idea and spec

- **Workflow:** spec first. Claude interviewed me in rounds of multiple-choice questions, then
  wrote `SPEC.md`.
- **Decided:** water heaters and boilers first (HVAC later), exact serial dating for Rheem,
  A.O. Smith, Rinnai and Navien, AI suggestions labeled "verify", history on the phone, offline
  queue, Cloudflare hosting, and a public repo.
- **Learned:** the AI key can't live in a phone app, so it needs a small server (a Cloudflare
  Worker). AI can be confidently wrong, so the important facts (age) come from real rules, not AI.

## 2026-10-27: Serial decoder (issue #1)

- **Built:** `public/js/serial/rules.js` (each brand's date code as data, each rule citing the
  manufacturer document) and `decode.js` (one engine that reads any rule). There are 38 tests
  (`npm test`, no installs), written before the decoder.
- **Sources:** Rheem bulletin 1207, the A.O. Smith 2024 service guide, the Lochinvar warranty
  sheet (Rev 18) and the Rinnai service manual. Blogs disagreed with each other, so only
  manufacturer documents were used.
- **What broke:** Lochinvar's own sheet contradicts itself (two different month tables for E and
  F, and an example that doesn't match its rule). The decoder shows only the year for those
  letters. Navien publishes no date code at all, so Navien answers "unknown" until real plates
  confirm a rule.
- **Learned:** the same 13-digit serial reads year-first at A.O. Smith but week-first on
  Lochinvar boilers, so the equipment type matters. When it's missing, the answer is "unknown".
  Checking for impossible dates (week 60, a year in the future) catches many bad reads.

## 2026-10-27: App shell (issue #2)

- **Built:** the phone app's home screen ("Take photo" / "Choose from photos", with the big
  buttons at the bottom where a thumb reaches) and a results screen that runs on sample data.
  Every value carries a trust label, and the age comes from the real decoder. It also has a
  manifest, icons and a service worker, so it installs to the home screen and opens offline.
- **Photos:** each one is shrunk to 1568 px on the long edge (the size Claude reads best) and
  re-saved, which drops the EXIF and GPS data. A second pass then strips any metadata left in
  the file bytes. In Chrome, a 4000×3000 test photo with fake GPS came out at 1568×1176 with the
  GPS gone.
- **What broke:** "Unreadable" showed twice (once as the value, once as the label). Port 8080 was
  already taken on the PC, so the local server takes a `PORT` setting.
- **Learned:** no image library was installed, so the icons are drawn pixel by pixel in a small
  Node script. A test checks that the service worker caches every app file, so a new file can't
  be forgotten and break offline mode.

## 2026-10-27: Final look and logo (issue #2, same PR)

- **Built:** Chris picked a direction after three rounds of mockups (6 designs, then a final).
  The app now uses the "soft steel" colors, a clearer home screen ("Take a photo of the tag."
  plus three short steps), and a results screen with an age gauge and spec tiles. The new logo
  is a bolted sight glass with a gas flame behind the glass. It's an SVG for the app header and
  is redrawn as PNG icons by the same Node script.
- **What broke:** nothing major. The icon script had to learn curves, so the flame's outline is
  turned into a list of points and each pixel is tested against it.
- **Learned:** mocking up several options side by side made the design calls quick. The labels
  now say "tag" instead of "plate", because that's the word techs use.
## 2026-10-27: Navien dates (issue #12)

- **Built:** Navien was the one brand the app couldn't date, because Navien doesn't publish its
  serial format. A 2018 government recall notice (CPSC 19-057) explains it: after a 4-digit
  product code and a letter come the year, a one-character month (X = October) and the day.
  Older Navien serials have the full date between dashes. Chris found five real Navien tags
  online, and all five decode to years that match when those models were sold.
- **What broke:** two of my made-up test serials were a digit short, so they failed for the
  wrong reason. Caught by the tests.
- **Learned:** when a maker doesn't publish its code, recall notices can, because they have to
  tell owners which serials are affected. Months Y and Z (Nov, Dec) aren't confirmed yet, so
  those show the year only instead of guessing.
## 2026-10-27: Type in a serial (issue #14)

- **Built:** a "Type in serial number" button on the home screen, for when the camera won't
  work. Pick the brand, type the serial, optionally pick the type of unit, and get the age
  gauge. The brand list comes straight from the decoder's rules, so a new brand shows up on its
  own. Typed values get their own trust label, "Typed in", so they're never shown as read from
  a tag, and nothing else (specs, codes, parts) is filled in without a photo.
- **Also:** three real Rinnai tags joined the tests (issue #12). One prints "May 2008" next to
  its serial, which confirms the Rinnai rule.
- **Learned:** keeping the brand list as data paid off: the form needed no brand-specific code.