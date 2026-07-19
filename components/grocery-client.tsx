'use client';

import type { GroceryItem, GroceryCategory } from '@/lib/types';
import { useStore } from '@/lib/store';
import { CheckIcon, SparkIcon, TrashIcon } from '@/components/icons';

const CATEGORY_ORDER: GroceryCategory[] = ['Produce', 'Protein', 'Dairy', 'Bakery', 'Frozen', 'Pantry', 'Other'];

export function GroceryClient({ items }: { items: GroceryItem[] }) {
  const { toggleGrocery, clearGrocery, navigate } = useStore();

  const done = items.filter((i) => i.checked).length;
  const total = items.length;
  const progress = total > 0 ? (done / total) * 100 : 0;

  const grouped = CATEGORY_ORDER.map((cat) => ({
    category: cat,
    items: items.filter((i) => i.category === cat),
  })).filter((g) => g.items.length > 0);

  const handleClear = () => {
    if (window.confirm('Clear entire grocery list?')) void clearGrocery();
  };

  return (
    <div className="min-h-screen pb-28">
      <header className="p-4 pt-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted">From this week&apos;s plan</p>
            <h1 className="text-2xl font-bold text-ink">Grocery List</h1>
          </div>
          <div className="rounded-2xl bg-green px-4 py-2 text-sm font-bold text-bg">
            {done}/{total}
          </div>
        </div>

        <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-surface">
          <div className="h-full bg-green transition-all" style={{ width: `${progress}%` }} />
        </div>

        <div className="mt-4 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-muted">
            <SparkIcon size={14} />
            <span>Auto-generated from your meal plan</span>
          </div>
          {total > 0 && (
            <button type="button" onClick={handleClear} className="flex items-center gap-1 text-xs text-muted">
              <TrashIcon size={14} />
              Clear list
            </button>
          )}
        </div>
      </header>

      {total === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 px-4 pt-20 text-center">
          <p className="text-lg font-medium text-ink">Your grocery list is empty</p>
          <p className="text-sm text-muted">Plan some meals, then tap Generate.</p>
          <button
            type="button"
            onClick={() => navigate({ name: 'plan' })}
            className="mt-2 rounded-2xl bg-green px-6 py-3 font-semibold text-bg"
          >
            Go to Meal Plan
          </button>
        </div>
      ) : (
        <div className="mt-4 space-y-6 px-4">
          {grouped.map((group) => (
            <div key={group.category}>
              <h2 className="mb-2 text-xs font-bold uppercase tracking-wider text-gold">{group.category}</h2>
              <div className="space-y-1 rounded-2xl border border-line bg-surface p-2">
                {group.items.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => toggleGrocery(item.id)}
                    className="flex w-full items-center gap-3 rounded-xl p-2 text-left"
                  >
                    <span
                      className={`flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full border ${
                        item.checked ? 'border-green bg-green text-bg' : 'border-line'
                      }`}
                    >
                      {item.checked && <CheckIcon size={14} />}
                    </span>
                    <span className={`flex-1 text-sm ${item.checked ? 'text-muted line-through' : 'text-ink'}`}>
                      {item.item}
                    </span>
                    {item.quantity && <span className="text-xs text-muted">{item.quantity}</span>}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
