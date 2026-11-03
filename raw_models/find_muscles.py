"""
Script to find all muscle and tendon OBJ files from BodyParts3D
and create a mapping of file -> anatomical name.
"""
import os
import re

HERE = os.path.dirname(os.path.abspath(__file__))
OBJ_DIR = os.path.join(HERE, 'bp3d', 'isa_BP3D_4.0_obj_99')
PARTS_LIST = os.path.join(HERE, 'parts_list.txt')

# Parse parts list: FMA_ID -> (BP_ID, name)
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

# Parse all OBJ file headers to get FMA/BP IDs
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

# Keywords that indicate skeletal muscles and tendons (not cardiac/smooth muscle)
MUSCLE_KEYWORDS = [
    'bicep', 'tricep', 'deltoid', 'pectoralis', 'trapezius',
    'latissimus', 'gluteus', 'rectus', 'oblique', 'gastrocnemius',
    'soleus', 'tibialis', 'peroneus', 'fibularis', 'sartorius',
    'gracilis', 'adductor', 'vastus', 'semitendinosus', 'semimembranosus',
    'brachialis', 'brachioradialis', 'supinator', 'pronator',
    'infraspinatus', 'supraspinatus', 'subscapularis', 'teres',
    'rhomboid', 'serratus', 'erector', 'iliopsoas', 'psoas', 'iliacus',
    'quadratus', 'piriformis', 'obturator', 'tensor', 'plantaris',
    'popliteus', 'sternocleidomastoid', 'scalene', 'scalenus', 'splenius',
    'masseter', 'temporalis', 'orbicularis', 'frontalis', 'zygomaticus',
    'digastric', 'mylohyoid', 'sternohyoid', 'omohyoid', 'thyrohyoid',
    'coracobrachialis', 'anconeus', 'palmaris', 'flexor', 'extensor',
    'abductor', 'opponens', 'lumbrical', 'interosseous', 'interossei',
    'intercostal', 'diaphragm', 'transversus', 'cremaster',
    'levator', 'depressor', 'corrugator', 'procerus', 'nasalis',
    'platysma', 'mentalis', 'buccinator', 'risorius',
    # Deep back / erector spinae
    'iliocostalis', 'longissimus', 'spinalis', 'semispinalis',
    'interspinal', 'intertransversar',
    # Neck muscles
    'subclavius', 'stylohyoid', 'geniohyoid', 'sternothyroid',
    'longus capitis', 'longus colli',
    # Hip / pelvic
    'gemellus', 'pectineus',
    # Pelvic floor
    'coccygeus', 'iliococcygeus', 'pubococcygeus', 'puborectalis',
    'sphincter',
    # Laryngeal muscles
    'crico-arytenoid', 'cricoarytenoid', 'thyro-arytenoid', 'thyroarytenoid',
    'arytenoid', 'cricothyroid',
    # Tendon/ligament related
    'tendon', 'ligament', 'aponeurosis', 'fascia', 'retinaculum',
    'achilles', 'patellar',
]

# Also match entries that contain "muscle of" or specific muscle group categories
MUSCLE_GROUP_FMA = set()
for fma_id, (bp_id, name) in fma_to_info.items():
    name_lower = name.lower()
    # Match individual muscles (not "muscle of X" categories, but also include them)
    if any(kw in name_lower for kw in MUSCLE_KEYWORDS):
        MUSCLE_GROUP_FMA.add(fma_id)
    # Also include entries with "muscle" that look like specific muscles
    if 'muscle' in name_lower and ('right' in name_lower or 'left' in name_lower):
        MUSCLE_GROUP_FMA.add(fma_id)

# Find OBJ files that match muscle FMA IDs
muscle_files = []
for fname, info in obj_files.items():
    fma_id = info['fma_id']
    bp_id = info['bp_id']
    name = None
    
    if fma_id and fma_id in fma_to_info:
        name = fma_to_info[fma_id][1]
    elif bp_id and bp_id in bp_to_info:
        name = bp_to_info[bp_id][1]
    
    if name:
        name_lower = name.lower()
        is_muscle = any(kw in name_lower for kw in MUSCLE_KEYWORDS)
        if is_muscle:
            muscle_files.append({
                'file': fname,
                'fma_id': fma_id,
                'bp_id': bp_id,
                'name': name,
            })

# Sort by name
muscle_files.sort(key=lambda x: x['name'])

print(f"Total OBJ files: {len(obj_files)}")
print(f"Muscle/tendon related FMA IDs: {len(MUSCLE_GROUP_FMA)}")
print(f"Muscle/tendon OBJ files found: {len(muscle_files)}")
print()

# Print summary
seen_names = set()
for mf in muscle_files:
    if mf['name'] not in seen_names:
        seen_names.add(mf['name'])
        fsize = os.path.getsize(os.path.join(OBJ_DIR, mf['file']))
        print(f"  {mf['file']:15s}  {mf['fma_id']:12s}  {fsize:>8d} bytes  {mf['name']}")

# Write the filtered list to a JSON file for the conversion script
import json
output = os.path.join(HERE, 'muscle_files.json')
with open(output, 'w') as f:
    json.dump(muscle_files, f, indent=2)
print(f"\nWrote {len(muscle_files)} entries to {output}")
