export interface TestCase {
  id: string;
  name: string;
  category: 'additive' | 'correction' | 'complex' | 'vague' | 'edge_case';
  difficulty: 'easy' | 'medium' | 'hard';
  originalData: any;
  updateTranscript: string;
  expectedBehavior: string; // What should happen
  notes?: string;
}

export const testSuite: TestCase[] = [
  // === EASY ADDITIVE CASES ===
  {
    id: "add_01",
    name: "Simple meal addition",
    category: "additive",
    difficulty: "easy",
    originalData: {
      date: "2024-01-15",
      meals: [{ type: "Breakfast", notes: "toast" }],
      workouts: [],
      sleep: { hours: null, quality: null },
      energyLevel: null,
      mood: { rating: null, notes: null },
      waterIntakeLiters: null,
      screenTimeHours: null,
      painDiscomfort: null,
      weightKg: null,
      otherActivities: null,
      notes: null
    },
    updateTranscript: "also had coffee",
    expectedBehavior: "Should add coffee as Coffee meal type"
  },

  {
    id: "add_02", 
    name: "Basic workout addition",
    category: "additive",
    difficulty: "easy",
    originalData: {
      date: "2024-01-15",
      meals: [],
      workouts: [{ type: "walk", durationMinutes: 20, intensity: 3, notes: null }],
      sleep: { hours: null, quality: null },
      energyLevel: null,
      mood: { rating: null, notes: null },
      waterIntakeLiters: null,
      screenTimeHours: null,
      painDiscomfort: null,
      weightKg: null,
      otherActivities: null,
      notes: null
    },
    updateTranscript: "I also did pushups",
    expectedBehavior: "Should add pushups as new workout entry"
  },

  // === MEDIUM CORRECTIONS ===
  {
    id: "corr_01",
    name: "Simple mood correction",
    category: "correction", 
    difficulty: "medium",
    originalData: {
      date: "2024-01-15",
      meals: [],
      workouts: [],
      sleep: { hours: null, quality: null },
      energyLevel: null,
      mood: { rating: 6, notes: "ok" },
      waterIntakeLiters: null,
      screenTimeHours: null,
      painDiscomfort: null,
      weightKg: null,
      otherActivities: null,
      notes: null
    },
    updateTranscript: "actually mood was 8",
    expectedBehavior: "Should update mood rating from 6 to 8"
  },

  {
    id: "corr_02",
    name: "Sleep time correction",
    category: "correction",
    difficulty: "medium", 
    originalData: {
      date: "2024-01-15",
      meals: [],
      workouts: [],
      sleep: { hours: 7, quality: 8 },
      energyLevel: null,
      mood: { rating: null, notes: null },
      waterIntakeLiters: null,
      screenTimeHours: null,
      painDiscomfort: null,
      weightKg: null,
      otherActivities: null,
      notes: null
    },
    updateTranscript: "change sleep to 6 hours",
    expectedBehavior: "Should update sleep hours from 7 to 6"
  },

  // === VAGUE CASES ===
  {
    id: "vague_01",
    name: "Ambiguous food reference",
    category: "vague",
    difficulty: "hard",
    originalData: {
      date: "2024-01-15",
      meals: [{ type: "Lunch", notes: "salad" }],
      workouts: [],
      sleep: { hours: null, quality: null },
      energyLevel: null,
      mood: { rating: null, notes: null },
      waterIntakeLiters: null,
      screenTimeHours: null,
      painDiscomfort: null,
      weightKg: null,
      otherActivities: null,
      notes: null
    },
    updateTranscript: "had some stuff after",
    expectedBehavior: "Should interpret 'stuff' as food and add to meals or snacks",
    notes: "Very vague - tests AI's ability to handle unclear references"
  },

  {
    id: "vague_02",
    name: "Unclear time reference",
    category: "vague",
    difficulty: "hard",
    originalData: {
      date: "2024-01-15",
      meals: [],
      workouts: [{ type: "run", durationMinutes: 30, intensity: 5, notes: null }],
      sleep: { hours: null, quality: null },
      energyLevel: null,
      mood: { rating: null, notes: null },
      waterIntakeLiters: null,
      screenTimeHours: null,
      painDiscomfort: null,
      weightKg: null,
      otherActivities: null,
      notes: null
    },
    updateTranscript: "it was longer",
    expectedBehavior: "Should increase workout duration from 30 minutes",
    notes: "No specific time given - AI must infer reasonable increase"
  },

  {
    id: "vague_03",
    name: "Pronoun confusion",
    category: "vague", 
    difficulty: "hard",
    originalData: {
      date: "2024-01-15",
      meals: [{ type: "Breakfast", notes: "eggs" }, { type: "Lunch", notes: "soup" }],
      workouts: [],
      sleep: { hours: null, quality: null },
      energyLevel: null,
      mood: { rating: null, notes: null },
      waterIntakeLiters: null,
      screenTimeHours: null,
      painDiscomfort: null,
      weightKg: null,
      otherActivities: null,
      notes: null
    },
    updateTranscript: "it had cheese too",
    expectedBehavior: "Should determine which meal 'it' refers to and add cheese",
    notes: "Ambiguous pronoun reference"
  },

  // === EDGE CASES ===
  {
    id: "edge_01",
    name: "Contradictory info",
    category: "edge_case",
    difficulty: "hard",
    originalData: {
      date: "2024-01-15",
      meals: [],
      workouts: [],
      sleep: { hours: 8, quality: 9 },
      energyLevel: null,
      mood: { rating: null, notes: null },
      waterIntakeLiters: null,
      screenTimeHours: null,
      painDiscomfort: null,
      weightKg: null,
      otherActivities: null,
      notes: null
    },
    updateTranscript: "didn't sleep well but slept 9 hours",
    expectedBehavior: "Should handle contradiction between quality and duration",
    notes: "Conflicting information test"
  },

  {
    id: "edge_02",
    name: "Typos and misspelling",
    category: "edge_case",
    difficulty: "medium",
    originalData: {
      date: "2024-01-15",
      meals: [],
      workouts: [],
      sleep: { hours: null, quality: null },
      energyLevel: null,
      mood: { rating: null, notes: null },
      waterIntakeLiters: null,
      screenTimeHours: null,
      painDiscomfort: null,
      weightKg: null,
      otherActivities: null,
      notes: null
    },
    updateTranscript: "had yohga for 20 minuts",
    expectedBehavior: "Should correct 'yohga' to 'yoga' and 'minuts' to 'minutes'",
    notes: "Spelling error handling"
  },

  {
    id: "edge_03",
    name: "Empty/minimal input",
    category: "edge_case",
    difficulty: "medium",
    originalData: {
      date: "2024-01-15",
      meals: [{ type: "Dinner", notes: "pasta" }],
      workouts: [],
      sleep: { hours: null, quality: null },
      energyLevel: null,
      mood: { rating: null, notes: null },
      waterIntakeLiters: null,
      screenTimeHours: null,
      painDiscomfort: null,
      weightKg: null,
      otherActivities: null,
      notes: null
    },
    updateTranscript: "more",
    expectedBehavior: "Should handle minimal context appropriately",
    notes: "Very short, context-dependent input"
  },

  // === COMPLEX MULTI-FIELD ===
  {
    id: "complex_01",
    name: "Multiple field update",
    category: "complex",
    difficulty: "hard",
    originalData: {
      date: "2024-01-15",
      meals: [{ type: "Breakfast", notes: "cereal" }],
      workouts: [{ type: "walk", durationMinutes: 15, intensity: 3, notes: null }],
      sleep: { hours: 7, quality: 6 },
      energyLevel: 5,
      mood: { rating: 6, notes: null },
      waterIntakeLiters: null,
      screenTimeHours: null,
      painDiscomfort: null,
      weightKg: null,
      otherActivities: null,
      notes: null
    },
    updateTranscript: "walk was 30min actually, mood 8, also had tea",
    expectedBehavior: "Should update walk duration, mood rating, and add tea",
    notes: "Multiple changes in one update"
  },

  // === SHORT REALISTIC EXAMPLES ===
  {
    id: "real_01",
    name: "Quick addition",
    category: "additive",
    difficulty: "easy",
    originalData: {
      date: "2024-01-15",
      meals: [],
      workouts: [],
      sleep: { hours: null, quality: null },
      energyLevel: 6,
      mood: { rating: null, notes: null },
      waterIntakeLiters: null,
      screenTimeHours: null,
      painDiscomfort: null,
      weightKg: null,
      otherActivities: null,
      notes: null
    },
    updateTranscript: "ate apple",
    expectedBehavior: "Should add apple as snacks"
  },

  {
    id: "real_02",
    name: "Casual correction",
    category: "correction",
    difficulty: "easy",
    originalData: {
      date: "2024-01-15",
      meals: [],
      workouts: [],
      sleep: { hours: null, quality: null },
      energyLevel: null,
      mood: { rating: 7, notes: null },
      waterIntakeLiters: 2,
      screenTimeHours: null,
      painDiscomfort: null,
      weightKg: null,
      otherActivities: null,
      notes: null
    },
    updateTranscript: "mood was 5",
    expectedBehavior: "Should update mood from 7 to 5"
  },

  {
    id: "real_03",
    name: "Water intake addition",
    category: "additive",
    difficulty: "easy",
    originalData: {
      date: "2024-01-15",
      meals: [],
      workouts: [],
      sleep: { hours: null, quality: null },
      energyLevel: null,
      mood: { rating: null, notes: null },
      waterIntakeLiters: null,
      screenTimeHours: null,
      painDiscomfort: null,
      weightKg: null,
      otherActivities: null,
      notes: null
    },
    updateTranscript: "drank 1.5L water",
    expectedBehavior: "Should set water intake to 1.5"
  },

  // === PROBLEMATIC CASES ===
  {
    id: "prob_01",
    name: "Inconsistent units",
    category: "edge_case",
    difficulty: "hard",
    originalData: {
      date: "2024-01-15",
      meals: [],
      workouts: [{ type: "run", durationMinutes: 30, distanceKm: 5, intensity: 7, notes: null }],
      sleep: { hours: null, quality: null },
      energyLevel: null,
      mood: { rating: null, notes: null },
      waterIntakeLiters: null,
      screenTimeHours: null,
      painDiscomfort: null,
      weightKg: null,
      otherActivities: null,
      notes: null
    },
    updateTranscript: "ran 3 miles not 5k",
    expectedBehavior: "Should convert miles to km and update distance",
    notes: "Unit conversion challenge"
  },

  {
    id: "prob_02",
    name: "Slang/informal language",
    category: "vague",
    difficulty: "medium",
    originalData: {
      date: "2024-01-15",
      meals: [],
      workouts: [],
      sleep: { hours: null, quality: null },
      energyLevel: null,
      mood: { rating: null, notes: null },
      waterIntakeLiters: null,
      screenTimeHours: null,
      painDiscomfort: null,
      weightKg: null,
      otherActivities: null,
      notes: null
    },
    updateTranscript: "hit the gym",
    expectedBehavior: "Should interpret as workout activity",
    notes: "Informal language interpretation"
  },

  // === ADDITIONAL REALISTIC CASES ===
  {
    id: "add_03",
    name: "Pain mention",
    category: "additive", 
    difficulty: "easy",
    originalData: {
      date: "2024-01-15",
      meals: [],
      workouts: [],
      sleep: { hours: null, quality: null },
      energyLevel: null,
      mood: { rating: null, notes: null },
      waterIntakeLiters: null,
      screenTimeHours: null,
      painDiscomfort: null,
      weightKg: null,
      otherActivities: null,
      notes: null
    },
    updateTranscript: "back hurts",
    expectedBehavior: "Should add pain data for back"
  },

  {
    id: "corr_03",
    name: "Energy correction",
    category: "correction",
    difficulty: "easy",
    originalData: {
      date: "2024-01-15",
      meals: [],
      workouts: [],
      sleep: { hours: null, quality: null },
      energyLevel: 8,
      mood: { rating: null, notes: null },
      waterIntakeLiters: null,
      screenTimeHours: null,
      painDiscomfort: null,
      weightKg: null,
      otherActivities: null,
      notes: null
    },
    updateTranscript: "energy was low, like 3",
    expectedBehavior: "Should update energy from 8 to 3"
  },

  {
    id: "vague_04",
    name: "Relative time",
    category: "vague",
    difficulty: "medium",
    originalData: {
      date: "2024-01-15",
      meals: [],
      workouts: [{ type: "bike", durationMinutes: 45, intensity: 6, notes: null }],
      sleep: { hours: null, quality: null },
      energyLevel: null,
      mood: { rating: null, notes: null },
      waterIntakeLiters: null,
      screenTimeHours: null,
      painDiscomfort: null,
      weightKg: null,
      otherActivities: null,
      notes: null
    },
    updateTranscript: "biked for ages",
    expectedBehavior: "Should interpret 'ages' as longer duration",
    notes: "Subjective time reference"
  },

  {
    id: "edge_04",
    name: "Negative statement",
    category: "edge_case",
    difficulty: "medium",
    originalData: {
      date: "2024-01-15",
      meals: [{ type: "Lunch", notes: "sandwich" }],
      workouts: [],
      sleep: { hours: null, quality: null },
      energyLevel: null,
      mood: { rating: null, notes: null },
      waterIntakeLiters: null,
      screenTimeHours: null,
      painDiscomfort: null,
      weightKg: null,
      otherActivities: null,
      notes: null
    },
    updateTranscript: "didn't eat lunch",
    expectedBehavior: "Should remove or modify lunch entry",
    notes: "Negation handling"
  },

  {
    id: "complex_02",
    name: "Meal replacement", 
    category: "complex",
    difficulty: "hard",
    originalData: {
      date: "2024-01-15",
      meals: [{ type: "Dinner", notes: "pizza" }],
      workouts: [],
      sleep: { hours: null, quality: null },
      energyLevel: null,
      mood: { rating: null, notes: null },
      waterIntakeLiters: null,
      screenTimeHours: null,
      painDiscomfort: null,
      weightKg: null,
      otherActivities: null,
      notes: null
    },
    updateTranscript: "dinner was actually salad not pizza",
    expectedBehavior: "Should replace pizza with salad in dinner",
    notes: "Explicit replacement instruction"
  },

  // === MORE EDGE CASES ===
  {
    id: "edge_05",
    name: "Number confusion",
    category: "edge_case",
    difficulty: "hard",
    originalData: {
      date: "2024-01-15",
      meals: [],
      workouts: [],
      sleep: { hours: null, quality: null },
      energyLevel: null,
      mood: { rating: null, notes: null },
      waterIntakeLiters: null,
      screenTimeHours: null,
      painDiscomfort: null,
      weightKg: null,
      otherActivities: null,
      notes: null
    },
    updateTranscript: "ran for twenty 5 minutes",
    expectedBehavior: "Should parse confused time reference correctly",
    notes: "Ambiguous number placement"
  },

  {
    id: "vague_05",
    name: "Emotional context",
    category: "vague",
    difficulty: "medium",
    originalData: {
      date: "2024-01-15",
      meals: [],
      workouts: [],
      sleep: { hours: null, quality: null },
      energyLevel: null,
      mood: { rating: 5, notes: null },
      waterIntakeLiters: null,
      screenTimeHours: null,
      painDiscomfort: null,
      weightKg: null,
      otherActivities: null,
      notes: null
    },
    updateTranscript: "felt amazing today",
    expectedBehavior: "Should improve mood rating based on positive emotion",
    notes: "Emotional language interpretation"
  },

  {
    id: "real_04",
    name: "Screen time mention",
    category: "additive",
    difficulty: "easy",
    originalData: {
      date: "2024-01-15",
      meals: [],
      workouts: [],
      sleep: { hours: null, quality: null },
      energyLevel: null,
      mood: { rating: null, notes: null },
      waterIntakeLiters: null,
      screenTimeHours: null,
      painDiscomfort: null,
      weightKg: null,
      otherActivities: null,
      notes: null
    },
    updateTranscript: "was on phone 3h",
    expectedBehavior: "Should set screen time to 3 hours"
  },

  {
    id: "prob_03",
    name: "Multiple interpretations",
    category: "vague",
    difficulty: "hard",
    originalData: {
      date: "2024-01-15",
      meals: [],
      workouts: [],
      sleep: { hours: null, quality: null },
      energyLevel: null,
      mood: { rating: null, notes: null },
      waterIntakeLiters: null,
      screenTimeHours: null,
      painDiscomfort: null,
      weightKg: null,
      otherActivities: null,
      notes: null
    },
    updateTranscript: "worked out for an hour",
    expectedBehavior: "Should add workout with 60 minute duration, but type is unclear",
    notes: "Missing workout type - could be any exercise"
  },

  // === FINAL CHALLENGING CASES ===
  {
    id: "edge_06",
    name: "Stream of consciousness",
    category: "complex",
    difficulty: "hard",
    originalData: {
      date: "2024-01-15",
      meals: [],
      workouts: [],
      sleep: { hours: null, quality: null },
      energyLevel: null,
      mood: { rating: null, notes: null },
      waterIntakeLiters: null,
      screenTimeHours: null,
      painDiscomfort: null,
      weightKg: null,
      otherActivities: null,
      notes: null
    },
    updateTranscript: "tired but had good workout maybe 30min walked to store",
    expectedBehavior: "Should extract multiple pieces of information from rambling text",
    notes: "Unstructured, stream-of-consciousness input"
  },

  {
    id: "vague_06",
    name: "Cultural food reference",
    category: "vague",
    difficulty: "medium",
    originalData: {
      date: "2024-01-15",
      meals: [],
      workouts: [],
      sleep: { hours: null, quality: null },
      energyLevel: null,
      mood: { rating: null, notes: null },
      waterIntakeLiters: null,
      screenTimeHours: null,
      painDiscomfort: null,
      weightKg: null,
      otherActivities: null,
      notes: null
    },
    updateTranscript: "had that spicy thing again",
    expectedBehavior: "Should handle vague food reference appropriately",
    notes: "Contextless cultural/personal reference"
  },

  {
    id: "corr_04",
    name: "Implicit correction",
    category: "correction",
    difficulty: "medium",
    originalData: {
      date: "2024-01-15",
      meals: [],
      workouts: [{ type: "swim", durationMinutes: 60, intensity: 8, notes: null }],
      sleep: { hours: null, quality: null },
      energyLevel: null,
      mood: { rating: null, notes: null },
      waterIntakeLiters: null,
      screenTimeHours: null,
      painDiscomfort: null,
      weightKg: null,
      otherActivities: null,
      notes: null
    },
    updateTranscript: "swimming was easy today",
    expectedBehavior: "Should lower intensity from 8 based on 'easy' description",
    notes: "Implicit intensity correction"
  },

  {
    id: "edge_07",
    name: "Partial information",
    category: "edge_case",
    difficulty: "medium",
    originalData: {
      date: "2024-01-15",
      meals: [{ type: "Breakfast", notes: "eggs" }],
      workouts: [],
      sleep: { hours: null, quality: null },
      energyLevel: null,
      mood: { rating: null, notes: null },
      waterIntakeLiters: null,
      screenTimeHours: null,
      painDiscomfort: null,
      weightKg: null,
      otherActivities: null,
      notes: null
    },
    updateTranscript: "with toast and",
    expectedBehavior: "Should handle incomplete sentence appropriately",
    notes: "Incomplete/cut-off input"
  }
];

export function getTestsByCategory(category: TestCase['category']): TestCase[] {
  return testSuite.filter(test => test.category === category);
}

export function getTestsByDifficulty(difficulty: TestCase['difficulty']): TestCase[] {
  return testSuite.filter(test => test.difficulty === difficulty);
}

export function getTestById(id: string): TestCase | undefined {
  return testSuite.find(test => test.id === id);
}