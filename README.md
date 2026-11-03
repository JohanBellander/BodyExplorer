# Body Explorer

An interactive 3D human muscular system explorer built with [Three.js](https://threejs.org/). Browse, search, and study 467 anatomical structures — muscles, tendons, and connective tissue — rendered as a photorealistic écorché (body without skin) with a full 201-bone skeleton overlay.

**[Live Demo](https://johanbellander.github.io/BodyExplorer/)**

## Features

- **Photorealistic 3D anatomy** — MRI-based mesh data from BodyParts3D, supplemented by Z-Anatomy meshes for additional muscles
- **Studio rendering**: image-based lighting, physically based muscle/tendon/bone materials, ambient occlusion, soft floor shadow, selection outline
- **Compact assets**: Meshopt-compressed models (~8.5 MB, down from 35 MB)
- **Full skeleton overlay** — 201 bone meshes with adjustable transparency
- **Click to identify** — click any muscle to see its name, muscle group, type, and links to Wikipedia and Kenhub
- **Search** — find muscles by name with live search results
- **Filter by muscle group** — toggle visibility of 14 muscle groups (head/neck, shoulder, chest, back, upper arm, forearm, abdomen, hip, upper leg, lower leg, hand, foot, trunk)
- **Hide and restore parts** — hide individual muscles to reveal deeper layers; restore them from the hidden parts panel
- **Custom color highlighting** — apply color swatches to any muscle for study or presentation
- **Dual transparency sliders**: independently control muscle and skeleton opacity; translucent muscles render as a clean shell over the bones
- **Preset camera views** — front, back, and side views with smooth transitions
- **Cursor-directed zoom** — scroll zooms toward where your cursor points
- **Dark theme UI** — clean, non-intrusive controls that stay out of the way

## Controls

| Input | Action |
|---|---|
| Left-click + drag / one-finger drag | Rotate |
| Scroll wheel / pinch | Zoom (toward cursor) |
| Right-click + drag / two-finger drag | Pan |
| Click a muscle or bone | Show info panel |
| `/` | Focus search |
| `1` `2` `3` `4` | Front / back / left / right view |
| `F` / `H` | Zoom to / hide the selected part |
| `Esc` | Deselect |
| `R` | Reset everything |

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18+)

### Install and Run

```bash
git clone https://github.com/JohanBellander/BodyExplorer.git
cd BodyExplorer
npm install
npm run dev
```

Open [http://localhost:4000](http://localhost:4000) in your browser.

### Checks and Tests

```bash
npm run check      # typecheck, lint, format check, unit tests
npm run test:e2e   # browser smoke test (uses your installed Chrome)
```

### Build for Production

```bash
npm run build      # output in dist/
npm run preview    # serve the build locally
```

The app is served from `/` by default. Set `BASE_PATH` to host it under a sub-path, e.g.
`BASE_PATH=/BodyExplorer/ npm run build` for GitHub Pages.

## Tech Stack

- **Three.js** — 3D rendering, GLTFLoader, OrbitControls
- **Vite** — dev server and build tool
- **GitHub Actions** — automated deployment to GitHub Pages

## Data Sources

The 3D mesh data comes from two open anatomical datasets:

| Dataset | Meshes | Description |
|---|---|---|
| [BodyParts3D](https://lifesciencedb.jp/bp3d/) | 401 | MRI-based anatomical meshes from The Database Center for Life Science |
| [Z-Anatomy](https://www.z-anatomy.com/) | 66 | Community-built anatomical meshes by Gauthier Kervyn |

All meshes are decimated to ~4000 faces each for real-time performance. The two datasets are spatially aligned using calibrated Y and Z offsets.

## Project Structure

See [AGENTS.md](AGENTS.md#layout) for the source layout and [raw_models/README.md](raw_models/README.md) for the asset pipeline.

## Attribution

- **BodyParts3D**, &copy; The Database Center for Life Science, licensed under [CC Attribution-Share Alike 2.1 Japan](https://creativecommons.org/licenses/by-sa/2.1/jp/deed.en)
- **Z-Anatomy** by Gauthier Kervyn, licensed under [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/)

## License

This project's source code is available under the [MIT License](https://opensource.org/licenses/MIT). The anatomical mesh data included in the `public/` directory is subject to the licenses of its respective data sources (see Attribution above).
