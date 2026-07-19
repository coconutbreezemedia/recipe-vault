'use client';

import { useMemo, useState } from 'react';
import type { PlanEntry, Recipe, Meal } from '@/lib/types';
import { MEALS } from '@/lib/types';
import { useStore } from '@/lib/store';
import { PlusIcon, TrashIcon, SparkIcon, ChevronLeftIcon, ChevronRightIcon } from '@/components/icons';

const DOW = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function toISO(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

// Monday of the week that is `offset` weeks from the current week.
function mondayForOffset(offset: number): Date {
  const now = new Date();
  const mondayOffset = (now.getDay() + 6) % 7;
  return new Date(now.getFullYear(), now.getMonth(), now.getDate() - mondayOffset + offset * 7);
}

function buildWeek(offset: number) {
  const monday = mondayForOffset(offset);
  const todayISO = toISO(new Date());
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + i);
    const iso = toISO(d);
    return { iso, dow: DOW[d.getDay()], dom: d.getDate(), today: iso === todayISO };
  });
}

export function PlannerClient({ entries, recipes }: { entries: PlanEntry[]; recipes: Recipe[] }) {
  const { addToPlan, removeFromPlan, generateGrocery, navigate } = useStore();
  const [weekOffset, setWeekOffset] = useState(0);
  const week = useMemo(() => buildWeek(weekOffset), [weekOffset]);

  const [selected, setSelected] = useState(() => {
    const w = buildWeek(0);
    return w.find((d) => d.today)?.iso ?? w[0].iso;
  });
  const [openMeal, setOpenMeal] = useState<Meal | null>(null);
  const [busy, setBusy] = useState(false);

  const changeWeek = (delta: number) => {
    const next = weekOffset + delta;
    setWeekOffset(next);
    const w = buildWeek(next);
    setSelected(w.find((d) => d.today)?.iso ?? w[0].iso);
    setOpenMeal(null);
  };

  const rangeLabel = () => {
    const start = new Date(week[0].iso + 'T00:00:00');
    const end = new Date(week[6].iso + 'T00:00:00');
    const opts: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
    const startStr = start.toLocaleDateString('en-US', opts);
    const endStr = end.toLocaleDateString('en-US', start.getMonth() === end.getMonth() ? { day: 'numeric' } : opts);
    const suffix = weekOffset === 0 ? ' · This week' : '';
    return `${startStr} – ${endStr}${suffix}`;
  };

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
    <div className="min-h-screen pb-36">
      <header className="p-4 pt-6">
        <h1 className="text-2xl font-bold text-ink">Meal Plan</h1>
        <div className="mt-2 flex items-center justify-between">
          <button
            type="button"
            onClick={() => changeWeek(-1)}
            aria-label="Previous week"
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-line bg-surface text-sub"
          >
            <ChevronLeftIcon size={18} />
          </button>
          <span className="text-sm font-medium text-sub">{rangeLabel()}</span>
          <button
            type="button"
            onClick={() => changeWeek(1)}
            aria-label="Next week"
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-line bg-surface text-sub"
          >
            <ChevronRightIcon size={18} />
          </button>
        </div>
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

      <div className="mt-10 px-4">
        <button
          type="button"
          onClick={handleGenerate}
          disabled={busy}
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-green px-4 py-4 font-semibold text-bg shadow-glow disabled:opacity-50"
        >
          <SparkIcon size={18} />
          Generate grocery list
        </button>
        <p className="mt-2 text-center text-xs text-muted">Builds a list from the week shown above.</p>
      </div>
    </div>
  );
}
