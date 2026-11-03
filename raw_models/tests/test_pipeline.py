import numpy as np
import trimesh

from pipeline import fibers, geometry, register


def test_umeyama_recovers_a_similarity_transform():
    rng = np.random.default_rng(1)
    src = rng.normal(size=(500, 3))
    angle = np.radians(20)
    rot = np.array([[np.cos(angle), -np.sin(angle), 0], [np.sin(angle), np.cos(angle), 0], [0, 0, 1]])
    dst = 3.5 * src @ rot.T + np.array([10.0, -2.0, 4.0])
    t = register.umeyama(src, dst)
    assert np.allclose(t.rotation, rot, atol=1e-9)
    assert abs(t.scale - 3.5) < 1e-9
    assert np.allclose(t.apply(src), dst, atol=1e-9)


def test_fibers_run_along_a_cylinder():
    # A long cylinder along Z (subdivided so the shaft has vertices): fibres should run along Z.
    mesh = trimesh.creation.cylinder(radius=1.0, height=10.0, sections=24)
    mesh = mesh.subdivide_to_size(max_edge=0.4)
    d = fibers.fiber_directions(mesh)
    assert d.shape == mesh.vertices.shape
    assert np.allclose(np.linalg.norm(d, axis=1), 1.0, atol=1e-4)
    shaft = np.abs(mesh.vertices[:, 2]) < 3.0
    alignment = np.abs(d[shaft, 2])
    assert np.median(alignment) > 0.95


def test_geometry_refines_and_respects_budget():
    s = geometry.GeometrySettings()
    coarse = trimesh.creation.icosphere(subdivisions=1, radius=20.0)  # 80 faces, very faceted
    stray = trimesh.creation.icosphere(subdivisions=0, radius=0.5).apply_translation([100, 0, 0])
    out, rep = geometry.process(trimesh.util.concatenate([coarse, stray]), s)
    assert rep.fragments_dropped == 1
    assert len(out.faces) <= geometry.target_faces(rep.area_mm2, s)
    assert len(out.faces) > len(coarse.faces)  # subdivision added detail before simplifying
    assert out.is_watertight
