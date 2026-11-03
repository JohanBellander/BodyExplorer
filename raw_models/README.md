# Asset pipeline

The scripts in this folder build `public/anatomy.glb`, `public/skeleton.glb` and `public/mesh_mapping.json`
from two open datasets. The raw data is large and gitignored; put it here:

| Path | Source |
|---|---|
| `raw_models/bp3d/isa_BP3D_4.0_obj_99/` | [BodyParts3D](https://lifesciencedb.jp/bp3d/) 4.0 OBJ files ("is-a" tree, 99% quality) |
| `raw_models/z-anatomy/` | [Z-Anatomy](https://www.z-anatomy.com/) Blender file |
| `raw_models/z_anatomy_exports/` | OBJ exports made from the Z-Anatomy file by `export_z_anatomy.py` (run inside Blender) |

Current order: `find_muscles.py` → `filter_muscles.py` → `export_z_anatomy.py` (Blender) → `decimate_anatomy.py`;
bones: `find_bones.py` → `convert_to_glb.py`.

> These scripts still contain absolute paths from the machine they were written on. Making the pipeline
> reproducible (relative paths, `uv` project, one command) is tracked as Phase 2 of the improvement plan.

The shipped GLBs are then compressed with glTF Transform (lossless for our purposes: 16-bit positions over the
whole body ≈ 0.03 mm):

```bash
npx gltf-transform meshopt in.glb public/anatomy.glb --quantization-volume scene --quantize-position 16 --quantize-normal 10
```
