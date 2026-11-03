"""
Register Z-Anatomy onto BodyParts3D.

The two datasets come from different bodies and coordinate frames (Z-Anatomy in metres, BP3D in mm with an
MRI-scanner origin). The old pipeline aligned them with hand-tuned offsets. Here we fit a similarity transform
(rotation, uniform scale, translation) with trimmed ICP over landmark structures present in both datasets
(long bones, pelvis, skull bones and a few large muscles), where correspondences are known by name.

Run on its own to print a report:  uv run python -m pipeline.register
"""

from __future__ import annotations

import json
from dataclasses import dataclass

import numpy as np
from scipy.spatial import cKDTree

from . import meshio, paths

# Starting point = the old hand-tuned alignment (metres -> mm, then Y/Z offsets).
INITIAL_SCALE = 1000.0
INITIAL_OFFSET = np.array([0.0, -96.0, -75.0])


@dataclass
class Similarity:
    rotation: np.ndarray  # (3, 3)
    scale: float
    translation: np.ndarray  # (3,)

    def apply(self, pts: np.ndarray) -> np.ndarray:
        return self.scale * pts @ self.rotation.T + self.translation

    def to_json(self) -> dict:
        return {
            "rotation": self.rotation.tolist(),
            "scale": self.scale,
            "translation": self.translation.tolist(),
        }

    @staticmethod
    def from_json(d: dict) -> Similarity:
        return Similarity(np.array(d["rotation"]), float(d["scale"]), np.array(d["translation"]))


def initial() -> Similarity:
    return Similarity(np.eye(3), INITIAL_SCALE, INITIAL_OFFSET.copy())


def umeyama(src: np.ndarray, dst: np.ndarray) -> Similarity:
    """Least-squares similarity transform mapping src -> dst (Umeyama 1991)."""
    mu_s, mu_d = src.mean(0), dst.mean(0)
    s, d = src - mu_s, dst - mu_d
    cov = d.T @ s / len(src)
    u, sig, vt = np.linalg.svd(cov)
    e = np.eye(3)
    if np.linalg.det(u) * np.linalg.det(vt) < 0:
        e[2, 2] = -1
    r = u @ e @ vt
    var_s = (s**2).sum() / len(src)
    scale = float(np.trace(np.diag(sig) @ e) / var_s)
    t = mu_d - scale * r @ mu_s
    return Similarity(r, scale, t)


def _sample(mesh, n: int, rng: np.random.Generator) -> np.ndarray:
    pts, _ = (
        mesh.sample(n, return_index=True, seed=int(rng.integers(1 << 31)))
        if hasattr(mesh, "sample")
        else (mesh.vertices, None)
    )
    return np.asarray(pts)


def load_pairs(samples_src: int = 3000, samples_dst: int = 30000, seed: int = 0):
    """Return a list of (name, za_points [m], bp3d_tree, bp3d_points [mm])."""
    rng = np.random.default_rng(seed)
    bp = meshio.bp3d_by_name()
    pairs = []
    for lm in meshio.za_landmarks():
        target = bp.get(lm["name"])
        if target is None or not target.path.exists():
            print(f"  (no BP3D counterpart for {lm['name']})")
            continue
        za = meshio.load_obj(paths.ZA_LANDMARKS / lm["file"])
        bp_mesh = meshio.load_obj(target.path)
        za_pts = np.asarray(za.sample(samples_src, seed=int(rng.integers(1 << 31))))
        bp_pts = np.asarray(bp_mesh.sample(samples_dst, seed=int(rng.integers(1 << 31))))
        pairs.append((lm["name"], za_pts, cKDTree(bp_pts), bp_pts))
    return pairs


def residuals(t: Similarity, pairs) -> dict[str, float]:
    """Median closest-point distance (mm) per landmark."""
    return {name: float(np.median(tree.query(t.apply(za))[0])) for name, za, tree, _ in pairs}


def icp(pairs, t: Similarity, iterations: int = 40, trim: float = 0.8) -> Similarity:
    """Trimmed ICP: each round matches every landmark's points to its own counterpart, drops the worst 20%."""
    for _ in range(iterations):
        src, dst = [], []
        for _, za, tree, bp_pts in pairs:
            moved = t.apply(za)
            dist, idx = tree.query(moved)
            keep = dist <= np.quantile(dist, trim)
            src.append(za[keep])
            dst.append(bp_pts[idx[keep]])
        new = umeyama(np.concatenate(src), np.concatenate(dst))
        delta = np.abs(new.translation - t.translation).max() + abs(new.scale - t.scale)
        t = new
        if delta < 1e-3:
            break
    return t


def fit(report: bool = True) -> Similarity:
    pairs = load_pairs()
    t0 = initial()
    before = residuals(t0, pairs)
    t = icp(pairs, t0)
    after = residuals(t, pairs)
    if report:
        print(f"{'landmark':32s} {'before mm':>10s} {'after mm':>10s}")
        for name in before:
            print(f"{name:32s} {before[name]:10.1f} {after[name]:10.1f}")
        print(
            f"{'median':32s} {np.median(list(before.values())):10.1f} {np.median(list(after.values())):10.1f}"
        )
        angle = np.degrees(np.arccos(np.clip((np.trace(t.rotation) - 1) / 2, -1, 1)))
        print(
            f"scale {t.scale:.2f} (initial {INITIAL_SCALE}), rotation {angle:.2f} deg, "
            f"translation {np.round(t.translation, 1)}"
        )
    paths.BUILD.mkdir(exist_ok=True)
    out = {"transform": t.to_json(), "residualsBeforeMm": before, "residualsAfterMm": after}
    (paths.BUILD / "registration.json").write_text(json.dumps(out, indent=2))
    return t


if __name__ == "__main__":
    fit()
