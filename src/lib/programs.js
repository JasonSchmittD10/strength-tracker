export const PROGRAMS = {
  'phat': {
    id: 'phat',
    name: 'PHAT',
    description: 'Power Hypertrophy Adaptive Training — heavy power days paired with high-volume hypertrophy days.',
    meta: {
      difficulty: 'intermediate',
      daysPerWeek: 5,
      primaryGoal: 'hybrid',
      secondaryGoals: ['strength', 'hypertrophy'],
      equipment: ['barbell', 'dumbbells', 'cables', 'machines', 'rack', 'pull-up-bar'],
      experienceMonths: 12,
      timePerSession: 75,
      author: 'Layne Norton',
      tags: ['power', 'hypertrophy', 'classic'],
    },
    designer: 'Layne Norton',
    tags: ['BEGINNER', 'HYPERTROPHY'],
    equipmentNeeded: ['Barbell', 'Squat Rack', 'Bench', 'Dumbbells', 'Cables'],
    equipmentNote: 'This is considered a full gym plan, meaning you’ll need access to most equipment types.',
    macrocycle: {
      name: 'PHAT Block',
      mesocycles: [
        {
          id: 'phat-meso',
          name: 'PHAT Block',
          weeks: 4,
          deloadWeek: 4,
          weekLabels: ['Foundation', 'Accumulation', 'Intensification', 'Deload'],
        },
      ],
      repeatStrategy: 'progress-and-repeat',
    },
    microcycle: {
      type: 'calendar',
      pattern: ['upper-power', 'lower-power', 'rest', 'back-shoulders-hyp', 'lower-hyp', 'chest-arms-hyp', 'rest'],
    },
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
    meta: {
      difficulty: 'intermediate',
      daysPerWeek: 6,
      primaryGoal: 'hybrid',
      secondaryGoals: ['strength', 'hypertrophy'],
      equipment: ['barbell', 'dumbbells', 'cables', 'machines', 'rack', 'pull-up-bar'],
      experienceMonths: 18,
      timePerSession: 75,
      tags: ['ppl', 'high-frequency'],
    },
    tags: ['INTERMEDIATE', 'STRENGTH', 'HYPERTROPHY'],
    equipmentNeeded: ['Barbell', 'Squat Rack', 'Bench', 'Dumbbells', 'Cables'],
    equipmentNote: 'This is considered a full gym plan, meaning you’ll need access to most equipment types.',
    macrocycle: {
      name: 'Strength & Size',
      mesocycles: [
        {
          id: 'ppl-meso',
          name: 'Strength & Size',
          weeks: 4,
          deloadWeek: 4,
          weekLabels: ['Foundation', 'Accumulation', 'Intensification', 'Deload'],
        },
      ],
      repeatStrategy: 'progress-and-repeat',
    },
    microcycle: {
      type: 'calendar',
      pattern: ['push-a', 'pull-a', 'legs-a', 'rest', 'push-b', 'pull-b', 'legs-b'],
    },
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
    meta: {
      difficulty: 'beginner',
      daysPerWeek: 4,
      primaryGoal: 'strength',
      secondaryGoals: ['powerlifting'],
      equipment: ['barbell', 'rack', 'pull-up-bar'],
      experienceMonths: 6,
      timePerSession: 60,
      author: 'Jim Wendler',
      tags: ['classic', 'tm-based', 'linear-progression'],
    },
    designer: 'Jim Wendler',
    tags: ['INTERMEDIATE', 'STRENGTH'],
    equipmentNeeded: ['Barbell', 'Squat Rack', 'Bench', 'Pull-Up Bar'],
    equipmentNote: 'Barbell-focused strength program. You’ll need a rack, bench, and a place to pull from the floor.',
    macrocycle: {
      name: '5/3/1 Cycle',
      mesocycles: [
        {
          id: '531-meso',
          name: '5/3/1 Cycle',
          weeks: 4,
          deloadWeek: 4,
          weekLabels: ['The 5s', 'The 3s', '5/3/1', 'Deload'],
        },
      ],
      repeatStrategy: 'progress-and-repeat',
    },
    microcycle: {
      type: 'calendar',
      weeklyPatterns: [
        ['squat-w1', 'bench-w1', 'rest', 'dead-w1', 'ohp-w1', 'rest', 'rest'],
        ['squat-w2', 'bench-w2', 'rest', 'dead-w2', 'ohp-w2', 'rest', 'rest'],
        ['squat-w3', 'bench-w3', 'rest', 'dead-w3', 'ohp-w3', 'rest', 'rest'],
        ['squat-w4', 'bench-w4', 'rest', 'dead-w4', 'ohp-w4', 'rest', 'rest'],
      ],
    },
    userInputs: [
      { id: 'squat-tm', label: 'Squat Training Max',    type: 'number', unit: 'weight', required: true,
        helpText: 'Use 90% of your true 1RM. Round down if unsure.',
        progression: { type: 'increment', byUnit: { lbs: 10, kg: 5 } } },
      { id: 'bench-tm', label: 'Bench Training Max',    type: 'number', unit: 'weight', required: true,
        helpText: 'Use 90% of your true 1RM.',
        progression: { type: 'increment', byUnit: { lbs: 5, kg: 2.5 } } },
      { id: 'dead-tm',  label: 'Deadlift Training Max', type: 'number', unit: 'weight', required: true,
        helpText: 'Use 90% of your true 1RM.',
        progression: { type: 'increment', byUnit: { lbs: 10, kg: 5 } } },
      { id: 'ohp-tm',   label: 'OHP Training Max',      type: 'number', unit: 'weight', required: true,
        helpText: 'Use 90% of your true 1RM.',
        progression: { type: 'increment', byUnit: { lbs: 5, kg: 2.5 } } },
    ],
    sessions: [
      // ── Week 1 — The 5s (65%×5 / 75%×5 / 85%×5+) ──────────────────────
      {
        id: 'ohp-w1', name: 'OHP — Week 1', tag: 'push', tagLabel: 'PRESS',
        focus: 'The 5s · 65% × 5 / 75% × 5 / 85% × 5+ (AMRAP)',
        exercises: [
          { name: 'Overhead Press (Barbell)', sets: 3, reps: '5 / 5 / 5+',  rest: 300, restLabel: '5 min',
            loadPattern: { inputId: 'ohp-tm', sets: [
              { percent: 0.65, reps: '5' }, { percent: 0.75, reps: '5' }, { percent: 0.85, reps: '5+' },
            ]} },
          { name: 'Dips (Weighted)',           sets: 5, reps: '10',  rest: 90,  restLabel: '90 sec' },
          { name: 'Chin-Up',                  sets: 5, reps: '10',  rest: 90,  restLabel: '90 sec' },
          { name: 'Hanging Leg Raise',         sets: 5, reps: '10',  rest: 60,  restLabel: '1 min' },
        ],
      },
      {
        id: 'dead-w1', name: 'Deadlift — Week 1', tag: 'pull', tagLabel: 'DEADLIFT',
        focus: 'The 5s · 65% × 5 / 75% × 5 / 85% × 5+ (AMRAP)',
        exercises: [
          { name: 'Deadlift (Barbell)',        sets: 3, reps: '5 / 5 / 5+',  rest: 300, restLabel: '5 min',
            loadPattern: { inputId: 'dead-tm', sets: [
              { percent: 0.65, reps: '5' }, { percent: 0.75, reps: '5' }, { percent: 0.85, reps: '5+' },
            ]} },
          { name: 'Barbell Row (Pronated)',     sets: 5, reps: '10',  rest: 90,  restLabel: '90 sec' },
          { name: 'Reverse Hyperextension',    sets: 5, reps: '10',  rest: 90,  restLabel: '90 sec' },
        ],
      },
      {
        id: 'bench-w1', name: 'Bench — Week 1', tag: 'push', tagLabel: 'BENCH',
        focus: 'The 5s · 65% × 5 / 75% × 5 / 85% × 5+ (AMRAP)',
        exercises: [
          { name: 'Barbell Bench Press',       sets: 3, reps: '5 / 5 / 5+',  rest: 300, restLabel: '5 min',
            loadPattern: { inputId: 'bench-tm', sets: [
              { percent: 0.65, reps: '5' }, { percent: 0.75, reps: '5' }, { percent: 0.85, reps: '5+' },
            ]} },
          { name: 'Dumbbell Bench Press',      sets: 5, reps: '10',  rest: 90,  restLabel: '90 sec' },
          { name: 'Dumbbell Row',              sets: 5, reps: '10',  rest: 90,  restLabel: '90 sec' },
          { name: 'Ab Wheel',                  sets: 5, reps: '10',  rest: 60,  restLabel: '1 min' },
        ],
      },
      {
        id: 'squat-w1', name: 'Squat — Week 1', tag: 'legs', tagLabel: 'SQUAT',
        focus: 'The 5s · 65% × 5 / 75% × 5 / 85% × 5+ (AMRAP)',
        exercises: [
          { name: 'Back Squat (Barbell)',       sets: 3, reps: '5 / 5 / 5+',  rest: 300, restLabel: '5 min',
            loadPattern: { inputId: 'squat-tm', sets: [
              { percent: 0.65, reps: '5' }, { percent: 0.75, reps: '5' }, { percent: 0.85, reps: '5+' },
            ]} },
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
          { name: 'Overhead Press (Barbell)', sets: 3, reps: '3 / 3 / 3+',  rest: 300, restLabel: '5 min',
            loadPattern: { inputId: 'ohp-tm', sets: [
              { percent: 0.70, reps: '3' }, { percent: 0.80, reps: '3' }, { percent: 0.90, reps: '3+' },
            ]} },
          { name: 'Dips (Weighted)',           sets: 5, reps: '10',  rest: 90,  restLabel: '90 sec' },
          { name: 'Chin-Up',                  sets: 5, reps: '10',  rest: 90,  restLabel: '90 sec' },
          { name: 'Hanging Leg Raise',         sets: 5, reps: '10',  rest: 60,  restLabel: '1 min' },
        ],
      },
      {
        id: 'dead-w2', name: 'Deadlift — Week 2', tag: 'pull', tagLabel: 'DEADLIFT',
        focus: 'The 3s · 70% × 3 / 80% × 3 / 90% × 3+ (AMRAP)',
        exercises: [
          { name: 'Deadlift (Barbell)',        sets: 3, reps: '3 / 3 / 3+',  rest: 300, restLabel: '5 min',
            loadPattern: { inputId: 'dead-tm', sets: [
              { percent: 0.70, reps: '3' }, { percent: 0.80, reps: '3' }, { percent: 0.90, reps: '3+' },
            ]} },
          { name: 'Barbell Row (Pronated)',     sets: 5, reps: '10',  rest: 90,  restLabel: '90 sec' },
          { name: 'Reverse Hyperextension',    sets: 5, reps: '10',  rest: 90,  restLabel: '90 sec' },
        ],
      },
      {
        id: 'bench-w2', name: 'Bench — Week 2', tag: 'push', tagLabel: 'BENCH',
        focus: 'The 3s · 70% × 3 / 80% × 3 / 90% × 3+ (AMRAP)',
        exercises: [
          { name: 'Barbell Bench Press',       sets: 3, reps: '3 / 3 / 3+',  rest: 300, restLabel: '5 min',
            loadPattern: { inputId: 'bench-tm', sets: [
              { percent: 0.70, reps: '3' }, { percent: 0.80, reps: '3' }, { percent: 0.90, reps: '3+' },
            ]} },
          { name: 'Dumbbell Bench Press',      sets: 5, reps: '10',  rest: 90,  restLabel: '90 sec' },
          { name: 'Dumbbell Row',              sets: 5, reps: '10',  rest: 90,  restLabel: '90 sec' },
          { name: 'Ab Wheel',                  sets: 5, reps: '10',  rest: 60,  restLabel: '1 min' },
        ],
      },
      {
        id: 'squat-w2', name: 'Squat — Week 2', tag: 'legs', tagLabel: 'SQUAT',
        focus: 'The 3s · 70% × 3 / 80% × 3 / 90% × 3+ (AMRAP)',
        exercises: [
          { name: 'Back Squat (Barbell)',       sets: 3, reps: '3 / 3 / 3+',  rest: 300, restLabel: '5 min',
            loadPattern: { inputId: 'squat-tm', sets: [
              { percent: 0.70, reps: '3' }, { percent: 0.80, reps: '3' }, { percent: 0.90, reps: '3+' },
            ]} },
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
          { name: 'Overhead Press (Barbell)', sets: 3, reps: '5 / 3 / 1+', rest: 300, restLabel: '5 min',
            loadPattern: { inputId: 'ohp-tm', sets: [
              { percent: 0.75, reps: '5' }, { percent: 0.85, reps: '3' }, { percent: 0.95, reps: '1+' },
            ]} },
          { name: 'Dips (Weighted)',           sets: 5, reps: '10',         rest: 90,  restLabel: '90 sec' },
          { name: 'Chin-Up',                  sets: 5, reps: '10',         rest: 90,  restLabel: '90 sec' },
          { name: 'Hanging Leg Raise',         sets: 5, reps: '10',         rest: 60,  restLabel: '1 min' },
        ],
      },
      {
        id: 'dead-w3', name: 'Deadlift — Week 3', tag: 'pull', tagLabel: 'DEADLIFT',
        focus: '5/3/1 · 75% × 5 / 85% × 3 / 95% × 1+ (AMRAP)',
        exercises: [
          { name: 'Deadlift (Barbell)',        sets: 3, reps: '5 / 3 / 1+', rest: 300, restLabel: '5 min',
            loadPattern: { inputId: 'dead-tm', sets: [
              { percent: 0.75, reps: '5' }, { percent: 0.85, reps: '3' }, { percent: 0.95, reps: '1+' },
            ]} },
          { name: 'Barbell Row (Pronated)',     sets: 5, reps: '10',         rest: 90,  restLabel: '90 sec' },
          { name: 'Reverse Hyperextension',    sets: 5, reps: '10',         rest: 90,  restLabel: '90 sec' },
        ],
      },
      {
        id: 'bench-w3', name: 'Bench — Week 3', tag: 'push', tagLabel: 'BENCH',
        focus: '5/3/1 · 75% × 5 / 85% × 3 / 95% × 1+ (AMRAP)',
        exercises: [
          { name: 'Barbell Bench Press',       sets: 3, reps: '5 / 3 / 1+', rest: 300, restLabel: '5 min',
            loadPattern: { inputId: 'bench-tm', sets: [
              { percent: 0.75, reps: '5' }, { percent: 0.85, reps: '3' }, { percent: 0.95, reps: '1+' },
            ]} },
          { name: 'Dumbbell Bench Press',      sets: 5, reps: '10',         rest: 90,  restLabel: '90 sec' },
          { name: 'Dumbbell Row',              sets: 5, reps: '10',         rest: 90,  restLabel: '90 sec' },
          { name: 'Ab Wheel',                  sets: 5, reps: '10',         rest: 60,  restLabel: '1 min' },
        ],
      },
      {
        id: 'squat-w3', name: 'Squat — Week 3', tag: 'legs', tagLabel: 'SQUAT',
        focus: '5/3/1 · 75% × 5 / 85% × 3 / 95% × 1+ (AMRAP)',
        exercises: [
          { name: 'Back Squat (Barbell)',       sets: 3, reps: '5 / 3 / 1+', rest: 300, restLabel: '5 min',
            loadPattern: { inputId: 'squat-tm', sets: [
              { percent: 0.75, reps: '5' }, { percent: 0.85, reps: '3' }, { percent: 0.95, reps: '1+' },
            ]} },
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
          { name: 'Overhead Press (Barbell)', sets: 3, reps: '5 / 5 / 5',   rest: 180, restLabel: '3 min',
            loadPattern: { inputId: 'ohp-tm', sets: [
              { percent: 0.40, reps: '5' }, { percent: 0.50, reps: '5' }, { percent: 0.60, reps: '5' },
            ]} },
          { name: 'Dips (Weighted)',           sets: 5, reps: '10',  rest: 90,  restLabel: '90 sec' },
          { name: 'Chin-Up',                  sets: 5, reps: '10',  rest: 90,  restLabel: '90 sec' },
          { name: 'Hanging Leg Raise',         sets: 5, reps: '10',  rest: 60,  restLabel: '1 min' },
        ],
      },
      {
        id: 'dead-w4', name: 'Deadlift — Deload', tag: 'pull', tagLabel: 'DEADLIFT',
        focus: 'Deload · 40% × 5 / 50% × 5 / 60% × 5 — Cycle done: +10 lb Deadlift TM next cycle',
        exercises: [
          { name: 'Deadlift (Barbell)',        sets: 3, reps: '5 / 5 / 5',   rest: 180, restLabel: '3 min',
            loadPattern: { inputId: 'dead-tm', sets: [
              { percent: 0.40, reps: '5' }, { percent: 0.50, reps: '5' }, { percent: 0.60, reps: '5' },
            ]} },
          { name: 'Barbell Row (Pronated)',     sets: 5, reps: '10',  rest: 90,  restLabel: '90 sec' },
          { name: 'Reverse Hyperextension',    sets: 5, reps: '10',  rest: 90,  restLabel: '90 sec' },
        ],
      },
      {
        id: 'bench-w4', name: 'Bench — Deload', tag: 'push', tagLabel: 'BENCH',
        focus: 'Deload · 40% × 5 / 50% × 5 / 60% × 5 — Cycle done: +5 lb Bench TM next cycle',
        exercises: [
          { name: 'Barbell Bench Press',       sets: 3, reps: '5 / 5 / 5',   rest: 180, restLabel: '3 min',
            loadPattern: { inputId: 'bench-tm', sets: [
              { percent: 0.40, reps: '5' }, { percent: 0.50, reps: '5' }, { percent: 0.60, reps: '5' },
            ]} },
          { name: 'Dumbbell Bench Press',      sets: 5, reps: '10',  rest: 90,  restLabel: '90 sec' },
          { name: 'Dumbbell Row',              sets: 5, reps: '10',  rest: 90,  restLabel: '90 sec' },
          { name: 'Ab Wheel',                  sets: 5, reps: '10',  rest: 60,  restLabel: '1 min' },
        ],
      },
      {
        id: 'squat-w4', name: 'Squat — Deload', tag: 'legs', tagLabel: 'SQUAT',
        focus: 'Deload · 40% × 5 / 50% × 5 / 60% × 5 — Cycle done: +10 lb Squat TM next cycle',
        exercises: [
          { name: 'Back Squat (Barbell)',       sets: 3, reps: '5 / 5 / 5',   rest: 180, restLabel: '3 min',
            loadPattern: { inputId: 'squat-tm', sets: [
              { percent: 0.40, reps: '5' }, { percent: 0.50, reps: '5' }, { percent: 0.60, reps: '5' },
            ]} },
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
    meta: {
      difficulty: 'intermediate',
      daysPerWeek: 4,
      primaryGoal: 'hybrid',
      secondaryGoals: ['strength', 'hypertrophy'],
      equipment: ['barbell', 'dumbbells', 'cables', 'machines', 'rack', 'pull-up-bar'],
      experienceMonths: 12,
      timePerSession: 70,
      tags: ['power', 'hypertrophy', 'upper-lower'],
    },
    tags: ['INTERMEDIATE', 'POWER', 'HYPERTROPHY'],
    equipmentNeeded: ['Barbell', 'Squat Rack', 'Bench', 'Dumbbells', 'Cables'],
    equipmentNote: 'This is considered a full gym plan, meaning you’ll need access to most equipment types.',
    macrocycle: {
      name: 'PHUL Block',
      mesocycles: [
        {
          id: 'phul-meso',
          name: 'PHUL Block',
          weeks: 4,
          deloadWeek: 4,
          weekLabels: ['Foundation', 'Accumulation', 'Intensification', 'Deload'],
        },
      ],
      repeatStrategy: 'progress-and-repeat',
    },
    microcycle: {
      type: 'calendar',
      pattern: ['upper-power', 'lower-power', 'rest', 'upper-hyp', 'lower-hyp', 'rest', 'rest'],
    },
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
    meta: {
      difficulty: 'advanced',
      daysPerWeek: 3,
      primaryGoal: 'hypertrophy',
      secondaryGoals: [],
      equipment: ['barbell', 'dumbbells', 'machines', 'rack', 'pull-up-bar'],
      experienceMonths: 24,
      timePerSession: 90,
      author: 'Charles Poliquin',
      tags: ['hypertrophy', 'volume', 'classic', 'one-shot'],
    },
    designer: 'Charles Poliquin',
    tags: ['ADVANCED', 'HYPERTROPHY'],
    equipmentNeeded: ['Barbell', 'Squat Rack', 'Bench', 'Dumbbells', 'Cables', 'Pull-Up Bar'],
    equipmentNote: 'High-volume program. You’ll need access to most equipment types and enough rest space between supersets.',
    macrocycle: {
      name: 'GVT Block',
      mesocycles: [
        { id: 'gvt-60',  name: '60% Phase',   weeks: 2, deloadWeek: null },
        { id: 'gvt-625', name: '62.5% Phase', weeks: 2, deloadWeek: null },
        { id: 'gvt-65',  name: '65% Phase',   weeks: 2, deloadWeek: null },
      ],
      repeatStrategy: 'one-shot',
    },
    microcycle: {
      type: 'calendar',
      pattern: ['gvt-chest-back', 'rest', 'gvt-legs-abs', 'rest', 'gvt-arms-shoulders', 'rest', 'rest'],
    },
    userInputs: [
      { id: 'bench-1rm', label: 'Bench 1RM',                            type: 'number', unit: 'weight', required: true },
      { id: 'row-1rm',   label: 'Chest-Supported Row 1RM (estimated OK)', type: 'number', unit: 'weight', required: true },
      { id: 'squat-1rm', label: 'Squat 1RM',                            type: 'number', unit: 'weight', required: true },
    ],
    sessions: [
      {
        id: 'gvt-chest-back', name: 'Chest & Back', tag: 'push', tagLabel: 'GVT',
        focus: 'Volume · Chest, Back — Main lifts at 60% 1RM. Rest 90 sec between A-pair sets, 60 sec between B-pair sets.',
        exercises: [
          { name: 'Barbell Bench Press',     sets: 10, reps: '10', rest: 90, restLabel: '90 sec', tempo: '4-0-2-0', supersetId: 'gvt-cb-a',
            percentOfInput: { inputId: 'bench-1rm', percentByMeso: [0.60, 0.625, 0.65] } },
          { name: 'Chest-Supported Row (DB)', sets: 10, reps: '10', rest: 90, restLabel: '90 sec', tempo: '4-0-2-0', supersetId: 'gvt-cb-a',
            percentOfInput: { inputId: 'row-1rm', percentByMeso: [0.60, 0.625, 0.65] } },
          { name: 'Incline Dumbbell Flye',   sets: 3,  reps: '10–12', rest: 60, restLabel: '1 min', supersetId: 'gvt-cb-b' },
          { name: 'Lat Pulldown (Wide Grip)', sets: 3,  reps: '10–12', rest: 60, restLabel: '1 min', supersetId: 'gvt-cb-b' },
        ],
      },
      {
        id: 'gvt-legs-abs', name: 'Legs & Abs', tag: 'legs', tagLabel: 'GVT',
        focus: 'Volume · Quads, Hamstrings, Abs — Main lifts at 60% 1RM. Rest 90 sec between A-pair sets, 60 sec between B-pair sets.',
        exercises: [
          { name: 'Back Squat (Barbell)',   sets: 10, reps: '10', rest: 90, restLabel: '90 sec', tempo: '4-0-2-0', supersetId: 'gvt-la-a',
            percentOfInput: { inputId: 'squat-1rm', percentByMeso: [0.60, 0.625, 0.65] } },
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

// ─── Tactical Barbell — Operator (Phase 7) ───────────────────────────────────
// 6-week cluster-wave program. Strength A/B follow a 70/80/90 → 70/80/90 →
// 75/85/95 wave, repeating across weeks 4-6. Conditioning rotates Z2 base
// runs (mid + long) and a HIC interval session.
const TB_CLUSTER_WAVE = [
  // Wk 1
  [{ percent: 0.70, reps: '5' }, { percent: 0.80, reps: '5' }, { percent: 0.90, reps: '5+' }],
  // Wk 2
  [{ percent: 0.70, reps: '3' }, { percent: 0.80, reps: '3' }, { percent: 0.90, reps: '3+' }],
  // Wk 3
  [{ percent: 0.75, reps: '5' }, { percent: 0.85, reps: '3' }, { percent: 0.95, reps: '1+' }],
  // Wk 4 (same pattern, new TM applied at block-end)
  [{ percent: 0.70, reps: '5' }, { percent: 0.80, reps: '5' }, { percent: 0.90, reps: '5+' }],
  // Wk 5
  [{ percent: 0.70, reps: '3' }, { percent: 0.80, reps: '3' }, { percent: 0.90, reps: '3+' }],
  // Wk 6
  [{ percent: 0.75, reps: '5' }, { percent: 0.85, reps: '3' }, { percent: 0.95, reps: '1+' }],
]
PROGRAMS['tactical-barbell-operator'] = {
  id: 'tactical-barbell-operator',
  name: 'Tactical Barbell — Operator',
  description: 'Concurrent training for hybrid athletes. Cluster/wave strength on 4 main lifts; conditioning rotates Z2 base work and high-intensity intervals.',
  meta: {
    difficulty: 'intermediate',
    daysPerWeek: 6,
    primaryGoal: 'hybrid',
    secondaryGoals: ['strength', 'endurance', 'conditioning'],
    equipment: ['barbell', 'rack', 'pull-up-bar', 'open-space', 'cardio-equipment'],
    experienceMonths: 12,
    timePerSession: 50,
    author: 'K. Black',
    tags: ['hybrid', 'tactical', 'concurrent', 'military'],
  },
  designer: 'K. Black',
  tags: ['INTERMEDIATE', 'HYBRID'],
  equipmentNeeded: ['Barbell', 'Squat Rack', 'Pull-Up Bar', 'Open Space', 'Cardio Equipment'],
  equipmentNote: 'Strength + conditioning. You’ll need a rack and a place to run / ruck.',
  macrocycle: {
    name: 'Operator Block',
    mesocycles: [
      { id: 'tb-meso', name: 'Operator Block', weeks: 6, deloadWeek: null,
        weekLabels: ['Wave 1 · Wk 1', 'Wave 1 · Wk 2', 'Wave 1 · Wk 3', 'Wave 2 · Wk 1', 'Wave 2 · Wk 2', 'Wave 2 · Wk 3'] },
    ],
    repeatStrategy: 'progress-and-repeat',
  },
  microcycle: {
    type: 'calendar',
    pattern: ['tb-strength-a', 'tb-conditioning-base-mid', 'tb-strength-b', 'tb-conditioning-hic', 'tb-strength-c', 'tb-conditioning-base-long', 'rest'],
  },
  userInputs: [
    { id: 'squat-1rm', label: 'Squat 1RM',    type: 'number', unit: 'weight', required: true,
      progression: { type: 'increment', byUnit: { lbs: 10, kg: 5 } } },
    { id: 'bench-1rm', label: 'Bench 1RM',    type: 'number', unit: 'weight', required: true,
      progression: { type: 'increment', byUnit: { lbs: 5, kg: 2.5 } } },
    { id: 'dead-1rm',  label: 'Deadlift 1RM', type: 'number', unit: 'weight', required: true,
      progression: { type: 'increment', byUnit: { lbs: 10, kg: 5 } } },
    { id: 'press-1rm', label: 'Press 1RM',    type: 'number', unit: 'weight', required: true,
      progression: { type: 'increment', byUnit: { lbs: 5, kg: 2.5 } } },
  ],
  sessions: [
    {
      id: 'tb-strength-a', name: 'Strength A — Squat / Bench', tag: 'legs', tagLabel: 'STRENGTH',
      focus: 'Cluster wave · Squat + Bench main lifts',
      exercises: [
        { name: 'Back Squat (Barbell)',     sets: 3, reps: 'Wave', rest: 240, restLabel: '4 min',
          loadPattern: { inputId: 'squat-1rm', byWeek: TB_CLUSTER_WAVE } },
        { name: 'Barbell Bench Press',      sets: 3, reps: 'Wave', rest: 240, restLabel: '4 min',
          loadPattern: { inputId: 'bench-1rm', byWeek: TB_CLUSTER_WAVE } },
        { name: 'Weighted Pull-Up',         sets: 3, reps: '5',    rest: 120, restLabel: '2 min' },
        { name: 'Hanging Leg Raise',        sets: 3, reps: '10',   rest: 60,  restLabel: '1 min' },
      ],
    },
    {
      id: 'tb-strength-b', name: 'Strength B — Deadlift / Press', tag: 'pull', tagLabel: 'STRENGTH',
      focus: 'Cluster wave · Deadlift + Overhead Press main lifts',
      exercises: [
        { name: 'Deadlift (Barbell)',       sets: 3, reps: 'Wave', rest: 300, restLabel: '5 min',
          loadPattern: { inputId: 'dead-1rm', byWeek: TB_CLUSTER_WAVE } },
        { name: 'Overhead Press (Barbell)', sets: 3, reps: 'Wave', rest: 240, restLabel: '4 min',
          loadPattern: { inputId: 'press-1rm', byWeek: TB_CLUSTER_WAVE } },
        { name: 'Barbell Row (Pronated)',    sets: 3, reps: '5',   rest: 120, restLabel: '2 min' },
        { name: 'Plank',                    sets: 3, reps: '60',  rest: 60,  restLabel: '1 min' },
      ],
    },
    {
      id: 'tb-strength-c', name: 'Strength C — Variant Day', tag: 'legs', tagLabel: 'VARIANT',
      focus: 'Variant work · 70-80% RPE-based',
      exercises: [
        { name: 'Front Squat',              sets: 3, reps: '5',   rest: 180, restLabel: '3 min',
          notes: 'Work at 70-80% by feel.' },
        { name: 'Incline Bench Press',      sets: 3, reps: '6',   rest: 180, restLabel: '3 min',
          notes: 'Work at 70-75% by feel.' },
        { name: 'Dips (Weighted)',          sets: 3, reps: '8',   rest: 120, restLabel: '2 min' },
        { name: 'Farmer Carry',             sets: 3, reps: '40m', rest: 90,  restLabel: '90 sec' },
      ],
    },
    {
      id: 'tb-conditioning-base-mid', name: 'Z2 Base (mid)',
      type: 'conditioning', tag: 'conditioning', tagLabel: 'BASE',
      focus: '30–45 min easy aerobic',
      conditioning: [{
        type: 'steady-state', modality: 'run', duration: 40,
        targetIntensity: 'Z2 / RPE 5',
        name: 'Z2 Base Run',
        description: 'Conversational pace; nasal breathing if possible.',
      }],
    },
    {
      id: 'tb-conditioning-base-long', name: 'Z2 Base (long)',
      type: 'conditioning', tag: 'conditioning', tagLabel: 'BASE',
      focus: '45–60 min easy aerobic',
      conditioning: [{
        type: 'steady-state', modality: 'run', duration: 55,
        targetIntensity: 'Z2 / RPE 5',
        name: 'Z2 Base Run (long)',
        description: 'Conversational pace; nasal breathing if possible.',
      }],
    },
    {
      id: 'tb-conditioning-hic', name: 'HIC Intervals',
      type: 'conditioning', tag: 'conditioning', tagLabel: 'HIC',
      focus: 'High-intensity conditioning',
      conditioning: [{
        type: 'intervals', modality: 'run', rounds: 6,
        workInterval: { duration: 60, intensity: 'RPE 9 / 5K pace minus 30s' },
        restInterval: { duration: 90, type: 'active' },
        name: 'HIC Intervals',
        description: '6×60s hard / 90s easy jog.',
      }],
    },
  ],
}

// ─── RP Hypertrophy — Upper/Lower (Phase 7) ─────────────────────────────────
// Volume-progression hypertrophy. Sets per muscle group climb across 5 weeks
// (MEV → MAV1 → MAV2 → MRV → Deload). RIR-targeted; loads stay relatively
// constant. Encoded with week-indexed set strings ('3|4|5|6|2') and a shared
// rirByWeek for the macrocycle-level RIR target.
const RP_RIR_BY_WEEK = '3|2|1|1|5'
PROGRAMS['rp-upper-lower'] = {
  id: 'rp-upper-lower',
  name: 'RP Hypertrophy — Upper/Lower',
  description: 'Volume-progression hypertrophy. Sets per muscle group climb MEV → MAV → MRV across a 5-week mesocycle, then deload. Loads stay roughly constant; volume drives overload.',
  meta: {
    difficulty: 'intermediate',
    daysPerWeek: 4,
    primaryGoal: 'hypertrophy',
    secondaryGoals: [],
    equipment: ['barbell', 'dumbbells', 'cables', 'machines', 'rack', 'pull-up-bar'],
    experienceMonths: 12,
    timePerSession: 75,
    author: 'Renaissance Periodization',
    tags: ['hypertrophy', 'rir-based', 'volume-progression'],
  },
  designer: 'Renaissance Periodization',
  tags: ['INTERMEDIATE', 'HYPERTROPHY'],
  equipmentNeeded: ['Barbell', 'Squat Rack', 'Bench', 'Dumbbells', 'Cables', 'Machines'],
  equipmentNote: 'Full gym. Set count climbs each week; track RIR carefully.',
  macrocycle: {
    name: 'RP Mesocycle',
    mesocycles: [
      { id: 'rp-meso', name: 'RP Mesocycle', weeks: 5, deloadWeek: 5,
        weekLabels: ['MEV', 'MAV1', 'MAV2', 'MRV', 'Deload'] },
    ],
    repeatStrategy: 'progress-and-repeat',
  },
  microcycle: {
    type: 'calendar',
    pattern: ['upper-1', 'lower-1', 'rest', 'upper-2', 'lower-2', 'rest', 'rest'],
  },
  sessions: [
    {
      id: 'upper-1', name: 'Upper 1 — Chest / Back focus', tag: 'push', tagLabel: 'UPPER',
      focus: 'Hypertrophy · Chest, Back, Shoulders, Arms',
      exercises: [
        { name: 'Barbell Bench Press',     sets: '3|4|5|6|2', reps: '6-8',   rest: 150, restLabel: '2.5 min', rirByWeek: RP_RIR_BY_WEEK },
        { name: 'Barbell Row (Pronated)',  sets: '3|4|5|6|2', reps: '6-8',   rest: 150, restLabel: '2.5 min', rirByWeek: RP_RIR_BY_WEEK },
        { name: 'Dumbbell Shoulder Press', sets: '2|3|4|5|2', reps: '8-12',  rest: 120, restLabel: '2 min',   rirByWeek: RP_RIR_BY_WEEK },
        { name: 'Lat Pulldown (Wide)',     sets: '2|3|4|5|2', reps: '10-12', rest: 90,  restLabel: '90 sec',  rirByWeek: RP_RIR_BY_WEEK },
        { name: 'Lateral Raise (DB)',      sets: '3|4|5|6|2', reps: '12-15', rest: 60,  restLabel: '1 min',   rirByWeek: RP_RIR_BY_WEEK },
        { name: 'EZ Bar Curl',             sets: '2|3|4|5|2', reps: '8-12',  rest: 90,  restLabel: '90 sec',  rirByWeek: RP_RIR_BY_WEEK },
        { name: 'Tricep Pushdown (Cable)', sets: '2|3|4|5|2', reps: '10-12', rest: 90,  restLabel: '90 sec',  rirByWeek: RP_RIR_BY_WEEK },
      ],
    },
    {
      id: 'lower-1', name: 'Lower 1 — Squat focus', tag: 'legs', tagLabel: 'LOWER',
      focus: 'Hypertrophy · Quads, Hamstrings, Glutes',
      exercises: [
        { name: 'Back Squat (Barbell)',   sets: '3|4|5|6|2', reps: '6-8',   rest: 180, restLabel: '3 min',   rirByWeek: RP_RIR_BY_WEEK },
        { name: 'Romanian Deadlift',      sets: '3|4|4|5|2', reps: '8-10',  rest: 150, restLabel: '2.5 min', rirByWeek: RP_RIR_BY_WEEK },
        { name: 'Leg Press',              sets: '2|3|4|5|2', reps: '10-12', rest: 120, restLabel: '2 min',   rirByWeek: RP_RIR_BY_WEEK },
        { name: 'Leg Curl (Machine)',     sets: '2|3|4|5|2', reps: '10-12', rest: 90,  restLabel: '90 sec',  rirByWeek: RP_RIR_BY_WEEK },
        { name: 'Standing Calf Raise',    sets: '3|4|4|5|2', reps: '10-12', rest: 60,  restLabel: '1 min',   rirByWeek: RP_RIR_BY_WEEK },
        { name: 'Hanging Leg Raise',      sets: '2|3|3|4|2', reps: '12-15', rest: 60,  restLabel: '1 min',   rirByWeek: RP_RIR_BY_WEEK },
      ],
    },
    {
      id: 'upper-2', name: 'Upper 2 — Shoulders / Arms focus', tag: 'push', tagLabel: 'UPPER',
      focus: 'Hypertrophy · Shoulders, Arms, Chest, Back',
      exercises: [
        { name: 'Incline Dumbbell Press',         sets: '3|4|5|6|2', reps: '8-10',  rest: 150, restLabel: '2.5 min', rirByWeek: RP_RIR_BY_WEEK },
        { name: 'Weighted Pull-Up',               sets: '3|4|5|6|2', reps: '6-8',   rest: 150, restLabel: '2.5 min', rirByWeek: RP_RIR_BY_WEEK },
        { name: 'Seated Dumbbell Shoulder Press', sets: '2|3|4|5|2', reps: '8-12',  rest: 120, restLabel: '2 min',   rirByWeek: RP_RIR_BY_WEEK },
        { name: 'Cable Row (Neutral Grip)',       sets: '2|3|4|5|2', reps: '10-12', rest: 90,  restLabel: '90 sec',  rirByWeek: RP_RIR_BY_WEEK },
        { name: 'Cable Fly (Low-to-High)',        sets: '2|3|4|5|2', reps: '12-15', rest: 60,  restLabel: '1 min',   rirByWeek: RP_RIR_BY_WEEK },
        { name: 'Hammer Curl (DB)',               sets: '2|3|4|5|2', reps: '10-12', rest: 90,  restLabel: '90 sec',  rirByWeek: RP_RIR_BY_WEEK },
        { name: 'Skull Crusher (EZ Bar)',         sets: '2|3|4|5|2', reps: '10-12', rest: 90,  restLabel: '90 sec',  rirByWeek: RP_RIR_BY_WEEK },
      ],
    },
    {
      id: 'lower-2', name: 'Lower 2 — Deadlift focus', tag: 'legs', tagLabel: 'LOWER',
      focus: 'Hypertrophy · Posterior chain, Quads',
      exercises: [
        { name: 'Deadlift (Barbell)',         sets: '2|3|4|4|1', reps: '5-6',   rest: 240, restLabel: '4 min',   rirByWeek: RP_RIR_BY_WEEK },
        { name: 'Front Squat',                sets: '3|4|5|6|2', reps: '8-10',  rest: 150, restLabel: '2.5 min', rirByWeek: RP_RIR_BY_WEEK },
        { name: 'Walking Lunge (DB)',         sets: '2|3|3|4|2', reps: '10 each', rest: 120, restLabel: '2 min', rirByWeek: RP_RIR_BY_WEEK },
        { name: 'Leg Extension (Machine)',    sets: '2|3|4|5|2', reps: '12-15', rest: 60,  restLabel: '1 min',   rirByWeek: RP_RIR_BY_WEEK },
        { name: 'Seated Calf Raise',          sets: '3|4|5|5|2', reps: '15-20', rest: 60,  restLabel: '1 min',   rirByWeek: RP_RIR_BY_WEEK },
        { name: 'Cable Crunch',               sets: '2|3|3|4|2', reps: '15-20', rest: 60,  restLabel: '1 min',   rirByWeek: RP_RIR_BY_WEEK },
      ],
    },
  ],
}

// ─── Conjugate — Westside Lite (Phase 7) ─────────────────────────────────────
// ME (max effort) days work up to a 1-3RM on a rotating variant lift; DE
// (dynamic effort) days drill speed at 50/55/60% across a 3-week wave. ME
// variants rotate at block-end via the rotation-input mechanism.
const CONJUGATE_DE_WAVE_SQUAT = [
  [{ percent: 0.50, reps: '2' }, { percent: 0.50, reps: '2' }, { percent: 0.50, reps: '2' },
   { percent: 0.50, reps: '2' }, { percent: 0.50, reps: '2' }, { percent: 0.50, reps: '2' },
   { percent: 0.50, reps: '2' }, { percent: 0.50, reps: '2' }],
  [{ percent: 0.55, reps: '2' }, { percent: 0.55, reps: '2' }, { percent: 0.55, reps: '2' },
   { percent: 0.55, reps: '2' }, { percent: 0.55, reps: '2' }, { percent: 0.55, reps: '2' },
   { percent: 0.55, reps: '2' }, { percent: 0.55, reps: '2' }],
  [{ percent: 0.60, reps: '2' }, { percent: 0.60, reps: '2' }, { percent: 0.60, reps: '2' },
   { percent: 0.60, reps: '2' }, { percent: 0.60, reps: '2' }, { percent: 0.60, reps: '2' },
   { percent: 0.60, reps: '2' }, { percent: 0.60, reps: '2' }],
]
const CONJUGATE_DE_WAVE_BENCH = [
  Array.from({ length: 9 }, () => ({ percent: 0.50, reps: '3' })),
  Array.from({ length: 9 }, () => ({ percent: 0.55, reps: '3' })),
  Array.from({ length: 9 }, () => ({ percent: 0.60, reps: '3' })),
]
const ME_LOWER_OPTIONS = {
  'box-squat':    { name: 'Box Squat',    cues: 'Sit back to a low box. Pause, then drive up. Build to a heavy 1-3RM.' },
  'ssb-squat':    { name: 'SSB Squat',    cues: 'Safety squat bar. High-bar position, controlled descent. Build to a heavy 1-3RM.' },
  'good-morning': { name: 'Good Morning', cues: 'Hip-hinge with bar on traps. Build to a 3RM; technique > weight.' },
  'pin-squat':    { name: 'Pin Squat',    cues: 'Pause on pins ~2" below parallel. Build to a heavy 1-3RM from a dead start.' },
}
const ME_UPPER_OPTIONS = {
  'floor-press':       { name: 'Floor Press',       cues: 'Bench press from the floor. Pause at the elbow touch. Build to 1-3RM.' },
  'pin-press':         { name: 'Pin Press',         cues: 'Bench press from pins ~3" off chest. Dead-stop. Build to 1-3RM.' },
  'incline-bench':     { name: 'Incline Bench',     cues: '30-45° incline. Pause on chest. Build to 1-3RM.' },
  'close-grip-bench':  { name: 'Close-Grip Bench',  cues: 'Index fingers on smooth ring. Triceps focus. Build to 1-3RM.' },
}
PROGRAMS['conjugate-westside-lite'] = {
  id: 'conjugate-westside-lite',
  name: 'Conjugate — Westside Lite',
  description: 'Max Effort + Dynamic Effort method. ME days work up to a 1-3RM on a rotating variant lift; DE days drill speed at submaximal loads. "Lite" means no chains/bands required.',
  meta: {
    difficulty: 'advanced',
    daysPerWeek: 4,
    primaryGoal: 'powerlifting',
    secondaryGoals: ['strength'],
    equipment: ['barbell', 'rack', 'dumbbells', 'cables', 'machines', 'pull-up-bar'],
    experienceMonths: 24,
    timePerSession: 75,
    author: 'Louie Simmons (adapted)',
    tags: ['powerlifting', 'conjugate', 'max-effort', 'dynamic-effort'],
  },
  designer: 'Louie Simmons (adapted)',
  tags: ['ADVANCED', 'POWERLIFTING'],
  equipmentNeeded: ['Barbell', 'Squat Rack', 'Bench', 'Dumbbells', 'Cables', 'Pull-Up Bar'],
  equipmentNote: 'Full powerlifting setup. Pin/box options helpful for ME variants.',
  macrocycle: {
    name: 'Conjugate Wave',
    mesocycles: [
      { id: 'conj-meso', name: 'Conjugate Wave', weeks: 3, deloadWeek: null,
        weekLabels: ['DE 50%', 'DE 55%', 'DE 60%'] },
    ],
    repeatStrategy: 'progress-and-repeat',
  },
  microcycle: {
    type: 'calendar',
    pattern: ['me-lower', 'rest', 'me-upper', 'rest', 'de-lower', 'de-upper', 'rest'],
  },
  userInputs: [
    { id: 'squat-1rm', label: 'Squat 1RM', type: 'number', unit: 'weight', required: true,
      helpText: 'Drives Dynamic Effort lower-body weights.',
      progression: { type: 'increment', byUnit: { lbs: 10, kg: 5 } } },
    { id: 'bench-1rm', label: 'Bench 1RM', type: 'number', unit: 'weight', required: true,
      helpText: 'Drives Dynamic Effort upper-body weights.',
      progression: { type: 'increment', byUnit: { lbs: 5, kg: 2.5 } } },
    { id: 'dead-1rm',  label: 'Deadlift 1RM', type: 'number', unit: 'weight', required: true,
      helpText: 'Drives Speed Deadlift weights on DE Lower day.',
      progression: { type: 'increment', byUnit: { lbs: 10, kg: 5 } } },
    { id: 'me-lower-rotation', label: 'ME Lower variant', type: 'select', required: true,
      options: ['box-squat', 'ssb-squat', 'good-morning', 'pin-squat'],
      helpText: 'Rotates each block. Pick the variant you’ll work to a 1-3RM on.',
      progression: { type: 'rotate' } },
    { id: 'me-upper-rotation', label: 'ME Upper variant', type: 'select', required: true,
      options: ['floor-press', 'pin-press', 'incline-bench', 'close-grip-bench'],
      helpText: 'Rotates each block. Pick the variant you’ll work to a 1-3RM on.',
      progression: { type: 'rotate' } },
  ],
  sessions: [
    {
      id: 'me-lower', name: 'ME Lower', tag: 'legs', tagLabel: 'MAX EFFORT',
      focus: 'Max Effort · Lower body · Work up to a 1-3RM',
      exercises: [
        {
          name: 'ME Lower Lift', // resolved at render time via rotation
          rotationInputId: 'me-lower-rotation',
          rotationOptions: ME_LOWER_OPTIONS,
          sets: 1, reps: '1-3RM', rest: 240, restLabel: '4 min',
          notes: 'Work up in small jumps to a heavy 1-3RM single. Rotates each block.',
        },
        { name: 'Romanian Deadlift', sets: 4, reps: '6',  rest: 150, restLabel: '2.5 min' },
        { name: 'Reverse Hyperextension', sets: 3, reps: '10', rest: 90,  restLabel: '90 sec' },
        { name: 'Hanging Leg Raise', sets: 3, reps: '12', rest: 60,  restLabel: '1 min' },
      ],
    },
    {
      id: 'me-upper', name: 'ME Upper', tag: 'push', tagLabel: 'MAX EFFORT',
      focus: 'Max Effort · Upper body · Work up to a 1-3RM',
      exercises: [
        {
          name: 'ME Upper Lift',
          rotationInputId: 'me-upper-rotation',
          rotationOptions: ME_UPPER_OPTIONS,
          sets: 1, reps: '1-3RM', rest: 240, restLabel: '4 min',
          notes: 'Work up in small jumps to a heavy 1-3RM single. Rotates each block.',
        },
        { name: 'Seated DB Shoulder Press',  sets: 4, reps: '8',  rest: 120, restLabel: '2 min' },
        { name: 'Barbell Row (Pronated)',     sets: 4, reps: '6',  rest: 120, restLabel: '2 min' },
        { name: 'Tricep Extension (DB)',     sets: 3, reps: '12', rest: 90,  restLabel: '90 sec' },
      ],
    },
    {
      id: 'de-lower', name: 'DE Lower', tag: 'legs', tagLabel: 'DYNAMIC EFFORT',
      focus: 'Dynamic Effort · Speed · 8×2 box squat per week wave',
      exercises: [
        { name: 'Box Squat (Speed)',           sets: 8, reps: '2', rest: 60, restLabel: '1 min',
          loadPattern: { inputId: 'squat-1rm', byWeek: CONJUGATE_DE_WAVE_SQUAT } },
        { name: 'Speed Deadlift',              sets: 6, reps: '1', rest: 60, restLabel: '1 min',
          percentOfInput: { inputId: 'dead-1rm', percent: 0.70 } },
        { name: 'Bulgarian Split Squat (DB)',  sets: 3, reps: '8 each', rest: 90, restLabel: '90 sec' },
        { name: 'Hanging Leg Raise',           sets: 3, reps: '12', rest: 60, restLabel: '1 min' },
      ],
    },
    {
      id: 'de-upper', name: 'DE Upper', tag: 'push', tagLabel: 'DYNAMIC EFFORT',
      focus: 'Dynamic Effort · Speed · 9×3 speed bench (3 grips) per week wave',
      exercises: [
        { name: 'Speed Bench (3 grips)',  sets: 9, reps: '3', rest: 45, restLabel: '45 sec',
          loadPattern: { inputId: 'bench-1rm', byWeek: CONJUGATE_DE_WAVE_BENCH },
          notes: 'Rotate close, medium, wide grip across the 9 sets.' },
        { name: 'Weighted Pull-Up',       sets: 4, reps: '5',  rest: 120, restLabel: '2 min' },
        { name: 'Lateral Raise (DB)',     sets: 3, reps: '12', rest: 60,  restLabel: '1 min' },
        { name: 'Tricep Pushdown',        sets: 3, reps: '15', rest: 60,  restLabel: '1 min' },
      ],
    },
  ],
}

// Backfill: every Session has `type: 'resistance' | 'conditioning'` per §3.1.
// Existing program data predates the field; default missing values to
// 'resistance' here so callers can rely on session.type being set.
for (const program of Object.values(PROGRAMS)) {
  for (const session of program.sessions ?? []) {
    if (!session.type) session.type = 'resistance'
  }
}
