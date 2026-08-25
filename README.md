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

**Today** — the current or next block, what to work on inside it (pulled from the next open
milestone for that project), today's routines, and anything due in the next 30 days. When
every block is ticked it tells you to close the laptop, which is the actual point.

**WWW** — *Working While Working.* The calendar, and the reason the app exists. An Outlook-shaped
day and week grid: hour gutter, half-hour lines, a red now-line, overlapping blocks packed
side by side. Every block carries a **project** and a **slider**, and the slider name on the
block is a link — tap it and you get that slider's **task list**: checkboxes, due dates, add
a new one inline. Above the grid, a **Due** strip shows the tasks and milestones landing on
each date. Tapping the block itself opens **the routine** (a repeating checklist that is the
same every time that block runs, ticked fresh per instance — the Anderson Block ships with
homework / Slack / email / announcements) plus that slider's open tasks. Week mode shows
total hours blocked with a warning about what is realistically keepable in a heavy quarter.

**The assistant** — `+` in the header, or the button under the calendar. Type it the way you'd
say it, one thing per line:

```
Anderson productivity block tonight, 1 hour
Email the EMA alumni director to find time to meet, due Wednesday
StudioVault every Tuesday 7pm for 2 hours
studio session with ttbby saturday 10:30am-1pm
```

It sorts each line into a **block**, a **task**, a **recurring block**, a **milestone** or a
**note**, parses the date, time and duration, and guesses the slider from your own vocabulary
(EMA, Otherside, ttbby, Juno, Frank Ocean, Logic, BCC…). Then it shows you every guess in an
editable card before anything is written. It runs entirely on the device — no API key, no
network, works on the subway. It *will* be wrong sometimes; the preview is the point.

**Plan** — the Sunday ritual, in five steps: look back one week, pick workouts, pick meals,
place blocks, name the one thing that matters. It reads back your completion rate from last
week and tells you to schedule *less* if you missed most of it.

**Goals** — the five 90-day objectives, then all 53 milestones grouped by window, filterable
by project, overdue, or build tasks. Tap any milestone for why it matters and to change its
target date. Project cards hold the purpose, graduation mindset and every slider definition.

**Routines** — daily, weekly, monthly and twice-yearly, with automatic period resets and
streaks on the daily ones. This is where the Memento's 23 Routines checklist items went.

**Header** — `+` opens the assistant. `☰` has the weekly template editor, all open tasks,
your captured notes, Memento dates, theme, and **Export / Import**.

### Deliberately not in v0

Notifications, calendar sync, the Logic scanner feed, the artist/media database, the finance
review, and anything to do with StudioVault's archive. Those are v1–v3 in the field plan.
Adding them now is the failure mode the whole audit was about.

---

## Your data

Everything lives in this browser's `localStorage` under `detour.app.v1`. It never leaves the
device — there is no server to send it to.

Two consequences worth knowing:

- The home-screen app and a Safari tab can keep **separate** copies. Pick one and stay in it.
- Use **☰ → Export data** before you switch devices or redeploy anything major. Import
  restores it.

`☰ → Reset to plan` wipes your local changes and reloads the original field-plan seed.

---

## Editing it

- `seed.js` — all your content: projects, sliders, milestones, block template, routines,
  release dates, Memento dates. Change a date or add a milestone here and it appears on a
  fresh install. Existing installs keep their own copy — reset or edit in-app.
- `app.js` — one file, no framework, no bundler. Views are functions at the bottom half.
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
