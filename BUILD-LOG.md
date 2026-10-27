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
