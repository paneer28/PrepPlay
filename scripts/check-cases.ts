// Generates roleplay cases for every event and difficulty and checks each one.
// Run: npm run check:cases
import { getPracticeOptions } from "@/lib/data";
import { candidatesFor, validateCase, writeCase } from "@/lib/roleplay/write-case";
import type { RoleplayRequest } from "@/types";

const PER_DIFFICULTY = Number(process.env.CASES ?? 5);
const options = getPracticeOptions();
let failures = 0;
let total = 0;

for (const event of options.events) {
  const candidates = candidatesFor(event, 7);
  if (candidatesFor(event, 3).length === 0) {
    console.log(`NO THEMES  ${event.id}`);
    failures += 1;
    continue;
  }
  for (const difficulty of ["easy", "medium", "hard"] as const) {
    for (let i = 0; i < PER_DIFFICULTY; i += 1) {
      // Every PI count the roleplay form offers, round robin.
      const pis = 3 + ((i + ["easy", "medium", "hard"].indexOf(difficulty)) % 5);
      const request: RoleplayRequest = {
        eventId: event.id,
        clusterId: event.clusterId,
        difficulty,
        industry: "",
        instructionalAreaPreference: "",
        specificPerformanceIndicatorIds: [],
        numberOfPis: pis
      };
      const roleplay = writeCase(request);
      const problems = validateCase(roleplay, pis);
      total += 1;
      if (problems.length) {
        failures += 1;
        console.log(`FAIL ${event.id} ${difficulty}: ${problems.join(", ")}\n  ${roleplay.caseTitle}`);
      }
    }
  }
  console.log(`ok   ${event.id.padEnd(24)} ${candidates.length} themes · ${[...new Set(candidates.map((c) => c.theme.area))].join(", ")}`);
}

if (process.env.SHOW) {
  for (const id of process.env.SHOW.split(",")) {
    for (const difficulty of ["easy", "medium", "hard"] as const) {
      const event = options.events.find((item) => item.id === id)!;
      const roleplay = writeCase({ eventId: id, clusterId: event.clusterId, difficulty, industry: "", instructionalAreaPreference: "", specificPerformanceIndicatorIds: [], numberOfPis: 5 });
      console.log(`\n=== ${id} · ${difficulty} · ${roleplay.caseTitle}\n${roleplay.eventSituation}\nPIs: ${roleplay.performanceIndicators.map((pi) => `${pi.code} ${pi.text}`).join(" | ")}`);
    }
  }
}

console.log(`\n${total - failures}/${total} cases passed`);
process.exit(failures ? 1 : 0);
