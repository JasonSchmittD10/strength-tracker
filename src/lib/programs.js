export const PROGRAMS = {
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
}

export function getActiveProgram(config) {
  const id = config?.activeProgramId || 'ppl-x2'
  return PROGRAMS[id] || PROGRAMS['ppl-x2']
}

export function getBlockAndWeek(config) {
  if (!config?.programStartDate) return null
  const program = getActiveProgram(config)
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
  const order = program.sessionOrder
  if (!recentSessions?.length) return program.sessions[0]
  const last = recentSessions[0]
  const lastIdx = order.indexOf(last.sessionId || 'push-a')
  const nextId = order[(lastIdx + 1) % order.length]
  return program.sessions.find(s => s.id === nextId) || program.sessions[0]
}
