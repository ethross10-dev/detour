# Detour

The scheduler for the LA Era plan. **WWW** — working while working — is the calendar it is built around. Seven projects, 53 milestones, 21 sliders, your weekly
block template and your routines — all seeded from the field plan, all stored on your device.

No accounts, no backend, no build step. It is plain HTML, CSS and one JavaScript file.

---

## Run it

```bash
cd detour-app
python3 serve.py
```

Then open **http://localhost:8777**.

The server prints a second address (`http://192.168.x.x:8777`) that your phone can reach
on the same Wi-Fi. Ctrl-C stops it.

That is the whole setup. There is nothing to install.

---

## Getting it on your phone

**Read this before you buy the Apple Developer account.** You probably don't need it yet.

### Option A — the one I'd use (free, 10 minutes, works anywhere)

This app is a PWA: an installable web app. Put the folder on any free static host with HTTPS
and iOS will install it as a real app — home-screen icon, full screen, no Safari chrome,
works offline.

1. Push this folder to a GitHub repo.
2. Settings → Pages → deploy from the `main` branch, root folder.
3. Open the resulting `https://…github.io/…` URL in **Safari** on your iPhone.
4. Share button → **Add to Home Screen**.

Netlify and Vercel work the same way — drag the folder onto their dashboard and you get an
HTTPS URL in about a minute. Any of the three is free.

Once installed it launches like any app, keeps working with no signal, and updates whenever
you redeploy.

### Option B — local only (fine for testing tonight)

Run `serve.py`, open the `192.168.x.x` address on your phone, Add to Home Screen.

Caveat worth knowing: iOS only registers a service worker over HTTPS or localhost, so over a
plain LAN address the app **will not cache for offline use** and will break when you leave
the apartment or the Mac sleeps. Good for trying it out, not for daily use.

### Option C — the Apple Developer account ($99/yr)

You need this for exactly two things:

- **Push notifications that fire on a schedule** — "your StudioVault block starts in 10
  minutes." A PWA can do web push on iOS 16.4+, but only through a push server you'd have to
  run; a native wrapper is the simpler route to real local notifications.
- **Shipping to other people** through the App Store or TestFlight.

If neither of those is what you want today, the $99 buys you nothing this app can use.
Reminders are the one genuine gap in Option A — and iOS Calendar handles that fine in the
meantime: the blocks you keep here are the plan, and one recurring calendar entry for
"Sunday plan" is enough of an alarm to keep the ritual running.

If you later decide you want it native, the same folder wraps unchanged in Capacitor
(`npx cap add ios`) — nothing here would need rewriting.

---

## Three pillars

Detour is grouped into three pillars, and the metric of success is progress in **all three,
every week** — not hours logged.

| Pillar | What it is | Projects |
|---|---|---|
| **Progress** | the social simulation — connections, learning, staying well | Professional · Wellness |
| **Play** | the RPG loop — archive what inspires you, understand it, then make your own | Archive · StudioVault · Music Prod |
| **Preservation** | the save file — financial stability, and the story written down | Finances · Memoir |

The strip at the top of WWW shows all three for the current week. Finances and Memoir carry no
recurring blocks by design, so **closing a milestone or task counts as progress too** — otherwise
Preservation could never register a week at all.

## Blocks, not sliders

Sliders described the Chicago era. In LA the unit is the **block**, and there are two kinds:

- **Recurring** — expected every week. Skills you're practising to get better at: the Anderson
  Block, Workouts, The Archive Block, Solo Music Prod. Each carries a weekly target, or is
  marked *as many as fit* where that's the honest answer.
- **Manual** — held when a milestone date is getting close. One-off, specific, not something to
  grind weekly: Site Progress, Business Structure, WWO Music Prod.

## What's in it

Five tabs.

**WWW** — *Working While Working.* Three views: **Flow** (the default), **Grid** and **Week**.

The calendar holds three different kinds of thing, and they behave differently:

| | What it is | How it behaves |
|---|---|---|
| **Anchors** | happen at a real time | pinned — morning and night routines, both classes |
| **Manual blocks** | work toward a dated milestone | you schedule them as the date approaches |
| **Recurring blocks** | ongoing investment in an area | a priority queue, offered into whatever time is actually free |

Recurring blocks are **no longer pre-placed on the week**. They have a priority, a weekly target
and a session length, and the engine offers them into real gaps. Free time shows as a capacity
card — `4h 30m free · 2h 23m offerable · 2h 7m stays buffer` — with the top three blocks and a
few words on why each. Nothing lands on the day until you press **Start**.

The buffer is deliberate. At 75% density with an hour held back, the engine can never fill your
day, so something running long costs you buffer rather than the plan.

**Why that block:** an approaching milestone first, then a pillar the week has ignored, then
whatever is furthest behind its weekly target. A block already done today drops out — unless a
milestone is inside three days, which is the only time the same block is offered twice.

Anything whose slot has passed moves to **Earlier today** rather than flowing into the evening:
`missed` for something that could have moved, `passed` for an anchor that simply happened.

**Plan** — suggested blocks generated from real due dates and the 3-2-1 rule, the Sunday
ritual, and an end-of-day check-in per block.

**Reflect** — dictate or type, then see what the app noticed in your own data, each with the
change it would make. It stays quiet until it has evidence.

**Audit** — quarterly, at each Memento. Assembles a brief from what actually happened for you
to paste into Claude.

**Progress** — the Sunday survey, grouped by pillar, pre-fillable from what you really ticked.
The milestone list lives below it.

### The 3-2-1 rule

Three days out it should be **started**, two days out **in progress**, one day out
**completed**. Plan surfaces whatever is off-pace.

### No hour estimates

Milestones carry a due date and a checklist, not an estimate — you have not done most of these
before, so an estimate would be a guess dressed as a plan. Schedule a block, work, and if it is
not finished schedule another. A milestone shows how many blocks have actually gone into it.

### Routines

Every item written out, resetting on its own period: morning (9), night (5 — three of them
Monday, Wednesday and Thursday only), Sunday chores (11), monthly in five parts (31), and
half-yearly in four (12). Routines are upkeep, so they're excluded from the weekly load
warning and from pillar scoring — they'd drown everything else.

### Deliberately not in v0

Notifications, calendar sync, the Logic scanner feed, the artist/media database, the finance
review, and anything to do with StudioVault's archive.

Also not here, and worth being clear about: **Reflect cannot read the Voice Memos app.** iOS
gives web apps no access to it. Dictation inside Detour is the substitute. And nothing in Plan,
Reflect or Audit calls a language model — every suggestion is a rule over your own data, which
is why it works on the subway and costs nothing.

---

## Your data

Everything lives in this browser's `localStorage` under `detour.app.v1`. By default it never
leaves the device.

Two consequences worth knowing:

- The home-screen app and a Safari tab can keep **separate** copies. Pick one and stay in it.
- Use **☰ → Export data** before you redeploy anything major. Import restores it.

`☰ → Reset to plan` wipes your local changes and reloads the original field-plan seed.

---

## Sync (optional — ☰ → Sync)

Off until you turn it on. Once on, every device merges into a single **secret GitHub gist**,
so ticking a block on the phone shows up on the laptop and vice versa.

**Setup, once per device**

1. GitHub → *Settings → Developer settings → Personal access tokens → Fine-grained tokens*.
   Set an expiry, and under **Account permissions** set **Gists: Read and write**. Nothing
   else. Paste it in.
2. Choose a passphrase. Use the **same one on every device**.
3. First device: name it whatever you like and hit **Create a new secret gist**. Every device
   after: copy the gist ID shown in the panel and use **Connect to an existing gist** — it
   accepts the bare ID or the full `gist.github.com/...` URL.

**The name is cosmetic.** Detour finds the gist by its ID, which GitHub assigns and you cannot
choose. Rename or re-describe the gist on GitHub whenever you like; nothing breaks. The ID is
also the only thing protecting it, which is why the passphrase matters.

You can point Detour at a gist you made by hand. It adds its own `detour-state.json` and
leaves any other files in that gist alone. If the gist is **public**, the panel says so in red
— a public gist is listed on your profile and readable by anyone.

**How the merge works.** Not last-file-wins — per record. Each task, block tick, routine tick,
note and template carries a timestamp, and the newest edit to *each individual record* wins.
An evening of ticking blocks on the phone and an afternoon of adding tasks on the laptop both
survive. Deletes leave a tombstone so they don't come back on the next pull, but a *newer*
edit beats an older delete — losing work is the worse failure.

Timestamps are also a logical counter, so anything you edit after seeing the other device's
state sorts after it even if the two clocks disagree. Tested against a device running ten
minutes slow.

**Encryption.** A "secret" gist is unlisted, not private: anyone holding the URL can read it.
With a passphrase set, the file is encrypted in the browser (AES-GCM, PBKDF2) before it
leaves, so the URL alone is worthless. Lose the passphrase and the *remote* copy is
unreadable — your local copy is untouched, but you'd start the gist over. Encryption needs a
secure origin: the GitHub Pages URL or `localhost`, **not** the bare `192.168.x.x` address.

**What syncs.** Milestones, tasks, templates, routines, 90-day objectives, notes, block ticks
and notes, routine ticks, week plans, block routines, skipped and one-off blocks, and your
theme. Projects, sliders, releases and Memento dates come from `seed.js` — they change on
deploy, not on a device, so they are not synced.

**Cadence.** Pushes a few seconds after an edit, pulls when you return to the app or come back
online. Every push is a pull-merge-push, so two devices can't clobber each other. Offline it
simply keeps working and catches up later.

---

## Editing it

- `seed.js` — all your content: projects, sliders, milestones, block template, routines,
  release dates, Memento dates. Change a date or add a milestone here and it appears on a
  fresh install. Existing installs keep their own copy — reset or edit in-app.
- `app.js` — no framework, no bundler. Views are functions in the lower half. It exposes a
  small `window.DETOUR` seam at the end so sync can read, replace and redraw the state.
- `sync.js` — the optional gist sync: flatten → stamp → merge → unflatten, plus the setup
  panel. Deleting this file disables sync and breaks nothing else.
- `styles.css` — CSS variables at the top control the whole palette, light and dark.
- `sw.js` — the offline cache. Bump `CACHE` on every deploy or installed copies keep serving
  the old files. `./publish.sh "what changed"` does the bump, commit and push for you.

### Changing the data model

Your device's `localStorage` copy is **authoritative** once it exists — editing `seed.js` only
affects fresh installs. So any structural change has to arrive twice: in `seed.js` for new
installs, and in `migrate()` at the top of `app.js` for the copy already on your phone.
`migrate()` is guarded by `S.schema`, so it runs once and is safe to ship repeatedly. The WWW
release is schema 2: it adds `tasks`, `blockRoutines` and a `sliderId` on every block.

---

## The rule

From the field plan, and it still applies:

> If v0 takes more than one weekend, stop and go work on StudioVault instead. This is the
> highest-risk build in the whole portfolio precisely because it feels productive — an app
> for managing Detour is the most sophisticated possible way of not doing Detour.

v0 is built. The next commit you make to this repo should be because using it revealed
something missing, not because you thought of a feature.
