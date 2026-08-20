/**
 * One-time fetch of real employer geography from OpenStreetMap (Overpass
 * API), for the Vellore/Katpadi demo area. Writes data/employers.json.
 *
 * This is a BUILD-TIME data generator, same category as scripts/gen_jobs.py
 * and scripts/gen_skills.py — it does not run as part of the app, and the
 * app must NEVER call Overpass at runtime (CLAUDE.md §11: the demo must run
 * with no network). Run this once, commit the output, done.
 *
 * Categories queried (OSM tag -> lib/types.ts EmployerType):
 *   shop=bakery                          -> "bakery"
 *   amenity=pharmacy                     -> "pharmacy"
 *   shop=car_repair, shop=motorcycle_repair, shop=tyres -> "auto_workshop"
 *                                          (shop=car / shop=motorcycle are dealerships,
 *                                           not repair, and are deliberately excluded)
 *   amenity=restaurant, amenity=fast_food -> "hotel"   (local usage: "hotel" == eatery,
 *                                                        see scripts/gen_jobs.py's own
 *                                                        "Hotel Aryaas" / "Saravana Mess")
 *   shop=hairdresser                     -> "salon"
 *   shop=convenience                     -> "kirana"
 *
 * Entries with no `name` tag are skipped — an unnamed pin is useless for a
 * candidate deciding where to apply, and CLAUDE.md §6 wants everything on
 * screen to be honest about what it is.
 *
 * Run with: npx tsx scripts/fetch-employers.ts
 */

import { writeFileSync } from "node:fs";
import path from "node:path";
import type { Employer, EmployerType } from "../lib/types";

const CENTER = { lat: 12.9698, lng: 79.1325 }; // Katpadi
const RADIUS_M = 6000;
const OVERPASS_ENDPOINT = "https://maps.mail.ru/osm/tools/overpass/api/interpreter";
const OUTPUT_PATH = path.join(process.cwd(), "data", "employers.json");

/** Each rule: an OSM (key, value) pair and the EmployerType it maps to. */
const RULES: Array<{ key: string; value: string; employerType: EmployerType }> = [
  { key: "shop", value: "bakery", employerType: "bakery" },
  { key: "amenity", value: "pharmacy", employerType: "pharmacy" },
  { key: "shop", value: "car_repair", employerType: "auto_workshop" },
  { key: "shop", value: "motorcycle_repair", employerType: "auto_workshop" },
  // shop=car / shop=motorcycle are dealerships, not repair — deliberately excluded.
  // shop=tyres genuinely does repair work locally (several OSM entries here carry
  // an explicit car:repair=yes tag alongside it) so it's included.
  { key: "shop", value: "tyres", employerType: "auto_workshop" },
  { key: "amenity", value: "restaurant", employerType: "hotel" },
  { key: "amenity", value: "fast_food", employerType: "hotel" },
  { key: "shop", value: "hairdresser", employerType: "salon" },
  { key: "shop", value: "convenience", employerType: "kirana" },
];

function buildQuery(): string {
  const clauses = RULES.flatMap(({ key, value }) => [
    `  node["${key}"="${value}"](around:${RADIUS_M},${CENTER.lat},${CENTER.lng});`,
    `  way["${key}"="${value}"](around:${RADIUS_M},${CENTER.lat},${CENTER.lng});`,
  ]).join("\n");

  return `[out:json][timeout:90];\n(\n${clauses}\n);\nout center tags;`;
}

interface OverpassElement {
  type: "node" | "way" | "relation";
  id: number;
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags?: Record<string, string>;
}

interface OverpassResponse {
  elements: OverpassElement[];
}

function employerTypeFor(tags: Record<string, string>): { employerType: EmployerType; osmType: string } | null {
  for (const rule of RULES) {
    if (tags[rule.key] === rule.value) {
      return { employerType: rule.employerType, osmType: `${rule.key}=${rule.value}` };
    }
  }
  return null;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchWithRetry(query: string, attempts = 3): Promise<OverpassResponse> {
  let lastError: unknown = null;
  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      const response = await fetch(OVERPASS_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: `data=${encodeURIComponent(query)}`,
        signal: AbortSignal.timeout(60000),
      });
      if (!response.ok) {
        throw new Error(`Overpass API error ${response.status}: ${await response.text()}`);
      }
      return (await response.json()) as OverpassResponse;
    } catch (err) {
      lastError = err;
      console.log(`  attempt ${attempt}/${attempts} failed: ${err instanceof Error ? err.message : err}`);
      if (attempt < attempts) await sleep(3000 * attempt);
    }
  }
  throw new Error(`Overpass API unreachable after ${attempts} attempts: ${lastError}`);
}

async function main() {
  const query = buildQuery();
  console.log("Querying Overpass API...");

  const data = await fetchWithRetry(query);
  console.log(`Overpass returned ${data.elements.length} raw elements.`);

  const seen = new Map<string, Employer>();
  let skippedNoName = 0;
  let skippedNoTag = 0;
  let skippedNoLocation = 0;

  for (const el of data.elements) {
    const tags = el.tags ?? {};
    const name = tags.name?.trim();
    if (!name) {
      skippedNoName++;
      continue;
    }

    const match = employerTypeFor(tags);
    if (!match) {
      skippedNoTag++;
      continue;
    }

    const lat = el.lat ?? el.center?.lat;
    const lng = el.lon ?? el.center?.lon;
    if (lat === undefined || lng === undefined) {
      skippedNoLocation++;
      continue;
    }

    const id = `OSM_${el.type.toUpperCase()}_${el.id}`;
    // A single OSM element could theoretically match more than one rule
    // (e.g. shop=bakery + amenity=cafe on the same node) — first rule wins,
    // dedup by id keeps it to one entry.
    if (!seen.has(id)) {
      seen.set(id, {
        id,
        name,
        osmType: match.osmType,
        lat,
        lng,
        employerType: match.employerType,
      });
    }
  }

  const employers = [...seen.values()].sort((a, b) => a.id.localeCompare(b.id));

  writeFileSync(OUTPUT_PATH, JSON.stringify(employers, null, 2) + "\n", "utf-8");

  console.log(`\nWrote ${employers.length} employers to ${OUTPUT_PATH}`);
  console.log(`Skipped: ${skippedNoName} with no name, ${skippedNoTag} with no matching tag, ${skippedNoLocation} with no location.`);

  const counts = new Map<EmployerType, number>();
  for (const e of employers) counts.set(e.employerType, (counts.get(e.employerType) ?? 0) + 1);
  console.log("By type:", Object.fromEntries(counts));
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
