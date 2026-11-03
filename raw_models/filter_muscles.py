"""
Convert BodyParts3D muscle OBJ files into a single optimized GLB file.
Uses trimesh for OBJ loading and pygltflib/trimesh for GLB export.
"""
import json
import os
import sys
import struct

HERE = os.path.dirname(os.path.abspath(__file__))
OBJ_DIR = os.path.join(HERE, 'bp3d', 'isa_BP3D_4.0_obj_99')
MUSCLE_LIST = os.path.join(HERE, 'muscle_files.json')

# Categories to exclude (not skeletal muscles)
EXCLUDE_PATTERNS = [
    'artery', 'arterial', 'arteries',
    'vein', 'veins', 'venous',
    'ligament',  # most ligaments - we'll include specific ones
    'membrane', 'retinaculum',
    'nerve',
    'check ligament',
    'suspensory ligament',
    'taenia',
    'trochlea',
    'vocal ligament',
    'thyrohyoid membrane',
    'hyo-epiglottic',
    'thyro-epiglottic',
    'cricothyroid ligament',
    'median cricothyroid',
    'median thyrohyoid',
    'set of anterior intercostal veins',
    'posterior intercostal arteries',
    'intercostal artery',
    'intercostal vein',
    'obturator vein',
    'interosseous artery',
    'recurrent interosseous',
    'common interosseous',
    'superior intercostal artery',
    'superior intercostal vein',
    # Smooth muscle sphincters (not skeletal)
    'internal anal sphincter',
    'internal urethral sphincter',
    'pyloric sphincter',
    'sphincter of oddi',
    'cardiac sphincter',
]

# These ligaments/tendons/muscles we DO want to include
INCLUDE_PATTERNS = [
    'calcaneal tendon',  # Achilles tendon
    'long plantar ligament',
    'tendinous arch',
    'iliotibial',
    'interosseous membrane',
    'flexor retinaculum',
    # Pelvic floor muscles
    'coccygeus',
    'iliococcygeus',
    'pubococcygeus',
    'puborectalis',
    # External anal sphincter (skeletal muscle)
    'external anal sphincter',
    # Laryngeal muscles (contain "ligament" or "membrane" substrings sometimes)
    'crico-arytenoid',
    'cricoarytenoid',
    'thyro-arytenoid',
    'thyroarytenoid',
    'arytenoid',
    'cricothyroid',
]

with open(MUSCLE_LIST) as f:
    all_muscles = json.load(f)

# Filter
filtered = []
for m in all_muscles:
    name_lower = m['name'].lower()
    
    # Check if explicitly included
    force_include = any(pat in name_lower for pat in INCLUDE_PATTERNS)
    
    # Check if should be excluded
    should_exclude = any(pat in name_lower for pat in EXCLUDE_PATTERNS)
    
    if force_include or not should_exclude:
        filtered.append(m)

print(f"Filtered from {len(all_muscles)} to {len(filtered)} muscle/tendon files")

# Estimate total size
total_size = sum(
    os.path.getsize(os.path.join(OBJ_DIR, m['file']))
    for m in filtered
)
print(f"Total OBJ size: {total_size / 1024 / 1024:.1f} MB")

# Print the list
for m in filtered:
    print(f"  {m['file']:15s}  {m['name']}")

# Save filtered list
output_list = os.path.join(HERE, 'filtered_muscles.json')
with open(output_list, 'w') as f:
    json.dump(filtered, f, indent=2)
print(f"\nWrote filtered list to {output_list}")
