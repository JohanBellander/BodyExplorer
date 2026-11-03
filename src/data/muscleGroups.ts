/**
 * Muscle groups and the keyword classifier that assigns a mesh name to a group.
 * Mesh names come from BodyParts3D / Z-Anatomy, e.g. "acromial part of left deltoid".
 */

export type MuscleGroupKey =
  | 'HEAD_NECK'
  | 'SHOULDER'
  | 'CHEST'
  | 'BACK'
  | 'UPPER_ARM'
  | 'FOREARM'
  | 'ABDOMEN'
  | 'HIP'
  | 'UPPER_LEG'
  | 'LOWER_LEG'
  | 'HAND'
  | 'FOOT'
  | 'TRUNK'
  | 'OTHER';

export interface MuscleGroup {
  label: string;
  /** Distinct hue per group so the colour-coding is readable (used in "colour by group" mode and on filter chips). */
  color: string;
}

export const MUSCLE_GROUPS: Record<MuscleGroupKey, MuscleGroup> = {
  HEAD_NECK: { label: 'Head & Neck', color: '#e6194b' },
  SHOULDER: { label: 'Shoulders', color: '#f58231' },
  CHEST: { label: 'Chest', color: '#ffe119' },
  BACK: { label: 'Back', color: '#3cb44b' },
  UPPER_ARM: { label: 'Upper Arms', color: '#42d4f4' },
  FOREARM: { label: 'Forearms', color: '#4363d8' },
  ABDOMEN: { label: 'Abdomen', color: '#911eb4' },
  HIP: { label: 'Hips & Glutes', color: '#f032e6' },
  UPPER_LEG: { label: 'Upper Legs', color: '#bfef45' },
  LOWER_LEG: { label: 'Lower Legs', color: '#469990' },
  HAND: { label: 'Hand', color: '#dcbeff' },
  FOOT: { label: 'Foot', color: '#9a6324' },
  TRUNK: { label: 'Trunk', color: '#fabed4' },
  OTHER: { label: 'Other', color: '#a9a9a9' },
};

export const MUSCLE_GROUP_KEYS = Object.keys(MUSCLE_GROUPS) as MuscleGroupKey[];

/**
 * Classify a mesh name into a muscle group.
 * Uses keyword matching against the anatomical name.
 */
export function classifyMuscleGroup(name: string): MuscleGroupKey | null {
  const n = name.toLowerCase();

  // Head & Neck
  if (
    n.includes('sternocleidomastoid') ||
    n.includes('platysma') ||
    n.includes('digastric') ||
    n.includes('mylohyoid') ||
    n.includes('sternohyoid') ||
    n.includes('omohyoid') ||
    n.includes('thyrohyoid') ||
    n.includes('stylohyoid') ||
    n.includes('splenius') ||
    n.includes('longus colli') ||
    n.includes('rectus capitis') ||
    n.includes('levator palpebrae') ||
    n.includes('oblique arytenoid') ||
    n.includes('cricothyroid') ||
    n.includes('levator veli') ||
    n.includes('tensor veli') ||
    n.includes('arytenoid') ||
    n.includes('vocal') ||
    n.includes('scalenus') ||
    n.includes('geniohyoid') ||
    n.includes('sternothyroid') ||
    n.includes('longus capitis') ||
    n.includes('crico-arytenoid') ||
    n.includes('cricoarytenoid') ||
    n.includes('thyro-arytenoid') ||
    n.includes('thyroarytenoid') ||
    n.includes('transverse arytenoid') ||
    // Facial muscles (Z-Anatomy)
    n.includes('frontalis') ||
    n.includes('orbicularis oculi') ||
    n.includes('orbicularis oris') ||
    n.includes('zygomaticus') ||
    n.includes('levator labii') ||
    n.includes('depressor labii') ||
    n.includes('depressor anguli') ||
    n.includes('risorius') ||
    n.includes('mentalis') ||
    n.includes('procerus') ||
    n.includes('nasalis') ||
    n.includes('corrugator supercilii') ||
    // Mastication muscles (Z-Anatomy)
    n.includes('temporalis') ||
    n.includes('masseter') ||
    n.includes('pterygoid')
  )
    return 'HEAD_NECK';

  // Eye muscles
  if (
    n.includes('lateral rectus') ||
    n.includes('medial rectus') ||
    n.includes('superior rectus') ||
    n.includes('inferior rectus') ||
    n.includes('superior oblique') ||
    n.includes('inferior oblique')
  )
    return 'HEAD_NECK';

  // Shoulders
  if (
    n.includes('deltoid') ||
    n.includes('supraspinatus') ||
    n.includes('infraspinatus') ||
    n.includes('subscapularis') ||
    n.includes('teres') ||
    n.includes('levator scapulae') ||
    n.includes('subclavius')
  )
    return 'SHOULDER';

  // Chest
  if (n.includes('pectoralis') || n.includes('serratus anterior')) return 'CHEST';

  // Back
  if (
    n.includes('trapezius') ||
    n.includes('latissimus') ||
    n.includes('rhomboid') ||
    n.includes('serratus posterior') ||
    n.includes('erector') ||
    n.includes('levatores costarum') ||
    n.includes('iliocostalis') ||
    n.includes('longissimus') ||
    n.includes('spinalis') ||
    n.includes('semispinalis') ||
    n.includes('interspinal') ||
    n.includes('intertransversar') ||
    // Deep back muscles (Z-Anatomy)
    n.includes('multifidus') ||
    n.includes('rotatores') ||
    n.includes('thoracolumbar fascia') ||
    n.includes('quadratus lumborum')
  )
    return 'BACK';

  // Upper arm
  if (
    n.includes('biceps brachii') ||
    n.includes('triceps brachii') ||
    (n.includes('brachialis') && !n.includes('brachioradialis')) ||
    n.includes('coracobrachialis') ||
    n.includes('anconeus')
  )
    return 'UPPER_ARM';

  // Forearm
  if (
    n.includes('brachioradialis') ||
    n.includes('pronator') ||
    n.includes('supinator') ||
    n.includes('flexor carpi') ||
    n.includes('extensor carpi') ||
    (n.includes('flexor digitorum') && !n.includes('foot')) ||
    (n.includes('extensor digitorum') && !n.includes('longus')) ||
    n.includes('extensor indicis') ||
    n.includes('extensor pollicis') ||
    (n.includes('flexor pollicis') && n.includes('hand')) ||
    n.includes('abductor pollicis longus') ||
    n.includes('extensor digiti minimi') ||
    n.includes('flexor pollicis longus') ||
    n.includes('palmaris') ||
    (n.includes('interosseous membrane') && n.includes('forearm'))
  )
    return 'FOREARM';

  // Hand
  if (
    (n.includes('of') && n.includes('hand')) ||
    (n.includes('interossei') && n.includes('hand')) ||
    (n.includes('lumbricals') && n.includes('hand')) ||
    n.includes('opponens pollicis') ||
    (n.includes('opponens digiti') && n.includes('hand')) ||
    n.includes('abductor pollicis brevis') ||
    n.includes('flexor pollicis brevis') ||
    n.includes('adductor pollicis') ||
    (n.includes('retinaculum') && n.includes('wrist')) ||
    (n.includes('flexor digiti minimi') && n.includes('hand')) ||
    (n.includes('abductor digiti minimi') && n.includes('hand'))
  )
    return 'HAND';

  // Abdomen
  if (
    n.includes('external oblique') ||
    n.includes('internal oblique') ||
    n.includes('rectus abdominis') ||
    n.includes('transversus abdominis')
  )
    return 'ABDOMEN';

  // Trunk (intercostals, diaphragm, etc.)
  if (n.includes('intercostal') || n.includes('diaphragm') || n.includes('transversus thoracis'))
    return 'TRUNK';

  // Hip & Glutes
  if (
    n.includes('gluteus') ||
    n.includes('piriformis') ||
    n.includes('obturator') ||
    n.includes('iliacus') ||
    n.includes('psoas') ||
    n.includes('quadratus femoris') ||
    n.includes('tensor fasciae') ||
    n.includes('gemellus') ||
    n.includes('pectineus') ||
    n.includes('coccygeus') ||
    n.includes('iliococcygeus') ||
    n.includes('pubococcygeus') ||
    n.includes('puborectalis') ||
    n.includes('levator ani') ||
    n.includes('anal sphincter')
  )
    return 'HIP';

  // Upper leg
  if (
    n.includes('rectus femoris') ||
    n.includes('vastus') ||
    n.includes('biceps femoris') ||
    n.includes('semitendinosus') ||
    n.includes('semimembranosus') ||
    n.includes('sartorius') ||
    n.includes('gracilis') ||
    (n.includes('adductor') && !n.includes('hallucis') && !n.includes('pollicis')) ||
    n.includes('iliotibial')
  )
    return 'UPPER_LEG';

  // Lower leg
  if (
    n.includes('gastrocnemius') ||
    n.includes('soleus') ||
    n.includes('tibialis') ||
    n.includes('fibularis') ||
    n.includes('peroneus') ||
    n.includes('plantaris') ||
    n.includes('popliteus') ||
    n.includes('flexor digitorum longus') ||
    n.includes('flexor hallucis longus') ||
    n.includes('extensor digitorum longus') ||
    n.includes('extensor hallucis') ||
    n.includes('calcaneal tendon') ||
    (n.includes('interosseous membrane') && n.includes('leg'))
  )
    return 'LOWER_LEG';

  // Foot
  if (
    (n.includes('of') && n.includes('foot')) ||
    (n.includes('lumbrical') && n.includes('foot')) ||
    (n.includes('interosseous') && n.includes('foot')) ||
    n.includes('abductor hallucis') ||
    n.includes('adductor hallucis') ||
    n.includes('flexor hallucis brevis') ||
    n.includes('flexor digitorum brevis') ||
    n.includes('flexor accessorius') ||
    n.includes('plantar ligament') ||
    (n.includes('abductor digiti minimi') && n.includes('foot')) ||
    (n.includes('flexor digiti minimi') && n.includes('foot')) ||
    (n.includes('opponens digiti minimi') && n.includes('foot'))
  )
    return 'FOOT';

  return null;
}
