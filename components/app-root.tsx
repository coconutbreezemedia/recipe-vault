'use client';

import { StoreProvider, useStore } from '@/lib/store';
import { PinGate } from '@/components/pin-gate';
import { TabBar } from '@/components/tab-bar';
import { GalleryClient } from '@/components/gallery-client';
import { RecipeDetail } from '@/components/recipe-detail';
import { RecipeForm } from '@/components/recipe-form';
import { PlannerClient } from '@/components/planner-client';
import { GroceryClient } from '@/components/grocery-client';
import { Settings } from '@/components/settings';

const DOW = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

// Monday-start week containing today (local time).
function currentWeek() {
  const now = new Date();
  const todayISO = toISO(now);
  const mondayOffset = (now.getDay() + 6) % 7;
  const monday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - mondayOffset);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + i);
    const iso = toISO(d);
    return { iso, dow: DOW[d.getDay()], dom: d.getDate(), today: iso === todayISO };
  });
}
function toISO(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function Screens() {
  const store = useStore();
  const { ready, view, recipes, plan, grocery, getRecipe, navigate } = store;

  if (!ready) {
    return (
      <div className="app-shell flex min-h-[100dvh] items-center justify-center">
        <div className="font-serif text-2xl text-ink/70">Recipe Vault</div>
      </div>
    );
  }

  const withTabs = (node: React.ReactNode) => (
    <div className="app-shell flex min-h-[100dvh] flex-col">
      <div className="flex-1">{node}</div>
      <TabBar />
    </div>
  );

  switch (view.name) {
    case 'gallery':
      return withTabs(<GalleryClient recipes={recipes} />);
    case 'plan':
      return withTabs(<PlannerClient week={currentWeek()} entries={plan} recipes={recipes} />);
    case 'grocery':
      return withTabs(<GroceryClient items={grocery} />);
    case 'settings':
      return <div className="app-shell min-h-[100dvh]"><Settings /></div>;
    case 'new':
      return <div className="app-shell min-h-[100dvh]"><RecipeForm mode="new" /></div>;
    case 'detail': {
      const recipe = view.id ? getRecipe(view.id) : undefined;
      if (!recipe) {
        navigate({ name: 'gallery' });
        return null;
      }
      return <div className="app-shell min-h-[100dvh]"><RecipeDetail recipe={recipe} /></div>;
    }
    case 'edit': {
      const recipe = view.id ? getRecipe(view.id) : undefined;
      if (!recipe) {
        navigate({ name: 'gallery' });
        return null;
      }
      return <div className="app-shell min-h-[100dvh]"><RecipeForm mode="edit" recipe={recipe} /></div>;
    }
    default:
      return withTabs(<GalleryClient recipes={recipes} />);
  }
}

export function AppRoot() {
  return (
    <StoreProvider>
      <PinGate>
        <Screens />
      </PinGate>
    </StoreProvider>
  );
}
