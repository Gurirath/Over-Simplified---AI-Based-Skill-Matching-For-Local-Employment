# REACH — 3-Minute Demo Script

**Scope rule: if a UI screen is not one of the 7 beats below, it does not get built.** This
document is the spec for the demo build, not a description of it after the fact. Six screens,
in this order, nothing else:

1. Story input
2. Skill profile (evidence-highlighted)
3. Verification question
4. Match summary (qualified count)
5. Job explanation panel
6. Opportunity Simulator
7. Employer vacancy input -> shortlist

Persona: **Devi R. (PERSONA_DEVI)** — the primary demo persona, and the only one of the four
seeded personas where confirming an implied claim changes her qualified count. That's the whole
reason she's the one on stage: the verification screen has to visibly *do* something.

All numbers below are current as of `scripts/design-persona-4.ts` / `scripts/check-personas.ts`
against the committed `data/jobs.json` (250-listing synthetic corpus, Vellore/Katpadi). Nothing
here is aspirational — it's what the pipeline actually outputs today.

---

## Beat 1 — Story typed in (0:00–0:25)

Type Devi's story into the candidate input screen, live, in front of the audience:

> Main last 4 saal se godown mein kaam karti hoon. Maal loading unloading khud karti hoon,
> forklift bhi chalati hoon jab zarurat padti hai. Safety rules follow karti hoon, PPE pehnti
> hoon kaam ke time. Hindi bolti hoon.

Say out loud what it means in English, for the audience: *"I've worked in a warehouse for four
years. I load and unload stock myself, I drive the forklift when needed, I follow safety rules
and wear PPE. I speak Hindi."*

Point out before submitting: she never once says a skill's name. No "warehouse operations," no
"forklift operator." She describes what she does. That's the point — this is the resume-less
thesis, not a form.

---

## Beat 2 — Skills appear, evidence highlighted (0:25–0:55)

Submit. The skill profile screen renders her 5 claims, each with its own tier and the exact
verbatim span from her story highlighted:

| Tier | Skill | Evidence span (highlighted in her own text) |
|---|---|---|
| stated | Spoken Hindi | "Hindi bolti hoon" |
| demonstrated | Forklift Operation | "forklift bhi chalati hoon" |
| demonstrated | Loading & Unloading | "Maal loading unloading khud karti hoon" |
| demonstrated | Workplace Safety Compliance | "Safety rules follow karti hoon, PPE pehnti hoon" |
| **implied** | Warehouse Operations | "godown mein kaam karti hoon" |

Say: four of these are things she said or described directly. The fifth — Warehouse Operations —
nobody stated. The system inferred it from context: four years in a godown implies she knows how
a warehouse runs, but that's an inference, not her word. It's visually distinct (different tier
badge) and it isn't counted toward her match yet. That's on purpose — see next beat.

---

## Beat 3 — The verification question surfaces (0:55–1:15)

Click into the implied claim. One question appears, generated with zero LLM calls (`lib/prompts.ts`
has one hand-written question per common implied skill):

> **"Did you work in a godown or storage area regularly?"**

Say: this is the whole reason implied claims exist as a separate tier instead of just trusting the
model's inference. We never assert a skill to an employer that the candidate hasn't confirmed
herself. One yes/no question, no essay, no second model call.

---

## Beat 4 — She confirms; qualified jumps 4 → 10 (1:15–1:35)

Click "Yes." The claim promotes from `implied` to `demonstrated`, `userConfirmed: true`, and now
counts toward her held-skill set.

The match summary updates live:

| | Pre-verification | Post-verification |
|---|---|---|
| Feasible jobs (of 250 corpus) | 139 | 139 |
| **Qualified jobs** | **4** | **10** |

Say: one yes/no answer, six more jobs she can actually take. Not a UI animation — a real
recomputation over the feasible set. The six newly-qualified jobs are all warehouse or forklift
roles that require Warehouse Operations alongside skills she already had — they were sitting one
skill away the whole time.

---

## Beat 5 — Open one job's explanation panel (1:35–2:00)

Click into **JOB_0031 — Warehouse Assistant, Vellore Logistics Hub, Arcot Road** — one of the six
that just flipped to qualified. The explanation panel shows, as plain set arithmetic, nothing else:

- **Requires:** Warehouse Operations, Loading & Unloading, Workplace Safety Compliance
- **She holds:** all three (one confirmed two clicks ago)
- **Salary:** ₹10,000–14,000/month (her floor is ₹10,000)
- **Commute:** ~16 minutes by bus from her location — within her 45-minute limit
- **Shift:** 9:00 AM–5:30 PM, Mon–Sat — inside her stated availability window

Say: every line on this panel traces to a comparison you could check by hand. No score, no
percentage — she's feasible or she isn't, and here's why.

---

## Beat 6 — Opportunity Simulator: best bundle, jobs per 10 hours (2:00–2:30)

Switch to the Opportunity Simulator. Headline metric, largest element on screen:

> **Learn Housekeeping → +8 jobs → 4.00 jobs per 10 hours of study**

Full readout: Housekeeping alone, 20 learning hours, unlocks 8 more of her 139 feasible jobs
(qualified would go from 10 to 18). Median salary across the newly-unlocked set: ₹11,125.

Say: this is the number the whole product is built around. Not "here are some jobs," not "you're
an 80% match" — a specific, falsifiable claim: 20 hours of a specific skill, 8 specific jobs,
computed by exact enumeration over the missing-skill sets of all 139 feasible jobs, not a greedy
heuristic (CLAUDE.md §4 — greedy would miss two-skill combinations with zero individual gain).

---

## Beat 7 — Employer types a vacancy, Devi appears in the shortlist (2:30–3:00)

Switch to the employer side. Type a vacancy live, plain language, the way a small warehouse owner
would actually write it:

> We need someone for our godown near Arcot Road. Work is loading and unloading stock by hand,
> keeping the warehouse organised, and following our safety rules — PPE required on the floor.
> Six days a week, 9 to 5:30. Pays 10 to 14 thousand a month.

Submit. The extraction produces:

- **Requires:** Warehouse Operations, Loading & Unloading, Workplace Safety Compliance
- **Salary:** ₹10,000–14,000/month · **Hours:** ~51/week · **Days:** Mon–Sat

Say: this is a brand-new listing, typed thirty seconds ago, that never touched the synthetic
corpus. Run the shortlist. Devi appears — same three-skill match, same commute check, computed
fresh against this exact posting. Close on that: the system didn't just find her a job that was
sitting in a spreadsheet. It reads a real vacancy and a real spoken story and does the same set
comparison either direction.

---

## Numbers reference (for slides / Q&A, not narrated live)

- Corpus: 250 synthetic listings, Vellore/Katpadi area (visible corpus chip, never hidden — CLAUDE.md §6)
- Devi: 139/250 feasible · 4 → 10 qualified (+6) after one confirmation
- Best single-skill bundle post-verification: Housekeeping, 20h, +8 jobs, 4.00 jobs/10h
- Live-typed vacancy: extracts to the exact 3-skill requirement set Devi already meets

## What is explicitly NOT in this demo

Per CLAUDE.md §9: no login/auth flow, no map view, no resume upload, no chatbot, no course
recommendations, no notifications. If a screen would be needed to explain any of those, it isn't
built for this demo, full stop.
