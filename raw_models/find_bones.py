"""
Select the BodyParts3D bone OBJ files to ship and write bone_files.json.
The meshes themselves are processed by the pipeline (uv run python -m pipeline.build).
"""
import json
import os
import re
import struct
import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
OBJ_DIR = os.path.join(HERE, 'bp3d', 'isa_BP3D_4.0_obj_99')
PARTS_LIST = os.path.join(HERE, 'parts_list.txt')

# ─── Step 1: Parse parts list ───

fma_to_info = {}
bp_to_info = {}
with open(PARTS_LIST, 'r') as f:
    next(f)  # skip header
    for line in f:
        parts = line.strip().split('\t')
        if len(parts) >= 3:
            fma_id = parts[0]
            bp_id = parts[1]
            name = parts[2]
            fma_to_info[fma_id] = (bp_id, name)
            bp_to_info[bp_id] = (fma_id, name)

# ─── Step 2: Scan all OBJ file headers ───

print("Scanning OBJ file headers...")
obj_files = {}
for fname in sorted(os.listdir(OBJ_DIR)):
    if not fname.endswith('.obj'):
        continue
    filepath = os.path.join(OBJ_DIR, fname)
    bp_id = None
    fma_id = None
    with open(filepath, 'r') as f:
        for line in f:
            if not line.startswith('#'):
                break
            m = re.search(r'Representation ID\s*:\s*(\S+)', line)
            if m:
                bp_id = m.group(1)
            m = re.search(r'Concept ID\s*:\s*(\S+)', line)
            if m:
                fma_id = m.group(1)
    obj_files[fname] = {'bp_id': bp_id, 'fma_id': fma_id}

print(f"Scanned {len(obj_files)} OBJ files")

# ─── Step 3: Find bone-related files ───

BONE_KEYWORDS = [
    'bone', 'femur', 'tibia', 'fibula', 'humerus', 'radius', 'ulna',
    'patella', 'clavicle', 'scapula', 'sternum', 'manubrium', 'xiphoid',
    'sacrum', 'coccyx', 'vertebra', 'atlas', 'axis',
    'rib', 'costal',
    'skull', 'cranium', 'mandible', 'maxilla', 'frontal bone', 'parietal',
    'temporal bone', 'occipital', 'sphenoid', 'ethmoid', 'vomer', 'hyoid',
    'nasal bone', 'zygomatic', 'lacrimal',
    'phalanx', 'phalanges',
    'metacarpal', 'metatarsal',
    'carpal', 'tarsal',
    'scaphoid', 'lunate', 'triquetrum', 'pisiform', 'trapezium', 'trapezoid',
    'capitate', 'hamate',
    'talus', 'calcaneus', 'navicular', 'cuboid', 'cuneiform',
    'hip bone', 'ilium', 'ischium', 'pubis',
    'pelvis',
]

# Patterns to EXCLUDE (not actual bones)
EXCLUDE_PATTERNS = [
    'artery', 'arterial', 'arteries',
    'vein', 'venous',
    'nerve', 'ligament', 'tendon',
    'fascia', 'membrane', 'periosteum',
    'cartilage',
    'marrow', 'endosteum',
    'joint', 'articul',
    'branch of', 'trunk of',
    'set of', 'zone of',
    'organ component',
    'intervertebral',
    'disk', 'disc',
    'foramen', 'canal',
    'cavity', 'space',
    'fossa', 'notch', 'process of',
    'surface of', 'border of', 'angle of',
    'condyle', 'epicondyle', 'tuberosity',
    'tubercle', 'trochanter',
    'head of femur', 'head of humerus', 'head of radius', 'head of fibula',
    'neck of', 'shaft of', 'body of femur', 'body of tibia',
    'epiphysis', 'diaphysis', 'metaphysis',
    'peritoneum', 'perichondrium',
    'plexus', 'ganglion',
    # False positives from keyword matching
    'muscle',
    'gland',
    'lake',
    'sac',
    'duct',
    'lobe',
    'lobule',
    'biliary',
    'hepatic',
    'tributary',
    'tarsal plate',
    'iliotibial tract',
    'iliocostalis',
    'sternocostal part',
    'humeral head of',
    'ulnar head of',
    'geniohyoid',
    'mylohyoid',
    'omohyoid',
    'sternohyoid',
    'stylohyoid',
    'thyrohyoid',
    'subscapularis',
    'levator scapulae',
    'fibularis',
    'tibialis',
    'extensor carpi',
    'intercostal',
]

# Force include these specific entries
INCLUDE_PATTERNS = [
    'body of sternum',
    'xiphoid process',
    'manubrium',
]

bone_files = []
for fname, info in obj_files.items():
    fma_id = info['fma_id']
    bp_id = info['bp_id']
    name = None

    if fma_id and fma_id in fma_to_info:
        name = fma_to_info[fma_id][1]
    elif bp_id and bp_id in bp_to_info:
        name = bp_to_info[bp_id][1]

    if not name:
        continue

    name_lower = name.lower()

    # Check force include
    force_include = any(pat in name_lower for pat in INCLUDE_PATTERNS)

    # Check if it matches bone keywords
    is_bone = any(kw in name_lower for kw in BONE_KEYWORDS)

    if not is_bone and not force_include:
        continue

    # Check exclusions
    should_exclude = any(pat in name_lower for pat in EXCLUDE_PATTERNS)

    if force_include or not should_exclude:
        bone_files.append({
            'file': fname,
            'fma_id': fma_id,
            'bp_id': bp_id,
            'name': name,
        })

bone_files.sort(key=lambda x: x['name'])

print(f"\nFound {len(bone_files)} bone OBJ files")

# Estimate total size
total_size = sum(
    os.path.getsize(os.path.join(OBJ_DIR, m['file']))
    for m in bone_files
)
print(f"Total OBJ size: {total_size / 1024 / 1024:.1f} MB")

# Print unique names
seen = set()
for bf in bone_files:
    if bf['name'] not in seen:
        seen.add(bf['name'])
        fsize = os.path.getsize(os.path.join(OBJ_DIR, bf['file']))
        print(f"  {bf['file']:15s}  {fsize:>8d} bytes  {bf['name']}")

# Save bone files list
bone_list_path = os.path.join(HERE, 'bone_files.json')
with open(bone_list_path, 'w') as f:
    json.dump(bone_files, f, indent=2)
print(f"\nWrote {len(bone_files)} entries to {bone_list_path}")
