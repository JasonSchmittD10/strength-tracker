import { supabase } from '@/lib/supabase'

export const NAME_ALIASES = {
  // Push A variants
  'Barbell Overhead Press':             'Overhead Press (Barbell)',
  'Dumbbell Incline Press':             'Incline Dumbbell Press',
  'Cable Tricep Pushdown':              'Tricep Pushdown (Cable)',
  'Dumbbell Overhead Tricep Extension': 'Overhead Tricep Extension',
  // Pull A variants
  'Pull-up':                            'Weighted Pull-Up',
  'Barbell Bent-over Row':              'Barbell Row (Pronated)',
  'Machine Chest-supported Row':        'Chest-Supported Row (DB)',
  'Cable Face Pull':                    'Face Pull (Cable)',
  'Barbell Bicep Curl':                 'Barbell Curl',
  'Dumbbell Hammer Curl':               'Hammer Curl (DB)',
  // Legs A variants
  'Barbell Back Squat':                 'Back Squat (Barbell)',
  'Barbell Romanian Deadlift':          'Romanian Deadlift',
  'Machine Leg Press':                  'Leg Press',
  'Machine Leg Curl':                   'Leg Curl (Machine)',
  'Dumbbell Walking Lunge':             'Walking Lunge (DB)',
  'Machine Standing Calf Raise':        'Standing Calf Raise',
  // Push B variants
  'Barbell Incline Bench Press':        'Incline Barbell Press',
  'Cable Chest Fly':                    'Cable Fly (Low-to-High)',
  'Dumbbell Lateral Raise':             'Lateral Raise (DB)',
  'Barbell Close Grip Bench Press':     'Close-Grip Bench Press',
  'EZ Bar Skull Crusher':               'Skull Crusher (EZ Bar)',
  // Pull B variants
  'Cable Lat Pulldown':                 'Lat Pulldown (Wide Grip)',
  'Cable Seated Row':                   'Cable Row (Neutral Grip)',
  'Dumbbell Single-arm Row':            'Single-Arm DB Row',
  'Cable Straight-arm Pulldown':        'Straight-Arm Pulldown',
  'Dumbbell Incline Curl':              'Incline DB Curl',
  'Cable Curl':                         'Cable Curl (Rope)',
  // Legs B variants
  'Barbell Bulgarian Split Squat':      'Bulgarian Split Squat (DB)',
  'Barbell Hack Squat':                 'Hack Squat / Leg Press',
  'Nordic Hamstring Curl':              'Nordic Curl / Lying Leg Curl',
  'Dumbbell Goblet Squat':              'Goblet Squat (Tempo)',
  'Barbell Seated Calf Raise':          'Seated Calf Raise',
  // GVT exercise name variants
  'Chest-Supported Row':                'Chest-Supported Row (DB)',
  'Wide-Grip Lat Pulldown':             'Lat Pulldown (Wide Grip)',
  'Back Squat':                         'Back Squat (Barbell)',
  'Lying Leg Curl':                     'Leg Curl (Machine)',
  // Known freeform historical variants
  'Pull-Up':                            'Weighted Pull-Up',
  'Pull Up':                            'Weighted Pull-Up',
  'Pullup':                             'Weighted Pull-Up',
  // PHAT — Pendlay row is a sub-variant of barbell row; aggregate history under one name
  'Barbell Row (Pendlay)':              'Barbell Row (Pronated)',
  'Pendlay Row':                        'Barbell Row (Pronated)',
  // PHAT — speed-day variants share history with the parent power lift
  'Bench Press (Speed)':                'Barbell Bench Press',
  'Back Squat (Speed)':                 'Back Squat (Barbell)',
  'Barbell Row (Speed)':                'Barbell Row (Pronated)',
  // PHAT — phrasing variants used in the new program data
  'Hack Squat (or Leg Press)':          'Hack Squat / Leg Press',
  'Leg Extension':                      'Leg Extension (Machine)',
  // ── Phase 3 reconciliation: collapse program-name variants onto canonical
  // DB rows. See docs/phase-3-name-reconciliation.md for rationale.
  // Conflict-resolution overflow (where multiple program names mapped to one
  // DB row; the most-specific name became canonical and the rest alias here):
  'Tricep Pushdown':                    'Tricep Pushdown (Cable)',
  'Lat Pulldown (Wide)':                'Lat Pulldown (Wide Grip)',
  'Incline Bench Press':                'Incline Barbell Press',
  'Bent-Over Rear Delt Raise':          'Rear Delt Fly (DB)',
  'Dips (Weighted)':                    'Parallel Bar Dip',
  'Tricep Dip':                         'Parallel Bar Dip',
  'Dumbbell Row':                       'Single-Arm DB Row',
  'Tricep Extension (DB)':              'Overhead Tricep Extension',
  'Overhead Press (Seated DB)':         'Seated Dumbbell Shoulder Press',
  'Seated DB Shoulder Press':           'Seated Dumbbell Shoulder Press',
  // Westside speed-day variants share PR history with the parent lift.
  'Box Squat (Speed)':                  'Back Squat (Barbell)',
  'Speed Bench (3 grips)':              'Barbell Bench Press',
  'Speed Deadlift':                     'Deadlift (Barbell)',
}

export function normalizeExerciseName(name) {
  return NAME_ALIASES[name] || name
}

// In-memory cache of canonical name → exercise UUID. The exercises table is
// read-only at runtime (admin-managed), so caching for the page lifetime is safe.
// `null` is cached for misses to avoid re-querying broken names.
const _exerciseIdCache = new Map()

export function _clearExerciseIdCache() {
  _exerciseIdCache.clear()
}

export async function resolveExerciseId(rawName) {
  if (!rawName) return null
  const canonical = normalizeExerciseName(rawName)
  if (_exerciseIdCache.has(canonical)) return _exerciseIdCache.get(canonical)

  const { data, error } = await supabase
    .from('exercises')
    .select('id')
    .eq('name', canonical)
    .eq('is_active', true)
    .maybeSingle()

  if (error) {
    console.error('[resolveExerciseId] query failed for', canonical, error)
    return null
  }
  const id = data?.id ?? null
  _exerciseIdCache.set(canonical, id)
  return id
}

export async function resolveAllExerciseIds(rawNames) {
  const result = new Map()
  const canonicalByRaw = new Map()
  const toFetch = new Set()

  for (const raw of rawNames) {
    if (!raw) { result.set(raw, null); continue }
    const canonical = normalizeExerciseName(raw)
    canonicalByRaw.set(raw, canonical)
    if (_exerciseIdCache.has(canonical)) {
      result.set(raw, _exerciseIdCache.get(canonical))
    } else {
      toFetch.add(canonical)
    }
  }

  if (toFetch.size > 0) {
    const { data, error } = await supabase
      .from('exercises')
      .select('id, name')
      .in('name', Array.from(toFetch))
      .eq('is_active', true)

    if (error) {
      console.error('[resolveAllExerciseIds] query failed:', error)
      // Cache nothing on error; let caller decide
      for (const raw of rawNames) {
        if (!result.has(raw)) result.set(raw, null)
      }
      return result
    }

    const idByCanonical = new Map((data ?? []).map(r => [r.name, r.id]))
    for (const canonical of toFetch) {
      const id = idByCanonical.get(canonical) ?? null
      _exerciseIdCache.set(canonical, id)
    }
    for (const raw of rawNames) {
      if (!result.has(raw)) {
        const canonical = canonicalByRaw.get(raw)
        result.set(raw, idByCanonical.get(canonical) ?? null)
      }
    }
  }

  return result
}

export const EXERCISE_LIBRARY = {
  'Barbell Bench Press': {
    muscles: { primary: ['Chest'], secondary: ['Front Delts', 'Triceps'] },
    pattern: 'Horizontal Push',
    cues: ['Retract and depress shoulder blades before unracking', 'Bar path: slight arc from lower chest to over shoulders', 'Drive feet into floor, maintain arch', 'Elbows ~45–60° from torso — not flared, not tucked'],
    notes: 'Primary strength marker for horizontal push. Keep touch point at lower chest, not mid-sternum.'
  },
  'Overhead Press (Barbell)': {
    muscles: { primary: ['Front Delts', 'Shoulders'], secondary: ['Triceps', 'Upper Chest'] },
    pattern: 'Vertical Push',
    cues: ['Bar starts at upper chest, elbows slightly in front of bar', 'Press in a slight back-arc, not straight up', 'Squeeze glutes and abs — no lumbar hyperextension', 'Bar finishes stacked over mid-foot'],
    notes: 'True shoulder strength test. Mobility limitation in thoracic extension is common — address if bar path is severely arced back.'
  },
  'Incline Dumbbell Press': {
    muscles: { primary: ['Upper Chest'], secondary: ['Front Delts', 'Triceps'] },
    pattern: 'Incline Push',
    cues: ['Bench at 30–45°, lower angle = more chest', 'Slight wrist pronation at top, supination at stretch', 'Control the descent — 2–3 sec down', 'Elbows should not drop below bench level'],
    notes: 'Best upper chest developer. Dumbbell allows greater range of motion than barbell variation.'
  },
  'Incline Barbell Press': {
    muscles: { primary: ['Upper Chest'], secondary: ['Front Delts', 'Triceps'] },
    pattern: 'Incline Push',
    cues: ['Keep shoulder blades pinched throughout', 'Touch high on chest, not neck', 'Elbows at ~45° to torso', 'Maintain controlled descent'],
    notes: 'Hypertrophy focus version. Higher rep ranges here prioritize upper chest development.'
  },
  'Weighted Pull-Up': {
    muscles: { primary: ['Lats', 'Back'], secondary: ['Biceps', 'Rear Delts'] },
    pattern: 'Vertical Pull',
    cues: ['Dead hang start, no kipping', 'Initiate by depressing scapulae, then pull elbows to ribs', 'Chest to bar, chin over bar is secondary', 'Control descent fully — 2–3 sec'],
    notes: 'King of vertical pulling. Belt attachment for added weight — go slow on loading progression.'
  },
  'Barbell Row (Pronated)': {
    muscles: { primary: ['Mid/Upper Back', 'Lats'], secondary: ['Biceps', 'Rear Delts'] },
    pattern: 'Horizontal Pull',
    cues: ['Hinge to ~45° — not upright, not parallel', 'Pull bar to lower sternum, not belly button', 'Elbows travel back and slightly out', 'Hold contraction 1 sec at top'],
    notes: 'Overhand grip hits more upper back. If lower back rounds under load, reduce weight before adding.'
  },
  'Back Squat (Barbell)': {
    muscles: { primary: ['Quads', 'Glutes'], secondary: ['Hamstrings', 'Spinal Erectors'] },
    pattern: 'Squat',
    cues: ['Bar on upper traps (high bar) or mid-traps (low bar)', 'Brace hard before descent — 360° pressure in core', 'Break at hips and knees simultaneously', 'Knees track over toes, do not cave'],
    notes: 'Primary lower body strength marker. High bar = more quad dominant. Low bar = more hip/posterior. Choose one and stay consistent.'
  },
  'Romanian Deadlift': {
    muscles: { primary: ['Hamstrings', 'Glutes'], secondary: ['Spinal Erectors', 'Lats'] },
    pattern: 'Hip Hinge',
    cues: ['Soft knee bend, maintained throughout', 'Push hips back — not down', 'Bar stays in contact with legs throughout', 'Feel stretch in hamstrings, not lower back'],
    notes: 'Best loaded stretch for hamstrings. If you feel it in lower back, your hips are not driving back far enough.'
  },
  'Trap Bar Deadlift': {
    muscles: { primary: ['Quads', 'Glutes', 'Hamstrings'], secondary: ['Spinal Erectors', 'Traps'] },
    pattern: 'Hip Hinge / Squat Hybrid',
    cues: ['Stand centered in trap bar', 'Load the hip crease — sit back and down slightly', 'Drive floor away, not just hips up', 'Maintain neutral spine throughout'],
    notes: 'More quad involvement than conventional. Easier to learn for beginners. High handles reduce ROM if needed.'
  },
  'Bulgarian Split Squat (DB)': {
    muscles: { primary: ['Quads', 'Glutes'], secondary: ['Hamstrings', 'Hip Flexors'] },
    pattern: 'Unilateral Squat',
    cues: ['Rear foot elevated on bench, laces down', 'Front foot far enough forward that knee stays over foot at bottom', 'Drive through front heel', 'Torso slight forward lean is normal'],
    notes: 'Most demanding unilateral leg exercise. Expect DOMS. Use DBs until form is locked in before loading heavier.'
  },
  'Dumbbell Shoulder Press': {
    muscles: { primary: ['Shoulders'], secondary: ['Triceps', 'Upper Chest'] },
    pattern: 'Vertical Push',
    cues: ['DBs at ear height to start, not behind head', 'Press up and slightly in — slight arc', 'Do not lock out elbows fully at top', 'Maintain braced core throughout'],
    notes: 'Greater range of motion than barbell. Each arm works independently — good for identifying imbalances.'
  },
  'Lat Pulldown (Wide Grip)': {
    muscles: { primary: ['Lats'], secondary: ['Biceps', 'Rear Delts'] },
    pattern: 'Vertical Pull',
    cues: ['Slight lean back — chest up toward bar', 'Pull elbows down and back, not just down', 'Full stretch at top — let shoulder blades elevate', 'Bar to upper chest, not behind neck'],
    notes: 'Prioritizes lat width. Wide grip reduces bicep contribution. Slow eccentric (3 sec) significantly increases stimulus.'
  },
  'Cable Row (Neutral Grip)': {
    muscles: { primary: ['Mid Back', 'Lats'], secondary: ['Biceps', 'Rear Delts'] },
    pattern: 'Horizontal Pull',
    cues: ['Sit tall — no rounding', 'Pull handle to lower sternum', 'Elbows stay close to torso', 'Fully extend arms on return — no half reps'],
    notes: 'Neutral grip reduces shoulder strain vs pronated. Control the eccentric — most people rush it.'
  },
  'Face Pull (Cable)': {
    muscles: { primary: ['Rear Delts'], secondary: ['Rotator Cuff', 'Mid Traps'] },
    pattern: 'Rear Delt / Rotator',
    cues: ['Cable at or above head height', 'Pull to face, hands finish by ears', 'External rotate at end — think "double bicep pose"', 'Light weight, feel the muscle'],
    notes: 'Best rear delt and rotator cuff health movement. Should be in every program. Never go heavy — it misses the point.'
  },
  'Cable Lateral Raise': {
    muscles: { primary: ['Lateral Delts'] },
    pattern: 'Shoulder Isolation',
    cues: ['Cable at lowest position, cross-body pull', 'Slight forward lean', 'Lead with elbow, not hand', 'Slow and controlled — 3 sec down'],
    notes: 'Cable provides constant tension vs dumbbells which drop off at bottom. Cross-body angle = better line of pull for lateral delt.'
  },
  'Lateral Raise (DB)': {
    muscles: { primary: ['Lateral Delts'] },
    pattern: 'Shoulder Isolation',
    cues: ['Slight forward bend at hip', 'Lead with elbow', 'Pinky slightly higher than thumb at top', 'No momentum — especially at start'],
    notes: 'Classic lateral delt builder. Tension drops near bottom with DBs — consider cable variation for superior stimulus.'
  },
  'Tricep Pushdown (Cable)': {
    muscles: { primary: ['Triceps'] },
    pattern: 'Elbow Extension',
    cues: ['Elbows pinned to sides', 'Full extension at bottom — squeeze triceps', 'Controlled return — allow elbows to flex fully', 'Lean slightly forward for better leverage'],
    notes: 'Best loaded position for triceps with constant cable tension. Rope attachment allows slight pronation at lockout for better contraction.'
  },
  'Overhead Tricep Extension': {
    muscles: { primary: ['Triceps (Long Head)'] },
    pattern: 'Elbow Extension (Overhead)',
    cues: ['Arms by ears, not flared', 'Only forearms move — upper arms stay fixed', 'Full stretch at bottom — feel long head stretch', 'Keep core braced to avoid lumbar extension'],
    notes: 'Only exercise that trains the long head in a fully stretched position. Critical for complete tricep development.'
  },
  'Skull Crusher (EZ Bar)': {
    muscles: { primary: ['Triceps'] },
    pattern: 'Elbow Extension',
    cues: ['Bar lowers toward forehead/behind head, not to nose', 'Upper arms stay perpendicular to floor', 'Full stretch at bottom', 'Control — this is injury-prone with too much weight'],
    notes: 'EZ bar reduces wrist strain vs straight bar. Go lighter than you think — tricep tendons are vulnerable at stretch.'
  },
  'Close-Grip Bench Press': {
    muscles: { primary: ['Triceps'], secondary: ['Chest', 'Front Delts'] },
    pattern: 'Horizontal Push',
    cues: ['Hands shoulder width, not super narrow', 'Elbows track close to torso', 'Full range of motion — touch chest', 'Treat like a tricep move, not a bench variation'],
    notes: 'Best compound tricep builder. Shoulder-width grip is safer than ultra-narrow which strains wrists.'
  },
  'Barbell Curl': {
    muscles: { primary: ['Biceps'] },
    pattern: 'Elbow Flexion',
    cues: ['No swinging — elbows fixed at sides', 'Supinate fully at top', 'Full extension at bottom', 'Controlled descent is where growth happens'],
    notes: 'Most loading potential for biceps. Straight bar may cause wrist discomfort — switch to EZ bar if needed.'
  },
  'Hammer Curl (DB)': {
    muscles: { primary: ['Brachialis', 'Brachioradialis'], secondary: ['Biceps'] },
    pattern: 'Elbow Flexion',
    cues: ['Neutral grip (thumbs up) throughout', 'No rotation', 'Full range, controlled descent', 'Can alternate or do both simultaneously'],
    notes: 'Targets brachialis which sits under the bicep — developing it pushes the bicep up for more peak. Great arm thickness builder.'
  },
  'Incline DB Curl': {
    muscles: { primary: ['Biceps (Long Head)'] },
    pattern: 'Elbow Flexion (Stretch)',
    cues: ['Bench at 45–60°', 'Let arms hang straight down at start — full stretch', 'Do not bring elbow forward as you curl', 'Control the stretch on the way down'],
    notes: 'Best stretch-position bicep exercise. Long head gets loaded fully at bottom. Slower and more controlled than standing curls.'
  },
  'Cable Curl (Rope)': {
    muscles: { primary: ['Biceps'] },
    pattern: 'Elbow Flexion',
    cues: ['Cable at lowest position', 'Supinate as you curl', 'Elbows stay at sides', 'Squeeze at top — rope ends spread slightly'],
    notes: 'Constant tension through full ROM. Good finisher — higher rep ranges with focus on the squeeze.'
  },
  'Straight-Arm Pulldown': {
    muscles: { primary: ['Lats'] },
    pattern: 'Lat Isolation',
    cues: ['Arms stay straight throughout — this is not a row', 'Hinge slightly at hips', 'Drive elbows toward hips', 'Feel stretch at top with shoulder elevation'],
    notes: 'Isolates lats without bicep involvement. Great for learning to feel the lat. Use at end of pull sessions.'
  },
  'Single-Arm DB Row': {
    muscles: { primary: ['Lats', 'Mid Back'], secondary: ['Biceps', 'Rear Delts'] },
    pattern: 'Horizontal Pull',
    cues: ['Brace hand and knee on bench', 'Pull elbow to hip — not to shoulder', 'Allow shoulder to elevate at bottom for full stretch', 'No trunk rotation'],
    notes: 'Heavy unilateral rowing. Can handle more load than bilateral variations. Great for targeting lats specifically.'
  },
  'Chest-Supported Row (DB)': {
    muscles: { primary: ['Mid/Upper Back'], secondary: ['Rear Delts', 'Biceps'] },
    pattern: 'Horizontal Pull',
    cues: ['Chest on incline bench removes lower back demand', 'Pull elbows back and slightly up for upper back', 'Full hang at bottom', 'Hold 1 sec contraction at top'],
    notes: 'Chest support eliminates lower back fatigue — allows full focus on back contraction. Best for higher volume work.'
  },
  'Leg Press': {
    muscles: { primary: ['Quads'], secondary: ['Glutes', 'Hamstrings'] },
    pattern: 'Quad-Dominant Push',
    cues: ['Feet shoulder width or slightly wider, mid-platform', 'Do not lock out knees fully at top', 'Full depth — thighs past parallel if mobility allows', 'Do not let lower back peel off pad'],
    notes: 'Safer way to pile on quad volume. Lower foot placement = more quad. Higher = more glute.'
  },
  'Leg Curl (Machine)': {
    muscles: { primary: ['Hamstrings'] },
    pattern: 'Knee Flexion',
    cues: ['Adjust pad to just above heel, not mid-calf', 'Curl fully and squeeze at top', 'Slow eccentric — 3 sec return', 'Keep hips down — no lifting at the top'],
    notes: 'Best isolation for hamstrings. Lying variation preferred over seated for most. Pair with RDLs for full hamstring development.'
  },
  'Walking Lunge (DB)': {
    muscles: { primary: ['Quads', 'Glutes'], secondary: ['Hamstrings', 'Balance'] },
    pattern: 'Unilateral Squat',
    cues: ['Long stride — back knee near floor', 'Front shin stays vertical', 'Drive through front heel to stand', 'Upright torso throughout'],
    notes: 'Adds coordination and balance demand to single-leg work. Use space efficiently — 12 each leg is 24 total steps.'
  },
  'Nordic Curl / Lying Leg Curl': {
    muscles: { primary: ['Hamstrings'] },
    pattern: 'Knee Flexion',
    cues: ['Nordic: control descent with eccentric focus — most value is in lowering', 'Machine: same as Leg Curl above', 'For Nordic: start assisted if needed, build toward unassisted'],
    notes: 'Nordic curl is one of the best hamstring injury prevention exercises. Eccentric emphasis is the key — most of the training effect comes from resisting the drop.'
  },
  'Goblet Squat (Tempo)': {
    muscles: { primary: ['Quads'], secondary: ['Glutes', 'Core'] },
    pattern: 'Squat',
    cues: ['Hold DB or KB at chest', '3-second descent minimum', 'Elbows inside knees at bottom', 'Full depth — this is a mobility builder too'],
    notes: 'Tempo emphasis makes this harder than it looks. Great for quad pump and maintaining squat depth under fatigue.'
  },
  'Standing Calf Raise': {
    muscles: { primary: ['Gastrocnemius'] },
    pattern: 'Ankle Plantar Flexion',
    cues: ['Full stretch at bottom — heel below platform', 'Pause at bottom 1 sec', 'Full rise at top — squeeze', 'Slow — calves respond to time under tension'],
    notes: 'Straight leg = gastrocnemius (the visible calf). Calves are stubborn — high reps and full range of motion matter more than load.'
  },
  'Seated Calf Raise': {
    muscles: { primary: ['Soleus'] },
    pattern: 'Ankle Plantar Flexion',
    cues: ['Knees bent — this shifts load to soleus', 'Same full range principles as standing', 'Heavier load possible than standing', 'Slow and deliberate'],
    notes: 'Bent knee = soleus (deeper calf, contributes to calf thickness). Train both standing and seated for complete calf development.'
  },
  'Hack Squat / Leg Press': {
    muscles: { primary: ['Quads'], secondary: ['Glutes'] },
    pattern: 'Quad-Dominant Push',
    cues: ['Full depth if machine allows', 'Feet shoulder width, mid-platform', 'Do not lock out knees', 'Control descent — 2 sec'],
    notes: 'Hack squat provides more vertical torso than barbell squat, making it very quad-dominant. Good barbell squat alternative on high fatigue days.'
  },
  'Cable Fly (Low-to-High)': {
    muscles: { primary: ['Upper Chest', 'Front Delts'] },
    pattern: 'Chest Isolation',
    cues: ['Cable set at lowest position', 'Arc arms up and in — not straight across', 'Slight forward lean', 'Maintain slight elbow bend throughout'],
    notes: 'Targets upper chest from a different angle than pressing. The stretch at the bottom with constant cable tension makes this very effective.'
  },
  'Plank': {
    muscles: { primary: ['Core'], secondary: ['Shoulders', 'Glutes'] },
    pattern: 'Isometric',
    cues: ['Forearms on floor, elbows under shoulders', 'Squeeze glutes and abs — no sagging hips', 'Neck neutral — eyes to floor', 'Breathe steadily — do not hold breath'],
    notes: 'Core endurance staple. Quality over duration — a 30-sec perfect plank beats 2 min with a sagging back.',
    inputType: 'time',
  },
  'Dead Hang': {
    muscles: { primary: ['Lats', 'Grip'], secondary: ['Rear Delts', 'Core'] },
    pattern: 'Isometric',
    cues: ['Fully passive hang — let shoulders elevate', 'No kipping or swinging', 'Grip with full hand, not fingertips', 'Breathe steadily'],
    notes: 'Excellent shoulder decompression and grip endurance builder. Progress by adding weight via belt.',
    inputType: 'time',
  },
  'Wall Sit': {
    muscles: { primary: ['Quads'], secondary: ['Glutes', 'Hamstrings'] },
    pattern: 'Isometric',
    cues: ['Back flat against wall', 'Thighs parallel to floor', 'Feet shoulder-width, toes forward', 'Do not rest hands on thighs'],
    notes: 'Pure quad endurance. Simple to perform with no equipment — effective finisher for leg sessions.',
    inputType: 'time',
  },
  'L-Sit': {
    muscles: { primary: ['Core', 'Hip Flexors'], secondary: ['Triceps', 'Shoulders'] },
    pattern: 'Isometric',
    cues: ['Legs straight and parallel to floor', 'Depress scapulae — push shoulders down', 'Point toes', 'Tuck version acceptable for beginners'],
    notes: 'Advanced isometric requiring hip flexor strength and tricep/shoulder stability. Use parallettes or dip bars.',
    inputType: 'time',
  },
  'Incline Dumbbell Flye': {
    muscles: { primary: ['Chest'], secondary: ['Front Delts'] },
    pattern: 'Chest Isolation',
    cues: ['Bench at 30–45°', 'Slight bend in elbows — maintain throughout', 'Arc down wide, feel the stretch at the bottom', 'Squeeze chest at top — do not press'],
    notes: 'Isolation move — lighter than pressing. The stretch at the bottom is the stimulus. Do not straighten arms or it becomes a press.',
  },
  'Hanging Leg Raise': {
    muscles: { primary: ['Hip Flexors', 'Lower Abs'], secondary: ['Core'] },
    pattern: 'Core Flexion',
    cues: ['Dead hang start — no swinging', 'Posterior pelvic tilt at the top to engage abs fully', 'Control the descent — do not just drop', 'Bent-knee version acceptable if hip flexors limit straight-leg form'],
    notes: 'Best lower ab exercise. The key is the posterior tilt at the top — without it, it is mostly hip flexors. Slow eccentric is essential.',
  },
  'Parallel Bar Dip': {
    muscles: { primary: ['Triceps', 'Chest'], secondary: ['Front Delts'] },
    pattern: 'Vertical Push',
    cues: ['Upright torso = more tricep; forward lean = more chest', 'Lower until upper arms are parallel to floor', 'No shoulder shrug at the bottom — keep blades down', 'Squeeze triceps at lockout'],
    notes: 'GVT main lift. Use bodyweight to start; add weight via belt once 10×10 is clean. Strict tempo matters more than load.',
  },
  'Chin-Up': {
    muscles: { primary: ['Biceps', 'Lats'], secondary: ['Rear Delts', 'Core'] },
    pattern: 'Vertical Pull',
    cues: ['Supinated grip (palms facing you), shoulder-width', 'Full dead hang at the bottom', 'Pull chest to bar — chin is secondary', 'Control the descent — 3–4 sec'],
    notes: 'Supinated grip gives greater bicep involvement than pull-up. GVT main lift paired with dips — expect cumulative fatigue by set 7+.',
  },
  'Bent-Over Rear Delt Raise': {
    muscles: { primary: ['Rear Delts'], secondary: ['Mid Traps', 'Rhomboids'] },
    pattern: 'Rear Delt / Rotator',
    cues: ['Hinge to ~45° or rest chest on incline bench', 'Lead with elbows, not hands', 'Raise to just above shoulder height', 'Pause at top — feel the rear delt contract'],
    notes: 'Excellent rear delt isolator. Keep weight light — rear delts are small. The pause at the top is critical for muscle connection.',
  },
}

export async function migrateExerciseNames(supabase) {
  console.log('[migrate] Loading all sessions...')
  const { data: rows, error } = await supabase
    .from('sessions')
    .select('id, data')
    .order('created_at', { ascending: false })

  if (error) { console.error('[migrate] Load error', error); return }

  let updated = 0, unchanged = 0
  for (const row of rows) {
    const s = row.data
    if (!s?.exercises) { unchanged++; continue }

    let changed = false
    const normalizedExercises = s.exercises.map(ex => {
      const canonical = normalizeExerciseName(ex.name)
      if (canonical !== ex.name) { changed = true; return { ...ex, name: canonical } }
      return ex
    })

    if (!changed) { unchanged++; continue }

    const { error: patchErr } = await supabase
      .from('sessions')
      .update({ data: { ...s, exercises: normalizedExercises } })
      .eq('id', row.id)

    if (patchErr) console.error(`[migrate] PATCH failed for ${row.id}:`, patchErr)
    else updated++
  }
  console.log(`[migrate] Done. ${updated} updated, ${unchanged} unchanged.`)
}
