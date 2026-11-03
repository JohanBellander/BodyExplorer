# Body Explorer

Interactive 3D explorer of the human muscular system and skeleton in the browser. Three.js renders ~470
muscle/tendon meshes and ~200 bones built from two open anatomy datasets (BodyParts3D and Z-Anatomy); users
pick, search, filter, hide and colour structures.

## Stack
- TypeScript (strict) + Vite 8, Three.js r187, three-mesh-bvh for picking.
- Vitest (unit), Playwright (browser smoke test, uses the locally installed Chrome), ESLint 10 + typescript-eslint, Prettier.
- TypeScript is pinned to 6.0.x because typescript-eslint does not support TS 7 yet.
- Asset pipeline (`raw_models/`): Python via `uv`, plus Blender for the Z-Anatomy export.

## Layout
- `src/main.ts` — bootstrap: stage, loader, controller, UI.
- `src/scene/` — `Stage` (renderer, camera, lights, render-on-demand loop), `CameraRig` (views, focus, animation).
- `src/model/` — `loadBody` (GLB → typed `PartMesh`es + BVH), `materials` (`MaterialLibrary.resolve` derives a mesh's material from state), `names` (display names), `types`.
- `src/app/` — `BodyController` (single owner of selection/visibility/colour state; UI subscribes to it), `search`.
- `src/interaction/picking.ts` — hover/click raycasting; click vs drag threshold.
- `src/ui/` — DOM panels; build nodes with `el()` from `ui/dom.ts`, never `innerHTML`.
- `src/data/` — muscle groups + keyword classifier, anatomy info database.
- `public/` — shipped assets: `anatomy.glb`, `skeleton.glb`, `mesh_mapping.json`.
- `raw_models/` — scripts that build the GLBs from the raw datasets (raw data is gitignored; see `raw_models/README.md`).
- `e2e/` — Playwright tests.

## Commands
- Setup: `npm install`
- Run locally: `npm run dev` → http://localhost:4000/
- All checks (typecheck, lint, format check, unit tests): `npm run check`
- Unit tests: `npm test`; browser smoke test: `npm run test:e2e` (starts its own dev server on :4100, writes screenshots to `test-results/`)
- Format: `npm run format`
- Production build: `npm run build` → `dist/` (`npm run preview` to serve it)

## Conventions
- All mesh appearance changes go through `BodyController`; never assign `mesh.material` from UI code.
- Rendering is on demand: after changing anything visible outside the controller, call `stage.invalidate()`.
- Coverage ratchets in `src/data/meshData.test.ts` (unclassified meshes, missing anatomy info) may only go down.
- Anatomy facts need a source; don't write origin/insertion/innervation from memory without checking a reference.
- Mesh data is CC BY-SA (BodyParts3D 2.1 JP, Z-Anatomy 4.0): derived assets keep the same licence and attribution.

## Deploy
- Currently GitHub Pages via `.github/workflows/deploy.yml`, which builds with `BASE_PATH=/BodyExplorer/`.
- The plan is to move to Coolify on the homelab (see the `local-knowledge` skill); not set up yet. Locally and
  self-hosted, the app is served from `/`.

## Gotchas
- `BASE_PATH` controls Vite's `base`; asset URLs must use `import.meta.env.BASE_URL`.
- GLTFLoader turns spaces in node names into underscores; use `normalizeMeshName()` before matching names.
- BodyParts3D axes are X right-left, Y front-back, Z up (mm); `loadBody` converts to Three.js Y-up scene units.
- `window.bodyExplorer` exposes `{ stage, controller, rig }` for debugging and e2e tests.

## Agent setup
This repo is worked on by both Claude Code and Codex; keep them in sync.
- Rules: this file. `CLAUDE.md` only imports it — edit here.
- Skills: `.agents/skills/<name>/SKILL.md` is the source; `.claude/skills/` is a generated copy. After editing a skill run `node .agents/sync-skills.mjs` (`--check` to verify).
- Hooks: `.agents/hooks/format-edited.mjs` (Prettier), registered in both `.claude/settings.json` and `.codex/hooks.json`.
- Permissions: `.claude/settings.json` `permissions.allow` and `.codex/rules/project.rules` list the same commands. Change both together.
- Handoff between agents: before stopping mid-task, write `.agent/handoff.md` (gitignored): goal, done, next, how to verify.
