"""All pipeline paths, relative to the repository so the build works on any machine."""

from pathlib import Path

RAW = Path(__file__).resolve().parent.parent  # raw_models/
REPO = RAW.parent
PUBLIC = REPO / "public"

BP3D_OBJ_DIR = RAW / "bp3d" / "isa_BP3D_4.0_obj_99"
ZA_EXPORTS = RAW / "z_anatomy_exports"
ZA_LANDMARKS = ZA_EXPORTS / "landmarks"

MUSCLE_LIST = RAW / "filtered_muscles.json"  # BP3D muscles/tendons to ship (from find/filter_muscles.py)
BONE_LIST = RAW / "bone_files.json"  # BP3D bones to ship (from find_bones.py)

BUILD = RAW / "build"  # intermediates and reports (gitignored)
CACHE = BUILD / "cache"
