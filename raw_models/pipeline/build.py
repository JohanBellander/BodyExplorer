"""
Build public/anatomy.glb, public/skeleton.glb and public/mesh_mapping.json from the raw datasets.

    cd raw_models
    uv run python -m pipeline.build            # everything
    uv run python -m pipeline.build --only skeleton
    uv run python -m pipeline.build --no-refine  # skip subdivision/smoothing (fast, for debugging)

Steps: register Z-Anatomy onto BP3D -> per mesh: clean, refine, size-aware simplify, fibre field -> write GLBs
-> compress with glTF Transform (Meshopt + quantization). A per-mesh report goes to build/report.json.
"""

from __future__ import annotations

import argparse
import json
import os
import shutil
import subprocess
import time
from concurrent.futures import ProcessPoolExecutor
from dataclasses import asdict

import numpy as np
import trimesh

from . import fibers, geometry, meshio, paths, register
from .glb import GlbMesh, write_glb

COPYRIGHT = (
    "BodyParts3D, (c) The Database Center for Life Science, licensed under CC Attribution-Share Alike 2.1 "
    "Japan. Z-Anatomy by Gauthier Kervyn, licensed under CC BY-SA 4.0. Processed by Body Explorer."
)


def _process_one(args):
    src, transform_json, settings, refine = args
    mesh = meshio.load_obj(src.path)
    if src.source == "z-anatomy":
        t = register.Similarity.from_json(transform_json)
        mesh = trimesh.Trimesh(t.apply(mesh.vertices), mesh.faces, process=False)
        refine = False  # Z-Anatomy meshes are already smooth, artist-made surfaces
    out, report = geometry.process(mesh, settings, refine=refine)
    fib = fibers.fiber_directions(out) if src.kind != "bone" else None
    return src, out, fib, report


def _unique_names(sources):
    seen: dict[str, int] = {}
    names = []
    for s in sources:
        seen[s.name] = seen.get(s.name, 0) + 1
        names.append(s.name if seen[s.name] == 1 else f"{s.name} ({seen[s.name]})")
    return names


def build_set(sources, transform, settings, refine, workers):
    results = []
    jobs = [(s, transform.to_json(), settings, refine) for s in sources if s.path.exists()]
    missing = [s.name for s in sources if not s.path.exists()]
    if missing:
        print(f"  missing source files: {len(missing)} (e.g. {missing[:3]})")
    with ProcessPoolExecutor(max_workers=workers) as pool:
        for i, r in enumerate(pool.map(_process_one, jobs, chunksize=4)):
            results.append(r)
            if (i + 1) % 100 == 0:
                print(f"  {i + 1}/{len(jobs)}")
    return results


def to_glb_meshes(results):
    names = _unique_names([r[0] for r in results])
    meshes, mapping, report = [], [], []
    for (src, mesh, fib, rep), name in zip(results, names):
        normals = np.asarray(mesh.vertex_normals, dtype=np.float32)
        extras = {"source": src.source}
        if src.fma_id:
            extras["fmaId"] = src.fma_id
        meshes.append(
            GlbMesh(
                name,
                src.kind,
                np.asarray(mesh.vertices, np.float32),
                np.asarray(mesh.faces),
                normals,
                fib,
                extras,
            )
        )
        mapping.append(
            {
                "name": name,
                "originalName": src.name,
                "fmaId": src.fma_id,
                "bpId": src.bp_id,
                "isTendon": src.kind == "tendon",
                "source": src.source,
            }
        )
        report.append({"name": name, "source": src.source, "kind": src.kind, **asdict(rep)})
    return meshes, mapping, report


def compress(raw, out):
    npx = shutil.which("npx") or shutil.which("npx.cmd")
    if not npx:
        print("  npx not found; copying uncompressed GLB")
        shutil.copyfile(raw, out)
        return
    subprocess.run(
        [
            npx,
            "gltf-transform",
            "meshopt",
            str(raw),
            str(out),
            "--quantization-volume",
            "scene",
            "--quantize-position",
            "16",
            "--quantize-normal",
            "10",
            "--quantize-generic",
            "10",
        ],
        check=True,
        cwd=paths.REPO,
    )


def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--only", choices=["anatomy", "skeleton"])
    ap.add_argument("--no-refine", action="store_true", help="skip subdivision + smoothing")
    ap.add_argument("--density", type=float, help="override the face-budget density")
    ap.add_argument("--workers", type=int, default=max(1, (os.cpu_count() or 2) - 1))
    args = ap.parse_args()

    t0 = time.time()
    paths.BUILD.mkdir(exist_ok=True)
    settings = geometry.GeometrySettings()
    if args.density:
        settings.density = args.density

    print("Registering Z-Anatomy onto BodyParts3D...")
    transform = register.fit()

    full_report = {}
    if args.only in (None, "anatomy"):
        sources = meshio.bp3d_muscles() + meshio.za_muscles()
        print(f"Processing {len(sources)} muscles/tendons...")
        meshes, mapping, report = to_glb_meshes(
            build_set(sources, transform, settings, not args.no_refine, args.workers)
        )
        raw = paths.BUILD / "anatomy.raw.glb"
        write_glb(raw, meshes, "BodyMuscles", COPYRIGHT)
        compress(raw, paths.PUBLIC / "anatomy.glb")
        (paths.PUBLIC / "mesh_mapping.json").write_text(json.dumps(mapping, indent=2) + "\n")
        full_report["anatomy"] = report

    if args.only in (None, "skeleton"):
        bone_settings = geometry.GeometrySettings(density=settings.density * 0.8, max_faces=9000)
        sources = meshio.bp3d_bones()
        print(f"Processing {len(sources)} bones...")
        meshes, _, report = to_glb_meshes(
            build_set(sources, transform, bone_settings, not args.no_refine, args.workers)
        )
        raw = paths.BUILD / "skeleton.raw.glb"
        write_glb(raw, meshes, "Skeleton", COPYRIGHT)
        compress(raw, paths.PUBLIC / "skeleton.glb")
        full_report["skeleton"] = report

    for k, rep in full_report.items():
        fin = sum(r["faces_in"] for r in rep)
        fout = sum(r["faces_out"] for r in rep)
        drop = sum(r["fragments_dropped"] for r in rep)
        print(f"{k}: {len(rep)} meshes, faces {fin} -> {fout}, stray fragments dropped: {drop}")
    (paths.BUILD / "report.json").write_text(json.dumps(full_report, indent=2))
    print(f"Done in {time.time() - t0:.0f}s")


if __name__ == "__main__":
    main()
