window.DETOUR_SEED = {
 "pillars": [
  {
   "id": "progress",
   "name": "Progress",
   "tag": "Social sim",
   "color": "#8AA0E0",
   "blurb": "Connections and learning at Anderson, and keeping wellness at a proper level."
  },
  {
   "id": "play",
   "name": "Play",
   "tag": "RPG",
   "color": "#E0AE4C",
   "blurb": "Inspired by archiving new media, understanding it through StudioVault, and finally creating your own through Music Prod."
  },
  {
   "id": "preservation",
   "name": "Preservation",
   "tag": "Save file",
   "color": "#63C295",
   "blurb": "Financially stable, and able to encapsulate the story."
  }
 ],
 "projects": [
  {
   "id": "professional",
   "num": "01",
   "pillar": "progress",
   "name": "Professional Project",
   "priority": "Primary",
   "color": "#8AA0E0",
   "purpose": "Convert into a career that runs three lanes at once — producing, StudioVault, artist management — using Anderson's centers, faculty and classmates as the machinery rather than doing it alone.",
   "mindset": "A Tuesday in 2028 opens with StudioVault admin — my team, this week's goals. Midday is artist management, likely inside a label. The day ends in a studio session. Three lanes, one financially stable career, and no version of it that requires a job I would hate."
  },
  {
   "id": "wellness",
   "num": "02",
   "pillar": "progress",
   "name": "Wellness Project",
   "priority": "Maintenance",
   "color": "#63C295",
   "purpose": "Plan the week on Sunday in ten minutes, then stop thinking about it — a healthy life that costs decisions once rather than attention continuously.",
   "mindset": "Workouts and meals are planned every Sunday and I know the week's plan before it starts. Routines run in the background and keep me prepared for the week, the month and the year ahead."
  },
  {
   "id": "archive",
   "num": "03",
   "pillar": "play",
   "name": "Archive Project",
   "priority": "Primary",
   "color": "#C99BE0",
   "purpose": "Keep developing the taste and archival craft you genuinely enjoy, on a schedule, and point its output at StudioVault and at what you produce.",
   "mindset": "Reviewing is fast enough that I actually do it, and I have a real, defensible view of the underground. My archive is one system rather than five spreadsheets, and it feeds StudioVault directly."
  },
  {
   "id": "studiovault",
   "num": "04",
   "pillar": "play",
   "name": "StudioVault",
   "priority": "Primary",
   "color": "#4ED6CB",
   "purpose": "Build the first real archive of a modern artist's whole media enterprise — everything public-facing they do beyond the music — and let a community keep it accurate.",
   "mindset": "StudioVault is a working platform with real users, real contributors and a revenue stream. Artists check their own page. It is my Business Creation Capstone, it has a team, and it is the reason people in the underground know who I am."
  },
  {
   "id": "music",
   "num": "05",
   "pillar": "play",
   "name": "Music Prod",
   "priority": "Primary",
   "color": "#E0AE4C",
   "purpose": "Get music finished and released on fixed dates, with other people — because a deadline and a collaborator is the only mechanism that has ever worked for you.",
   "mindset": "I release on a schedule and it is no longer a hard thing to do. I have produced for artists Ethan Deetz would vouch for. And I am confident putting out serious music under my own name — which is the part that was actually stopping me."
  },
  {
   "id": "finances",
   "num": "06",
   "pillar": "preservation",
   "name": "Finances",
   "priority": "Maintenance",
   "color": "#7FB3D5",
   "purpose": "Know what you can spend on Detour each month in under fifteen minutes, so money stops taking up thinking room.",
   "mindset": "I know my number. The monthly review takes minutes and I actually do it. I understand my loans, I know what Detour costs, and I spend it without second-guessing."
  },
  {
   "id": "memoir",
   "num": "07",
   "pillar": "preservation",
   "name": "Memoir",
   "priority": "Seasonal",
   "color": "#E0806C",
   "purpose": "Preserve the raw material now, while it is cheap and still recoverable, and write the eras on a named schedule instead of an open one.",
   "mindset": "Everything is preserved, structured and searchable from high school onward. I have written high school and college in my own voice. And I know when the next one gets written."
  }
 ],
 "blocks": [
  {
   "id": "k-anderson",
   "projectId": "professional",
   "name": "Anderson Block",
   "kind": "recurring",
   "definition": "Weekday block after class, plus one at the weekend. The standing container for coursework, the task tracker, communications and Canvas.",
   "priority": 3,
   "perWeek": 6,
   "minSession": 45,
   "idealSession": 90,
   "weeklyTarget": 6,
   "anchor": false
  },
  {
   "id": "k-classcenter",
   "projectId": "professional",
   "name": "Class & Center Commitments",
   "kind": "recurring",
   "definition": "Classes, center events and leadership obligations, section happy hours. These are pinned to real clock times — they are the anchors the rest of the day flows around.",
   "priority": 4,
   "perWeek": 3,
   "minSession": 60,
   "idealSession": 120,
   "weeklyTarget": 3,
   "anchor": true
  },
  {
   "id": "k-otherside",
   "projectId": "professional",
   "name": "Otherside Intern Work",
   "kind": "recurring",
   "definition": "The intern work itself, or whatever paid music position replaces it.",
   "priority": 6,
   "perWeek": 2,
   "minSession": 60,
   "idealSession": 120,
   "weeklyTarget": 2,
   "anchor": false
  },
  {
   "id": "k-morning",
   "projectId": "wellness",
   "name": "Morning Routine",
   "kind": "recurring",
   "definition": "Nine items, every morning. Ticks reset daily.",
   "priority": 1,
   "perWeek": 7,
   "minSession": 60,
   "idealSession": 90,
   "weeklyTarget": 7,
   "anchor": true
  },
  {
   "id": "k-night",
   "projectId": "wellness",
   "name": "Night Routine",
   "kind": "recurring",
   "definition": "Five items, three of them Monday, Wednesday and Thursday only.",
   "priority": 2,
   "perWeek": 7,
   "minSession": 20,
   "idealSession": 30,
   "weeklyTarget": 7,
   "anchor": true
  },
  {
   "id": "k-workout",
   "projectId": "wellness",
   "name": "Workouts",
   "kind": "recurring",
   "definition": "Five a week. Current split is 2 Pu, 2 Cardio, 1 Pu.",
   "priority": 5,
   "perWeek": 5,
   "minSession": 45,
   "idealSession": 60,
   "weeklyTarget": 5,
   "anchor": false
  },
  {
   "id": "k-sunday",
   "projectId": "wellness",
   "name": "Sunday Chores",
   "kind": "recurring",
   "definition": "Eleven items, about an hour and a half plus laundry. The weekly reset.",
   "priority": 8,
   "perWeek": 1,
   "minSession": 90,
   "idealSession": 90,
   "weeklyTarget": 1,
   "anchor": false
  },
  {
   "id": "k-monthly",
   "projectId": "wellness",
   "name": "Monthly Wellness Routine",
   "kind": "recurring",
   "definition": "Five parts: re-ups, doctors, trimming, cleaning, monthly Detour projects. About an hour and a half plus laundry.",
   "priority": 13,
   "perWeek": 0,
   "minSession": 90,
   "idealSession": 90,
   "weeklyTarget": 0,
   "anchor": false
  },
  {
   "id": "k-halfyear",
   "projectId": "wellness",
   "name": "Half-Yearly Routine",
   "kind": "recurring",
   "definition": "Cleaning service, the big Detour projects, decluttering, and the Memento.",
   "priority": 14,
   "perWeek": 0,
   "minSession": 120,
   "idealSession": 180,
   "weeklyTarget": 0,
   "anchor": false
  },
  {
   "id": "k-archiving",
   "projectId": "archive",
   "name": "Archiving Block",
   "kind": "recurring",
   "definition": "Update what media you've been consuming and get your thoughts into the tracker quickly. The only recurring block in this project.",
   "priority": 10,
   "perWeek": 2,
   "minSession": 30,
   "idealSession": 45,
   "weeklyTarget": 2,
   "anchor": false
  },
  {
   "id": "k-sv-archive",
   "projectId": "studiovault",
   "name": "Vault Building Block",
   "kind": "recurring",
   "definition": "As many as fit in the week. Building artist pages out in StudioVault — it will never be perfect; do the best you can by the date.",
   "priority": 7,
   "perWeek": 3,
   "minSession": 45,
   "idealSession": 90,
   "weeklyTarget": 3,
   "anchor": false
  },
  {
   "id": "k-sv-community",
   "projectId": "studiovault",
   "name": "Community Outreach / Feedback",
   "kind": "recurring",
   "definition": "Getting the community in and listening to what comes back.",
   "priority": 11,
   "perWeek": 1,
   "minSession": 45,
   "idealSession": 60,
   "weeklyTarget": 1,
   "anchor": false
  },
  {
   "id": "k-sv-site",
   "projectId": "studiovault",
   "name": "Site Progress",
   "kind": "manual",
   "definition": "Held when a site milestone is close. Not something to grind weekly.",
   "priority": 20,
   "perWeek": 0,
   "minSession": 30,
   "idealSession": 90,
   "weeklyTarget": 0,
   "anchor": false
  },
  {
   "id": "k-sv-biz",
   "projectId": "studiovault",
   "name": "Business Structure",
   "kind": "manual",
   "definition": "IP, the LLC, and eventually the capstone paperwork.",
   "priority": 20,
   "perWeek": 0,
   "minSession": 30,
   "idealSession": 90,
   "weeklyTarget": 0,
   "anchor": false
  },
  {
   "id": "k-pineboys",
   "projectId": "music",
   "name": "Pine Boys Block",
   "kind": "recurring",
   "definition": "Catch up, game, and work on music with Justin.",
   "priority": 12,
   "perWeek": 1,
   "minSession": 90,
   "idealSession": 120,
   "weeklyTarget": 1,
   "anchor": false
  },
  {
   "id": "k-solo",
   "projectId": "music",
   "name": "Solo Music Prod",
   "kind": "recurring",
   "definition": "Your own production, structured with your IO and aimed at a specific audience. Study others' production and develop your own plugins.",
   "priority": 9,
   "perWeek": 2,
   "minSession": 60,
   "idealSession": 90,
   "weeklyTarget": 2,
   "anchor": false
  },
  {
   "id": "k-wwo",
   "projectId": "music",
   "name": "WWO Music Prod",
   "kind": "manual",
   "definition": "Collaborating with others on a mutual project in LA. Three tasks, then audit and turn it into a routine.",
   "priority": 20,
   "perWeek": 0,
   "minSession": 30,
   "idealSession": 90,
   "weeklyTarget": 0,
   "anchor": false
  }
 ],
 "milestones": [
  {
   "id": "m01",
   "projectId": "professional",
   "blockId": null,
   "title": "Create the networking tracker — Anderson names for BCC and the internship, Detour names for workout and music partners.",
   "why": "One list, two columns. Without it, networking stays a feeling instead of a queue you work through.",
   "term": "Fall 2026",
   "due": "2026-09-30",
   "tbd": false,
   "build": true,
   "done": false,
   "doneAt": null
  },
  {
   "id": "m02",
   "projectId": "professional",
   "blockId": null,
   "title": "Apply for student org leadership — EMA, EA, AnderTech.",
   "why": "Three applications, one window, early in the fall.",
   "term": "Fall 2026",
   "due": "2026-09-30",
   "tbd": false,
   "build": false,
   "done": false,
   "doneAt": null
  },
  {
   "id": "m03",
   "projectId": "professional",
   "blockId": null,
   "title": "Finish Mef's book and meet with him.",
   "why": "Reading it is the price of the meeting being worth anything.",
   "term": "Fall 2026",
   "due": "2026-09-30",
   "tbd": false,
   "build": false,
   "done": false,
   "doneAt": null
  },
  {
   "id": "m04",
   "projectId": "professional",
   "blockId": null,
   "title": "Ninety days in: Lyn's coffee chats done, three centers met, a BCC plan agreed with Prof. Wu.",
   "why": "The Parker method on Lyn's list. A pitch ready for Tech, Entrepreneurship and CEMES. Go in expecting to be corrected — faculty feedback is the point.",
   "term": "Fall 2026",
   "due": "2026-10-31",
   "tbd": false,
   "build": false,
   "done": false,
   "doneAt": null
  },
  {
   "id": "m05",
   "projectId": "professional",
   "blockId": null,
   "title": "Secure a paid position in underground music.",
   "why": "Pay or a title, not a song. This is the milestone that makes the Professional Project real rather than academic.",
   "term": "Fall 2026",
   "due": "2026-10-31",
   "tbd": false,
   "build": false,
   "done": false,
   "doneAt": null
  },
  {
   "id": "m06",
   "projectId": "professional",
   "blockId": null,
   "title": "Email UCLA Library Special Collections and the Ethnomusicology Archive.",
   "why": "Two emails. The archive world at UCLA is a resource nobody in your cohort is using.",
   "term": "Fall 2026",
   "due": "2026-10-31",
   "tbd": false,
   "build": false,
   "done": false,
   "doneAt": null
  },
  {
   "id": "m07",
   "projectId": "professional",
   "blockId": null,
   "title": "FY27 budget approved and the Hillel treasurer role finished.",
   "why": "The term ends 1 January 2027; the budget itself has to clear well before that.",
   "term": "Winter / Spring 2027",
   "due": "2027-01-31",
   "tbd": false,
   "build": false,
   "done": false,
   "doneAt": null
  },
  {
   "id": "m08",
   "projectId": "professional",
   "blockId": null,
   "title": "Summer 2027 settled — internship, fellowship or venture.",
   "why": "Decided by March, not discovered in May. The biggest fork in the two years.",
   "term": "Winter / Spring 2027",
   "due": "2027-03-31",
   "tbd": false,
   "build": false,
   "done": false,
   "doneAt": null
  },
  {
   "id": "m09",
   "projectId": "professional",
   "blockId": null,
   "title": "Summer internship or fellowship completed.",
   "why": "Finished and behind you, with something to show and someone who would hire you again.",
   "term": "Fall 2027",
   "due": "2027-09-30",
   "tbd": false,
   "build": false,
   "done": false,
   "doneAt": null
  },
  {
   "id": "m10",
   "projectId": "professional",
   "blockId": null,
   "title": "Money coming in during year two — StudioVault through Price Center resources, production through Otherside and Ethan Deetz.",
   "why": "Two named channels, not a hope.",
   "term": "Fall 2027",
   "due": "2027-09-30",
   "tbd": false,
   "build": false,
   "done": false,
   "doneAt": null
  },
  {
   "id": "m11",
   "projectId": "professional",
   "blockId": null,
   "title": "Apply to BCC.",
   "why": "The application is the easy part. The team and the traction take a year, which is why the earlier milestones exist.",
   "term": "Fall 2027",
   "due": "2027-10-31",
   "tbd": false,
   "build": false,
   "done": false,
   "doneAt": null
  },
  {
   "id": "m12",
   "projectId": "professional",
   "blockId": null,
   "title": "StudioVault capstone completed.",
   "why": "BCC run to the end with StudioVault as the subject.",
   "term": "Spring 2028",
   "due": "2028-04-30",
   "tbd": false,
   "build": false,
   "done": false,
   "doneAt": null
  },
  {
   "id": "m13",
   "projectId": "professional",
   "blockId": null,
   "title": "Graduate with several revenue sources — StudioVault, production splits, and a paid artist management seat.",
   "why": "The graduation mindset stated as a count rather than a feeling.",
   "term": "Spring 2028",
   "due": "2028-05-31",
   "tbd": false,
   "build": false,
   "done": false,
   "doneAt": null
  },
  {
   "id": "m14",
   "projectId": "wellness",
   "blockId": null,
   "title": "Update the cooking sheet with Crock Pot recipes.",
   "why": "Slow cooker meals are the ones that survive a heavy quarter.",
   "term": "Fall 2026",
   "due": "2026-08-31",
   "tbd": false,
   "build": false,
   "done": false,
   "doneAt": null
  },
  {
   "id": "m15",
   "projectId": "wellness",
   "blockId": null,
   "title": "Create a plan to start working out with others at the UCLA gym.",
   "why": "One community that expects you beats a routine you track.",
   "term": "Fall 2026",
   "due": "2026-09-30",
   "tbd": false,
   "build": false,
   "done": false,
   "doneAt": null
  },
  {
   "id": "m16",
   "projectId": "wellness",
   "blockId": null,
   "title": "Create a plan to start a run club.",
   "why": "",
   "term": "Fall 2026",
   "due": "2026-09-30",
   "tbd": false,
   "build": false,
   "done": false,
   "doneAt": null
  },
  {
   "id": "m17",
   "projectId": "wellness",
   "blockId": null,
   "title": "Create a plan to start BruinFit.",
   "why": "",
   "term": "Fall 2026",
   "due": "2026-09-30",
   "tbd": false,
   "build": false,
   "done": false,
   "doneAt": null
  },
  {
   "id": "m18",
   "projectId": "wellness",
   "blockId": null,
   "title": "Confirm a schedule for workouts and cooking.",
   "why": "From here on, this project is reflected on in the quarterly Memento audits rather than tracked weekly.",
   "term": "Fall 2026",
   "due": "2026-10-31",
   "tbd": false,
   "build": false,
   "done": false,
   "doneAt": null
  },
  {
   "id": "m19",
   "projectId": "archive",
   "blockId": "k-archiving",
   "title": "Update the Archiving Spreadsheet, including the feature that builds music reviews in your voice from a quick voice memo.",
   "why": "The write-up step is the one that has always failed. Automate exactly that.",
   "term": "Fall 2026",
   "due": "2026-09-30",
   "tbd": false,
   "build": true,
   "done": false,
   "doneAt": null
  },
  {
   "id": "m20",
   "projectId": "archive",
   "blockId": "k-archiving",
   "title": "Complete the Frank Ocean reviews.",
   "why": "The proof-of-concept guinea pig project.",
   "term": "Fall 2026",
   "due": "2026-10-31",
   "tbd": false,
   "build": false,
   "done": false,
   "doneAt": null
  },
  {
   "id": "m21",
   "projectId": "archive",
   "blockId": "k-archiving",
   "title": "Audit the Archive.",
   "why": "To be defined at the audit.",
   "term": "Fall 2026",
   "due": "2026-11-30",
   "tbd": true,
   "build": false,
   "done": false,
   "doneAt": null
  },
  {
   "id": "m22",
   "projectId": "studiovault",
   "blockId": "k-sv-archive",
   "title": "Have the full ttbby archive put in.",
   "why": "Proof of concept, and the artist you know best.",
   "term": "Fall 2026",
   "due": "2026-09-30",
   "tbd": false,
   "build": false,
   "done": false,
   "doneAt": null
  },
  {
   "id": "m23",
   "projectId": "studiovault",
   "blockId": "k-sv-archive",
   "title": "Pick an artist with a dedicated underground community, complete their page, and recruit a mod from another platform.",
   "why": "The first person who isn't you adding something is the whole thesis.",
   "term": "Fall 2026",
   "due": "2026-10-31",
   "tbd": false,
   "build": false,
   "done": false,
   "doneAt": null
  },
  {
   "id": "m24",
   "projectId": "studiovault",
   "blockId": "k-sv-archive",
   "title": "Have five artists completely archived.",
   "why": "",
   "term": "Fall 2026",
   "due": "2026-10-31",
   "tbd": false,
   "build": false,
   "done": false,
   "doneAt": null
  },
  {
   "id": "m25",
   "projectId": "studiovault",
   "blockId": "k-sv-archive",
   "title": "Audit the Archive block.",
   "why": "To be defined at the audit.",
   "term": "Fall 2026",
   "due": "2026-11-30",
   "tbd": true,
   "build": false,
   "done": false,
   "doneAt": null
  },
  {
   "id": "m26",
   "projectId": "studiovault",
   "blockId": "k-sv-community",
   "title": "Create an opportunity for the community to give feedback on the platform.",
   "why": "",
   "term": "Fall 2026",
   "due": "2026-10-31",
   "tbd": false,
   "build": false,
   "done": false,
   "doneAt": null
  },
  {
   "id": "m27",
   "projectId": "studiovault",
   "blockId": "k-sv-community",
   "title": "Finalise the content plan and begin posting. Attempt an interview with an artist.",
   "why": "",
   "term": "Fall 2026",
   "due": "2026-11-30",
   "tbd": false,
   "build": false,
   "done": false,
   "doneAt": null
  },
  {
   "id": "m28",
   "projectId": "studiovault",
   "blockId": "k-sv-community",
   "title": "Wait for community feedback, then audit.",
   "why": "To be defined once feedback is in.",
   "term": "Later",
   "due": "",
   "tbd": true,
   "build": false,
   "done": false,
   "doneAt": null
  },
  {
   "id": "m29",
   "projectId": "studiovault",
   "blockId": "k-sv-site",
   "title": "Complete the beta — Chicago Era ideas combined with the ingestion agent and the Underground Hip Hop Researcher focus.",
   "why": "The one site milestone that matters right now.",
   "term": "Fall 2026",
   "due": "2026-09-30",
   "tbd": false,
   "build": false,
   "done": false,
   "doneAt": null
  },
  {
   "id": "m30",
   "projectId": "studiovault",
   "blockId": "k-sv-site",
   "title": "Wait for community feedback, then audit the site.",
   "why": "To be defined once feedback is in.",
   "term": "Later",
   "due": "",
   "tbd": true,
   "build": false,
   "done": false,
   "doneAt": null
  },
  {
   "id": "m31",
   "projectId": "studiovault",
   "blockId": "k-sv-biz",
   "title": "Work with a lawyer to protect the IP and form the LLC.",
   "why": "",
   "term": "Fall 2026",
   "due": "2026-10-31",
   "tbd": false,
   "build": false,
   "done": false,
   "doneAt": null
  },
  {
   "id": "m32",
   "projectId": "studiovault",
   "blockId": "k-sv-biz",
   "title": "Audit the business structure when you begin working with Parker / ACT / EA.",
   "why": "To be defined at the audit.",
   "term": "Later",
   "due": "",
   "tbd": true,
   "build": false,
   "done": false,
   "doneAt": null
  },
  {
   "id": "m33",
   "projectId": "music",
   "blockId": "k-pineboys",
   "title": "Release TGNS.",
   "why": "",
   "term": "Fall 2026",
   "due": "2026-10-31",
   "tbd": false,
   "build": false,
   "done": false,
   "doneAt": null
  },
  {
   "id": "m34",
   "projectId": "music",
   "blockId": "k-pineboys",
   "title": "Release SWAGBOYS.",
   "why": "",
   "term": "Fall 2026",
   "due": "2026-10-31",
   "tbd": false,
   "build": false,
   "done": false,
   "doneAt": null
  },
  {
   "id": "m35",
   "projectId": "music",
   "blockId": "k-pineboys",
   "title": "Release Chicago Bounce.",
   "why": "",
   "term": "Winter 2026",
   "due": "2026-12-31",
   "tbd": false,
   "build": false,
   "done": false,
   "doneAt": null
  },
  {
   "id": "m36",
   "projectId": "music",
   "blockId": "k-pineboys",
   "title": "Audit Pine Boys.",
   "why": "To be defined at the audit.",
   "term": "Winter 2026",
   "due": "2026-12-31",
   "tbd": true,
   "build": false,
   "done": false,
   "doneAt": null
  },
  {
   "id": "m37",
   "projectId": "music",
   "blockId": "k-solo",
   "title": "Create the Logic Scanner.",
   "why": "",
   "term": "Fall 2026",
   "due": "2026-09-30",
   "tbd": false,
   "build": true,
   "done": false,
   "doneAt": null
  },
  {
   "id": "m38",
   "projectId": "music",
   "blockId": "k-solo",
   "title": "Put together the full EA — OPN class, Ethan Deetz resources, Tape Notes / MWTM — and one-off song structures for TGNS, SWAGBOYS and the ttbby beat pack.",
   "why": "",
   "term": "Fall 2026",
   "due": "2026-09-30",
   "tbd": false,
   "build": false,
   "done": false,
   "doneAt": null
  },
  {
   "id": "m39",
   "projectId": "music",
   "blockId": "k-solo",
   "title": "Release the ttbby beat pack.",
   "why": "The private lane: packs build relationships.",
   "term": "Fall 2026",
   "due": "2026-10-31",
   "tbd": false,
   "build": false,
   "done": false,
   "doneAt": null
  },
  {
   "id": "m40",
   "projectId": "music",
   "blockId": "k-solo",
   "title": "Finish the Rick Rubin book.",
   "why": "",
   "term": "Fall 2026",
   "due": "2026-10-31",
   "tbd": false,
   "build": false,
   "done": false,
   "doneAt": null
  },
  {
   "id": "m41",
   "projectId": "music",
   "blockId": "k-solo",
   "title": "Audit Solo.",
   "why": "To be defined at the audit.",
   "term": "Fall 2026",
   "due": "2026-11-30",
   "tbd": true,
   "build": false,
   "done": false,
   "doneAt": null
  },
  {
   "id": "m42",
   "projectId": "music",
   "blockId": "k-wwo",
   "title": "Begin DJing with Chad (AnderRoom).",
   "why": "",
   "term": "Fall 2026",
   "due": "2026-09-30",
   "tbd": false,
   "build": false,
   "done": false,
   "doneAt": null
  },
  {
   "id": "m43",
   "projectId": "music",
   "blockId": "k-wwo",
   "title": "Reach out to Hannah for advice on home mic setups.",
   "why": "",
   "term": "Fall 2026",
   "due": "2026-09-30",
   "tbd": false,
   "build": false,
   "done": false,
   "doneAt": null
  },
  {
   "id": "m44",
   "projectId": "music",
   "blockId": "k-wwo",
   "title": "Meet with Gutty when he's in town.",
   "why": "",
   "term": "Fall 2026",
   "due": "2026-09-30",
   "tbd": false,
   "build": false,
   "done": false,
   "doneAt": null
  },
  {
   "id": "m45",
   "projectId": "music",
   "blockId": "k-wwo",
   "title": "Work in the studio with Ethan Deetz.",
   "why": "",
   "term": "Fall 2026",
   "due": "2026-11-30",
   "tbd": false,
   "build": false,
   "done": false,
   "doneAt": null
  },
  {
   "id": "m46",
   "projectId": "music",
   "blockId": "k-wwo",
   "title": "Audit WWO.",
   "why": "To be defined at the audit.",
   "term": "Fall 2026",
   "due": "2026-11-30",
   "tbd": true,
   "build": false,
   "done": false,
   "doneAt": null
  },
  {
   "id": "m47",
   "projectId": "finances",
   "blockId": null,
   "title": "Audit the finances routine and craft a new monthly one — loan sheet (Juno, JSLA, Federal) and an income section (ORS position, royalties, StudioVault).",
   "why": "",
   "term": "Fall 2026",
   "due": "2026-09-30",
   "tbd": false,
   "build": false,
   "done": false,
   "doneAt": null
  },
  {
   "id": "m48",
   "projectId": "finances",
   "blockId": null,
   "title": "Use Claude to build an investing routine you'll run with fake money after budgeting each month.",
   "why": "Ten minutes of paper investing, monthly. Not a trading habit.",
   "term": "Fall 2026",
   "due": "2026-09-30",
   "tbd": false,
   "build": false,
   "done": false,
   "doneAt": null
  },
  {
   "id": "m49",
   "projectId": "finances",
   "blockId": null,
   "title": "Audit how Finances are going.",
   "why": "To be defined at the audit.",
   "term": "Fall 2026",
   "due": "2026-11-30",
   "tbd": true,
   "build": false,
   "done": false,
   "doneAt": null
  },
  {
   "id": "m50",
   "projectId": "memoir",
   "blockId": null,
   "title": "Finalise the Memento at the end of Summer Quarter with current goals and reflection.",
   "why": "",
   "term": "Fall 2026",
   "due": "2026-09-30",
   "tbd": false,
   "build": false,
   "done": false,
   "doneAt": null
  },
  {
   "id": "m51",
   "projectId": "memoir",
   "blockId": null,
   "title": "Write the Memento at the end of Winter Quarter.",
   "why": "",
   "term": "Winter 2026",
   "due": "2026-12-31",
   "tbd": false,
   "build": false,
   "done": false,
   "doneAt": null
  },
  {
   "id": "m52",
   "projectId": "memoir",
   "blockId": null,
   "title": "Leverage AI to archive all texts through the Chicago Era, saving images and documents with proper dates.",
   "why": "",
   "term": "Winter 2026",
   "due": "2026-12-31",
   "tbd": false,
   "build": false,
   "done": false,
   "doneAt": null
  },
  {
   "id": "m53",
   "projectId": "memoir",
   "blockId": null,
   "title": "Decide the mapping categories for the High School, College and Chicago eras, and map the text archive to them.",
   "why": "This builds the skeleton for the writing.",
   "term": "Winter 2026",
   "due": "2026-12-31",
   "tbd": false,
   "build": false,
   "done": false,
   "doneAt": null
  },
  {
   "id": "m54",
   "projectId": "memoir",
   "blockId": null,
   "title": "Write the High School Era memoir.",
   "why": "",
   "term": "Winter / Spring 2027",
   "due": "2027-01-31",
   "tbd": false,
   "build": false,
   "done": false,
   "doneAt": null
  },
  {
   "id": "m55",
   "projectId": "memoir",
   "blockId": null,
   "title": "Write the College Era memoir.",
   "why": "",
   "term": "Summer 2027",
   "due": "2027-08-31",
   "tbd": false,
   "build": false,
   "done": false,
   "doneAt": null
  },
  {
   "id": "m56",
   "projectId": "memoir",
   "blockId": null,
   "title": "Write the Chicago Era memoir.",
   "why": "",
   "term": "Winter 2028",
   "due": "2028-01-31",
   "tbd": false,
   "build": false,
   "done": false,
   "doneAt": null
  }
 ],
 "tasks": [
  {
   "id": "t01",
   "projectId": "professional",
   "blockId": null,
   "title": "Hillel pictures",
   "due": null,
   "note": "",
   "done": false,
   "doneAt": null
  },
  {
   "id": "t02",
   "projectId": "professional",
   "blockId": null,
   "title": "Reach out to Uncle Sam's connections again for coffee chats",
   "due": null,
   "note": "",
   "done": false,
   "doneAt": null
  },
  {
   "id": "t03",
   "projectId": "professional",
   "blockId": null,
   "title": "Get CA licence and plates, update voter registration",
   "due": null,
   "note": "",
   "done": false,
   "doneAt": null
  },
  {
   "id": "t04",
   "projectId": "professional",
   "blockId": null,
   "title": "Hillel board financial materials, financial calendar, dashboard for board meetings, endowment sustainability review",
   "due": null,
   "note": "",
   "done": false,
   "doneAt": null
  }
 ],
 "blockTemplates": [
  {
   "id": "a01",
   "day": 0,
   "label": "Morning Routine",
   "start": "07:00",
   "mins": 90,
   "projectId": "wellness",
   "blockId": "k-morning",
   "kind": "routine",
   "pin": true
  },
  {
   "id": "a02",
   "day": 1,
   "label": "Morning Routine",
   "start": "07:00",
   "mins": 90,
   "projectId": "wellness",
   "blockId": "k-morning",
   "kind": "routine",
   "pin": true
  },
  {
   "id": "a03",
   "day": 2,
   "label": "Morning Routine",
   "start": "07:00",
   "mins": 90,
   "projectId": "wellness",
   "blockId": "k-morning",
   "kind": "routine",
   "pin": true
  },
  {
   "id": "a04",
   "day": 3,
   "label": "Morning Routine",
   "start": "07:00",
   "mins": 90,
   "projectId": "wellness",
   "blockId": "k-morning",
   "kind": "routine",
   "pin": true
  },
  {
   "id": "a05",
   "day": 4,
   "label": "Morning Routine",
   "start": "07:00",
   "mins": 90,
   "projectId": "wellness",
   "blockId": "k-morning",
   "kind": "routine",
   "pin": true
  },
  {
   "id": "a06",
   "day": 5,
   "label": "Morning Routine",
   "start": "07:00",
   "mins": 90,
   "projectId": "wellness",
   "blockId": "k-morning",
   "kind": "routine",
   "pin": true
  },
  {
   "id": "a07",
   "day": 6,
   "label": "Morning Routine",
   "start": "07:00",
   "mins": 90,
   "projectId": "wellness",
   "blockId": "k-morning",
   "kind": "routine",
   "pin": true
  },
  {
   "id": "a08",
   "day": 0,
   "label": "Night Routine",
   "start": "21:30",
   "mins": 30,
   "projectId": "wellness",
   "blockId": "k-night",
   "kind": "routine",
   "pin": true
  },
  {
   "id": "a09",
   "day": 1,
   "label": "Night Routine",
   "start": "21:30",
   "mins": 30,
   "projectId": "wellness",
   "blockId": "k-night",
   "kind": "routine",
   "pin": true
  },
  {
   "id": "a10",
   "day": 2,
   "label": "Night Routine",
   "start": "21:30",
   "mins": 30,
   "projectId": "wellness",
   "blockId": "k-night",
   "kind": "routine",
   "pin": true
  },
  {
   "id": "a11",
   "day": 3,
   "label": "Night Routine",
   "start": "21:30",
   "mins": 30,
   "projectId": "wellness",
   "blockId": "k-night",
   "kind": "routine",
   "pin": true
  },
  {
   "id": "a12",
   "day": 4,
   "label": "Night Routine",
   "start": "21:30",
   "mins": 30,
   "projectId": "wellness",
   "blockId": "k-night",
   "kind": "routine",
   "pin": true
  },
  {
   "id": "a13",
   "day": 5,
   "label": "Night Routine",
   "start": "21:30",
   "mins": 30,
   "projectId": "wellness",
   "blockId": "k-night",
   "kind": "routine",
   "pin": true
  },
  {
   "id": "a14",
   "day": 6,
   "label": "Night Routine",
   "start": "21:30",
   "mins": 30,
   "projectId": "wellness",
   "blockId": "k-night",
   "kind": "routine",
   "pin": true
  },
  {
   "id": "a15",
   "day": 2,
   "label": "Class — Marketing Management",
   "start": "09:00",
   "mins": 180,
   "projectId": "professional",
   "blockId": "k-classcenter",
   "kind": "class",
   "pin": true
  },
  {
   "id": "a16",
   "day": 4,
   "label": "Class — Marketing Management",
   "start": "09:00",
   "mins": 180,
   "projectId": "professional",
   "blockId": "k-classcenter",
   "kind": "class",
   "pin": true
  },
  {
   "id": "a17",
   "day": 1,
   "label": "Class — Accounting",
   "start": "13:00",
   "mins": 120,
   "projectId": "professional",
   "blockId": "k-classcenter",
   "kind": "class",
   "pin": true
  },
  {
   "id": "a18",
   "day": 3,
   "label": "Class — Accounting",
   "start": "13:00",
   "mins": 120,
   "projectId": "professional",
   "blockId": "k-classcenter",
   "kind": "class",
   "pin": true
  },
  {
   "id": "a19",
   "day": 5,
   "label": "Class — Accounting",
   "start": "13:00",
   "mins": 120,
   "projectId": "professional",
   "blockId": "k-classcenter",
   "kind": "class",
   "pin": true
  },
  {
   "id": "a20",
   "day": 1,
   "label": "Workout",
   "start": "07:00",
   "mins": 60,
   "projectId": "wellness",
   "blockId": "k-workout",
   "kind": "project",
   "pin": false
  },
  {
   "id": "a21",
   "day": 2,
   "label": "Workout",
   "start": "07:00",
   "mins": 60,
   "projectId": "wellness",
   "blockId": "k-workout",
   "kind": "project",
   "pin": false
  },
  {
   "id": "a22",
   "day": 3,
   "label": "Workout",
   "start": "07:00",
   "mins": 60,
   "projectId": "wellness",
   "blockId": "k-workout",
   "kind": "project",
   "pin": false
  },
  {
   "id": "a23",
   "day": 4,
   "label": "Workout",
   "start": "07:00",
   "mins": 60,
   "projectId": "wellness",
   "blockId": "k-workout",
   "kind": "project",
   "pin": false
  },
  {
   "id": "a24",
   "day": 6,
   "label": "Workout",
   "start": "07:00",
   "mins": 60,
   "projectId": "wellness",
   "blockId": "k-workout",
   "kind": "project",
   "pin": false
  },
  {
   "id": "a25",
   "day": 0,
   "label": "Sunday Chores",
   "start": "10:00",
   "mins": 90,
   "projectId": "wellness",
   "blockId": "k-sunday",
   "kind": "routine",
   "pin": false
  },
  {
   "id": "a26",
   "day": 0,
   "label": "Sunday plan + progress",
   "start": "17:00",
   "mins": 45,
   "projectId": null,
   "blockId": null,
   "kind": "ritual",
   "pin": false
  }
 ],
 "routines": [
  {
   "id": "r001",
   "name": "Brush teeth",
   "period": "daily",
   "part": "Morning"
  },
  {
   "id": "r002",
   "name": "Vitamin C serum",
   "period": "daily",
   "part": "Morning"
  },
  {
   "id": "r003",
   "name": "SPF lotion",
   "period": "daily",
   "part": "Morning"
  },
  {
   "id": "r004",
   "name": "Leave-in conditioner",
   "period": "daily",
   "part": "Morning"
  },
  {
   "id": "r005",
   "name": "Deodorant / cologne",
   "period": "daily",
   "part": "Morning"
  },
  {
   "id": "r006",
   "name": "Take Omeprazole",
   "period": "daily",
   "part": "Morning"
  },
  {
   "id": "r007",
   "name": "Take vitamins",
   "period": "daily",
   "part": "Morning"
  },
  {
   "id": "r008",
   "name": "Ice globes",
   "period": "daily",
   "part": "Morning"
  },
  {
   "id": "r009",
   "name": "Pack lunch",
   "period": "daily",
   "part": "Morning"
  },
  {
   "id": "r010",
   "name": "Floss",
   "period": "daily",
   "part": "Night",
   "days": [
    1,
    3,
    4
   ]
  },
  {
   "id": "r011",
   "name": "Brush teeth",
   "period": "daily",
   "part": "Night"
  },
  {
   "id": "r012",
   "name": "Tretinoin cream (Rx)",
   "period": "daily",
   "part": "Night"
  },
  {
   "id": "r013",
   "name": "Mouthwash",
   "period": "daily",
   "part": "Night",
   "days": [
    1,
    3,
    4
   ]
  },
  {
   "id": "r014",
   "name": "Retainer",
   "period": "daily",
   "part": "Night",
   "days": [
    1,
    3,
    4
   ]
  },
  {
   "id": "r015",
   "name": "Laundry",
   "period": "weekly",
   "part": "Sunday chores"
  },
  {
   "id": "r016",
   "name": "Take out trash — actual, both bathrooms, office",
   "period": "weekly",
   "part": "Sunday chores"
  },
  {
   "id": "r017",
   "name": "Take out recycling",
   "period": "weekly",
   "part": "Sunday chores"
  },
  {
   "id": "r018",
   "name": "Wipe down tables — living room, island, both bathrooms",
   "period": "weekly",
   "part": "Sunday chores"
  },
  {
   "id": "r019",
   "name": "Clean up office",
   "period": "weekly",
   "part": "Sunday chores"
  },
  {
   "id": "r020",
   "name": "Clean out fridge",
   "period": "weekly",
   "part": "Sunday chores"
  },
  {
   "id": "r021",
   "name": "Detour Progress",
   "period": "weekly",
   "part": "Sunday chores"
  },
  {
   "id": "r022",
   "name": "Clean water bottle",
   "period": "weekly",
   "part": "Sunday chores"
  },
  {
   "id": "r023",
   "name": "Update recipes and go grocery shopping",
   "period": "weekly",
   "part": "Sunday chores"
  },
  {
   "id": "r024",
   "name": "In the shower — shave back of neck, pluck eyebrows",
   "period": "weekly",
   "part": "Sunday chores"
  },
  {
   "id": "r025",
   "name": "Spray shoes (end of night)",
   "period": "weekly",
   "part": "Sunday chores"
  },
  {
   "id": "r026",
   "name": "EZMelts",
   "period": "monthly",
   "part": "Re-ups"
  },
  {
   "id": "r027",
   "name": "Pantene shampoo / Herbal Essences conditioner",
   "period": "monthly",
   "part": "Re-ups"
  },
  {
   "id": "r028",
   "name": "CeraVe Renewing Salicylic Acid Cleanser",
   "period": "monthly",
   "part": "Re-ups"
  },
  {
   "id": "r029",
   "name": "Tree of Life Vitamin C serum",
   "period": "monthly",
   "part": "Re-ups"
  },
  {
   "id": "r030",
   "name": "CeraVe SPF lotion",
   "period": "monthly",
   "part": "Re-ups"
  },
  {
   "id": "r031",
   "name": "Steroid cream",
   "period": "monthly",
   "part": "Re-ups"
  },
  {
   "id": "r032",
   "name": "Aquaphor tub",
   "period": "monthly",
   "part": "Re-ups"
  },
  {
   "id": "r033",
   "name": "Floss picks",
   "period": "monthly",
   "part": "Re-ups"
  },
  {
   "id": "r034",
   "name": "Shaving cream / aftershave",
   "period": "monthly",
   "part": "Re-ups"
  },
  {
   "id": "r035",
   "name": "OneBlade / safety blade / ProGlide razors",
   "period": "monthly",
   "part": "Re-ups"
  },
  {
   "id": "r036",
   "name": "ACT Anticavity Zero Alcohol Fluoride mouthwash",
   "period": "monthly",
   "part": "Re-ups"
  },
  {
   "id": "r037",
   "name": "Briogeo Farewell Frizz",
   "period": "monthly",
   "part": "Re-ups"
  },
  {
   "id": "r038",
   "name": "Lotion",
   "period": "monthly",
   "part": "Re-ups"
  },
  {
   "id": "r039",
   "name": "Review the doctor roster — anyone to contact this month?",
   "period": "monthly",
   "part": "Doctors",
   "note": "Immunologist Dr. Evelyn Angulo · Podiatrist Mark Berman · Primary care Dr. Bhojwani · Dentist Dr. Mullarky · Orthodontist Weintraub & Eltink · Skin Dr. Nicolai Kessler · Chiropractor Dr. Brian Marion · PT Dr. Lauren Schnidman · Nutritionist Michael Glab"
  },
  {
   "id": "r040",
   "name": "Scrape tongue",
   "period": "monthly",
   "part": "Trimming"
  },
  {
   "id": "r041",
   "name": "Legs — 2.5 inch",
   "period": "monthly",
   "part": "Trimming"
  },
  {
   "id": "r042",
   "name": "Arms — 2.5 inch",
   "period": "monthly",
   "part": "Trimming"
  },
  {
   "id": "r043",
   "name": "Armpits — no guard",
   "period": "monthly",
   "part": "Trimming"
  },
  {
   "id": "r044",
   "name": "Chest — no guard",
   "period": "monthly",
   "part": "Trimming"
  },
  {
   "id": "r045",
   "name": "Full trim — neck",
   "period": "monthly",
   "part": "Trimming"
  },
  {
   "id": "r046",
   "name": "Full trim — shoulders",
   "period": "monthly",
   "part": "Trimming"
  },
  {
   "id": "r047",
   "name": "Full trim — groin",
   "period": "monthly",
   "part": "Trimming"
  },
  {
   "id": "r048",
   "name": "Full trim — nose",
   "period": "monthly",
   "part": "Trimming"
  },
  {
   "id": "r049",
   "name": "Swiffer floor",
   "period": "monthly",
   "part": "Cleaning"
  },
  {
   "id": "r050",
   "name": "Dust off room, including the fan",
   "period": "monthly",
   "part": "Cleaning"
  },
  {
   "id": "r051",
   "name": "Wash pillowcases and bedsheet",
   "period": "monthly",
   "part": "Cleaning"
  },
  {
   "id": "r052",
   "name": "Change toothbrush head",
   "period": "monthly",
   "part": "Cleaning",
   "note": "March, June, September, December"
  },
  {
   "id": "r053",
   "name": "Change razors — ProGlide and safety; Norelco with the toothbrush head",
   "period": "monthly",
   "part": "Cleaning"
  },
  {
   "id": "r054",
   "name": "Budget sheet",
   "period": "monthly",
   "part": "Monthly Detour projects"
  },
  {
   "id": "r055",
   "name": "Pay rent",
   "period": "monthly",
   "part": "Monthly Detour projects"
  },
  {
   "id": "r056",
   "name": "Update workout spreadsheet",
   "period": "monthly",
   "part": "Monthly Detour projects"
  },
  {
   "id": "r057",
   "name": "Cleaning service",
   "period": "biannual",
   "part": "Cleaning"
  },
  {
   "id": "r058",
   "name": "Update the Detour Museum",
   "period": "biannual",
   "part": "Detour projects"
  },
  {
   "id": "r059",
   "name": "Ensure refined tasks and milestones are updated and finalised",
   "period": "biannual",
   "part": "Detour projects"
  },
  {
   "id": "r060",
   "name": "Update the RFRA file",
   "period": "biannual",
   "part": "Detour projects"
  },
  {
   "id": "r061",
   "name": "Update the Archive spreadsheet, Libib and the other online media platforms",
   "period": "biannual",
   "part": "Detour projects"
  },
  {
   "id": "r062",
   "name": "Memoir text archive — save everything down, delete everything a year old or more",
   "period": "biannual",
   "part": "Detour projects",
   "note": "May take the whole of June / December. Try to finish inside a month."
  },
  {
   "id": "r063",
   "name": "Media inventory — sell off media you no longer want",
   "period": "biannual",
   "part": "Detour projects"
  },
  {
   "id": "r064",
   "name": "Clothes — donate what you no longer wear",
   "period": "biannual",
   "part": "Detour projects"
  },
  {
   "id": "r065",
   "name": "Update the decluttering spreadsheet and follow the routine",
   "period": "biannual",
   "part": "Decluttering"
  },
  {
   "id": "r066",
   "name": "Clean up emails and passwords",
   "period": "biannual",
   "part": "Decluttering"
  },
  {
   "id": "r067",
   "name": "File cleaning on computer, storages and drives — write out a routine for this",
   "period": "biannual",
   "part": "Decluttering"
  },
  {
   "id": "r068",
   "name": "Detour Memento",
   "period": "biannual",
   "part": "Memento"
  }
 ],
 "blockRoutines": {
  "k-anderson": [
   {
    "id": "s1",
    "text": "Update the task tracker"
   },
   {
    "id": "s2",
    "text": "Canvas alignment — announcements and assignments"
   },
   {
    "id": "s3",
    "text": "Communication catch-up — email, WhatsApp, Slack, LinkedIn, networking tracker"
   },
   {
    "id": "s4",
    "text": "Run the 3-2-1 check on everything due this week"
   },
   {
    "id": "s5",
    "text": "Put anything new straight onto WWW, then stop"
   }
  ]
 },
 "ninety": [
  {
   "id": "n01",
   "n": "01",
   "title": "Complete the StudioVault beta.",
   "when": "September",
   "detail": "Chicago Era ideas plus the ingestion agent and the Underground Hip Hop Researcher focus. Everything else in StudioVault waits behind it.",
   "done": false
  },
  {
   "id": "n02",
   "n": "02",
   "title": "Finalise Memento 21.",
   "when": "End of Summer Quarter",
   "detail": "The quarter's reflection and the goals that follow it. This is where the field plan gets rewritten.",
   "done": false
  },
  {
   "id": "n03",
   "n": "03",
   "title": "Release TGNS and SWAGBOYS.",
   "when": "October",
   "detail": "Both collaborations. A release date only exists once another person is expecting it.",
   "done": false
  },
  {
   "id": "n04",
   "n": "04",
   "title": "Secure a paid underground music position.",
   "when": "October",
   "detail": "Pay or a title. The milestone that makes the Professional Project real.",
   "done": false
  },
  {
   "id": "n05",
   "n": "05",
   "title": "The ninety-day Anderson push.",
   "when": "By end of October",
   "detail": "Student org applications in, Lyn's coffee chats done, three centers met, and a BCC plan agreed with Prof. Wu.",
   "done": false
  }
 ],
 "mementos": [
  {
   "n": 21,
   "label": "End of Summer Quarter",
   "due": "2026-09-25"
  },
  {
   "n": 22,
   "label": "End of Fall Quarter",
   "due": "2026-12-18"
  },
  {
   "n": 23,
   "label": "End of Winter Quarter",
   "due": "2027-03-19"
  },
  {
   "n": 24,
   "label": "End of Spring Quarter",
   "due": "2027-06-11"
  },
  {
   "n": 25,
   "label": "End of Summer 2027",
   "due": "2027-09-24"
  },
  {
   "n": 26,
   "label": "End of Fall Quarter 2027",
   "due": "2027-12-17"
  },
  {
   "n": 27,
   "label": "Graduation",
   "due": "2028-05-31"
  }
 ],
 "settings": {
  "weekday": {
   "start": "07:00",
   "end": "22:00"
  },
  "weekend": {
   "start": "08:30",
   "end": "23:00"
  },
  "density": 0.75,
  "bufferMins": 60,
  "ceilingHrs": 20,
  "minSession": 30,
  "minTask": 15,
  "showMetersOn": "sunday"
 }
};
