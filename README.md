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

## What's in it

Five tabs.

**WWW** — *Working While Working.* The calendar, and the reason the app exists. Outlook-shaped
day and week grid: hour gutter, half-hour lines, a red now-line, overlapping blocks packed side
by side. Every block carries a **project** and a **slider**, and the slider name on the block is
a link into that slider's **task list**. Tapping the block opens **the routine** — a repeating
checklist, same every instance, ticked fresh each time. On today's date it opens with what is
running right now, and tells you to close the laptop when the day is clear.

**Plan** — three things in one place. **Suggested blocks**, generated from dates that already
exist: anything inside the 3-2-1 window, anything due within a fortnight with no block against
it, any task coming due whose slider is unbooked. Each is a button you press — nothing moves on
its own. Then the **Sunday ritual** in five steps. Then the **end-of-day check-in**: for each
block that has finished, did you make the progress you wanted, and if not, book another run at
it.

**Reflect** — type it or dictate it (the browser's own speech recognition, no key). Below that,
**what the app noticed**: a recurring block skipped three of the last four times it had your
attention, a milestone overdue by more than a week, a week where you kept under half your
blocks, a project with something due and nothing on the calendar. Each carries the change it
would make; you approve or dismiss. It stays quiet until it has evidence — a day you never
opened the app is not a day you failed.

**Audit** — quarterly, at each Memento. The app assembles the brief from what actually
happened: milestones done and overdue by project, block completion over twelve weeks, recent
Sunday entries, reflections since last quarter, and five questions worth being asked. Copy it
into Claude and let the conversation do the auditing.

**Progress** — the Sunday survey. Weeks to graduation, what you got done per project, top five
goals for next week, cool stuff from last week. **Pull in what the app already knows** fills
the boxes from milestones, tasks and blocks you actually ticked that week, so you start from
evidence instead of a blank page. Past weeks are kept. The full milestone list lives below it.

**Header** — `+` opens the plain-English assistant. `☰` has routines, the weekly template
editor, all open tasks, notes, sync, theme and export/import.

### The 3-2-1 rule

Your own timeline policy, made mechanical. Anything with a due date is checked against it:
three days out it should be **started**, two days out **in progress**, one day out
**completed**. Plan surfaces whatever is off-pace.

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
