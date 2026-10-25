# Sightglass: spec (v1)

*Code name. The final name will be picked later.*

## What it is

A phone web app for a plumbing service tech. You take a photo of the data plate on a water heater
or boiler, and the app shows you:

1. **Age and specs:** brand, model, serial, manufacture date, fuel type, BTU input, gallons,
   voltage, and recovery rate.
2. **Error codes and fixes:** common fault codes for that model and the usual troubleshooting
   steps.
3. **Parts list:** common replacement parts for that model, with part numbers.

## Who it's for

Chris (a service tech) for now. Coworkers can come later. The public GitHub repo is also a
portfolio piece, so the code, the spec, the issues and the build log are all meant to be read.

## What's in v1

- **Equipment:** tank and tankless water heaters, plus boilers.
- **Exact serial-number dating** (rules in code, not AI) for:
  - Rheem / Ruud / Richmond
  - A.O. Smith / State / American / Lochinvar
  - Rinnai (tankless and combi)
  - Navien (tankless and combi)
- **Boilers:** Navien and Rinnai combis plus Lochinvar and Viessmann first. The AI handles any
  other brand.
- **Trust labels:** each result shows where it came from.
  - ✅ **Read from plate:** text the AI read straight off the photo.
  - ✅ **Decoded:** worked out by our own serial rules, so it's exact.
  - ⚠️ **AI suggestion, verify with the manual:** error codes, fixes and parts.
  - If the AI can't read a field, it says "unreadable" instead of guessing.
- **History:** past scans (photo and results) are saved on the phone and can be searched by
  brand, model or serial.
- **No signal:** a photo taken without service is saved and read automatically once the phone
  is back online.
- **Phone-first:** works one-handed in a dark basement, with big buttons, and can be installed
  to the home screen (PWA).

## Not in v1 (later)

- HVAC (furnaces, AC, heat pumps). The design must make this easy to add.
- Coworker logins.
- Linking scans to jobs, or sending them to the Work-Order-App.
- App store versions.

## How it works

```
Phone app (Cloudflare static page)
  └─ takes the photo, shrinks it, strips GPS/EXIF, sends it to:
Cloudflare Worker (/api/scan)  ← holds the private API key
  └─ checks the passcode and the daily limit, then sends the photo to:
Claude API (claude-opus-5-5, vision, structured JSON output)
  └─ returns the plate fields + suggestions
Phone app
  └─ runs our serial decoder on the serial → shows the results → saves them to history
```

- **Front end:** plain HTML, CSS and JS with no build step, like the Work-Order-App. CSS and JS
  live in their own files. A service worker handles offline use.
- **Back end:** one Cloudflare Worker (free tier). The Claude API key is a Worker secret, never in
  the repo.
- **AI model:** `claude-opus-5-5`, with refusal fallback turned on. One call per scan, about
  3 to 5 cents. The Anthropic console gets a monthly spending cap ($5 to start, about 100 or more
  scans).
- **Abuse guard:** the app sends a passcode, and the Worker caps scans per day (30 to start).
- **Phone storage:** IndexedDB for history and the offline queue (photos are too big for
  localStorage).
- **Privacy:** photos are not stored on any server, and EXIF/GPS is stripped before upload.

## What "done" means for v1

- [ ] 10 real plates scanned in the field, at least 2 from each of the four brands.
- [ ] Serial dates match the real manufacture date on every test plate from those brands.
- [ ] Brand, model and serial are read correctly on at least 9 of the 10.
- [ ] Nothing is shown without a trust label, and unreadable fields say "unreadable".
- [ ] A scan taken in airplane mode gets read automatically once the phone is back online.
- [ ] History survives closing the app and restarting the phone.
- [ ] A full scan takes under 15 seconds on LTE.
- [ ] The serial decoder has automated tests, and they pass.
- [ ] `BUILD-LOG.md` is up to date.

## Build order (one GitHub issue each, one branch and PR each)

1. **Serial decoder + tests.** Research each brand's date code from manufacturer sources, write
   the tests first using Chris's real plates, then the code. No AI or accounts needed, so this
   step can start today.
2. **App shell.** Camera or photo picker, shrink and strip the photo, and a results screen with
   sample data.
3. **Worker.** The `/api/scan` endpoint calling Claude, with the passcode and daily limit.
   Tested with a mock first.
4. **Connect the app to the Worker.** Real scans, trust labels, and error screens.
5. **History.** Saved scans plus search.
6. **Offline queue.** Save the photo and send it when back online.
7. **Deploy.** Cloudflare account, API key, spending cap, and a `workers.dev` URL. A custom
   domain comes later.
8. **Field test.** Scan 10 real plates, fix what breaks, and update the build log.

## Accounts Chris needs (Claude will walk through each one)

- Anthropic console (console.anthropic.com): API key, plus a $5 monthly cap.
- Cloudflare (free).

## Open questions

- Final app name.
- License for the public repo.
