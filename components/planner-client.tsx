'use client';

import { useState } from 'react';
import type { PlanEntry, Recipe, Meal } from '@/lib/types';
import { MEALS } from '@/lib/types';
import { useStore } from '@/lib/store';
import { PlusIcon, TrashIcon, SparkIcon } from '@/components/icons';

type WeekDay = { iso: string; dow: string; dom: number; today: boolean };

export function PlannerClient({
  week,
  entries,
  recipes,
}: {
  week: WeekDay[];
  entries: PlanEntry[];
  recipes: Recipe[];
}) {
  const { addToPlan, removeFromPlan, generateGrocery, navigate } = useStore();
  const [selected, setSelected] = useState(week.find((d) => d.today)?.iso || week[0].iso);
  const [openMeal, setOpenMeal] = useState<Meal | null>(null);
  const [busy, setBusy] = useState(false);

  const monthLabel = new Date(week[0].iso + 'T00:00:00').toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });

  const recipeById = (id?: string) => recipes.find((r) => r.id === id);

  const handleAdd = async (meal: Meal, recipeId: string) => {
    await addToPlan(selected, meal, recipeId);
    setOpenMeal(null);
  };

  const handleGenerate = async () => {
    setBusy(true);
    await generateGrocery(week[0].iso, week[6].iso);
    navigate({ name: 'grocery' });
  };

  return (
    <div className="min-h-screen pb-28">
      <header className="p-4 pt-6">
        <p className="text-sm text-muted">{monthLabel}</p>
        <h1 className="text-2xl font-bold text-ink">Meal Plan</h1>
      </header>

      <div className="flex gap-2 overflow-x-auto px-4 pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {week.map((day) => (
          <button
            key={day.iso}
            type="button"
            onClick={() => setSelected(day.iso)}
            className={`flex w-14 flex-shrink-0 flex-col items-center rounded-2xl py-3 ${
              selected === day.iso
                ? 'bg-green text-bg'
                : day.today
                ? 'bg-surface text-ink ring-1 ring-green'
                : 'bg-surface text-sub'
            }`}
          >
            <span className="text-xs">{day.dow}</span>
            <span className="text-lg font-bold">{day.dom}</span>
          </button>
        ))}
      </div>

      <div className="mt-6 space-y-8 px-4">
        {MEALS.map((meal) => {
          const mealEntries = entries.filter((e) => e.date === selected && e.meal === meal);
          return (
            <div key={meal}>
              <h2 className="text-xs font-bold uppercase tracking-wider text-gold">{meal}</h2>
              <div className="mt-3 space-y-2">
                {mealEntries.map((entry) => {
                  const r = recipeById(entry.recipeId);
                  return (
                    <div key={entry.id} className="flex items-center gap-3 rounded-2xl bg-surface p-2 pr-3">
                      <div className="h-12 w-12 flex-shrink-0 overflow-hidden rounded-xl bg-surface2">
                        {r?.photoUrl && <img src={r.photoUrl} alt={r.name} className="h-full w-full object-cover" />}
                      </div>
                      <span className="flex-1 font-medium text-ink">{r?.name ?? 'Recipe'}</span>
                      <button
                        type="button"
                        onClick={() => removeFromPlan(entry.id)}
                        aria-label="Remove"
                        className="flex h-8 w-8 items-center justify-center rounded-lg text-muted"
                      >
                        <TrashIcon size={16} />
                      </button>
                    </div>
                  );
                })}

                {openMeal === meal ? (
                  recipes.length === 0 ? (
                    <div className="rounded-2xl border border-line bg-surface p-4 text-center text-sm text-muted">
                      No recipes yet — add one first.
                    </div>
                  ) : (
                    <div className="max-h-64 space-y-1 overflow-y-auto rounded-2xl border border-line bg-surface p-2">
                      {recipes.map((r) => (
                        <button
                          key={r.id}
                          type="button"
                          onClick={() => handleAdd(meal, r.id)}
                          className="flex w-full items-center gap-3 rounded-xl p-2 text-left hover:bg-surface2"
                        >
                          <div className="h-10 w-10 flex-shrink-0 overflow-hidden rounded-lg bg-surface2">
                            {r.photoUrl && <img src={r.photoUrl} alt={r.name} className="h-full w-full object-cover" />}
                          </div>
                          <span className="text-sm text-ink">{r.name}</span>
                        </button>
                      ))}
                    </div>
                  )
                ) : (
                  <button
                    type="button"
                    onClick={() => setOpenMeal(meal)}
                    className="flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-line py-4 text-sub"
                  >
                    <PlusIcon size={18} />
                    <span className="text-sm">Add recipe</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="sticky bottom-0 mt-8 border-t border-line bg-bg p-4">
        <button
          type="button"
          onClick={handleGenerate}
          disabled={busy}
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-green px-4 py-3 font-semibold text-bg disabled:opacity-50"
        >
          <SparkIcon size={18} />
          Generate grocery list
        </button>
      </div>
    </div>
  );
}
