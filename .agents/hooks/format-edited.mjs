#!/usr/bin/env node
// Shared PostToolUse hook for Claude Code and Codex: formats files the agent just edited.
// Claude sends tool_input.file_path; Codex sends an apply_patch body in tool_input.command.
// Configure FORMATTERS below per repo. Always exits 0 so a missing tool never blocks the agent.
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { extname, isAbsolute, resolve } from "node:path";

// extension -> list of commands; "{file}" is replaced with the absolute path.
const PRETTIER = [["node", "node_modules/prettier/bin/prettier.cjs", "--write", "--ignore-unknown", "{file}"]];
const RUFF = [["uv", "run", "--project", "raw_models", "ruff", "format", "{file}"]];
const FORMATTERS = {
  ...Object.fromEntries([".ts", ".js", ".mjs", ".json", ".css", ".html", ".yml", ".yaml"].map((ext) => [ext, PRETTIER])),
  ".py": RUFF,
};

let input = {};
try { input = JSON.parse(readFileSync(0, "utf8") || "{}"); } catch { process.exit(0); }
const root = spawnSync("git", ["rev-parse", "--show-toplevel"], { encoding: "utf8" }).stdout?.trim() || process.cwd();
const base = input.cwd || root;
const ti = input.tool_input || {};
const files = new Set();
for (const k of ["file_path", "path"]) if (typeof ti[k] === "string") files.add(ti[k]);
const patch = [ti.command, ti.patch, ti.input].filter((v) => typeof v === "string").join("\n");
for (const m of patch.matchAll(/^\*\*\* (?:Add|Update) File: (.+)$/gm)) files.add(m[1].trim());
for (const m of patch.matchAll(/^\*\*\* Move to: (.+)$/gm)) files.add(m[1].trim());

for (const f of files) {
  const abs = isAbsolute(f) ? f : resolve(base, f);
  const cmds = FORMATTERS[extname(abs).toLowerCase()];
  if (!cmds || !existsSync(abs)) continue;
  for (const [cmd, ...args] of cmds) {
    spawnSync(cmd, args.map((a) => a.replace("{file}", abs)), { cwd: root, stdio: "ignore", shell: false });
  }
}
process.exit(0);
