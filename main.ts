// Entry program for the gta6-meme-x-01 bounty: read POST.json, verify it
// names a post on X, and copy it into the output directory.
import { copyFileSync, existsSync, mkdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const postPath = join(scriptDir, "POST.json");

if (!existsSync(postPath)) {
  console.error(`error: POST.json not found at ${postPath}`);
  process.exit(1);
}

let data: unknown;
try {
  data = JSON.parse(readFileSync(postPath, "utf8"));
} catch {
  console.error("error: POST.json is not valid JSON");
  process.exit(1);
}

if (typeof data !== "object" || data === null || Array.isArray(data)) {
  console.error('error: POST.json must be a JSON object with a "url" field');
  process.exit(1);
}

const url = (data as Record<string, unknown>).url;
if (typeof url !== "string" || !url.startsWith("https://")) {
  console.error('error: POST.json "url" must be a string starting with "https://"');
  process.exit(1);
}

let parsed: URL;
try {
  parsed = new URL(url);
} catch {
  console.error(`error: POST.json "url" is not a parseable URL: ${url}`);
  process.exit(1);
}
const host = parsed.hostname.toLowerCase();
const path = parsed.pathname;

// The bounty wants the clean canonical status link: a pasted URL often
// carries tracking parameters (e.g. ?s=46), which must be stripped first.
if (parsed.search !== "" || parsed.hash !== "") {
  console.error('error: POST.json "url" must be the clean status link, without a query string or fragment');
  process.exit(1);
}

if (host !== "x.com" && host !== "twitter.com") {
  console.error(`error: POST.json "url" must point at x.com, got host "${host}"`);
  process.exit(1);
}

const statusPath = path.match(/^\/([A-Za-z0-9_]{1,15})\/status\/(\d+)$/);
if (!statusPath) {
  console.error('error: POST.json "url" must look like https://x.com/<handle>/status/<digits>');
  process.exit(1);
}

const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? "out";
mkdirSync(outDir, { recursive: true });
copyFileSync(postPath, join(outDir, "POST.json"));
console.log(`copied POST.json -> ${join(outDir, "POST.json")} (status ${statusPath[2]})`);
