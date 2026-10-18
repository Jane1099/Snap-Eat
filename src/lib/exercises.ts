export type ExerciseType = 'Cardio' | 'Strength' | 'Mobility' | 'Sports';
export type ExerciseDefinition = { name: string; type: ExerciseType; met: number; muscle: string; equipment: string; description: string; aliases?: string[]; source?: string };
const groups: { type: ExerciseType; met: number; muscle: string; equipment: string; names: string }[] = [
  { type: 'Cardio', met: 3.5, muscle: 'Full body', equipment: 'None', names: 'Walking|Brisk Walking|Treadmill Walking|Incline Walking|Hiking' },
  { type: 'Cardio', met: 7, muscle: 'Full body', equipment: 'None', names: 'Jogging' },
  { type: 'Cardio', met: 8.5, muscle: 'Full body', equipment: 'None', names: 'Running|Outdoor Running|Treadmill Running|Trail Running|Sprinting|Interval Running' },
  { type: 'Cardio', met: 6.8, muscle: 'Legs', equipment: 'Bicycle', names: 'Cycling|Road Cycling|Mountain Biking|Stationary Cycling|Spin Bike|Recumbent Bike|Air Bike' },
  { type: 'Cardio', met: 6, muscle: 'Full body', equipment: 'Pool', names: 'Swimming|Freestyle Swimming|Breaststroke Swimming|Backstroke Swimming|Butterfly Swimming|Water Aerobics' },
  { type: 'Cardio', met: 7, muscle: 'Full body', equipment: 'Cardio equipment', names: 'Rowing|Rowing Machine|Elliptical|Stair Climber|Stair Climbing|Jump Rope|Skipping|Battle Ropes|Ski Erg|Aerobics|Dance Cardio|Zumba' },
  { type: 'Strength', met: 5, muscle: 'Chest', equipment: 'Free weights / machine', names: 'Barbell Bench Press|Dumbbell Bench Press|Low Incline Dumbbell Press|Incline Dumbbell Press|Incline Barbell Press|Decline Bench Press|Close Grip Bench Press|Floor Press|Chest Press|Machine Chest Press|Smith Machine Bench Press|Dumbbell Fly|Incline Dumbbell Fly|Cable Fly|Low Cable Fly|High Cable Fly|Pec Deck|Push Up|Incline Push Up|Decline Push Up|Diamond Push Up|Chest Dip|Landmine Press|Single Arm Chest Press' },
  { type: 'Strength', met: 5, muscle: 'Back', equipment: 'Free weights / cable', names: 'Pull Up|Chin Up|Assisted Pull Up|Lat Pulldown|Wide Grip Lat Pulldown|Close Grip Lat Pulldown|Reverse Grip Lat Pulldown|Straight Arm Pulldown|Barbell Row|Bent Over Row|Dumbbell Row|One Arm Dumbbell Row|Chest Supported Row|Seated Cable Row|T Bar Row|Pendlay Row|Meadows Row|Machine Row|Inverted Row|Renegade Row|Dumbbell Pullover|Cable Pullover|Rack Pull|Back Extension' },
  { type: 'Strength', met: 5, muscle: 'Shoulders', equipment: 'Free weights / cable', names: 'Overhead Press|Military Press|Dumbbell Shoulder Press|Seated Dumbbell Press|Arnold Press|Machine Shoulder Press|Smith Machine Shoulder Press|Dumbbell Lateral Raise|Cable Lateral Raise|Machine Lateral Raise|Front Raise|Rear Delt Fly|Reverse Pec Deck|Face Pull|Upright Row|Barbell Shrug|Dumbbell Shrug|Cable Rear Delt Fly|Y Raise|Cuban Press|Plate Front Raise' },
  { type: 'Strength', met: 5, muscle: 'Quadriceps / glutes', equipment: 'Free weights / machine', names: 'Barbell Back Squat|Front Squat|Goblet Squat|Bodyweight Squat|Hack Squat|Smith Machine Squat|Leg Press|Single Leg Press|Leg Extension|Bulgarian Split Squat|Split Squat|Walking Lunge|Reverse Lunge|Forward Lunge|Lateral Lunge|Step Up|Sissy Squat|Box Squat|Sumo Squat|Belt Squat|Wall Sit|Pistol Squat|Dumbbell Squat|Landmine Squat' },
  { type: 'Strength', met: 5.5, muscle: 'Hamstrings / glutes', equipment: 'Free weights / machine', names: 'Romanian Deadlift|Dumbbell Romanian Deadlift|Single Leg Romanian Deadlift|Conventional Deadlift|Sumo Deadlift|Trap Bar Deadlift|Stiff Leg Deadlift|Reverse Leg Curl|Lying Leg Curl|Seated Leg Curl|Standing Leg Curl|Nordic Hamstring Curl|Good Morning|Hip Thrust|Barbell Hip Thrust|Glute Bridge|Cable Pull Through|Cable Kickback|Reverse Hyperextension|Glute Ham Raise|Kettlebell Swing|Frog Pump|Hip Abduction|Hip Adduction' },
  { type: 'Strength', met: 4.5, muscle: 'Calves', equipment: 'Free weights / machine', names: 'Standing Calf Raise|Seated Calf Raise|Donkey Calf Raise|Single Leg Calf Raise|Leg Press Calf Raise|Tibialis Raise' },
  { type: 'Strength', met: 4.5, muscle: 'Biceps / forearms', equipment: 'Free weights / cable', names: 'Barbell Curl|EZ Bar Curl|Dumbbell Curl|Alternating Dumbbell Curl|Hammer Curl|Incline Dumbbell Curl|Preacher Curl|Concentration Curl|Cable Curl|Bayesian Curl|Spider Curl|Reverse Curl|Zottman Curl|Wrist Curl|Reverse Wrist Curl|Farmer Carry|Wrist Roller' },
  { type: 'Strength', met: 4.5, muscle: 'Triceps', equipment: 'Free weights / cable', names: 'Triceps Pushdown|Rope Pushdown|Straight Bar Pushdown|Overhead Triceps Extension|Dumbbell Triceps Extension|Skull Crusher|Cable Triceps Extension|Triceps Kickback|Bench Dip|Close Grip Push Up|Single Arm Triceps Pushdown' },
  { type: 'Strength', met: 4, muscle: 'Core', equipment: 'Bodyweight / cable', names: 'Crunch|Reverse Crunch|Cable Crunch|Bicycle Crunch|Hanging Leg Raise|Hanging Knee Raise|Lying Leg Raise|Sit Up|Russian Twist|Ab Wheel Rollout|Dead Bug|Bird Dog|Pallof Press|Cable Woodchop|Decline Crunch|Weighted Crunch|Mountain Climber|Heel Tap|V Up' },
  { type: 'Strength', met: 6, muscle: 'Full body', equipment: 'Free weights / bodyweight', names: 'Strength Training|Circuit Training|Power Clean|Hang Clean|Clean and Press|Snatch|Push Press|Thruster|Burpee|Turkish Get Up|Sled Push|Sled Pull|Medicine Ball Slam|Kettlebell Clean|Kettlebell Snatch|Box Jump' },
  { type: 'Mobility', met: 2.5, muscle: 'Full body', equipment: 'Mat', names: 'Yoga|Hatha Yoga|Vinyasa Yoga|Pilates|Stretching|Dynamic Stretching|Foam Rolling|Sun Salutation|Hip Mobility|Shoulder Mobility|Thoracic Mobility|Plank|Side Plank|Child Pose|Cobra Stretch|Hamstring Stretch' },
  { type: 'Sports', met: 6, muscle: 'Full body', equipment: 'Sport-specific', names: 'Badminton|Cricket|Football|Soccer|Basketball|Tennis|Table Tennis|Volleyball|Squash|Boxing|Kickboxing|Martial Arts|Wrestling|Rock Climbing|Dancing|Skating|Kayaking|Golf|Pickleball|Rugby|Handball' },
];
const aliases: Record<string, string[]> = {
  'Running': ['run'], 'Jogging': ['jog'], 'Cycling': ['biking', 'bike'], 'Swimming': ['swim'],
  'Barbell Bench Press': ['barbell press', 'bench press'], 'Romanian Deadlift': ['rdl'],
  'Dumbbell Lateral Raise': ['lateral raises'], 'Reverse Leg Curl': ['reverse hamstring curl'],
  'Triceps Pushdown': ['tricep pushdown'], 'Pull Up': ['pullup', 'pull-up'], 'Push Up': ['pushup', 'push-up'],
  'Barbell Back Squat': ['squat', 'back squat'], 'Low Incline Dumbbell Press': ['low incline db press'],
};
export const exerciseCatalog: ExerciseDefinition[] = groups.flatMap(group => group.names.split('|').map(name => ({
  name, type: group.type, met: group.met, muscle: group.muscle, equipment: group.equipment,
  aliases: aliases[name] || [], source: 'Local activity-category estimate',
  description: group.type === 'Strength' ? `${group.muscle} exercise. Track each working set and use a load suited to your ability.` : `${group.type} activity. Record actual duration and effort; calorie burn is an estimate.`,
})));
export function findExercises(query: string, type = 'All') {
  const words = query.trim().toLowerCase().split(/\s+/);
  return exerciseCatalog.filter(exercise => (type === 'All' || exercise.type === type) && words.every(word => [exercise.name, ...(exercise.aliases || [])].join(' ').toLowerCase().includes(word)));
}
