// Field-name unions and domain models for the Airtable data layer.

export type Category = 'Breakfast' | 'Lunch' | 'Dinner' | 'Dessert' | 'Snack' | 'Drink';

export type Meal = 'Breakfast' | 'Lunch' | 'Dinner' | 'Snack';

export type GroceryCategory =
  | 'Produce'
  | 'Protein'
  | 'Dairy'
  | 'Pantry'
  | 'Bakery'
  | 'Frozen'
  | 'Other';

export const CATEGORIES: Category[] = ['Breakfast', 'Lunch', 'Dinner', 'Dessert', 'Snack', 'Drink'];
export const MEALS: Meal[] = ['Breakfast', 'Lunch', 'Dinner', 'Snack'];

export interface Recipe {
  id: string;
  name: string;
  category?: Category;
  timeMin?: number;
  servings?: number;
  calories?: number;
  ingredients: string[];
  instructions: string[];
  photoUrl?: string;
  favorite: boolean;
  notes?: string;
  sourceUrl?: string;
}

export interface RecipeInput {
  name: string;
  category?: Category;
  timeMin?: number;
  servings?: number;
  calories?: number;
  ingredients: string[];
  instructions: string[];
  photoUrl?: string;
  favorite: boolean;
  notes?: string;
  sourceUrl?: string;
}

export interface PlanEntry {
  id: string;
  date: string;
  meal: Meal;
  recipeId?: string;
  recipeName?: string;
  recipePhotoUrl?: string;
}

export interface GroceryItem {
  id: string;
  item: string;
  category: GroceryCategory;
  quantity?: string;
  checked: boolean;
}

// The entire on-device app state, persisted as one blob in IndexedDB.
export interface AppState {
  version: number;
  recipes: Recipe[];
  plan: PlanEntry[];
  grocery: GroceryItem[];
}

export const STATE_VERSION = 1;
