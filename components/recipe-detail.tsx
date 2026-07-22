'use client';

import { useState } from 'react';
import type { Recipe, Meal } from '@/lib/types';
import { MEALS } from '@/lib/types';
import { useStore } from '@/lib/store';
import { BackIcon, HeartIcon, CheckIcon, EditIcon, TrashIcon, ShareIcon } from '@/components/icons';
import { getSyncStatus, syncNow } from '@/lib/sync';
import { isSyncConfigured } from '@/lib/supa-config';

const SHARE_ORIGIN = 'https://recipevault.coconutbreeze.app';

export function RecipeDetail({ recipe }: { recipe: Recipe }) {
  const { navigate, back, deleteRecipe, toggleFavorite, toggleShared, addToPlan } = useStore();
  const [checked, setChecked] = useState<Set<number>>(new Set());
  const [showMeals, setShowMeals] = useState(false);
  const [addedMeal, setAddedMeal] = useState<Meal | null>(null);
  const [shareMsg, setShareMsg] = useState('');

  const handleShare = async () => {
    if (!isSyncConfigured() || !getSyncStatus().enabled) {
      window.alert('Turn on cloud sync in Settings first — sharing publishes the recipe through your vault.');
      return;
    }
    const nowShared = await toggleShared(recipe.id);
    void syncNow();
    if (nowShared) {
      const url = `${SHARE_ORIGIN}/share/#${recipe.id}`;
      try {
        await navigator.clipboard?.writeText(url);
        setShareMsg('Public link copied!');
      } catch {
        setShareMsg(url);
      }
    } else {
      setShareMsg('Sharing turned off.');
    }
    setTimeout(() => setShareMsg(''), 3500);
  };

  const todayISO = new Date().toISOString().slice(0, 10);

  const handleDelete = async () => {
    if (window.confirm('Delete this recipe?')) {
      await deleteRecipe(recipe.id);
      navigate({ name: 'gallery' });
    }
  };

  const handleAddToPlan = async (meal: Meal) => {
    await addToPlan(todayISO, meal, recipe.id);
    setAddedMeal(meal);
    setShowMeals(false);
    setTimeout(() => setAddedMeal(null), 2000);
  };

  const toggle = (idx: number) =>
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });

  return (
    <div className="min-h-screen pb-28">
      {shareMsg && (
        <div className="fixed left-1/2 top-[calc(env(safe-area-inset-top,0px)+16px)] z-50 -translate-x-1/2 rounded-xl border border-green/40 bg-bg/95 px-4 py-2.5 text-sm text-green shadow-glow backdrop-blur-sm">
          {shareMsg}
        </div>
      )}
      <div className="relative h-[310px] w-full overflow-hidden">
        {recipe.photoUrl ? (
          <img src={recipe.photoUrl} alt={recipe.name} className="h-full w-full object-cover" />
        ) : (
          <div className="h-full w-full bg-surface2" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-bg via-transparent to-black/20" />

        <button
          type="button"
          onClick={back}
          aria-label="Back"
          className="absolute left-4 top-[calc(env(safe-area-inset-top,0px)+16px)] flex h-10 w-10 items-center justify-center rounded-xl bg-black/40 text-ink backdrop-blur-sm"
        >
          <BackIcon size={20} />
        </button>

        <div className="absolute right-4 top-[calc(env(safe-area-inset-top,0px)+16px)] flex items-center gap-2">
          <button
            type="button"
            onClick={handleShare}
            aria-label={recipe.shared ? 'Stop sharing' : 'Share'}
            className={`flex h-10 w-10 items-center justify-center rounded-xl backdrop-blur-sm ${recipe.shared ? 'bg-green text-bg' : 'bg-black/40 text-ink'}`}
          >
            <ShareIcon size={18} />
          </button>
          <button
            type="button"
            onClick={() => navigate({ name: 'edit', id: recipe.id })}
            aria-label="Edit"
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-black/40 text-ink backdrop-blur-sm"
          >
            <EditIcon size={18} />
          </button>
          <button
            type="button"
            onClick={handleDelete}
            aria-label="Delete"
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-black/40 text-ink backdrop-blur-sm"
          >
            <TrashIcon size={18} />
          </button>
          <button
            type="button"
            onClick={() => toggleFavorite(recipe.id)}
            aria-label="Favorite"
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-black/40 text-ink backdrop-blur-sm"
          >
            <HeartIcon size={20} filled={recipe.favorite} />
          </button>
        </div>
      </div>

      <div className="relative -mt-8 rounded-t-3xl bg-bg px-4 pt-6">
        {recipe.category && (
          <p className="text-xs font-bold uppercase tracking-wider text-gold">{recipe.category}</p>
        )}
        <h1 className="mt-1 font-serif text-2xl font-bold text-ink">{recipe.name}</h1>

        <div className="mt-4 flex gap-3">
          {recipe.timeMin !== undefined && (
            <div className="flex-1 rounded-2xl border border-line bg-surface p-3 text-center">
              <p className="text-lg font-bold text-green">{recipe.timeMin}</p>
              <p className="text-xs text-muted">min</p>
            </div>
          )}
          {recipe.servings !== undefined && (
            <div className="flex-1 rounded-2xl border border-line bg-surface p-3 text-center">
              <p className="text-lg font-bold text-green">{recipe.servings}</p>
              <p className="text-xs text-muted">serves</p>
            </div>
          )}
          {recipe.calories !== undefined && (
            <div className="flex-1 rounded-2xl border border-line bg-surface p-3 text-center">
              <p className="text-lg font-bold text-green">{recipe.calories}</p>
              <p className="text-xs text-muted">cal</p>
            </div>
          )}
        </div>

        {recipe.ingredients.length > 0 && (
          <div className="mt-8">
            <h2 className="text-lg font-bold text-ink">Ingredients</h2>
            <div className="mt-3 space-y-3">
              {recipe.ingredients.map((ing, idx) => (
                <button key={idx} type="button" onClick={() => toggle(idx)} className="flex w-full items-center gap-3 text-left">
                  <span
                    className={`flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full border ${
                      checked.has(idx) ? 'border-green bg-green text-bg' : 'border-line'
                    }`}
                  >
                    {checked.has(idx) && <CheckIcon size={14} />}
                  </span>
                  <span className={`text-sm ${checked.has(idx) ? 'text-muted line-through' : 'text-ink'}`}>{ing}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {recipe.instructions.length > 0 && (
          <div className="mt-8">
            <h2 className="text-lg font-bold text-ink">Method</h2>
            <div className="mt-3 space-y-4">
              {recipe.instructions.map((step, idx) => (
                <div key={idx} className="flex gap-3">
                  <span className="font-serif text-2xl font-bold text-gold">{idx + 1}</span>
                  <p className="pt-1 text-sm text-ink">{step}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {recipe.notes && (
          <div className="mt-8">
            <h2 className="text-lg font-bold text-ink">Notes</h2>
            <p className="mt-2 text-sm text-muted">{recipe.notes}</p>
          </div>
        )}
      </div>

      <div className="sticky bottom-0 mt-8 border-t border-line bg-bg p-4 pb-[calc(env(safe-area-inset-bottom,0px)+16px)]">
        {addedMeal ? (
          <div className="w-full rounded-2xl bg-green px-4 py-3 text-center font-semibold text-bg">
            Added to {addedMeal} today
          </div>
        ) : showMeals ? (
          <div className="flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {MEALS.map((meal) => (
              <button
                key={meal}
                type="button"
                onClick={() => handleAddToPlan(meal)}
                className="flex-shrink-0 rounded-full bg-green px-4 py-3 text-sm font-semibold text-bg"
              >
                {meal}
              </button>
            ))}
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setShowMeals(true)}
            className="w-full rounded-2xl bg-green px-4 py-3 font-semibold text-bg"
          >
            Add to plan
          </button>
        )}
      </div>
    </div>
  );
}
