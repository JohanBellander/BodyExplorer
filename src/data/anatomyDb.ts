/**
 * Anatomical information database.
 * Maps normalized muscle names to anatomical details.
 * The keys use simplified/canonical names that match against the mesh names from BP3D.
 */

export interface AnatomyInfo {
  origin: string;
  insertion: string;
  action: string;
  innervation?: string;
  notes?: string;
}

export const UNKNOWN_INFO: Readonly<AnatomyInfo> = Object.freeze({
  origin: 'See anatomical references',
  insertion: 'See anatomical references',
  action: 'See anatomical references',
});

/** True when the database has no specific entry for this structure. */
export function isUnknownInfo(info: AnatomyInfo): boolean {
  return info === UNKNOWN_INFO;
}

export const ANATOMY_DB: Record<string, AnatomyInfo> = {
  // ─── HEAD & NECK ───
  sternocleidomastoid: {
    origin: 'Sternum (manubrium) and medial clavicle',
    insertion: 'Mastoid process of temporal bone',
    action: 'Unilateral: lateral flexion, contralateral rotation. Bilateral: neck flexion',
    innervation: 'Accessory nerve (CN XI), C2-C3',
  },
  platysma: {
    origin: 'Fascia of deltoid and pectoralis major',
    insertion: 'Mandible, skin of lower face',
    action: 'Depresses mandible and corners of mouth; tenses skin of neck',
    innervation: 'Facial nerve (CN VII)',
  },
  digastric: {
    origin: 'Anterior belly: digastric fossa of mandible. Posterior belly: mastoid process',
    insertion: 'Intermediate tendon to hyoid bone',
    action: 'Depresses mandible, elevates hyoid',
    innervation: 'Anterior: mylohyoid nerve (CN V3). Posterior: facial nerve (CN VII)',
  },
  mylohyoid: {
    origin: 'Mylohyoid line of mandible',
    insertion: 'Hyoid bone and mylohyoid raphe',
    action: 'Elevates hyoid, floor of mouth; depresses mandible',
    innervation: 'Mylohyoid nerve (CN V3)',
  },
  sternohyoid: {
    origin: 'Manubrium of sternum and medial clavicle',
    insertion: 'Body of hyoid bone',
    action: 'Depresses hyoid bone after swallowing',
    innervation: 'Ansa cervicalis (C1-C3)',
  },
  omohyoid: {
    origin: 'Superior border of scapula',
    insertion: 'Body of hyoid bone',
    action: 'Depresses hyoid bone',
    innervation: 'Ansa cervicalis (C1-C3)',
  },
  thyrohyoid: {
    origin: 'Thyroid cartilage (oblique line)',
    insertion: 'Body and greater horn of hyoid bone',
    action: 'Depresses hyoid or elevates larynx',
    innervation: 'C1 via hypoglossal nerve',
  },
  'splenius capitis': {
    origin: 'Nuchal ligament, spinous processes C7-T3',
    insertion: 'Mastoid process, lateral superior nuchal line',
    action: 'Unilateral: lateral flexion, ipsilateral rotation. Bilateral: extension of head',
    innervation: 'Posterior rami of middle cervical nerves',
  },
  'splenius cervicis': {
    origin: 'Spinous processes T3-T6',
    insertion: 'Transverse processes C1-C3',
    action: 'Extends and rotates the cervical spine',
    innervation: 'Posterior rami of lower cervical nerves',
  },
  'levator veli palatini': {
    origin: 'Petrous part of temporal bone, medial auditory tube',
    insertion: 'Palatine aponeurosis',
    action: 'Elevates soft palate during swallowing and speech',
    innervation: 'Vagus nerve (CN X) via pharyngeal plexus',
  },
  'tensor veli palatini': {
    origin: 'Scaphoid fossa, medial auditory tube cartilage',
    insertion: 'Palatine aponeurosis',
    action: 'Tenses soft palate, opens auditory tube',
    innervation: 'Medial pterygoid nerve (CN V3)',
  },
  'scalenus anterior': {
    origin: 'Anterior tubercles of transverse processes C3-C6',
    insertion: 'Scalene tubercle on first rib',
    action: 'Elevates first rib; lateral flexion and rotation of neck',
    innervation: 'Anterior rami of cervical nerves C5-C7',
  },
  'scalenus medius': {
    origin: 'Posterior tubercles of transverse processes C2-C7',
    insertion: 'Superior surface of first rib (behind subclavian artery groove)',
    action: 'Elevates first rib; lateral flexion of neck',
    innervation: 'Anterior rami of cervical nerves C3-C8',
  },
  'scalenus posterior': {
    origin: 'Posterior tubercles of transverse processes C4-C6',
    insertion: 'External surface of second rib',
    action: 'Elevates second rib; lateral flexion of neck',
    innervation: 'Anterior rami of cervical nerves C6-C8',
  },
  geniohyoid: {
    origin: 'Inferior mental spine (genial tubercle) of mandible',
    insertion: 'Body of hyoid bone',
    action: 'Elevates and protracts hyoid; depresses mandible when hyoid is fixed',
    innervation: 'C1 via hypoglossal nerve (CN XII)',
  },
  sternothyroid: {
    origin: 'Posterior surface of manubrium of sternum',
    insertion: 'Oblique line of thyroid cartilage',
    action: 'Depresses larynx after swallowing or vocalization',
    innervation: 'Ansa cervicalis (C1-C3)',
  },
  stylohyoid: {
    origin: 'Styloid process of temporal bone',
    insertion: 'Body of hyoid bone (at junction with greater horn)',
    action: 'Elevates and retracts hyoid bone during swallowing',
    innervation: 'Facial nerve (CN VII)',
  },
  'longus capitis': {
    origin: 'Anterior tubercles of transverse processes C3-C6',
    insertion: 'Basilar part of occipital bone',
    action: 'Flexion of head; slight rotation',
    innervation: 'Anterior rami of cervical nerves C1-C3',
  },
  'longus colli': {
    origin: 'Anterior vertebral bodies and transverse processes C1-T3',
    insertion: 'Anterior tubercle of atlas (C1), vertebral bodies C2-C4, transverse processes C5-C6',
    action: 'Flexion of cervical spine; slight rotation and lateral flexion',
    innervation: 'Anterior rami of cervical nerves C2-C6',
  },
  'lateral crico-arytenoid': {
    origin: 'Arch of cricoid cartilage (lateral surface)',
    insertion: 'Muscular process of arytenoid cartilage',
    action: 'Adducts vocal cords; closes rima glottidis',
    innervation: 'Recurrent laryngeal nerve (CN X)',
  },
  'posterior crico-arytenoid': {
    origin: 'Posterior surface of cricoid cartilage lamina',
    insertion: 'Muscular process of arytenoid cartilage',
    action: 'Abducts vocal cords; only opener of rima glottidis',
    innervation: 'Recurrent laryngeal nerve (CN X)',
  },
  'thyro-arytenoid': {
    origin: 'Inner surface of thyroid cartilage',
    insertion: 'Anterolateral surface of arytenoid cartilage',
    action: 'Relaxes and shortens vocal cords; adducts vocal folds',
    innervation: 'Recurrent laryngeal nerve (CN X)',
  },
  'transverse arytenoid': {
    origin: 'Posterior surface of one arytenoid cartilage',
    insertion: 'Posterior surface of opposite arytenoid cartilage',
    action: 'Adducts arytenoid cartilages; closes posterior rima glottidis',
    innervation: 'Recurrent laryngeal nerve (CN X)',
  },
  'oblique arytenoid': {
    origin: 'Muscular process of one arytenoid cartilage',
    insertion: 'Apex of opposite arytenoid cartilage',
    action: 'Adducts arytenoid cartilages; closes laryngeal inlet',
    innervation: 'Recurrent laryngeal nerve (CN X)',
  },
  cricothyroid: {
    origin: 'Anterior and lateral surfaces of cricoid arch',
    insertion: 'Inferior horn and lower lamina of thyroid cartilage',
    action: 'Tenses and elongates vocal cords; raises pitch',
    innervation: 'External laryngeal nerve (CN X)',
  },
  // Facial muscles (Z-Anatomy)
  frontalis: {
    origin: 'Galea aponeurotica (epicranial aponeurosis)',
    insertion: 'Skin of eyebrows and root of nose',
    action: 'Raises eyebrows; wrinkles forehead skin (expression of surprise)',
    innervation: 'Temporal branch of facial nerve (CN VII)',
  },
  'orbicularis oculi': {
    origin:
      'Orbital: medial orbital margin, medial palpebral ligament. Palpebral: medial palpebral ligament, lacrimal bone',
    insertion: 'Circular (returns to origin); lateral palpebral raphe',
    action: 'Orbital part: forceful eye closure. Palpebral part: gentle blinking',
    innervation: 'Temporal and zygomatic branches of facial nerve (CN VII)',
  },
  'orbicularis oris': {
    origin: 'Maxilla and mandible; blends with other perioral muscles',
    insertion: 'Skin and mucous membrane of lips',
    action: 'Closes and protrudes lips; essential for speech, eating, and kissing',
    innervation: 'Buccal and marginal mandibular branches of facial nerve (CN VII)',
  },
  'zygomaticus major': {
    origin: 'Lateral surface of zygomatic bone',
    insertion: 'Angle of mouth (modiolus)',
    action: 'Draws angle of mouth superiorly and laterally (smiling)',
    innervation: 'Buccal branch of facial nerve (CN VII)',
  },
  'zygomaticus minor': {
    origin: 'Lateral surface of zygomatic bone (anterior to zygomaticus major)',
    insertion: 'Upper lip, lateral to levator labii superioris',
    action: 'Elevates upper lip; deepens nasolabial furrow',
    innervation: 'Buccal branch of facial nerve (CN VII)',
  },
  'levator labii superioris': {
    origin: 'Maxilla, above infraorbital foramen',
    insertion: 'Skin and muscle of upper lip',
    action: 'Elevates upper lip',
    innervation: 'Buccal branch of facial nerve (CN VII)',
  },
  'depressor labii inferioris': {
    origin: 'Oblique line of mandible, between mental foramen and symphysis',
    insertion: 'Skin and mucosa of lower lip',
    action: 'Depresses and everts lower lip',
    innervation: 'Marginal mandibular branch of facial nerve (CN VII)',
  },
  'depressor anguli oris': {
    origin: 'Oblique line of mandible (below mental foramen)',
    insertion: 'Angle of mouth (modiolus)',
    action: 'Depresses angle of mouth (frowning)',
    innervation: 'Marginal mandibular branch of facial nerve (CN VII)',
  },
  risorius: {
    origin: 'Parotid fascia and skin over masseter',
    insertion: 'Angle of mouth (modiolus)',
    action: 'Retracts angle of mouth; produces a false smile or grimace',
    innervation: 'Buccal branch of facial nerve (CN VII)',
  },
  mentalis: {
    origin: 'Incisive fossa of mandible (below incisors)',
    insertion: 'Skin of chin',
    action: 'Protrudes lower lip; wrinkles chin skin (pouting)',
    innervation: 'Marginal mandibular branch of facial nerve (CN VII)',
  },
  procerus: {
    origin: 'Nasal bone and upper lateral nasal cartilage',
    insertion: 'Skin between eyebrows (glabella)',
    action: 'Depresses medial eyebrow; produces transverse wrinkles over bridge of nose',
    innervation: 'Temporal branch of facial nerve (CN VII)',
  },
  nasalis: {
    origin: 'Transverse part: maxilla lateral to nasal notch. Alar part: maxilla over lateral incisor',
    insertion: 'Transverse part: aponeurosis on bridge of nose. Alar part: alar cartilage',
    action: 'Transverse part: compresses nostril. Alar part: dilates nostril (flaring)',
    innervation: 'Buccal branch of facial nerve (CN VII)',
  },
  'corrugator supercilii': {
    origin: 'Medial end of superciliary arch of frontal bone',
    insertion: 'Skin above middle of eyebrow',
    action: 'Draws eyebrows medially and inferiorly (frowning)',
    innervation: 'Temporal branch of facial nerve (CN VII)',
  },
  // Mastication muscles (Z-Anatomy)
  temporalis: {
    origin: 'Temporal fossa and deep temporal fascia',
    insertion: 'Coronoid process and anterior ramus of mandible',
    action: 'Elevation and retraction of mandible; unilateral: ipsilateral deviation',
    innervation: 'Deep temporal nerves from mandibular nerve (CN V3)',
  },
  masseter: {
    origin:
      'Superficial part: zygomatic arch (anterior two-thirds). Deep part: zygomatic arch (posterior third)',
    insertion: 'Lateral surface of ramus and angle of mandible',
    action: 'Elevation and protrusion of mandible; powerful jaw closing for mastication',
    innervation: 'Masseteric nerve from mandibular nerve (CN V3)',
  },
  'medial pterygoid': {
    origin: 'Deep head: medial surface of lateral pterygoid plate. Superficial head: maxillary tuberosity',
    insertion: 'Medial surface of ramus and angle of mandible',
    action: 'Elevation of mandible; assists in protrusion and lateral movements',
    innervation: 'Medial pterygoid nerve from mandibular nerve (CN V3)',
  },
  'lateral pterygoid': {
    origin:
      'Superior head: infratemporal surface of sphenoid. Inferior head: lateral surface of lateral pterygoid plate',
    insertion: 'Superior head: articular disc and capsule of TMJ. Inferior head: pterygoid fovea of mandible',
    action: 'Protrusion and depression of mandible; lateral movements for grinding',
    innervation: 'Lateral pterygoid nerve from mandibular nerve (CN V3)',
  },

  // ─── SHOULDER ───
  deltoid: {
    origin: 'Lateral clavicle, acromion, spine of scapula',
    insertion: 'Deltoid tuberosity of humerus',
    action: 'Anterior: flexion, medial rotation. Middle: abduction. Posterior: extension, lateral rotation',
    innervation: 'Axillary nerve (C5, C6)',
  },
  supraspinatus: {
    origin: 'Supraspinous fossa of scapula',
    insertion: 'Superior facet of greater tubercle of humerus',
    action: 'Initiates abduction of shoulder (first 15°)',
    innervation: 'Suprascapular nerve (C5, C6)',
  },
  infraspinatus: {
    origin: 'Infraspinous fossa of scapula',
    insertion: 'Middle facet of greater tubercle of humerus',
    action: 'Lateral rotation of shoulder; stabilizes humeral head',
    innervation: 'Suprascapular nerve (C5, C6)',
  },
  subscapularis: {
    origin: 'Subscapular fossa',
    insertion: 'Lesser tubercle of humerus',
    action: 'Medial rotation of arm; stabilizes shoulder joint',
    innervation: 'Upper and lower subscapular nerves (C5, C6)',
  },
  'teres major': {
    origin: 'Inferior angle and lower lateral border of scapula',
    insertion: 'Medial lip of intertubercular groove of humerus',
    action: 'Adduction, extension, and medial rotation of arm',
    innervation: 'Lower subscapular nerve (C5, C6)',
  },
  'teres minor': {
    origin: 'Middle part of lateral border of scapula',
    insertion: 'Inferior facet of greater tubercle of humerus',
    action: 'Lateral rotation of arm; stabilizes shoulder',
    innervation: 'Axillary nerve (C5, C6)',
  },
  'levator scapulae': {
    origin: 'Transverse processes of C1-C4',
    insertion: 'Medial border of scapula (superior part)',
    action: 'Elevates scapula; tilts glenoid cavity inferiorly',
    innervation: 'Dorsal scapular nerve (C5), C3-C4',
  },
  subclavius: {
    origin: 'First rib at junction with its costal cartilage',
    insertion: 'Inferior surface of middle third of clavicle',
    action: 'Depresses and stabilizes clavicle; protects underlying neurovascular structures',
    innervation: 'Nerve to subclavius (C5, C6)',
  },

  // ─── CHEST ───
  'pectoralis major': {
    origin: 'Clavicle, sternum, costal cartilages 1-6, external oblique aponeurosis',
    insertion: 'Lateral lip of intertubercular groove of humerus',
    action: 'Flexion, adduction, and medial rotation of arm',
    innervation: 'Medial and lateral pectoral nerves (C5-T1)',
  },
  'pectoralis minor': {
    origin: 'Ribs 3-5 (near costal cartilages)',
    insertion: 'Coracoid process of scapula',
    action: 'Depresses, protracts, and downwardly rotates scapula',
    innervation: 'Medial pectoral nerve (C8, T1)',
  },
  'serratus anterior': {
    origin: 'Lateral surfaces of ribs 1-8',
    insertion: 'Costal surface of medial border of scapula',
    action: 'Protracts and upwardly rotates scapula; stabilizes scapula to thorax',
    innervation: 'Long thoracic nerve (C5-C7)',
  },

  // ─── BACK ───
  trapezius: {
    origin: 'External occipital protuberance, nuchal ligament, spinous processes C7-T12',
    insertion: 'Lateral clavicle, acromion, spine of scapula',
    action: 'Upper: elevates scapula. Middle: retracts scapula. Lower: depresses scapula',
    innervation: 'Accessory nerve (CN XI), C3-C4',
  },
  'rhomboid major': {
    origin: 'Spinous processes of T2-T5',
    insertion: 'Medial border of scapula (below spine)',
    action: 'Retracts, elevates, and downwardly rotates scapula',
    innervation: 'Dorsal scapular nerve (C4, C5)',
  },
  'rhomboid minor': {
    origin: 'Spinous processes of C7-T1, nuchal ligament',
    insertion: 'Medial border of scapula (at spine level)',
    action: 'Retracts and elevates scapula',
    innervation: 'Dorsal scapular nerve (C4, C5)',
  },
  'serratus posterior inferior': {
    origin: 'Spinous processes of T11-L2',
    insertion: 'Inferior borders of ribs 9-12',
    action: 'Depresses ribs 9-12; aids forced expiration',
    innervation: 'Intercostal nerves T9-T12',
  },
  'serratus posterior superior': {
    origin: 'Spinous processes of C7-T3, nuchal ligament',
    insertion: 'Superior borders of ribs 2-5',
    action: 'Elevates ribs 2-5; aids inspiration',
    innervation: 'Intercostal nerves T2-T5',
  },
  'latissimus dorsi': {
    origin:
      'Spinous processes T7-L5, thoracolumbar fascia, iliac crest, inferior angle of scapula, ribs 9-12',
    insertion: 'Floor of intertubercular groove of humerus',
    action: 'Extension, adduction, and medial rotation of arm; assists in respiration',
    innervation: 'Thoracodorsal nerve (C6, C7, C8)',
  },
  'erector spinae': {
    origin: 'Sacrum, iliac crest, lumbar and lower thoracic spinous processes',
    insertion: 'Ribs, cervical and thoracic transverse/spinous processes, mastoid process',
    action: 'Bilateral: extension of vertebral column. Unilateral: lateral flexion',
    innervation: 'Posterior rami of spinal nerves',
  },
  'iliocostalis cervicis': {
    origin: 'Angles of ribs 3-6',
    insertion: 'Transverse processes of C4-C6',
    action: 'Extension and lateral flexion of cervical spine',
    innervation: 'Posterior rami of cervical and upper thoracic spinal nerves',
  },
  'iliocostalis thoracis': {
    origin: 'Angles of ribs 7-12',
    insertion: 'Angles of ribs 1-6 and transverse process of C7',
    action: 'Extension and lateral flexion of thoracic spine; stabilizes ribs',
    innervation: 'Posterior rami of thoracic spinal nerves',
  },
  'iliocostalis lumborum': {
    origin: 'Sacrum, iliac crest, thoracolumbar fascia',
    insertion: 'Angles of ribs 6-12 and transverse processes of L1-L4',
    action: 'Extension and lateral flexion of lumbar spine',
    innervation: 'Posterior rami of lumbar and lower thoracic spinal nerves',
  },
  'longissimus capitis': {
    origin: 'Transverse processes of T1-T5, articular processes of C4-C7',
    insertion: 'Mastoid process of temporal bone',
    action: 'Extension and lateral flexion of head; ipsilateral rotation',
    innervation: 'Posterior rami of middle and lower cervical spinal nerves',
  },
  'longissimus cervicis': {
    origin: 'Transverse processes of T1-T5',
    insertion: 'Transverse processes of C2-C6',
    action: 'Extension and lateral flexion of cervical spine',
    innervation: 'Posterior rami of cervical and upper thoracic spinal nerves',
  },
  'longissimus thoracis': {
    origin: 'Sacrum, spinous processes of lumbar vertebrae, transverse processes of lower thoracic vertebrae',
    insertion: 'Transverse processes of all thoracic vertebrae and lower 9-10 ribs',
    action: 'Extension and lateral flexion of thoracic and lumbar spine',
    innervation: 'Posterior rami of thoracic and lumbar spinal nerves',
  },
  'spinalis thoracis': {
    origin: 'Spinous processes of T11-L2',
    insertion: 'Spinous processes of T1-T8',
    action: 'Extension of thoracic spine',
    innervation: 'Posterior rami of thoracic spinal nerves',
  },
  'semispinalis capitis': {
    origin: 'Transverse processes of C4-T6',
    insertion: 'Between superior and inferior nuchal lines of occipital bone',
    action: 'Extension and lateral flexion of head; contralateral rotation',
    innervation: 'Posterior rami of cervical spinal nerves (C1-C6)',
  },
  'semispinalis cervicis': {
    origin: 'Transverse processes of T1-T6',
    insertion: 'Spinous processes of C2-C5',
    action: 'Extension and contralateral rotation of cervical spine',
    innervation: 'Posterior rami of cervical spinal nerves',
  },
  'semispinalis thoracis': {
    origin: 'Transverse processes of T6-T12',
    insertion: 'Spinous processes of C6-T4',
    action: 'Extension and contralateral rotation of thoracic spine',
    innervation: 'Posterior rami of thoracic spinal nerves',
  },
  interspinalis: {
    origin: 'Spinous process of vertebra below',
    insertion: 'Spinous process of vertebra above',
    action: 'Extension of vertebral column; postural stabilization',
    innervation: 'Posterior rami of spinal nerves',
  },
  intertransversarii: {
    origin: 'Transverse process of vertebra below',
    insertion: 'Transverse process of vertebra above',
    action: 'Lateral flexion of vertebral column; postural stabilization',
    innervation: 'Anterior and posterior rami of spinal nerves',
  },
  // Deep back muscles (Z-Anatomy)
  'multifidus cervicis': {
    origin: 'Articular processes of C4-C7 vertebrae',
    insertion: 'Spinous processes of vertebrae 2-4 levels above',
    action: 'Stabilizes cervical vertebrae; extension and contralateral rotation of cervical spine',
    innervation: 'Posterior rami of cervical spinal nerves',
  },
  'multifidus thoracis': {
    origin: 'Transverse processes of thoracic vertebrae',
    insertion: 'Spinous processes of vertebrae 2-4 levels above',
    action: 'Stabilizes thoracic vertebrae; extension and contralateral rotation of thoracic spine',
    innervation: 'Posterior rami of thoracic spinal nerves',
  },
  'multifidus lumborum': {
    origin: 'Sacrum, posterior superior iliac spine, mamillary processes of lumbar vertebrae',
    insertion: 'Spinous processes of vertebrae 2-4 levels above',
    action: 'Key spinal stabilizer; extension and contralateral rotation of lumbar spine',
    innervation: 'Posterior rami of lumbar spinal nerves',
  },
  rotatores: {
    origin: 'Transverse process of vertebra below',
    insertion: 'Lamina and base of spinous process of vertebra above (brevis: 1 level; longus: 2 levels)',
    action: 'Proprioception; assists extension and contralateral rotation of vertebral column',
    innervation: 'Posterior rami of spinal nerves',
  },
  'quadratus lumborum': {
    origin: 'Iliolumbar ligament, posterior iliac crest',
    insertion: 'Inferior border of 12th rib, transverse processes of L1-L4',
    action: 'Lateral flexion of trunk; fixes 12th rib during deep inspiration; extension of lumbar spine',
    innervation: 'Subcostal nerve (T12), lumbar plexus (L1-L4)',
  },
  'thoracolumbar fascia': {
    origin: 'Spinous processes of thoracic and lumbar vertebrae, sacrum, iliac crest',
    insertion: 'Transverse processes of lumbar vertebrae, 12th rib, internal oblique, transversus abdominis',
    action: 'Provides attachment and load transfer between trunk muscles; stabilizes the lumbar spine',
    notes: 'Three-layer fascial structure (posterior, middle, anterior) that encloses the deep back muscles',
  },

  // ─── UPPER ARM ───
  'biceps brachii': {
    origin: 'Short head: coracoid process. Long head: supraglenoid tubercle of scapula',
    insertion: 'Radial tuberosity and bicipital aponeurosis into deep fascia of forearm',
    action: 'Flexion of elbow, supination of forearm, assists shoulder flexion',
    innervation: 'Musculocutaneous nerve (C5, C6)',
  },
  'triceps brachii': {
    origin:
      'Long head: infraglenoid tubercle. Lateral head: posterior humerus above radial groove. Medial head: posterior humerus below radial groove',
    insertion: 'Olecranon process of ulna',
    action: 'Extension of elbow; long head assists shoulder extension/adduction',
    innervation: 'Radial nerve (C6-C8)',
  },
  brachialis: {
    origin: 'Distal half of anterior surface of humerus',
    insertion: 'Coronoid process and tuberosity of ulna',
    action: 'Flexion of elbow (primary flexor)',
    innervation: 'Musculocutaneous nerve (C5, C6)',
  },
  coracobrachialis: {
    origin: 'Coracoid process of scapula',
    insertion: 'Middle medial surface of humerus',
    action: 'Flexion and adduction of arm at shoulder',
    innervation: 'Musculocutaneous nerve (C5-C7)',
  },
  anconeus: {
    origin: 'Lateral epicondyle of humerus',
    insertion: 'Lateral surface of olecranon and posterior proximal ulna',
    action: 'Assists triceps in elbow extension; stabilizes elbow joint',
    innervation: 'Radial nerve (C7, C8)',
  },

  // ─── FOREARM ───
  brachioradialis: {
    origin: 'Lateral supracondylar ridge of humerus',
    insertion: 'Lateral surface of distal radius (styloid process)',
    action: 'Flexion of forearm; assists pronation and supination to neutral',
    innervation: 'Radial nerve (C5, C6)',
  },
  'pronator teres': {
    origin: 'Humeral head: medial epicondyle. Ulnar head: coronoid process',
    insertion: 'Middle of lateral surface of radius',
    action: 'Pronation and flexion of forearm',
    innervation: 'Median nerve (C6, C7)',
  },
  'pronator quadratus': {
    origin: 'Distal quarter of anterior surface of ulna',
    insertion: 'Distal quarter of anterior surface of radius',
    action: 'Pronation of forearm (primary pronator)',
    innervation: 'Anterior interosseous nerve (C8, T1)',
  },
  supinator: {
    origin: 'Lateral epicondyle, radial collateral ligament, supinator crest of ulna',
    insertion: 'Lateral, posterior, and anterior surfaces of proximal radius',
    action: 'Supination of forearm',
    innervation: 'Posterior interosseous nerve (C5, C6)',
  },
  'flexor carpi radialis': {
    origin: 'Medial epicondyle of humerus (common flexor origin)',
    insertion: 'Base of 2nd and 3rd metacarpals',
    action: 'Flexion and abduction (radial deviation) of wrist',
    innervation: 'Median nerve (C6, C7)',
  },
  'flexor carpi ulnaris': {
    origin: 'Humeral head: medial epicondyle. Ulnar head: olecranon and posterior ulna',
    insertion: 'Pisiform, hook of hamate, base of 5th metacarpal',
    action: 'Flexion and adduction (ulnar deviation) of wrist',
    innervation: 'Ulnar nerve (C7, C8)',
  },
  'extensor carpi radialis brevis': {
    origin: 'Lateral epicondyle of humerus (common extensor origin)',
    insertion: 'Base of 3rd metacarpal',
    action: 'Extension and abduction of wrist',
    innervation: 'Posterior interosseous nerve (C7, C8)',
  },
  'extensor carpi radialis longus': {
    origin: 'Lateral supracondylar ridge of humerus',
    insertion: 'Base of 2nd metacarpal',
    action: 'Extension and abduction of wrist',
    innervation: 'Radial nerve (C6, C7)',
  },
  'extensor carpi ulnaris': {
    origin: 'Lateral epicondyle and posterior ulna',
    insertion: 'Base of 5th metacarpal',
    action: 'Extension and adduction (ulnar deviation) of wrist',
    innervation: 'Posterior interosseous nerve (C7, C8)',
  },
  'flexor digitorum superficialis': {
    origin: 'Medial epicondyle, coronoid process, anterior radius',
    insertion: 'Middle phalanges of digits 2-5',
    action: 'Flexion of middle phalanges of digits 2-5; assists wrist flexion',
    innervation: 'Median nerve (C7, C8, T1)',
  },
  'flexor digitorum profundus': {
    origin: 'Proximal three-quarters of medial and anterior ulna, interosseous membrane',
    insertion: 'Distal phalanges of digits 2-5',
    action: 'Flexion of distal phalanges of digits 2-5',
    innervation: 'Anterior interosseous nerve (digits 2-3), ulnar nerve (digits 4-5)',
  },
  'extensor digitorum': {
    origin: 'Lateral epicondyle (common extensor origin)',
    insertion: 'Extensor expansions of digits 2-5',
    action: 'Extension of digits 2-5 at metacarpophalangeal joints',
    innervation: 'Posterior interosseous nerve (C7, C8)',
  },
  'extensor indicis': {
    origin: 'Posterior surface of distal ulna and interosseous membrane',
    insertion: 'Extensor expansion of index finger',
    action: 'Extension of index finger; assists wrist extension',
    innervation: 'Posterior interosseous nerve (C7, C8)',
  },
  'extensor digiti minimi': {
    origin: 'Lateral epicondyle (common extensor origin)',
    insertion: 'Extensor expansion of 5th digit',
    action: 'Extension of little finger',
    innervation: 'Posterior interosseous nerve (C7, C8)',
  },
  'extensor pollicis longus': {
    origin: 'Posterior surface of middle third of ulna, interosseous membrane',
    insertion: 'Base of distal phalanx of thumb',
    action: 'Extension of thumb at IP joint; assists wrist extension',
    innervation: 'Posterior interosseous nerve (C7, C8)',
  },
  'extensor pollicis brevis': {
    origin: 'Posterior surface of distal radius and interosseous membrane',
    insertion: 'Base of proximal phalanx of thumb',
    action: 'Extension of thumb at MCP joint',
    innervation: 'Posterior interosseous nerve (C7, C8)',
  },
  'abductor pollicis longus': {
    origin: 'Posterior surfaces of radius, ulna, and interosseous membrane',
    insertion: 'Base of 1st metacarpal',
    action: 'Abduction and extension of thumb at CMC joint',
    innervation: 'Posterior interosseous nerve (C7, C8)',
  },
  'palmaris longus': {
    origin: 'Medial epicondyle of humerus (common flexor origin)',
    insertion: 'Flexor retinaculum and palmar aponeurosis',
    action: 'Flexion of wrist; tenses palmar aponeurosis',
    innervation: 'Median nerve (C7, C8)',
  },
  'flexor pollicis longus': {
    origin: 'Anterior surface of radius and adjacent interosseous membrane',
    insertion: 'Base of distal phalanx of thumb',
    action: 'Flexion of thumb (IP and MCP joints)',
    innervation: 'Anterior interosseous nerve (C8, T1)',
  },

  // ─── ABDOMEN ───
  'external oblique': {
    origin: 'External surfaces of ribs 5-12',
    insertion: 'Linea alba, pubic tubercle, anterior iliac crest',
    action:
      'Bilateral: flexion of trunk, compression of abdomen. Unilateral: contralateral rotation, ipsilateral lateral flexion',
    innervation: 'Intercostal nerves T7-T12, iliohypogastric and ilioinguinal nerves',
  },
  'internal oblique': {
    origin: 'Thoracolumbar fascia, iliac crest, lateral inguinal ligament',
    insertion: 'Inferior borders of ribs 10-12, linea alba, pubic crest',
    action:
      'Bilateral: flexion of trunk, compression of abdomen. Unilateral: ipsilateral rotation and lateral flexion',
    innervation: 'Intercostal nerves T7-T12, iliohypogastric and ilioinguinal nerves (L1)',
  },
  'rectus abdominis': {
    origin: 'Pubic symphysis and pubic crest',
    insertion: 'Xiphoid process and costal cartilages of ribs 5-7',
    action: 'Flexion of trunk; compression of abdomen; stabilization of pelvis during walking',
    innervation: 'Intercostal nerves T7-T12',
  },
  'transversus abdominis': {
    origin:
      'Internal surfaces of costal cartilages 7-12, thoracolumbar fascia, iliac crest, lateral inguinal ligament',
    insertion: 'Linea alba, pubic crest, pectineal line',
    action: 'Compression of abdomen; core stabilization; increases intra-abdominal pressure',
    innervation: 'Intercostal nerves T7-T12, iliohypogastric and ilioinguinal nerves (L1)',
  },

  // ─── TRUNK ───
  diaphragm: {
    origin:
      'Xiphoid process, costal cartilages 7-12, L1-L3 vertebral bodies, medial/lateral arcuate ligaments',
    insertion: 'Central tendon',
    action: 'Primary muscle of respiration; contraction increases thoracic volume',
    innervation: 'Phrenic nerve (C3, C4, C5)',
  },
  'external intercostal': {
    origin: 'Inferior border of rib above',
    insertion: 'Superior border of rib below',
    action: 'Elevates ribs during inspiration',
    innervation: 'Intercostal nerves',
  },
  'internal intercostal': {
    origin: 'Superior border of rib below',
    insertion: 'Inferior border of rib above',
    action: 'Depresses ribs during forced expiration',
    innervation: 'Intercostal nerves',
  },
  'innermost intercostal': {
    origin: 'Internal surface of rib above',
    insertion: 'Internal surface of rib below',
    action: 'Depresses ribs; assists internal intercostals',
    innervation: 'Intercostal nerves',
  },
  'transversus thoracis': {
    origin: 'Posterior surface of lower sternum and xiphoid process',
    insertion: 'Internal surfaces of costal cartilages 2-6',
    action: 'Depresses costal cartilages; assists forced expiration',
    innervation: 'Intercostal nerves T2-T6',
  },

  // ─── HIP & GLUTES ───
  'gluteus maximus': {
    origin: 'Posterior ilium, sacrum, coccyx, thoracolumbar fascia, sacrotuberous ligament',
    insertion: 'Iliotibial tract and gluteal tuberosity of femur',
    action: 'Extension and lateral rotation of hip; upper fibers: abduction; lower fibers: adduction',
    innervation: 'Inferior gluteal nerve (L5, S1, S2)',
  },
  'gluteus medius': {
    origin: 'External surface of ilium between anterior and posterior gluteal lines',
    insertion: 'Lateral surface of greater trochanter of femur',
    action: 'Abduction and medial rotation of hip; stabilizes pelvis during gait',
    innervation: 'Superior gluteal nerve (L4, L5, S1)',
  },
  'gluteus minimus': {
    origin: 'External surface of ilium between anterior and inferior gluteal lines',
    insertion: 'Anterior surface of greater trochanter',
    action: 'Abduction and medial rotation of hip',
    innervation: 'Superior gluteal nerve (L4, L5, S1)',
  },
  piriformis: {
    origin: 'Anterior surface of sacrum (S2-S4)',
    insertion: 'Superior border of greater trochanter',
    action: 'Lateral rotation, abduction of flexed hip; stabilizes hip joint',
    innervation: 'Nerve to piriformis (S1, S2)',
  },
  'obturator internus': {
    origin: 'Internal surface of obturator membrane and surrounding bone',
    insertion: 'Medial surface of greater trochanter',
    action: 'Lateral rotation of hip; abduction of flexed hip',
    innervation: 'Nerve to obturator internus (L5, S1, S2)',
  },
  'obturator externus': {
    origin: 'External surface of obturator membrane and surrounding bone',
    insertion: 'Trochanteric fossa of femur',
    action: 'Lateral rotation of hip',
    innervation: 'Posterior branch of obturator nerve (L3, L4)',
  },
  iliacus: {
    origin: 'Iliac fossa, ala of sacrum',
    insertion: 'Lesser trochanter of femur (with psoas major)',
    action: 'Flexion of hip',
    innervation: 'Femoral nerve (L2, L3)',
  },
  'psoas major': {
    origin: 'Transverse processes and vertebral bodies of T12-L5',
    insertion: 'Lesser trochanter of femur',
    action: 'Flexion of hip; lateral flexion of trunk',
    innervation: 'Lumbar plexus (L1, L2, L3)',
  },
  'quadratus femoris': {
    origin: 'Lateral border of ischial tuberosity',
    insertion: 'Quadrate tubercle on intertrochanteric crest',
    action: 'Lateral rotation of hip',
    innervation: 'Nerve to quadratus femoris (L5, S1)',
  },
  'tensor fasciae latae': {
    origin: 'Anterior superior iliac spine (ASIS) and anterior iliac crest',
    insertion: 'Iliotibial tract (which attaches to lateral tibial condyle)',
    action: 'Flexion, abduction, and medial rotation of hip; stabilizes knee in extension',
    innervation: 'Superior gluteal nerve (L4, L5, S1)',
  },
  'gemellus superior': {
    origin: 'Ischial spine',
    insertion: 'Medial surface of greater trochanter (with obturator internus tendon)',
    action: 'Lateral rotation of hip; abduction of flexed hip',
    innervation: 'Nerve to obturator internus (L5, S1, S2)',
  },
  'gemellus inferior': {
    origin: 'Ischial tuberosity',
    insertion: 'Medial surface of greater trochanter (with obturator internus tendon)',
    action: 'Lateral rotation of hip; abduction of flexed hip',
    innervation: 'Nerve to quadratus femoris (L5, S1, S2)',
  },
  pectineus: {
    origin: 'Pectineal line of pubis (between pubic tubercle and iliopubic eminence)',
    insertion: 'Pectineal line of femur (between lesser trochanter and linea aspera)',
    action: 'Adduction and flexion of hip; assists medial rotation',
    innervation: 'Femoral nerve (L2, L3), sometimes obturator nerve',
  },
  coccygeus: {
    origin: 'Ischial spine and sacrospinous ligament',
    insertion: 'Inferior sacrum and coccyx',
    action: 'Supports pelvic floor; flexes coccyx; assists in pelvic organ support',
    innervation: 'Branches of S4-S5 spinal nerves',
  },
  iliococcygeus: {
    origin: 'Tendinous arch of levator ani (obturator fascia) and ischial spine',
    insertion: 'Coccyx and anococcygeal raphe',
    action: 'Supports pelvic viscera; elevates pelvic floor',
    innervation: 'Branches of S3-S4 via nerve to levator ani',
  },
  pubococcygeus: {
    origin: 'Posterior surface of pubic body and anterior tendinous arch',
    insertion: 'Anococcygeal raphe and coccyx',
    action: 'Supports pelvic viscera; constricts lower rectum and vagina',
    innervation: 'Branches of S3-S4 via nerve to levator ani',
  },
  puborectalis: {
    origin: 'Posterior surface of pubic body',
    insertion: 'Forms a sling around the anorectal junction',
    action: 'Maintains anorectal angle; essential for fecal continence',
    innervation: 'Branches of S3-S4 via nerve to levator ani',
  },
  'external anal sphincter': {
    origin: 'Anococcygeal ligament and coccyx',
    insertion: 'Perineal body',
    action: 'Closes anal canal; maintains fecal continence',
    innervation: 'Inferior rectal nerve (S2-S4) via pudendal nerve',
  },

  // ─── UPPER LEG ───
  'rectus femoris': {
    origin: 'Anterior inferior iliac spine (straight head); superior acetabulum (reflected head)',
    insertion: 'Tibial tuberosity via patellar ligament',
    action: 'Extension of knee; flexion of hip',
    innervation: 'Femoral nerve (L2, L3, L4)',
  },
  'vastus lateralis': {
    origin: 'Greater trochanter, intertrochanteric line, linea aspera',
    insertion: 'Tibial tuberosity via patellar ligament',
    action: 'Extension of knee',
    innervation: 'Femoral nerve (L2, L3, L4)',
  },
  'vastus medialis': {
    origin: 'Intertrochanteric line, linea aspera, medial supracondylar line',
    insertion: 'Tibial tuberosity via patellar ligament; medial border of patella',
    action: 'Extension of knee; stabilizes patella (especially VMO portion)',
    innervation: 'Femoral nerve (L2, L3, L4)',
  },
  'vastus intermedius': {
    origin: 'Anterior and lateral surfaces of femoral shaft',
    insertion: 'Tibial tuberosity via patellar ligament',
    action: 'Extension of knee',
    innervation: 'Femoral nerve (L2, L3, L4)',
  },
  'biceps femoris': {
    origin: 'Long head: ischial tuberosity. Short head: linea aspera, lateral supracondylar line',
    insertion: 'Head of fibula; lateral condyle of tibia',
    action: 'Flexion of knee; extension and lateral rotation of hip (long head)',
    innervation: 'Long head: tibial division. Short head: common fibular division of sciatic nerve',
  },
  semitendinosus: {
    origin: 'Ischial tuberosity',
    insertion: 'Medial surface of proximal tibia (pes anserinus)',
    action: 'Flexion of knee; extension and medial rotation of hip',
    innervation: 'Tibial division of sciatic nerve (L5, S1, S2)',
  },
  semimembranosus: {
    origin: 'Ischial tuberosity',
    insertion: 'Posterior medial condyle of tibia',
    action: 'Flexion of knee; extension and medial rotation of hip',
    innervation: 'Tibial division of sciatic nerve (L5, S1, S2)',
  },
  sartorius: {
    origin: 'Anterior superior iliac spine (ASIS)',
    insertion: 'Medial surface of proximal tibia (pes anserinus)',
    action: 'Flexion, abduction, and lateral rotation of hip; flexion of knee',
    innervation: 'Femoral nerve (L2, L3)',
  },
  gracilis: {
    origin: 'Body and inferior ramus of pubis',
    insertion: 'Medial surface of proximal tibia (pes anserinus)',
    action: 'Adduction of hip; flexion and medial rotation of knee',
    innervation: 'Obturator nerve (L2, L3)',
  },
  'adductor longus': {
    origin: 'Body of pubis (below pubic crest)',
    insertion: 'Middle third of linea aspera',
    action: 'Adduction of hip; assists flexion and medial rotation',
    innervation: 'Obturator nerve (L2, L3, L4)',
  },
  'adductor brevis': {
    origin: 'Body and inferior ramus of pubis',
    insertion: 'Pectineal line and proximal linea aspera',
    action: 'Adduction of hip; assists flexion',
    innervation: 'Obturator nerve (L2, L3, L4)',
  },
  'adductor magnus': {
    origin: 'Inferior pubic ramus, ischial ramus, ischial tuberosity',
    insertion: 'Linea aspera, medial supracondylar line, adductor tubercle',
    action: 'Adduction of hip; adductor part: flexion; hamstring part: extension',
    innervation: 'Obturator nerve (adductor part), tibial part of sciatic nerve (hamstring part)',
  },
  'adductor minimus': {
    origin: 'Inferior pubic ramus',
    insertion: 'Medial lip of linea aspera (proximal)',
    action: 'Adduction and flexion of hip',
    innervation: 'Obturator nerve (L2, L3, L4)',
  },
  'iliotibial tract': {
    origin: 'Tensor fasciae latae and gluteus maximus (iliac crest, anterior superior iliac spine)',
    insertion: "Gerdy's tubercle on the lateral condyle of tibia",
    action: 'Stabilizes the knee in extension; assists abduction of hip; lateral stabilizer during gait',
    notes:
      'Thick band of deep fascia running along lateral thigh; common source of IT band syndrome in runners',
  },

  // ─── LOWER LEG ───
  gastrocnemius: {
    origin: 'Medial head: medial condyle of femur. Lateral head: lateral condyle of femur',
    insertion: 'Calcaneus via calcaneal (Achilles) tendon',
    action: 'Plantarflexion of ankle; assists flexion of knee',
    innervation: 'Tibial nerve (S1, S2)',
  },
  soleus: {
    origin: 'Posterior surface of head and upper quarter of fibula; soleal line and middle third of tibia',
    insertion: 'Calcaneus via calcaneal (Achilles) tendon',
    action: 'Plantarflexion of ankle (especially during walking/standing)',
    innervation: 'Tibial nerve (S1, S2)',
  },
  'tibialis anterior': {
    origin: 'Lateral condyle and upper two-thirds of lateral surface of tibia',
    insertion: 'Medial cuneiform and base of 1st metatarsal',
    action: 'Dorsiflexion and inversion of foot',
    innervation: 'Deep fibular nerve (L4, L5)',
  },
  'tibialis posterior': {
    origin: 'Posterior surfaces of tibia, fibula, and interosseous membrane',
    insertion: 'Navicular, cuneiforms, cuboid, bases of metatarsals 2-4',
    action: 'Plantarflexion and inversion of foot; supports medial arch',
    innervation: 'Tibial nerve (L4, L5)',
  },
  'fibularis longus': {
    origin: 'Head and upper two-thirds of lateral surface of fibula',
    insertion: 'Base of 1st metatarsal and medial cuneiform',
    action: 'Eversion and plantarflexion of foot; supports transverse arch',
    innervation: 'Superficial fibular nerve (L5, S1, S2)',
  },
  'fibularis brevis': {
    origin: 'Lower two-thirds of lateral surface of fibula',
    insertion: 'Base of 5th metatarsal (tuberosity)',
    action: 'Eversion and plantarflexion of foot',
    innervation: 'Superficial fibular nerve (L5, S1, S2)',
  },
  'fibularis tertius': {
    origin: 'Distal third of anterior fibula and interosseous membrane',
    insertion: 'Base of 5th metatarsal (dorsal surface)',
    action: 'Dorsiflexion and eversion of foot',
    innervation: 'Deep fibular nerve (L5, S1)',
  },
  plantaris: {
    origin: 'Lateral supracondylar ridge of femur, oblique popliteal ligament',
    insertion: 'Calcaneus (medial to calcaneal tendon)',
    action: 'Weak plantarflexion of ankle; weak flexion of knee',
    innervation: 'Tibial nerve (S1, S2)',
  },
  popliteus: {
    origin: 'Lateral condyle of femur, lateral meniscus',
    insertion: 'Posterior surface of proximal tibia (above soleal line)',
    action: '"Unlocks" knee by medially rotating tibia; flexion of knee',
    innervation: 'Tibial nerve (L4, L5, S1)',
  },
  'extensor digitorum longus': {
    origin: 'Lateral condyle of tibia, upper three-quarters of anterior fibula',
    insertion: 'Middle and distal phalanges of digits 2-5',
    action: 'Extension of digits 2-5; dorsiflexion and eversion of foot',
    innervation: 'Deep fibular nerve (L5, S1)',
  },
  'extensor hallucis longus': {
    origin: 'Middle part of anterior fibula and interosseous membrane',
    insertion: 'Dorsal surface of distal phalanx of great toe',
    action: 'Extension of great toe; dorsiflexion of ankle',
    innervation: 'Deep fibular nerve (L5, S1)',
  },
  'extensor hallucis brevis': {
    origin: 'Dorsal surface of calcaneus',
    insertion: 'Base of proximal phalanx of great toe',
    action: 'Extension of great toe at MTP joint',
    innervation: 'Deep fibular nerve (S1, S2)',
  },
  'flexor digitorum longus': {
    origin: 'Posterior surface of middle third of tibia',
    insertion: 'Distal phalanges of digits 2-5',
    action: 'Flexion of digits 2-5; plantarflexion of ankle',
    innervation: 'Tibial nerve (S2, S3)',
  },
  'flexor hallucis longus': {
    origin: 'Lower two-thirds of posterior fibula',
    insertion: 'Base of distal phalanx of great toe',
    action: 'Flexion of great toe; plantarflexion of ankle; supports medial arch',
    innervation: 'Tibial nerve (S2, S3)',
  },
  'calcaneal tendon': {
    origin: 'Gastrocnemius and soleus muscle bellies',
    insertion: 'Posterior surface of calcaneus',
    action: 'Transmits force for plantarflexion of ankle',
    notes: 'Strongest and thickest tendon in the body; approximately 15cm long',
  },

  // ─── FOOT ───
  'abductor hallucis': {
    origin: 'Medial process of calcaneal tuberosity, flexor retinaculum, plantar aponeurosis',
    insertion: 'Medial side of base of proximal phalanx of great toe',
    action: 'Abduction and flexion of great toe',
    innervation: 'Medial plantar nerve (S1, S2)',
  },
  'flexor digitorum brevis': {
    origin: 'Medial process of calcaneal tuberosity, plantar aponeurosis',
    insertion: 'Middle phalanges of digits 2-5',
    action: 'Flexion of middle phalanges of digits 2-5',
    innervation: 'Medial plantar nerve (S1, S2)',
  },
  'flexor accessorius': {
    origin: 'Medial and lateral surfaces of calcaneus',
    insertion: 'Tendons of flexor digitorum longus',
    action: 'Assists flexor digitorum longus by correcting oblique pull',
    innervation: 'Lateral plantar nerve (S1, S2)',
  },
  'flexor hallucis brevis': {
    origin: 'Plantar surface of cuboid and lateral cuneiforms',
    insertion: 'Both sides of base of proximal phalanx of great toe',
    action: 'Flexion of great toe at MTP joint',
    innervation: 'Medial plantar nerve (S1, S2)',
  },
  'abductor digiti minimi': {
    origin: 'Lateral process of calcaneal tuberosity, plantar aponeurosis',
    insertion: 'Lateral side of base of proximal phalanx of 5th toe',
    action: 'Abduction and flexion of 5th toe',
    innervation: 'Lateral plantar nerve (S1, S2)',
  },
  'flexor digiti minimi brevis': {
    origin: 'Base of 5th metatarsal, sheath of fibularis longus',
    insertion: 'Lateral side of base of proximal phalanx of 5th toe',
    action: 'Flexion of 5th toe at MTP joint',
    innervation: 'Lateral plantar nerve (S2, S3)',
  },

  // ─── HAND ───
  'abductor pollicis brevis': {
    origin: 'Flexor retinaculum, scaphoid, trapezium',
    insertion: 'Lateral side of base of proximal phalanx of thumb',
    action: 'Abduction of thumb at CMC joint',
    innervation: 'Median nerve (C8, T1)',
  },
  'opponens pollicis': {
    origin: 'Flexor retinaculum and trapezium',
    insertion: 'Lateral border of 1st metacarpal',
    action: 'Opposition of thumb (medial rotation and flexion at CMC joint)',
    innervation: 'Median nerve (C8, T1)',
  },
  'flexor pollicis brevis': {
    origin: 'Superficial head: flexor retinaculum, trapezium. Deep head: trapezoid, capitate',
    insertion: 'Base of proximal phalanx of thumb',
    action: 'Flexion of thumb at MCP joint',
    innervation: 'Superficial head: median nerve. Deep head: ulnar nerve (C8, T1)',
  },
  'adductor pollicis': {
    origin: 'Oblique head: capitate, bases of 2nd-3rd metacarpals. Transverse head: shaft of 3rd metacarpal',
    insertion: 'Medial side of base of proximal phalanx of thumb',
    action: 'Adduction of thumb',
    innervation: 'Deep branch of ulnar nerve (C8, T1)',
  },
};

/**
 * Look up anatomical info for a given mesh name.
 * Tries to match against the ANATOMY_DB using fuzzy keyword matching.
 */
export function getMuscleInfo(meshName: string): AnatomyInfo {
  const nameLower = meshName.toLowerCase();

  // Try exact match first (after removing left/right prefix)
  const stripped = nameLower
    .replace(/^(left|right)\s+/, '')
    .replace(/\s+(of\s+)?(left|right)\s+.*$/, '')
    .replace(/\s*\(\d+\)$/, '')
    .trim();

  if (ANATOMY_DB[stripped]) {
    return ANATOMY_DB[stripped];
  }

  // Try partial matches
  for (const [key, info] of Object.entries(ANATOMY_DB)) {
    if (nameLower.includes(key)) {
      return info;
    }
  }

  // Try matching substrings
  for (const [key, info] of Object.entries(ANATOMY_DB)) {
    const keyWords = key.split(' ');
    if (keyWords.length >= 2 && keyWords.every((w) => nameLower.includes(w))) {
      return info;
    }
  }
  return UNKNOWN_INFO;
}
