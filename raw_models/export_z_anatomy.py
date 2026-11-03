"""
Export meshes from the Z-Anatomy Blender file as OBJ files (world space, metres).

Run with Blender (not uv):
    blender -b --factory-startup --python raw_models/export_z_anatomy.py

Two kinds of objects are exported:
- TARGETS: muscles BodyParts3D lacks; they are added to anatomy.glb.
- LANDMARKS: structures present in BOTH datasets (bones and a few muscles). They are never shipped; the
  pipeline uses them to register Z-Anatomy onto BodyParts3D (see pipeline/register.py).

Outputs raw_models/z_anatomy_exports/{*.obj, manifest.json} and z_anatomy_exports/landmarks/{*.obj, manifest.json}.
"""

import json
import os

import bpy
import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
BLEND_PATH = os.path.join(HERE, "z-anatomy", "extracted", "Z-Anatomy", "Startup.blend")
OUTPUT_DIR = os.path.join(HERE, "z_anatomy_exports")
LANDMARK_DIR = os.path.join(OUTPUT_DIR, "landmarks")

# (Z-Anatomy object name without side suffix, canonical BodyParts3D-style name)
TARGETS = [
    # Major muscles missing from BP3D
    ("Latissimus dorsi muscle", "latissimus dorsi"),
    ("Rectus abdominis muscle", "rectus abdominis"),
    ("Internal abdominal oblique muscle", "internal oblique"),
    ("Transversus abdominis muscle", "transversus abdominis"),
    ("Quadratus lumborum muscle", "quadratus lumborum"),
    # Muscles of mastication
    ("Superficial part of masseter", "superficial part of masseter"),
    ("Deep part of masseter", "deep part of masseter"),
    ("Temporalis muscle", "temporalis"),
    ("Medial pterygoid muscle", "medial pterygoid"),
    ("Inferior head of lateral pterygoid muscle", "inferior head of lateral pterygoid"),
    ("Superior head of lateral pterygoid muscle", "superior head of lateral pterygoid"),
    # Facial expression muscles
    ("Frontalis muscle", "frontalis"),
    ("Orbital part of orbicularis oculi", "orbital part of orbicularis oculi"),
    ("Palpebral part of orbicularis oculi", "palpebral part of orbicularis oculi"),
    ("Orbicularis oris muscle", "orbicularis oris"),
    ("Buccinator muscle", "buccinator"),
    ("Zygomaticus major muscle", "zygomaticus major"),
    ("Zygomaticus minor muscle", "zygomaticus minor"),
    ("Levator labii superioris", "levator labii superioris"),
    ("Depressor labii inferioris", "depressor labii inferioris"),
    ("Depressor anguli oris", "depressor anguli oris"),
    ("Risorius muscle", "risorius"),
    ("Mentalis muscle", "mentalis"),
    ("Procerus muscle", "procerus"),
    ("Nasalis muscle", "nasalis"),
    ("Corrugator supercilii", "corrugator supercilii"),
    # Deep back muscles
    ("Multifidus colli muscle", "multifidus cervicis"),
    ("Multifidus thoracis muscle", "multifidus thoracis"),
    ("Multifidus lumborum muscle", "multifidus lumborum"),
    ("Rotatores", "rotatores"),
    # IT band and thoracolumbar fascia
    ("Iliotibial tract", "iliotibial tract"),
    ("Posterior layer of thoracolumbar fascia", "posterior layer of thoracolumbar fascia"),
    ("Anterior layer of thoracolumbar fascia", "anterior layer of thoracolumbar fascia"),
    ("Middle layer of thoracolumbar fascia", "middle layer of thoracolumbar fascia"),
]

# Structures in both datasets: (Z-Anatomy object, BodyParts3D mesh name; "{side}" = left/right).
LANDMARKS = [
    ("Femur", "{side} femur"),
    ("Hip bone", "{side} hip bone"),
    ("Humerus", "{side} humerus"),
    ("Scapula", "{side} scapula"),
    ("Clavicle", "{side} clavicle"),
    ("Tibia", "{side} tibia"),
    ("Fibula", "{side} fibula"),
    ("Radius", "{side} radius"),
    ("Ulna", "{side} ulna"),
    ("Patella", "{side} patella"),
    ("Body of sternum", "body of sternum"),
    ("Frontal bone", "frontal bone"),
    ("Occipital bone", "occipital bone"),
    ("Mandible", "mandible"),
    ("Parietal bone", "{side} parietal bone"),
    ("External abdominal oblique muscle", "{side} external oblique"),
    ("Gluteus maximus muscle", "{side} gluteus maximus"),
    ("Sartorius muscle", "{side} sartorius"),
]

SIDES = [(".l", "left"), (".r", "right")]


def write_obj(path, name, obj):
    depsgraph = bpy.context.evaluated_depsgraph_get()
    eval_obj = obj.evaluated_get(depsgraph)
    mesh = eval_obj.to_mesh()
    mesh.calc_loop_triangles()
    n = len(mesh.vertices)
    co = np.empty(n * 3, dtype=np.float64)
    mesh.vertices.foreach_get("co", co)
    co = co.reshape(-1, 3)
    m = np.array(obj.matrix_world, dtype=np.float64)
    co = co @ m[:3, :3].T + m[:3, 3]
    tris = np.empty(len(mesh.loop_triangles) * 3, dtype=np.int64)
    mesh.loop_triangles.foreach_get("vertices", tris)
    tris = tris.reshape(-1, 3) + 1
    with open(path, "w") as f:
        f.write(f"# Z-Anatomy export: {name} (object {obj.name})\no {name}\n")
        np.savetxt(f, co, fmt="v %.6f %.6f %.6f")
        np.savetxt(f, tris, fmt="f %d %d %d")
    eval_obj.to_mesh_clear()
    return len(tris)


def export(entries, out_dir, with_counterpart):
    os.makedirs(out_dir, exist_ok=True)
    exported, skipped = [], []
    for za_name, canonical in entries:
        sided = [(za_name + suf, side) for suf, side in SIDES if bpy.data.objects.get(za_name + suf)]
        candidates = sided or [(za_name, "")]
        found_any = False
        for obj_name, side in candidates:
            obj = bpy.data.objects.get(obj_name)
            if obj is None or obj.type != "MESH" or len(obj.data.polygons) < 5:
                continue
            found_any = True
            if with_counterpart:
                out_name = canonical.format(side=side).strip()
            else:
                out_name = f"{side} {canonical}".strip()
            safe = out_name.replace(" ", "_").replace("(", "").replace(")", "")
            faces = write_obj(os.path.join(out_dir, f"{safe}.obj"), out_name, obj)
            exported.append(
                {
                    "name": out_name,
                    "file": f"{safe}.obj",
                    "faces": faces,
                    "original_object": obj_name,
                    "source": "z-anatomy",
                }
            )
            print(f"  exported {out_name} ({faces} tris)")
        if not found_any:
            skipped.append(za_name)
    with open(os.path.join(out_dir, "manifest.json"), "w") as f:
        json.dump(exported, f, indent=2)
    return exported, skipped


bpy.ops.wm.open_mainfile(filepath=BLEND_PATH)
targets, skipped_t = export(TARGETS, OUTPUT_DIR, with_counterpart=False)
landmarks, skipped_l = export(LANDMARKS, LANDMARK_DIR, with_counterpart=True)
print(f"\nTargets: {len(targets)} exported, skipped: {skipped_t}")
print(f"Landmarks: {len(landmarks)} exported, skipped: {skipped_l}")
