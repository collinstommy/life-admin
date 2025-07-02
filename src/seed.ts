import { AppContext } from "./types";
import { saveHealthLog } from "./lib/db";
import { StructuredHealthData } from "./lib/ai";

// Sample data for generating realistic health logs
const sampleWorkouts = [
  { type: "Running", durationMinutes: 30, distanceKm: 5, intensity: 7, notes: "Great morning run" },
  { type: "Weight Training", durationMinutes: 45, intensity: 8, notes: "Upper body focus" },
  { type: "Cycling", durationMinutes: 60, distanceKm: 15, intensity: 6, notes: "Scenic route through park" },
  { type: "Swimming", durationMinutes: 30, distanceKm: 1.5, intensity: 7, notes: "Pool workout" },
  { type: "Yoga", durationMinutes: 45, intensity: 4, notes: "Relaxing session" },
  { type: "Walking", durationMinutes: 20, distanceKm: 2, intensity: 3, notes: "Evening walk" },
  { type: "HIIT", durationMinutes: 25, intensity: 9, notes: "High intensity interval training" },
];

const sampleMeals = [
  { type: "Breakfast", notes: "Oatmeal with berries and honey" },
  { type: "Breakfast", notes: "Scrambled eggs with toast" },
  { type: "Lunch", notes: "Grilled chicken salad" },
  { type: "Lunch", notes: "Quinoa bowl with vegetables" },
  { type: "Dinner", notes: "Salmon with roasted vegetables" },
  { type: "Dinner", notes: "Pasta with marinara sauce" },
  { type: "Snacks", notes: "Apple and peanut butter" },
  { type: "Coffee", notes: "Morning coffee with oat milk" },
];

const sampleTranscripts = [
  "Today I went for a 5km run in the morning, felt great with energy level around 8. Had overnight oats for breakfast and a big salad for lunch. Slept about 7 hours last night, quality was good. Mood has been positive today, around 8 out of 10.",
  "Did a 45-minute weight training session focusing on upper body. Energy level is about 7 today. Had scrambled eggs for breakfast and grilled chicken for lunch. Sleep was okay, around 6.5 hours but felt restful. Drinking plenty of water today.",
  "Went for a long bike ride this weekend, about 15km through the park. Energy level feels high today, maybe 8 or 9. Had a quinoa bowl for lunch with lots of vegetables. Sleep has been good lately, getting about 7-8 hours consistently.",
  "Feeling a bit tired today, energy level around 5. Did some light yoga for 45 minutes which helped. Had coffee this morning and planning a light dinner. Weight seems stable around my usual range. Mood is neutral, maybe 6 out of 10.",
  "Great workout today with a 25-minute HIIT session, really pushed myself hard. Energy level is high despite the intense workout. Had a protein-rich breakfast and staying hydrated. Sleep quality has been excellent lately, feeling very rested.",
  "Had a relaxing swimming session at the pool today, about 30 minutes of laps. Feeling refreshed and energized. Breakfast was scrambled eggs and toast, lunch was a fresh salad. Sleep has been consistent around 7-8 hours.",
  "Took a nice evening walk around the neighborhood, about 2km at a leisurely pace. Energy level is moderate today, around 6. Had pasta for dinner which was satisfying. Mood is good, feeling content.",
  "Started the day with some yoga which really helped center my mind. Energy level is calm but steady. Had oatmeal for breakfast and planning a light lunch. Weight training yesterday left me feeling accomplished.",
  "Did some cycling through the park this morning, really enjoyed the fresh air and exercise. Energy level is high, around 8. Had a quinoa bowl for lunch packed with vegetables. Sleep quality has been improving lately.",
  "Feeling great today after a good night's sleep of about 8 hours. Energy level is high, did a quick morning walk. Had coffee and planning a healthy lunch. Overall mood is very positive, around 9 out of 10.",
];

const painLocations = ["Lower back", "Right knee", "Neck", "Shoulders", "Left wrist"];

function getRandomElement<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

function getRandomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getRandomFloat(min: number, max: number, decimals: number = 1): number {
  return Math.round((Math.random() * (max - min) + min) * Math.pow(10, decimals)) / Math.pow(10, decimals);
}

function getDateNDaysAgo(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString().split('T')[0];
}

/**
 * Seed the database with sample health tracking data
 * @param ctx Hono context with D1 binding
 * @param numEntries Number of health log entries to create (default: 10)
 * @returns Object with success status and details
 */
export async function seedDatabase(ctx: AppContext, numEntries: number = 10) {
  console.log("🌱 Starting database seeding...");
  
  const results = [];
  
  for (let i = 0; i < numEntries; i++) {
    console.log(`📝 Creating health log entry ${i + 1}/${numEntries}...`);
    
    // Create main health log entry
    const date = getDateNDaysAgo(numEntries - i - 1); // Spread entries over the last N days
    const transcript = getRandomElement(sampleTranscripts);
    
    // Generate structured health data
    const structuredData: StructuredHealthData = {
      date,
      screenTimeHours: getRandomFloat(3, 10),
      waterIntakeLiters: getRandomFloat(1.5, 3.5),
      sleep: {
        hours: getRandomFloat(6, 9),
        quality: getRandomInt(5, 10),
      },
      energyLevel: getRandomInt(5, 9),
      mood: {
        rating: getRandomInt(5, 9),
        notes: ["Feeling good", "A bit tired", "Very positive", "Neutral mood", "Energetic"][getRandomInt(0, 4)],
      },
      weightKg: getRandomFloat(60, 90),
      workouts: Math.random() > 0.3 ? [getRandomElement(sampleWorkouts)] : [], // 70% chance of workout
      meals: [
        getRandomElement(sampleMeals.filter(m => m.type === "Breakfast")),
        getRandomElement(sampleMeals.filter(m => m.type === "Lunch")),
        getRandomElement(sampleMeals.filter(m => m.type === "Dinner")),
      ],
      painDiscomfort: Math.random() > 0.7 ? { // 30% chance of pain
        location: getRandomElement(painLocations),
        intensity: getRandomInt(1, 5),
        notes: "Mild discomfort, probably from sitting too long",
      } : undefined,
      otherActivities: "Regular daily activities, some walking",
      notes: "Overall feeling good today, maintaining healthy habits",
    };
    
    try {
      // Use the existing saveHealthLog function which handles all the database insertions
      const logId = await saveHealthLog(
        ctx,
        "", // No audio URL for seed data
        transcript,
        structuredData,
      );
      
      results.push({
        id: logId,
        date,
        transcript: transcript.substring(0, 50) + "...",
      });
      
      console.log(`✅ Created health log entry ${i + 1} with ID: ${logId}`);
    } catch (error) {
      console.error(`❌ Failed to create health log entry ${i + 1}:`, error);
      throw error;
    }
  }
  
  console.log("✅ Database seeded successfully!");
  console.log(`📊 Created ${numEntries} health log entries with related data`);
  
  return {
    success: true,
    message: `Successfully created ${numEntries} health log entries`,
    entries: results,
  };
}