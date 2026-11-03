#!/usr/bin/env node
// .agents/skills is the source of truth (Codex reads it). Claude Code reads .claude/skills,
// so this copies every skill there. Run after editing a skill: `node .agents/sync-skills.mjs`.
// `--check` exits 1 if the copies differ (use in CI or before committing).
import { cpSync, existsSync, mkdirSync, readdirSync, readFileSync, rmSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { execSync } from "node:child_process";

const root = execSync("git rev-parse --show-toplevel", { encoding: "utf8" }).trim();
const src = join(root, ".agents", "skills");
const dst = join(root, ".claude", "skills");
const check = process.argv.includes("--check");
const walk = (d) => (existsSync(d) ? readdirSync(d).flatMap((n) => {
  const p = join(d, n); return statSync(p).isDirectory() ? walk(p) : [p];
}) : []);
const norm = (p) => readFileSync(p, "utf8").replace(/\r\n/g, "\n");
const skills = existsSync(src) ? readdirSync(src).filter((n) => statSync(join(src, n)).isDirectory()) : [];

if (check) {
  const bad = [];
  for (const s of skills) {
    const a = walk(join(src, s)).map((p) => relative(join(src, s), p));
    const b = walk(join(dst, s)).map((p) => relative(join(dst, s), p));
    for (const f of new Set([...a, ...b])) {
      const pa = join(src, s, f), pb = join(dst, s, f);
      if (!existsSync(pa) || !existsSync(pb) || norm(pa) !== norm(pb)) bad.push(`${s}/${f}`);
    }
  }
  if (bad.length) { console.error("Out of sync (run node .agents/sync-skills.mjs):\n  " + bad.join("\n  ")); process.exit(1); }
  console.log(`skills in sync (${skills.length})`);
} else {
  mkdirSync(dst, { recursive: true });
  for (const s of skills) { rmSync(join(dst, s), { recursive: true, force: true }); cpSync(join(src, s), join(dst, s), { recursive: true }); }
  console.log(`synced ${skills.length} skill(s) to .claude/skills`);
}
