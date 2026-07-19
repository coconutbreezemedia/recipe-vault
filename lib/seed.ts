import type { Recipe } from './types';

// A few starter recipes so the app isn't empty on first launch. Reba can delete
// these anytime. Photos are hosted URLs (they need a connection the first time);
// recipes she adds herself store the photo on the device for full offline use.
export const SEED_RECIPES: Omit<Recipe, 'id'>[] = [
  {
    name: 'Honey Glazed Salmon',
    category: 'Dinner',
    timeMin: 25,
    servings: 2,
    calories: 480,
    ingredients: ['2 salmon fillets', '3 tbsp honey', '2 cloves garlic, minced', '1 tbsp soy sauce', 'Juice of ½ lemon', 'Fresh dill'],
    instructions: [
      'Pat salmon dry and season with salt & pepper.',
      'Whisk honey, garlic, soy sauce and lemon.',
      'Sear salmon skin-side down 4 min.',
      'Flip, add glaze, spoon over 3 min.',
      'Rest, garnish with dill and serve.',
    ],
    photoUrl: 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=1000&q=80&auto=format&fit=crop',
    favorite: true,
  },
  {
    name: 'Rainbow Buddha Bowl',
    category: 'Lunch',
    timeMin: 20,
    servings: 2,
    calories: 520,
    ingredients: ['1 cup cooked quinoa', '1 avocado, sliced', '1 cup chickpeas, roasted', '1 carrot, ribboned', '1 cup red cabbage, shredded', 'Tahini dressing'],
    instructions: [
      'Cook quinoa and let cool slightly.',
      'Roast chickpeas with olive oil and spices.',
      'Arrange all components in a bowl.',
      'Drizzle with tahini dressing and serve.',
    ],
    photoUrl: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=1000&q=80&auto=format&fit=crop',
    favorite: false,
  },
  {
    name: 'Berry Breakfast Bowl',
    category: 'Breakfast',
    timeMin: 8,
    servings: 1,
    calories: 320,
    ingredients: ['1 cup Greek yogurt', '½ cup mixed berries', '2 tbsp granola', '1 tbsp honey', 'Chia seeds'],
    instructions: ['Spoon yogurt into a bowl.', 'Top with berries and granola.', 'Drizzle honey and sprinkle chia seeds.'],
    photoUrl: 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=1000&q=80&auto=format&fit=crop',
    favorite: true,
  },
];
