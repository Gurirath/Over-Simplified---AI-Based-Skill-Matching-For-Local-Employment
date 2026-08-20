\# REACH — Project Brief



Read this fully before writing any code. This file is the standing contract for

the project. It overrides your defaults and your instincts about how a job-matching

app "should" work. Several rules below are deliberately non-standard.



\---



\## 1. What we are building



A local employment system for workers who have no formal resume.



It does three things:



1\. Turns a person's spoken life/work experience into a structured skill profile,

&#x20;  with every skill traceable to their own words.

2\. Filters local jobs by whether the person can \*\*realistically take them\*\* —

&#x20;  salary floor, commute, shift overlap, transport — not just by distance.

3\. Computes the \*\*minimum-effort skill acquisition\*\* that maximally expands that

&#x20;  person's set of reachable jobs.



The product thesis in one number: \*jobs unlocked per 10 hours of study.\*



This is a 10-hour hackathon build. Optimize for a working demo and defensible

technical claims, not for production robustness.



\---



\## 2. Architecture — the LLM lives at the edges only



There are exactly \*\*two\*\* LLM calls in the entire system, both at ingestion:



1\. Candidate story -> structured skill claims with evidence spans

2\. Employer paragraph -> structured job requirement object



After ingestion, \*\*no LLM is involved\*\*. Matching, feasibility, gap analysis,

jobs-unlocked and next-best-skill are deterministic set operations and arithmetic

over a fixed skill taxonomy.



Do not add LLM calls anywhere else. Do not add a chatbot. Do not "use the model

to rank" or "use the model to explain." Every number on screen must trace to a

set operation.



Reasons: zero demo latency, determinism under demo conditions, and explanations

that survive questioning.



\---



\## 3. Matching is two stages. Never blend them.



\*\*Stage 1 — Feasibility gate. Boolean. No scoring.\*\*



A job is infeasible if ANY of these fire:



\- offered `salaryMax` < candidate `minMonthlySalary`

\- estimated one-way commute > `maxCommuteMinutes`

\- shift/availability overlap insufficient

\- weekly hours below the candidate's `minHoursPerWeek`

\- no available transport mode reaches it in time

\- a `hardEligibility` requirement is unmet



`schedule_conflict` fires unless the candidate's window covers >=75% of the

shift duration and >=50% of the shift's rostered days. Not full containment

(too strict — excludes workable partial shifts) and not any-overlap (too loose

— a 9-6 job would pass for someone free only 5-9).



Output: the `feasible` job set. This set is the \*\*denominator for everything

else\*\*, including jobs-unlocked.



\*\*Stage 2 — Score only the survivors.\*\*



Weighted sum of: skill coverage, experience relevance, commute margin, salary

headroom, schedule comfort. Weights live in `ScoreWeights` and are exposed as

UI sliders.



\*\*Do not\*\* collapse Stage 1 into Stage 2 as low weights. A job paying below

someone's floor is not a weak match — it is not a match. If you find yourself

writing a single weighted formula that includes salary floor or max commute,

you have made a mistake.



\---



\## 4. The optimizer: exact enumeration, NOT greedy



For candidate skill set `S` and feasible job set `F`:



```

missing(j)      = requiredSkills(j) \\ S

qualified(S)    = { j in F : missing(j) is empty }

f(T)            = | { j in F : missing(j) is a subset of T } |

```



Next-best-skill for budget k = choose T with |T| <= k maximizing f(T).



\*\*Critical:\*\* `f` is monotone but \*\*not submodular\*\*. It has increasing returns.

If a job requires both Tally and GST, learning Tally alone unlocks zero jobs and

learning GST alone unlocks zero, but learning both unlocks the job. A greedy

algorithm sees two zero-gain moves and picks neither — it recommends the wrong

skill. The standard (1 - 1/e) greedy guarantee does not apply here.



So the implementation is:



1\. Prune the skill universe to skills appearing in at least one `missing(j)`.

&#x20;  Realistically 25-45 skills, not 120.

2\. For k <= 3, enumerate all subsets exactly. C(40,3) is about 9,880 subsets,

&#x20;  each an O(|F|) check. Milliseconds. No approximation needed.

3\. Rank by `jobsUnlocked / totalLearnHours`, tie-break on median salary of the

&#x20;  newly unlocked set.

4\. Also compute the \*\*near-miss frontier\*\*: feasible jobs where exactly one

&#x20;  required skill is missing.



Do not replace this with a greedy loop, a heuristic, or an LLM call, however

much more idiomatic that feels. The exactness is the technical contribution.



\---



\## 5. Evidence tiers, not confidence scores



\*\*There are no numeric confidence percentages anywhere in this system.\*\*

Not in the data model, not in the LLM output schema, not in the UI.



An LLM-emitted "91%" is an uncalibrated hallucinated number and it is

indefensible under questioning.



Use three tiers instead:



\- `stated` — the user named the skill directly

\- `demonstrated` — the user described the activity, not the skill

\- `implied` — inferred from role context



Every claim carries an `evidenceSpan`: the exact verbatim substring of the

user's own input it came from, plus character offsets so the UI can highlight it.

If the model returns a span that does not appear verbatim in the input, drop

the claim.



\*\*Micro-verification:\*\* for each `implied` claim, generate one concrete yes/no

question. A yes promotes the tier and sets `userConfirmed`. This is a required

feature, not a nice-to-have — it is what makes the profile an interactive

artifact instead of a static model dump.



\---



\## 6. Data



\- All data lives in JSON files imported at build time. \*\*No database.\*\*

\- `skills.json` — \~120 skills. Build this FIRST; it unblocks everything.

\- `jobs.json` — 200-300 synthetic listings for the Vellore / Katpadi area.

\- Salary bands must be realistic for the local informal sector: roughly

&#x20; Rs 9,000-22,000/month. Shifts must be realistic (evening bakery counter,

&#x20; morning kirana, split-shift hotel).

\- The UI must display a visible chip labelling the corpus as synthetic, with

&#x20; its size and area. \*\*Never hide this.\*\* We defend it honestly.

\- Alias normalization must handle Hinglish surface forms

&#x20; ("tally chalana", "excel banata hoon", "customer handle karna").



\---



\## 7. Design



\- Monochrome. One accent colour, used sparingly. Generous whitespace.

\- No gradient heroes, no purple, no glassmorphism, no emoji in the UI chrome.

\- Numbers are the visual hierarchy. The headline metric

&#x20; (`jobs unlocked per 10 hours`) is the largest element on the simulator screen.

\- Restraint reads as competence. If a screen looks like a generic AI startup

&#x20; landing page, it is wrong.



\---



\## 8. Stack



\- Next.js + TypeScript (App Router), single app, deployed on Vercel.

\- Tailwind + shadcn/ui.

\- LLM calls in Next.js API routes only, so keys stay server-side.

\- Pure logic lives in `lib/` as side-effect-free functions with unit tests.



There is \*\*no `src/` directory\*\* in this project. Layout:



```

CLAUDE.md          <- this file

app/               <- routes, pages, API routes

lib/types.ts       <- the type contract. Read it before writing anything.

lib/               <- pure logic: feasibility, scoring, commute, optimizer

data/              <- skills.json, jobs.json, personas, cached LLM responses

```



\---



\## 9. Hard cut list — do not build these



Even if asked casually, even if it seems like an obvious addition:



1\. Authentication or user accounts — use a persona switcher dropdown

2\. Any database or ORM

3\. Real map / routing / geocoding APIs — use the haversine estimator

4\. Resume or PDF upload (it contradicts the entire resume-less thesis)

5\. A chatbot interface

6\. Course recommendations or learning-platform integrations

7\. Mobile app, dark mode toggle, i18n framework, analytics

8\. Email, notifications, or anything requiring a third-party account



Ask before adding any dependency not already in package.json.



\---



\## 10. Commute estimation



No routing API. Use:



\- `roadKm = haversineKm \* 1.35`

\- mode speeds: walk 4.5 km/h, cycle 12, bus 16 (includes waiting), two\_wheeler 24

\- fixed 8-minute first/last-mile penalty added to every estimate

\- pick the fastest mode available in `candidate.constraints.availableModes`



Keep this isolated in one function so it can be swapped for a routing API later.

Label it in the UI as an estimate.



\---



\## 11. Demo safety



\- Cache every LLM response for the demo personas to disk and \*\*commit the cache\*\*.

&#x20; The demo must run with no network. Hackathon wifi fails at the worst moment.

\- Seed 3 demo personas with fixed IDs.

\- Validate every LLM response against its JSON schema; retry once on malformed

&#x20; output, then fall back to the cached response.



\---



\## 12. Eval harness



Build a small eval: 12 hand-labelled candidate stories in realistic mixed

Hindi-English phrasing, with ground-truth skill IDs. Report precision, recall

and F1 as a table.



Also run an ablation: extraction with alias normalization vs without. Report

both rows. This proves the taxonomy work was necessary.



Report the real numbers even if they are mediocre. Do not tune the eval set to

flatter the system.



\---



\## 13. How to work with me



1\. Follow `lib/types.ts` exactly. If a type needs to change, say so explicitly and

&#x20;  loudly — three other people are coding against it in parallel.

2\. Do not add functionality I did not ask for. Build the requested thing, then

&#x20;  stop and tell me what you would add next.

3\. Write unit tests alongside the pure functions in `lib/`. The scoring

&#x20;  weights will be refactored late; tests are what make that a 5-minute change.

4\. If a requirement here conflicts with what seems like best practice, follow

&#x20;  this file and flag the conflict. Several rules above are deliberate

&#x20;  departures from the obvious approach.

5\. Prefer small, reviewable diffs. Do not rewrite files you were not asked

&#x20;  to touch.

6\. If something in this file is ambiguous, ask rather than guessing.



\---



\## 14. What we claim, and what we do not



Do not claim novelty for: AI job recommendations, skill-based matching, NLP

skill extraction, explainable matching, AI-generated job descriptions, or

location filtering. LinkedIn, Naukri and Indeed all do these. Any copy in the

UI or README claiming otherwise is a bug.



The defensible claim is the objective function:



> Existing platforms optimize matching people to available jobs. Reach optimizes

> the marginal expansion of a specific person's feasible opportunity set —

> extracting skills from spoken experience with traceable evidence, filtering

> the local job pool by real-world feasibility rather than location alone, and

> computing the minimum-effort skill acquisition that maximally expands the set

> of jobs that person can actually take.




<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
