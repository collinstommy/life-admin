# Recipe Storage & Integration - Product Requirements Document

## Overview

This PRD outlines the recipe storage system that enables ingredient-based nutrition analysis. The system extracts recipes from Notion, stores them with AI-generated ingredient lists, and integrates them into the health tracking app for enhanced meal logging and nutrition insights.

## Problem Statement

Users currently log meals as free text ("chicken stir fry") which limits nutrition analysis capabilities. By connecting meals to structured recipe data with ingredient lists, the AI can provide meaningful dietary insights based on actual food consumption patterns.

## Core Strategy: Ingredient-Focused Storage

### Why Ingredient Lists Work Better

**More Accurate**: AI can reliably extract ingredient lists from recipes - it's good at parsing "2 cups flour, 1 lb chicken breast, 3 cloves garlic"

**Nutritionally Meaningful**: You can map common ingredients to approximate nutrition values (chicken breast = high protein, pasta = high carbs)

**User-Friendly**: People think in terms of ingredients, not abstract nutrition numbers

**Flexible**: Works for both precise recipes ("100g tofu") and casual cooking ("handful of spinach")

## Database Schema

```typescript
// Recipes table for storing Notion recipes with AI-extracted ingredients
export const recipes = sqliteTable('recipes', {
  id: text('id').primaryKey(), // UUID
  notionId: text('notion_id').unique(), // For syncing with Notion
  title: text('title').notNull(),
  slug: text('slug').notNull().unique(), // URL-friendly version
  markdown: text('markdown').notNull(), // Full recipe content from Notion
  
  // AI-extracted ingredient data (core feature)
  extractedIngredients: text('extracted_ingredients'), // JSON array of ingredient strings
  
  // Optional metadata
  isActive: integer('is_active').default(1), // 0 = inactive/archived recipes
  tags: text('tags'), // JSON array for categorization
  servings: integer('servings'), // Estimated servings
  
  // Processing timestamps
  lastIngredientExtraction: integer('last_ingredient_extraction'),
  createdAt: integer('created_at').notNull(),
  updatedAt: integer('updated_at').notNull(),
});

// Enhanced meals table linking to recipes
export const mealsWithRecipes = sqliteTable('meals_with_recipes', {
  id: text('id').primaryKey(),
  logId: text('log_id').notNull().references(() => healthLogs.id),
  type: text('type').notNull(), // breakfast, lunch, dinner, snack
  
  // Recipe connection
  recipeId: text('recipe_id').references(() => recipes.id),
  servings: real('servings').default(1), // Portion consumed
  
  // Fallback for non-recipe meals
  freeformNotes: text('freeform_notes'),
  
  createdAt: integer('created_at').notNull(),
  updatedAt: integer('updated_at').notNull(),
});
```

## Data Flow Architecture

### Recipe Storage Pattern
```
Recipe: "Tofu Stir Fry"
extractedIngredients: ["100g firm tofu", "2 medium potatoes", "3 large carrots", "1 tbsp olive oil", "2 cloves garlic"]
isActive: 1
tags: ["dinner", "vegetarian", "asian"]
```

### Meal Logging Options
When someone logs a meal:
1. **Recipe Selection**: Choose from autocomplete dropdown of active recipes
2. **Voice/Text Recognition**: "I had that tofu stir fry recipe" → AI matches to existing recipe
3. **Freeform Entry**: Falls back to current text-based logging

### AI Analysis Capabilities
The AI can analyze ingredients for insights:
- **Protein Patterns**: "You had tofu twice this week (good plant protein!)"
- **Variety Analysis**: "You eat a lot of potatoes and rice - try quinoa or lentils for variety"
- **Nutrition Balance**: "Your meals this week were heavy on oils and light on leafy greens"
- **Pattern Recognition**: "You eat chicken 5 times a week but no fish"

## Notion Integration Strategy

### Initial Recipe Extraction
**When**: One-time bulk import during system setup
**Process**:
1. Fetch all recipe pages from Notion using existing API integration
2. Convert Notion blocks to markdown (existing capability)
3. Use AI to extract ingredient lists from markdown content
4. Store recipes with `isActive: 1` by default

```typescript
// Extraction process
const extractIngredientsFromRecipe = async (markdown: string) => {
  const result = await generateObject({
    model: 'gemini',
    schema: z.object({
      ingredients: z.array(z.string()).describe('List of ingredients with quantities'),
      estimatedServings: z.number().describe('Estimated number of servings'),
      tags: z.array(z.string()).describe('Recipe categories and characteristics')
    }),
    prompt: `Extract ingredients from this recipe. Include quantities where specified.
    
Recipe:
${markdown}`
  });
  
  return result.object;
};
```

### Ongoing Synchronization
**When**: 
- Manual trigger via admin interface
- Weekly automated sync (future enhancement)
- On-demand when user searches for recipe not in local database

**Strategy**: Compare Notion `last_edited_time` with local `updatedAt` to identify changes

## User Interface Enhancements

### Recipe Selection Dropdown
**Location**: Meal logging interface (voice entry screen and manual entry screen)

**Features**:
- Autocomplete search by recipe title
- Filter by meal type tags (breakfast, lunch, dinner)
- Recent recipes prioritized
- "Add new recipe" option for unlisted meals

```typescript
// Autocomplete component API
interface RecipeAutocomplete {
  searchRecipes(query: string, mealType?: string): Promise<Recipe[]>;
  onRecipeSelect(recipe: Recipe, servings: number): void;
  onFreeformEntry(notes: string): void;
}
```

### Recipe Management Interface
**Admin Features**:
- View all recipes with active/inactive status
- Bulk activate/deactivate recipes
- Preview extracted ingredients
- Manually edit ingredient lists
- Trigger re-extraction for specific recipes

## Recipe Activation Strategy

### Problem
Not all Notion recipes are actively used - some may be experiments, old versions, or recipes for special occasions.

### Solution: Smart Activation System

**Default State**: All imported recipes start as `isActive: 1`

**Deactivation Triggers**:
- Manual deactivation via admin interface
- Auto-deactivation after 6+ months of no usage
- User feedback ("I don't make this anymore")

**Activation Indicators**:
- Recipe appears in autocomplete dropdowns
- Included in AI analysis and recommendations
- Available for meal logging

**Inactive Recipe Behavior**:
- Hidden from dropdowns but searchable
- Historical meal logs remain intact
- Can be reactivated at any time

## Implementation Phases

### Phase 1: Core Recipe Storage (Week 1)
- Database schema implementation
- Notion recipe extraction script
- AI ingredient extraction pipeline
- Basic recipe activation system

### Phase 2: UI Integration (Week 2)
- Recipe autocomplete dropdown component
- Enhanced meal logging with recipe selection
- Recipe management admin interface

### Phase 3: Smart Analysis (Week 3)
- AI nutrition insights based on ingredients
- Recipe recommendation system
- Usage-based activation/deactivation

## Success Metrics

**Data Quality**: >90% of recipes have accurately extracted ingredient lists
**User Adoption**: 70% of meals logged use recipe selection vs. freeform text
**Insight Accuracy**: AI can provide specific ingredient-based recommendations
**Performance**: Recipe autocomplete responds in <200ms with 500+ recipes

## Technical Considerations

**Ingredient Extraction Accuracy**: AI may struggle with complex recipe formats - manual review/editing capability required

**Storage Efficiency**: Ingredient lists stored as JSON arrays for easy querying and analysis

**Search Performance**: Recipe titles and ingredients indexed for fast autocomplete

**Data Freshness**: Notion sync strategy balances freshness with API rate limits