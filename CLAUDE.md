# Sightglass (code name)

A phone app that reads a water heater or boiler data plate from a photo. `SPEC.md` is the source
of truth, so read it first. `BUILD-LOG.md` records progress.

## Hard rules

- The repo is public. Never commit API keys, passcodes, real customer info, or photos that show an
  address. Secrets live only in Cloudflare Worker secrets.
- Work spec first: one GitHub issue per branch per PR. Merge only after Chris approves.
- Serial-number date rules are code, not AI. Every rule cites its source in a comment and has a
  test from a real plate.
- Every result shown to the user carries a trust label (read from plate / decoded / AI
  suggestion). Never guess a field. Say "unreadable" instead.
- The front end is plain HTML, CSS and JS with no build step. Keep CSS and JS in files (no inline
  scripts). Bump the service worker cache name on every change that should reach the phone.
- Claude API: model `claude-opus-5-5`, refusal fallback on, and structured JSON output.
- Design for HVAC to be added later. Equipment types and brand rules are data, not hard-coded
  branches.
- After each issue, add an entry to `BUILD-LOG.md` covering what was built, what broke, and what
  was learned.

## Machine

The laptop has 4 GB of RAM. Node 24 is in `~/.local/node/bin`. Keep tooling light.
