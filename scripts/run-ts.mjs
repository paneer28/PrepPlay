// Runs a TypeScript script with the app's "@/..." imports resolved.
// Usage: node scripts/run-ts.mjs scripts/some-script.ts [args]
import path from "node:path";
import { createJiti } from "jiti";

const jiti = createJiti(import.meta.url, { alias: { "@": process.cwd() } });
await jiti.import(path.resolve(process.argv[2]));
