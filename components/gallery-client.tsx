'use client';

import { useMemo, useState } from 'react';
import type { Recipe, Category } from '@/lib/types';
import { useStore } from '@/lib/store';
import { SearchIcon, ClockIcon, HeartIcon, PlusIcon, GearIcon } from '@/components/icons';
import { CATEGORIES } from '@/lib/types';

export function GalleryClient({ recipes }: { recipes: Recipe[] }) {
  const { navigate, toggleFavorite } = useStore();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<Category | 'All'>('All');

  const filtered = useMemo(
    () =>
      recipes.filter((r) => {
        const matchCat = category === 'All' || r.category === category;
        const matchSearch = r.name.toLowerCase().includes(search.toLowerCase());
        return matchCat && matchSearch;
      }),
    [recipes, search, category],
  );

  const featured = useMemo(() => {
    if (category !== 'All' || search) return null;
    return recipes.find((r) => r.favorite) || recipes[0] || null;
  }, [recipes, category, search]);

  const gridRecipes = useMemo(() => filtered.filter((r) => r.id !== featured?.id), [filtered, featured]);

  const open = (id: string) => navigate({ name: 'detail', id });

  return (
    <div className="min-h-screen pb-28">
      <header className="flex items-center justify-between p-4 pt-[calc(env(safe-area-inset-top,0px)+24px)]">
        <div>
          <p className="text-sm text-muted">Hi Reba</p>
          <h1 className="text-2xl font-bold text-ink">What&apos;s cooking?</h1>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            aria-label="Settings"
            onClick={() => navigate({ name: 'settings' })}
            className="flex h-11 w-11 items-center justify-center rounded-2xl border border-line bg-surface text-sub"
          >
            <GearIcon size={20} />
          </button>
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-green font-bold text-bg">R</div>
        </div>
      </header>

      <div className="px-4">
        <div className="relative w-full">
          <SearchIcon size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input
            type="text"
            placeholder="Search recipes"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-2xl bg-surface py-3 pl-10 pr-4 text-ink placeholder:text-muted focus:outline-none"
          />
        </div>

        <div className="mt-4 flex gap-2 overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {(['All', ...CATEGORIES] as const).map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setCategory(cat)}
              className={`flex-shrink-0 rounded-full px-4 py-2 text-sm font-medium ${
                category === cat ? 'bg-green text-bg' : 'border border-line bg-surface text-sub'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {recipes.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-4 px-4 pt-20">
          <p className="text-muted">No recipes yet</p>
          <button
            type="button"
            onClick={() => navigate({ name: 'new' })}
            className="rounded-2xl bg-green px-6 py-3 font-semibold text-bg"
          >
            Add your first recipe
          </button>
        </div>
      ) : (
        <div className="mt-4 px-4">
          {featured && (
            <button type="button" onClick={() => open(featured.id)} className="block w-full text-left">
              <div className="relative h-[200px] w-full overflow-hidden rounded-3xl">
                {featured.photoUrl ? (
                  <img src={featured.photoUrl} alt={featured.name} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-surface2">
                    <span className="text-muted">{featured.name}</span>
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-4">
                  <h2 className="text-xl font-bold text-ink">{featured.name}</h2>
                  {featured.timeMin !== undefined && (
                    <div className="mt-1 flex items-center gap-1 text-sub">
                      <ClockIcon size={14} />
                      <span>{featured.timeMin} min</span>
                    </div>
                  )}
                </div>
              </div>
            </button>
          )}

          <div className="mt-6 flex gap-4">
            <div className="flex-1 space-y-4">
              {gridRecipes.filter((_, i) => i % 2 === 0).map((r) => (
                <RecipeCard key={r.id} recipe={r} onOpen={open} onFavorite={toggleFavorite} />
              ))}
            </div>
            <div className="flex-1 space-y-4">
              {gridRecipes.filter((_, i) => i % 2 !== 0).map((r) => (
                <RecipeCard key={r.id} recipe={r} onOpen={open} onFavorite={toggleFavorite} />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* FAB kept inside the centered phone column, clear of the tab bar + home indicator */}
      <div className="pointer-events-none fixed left-1/2 z-40 flex w-full max-w-[480px] -translate-x-1/2 justify-end px-4 bottom-[calc(env(safe-area-inset-bottom,0px)+104px)]">
        <button
          type="button"
          onClick={() => navigate({ name: 'new' })}
          aria-label="Add recipe"
          className="pointer-events-auto flex h-14 w-14 items-center justify-center rounded-full bg-green text-bg shadow-glow"
        >
          <PlusIcon size={24} />
        </button>
      </div>
    </div>
  );
}

function RecipeCard({
  recipe,
  onOpen,
  onFavorite,
}: {
  recipe: Recipe;
  onOpen: (id: string) => void;
  onFavorite: (id: string) => void;
}) {
  return (
    <button type="button" onClick={() => onOpen(recipe.id)} className="block w-full text-left">
      <div className="relative h-[116px] w-full overflow-hidden rounded-2xl bg-surface2">
        {recipe.photoUrl ? (
          <img src={recipe.photoUrl} alt={recipe.name} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center p-2 text-center">
            <span className="text-xs text-muted">{recipe.name}</span>
          </div>
        )}
        <span
          role="button"
          tabIndex={0}
          onClick={(e) => {
            e.stopPropagation();
            onFavorite(recipe.id);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.stopPropagation();
              onFavorite(recipe.id);
            }
          }}
          className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-black/40 text-ink"
        >
          <HeartIcon size={16} filled={recipe.favorite} />
        </span>
      </div>
      <h3 className="mt-2 font-bold text-ink">{recipe.name}</h3>
      {recipe.timeMin !== undefined && (
        <div className="mt-1 flex items-center gap-1 text-sub">
          <ClockIcon size={12} />
          <span className="text-xs">{recipe.timeMin} min</span>
        </div>
      )}
    </button>
  );
}
