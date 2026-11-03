# Body Explorer

Interactive 3D explorer of the human muscular system and skeleton in the browser. Three.js renders ~470
muscle/tendon meshes and ~200 bones built from two open anatomy datasets (BodyParts3D and Z-Anatomy); users
pick, search, filter, hide and colour structures.

## Stack
- TypeScript (strict) + Vite 8, Three.js r187, three-mesh-bvh for picking.
- Vitest (unit), Playwright (browser smoke test, uses the locally installed Chrome), ESLint 10 + typescript-eslint, Prettier.
- TypeScript is pinned to 6.0.x because typescript-eslint does not support TS 7 yet.
- Asset pipeline (`raw_models/`): Python 3.13 via `uv` (numpy, scipy, trimesh, pymeshlab; pytest + ruff), Blender for the Z-Anatomy export, glTF Transform for compression.

## Layout
- `src/main.ts` — bootstrap: stage, loader, controller, UI.
- `src/scene/` — `Stage` (renderer, image-based lighting, shadows, post-processing: GTAO, selection outline, Neutral tone mapping; render-on-demand loop), `CameraRig` (views, focus, animation).
- `src/model/` — `loadBody` (GLB → typed `PartMesh`es + BVH), `materials` (`MaterialLibrary.resolve` derives a mesh's material from state), `names` (display names), `types`.
- `src/app/` — `BodyController` (single owner of selection/visibility/colour state; UI subscribes to it), `search`.
- `src/interaction/picking.ts` — hover/click raycasting; click vs drag threshold.
- `src/ui/` — DOM panels; build nodes with `el()` from `ui/dom.ts`, never `innerHTML`.
- `src/data/` — muscle groups + keyword classifier, anatomy info database.
- `public/` — shipped assets: `anatomy.glb`, `skeleton.glb` (Meshopt-compressed, quantized), `mesh_mapping.json`.
- `raw_models/pipeline/` — asset build: registration (ICP), cleanup/refine/simplify, fibre field, GLB writer. Selection scripts and the Blender export live in `raw_models/`; raw data is gitignored (see `raw_models/README.md`).
- `src/model/fiberShader.ts` — procedural fibre striations driven by the pipeline's `_FIBER` attribute.
- `e2e/` — Playwright tests.

## Commands
- Setup: `npm install`
- Run locally: `npm run dev` → http://localhost:4000/
- All checks (typecheck, lint, format check, unit tests): `npm run check`
- Unit tests: `npm test`; browser smoke test: `npm run test:e2e` (starts its own dev server on :4100, writes screenshots to `test-results/`)
- Format: `npm run format`
- Production build: `npm run build` → `dist/` (`npm run preview` to serve it)
- Rebuild 3D assets (needs raw data): `npm run assets:build` (~1 min); pipeline tests + lint: `npm run assets:test`

## Conventions
- All mesh appearance changes go through `BodyController`; never assign `mesh.material` from UI code.
- Rendering is on demand: after changing anything visible outside the controller, call `stage.invalidate()`;
  after showing/hiding meshes call `stage.refreshShadows()` (the shadow map does not auto-update).
- Ambient occlusion only renders on the frame after the camera stops (it costs ~25 ms on integrated GPUs).
- Visual changes: run `npx playwright test views` and compare `test-results/views/*.png` before and after.
- Coverage ratchets in `src/data/meshData.test.ts` (unclassified meshes, missing anatomy info) may only go down.
- Anatomy facts need a source; don't write origin/insertion/innervation from memory without checking a reference.
- Mesh data is CC BY-SA (BodyParts3D 2.1 JP, Z-Anatomy 4.0): derived assets keep the same licence and attribution.

## Deploy
- Currently GitHub Pages via `.github/workflows/deploy.yml`, which builds with `BASE_PATH=/BodyExplorer/`.
- The plan is to move to Coolify on the homelab (see the `local-knowledge` skill); not set up yet. Locally and
  self-hosted, the app is served from `/`.

## Gotchas
- `BASE_PATH` controls Vite's `base`; asset URLs must use `import.meta.env.BASE_URL`. Git Bash rewrites
  `BASE_PATH=/BodyExplorer/` into a Windows path; set it from PowerShell (CI on Linux is fine).
- GLTFLoader turns spaces in node names into underscores; use `normalizeMeshName()` before matching names.
- BodyParts3D axes are X right-left, Y front-back, Z up (mm); `loadBody` converts to Three.js Y-up scene units.
- GLBs are quantized (KHR_mesh_quantization); `loadBody` expands attributes to Float32 before baking transforms,
  and rotates `_fiber` itself (`applyMatrix4` ignores custom attributes).
- Never hand-edit `public/*.glb` or `public/mesh_mapping.json`; regenerate them with the pipeline.
- Selection scripts and some raw files use CRLF; normalise line endings before string-replacing in them.
- `window.bodyExplorer` exposes `{ stage, controller, rig }` for debugging and e2e tests.

## Agent setup
This repo is worked on by both Claude Code and Codex; keep them in sync.
- Rules: this file. `CLAUDE.md` only imports it — edit here.
- Skills: `.agents/skills/<name>/SKILL.md` is the source; `.claude/skills/` is a generated copy. After editing a skill run `node .agents/sync-skills.mjs` (`--check` to verify).
- Hooks: `.agents/hooks/format-edited.mjs` (Prettier; Ruff for `.py`), registered in both `.claude/settings.json` and `.codex/hooks.json`.
- Permissions: `.claude/settings.json` `permissions.allow` and `.codex/rules/project.rules` list the same commands. Change both together.
- Handoff between agents: before stopping mid-task, write `.agent/handoff.md` (gitignored): goal, done, next, how to verify.
