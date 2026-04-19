export const PROGRAMS = {
  'phat': {
    id: 'phat',
    name: 'PHAT',
    description: 'Power Hypertrophy Adaptive Training — heavy power days paired with high-volume hypertrophy days.',
    blockStructure: {
      weeksPerBlock: 4,
      deloadWeek: 4,
      blockNames: ['PHAT Block'],
      phaseByWeek: { 1: 'Foundation', 2: 'Accumulation', 3: 'Intensification', 4: 'Deload' },
    },
    sessionOrder: ['upper-power', 'lower-power', 'back-shoulders-hyp', 'lower-hyp', 'chest-arms-hyp'],
    sessions: [
      {
        id: 'upper-power', name: 'Upper Power', tag: 'push', tagLabel: 'POWER',
        focus: 'Power · Chest, Back, Shoulders, Arms',
        exercises: [
          { name: 'Weighted Pull-Up',           sets: 3, reps: '3–5',   rest: 240, restLabel: '4 min' },
          { name: 'Barbell Row (Pronated)',      sets: 3, reps: '3–5',   rest: 240, restLabel: '4 min' },
          { name: 'Barbell Bench Press',        sets: 3, reps: '3–5',   rest: 240, restLabel: '4 min' },
          { name: 'Overhead Press (Barbell)',   sets: 3, reps: '3–5',   rest: 240, restLabel: '4 min' },
          { name: 'Barbell Curl',              sets: 3, reps: '6–8',   rest: 120, restLabel: '2 min' },
          { name: 'Skull Crusher (EZ Bar)',    sets: 3, reps: '6–8',   rest: 120, restLabel: '2 min' },
        ],
      },
      {
        id: 'lower-power', name: 'Lower Power', tag: 'legs', tagLabel: 'POWER',
        focus: 'Power · Quads, Hamstrings, Glutes',
        exercises: [
          { name: 'Back Squat (Barbell)',       sets: 3, reps: '3–5',   rest: 300, restLabel: '5 min' },
          { name: 'Romanian Deadlift',          sets: 3, reps: '3–5',   rest: 300, restLabel: '5 min' },
          { name: 'Leg Press',                  sets: 3, reps: '10–12', rest: 120, restLabel: '2 min' },
          { name: 'Leg Curl (Machine)',          sets: 3, reps: '10–12', rest: 90,  restLabel: '90 sec' },
        ],
      },
      {
        id: 'back-shoulders-hyp', name: 'Back & Shoulders', tag: 'pull', tagLabel: 'HYPERTROPHY',
        focus: 'Hypertrophy · Back, Shoulders',
        exercises: [
          { name: 'Lat Pulldown (Wide Grip)',   sets: 4, reps: '8–12',  rest: 90,  restLabel: '90 sec' },
          { name: 'Cable Row (Neutral Grip)',   sets: 4, reps: '8–12',  rest: 90,  restLabel: '90 sec' },
          { name: 'Single-Arm DB Row',          sets: 3, reps: '10–12', rest: 90,  restLabel: '90 sec' },
          { name: 'Face Pull (Cable)',           sets: 3, reps: '15–20', rest: 60,  restLabel: '1 min' },
          { name: 'Lateral Raise (DB)',         sets: 4, reps: '15–20', rest: 60,  restLabel: '1 min' },
          { name: 'Rear Delt Fly (DB)',         sets: 3, reps: '15–20', rest: 60,  restLabel: '1 min' },
        ],
      },
      {
        id: 'lower-hyp', name: 'Lower Hypertrophy', tag: 'legs', tagLabel: 'HYPERTROPHY',
        focus: 'Hypertrophy · Quads, Hamstrings, Glutes',
        exercises: [
          { name: 'Hack Squat / Leg Press',          sets: 4, reps: '10–15', rest: 90,  restLabel: '90 sec' },
          { name: 'Bulgarian Split Squat (DB)',       sets: 4, reps: '8–10 each', rest: 120, restLabel: '2 min' },
          { name: 'Leg Curl (Machine)',               sets: 4, reps: '10–12', rest: 90,  restLabel: '90 sec' },
          { name: 'Leg Extension (Machine)',          sets: 3, reps: '12–15', rest: 60,  restLabel: '1 min' },
          { name: 'Seated Calf Raise',               sets: 4, reps: '15–20', rest: 60,  restLabel: '1 min' },
        ],
      },
      {
        id: 'chest-arms-hyp', name: 'Chest & Arms', tag: 'push', tagLabel: 'HYPERTROPHY',
        focus: 'Hypertrophy · Chest, Biceps, Triceps',
        exercises: [
          { name: 'Incline Dumbbell Press',     sets: 4, reps: '10–12', rest: 90,  restLabel: '90 sec' },
          { name: 'Cable Fly (Low-to-High)',    sets: 3, reps: '12–15', rest: 60,  restLabel: '1 min' },
          { name: 'Dips (Weighted)',            sets: 3, reps: '10–12', rest: 90,  restLabel: '90 sec' },
          { name: 'Incline DB Curl',            sets: 4, reps: '10–12', rest: 90,  restLabel: '90 sec' },
          { name: 'Hammer Curl (DB)',           sets: 3, reps: '10–12', rest: 90,  restLabel: '90 sec' },
          { name: 'Tricep Pushdown (Cable)',    sets: 4, reps: '12–15', rest: 60,  restLabel: '1 min' },
        ],
      },
    ],
  },
  'ppl-x2': {
    id: 'ppl-x2',
    name: 'PPL × 2',
    description: 'Push / Pull / Legs twice per week — strength & hypertrophy',
    blockStructure: {
      weeksPerBlock: 4,
      deloadWeek: 4,
      blockNames: ['Strength & Size', 'Strength & Size', 'Strength & Size'],
      phaseByWeek: { 1: 'Foundation', 2: 'Accumulation', 3: 'Intensification', 4: 'Deload' },
    },
    sessionOrder: ['push-a', 'pull-a', 'legs-a', 'push-b', 'pull-b', 'legs-b'],
    sessions: [
      {
        id: 'push-a', name: 'Push A', tag: 'push', tagLabel: 'PUSH',
        focus: 'Strength · Chest, Shoulders, Triceps',
        exercises: [
          { name: 'Barbell Bench Press',        sets: 4, reps: '4–6',   rest: 180, restLabel: '3 min' },
          { name: 'Overhead Press (Barbell)',    sets: 4, reps: '4–6',   rest: 180, restLabel: '3 min' },
          { name: 'Incline Dumbbell Press',      sets: 3, reps: '8–10',  rest: 120, restLabel: '2 min' },
          { name: 'Cable Lateral Raise',         sets: 3, reps: '12–15', rest: 60,  restLabel: '1 min' },
          { name: 'Tricep Pushdown (Cable)',     sets: 3, reps: '10–12', rest: 90,  restLabel: '90 sec' },
          { name: 'Overhead Tricep Extension',   sets: 3, reps: '10–12', rest: 90,  restLabel: '90 sec' },
        ],
      },
      {
        id: 'pull-a', name: 'Pull A', tag: 'pull', tagLabel: 'PULL',
        focus: 'Strength · Back, Biceps',
        exercises: [
          { name: 'Weighted Pull-Up',            sets: 4, reps: '4–6',   rest: 180, restLabel: '3 min' },
          { name: 'Barbell Row (Pronated)',       sets: 4, reps: '4–6',   rest: 180, restLabel: '3 min' },
          { name: 'Chest-Supported Row (DB)',     sets: 3, reps: '8–10',  rest: 120, restLabel: '2 min' },
          { name: 'Face Pull (Cable)',            sets: 3, reps: '15–20', rest: 60,  restLabel: '1 min' },
          { name: 'Barbell Curl',                sets: 3, reps: '8–10',  rest: 90,  restLabel: '90 sec' },
          { name: 'Hammer Curl (DB)',             sets: 3, reps: '10–12', rest: 90,  restLabel: '90 sec' },
        ],
      },
      {
        id: 'legs-a', name: 'Legs A', tag: 'legs', tagLabel: 'LEGS',
        focus: 'Strength · Quads, Hamstrings, Glutes',
        exercises: [
          { name: 'Back Squat (Barbell)',         sets: 4, reps: '4–6',    rest: 240, restLabel: '4 min' },
          { name: 'Romanian Deadlift',            sets: 4, reps: '6–8',    rest: 180, restLabel: '3 min' },
          { name: 'Leg Press',                    sets: 3, reps: '10–12',  rest: 120, restLabel: '2 min' },
          { name: 'Leg Curl (Machine)',            sets: 3, reps: '10–12',  rest: 90,  restLabel: '90 sec' },
          { name: 'Walking Lunge (DB)',            sets: 3, reps: '12 each',rest: 90,  restLabel: '90 sec' },
          { name: 'Standing Calf Raise',           sets: 4, reps: '15–20',  rest: 60,  restLabel: '1 min' },
        ],
      },
      {
        id: 'push-b', name: 'Push B', tag: 'push', tagLabel: 'PUSH',
        focus: 'Hypertrophy · Chest, Shoulders, Triceps',
        exercises: [
          { name: 'Incline Barbell Press',        sets: 4, reps: '8–10',  rest: 120, restLabel: '2 min' },
          { name: 'Dumbbell Shoulder Press',      sets: 4, reps: '8–10',  rest: 120, restLabel: '2 min' },
          { name: 'Cable Fly (Low-to-High)',      sets: 3, reps: '12–15', rest: 90,  restLabel: '90 sec' },
          { name: 'Lateral Raise (DB)',           sets: 4, reps: '15–20', rest: 60,  restLabel: '1 min' },
          { name: 'Close-Grip Bench Press',       sets: 3, reps: '8–10',  rest: 120, restLabel: '2 min' },
          { name: 'Skull Crusher (EZ Bar)',       sets: 3, reps: '10–12', rest: 90,  restLabel: '90 sec' },
        ],
      },
      {
        id: 'pull-b', name: 'Pull B', tag: 'pull', tagLabel: 'PULL',
        focus: 'Hypertrophy · Back, Biceps',
        exercises: [
          { name: 'Lat Pulldown (Wide Grip)',     sets: 4, reps: '8–10',  rest: 120, restLabel: '2 min' },
          { name: 'Cable Row (Neutral Grip)',     sets: 4, reps: '10–12', rest: 90,  restLabel: '90 sec' },
          { name: 'Single-Arm DB Row',            sets: 3, reps: '10–12', rest: 90,  restLabel: '90 sec' },
          { name: 'Straight-Arm Pulldown',        sets: 3, reps: '12–15', rest: 90,  restLabel: '90 sec' },
          { name: 'Incline DB Curl',              sets: 3, reps: '10–12', rest: 90,  restLabel: '90 sec' },
          { name: 'Cable Curl (Rope)',             sets: 3, reps: '12–15', rest: 60,  restLabel: '1 min' },
        ],
      },
      {
        id: 'legs-b', name: 'Legs B', tag: 'legs', tagLabel: 'LEGS',
        focus: 'Hypertrophy · Quad-Dominant + Posterior',
        exercises: [
          { name: 'Bulgarian Split Squat (DB)',   sets: 4, reps: '8–10 each', rest: 180, restLabel: '3 min' },
          { name: 'Trap Bar Deadlift',            sets: 4, reps: '6–8',       rest: 210, restLabel: '3.5 min' },
          { name: 'Hack Squat / Leg Press',       sets: 3, reps: '12–15',     rest: 90,  restLabel: '90 sec' },
          { name: 'Nordic Curl / Lying Leg Curl', sets: 3, reps: '8–10',      rest: 90,  restLabel: '90 sec' },
          { name: 'Goblet Squat (Tempo)',         sets: 3, reps: '12',         rest: 90,  restLabel: '90 sec' },
          { name: 'Seated Calf Raise',            sets: 4, reps: '15–20',     rest: 60,  restLabel: '1 min' },
        ],
      },
    ],
  },
  '531': {
    id: '531',
    name: '5/3/1 — Wendler',
    description: 'Percentage-based strength program. All % use your Training Max (TM) = 90% of true 1RM. Set a TM for each lift before starting. After each 4-week cycle: +5 lb OHP & Bench, +10 lb Squat & Deadlift.',
    blockStructure: {
      weeksPerBlock: 4,
      deloadWeek: 4,
      blockNames: ['5/3/1 Cycle'],
      phaseByWeek: { 1: 'The 5s', 2: 'The 3s', 3: '5/3/1', 4: 'Deload' },
    },
    sessionOrder: [
      'ohp-w1', 'dead-w1', 'bench-w1', 'squat-w1',
      'ohp-w2', 'dead-w2', 'bench-w2', 'squat-w2',
      'ohp-w3', 'dead-w3', 'bench-w3', 'squat-w3',
      'ohp-w4', 'dead-w4', 'bench-w4', 'squat-w4',
    ],
    sessions: [
      // ── Week 1 — The 5s (65%×5 / 75%×5 / 85%×5+) ──────────────────────
      {
        id: 'ohp-w1', name: 'OHP — Week 1', tag: 'push', tagLabel: 'PRESS',
        focus: 'The 5s · 65% × 5 / 75% × 5 / 85% × 5+ (AMRAP)',
        exercises: [
          { name: 'Overhead Press (Barbell)', sets: 3, reps: '5+',  rest: 300, restLabel: '5 min' },
          { name: 'Dips (Weighted)',           sets: 5, reps: '10',  rest: 90,  restLabel: '90 sec' },
          { name: 'Chin-Up',                  sets: 5, reps: '10',  rest: 90,  restLabel: '90 sec' },
          { name: 'Hanging Leg Raise',         sets: 5, reps: '10',  rest: 60,  restLabel: '1 min' },
        ],
      },
      {
        id: 'dead-w1', name: 'Deadlift — Week 1', tag: 'pull', tagLabel: 'DEADLIFT',
        focus: 'The 5s · 65% × 5 / 75% × 5 / 85% × 5+ (AMRAP)',
        exercises: [
          { name: 'Deadlift (Barbell)',        sets: 3, reps: '5+',  rest: 300, restLabel: '5 min' },
          { name: 'Barbell Row (Pronated)',     sets: 5, reps: '10',  rest: 90,  restLabel: '90 sec' },
          { name: 'Reverse Hyperextension',    sets: 5, reps: '10',  rest: 90,  restLabel: '90 sec' },
        ],
      },
      {
        id: 'bench-w1', name: 'Bench — Week 1', tag: 'push', tagLabel: 'BENCH',
        focus: 'The 5s · 65% × 5 / 75% × 5 / 85% × 5+ (AMRAP)',
        exercises: [
          { name: 'Barbell Bench Press',       sets: 3, reps: '5+',  rest: 300, restLabel: '5 min' },
          { name: 'Dumbbell Bench Press',      sets: 5, reps: '10',  rest: 90,  restLabel: '90 sec' },
          { name: 'Dumbbell Row',              sets: 5, reps: '10',  rest: 90,  restLabel: '90 sec' },
          { name: 'Ab Wheel',                  sets: 5, reps: '10',  rest: 60,  restLabel: '1 min' },
        ],
      },
      {
        id: 'squat-w1', name: 'Squat — Week 1', tag: 'legs', tagLabel: 'SQUAT',
        focus: 'The 5s · 65% × 5 / 75% × 5 / 85% × 5+ (AMRAP)',
        exercises: [
          { name: 'Back Squat (Barbell)',       sets: 3, reps: '5+',  rest: 300, restLabel: '5 min' },
          { name: 'Leg Press',                  sets: 5, reps: '10',  rest: 90,  restLabel: '90 sec' },
          { name: 'Leg Curl (Machine)',          sets: 5, reps: '10',  rest: 90,  restLabel: '90 sec' },
          { name: 'Plank',                      sets: 3, reps: '60',  rest: 60,  restLabel: '60 sec' },
        ],
      },
      // ── Week 2 — The 3s (70%×3 / 80%×3 / 90%×3+) ──────────────────────
      {
        id: 'ohp-w2', name: 'OHP — Week 2', tag: 'push', tagLabel: 'PRESS',
        focus: 'The 3s · 70% × 3 / 80% × 3 / 90% × 3+ (AMRAP)',
        exercises: [
          { name: 'Overhead Press (Barbell)', sets: 3, reps: '3+',  rest: 300, restLabel: '5 min' },
          { name: 'Dips (Weighted)',           sets: 5, reps: '10',  rest: 90,  restLabel: '90 sec' },
          { name: 'Chin-Up',                  sets: 5, reps: '10',  rest: 90,  restLabel: '90 sec' },
          { name: 'Hanging Leg Raise',         sets: 5, reps: '10',  rest: 60,  restLabel: '1 min' },
        ],
      },
      {
        id: 'dead-w2', name: 'Deadlift — Week 2', tag: 'pull', tagLabel: 'DEADLIFT',
        focus: 'The 3s · 70% × 3 / 80% × 3 / 90% × 3+ (AMRAP)',
        exercises: [
          { name: 'Deadlift (Barbell)',        sets: 3, reps: '3+',  rest: 300, restLabel: '5 min' },
          { name: 'Barbell Row (Pronated)',     sets: 5, reps: '10',  rest: 90,  restLabel: '90 sec' },
          { name: 'Reverse Hyperextension',    sets: 5, reps: '10',  rest: 90,  restLabel: '90 sec' },
        ],
      },
      {
        id: 'bench-w2', name: 'Bench — Week 2', tag: 'push', tagLabel: 'BENCH',
        focus: 'The 3s · 70% × 3 / 80% × 3 / 90% × 3+ (AMRAP)',
        exercises: [
          { name: 'Barbell Bench Press',       sets: 3, reps: '3+',  rest: 300, restLabel: '5 min' },
          { name: 'Dumbbell Bench Press',      sets: 5, reps: '10',  rest: 90,  restLabel: '90 sec' },
          { name: 'Dumbbell Row',              sets: 5, reps: '10',  rest: 90,  restLabel: '90 sec' },
          { name: 'Ab Wheel',                  sets: 5, reps: '10',  rest: 60,  restLabel: '1 min' },
        ],
      },
      {
        id: 'squat-w2', name: 'Squat — Week 2', tag: 'legs', tagLabel: 'SQUAT',
        focus: 'The 3s · 70% × 3 / 80% × 3 / 90% × 3+ (AMRAP)',
        exercises: [
          { name: 'Back Squat (Barbell)',       sets: 3, reps: '3+',  rest: 300, restLabel: '5 min' },
          { name: 'Leg Press',                  sets: 5, reps: '10',  rest: 90,  restLabel: '90 sec' },
          { name: 'Leg Curl (Machine)',          sets: 5, reps: '10',  rest: 90,  restLabel: '90 sec' },
          { name: 'Plank',                      sets: 3, reps: '60',  rest: 60,  restLabel: '60 sec' },
        ],
      },
      // ── Week 3 — 5/3/1 (75%×5 / 85%×3 / 95%×1+) ───────────────────────
      {
        id: 'ohp-w3', name: 'OHP — Week 3', tag: 'push', tagLabel: 'PRESS',
        focus: '5/3/1 · 75% × 5 / 85% × 3 / 95% × 1+ (AMRAP)',
        exercises: [
          { name: 'Overhead Press (Barbell)', sets: 3, reps: '5 / 3 / 1+', rest: 300, restLabel: '5 min' },
          { name: 'Dips (Weighted)',           sets: 5, reps: '10',         rest: 90,  restLabel: '90 sec' },
          { name: 'Chin-Up',                  sets: 5, reps: '10',         rest: 90,  restLabel: '90 sec' },
          { name: 'Hanging Leg Raise',         sets: 5, reps: '10',         rest: 60,  restLabel: '1 min' },
        ],
      },
      {
        id: 'dead-w3', name: 'Deadlift — Week 3', tag: 'pull', tagLabel: 'DEADLIFT',
        focus: '5/3/1 · 75% × 5 / 85% × 3 / 95% × 1+ (AMRAP)',
        exercises: [
          { name: 'Deadlift (Barbell)',        sets: 3, reps: '5 / 3 / 1+', rest: 300, restLabel: '5 min' },
          { name: 'Barbell Row (Pronated)',     sets: 5, reps: '10',         rest: 90,  restLabel: '90 sec' },
          { name: 'Reverse Hyperextension',    sets: 5, reps: '10',         rest: 90,  restLabel: '90 sec' },
        ],
      },
      {
        id: 'bench-w3', name: 'Bench — Week 3', tag: 'push', tagLabel: 'BENCH',
        focus: '5/3/1 · 75% × 5 / 85% × 3 / 95% × 1+ (AMRAP)',
        exercises: [
          { name: 'Barbell Bench Press',       sets: 3, reps: '5 / 3 / 1+', rest: 300, restLabel: '5 min' },
          { name: 'Dumbbell Bench Press',      sets: 5, reps: '10',         rest: 90,  restLabel: '90 sec' },
          { name: 'Dumbbell Row',              sets: 5, reps: '10',         rest: 90,  restLabel: '90 sec' },
          { name: 'Ab Wheel',                  sets: 5, reps: '10',         rest: 60,  restLabel: '1 min' },
        ],
      },
      {
        id: 'squat-w3', name: 'Squat — Week 3', tag: 'legs', tagLabel: 'SQUAT',
        focus: '5/3/1 · 75% × 5 / 85% × 3 / 95% × 1+ (AMRAP)',
        exercises: [
          { name: 'Back Squat (Barbell)',       sets: 3, reps: '5 / 3 / 1+', rest: 300, restLabel: '5 min' },
          { name: 'Leg Press',                  sets: 5, reps: '10',         rest: 90,  restLabel: '90 sec' },
          { name: 'Leg Curl (Machine)',          sets: 5, reps: '10',         rest: 90,  restLabel: '90 sec' },
          { name: 'Plank',                      sets: 3, reps: '60',         rest: 60,  restLabel: '60 sec' },
        ],
      },
      // ── Week 4 — Deload (40%×5 / 50%×5 / 60%×5) ────────────────────────
      {
        id: 'ohp-w4', name: 'OHP — Deload', tag: 'push', tagLabel: 'PRESS',
        focus: 'Deload · 40% × 5 / 50% × 5 / 60% × 5 — Cycle done: +5 lb OHP & Bench TM next cycle',
        exercises: [
          { name: 'Overhead Press (Barbell)', sets: 3, reps: '5',   rest: 180, restLabel: '3 min' },
          { name: 'Dips (Weighted)',           sets: 5, reps: '10',  rest: 90,  restLabel: '90 sec' },
          { name: 'Chin-Up',                  sets: 5, reps: '10',  rest: 90,  restLabel: '90 sec' },
          { name: 'Hanging Leg Raise',         sets: 5, reps: '10',  rest: 60,  restLabel: '1 min' },
        ],
      },
      {
        id: 'dead-w4', name: 'Deadlift — Deload', tag: 'pull', tagLabel: 'DEADLIFT',
        focus: 'Deload · 40% × 5 / 50% × 5 / 60% × 5 — Cycle done: +10 lb Deadlift TM next cycle',
        exercises: [
          { name: 'Deadlift (Barbell)',        sets: 3, reps: '5',   rest: 180, restLabel: '3 min' },
          { name: 'Barbell Row (Pronated)',     sets: 5, reps: '10',  rest: 90,  restLabel: '90 sec' },
          { name: 'Reverse Hyperextension',    sets: 5, reps: '10',  rest: 90,  restLabel: '90 sec' },
        ],
      },
      {
        id: 'bench-w4', name: 'Bench — Deload', tag: 'push', tagLabel: 'BENCH',
        focus: 'Deload · 40% × 5 / 50% × 5 / 60% × 5 — Cycle done: +5 lb Bench TM next cycle',
        exercises: [
          { name: 'Barbell Bench Press',       sets: 3, reps: '5',   rest: 180, restLabel: '3 min' },
          { name: 'Dumbbell Bench Press',      sets: 5, reps: '10',  rest: 90,  restLabel: '90 sec' },
          { name: 'Dumbbell Row',              sets: 5, reps: '10',  rest: 90,  restLabel: '90 sec' },
          { name: 'Ab Wheel',                  sets: 5, reps: '10',  rest: 60,  restLabel: '1 min' },
        ],
      },
      {
        id: 'squat-w4', name: 'Squat — Deload', tag: 'legs', tagLabel: 'SQUAT',
        focus: 'Deload · 40% × 5 / 50% × 5 / 60% × 5 — Cycle done: +10 lb Squat TM next cycle',
        exercises: [
          { name: 'Back Squat (Barbell)',       sets: 3, reps: '5',   rest: 180, restLabel: '3 min' },
          { name: 'Leg Press',                  sets: 5, reps: '10',  rest: 90,  restLabel: '90 sec' },
          { name: 'Leg Curl (Machine)',          sets: 5, reps: '10',  rest: 90,  restLabel: '90 sec' },
          { name: 'Plank',                      sets: 3, reps: '60',  rest: 60,  restLabel: '60 sec' },
        ],
      },
    ],
  },
  'phul': {
    id: 'phul',
    name: 'PHUL',
    description: 'Power Hypertrophy Upper Lower — 4 days/week alternating power and hypertrophy focus for upper and lower body.',
    blockStructure: {
      weeksPerBlock: 4,
      deloadWeek: 4,
      blockNames: ['PHUL Block'],
      phaseByWeek: { 1: 'Foundation', 2: 'Accumulation', 3: 'Intensification', 4: 'Deload' },
    },
    sessionOrder: ['upper-power', 'lower-power', 'upper-hyp', 'lower-hyp'],
    sessions: [
      {
        id: 'upper-power', name: 'Upper Power', tag: 'push', tagLabel: 'POWER',
        focus: 'Power · Chest, Back, Shoulders',
        exercises: [
          { name: 'Barbell Bench Press',       sets: 3, reps: '3–5',   rest: 240, restLabel: '4 min' },
          { name: 'Barbell Row (Pronated)',     sets: 3, reps: '3–5',   rest: 240, restLabel: '4 min' },
          { name: 'Overhead Press (Barbell)',   sets: 3, reps: '5',     rest: 180, restLabel: '3 min' },
          { name: 'Weighted Pull-Up',           sets: 3, reps: '5',     rest: 180, restLabel: '3 min' },
          { name: 'Incline Dumbbell Press',     sets: 2, reps: '6–8',   rest: 120, restLabel: '2 min' },
          { name: 'Dumbbell Row',               sets: 2, reps: '6–8',   rest: 120, restLabel: '2 min' },
        ],
      },
      {
        id: 'lower-power', name: 'Lower Power', tag: 'legs', tagLabel: 'POWER',
        focus: 'Power · Quads, Hamstrings, Glutes',
        exercises: [
          { name: 'Back Squat (Barbell)',       sets: 3, reps: '3–5',   rest: 300, restLabel: '5 min' },
          { name: 'Romanian Deadlift',          sets: 3, reps: '3–5',   rest: 300, restLabel: '5 min' },
          { name: 'Leg Press',                  sets: 3, reps: '10–12', rest: 120, restLabel: '2 min' },
          { name: 'Leg Curl (Machine)',          sets: 3, reps: '10–12', rest: 90,  restLabel: '90 sec' },
          { name: 'Standing Calf Raise',        sets: 4, reps: '8–10',  rest: 60,  restLabel: '1 min' },
        ],
      },
      {
        id: 'upper-hyp', name: 'Upper Hypertrophy', tag: 'push', tagLabel: 'HYPERTROPHY',
        focus: 'Hypertrophy · Chest, Back, Shoulders, Arms',
        exercises: [
          { name: 'Incline Barbell Press',      sets: 4, reps: '8–12',  rest: 90,  restLabel: '90 sec' },
          { name: 'Cable Row (Neutral Grip)',    sets: 4, reps: '8–12',  rest: 90,  restLabel: '90 sec' },
          { name: 'Dumbbell Shoulder Press',    sets: 3, reps: '10–12', rest: 90,  restLabel: '90 sec' },
          { name: 'Lat Pulldown (Wide Grip)',    sets: 3, reps: '10–12', rest: 90,  restLabel: '90 sec' },
          { name: 'Cable Fly (Low-to-High)',     sets: 3, reps: '12–15', rest: 60,  restLabel: '1 min' },
          { name: 'Face Pull (Cable)',           sets: 3, reps: '15',    rest: 60,  restLabel: '1 min' },
          { name: 'Lateral Raise (DB)',          sets: 3, reps: '12–15', rest: 60,  restLabel: '1 min' },
          { name: 'EZ Bar Curl',                sets: 3, reps: '10–12', rest: 90,  restLabel: '90 sec' },
          { name: 'Tricep Pushdown (Cable)',     sets: 3, reps: '10–12', rest: 90,  restLabel: '90 sec' },
        ],
      },
      {
        id: 'lower-hyp', name: 'Lower Hypertrophy', tag: 'legs', tagLabel: 'HYPERTROPHY',
        focus: 'Hypertrophy · Quads, Hamstrings, Glutes, Calves',
        exercises: [
          { name: 'Back Squat (Barbell)',        sets: 4, reps: '8–12',  rest: 90,  restLabel: '90 sec' },
          { name: 'Romanian Deadlift',           sets: 4, reps: '8–12',  rest: 90,  restLabel: '90 sec' },
          { name: 'Hack Squat / Leg Press',      sets: 3, reps: '10–12', rest: 90,  restLabel: '90 sec' },
          { name: 'Leg Curl (Machine)',           sets: 3, reps: '10–12', rest: 90,  restLabel: '90 sec' },
          { name: 'Bulgarian Split Squat (DB)',   sets: 3, reps: '10–12', rest: 120, restLabel: '2 min' },
          { name: 'Leg Extension (Machine)',      sets: 3, reps: '12–15', rest: 60,  restLabel: '1 min' },
          { name: 'Standing Calf Raise',          sets: 3, reps: '10–12', rest: 60,  restLabel: '1 min' },
          { name: 'Seated Calf Raise',            sets: 2, reps: '15–20', rest: 60,  restLabel: '1 min' },
        ],
      },
    ],
  },
  'gvt-6wk': {
    id: 'gvt-6wk',
    name: 'German Volume Training',
    description: 'Classic Poliquin 10×10 hypertrophy block. Main lifts start at 60% 1RM (weeks 1–2), advance to 62.5% (weeks 3–4), then 65% (weeks 5–6). Only increase load when all 10×10 reps are completed with clean tempo. Set your weights manually based on your 1RM.',
    blockStructure: {
      weeksPerBlock: 6,
      deloadWeek: null,
      blockNames: ['GVT Block'],
      phaseByWeek: { 1: '60% Phase', 2: '60% Phase', 3: '62.5% Phase', 4: '62.5% Phase', 5: '65% Phase', 6: '65% Phase' },
    },
    sessionOrder: ['gvt-chest-back', 'gvt-legs-abs', 'gvt-arms-shoulders'],
    sessions: [
      {
        id: 'gvt-chest-back', name: 'Chest & Back', tag: 'push', tagLabel: 'GVT',
        focus: 'Volume · Chest, Back — Main lifts at 60% 1RM. Rest 90 sec between A-pair sets, 60 sec between B-pair sets.',
        exercises: [
          { name: 'Barbell Bench Press',     sets: 10, reps: '10', rest: 90, restLabel: '90 sec', tempo: '4-0-2-0', supersetId: 'gvt-cb-a' },
          { name: 'Chest-Supported Row (DB)', sets: 10, reps: '10', rest: 90, restLabel: '90 sec', tempo: '4-0-2-0', supersetId: 'gvt-cb-a' },
          { name: 'Incline Dumbbell Flye',   sets: 3,  reps: '10–12', rest: 60, restLabel: '1 min', supersetId: 'gvt-cb-b' },
          { name: 'Lat Pulldown (Wide Grip)', sets: 3,  reps: '10–12', rest: 60, restLabel: '1 min', supersetId: 'gvt-cb-b' },
        ],
      },
      {
        id: 'gvt-legs-abs', name: 'Legs & Abs', tag: 'legs', tagLabel: 'GVT',
        focus: 'Volume · Quads, Hamstrings, Abs — Main lifts at 60% 1RM. Rest 90 sec between A-pair sets, 60 sec between B-pair sets.',
        exercises: [
          { name: 'Back Squat (Barbell)',   sets: 10, reps: '10', rest: 90, restLabel: '90 sec', tempo: '4-0-2-0', supersetId: 'gvt-la-a' },
          { name: 'Leg Curl (Machine)',      sets: 10, reps: '10', rest: 90, restLabel: '90 sec', tempo: '4-0-2-0', supersetId: 'gvt-la-a' },
          { name: 'Standing Calf Raise',    sets: 3,  reps: '15–20', rest: 60, restLabel: '1 min', supersetId: 'gvt-la-b' },
          { name: 'Hanging Leg Raise',      sets: 3,  reps: '12–15', rest: 60, restLabel: '1 min', supersetId: 'gvt-la-b' },
        ],
      },
      {
        id: 'gvt-arms-shoulders', name: 'Arms & Shoulders', tag: 'push', tagLabel: 'GVT',
        focus: 'Volume · Triceps, Biceps, Shoulders — Main lifts bodyweight or loaded. Rest 90 sec between A-pair sets, 60 sec between B-pair sets.',
        exercises: [
          { name: 'Parallel Bar Dip',          sets: 10, reps: '10', rest: 90, restLabel: '90 sec', tempo: '4-0-2-0', supersetId: 'gvt-as-a' },
          { name: 'Chin-Up',                   sets: 10, reps: '10', rest: 90, restLabel: '90 sec', tempo: '4-0-2-0', supersetId: 'gvt-as-a' },
          { name: 'Lateral Raise (DB)',         sets: 3,  reps: '10–12', rest: 60, restLabel: '1 min', supersetId: 'gvt-as-b' },
          { name: 'Bent-Over Rear Delt Raise',  sets: 3,  reps: '10–12', rest: 60, restLabel: '1 min', supersetId: 'gvt-as-b' },
        ],
      },
    ],
  },
}
export function getActiveProgram(config) {
  if (!config?.activeProgramId) return null
  return PROGRAMS[config.activeProgramId] ?? null
}

export function getBlockAndWeek(config) {
  if (!config?.programStartDate) return null
  const program = getActiveProgram(config)
  if (!program) return null
  const { weeksPerBlock, deloadWeek, phaseByWeek } = program.blockStructure
  const start = new Date(config.programStartDate + 'T00:00:00')
  const daysSinceStart = Math.floor((Date.now() - start) / 86400000)
  const weeksElapsed = Math.floor(daysSinceStart / 7)
  const weekInBlock = (weeksElapsed % weeksPerBlock) + 1
  const blockNumber = Math.floor(weeksElapsed / weeksPerBlock) + 1
  const isDeload = weekInBlock === deloadWeek
  const phaseName = phaseByWeek[weekInBlock] || `Week ${weekInBlock}`
  return { blockNumber, weekInBlock, weeksPerBlock, isDeload, phaseName }
}

export function getNextSession(config, recentSessions) {
  const program = getActiveProgram(config)
  if (!program) return null
  const order = program.sessionOrder
  if (!recentSessions?.length) return program.sessions[0]
  const last = recentSessions[0]
  const lastIdx = order.indexOf(last.sessionId || 'push-a')
  const nextId = order[(lastIdx + 1) % order.length]
  return program.sessions.find(s => s.id === nextId) || program.sessions[0]
}
