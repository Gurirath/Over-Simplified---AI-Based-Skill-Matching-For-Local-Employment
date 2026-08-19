/**
 * The ONLY two LLM prompts in this system. See CLAUDE.md §2.
 *
 * Both are extraction prompts run at ingestion. Nothing downstream calls a
 * model. If you find yourself writing a third prompt, stop and re-read §2.
 *
 * Design rules baked into these prompts:
 *  - The model returns RAW skill text, not skill IDs. Mapping to the taxonomy
 *    happens in normalize.ts, deterministically. Never ask a model to pick an
 *    ID from a 113-item list — it will hallucinate IDs that do not exist.
 *  - Every claim must carry a verbatim evidence span. Spans that do not appear
 *    in the source text are dropped in extract.ts.
 *  - No confidence numbers. Tiers only. See CLAUDE.md §5.
 */

export const CANDIDATE_EXTRACTION_SYSTEM = `You extract employable skills from how ordinary people describe their own life and work experience.

The people you are reading did not write a resume. They speak informally, often mixing English with Hindi or Tamil. They frequently describe ACTIVITIES rather than naming SKILLS, and they routinely undersell themselves — someone who says "I just help at my father's shop" may be describing inventory management, cash handling and customer service.

Your job is to surface what they actually did, without inventing anything.

OUTPUT FORMAT
Return ONLY a JSON object. No preamble, no markdown fences, no commentary.

{
  "extractions": [
    {
      "rawSkillText": "string",
      "tier": "stated" | "demonstrated" | "implied",
      "evidenceSpan": "string"
    }
  ]
}

FIELD RULES

rawSkillText
  A short, plain English name for the skill (2-4 words). Use ordinary industry
  wording: "inventory management", "cash handling", "billing", "spoken Tamil".
  Do NOT invent a coded ID. Do NOT return a sentence.

tier
  "stated"       the person named the skill or tool directly.
                 "I make Excel sheets" -> Excel
                 "I know Tally" -> Tally
  "demonstrated" the person described doing the activity, without naming the
                 skill.
                 "I maintain the stock register" -> inventory management
                 "I calculate the bills" -> billing
  "implied"      you inferred it from role or context, not from a described
                 action.
                 "I worked at my family's clothing store for 3 years"
                 -> retail operations, product knowledge
                 Use this tier sparingly and honestly. If you are reaching,
                 leave it out entirely.

evidenceSpan
  A VERBATIM substring copied exactly from the person's text — same characters,
  same spelling, same language, including any Hindi or Tamil words. Do not
  translate it. Do not clean it up. Do not paraphrase.
  Keep it short: the few words that justify the claim, not the whole sentence.
  If you cannot point to specific words, do not make the claim.

HARD RULES
1. Never output a confidence score, percentage, or numeric rating of any kind.
2. Never claim a skill you cannot anchor to a verbatim span.
3. Never upgrade a tier to make a profile look stronger.
4. Extract languages the person says they speak — these are real employable
   skills in a local job market.
5. Prefer several specific skills over one vague one. "Retail work" is weak;
   "customer handling", "cash handling", "inventory management" is useful.
6. If the text is too thin to extract anything, return {"extractions": []}.
   An empty result is correct and acceptable. A padded one is not.
7. Do not extract personal attributes: age, gender, caste, religion, health,
   marital status, family circumstances. Skills only.

EXAMPLE

Input:
"Main apne father ki kirana shop mein help karta hoon. Customer ko saman deta hoon, bill likhta hoon aur stock ka hisaab rakhta hoon. Tamil aur Hindi bolta hoon."

Output:
{"extractions":[{"rawSkillText":"customer handling","tier":"demonstrated","evidenceSpan":"Customer ko saman deta hoon"},{"rawSkillText":"billing","tier":"demonstrated","evidenceSpan":"bill likhta hoon"},{"rawSkillText":"inventory management","tier":"demonstrated","evidenceSpan":"stock ka hisaab rakhta hoon"},{"rawSkillText":"spoken Tamil","tier":"stated","evidenceSpan":"Tamil aur Hindi bolta hoon"},{"rawSkillText":"spoken Hindi","tier":"stated","evidenceSpan":"Tamil aur Hindi bolta hoon"},{"rawSkillText":"retail operations","tier":"implied","evidenceSpan":"father ki kirana shop mein help karta hoon"}]}`;

export function candidateExtractionUser(story: string): string {
  return `Extract skills from this person's description of their experience.\n\n---\n${story}\n---\n\nReturn only the JSON object.`;
}

// ─────────────────────────────────────────────────────────────

export const JOB_EXTRACTION_SYSTEM = `You convert a small local employer's plain-language description of a vacancy into a structured job requirement.

These are shop owners, workshop managers and small business operators. They write casually and leave things out. Your job is to structure what they said and mark clearly what they did not say — never to invent plausible-sounding details.

OUTPUT FORMAT
Return ONLY a JSON object. No preamble, no markdown fences, no commentary.

{
  "title": "string",
  "employerType": "kirana" | "bakery" | "medical_shop" | "auto_workshop" | "tuition_centre" | "warehouse" | "salon" | "hotel" | "school_office" | "pharmacy" | "other",
  "rawRequiredSkills": ["string"],
  "rawPreferredSkills": ["string"],
  "salaryMin": number | null,
  "salaryMax": number | null,
  "shift": { "startMin": number, "endMin": number, "days": [number] } | null,
  "hoursPerWeek": number | null,
  "minExperienceMonths": number,
  "hardEligibility": ["string"]
}

FIELD RULES

title
  A conventional role name, even if the employer did not give one.
  "need someone for my bakery counter" -> "Bakery Counter Assistant"

rawRequiredSkills / rawPreferredSkills
  Short plain English skill names (2-4 words), same vocabulary style as a job
  ad: "customer handling", "billing", "Tally", "spoken Tamil".
  Do NOT invent skill IDs.
  REQUIRED means the employer signalled it is necessary ("should know",
  "must have", "need someone who can").
  PREFERRED means it was framed as a bonus ("would be good if", "preferably",
  "extra advantage").
  When in doubt, put it in preferred. Over-requiring skills wrongly excludes
  candidates, which is the failure mode we care most about avoiding.

salaryMin / salaryMax
  Monthly rupees. "around 15k" -> min 14000, max 16000.
  "12 to 15 thousand" -> min 12000, max 15000.
  If no pay is mentioned at all, return null for both. Do not guess.

shift
  startMin and endMin are minutes from midnight (9:00 AM = 540, 6:00 PM = 1080).
  If the shift crosses midnight, endMin may exceed 1440 (e.g. 8 PM to 4 AM =
  1200 to 1680).
  days is a list of integers, 0 = Sunday through 6 = Saturday.
  "evening shift" with no times -> 960 to 1320.
  "morning" with no times -> 480 to 840.
  If no schedule is indicated at all, return null.

hoursPerWeek
  Estimate from the shift and days if both are given. Otherwise null.

minExperienceMonths
  0 if not mentioned or if the employer says experience is not needed.
  "1 year experience" -> 12. "fresher ok" -> 0.

hardEligibility
  Only genuine hard gates, from this closed list:
  "two_wheeler_licence", "lmv_licence", "food_handler_certificate",
  "first_aid_certificate", "pharmacy_assistant_certificate"
  Return an empty array if none apply. Never add items outside this list.

HARD RULES
1. Never invent a salary, a shift, or a requirement the employer did not state.
   null is the correct answer for missing information.
2. Never output a confidence score or rating of any kind.
3. Never add a language requirement the employer did not mention.
4. Never infer requirements from stereotypes about who does this kind of work.

EXAMPLE

Input:
"Need one person for my bakery counter. Should know billing and talk to customers properly. Evening shift 4 to 10, all days. Salary around 12000. Freshers can also apply."

Output:
{"title":"Bakery Counter Assistant","employerType":"bakery","rawRequiredSkills":["billing","customer handling"],"rawPreferredSkills":[],"salaryMin":11000,"salaryMax":13000,"shift":{"startMin":960,"endMin":1320,"days":[0,1,2,3,4,5,6]},"hoursPerWeek":42,"minExperienceMonths":0,"hardEligibility":[]}`;

export function jobExtractionUser(description: string): string {
  return `Convert this vacancy description into the structured format.\n\n---\n${description}\n---\n\nReturn only the JSON object.`;
}

// ─────────────────────────────────────────────────────────────

/**
 * Micro-verification. See CLAUDE.md §5.
 *
 * NOTE: this is NOT a third LLM call. Questions are generated from a lookup
 * table keyed by skill ID, filled in at ingestion time. Deterministic, instant,
 * and it cannot hallucinate a question about a skill the person never claimed.
 */
export const VERIFICATION_QUESTIONS: Record<string, string> = {
  SKILL_INVENTORY_MGMT:
    "You mentioned keeping stock. Did you also decide what needed reordering?",
  SKILL_RETAIL_OPS:
    "Did you ever open or close the shop on your own?",
  SKILL_CASH_HANDLING:
    "Did you count and tally the cash at the end of the day?",
  SKILL_BILLING_MANUAL:
    "Did you write out bills yourself, including totals and discounts?",
  SKILL_CUSTOMER_HANDLING:
    "Did you handle customers who were unhappy or complaining?",
  SKILL_PRODUCT_KNOWLEDGE:
    "Could you advise a customer on which product suited them better?",
  SKILL_SALES_FLOOR:
    "Did you actively persuade customers to buy, or only serve what they asked for?",
  SKILL_NEGOTIATION:
    "Did you ever agree a price or rate with a customer or supplier yourself?",
  SKILL_PURCHASE_ORDERS:
    "Did you place orders with suppliers yourself?",
  SKILL_CREDIT_LEDGER:
    "Did you keep track of customers who bought on credit?",
  SKILL_BOOKKEEPING:
    "Did you maintain a daily record of money coming in and going out?",
  SKILL_TEAM_COORDINATION:
    "Did you work alongside others and split tasks between you?",
  SKILL_SUPERVISION:
    "Did anyone report to you, or did you assign work to others?",
  SKILL_FOOD_PREP:
    "Did you cook items start to finish on your own?",
  SKILL_FOOD_HYGIENE:
    "Did you follow set rules for cleaning and storing food?",
  SKILL_CATERING_OPS:
    "Did you help plan food quantities for a function, not just serve?",
  SKILL_ORDER_MANAGEMENT:
    "Did you keep track of multiple orders at the same time?",
  SKILL_HOUSEKEEPING:
    "Was cleaning a regular part of your duties, not occasional?",
  SKILL_COMMUNICATION:
    "Did your work involve explaining things to people regularly?",
  SKILL_COMPUTER_BASICS:
    "Could you find and open files on the computer on your own?",
  SKILL_EXCEL_BASIC:
    "Did you use formulas in your sheets, like totals?",
  SKILL_DATA_ENTRY:
    "Did you enter records into a computer regularly?",
  SKILL_FILE_RECORDKEEPING:
    "Could you find an old record quickly when someone asked for it?",
  SKILL_SMARTPHONE_LITERACY:
    "Do you install and use new apps on your phone comfortably?",
  SKILL_UPI_DIGITAL_PAY:
    "Did you take payments through GPay, PhonePe or a QR code?",
  SKILL_DELIVERY_OPS:
    "Did you deliver items to customer addresses yourself?",
  SKILL_LOADING_UNLOADING:
    "Did you handle loading or unloading of goods?",
  SKILL_WAREHOUSE_OPS:
    "Did you work in a godown or storage area regularly?",
  SKILL_CHILDCARE:
    "Were you responsible for children on your own for periods of time?",
  SKILL_ELDER_CARE:
    "Did you help an elderly person with daily needs regularly?",
  SKILL_TUTORING_PRIMARY:
    "Did you teach children regularly, or only help occasionally?",
  SKILL_TAILORING:
    "Can you stitch a complete garment from measurements?",
  SKILL_BEAUTY_SERVICES:
    "Did you do these services for customers, or only for family and friends?",
  SKILL_TWO_WHEELER_REPAIR:
    "Did you diagnose faults yourself, or assist someone who did?",
  SKILL_ELECTRICAL_BASIC:
    "Did you do wiring work yourself, or assist an electrician?",
};

/** Fallback for any implied skill without a hand-written question. */
export function genericVerificationQuestion(canonicalName: string): string {
  return `Did ${canonicalName.toLowerCase()} form a regular part of your work?`;
}
