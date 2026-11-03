"""
Per-vertex muscle fibre directions.

Muscle fibres run, roughly, from one attachment end to the other and fan out with the muscle's shape. We model
that with a harmonic field on the surface: pick the two extreme end regions along the muscle's principal axis,
fix u=0 on one and u=1 on the other, and solve the cotangent Laplace equation for u everywhere else. The surface
gradient of u is a smooth flow from end to end that follows fan-shaped muscles (pectoralis, trapezius) far
better than a single straight axis. Components where that is not possible fall back to their principal axis.

The direction is stored as a vertex attribute and drives the procedural fibre striations in the viewer.
"""

from __future__ import annotations

import numpy as np
import scipy.sparse as sp
import scipy.sparse.linalg as spla
import trimesh

END_FRACTION = 0.06  # share of a component's length treated as each end region


def principal_axis(points: np.ndarray) -> np.ndarray:
    centred = points - points.mean(0)
    _, _, vt = np.linalg.svd(centred, full_matrices=False)
    return vt[0]


def cotangent_laplacian(v: np.ndarray, f: np.ndarray) -> sp.csr_matrix:
    n = len(v)
    rows, cols, vals = [], [], []
    for i in range(3):
        a, b, c = f[:, i], f[:, (i + 1) % 3], f[:, (i + 2) % 3]
        e1, e2 = v[b] - v[a], v[c] - v[a]
        cross = np.linalg.norm(np.cross(e1, e2), axis=1)
        cot = np.einsum("ij,ij->i", e1, e2) / np.maximum(cross, 1e-12)
        cot = np.clip(cot, -1e3, 1e3) * 0.5  # weight for the edge (b, c) opposite vertex a
        rows += [b, c]
        cols += [c, b]
        vals += [cot, cot]
    w = sp.coo_matrix(
        (np.concatenate(vals), (np.concatenate(rows), np.concatenate(cols))), shape=(n, n)
    ).tocsr()
    return sp.diags(np.asarray(w.sum(1)).ravel()) - w


def face_gradients(v: np.ndarray, f: np.ndarray, u: np.ndarray) -> np.ndarray:
    v0, v1, v2 = v[f[:, 0]], v[f[:, 1]], v[f[:, 2]]
    n = np.cross(v1 - v0, v2 - v0)
    area2 = np.linalg.norm(n, axis=1, keepdims=True)
    n = n / np.maximum(area2, 1e-12)
    grad = (
        u[f[:, 0], None] * np.cross(n, v2 - v1)
        + u[f[:, 1], None] * np.cross(n, v0 - v2)
        + u[f[:, 2], None] * np.cross(n, v1 - v0)
    ) / np.maximum(area2, 1e-12)
    return grad


def _component_field(v: np.ndarray, f: np.ndarray) -> np.ndarray | None:
    axis = principal_axis(v)
    t = v @ axis
    lo, hi = t.min(), t.max()
    span = hi - lo
    if span <= 0 or len(v) < 12:
        return None
    a = t <= lo + END_FRACTION * span
    b = t >= hi - END_FRACTION * span
    fixed = a | b
    free = ~fixed
    if a.sum() == 0 or b.sum() == 0 or free.sum() == 0:
        return None
    lap = cotangent_laplacian(v, f)
    u = np.zeros(len(v))
    u[b] = 1.0
    lff = lap[free][:, free]
    rhs = -lap[free][:, fixed] @ u[fixed]
    try:
        u[free] = spla.spsolve(lff.tocsc() + sp.identity(lff.shape[0]) * 1e-9, rhs)
    except Exception:  # noqa: BLE001 - singular systems fall back to the principal axis
        return None
    if not np.all(np.isfinite(u)):
        return None

    g = face_gradients(v, f, u)
    area = trimesh.triangles.area(v[f])
    acc = np.zeros_like(v)
    for k in range(3):
        np.add.at(acc, f[:, k], g * area[:, None])
    return acc


def fiber_directions(mesh: trimesh.Trimesh) -> np.ndarray:
    """Unit fibre direction per vertex, tangent to the surface."""
    v = np.asarray(mesh.vertices, dtype=np.float64)
    f = np.asarray(mesh.faces)
    out = np.zeros_like(v)
    labels = trimesh.graph.connected_component_labels(mesh.face_adjacency, node_count=len(f))
    for label in np.unique(labels):
        faces = f[labels == label]
        vids = np.unique(faces)
        remap = -np.ones(len(v), dtype=np.int64)
        remap[vids] = np.arange(len(vids))
        cv, cf = v[vids], remap[faces]
        field = _component_field(cv, cf)
        if field is None or not np.isfinite(field).all() or np.linalg.norm(field, axis=1).max() == 0:
            field = np.tile(principal_axis(cv), (len(cv), 1))
        out[vids] = field

    normals = np.asarray(mesh.vertex_normals)
    out -= normals * np.einsum("ij,ij->i", out, normals)[:, None]  # project onto the tangent plane
    length = np.linalg.norm(out, axis=1, keepdims=True)
    fallback = np.tile(principal_axis(v), (len(v), 1))
    out = np.where(length > 1e-9, out / np.maximum(length, 1e-12), fallback)
    return out.astype(np.float32)
