'use client';

import { useEffect, useState } from 'react';
import type { Recipe } from '@/lib/types';
import { SUPA_URL, SUPA_ANON_KEY } from '@/lib/supa-config';

type LoadState = 'loading' | 'missing' | 'not_found' | 'ready';

export default function SharePage() {
  const [state, setState] = useState<LoadState>('loading');
  const [recipe, setRecipe] = useState<Recipe | null>(null);

  useEffect(() => {
    const id = window.location.hash.replace(/^#/, '').trim();

    if (!id) {
      setState('missing');
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        const res = await fetch(`${SUPA_URL}/rest/v1/rpc/rv_get_public_recipe`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            apikey: SUPA_ANON_KEY,
            Authorization: `Bearer ${SUPA_ANON_KEY}`,
          },
          body: JSON.stringify({ p_id: id }),
        });

        if (!res.ok) {
          if (!cancelled) setState('not_found');
          return;
        }

        const data = await res.json();
        if (cancelled) return;

        if (!data || data.length === 0) {
          setState('not_found');
          return;
        }

        const r = Array.isArray(data) ? data[0] : data;
        setRecipe({
          id: r.id ?? id,
          name: r.name ?? '',
          category: r.category,
          timeMin: r.time_min ?? r.timeMin,
          servings: r.servings,
          calories: r.calories,
          ingredients: r.ingredients ?? [],
          instructions: r.instructions ?? [],
          photoUrl: r.photo_url ?? r.photoUrl,
          favorite: r.favorite ?? false,
          notes: r.notes,
          sourceUrl: r.source_url ?? r.sourceUrl,
        } as Recipe);
        setState('ready');
      } catch {
        if (!cancelled) setState('not_found');
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  if (state === 'loading') {
    return (
      <div className="app-shell flex min-h-[100dvh] items-center justify-center px-5">
        <p className="font-serif text-2xl text-ink">Recipe Vault</p>
      </div>
    );
  }

  if (state === 'missing') {
    return (
      <div className="app-shell flex min-h-[100dvh] items-center justify-center px-5">
        <div className="text-center">
          <h1 className="font-serif text-2xl font-bold text-ink">This link is incomplete</h1>
          <p className="mt-2 text-sm text-muted">Ask the sender to share the recipe again.</p>
        </div>
      </div>
    );
  }

  if (state === 'not_found' || !recipe) {
    return (
      <div className="app-shell flex min-h-[100dvh] items-center justify-center px-5">
        <div className="text-center">
          <h1 className="font-serif text-2xl font-bold text-ink">Recipe not found</h1>
          <p className="mt-2 text-sm text-muted">This recipe is no longer shared or has been removed.</p>
        </div>
      </div>
    );
  }

  const { photoUrl, name, category, timeMin, servings, calories, ingredients, instructions, notes } = recipe;

  return (
    <div className="app-shell min-h-[100dvh] px-5 pb-8 pt-[calc(env(safe-area-inset-top,0px)+32px)]">
      <div className="mx-auto max-w-md">
        {photoUrl && (
          <img
            src={photoUrl}
            alt={name}
            className="mb-6 aspect-[4/3] w-full rounded-2xl object-cover"
          />
        )}

        {category && (
          <p className="text-xs font-bold uppercase tracking-wider text-gold">{category}</p>
        )}
        <h1 className="mt-1 font-serif text-3xl font-bold text-ink">{name}</h1>

        {(timeMin !== undefined || servings !== undefined || calories !== undefined) && (
          <div className="mt-4 flex flex-wrap gap-2">
            {timeMin !== undefined && (
              <span className="rounded-full border border-line bg-surface px-3 py-1.5 text-sm font-semibold text-green">
                {timeMin} min
              </span>
            )}
            {servings !== undefined && (
              <span className="rounded-full border border-line bg-surface px-3 py-1.5 text-sm font-semibold text-green">
                {servings} serves
              </span>
            )}
            {calories !== undefined && (
              <span className="rounded-full border border-line bg-surface px-3 py-1.5 text-sm font-semibold text-green">
                {calories} cal
              </span>
            )}
          </div>
        )}

        {ingredients.length > 0 && (
          <div className="mt-8">
            <h2 className="font-serif text-xl font-bold text-ink">Ingredients</h2>
            <ul className="mt-3 space-y-2.5">
              {ingredients.map((ing, idx) => (
                <li key={idx} className="flex items-start gap-3">
                  <span className="mt-2 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-green" />
                  <span className="text-sm text-ink">{ing}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {instructions.length > 0 && (
          <div className="mt-8">
            <h2 className="font-serif text-xl font-bold text-ink">Method</h2>
            <div className="mt-3 space-y-4">
              {instructions.map((step, idx) => (
                <div key={idx} className="flex gap-3">
                  <span className="font-serif text-2xl font-bold leading-none text-gold">{idx + 1}</span>
                  <p className="pt-1 text-sm text-ink">{step}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {notes && (
          <div className="mt-8">
            <h2 className="font-serif text-xl font-bold text-ink">Notes</h2>
            <p className="mt-2 text-sm text-muted">{notes}</p>
          </div>
        )}

        <footer className="mt-12 border-t border-line pt-6">
          <p className="text-center text-xs text-muted">Shared from Recipe Vault</p>
        </footer>
      </div>
    </div>
  );
}
