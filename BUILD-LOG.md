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
