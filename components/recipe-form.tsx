'use client';

import { useRef, useState } from 'react';
import type { Recipe, RecipeInput, Category } from '@/lib/types';
import { CATEGORIES } from '@/lib/types';
import { useStore } from '@/lib/store';
import { BackIcon, ImageIcon, CloseIcon } from '@/components/icons';

// Downscale an uploaded image to a data URL so it lives on the device (offline)
// without bloating storage. Longest edge capped at 1280px, JPEG q0.82.
async function fileToDataUrl(file: File): Promise<string> {
  const bitmapUrl = URL.createObjectURL(file);
  try {
    const img = document.createElement('img');
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error('Could not read image'));
      img.src = bitmapUrl;
    });
    const max = 1280;
    const scale = Math.min(1, max / Math.max(img.width, img.height));
    const w = Math.round(img.width * scale);
    const h = Math.round(img.height * scale);
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    if (!ctx) return bitmapUrl;
    ctx.drawImage(img, 0, 0, w, h);
    return canvas.toDataURL('image/jpeg', 0.82);
  } finally {
    URL.revokeObjectURL(bitmapUrl);
  }
}

export function RecipeForm({ recipe, mode }: { recipe?: Recipe; mode: 'new' | 'edit' }) {
  const { addRecipe, updateRecipe, navigate, back } = useStore();
  const formRef = useRef<HTMLFormElement>(null);
  const [photo, setPhoto] = useState<string | undefined>(recipe?.photoUrl);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const onPickPhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setPhoto(await fileToDataUrl(file));
    } catch {
      setError('Could not load that image.');
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const num = (v: FormDataEntryValue | null) => {
      const s = String(v ?? '').trim();
      const n = Number(s);
      return s !== '' && Number.isFinite(n) ? n : undefined;
    };
    const lines = (v: FormDataEntryValue | null) =>
      String(v ?? '')
        .split('\n')
        .map((l) => l.trim())
        .filter(Boolean);

    const name = String(form.get('name') ?? '').trim();
    if (!name) {
      setError('Please give the recipe a name.');
      return;
    }
    const cat = String(form.get('category') ?? '');
    const input: RecipeInput = {
      name,
      category: (CATEGORIES as string[]).includes(cat) ? (cat as Category) : undefined,
      timeMin: num(form.get('timeMin')),
      servings: num(form.get('servings')),
      calories: num(form.get('calories')),
      ingredients: lines(form.get('ingredients')),
      instructions: lines(form.get('instructions')),
      photoUrl: photo,
      favorite: form.get('favorite') === 'on',
      notes: String(form.get('notes') ?? '').trim() || undefined,
      sourceUrl: String(form.get('sourceUrl') ?? '').trim() || undefined,
    };

    setSaving(true);
    try {
      if (mode === 'edit' && recipe) {
        await updateRecipe(recipe.id, input);
        navigate({ name: 'detail', id: recipe.id }, { replace: true });
      } else {
        const created = await addRecipe(input);
        navigate({ name: 'detail', id: created.id }, { replace: true });
      }
    } catch {
      setError('Could not save. Please try again.');
      setSaving(false);
    }
  };

  const field =
    'mt-1 w-full rounded-xl border border-line bg-surface px-4 py-3 text-ink focus:outline-none focus:border-green';

  return (
    <div className="min-h-screen pb-28">
      <div className="flex items-center gap-3 p-4 pt-6">
        <button
          type="button"
          onClick={back}
          aria-label="Back"
          className="flex h-10 w-10 items-center justify-center rounded-xl bg-surface text-ink"
        >
          <BackIcon size={20} />
        </button>
        <h1 className="text-xl font-bold text-ink">{mode === 'edit' ? 'Edit recipe' : 'New recipe'}</h1>
      </div>

      <form ref={formRef} onSubmit={handleSubmit} className="space-y-5 px-4">
        {/* Photo */}
        <div>
          <label className="text-sm text-muted">Photo</label>
          <div className="mt-1 overflow-hidden rounded-2xl border border-line bg-surface">
            {photo ? (
              <div className="relative">
                <img src={photo} alt="" className="h-44 w-full object-cover" />
                <button
                  type="button"
                  onClick={() => setPhoto(undefined)}
                  aria-label="Remove photo"
                  className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-black/60 text-ink"
                >
                  <CloseIcon size={18} />
                </button>
              </div>
            ) : (
              <label className="flex h-32 cursor-pointer flex-col items-center justify-center gap-2 text-muted">
                <ImageIcon size={24} />
                <span className="text-sm">Add a photo from your phone</span>
                <input type="file" accept="image/*" className="hidden" onChange={onPickPhoto} />
              </label>
            )}
          </div>
          {photo && (
            <label className="mt-2 inline-block cursor-pointer text-sm text-green">
              Replace photo
              <input type="file" accept="image/*" className="hidden" onChange={onPickPhoto} />
            </label>
          )}
        </div>

        <div>
          <label className="text-sm text-muted">Name</label>
          <input type="text" name="name" required defaultValue={recipe?.name ?? ''} className={field} />
        </div>

        <div>
          <label className="text-sm text-muted">Category</label>
          <select name="category" defaultValue={recipe?.category ?? ''} className={field}>
            <option value="">Select a category</option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        <div className="flex gap-4">
          <div className="flex-1">
            <label className="text-sm text-muted">Time (min)</label>
            <input type="number" name="timeMin" inputMode="numeric" defaultValue={recipe?.timeMin ?? ''} className={field} />
          </div>
          <div className="flex-1">
            <label className="text-sm text-muted">Servings</label>
            <input type="number" name="servings" inputMode="numeric" defaultValue={recipe?.servings ?? ''} className={field} />
          </div>
          <div className="flex-1">
            <label className="text-sm text-muted">Calories</label>
            <input type="number" name="calories" inputMode="numeric" defaultValue={recipe?.calories ?? ''} className={field} />
          </div>
        </div>

        <div>
          <label className="text-sm text-muted">Ingredients — one per line</label>
          <textarea name="ingredients" rows={6} defaultValue={recipe?.ingredients.join('\n') ?? ''} className={field} />
        </div>

        <div>
          <label className="text-sm text-muted">Instructions — one step per line</label>
          <textarea name="instructions" rows={6} defaultValue={recipe?.instructions.join('\n') ?? ''} className={field} />
        </div>

        <div>
          <label className="text-sm text-muted">Notes</label>
          <textarea name="notes" rows={3} defaultValue={recipe?.notes ?? ''} className={field} />
        </div>

        <div>
          <label className="text-sm text-muted">Source URL</label>
          <input type="url" name="sourceUrl" defaultValue={recipe?.sourceUrl ?? ''} className={field} />
        </div>

        <label className="flex items-center gap-3">
          <input type="checkbox" name="favorite" defaultChecked={recipe?.favorite ?? false} className="h-5 w-5 accent-green" />
          <span className="text-sm text-ink">Mark as favorite</span>
        </label>

        {error && <p className="text-sm text-red-400">{error}</p>}

        <div className="sticky bottom-0 -mx-4 border-t border-line bg-bg px-4 py-4 pb-[calc(env(safe-area-inset-bottom,0px)+16px)]">
          <button
            type="submit"
            disabled={saving}
            className="w-full rounded-2xl bg-green px-4 py-3 font-semibold text-bg disabled:opacity-50"
          >
            {saving ? 'Saving…' : 'Save recipe'}
          </button>
        </div>
      </form>
    </div>
  );
}
