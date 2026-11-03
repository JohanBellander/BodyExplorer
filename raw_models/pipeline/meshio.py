"""Loading source meshes into plain (vertices, faces) trimesh objects."""

from __future__ import annotations

import json
from dataclasses import dataclass, field
from pathlib import Path

import numpy as np
import trimesh

from . import paths


@dataclass
class SourceMesh:
    name: str
    path: Path
    source: str  # "bp3d" | "z-anatomy"
    kind: str  # "muscle" | "tendon" | "bone"
    fma_id: str = ""
    bp_id: str = ""
    extras: dict = field(default_factory=dict)


CONNECTIVE = ("tendon", "ligament", "retinaculum", "membrane", "fascia", "tract", "aponeurosis")


def soft_tissue_kind(name: str) -> str:
    lower = name.lower()
    return "tendon" if any(k in lower for k in CONNECTIVE) else "muscle"


def load_obj(path: Path) -> trimesh.Trimesh:
    mesh = trimesh.load(path, file_type="obj", process=False, force="mesh")
    if not isinstance(mesh, trimesh.Trimesh):
        raise TypeError(f"{path} did not load as a triangle mesh")
    return trimesh.Trimesh(np.asarray(mesh.vertices, dtype=np.float64), np.asarray(mesh.faces), process=False)


def bp3d_muscles() -> list[SourceMesh]:
    entries = json.loads(paths.MUSCLE_LIST.read_text())
    return [
        SourceMesh(
            e["name"],
            paths.BP3D_OBJ_DIR / e["file"],
            "bp3d",
            soft_tissue_kind(e["name"]),
            e.get("fma_id", ""),
            e.get("bp_id", ""),
        )
        for e in entries
    ]


def bp3d_bones() -> list[SourceMesh]:
    entries = json.loads(paths.BONE_LIST.read_text())
    return [
        SourceMesh(
            e["name"], paths.BP3D_OBJ_DIR / e["file"], "bp3d", "bone", e.get("fma_id", ""), e.get("bp_id", "")
        )
        for e in entries
    ]


def za_muscles() -> list[SourceMesh]:
    entries = json.loads((paths.ZA_EXPORTS / "manifest.json").read_text())
    return [
        SourceMesh(
            e["name"],
            paths.ZA_EXPORTS / e["file"],
            "z-anatomy",
            soft_tissue_kind(e["name"]),
            extras={"zaObject": e.get("original_object", "")},
        )
        for e in entries
    ]


def za_landmarks() -> list[dict]:
    return json.loads((paths.ZA_LANDMARKS / "manifest.json").read_text())


def bp3d_by_name() -> dict[str, SourceMesh]:
    return {m.name: m for m in [*bp3d_muscles(), *bp3d_bones()]}
