"""
Per-mesh geometry processing: clean -> refine (subdivide + smooth) -> simplify to a size-aware budget.

Why: BodyParts3D meshes are coarse (median ~2.3k triangles, ~8 mm edges on a biceps), faceted from MRI
segmentation, and often carry dozens of tiny disconnected shards. Decimating them (what the old pipeline did)
removes nothing useful; instead we
1. drop degenerate faces and tiny stray fragments,
2. Loop-subdivide and Taubin-smooth (volume-preserving, removes stair-steps and facets),
3. simplify back down with quadric edge collapse to a face budget that scales with surface area, so large
   muscles get enough triangles for smooth silhouettes and small ones stay cheap.
"""

from __future__ import annotations

from dataclasses import dataclass

import numpy as np
import pymeshlab
import trimesh


@dataclass
class GeometrySettings:
    #: Fragments smaller than this share of the mesh's area (and below min_fragment_faces) are dropped.
    fragment_area_share: float = 0.01
    min_fragment_faces: int = 60
    subdiv_iterations: int = 1
    taubin_steps: int = 12
    taubin_lambda: float = 0.5
    taubin_mu: float = -0.53
    #: Target triangle count = clamp(density * area_mm2 ** exponent, min_faces, max_faces).
    density: float = 1.6
    exponent: float = 0.75
    min_faces: int = 300
    max_faces: int = 14000


@dataclass
class GeometryReport:
    faces_in: int
    faces_out: int
    fragments_dropped: int
    area_mm2: float


def drop_fragments(mesh: trimesh.Trimesh, s: GeometrySettings) -> tuple[trimesh.Trimesh, int]:
    parts = mesh.split(only_watertight=False)
    if len(parts) <= 1:
        return mesh, 0
    total = sum(p.area for p in parts)
    keep = [
        p for p in parts if p.area >= s.fragment_area_share * total or len(p.faces) >= s.min_fragment_faces
    ]
    if not keep:  # never drop everything
        keep = [max(parts, key=lambda p: p.area)]
    return trimesh.util.concatenate(keep), len(parts) - len(keep)


def _make_manifold(ms: pymeshlab.MeshSet) -> None:
    """Repair non-manifold geometry (some BP3D meshes have it) and orient faces coherently, best effort."""
    try:
        ms.meshing_repair_non_manifold_edges(method="Remove Faces")
        ms.meshing_repair_non_manifold_vertices()
        ms.meshing_remove_unreferenced_vertices()
    except pymeshlab.PyMeshLabException:
        pass
    try:
        ms.meshing_re_orient_faces_coherently()
    except pymeshlab.PyMeshLabException:
        pass


def target_faces(area_mm2: float, s: GeometrySettings) -> int:
    return int(np.clip(s.density * area_mm2**s.exponent, s.min_faces, s.max_faces))


def process(
    mesh: trimesh.Trimesh, s: GeometrySettings, refine: bool = True
) -> tuple[trimesh.Trimesh, GeometryReport]:
    faces_in = len(mesh.faces)
    mesh = mesh.copy()
    mesh.merge_vertices()
    mesh.update_faces(mesh.nondegenerate_faces())
    mesh.update_faces(mesh.unique_faces())
    mesh.remove_unreferenced_vertices()
    mesh, dropped = drop_fragments(mesh, s)
    area = float(mesh.area)

    ms = pymeshlab.MeshSet()
    ms.add_mesh(pymeshlab.Mesh(vertex_matrix=mesh.vertices, face_matrix=mesh.faces))
    ms.meshing_remove_duplicate_vertices()
    ms.meshing_remove_null_faces()
    if refine:
        if s.subdiv_iterations:
            ms.meshing_surface_subdivision_loop(
                iterations=s.subdiv_iterations, threshold=pymeshlab.PercentageValue(0)
            )
        ms.apply_coord_taubin_smoothing(lambda_=s.taubin_lambda, mu=s.taubin_mu, stepsmoothnum=s.taubin_steps)

    target = target_faces(area, s)
    if ms.current_mesh().face_number() > target:
        ms.meshing_decimation_quadric_edge_collapse(
            targetfacenum=target,
            qualitythr=0.4,
            preserveboundary=True,
            preservenormal=True,
            preservetopology=True,
            optimalplacement=True,
            planarquadric=True,
        )
    _make_manifold(ms)
    m = ms.current_mesh()
    out = trimesh.Trimesh(m.vertex_matrix(), m.face_matrix(), process=False)
    # Outward normals per component (closed shells), so lighting and back-face handling are consistent.
    try:
        trimesh.repair.fix_normals(out, multibody=True)
    except Exception as exc:  # noqa: BLE001 - repair is best effort; orientation from meshlab is kept
        print(f"  fix_normals skipped: {exc}")
    return out, GeometryReport(faces_in, len(out.faces), dropped, area)
