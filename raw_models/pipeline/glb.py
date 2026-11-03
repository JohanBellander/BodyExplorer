"""Minimal glTF 2.0 binary writer: one node + mesh per anatomical structure, names and metadata preserved."""

from __future__ import annotations

import json
import struct
from dataclasses import dataclass, field
from pathlib import Path

import numpy as np

FLOAT, UINT16, UINT32 = 5126, 5123, 5125
ARRAY_BUFFER, ELEMENT_ARRAY_BUFFER = 34962, 34963

MATERIALS = {
    "muscle": {"baseColorFactor": [0.49, 0.11, 0.09, 1.0], "roughnessFactor": 0.55},
    "tendon": {"baseColorFactor": [0.9, 0.86, 0.78, 1.0], "roughnessFactor": 0.35},
    "bone": {"baseColorFactor": [0.91, 0.86, 0.75, 1.0], "roughnessFactor": 0.7},
}


@dataclass
class GlbMesh:
    name: str
    kind: str
    vertices: np.ndarray  # (n, 3) float32
    faces: np.ndarray  # (m, 3)
    normals: np.ndarray  # (n, 3) float32
    fibers: np.ndarray | None = None  # (n, 3) float32
    extras: dict = field(default_factory=dict)


class _Builder:
    def __init__(self) -> None:
        self.bin = bytearray()
        self.views: list[dict] = []
        self.accessors: list[dict] = []

    def _view(self, data: bytes, target: int, stride: int | None = None) -> int:
        while len(self.bin) % 4:
            self.bin.append(0)
        view = {"buffer": 0, "byteOffset": len(self.bin), "byteLength": len(data), "target": target}
        if stride:
            view["byteStride"] = stride
        self.bin.extend(data)
        self.views.append(view)
        return len(self.views) - 1

    def vec3(self, arr: np.ndarray, with_bounds: bool = False) -> int:
        arr = np.ascontiguousarray(arr, dtype=np.float32)
        acc = {
            "bufferView": self._view(arr.tobytes(), ARRAY_BUFFER, 12),
            "componentType": FLOAT,
            "count": len(arr),
            "type": "VEC3",
        }
        if with_bounds:
            acc["min"] = arr.min(0).tolist()
            acc["max"] = arr.max(0).tolist()
        self.accessors.append(acc)
        return len(self.accessors) - 1

    def indices(self, faces: np.ndarray) -> int:
        flat = np.ascontiguousarray(faces).ravel()
        small = flat.max() <= 65535
        data = flat.astype(np.uint16 if small else np.uint32).tobytes()
        self.accessors.append(
            {
                "bufferView": self._view(data, ELEMENT_ARRAY_BUFFER),
                "componentType": UINT16 if small else UINT32,
                "count": int(flat.size),
                "type": "SCALAR",
            }
        )
        return len(self.accessors) - 1


def write_glb(path: Path, meshes: list[GlbMesh], scene_name: str, copyright_: str) -> None:
    b = _Builder()
    kinds = list(MATERIALS)
    materials = [
        {"name": k, "pbrMetallicRoughness": {**MATERIALS[k], "metallicFactor": 0.0}, "doubleSided": True}
        for k in kinds
    ]
    gl_meshes, nodes = [], []
    for m in meshes:
        attributes = {"POSITION": b.vec3(m.vertices, with_bounds=True), "NORMAL": b.vec3(m.normals)}
        if m.fibers is not None:
            attributes["_FIBER"] = b.vec3(m.fibers)
        gl_meshes.append(
            {
                "name": m.name,
                "primitives": [
                    {"attributes": attributes, "indices": b.indices(m.faces), "material": kinds.index(m.kind)}
                ],
            }
        )
        nodes.append({"name": m.name, "mesh": len(gl_meshes) - 1, "extras": {"kind": m.kind, **m.extras}})
    nodes.append({"name": scene_name, "children": list(range(len(meshes)))})

    gltf = {
        "asset": {"version": "2.0", "generator": "BodyExplorer pipeline", "copyright": copyright_},
        "scene": 0,
        "scenes": [{"name": scene_name, "nodes": [len(nodes) - 1]}],
        "nodes": nodes,
        "meshes": gl_meshes,
        "materials": materials,
        "accessors": b.accessors,
        "bufferViews": b.views,
        "buffers": [{"byteLength": len(b.bin)}],
    }
    js = json.dumps(gltf, separators=(",", ":")).encode()
    js += b" " * (-len(js) % 4)
    b.bin.extend(b"\0" * (-len(b.bin) % 4))
    total = 12 + 8 + len(js) + 8 + len(b.bin)
    path.parent.mkdir(parents=True, exist_ok=True)
    with open(path, "wb") as f:
        f.write(struct.pack("<III", 0x46546C67, 2, total))
        f.write(struct.pack("<II", len(js), 0x4E4F534A) + js)
        f.write(struct.pack("<II", len(b.bin), 0x004E4942) + bytes(b.bin))
