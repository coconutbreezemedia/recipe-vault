'use client';

import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { loadState, saveState } from './idb';
import { downloadBackup, readBackupFile } from './backup';
import {
  STATE_VERSION,
  type AppState,
  type Category,
  type GroceryItem,
  type Meal,
  type PlanEntry,
  type Recipe,
  type RecipeInput,
} from './types';
import { SEED_RECIPES } from './seed';
import { initSync, onLocalStateChange } from './sync';

/* ---------- in-app navigation (SPA, no server routes) ---------- */
export type ViewName = 'gallery' | 'detail' | 'new' | 'edit' | 'plan' | 'grocery' | 'settings';
export interface View {
  name: ViewName;
  id?: string;
}

interface StoreValue {
  ready: boolean;
  recipes: Recipe[];
  plan: PlanEntry[];
  grocery: GroceryItem[];

  // navigation
  view: View;
  navigate: (view: View, opts?: { replace?: boolean }) => void;
  back: () => void;

  // recipe CRUD
  addRecipe: (input: RecipeInput) => Promise<Recipe>;
  updateRecipe: (id: string, input: RecipeInput) => Promise<void>;
  deleteRecipe: (id: string) => Promise<void>;
  toggleFavorite: (id: string) => Promise<void>;
  toggleShared: (id: string) => Promise<boolean>;
  getRecipe: (id: string) => Recipe | undefined;

  // plan
  addToPlan: (date: string, meal: Meal, recipeId: string) => Promise<void>;
  removeFromPlan: (id: string) => Promise<void>;

  // grocery
  generateGrocery: (startISO: string, endISO: string) => Promise<number>;
  toggleGrocery: (id: string) => Promise<void>;
  clearGrocery: () => Promise<void>;

  // backup
  exportBackup: () => void;
  importBackup: (file: File) => Promise<void>;
}

const StoreContext = createContext<StoreValue | null>(null);

function uid(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
  return 'r_' + Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [plan, setPlan] = useState<PlanEntry[]>([]);
  const [grocery, setGrocery] = useState<GroceryItem[]>([]);
  const [view, setView] = useState<View>({ name: 'gallery' });
  const history = useRef<View[]>([]);

  // Live snapshot for the sync engine (initSync captures it once; refs stay fresh).
  const stateRef = useRef<AppState>({ version: STATE_VERSION, recipes: [], plan: [], grocery: [] });
  stateRef.current = { version: STATE_VERSION, recipes, plan, grocery };

  // Load persisted state once (seed sample recipes on very first run).
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const saved = await loadState();
      if (cancelled) return;
      if (saved) {
        setRecipes(saved.recipes ?? []);
        setPlan(saved.plan ?? []);
        setGrocery(saved.grocery ?? []);
      } else {
        const seeded = SEED_RECIPES.map((r) => ({ ...r, id: uid() }));
        setRecipes(seeded);
        await saveState({ version: STATE_VERSION, recipes: seeded, plan: [], grocery: [] });
      }
      setReady(true);
      // Wire the sync engine after the initial load so a cloud pull can't race
      // the seed write. applyState persists merged state without re-notifying
      // sync (the merge already updated its shadow, so the diff would be empty
      // anyway — this just skips the wasted work).
      initSync(
        () => stateRef.current,
        async (merged: AppState) => {
          if (cancelled) return;
          setRecipes(merged.recipes);
          setPlan(merged.plan);
          setGrocery(merged.grocery);
          await saveState(merged);
        },
      );
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Persist a full snapshot after any change. `ready` guards against clobbering
  // the store before the initial load completes.
  const persist = (next: Partial<Pick<AppState, 'recipes' | 'plan' | 'grocery'>>) => {
    const snapshot: AppState = {
      version: STATE_VERSION,
      recipes: next.recipes ?? recipes,
      plan: next.plan ?? plan,
      grocery: next.grocery ?? grocery,
    };
    void saveState(snapshot);
    void onLocalStateChange(snapshot);
  };

  // replace:true swaps the current view without adding a history entry — used
  // after saving a form so Back skips the form and returns to where you were.
  const navigate = (v: View, opts?: { replace?: boolean }) => {
    if (!opts?.replace) history.current.push(view);
    setView(v);
  };
  const back = () => {
    const prev = history.current.pop();
    setView(prev ?? { name: 'gallery' });
  };

  const sanitize = (input: RecipeInput): Omit<Recipe, 'id'> => ({
    name: input.name.trim(),
    category: input.category,
    timeMin: input.timeMin,
    servings: input.servings,
    calories: input.calories,
    ingredients: input.ingredients.map((l) => l.trim()).filter(Boolean),
    instructions: input.instructions.map((l) => l.trim()).filter(Boolean),
    photoUrl: input.photoUrl || undefined,
    favorite: !!input.favorite,
    notes: input.notes?.trim() || undefined,
    sourceUrl: input.sourceUrl?.trim() || undefined,
  });

  const addRecipe = async (input: RecipeInput): Promise<Recipe> => {
    const recipe: Recipe = { id: uid(), ...sanitize(input) };
    const nextRecipes = [...recipes, recipe];
    setRecipes(nextRecipes);
    persist({ recipes: nextRecipes });
    return recipe;
  };

  const updateRecipe = async (id: string, input: RecipeInput): Promise<void> => {
    // Carry `shared` through edits — sanitize() only knows form fields.
    const nextRecipes = recipes.map((r) => (r.id === id ? { id, shared: r.shared, ...sanitize(input) } : r));
    setRecipes(nextRecipes);
    persist({ recipes: nextRecipes });
  };

  const deleteRecipe = async (id: string): Promise<void> => {
    const nextRecipes = recipes.filter((r) => r.id !== id);
    const nextPlan = plan.filter((p) => p.recipeId !== id);
    setRecipes(nextRecipes);
    setPlan(nextPlan);
    persist({ recipes: nextRecipes, plan: nextPlan });
  };

  const toggleFavorite = async (id: string): Promise<void> => {
    const nextRecipes = recipes.map((r) => (r.id === id ? { ...r, favorite: !r.favorite } : r));
    setRecipes(nextRecipes);
    persist({ recipes: nextRecipes });
  };

  const toggleShared = async (id: string): Promise<boolean> => {
    let nowShared = false;
    const nextRecipes = recipes.map((r) => {
      if (r.id !== id) return r;
      nowShared = !r.shared;
      return { ...r, shared: nowShared };
    });
    setRecipes(nextRecipes);
    persist({ recipes: nextRecipes });
    return nowShared;
  };

  const getRecipe = (id: string) => recipes.find((r) => r.id === id);

  const addToPlan = async (date: string, meal: Meal, recipeId: string): Promise<void> => {
    const entry: PlanEntry = { id: uid(), date, meal, recipeId };
    const nextPlan = [...plan, entry];
    setPlan(nextPlan);
    persist({ plan: nextPlan });
  };

  const removeFromPlan = async (id: string): Promise<void> => {
    const nextPlan = plan.filter((p) => p.id !== id);
    setPlan(nextPlan);
    persist({ plan: nextPlan });
  };

  const generateGrocery = async (startISO: string, endISO: string): Promise<number> => {
    const inRange = plan.filter((p) => p.date >= startISO && p.date <= endISO);
    const seen = new Set<string>();
    const items: GroceryItem[] = [];
    for (const p of inRange) {
      const recipe = recipes.find((r) => r.id === p.recipeId);
      if (!recipe) continue;
      for (const line of recipe.ingredients) {
        const trimmed = line.trim();
        if (!trimmed) continue;
        const key = trimmed.toLowerCase();
        if (seen.has(key)) continue;
        seen.add(key);
        items.push({ id: uid(), item: trimmed, category: 'Other', checked: false });
      }
    }
    setGrocery(items);
    persist({ grocery: items });
    return items.length;
  };

  const toggleGrocery = async (id: string): Promise<void> => {
    const next = grocery.map((g) => (g.id === id ? { ...g, checked: !g.checked } : g));
    setGrocery(next);
    persist({ grocery: next });
  };

  const clearGrocery = async (): Promise<void> => {
    setGrocery([]);
    persist({ grocery: [] });
  };

  const exportBackup = () => {
    downloadBackup({ version: STATE_VERSION, recipes, plan, grocery });
  };

  const importBackup = async (file: File): Promise<void> => {
    const state = await readBackupFile(file);
    setRecipes(state.recipes);
    setPlan(state.plan);
    setGrocery(state.grocery);
    const snapshot: AppState = { version: STATE_VERSION, recipes: state.recipes, plan: state.plan, grocery: state.grocery };
    await saveState(snapshot);
    void onLocalStateChange(snapshot);
  };

  const value = useMemo<StoreValue>(
    () => ({
      ready,
      recipes,
      plan,
      grocery,
      view,
      navigate,
      back,
      addRecipe,
      updateRecipe,
      deleteRecipe,
      toggleFavorite,
      toggleShared,
      getRecipe,
      addToPlan,
      removeFromPlan,
      generateGrocery,
      toggleGrocery,
      clearGrocery,
      exportBackup,
      importBackup,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [ready, recipes, plan, grocery, view],
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore(): StoreValue {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used inside <StoreProvider>');
  return ctx;
}

export type { Category };
