'use client';

import { useStore, type ViewName } from '@/lib/store';
import { HomeIcon, CalendarIcon, CartIcon } from './icons';

const TABS: { view: ViewName; label: string; Icon: typeof HomeIcon }[] = [
  { view: 'gallery', label: 'Recipes', Icon: HomeIcon },
  { view: 'plan', label: 'Plan', Icon: CalendarIcon },
  { view: 'grocery', label: 'Grocery', Icon: CartIcon },
];

export function TabBar() {
  const { view, navigate } = useStore();
  return (
    <nav className="sticky bottom-0 z-40 mx-auto flex w-full max-w-[480px] justify-around border-t border-line bg-[rgba(21,17,14,0.92)] px-6 pt-3 backdrop-blur-lg pb-[calc(env(safe-area-inset-bottom,0px)+12px)]">
      {TABS.map(({ view: v, label, Icon }) => {
        const active = view.name === v;
        return (
          <button
            key={v}
            type="button"
            onClick={() => navigate({ name: v })}
            className={`flex flex-col items-center gap-1 ${active ? 'text-green' : 'text-muted'}`}
          >
            <Icon size={22} />
            <span className={`text-[10.5px] ${active ? 'font-bold' : 'font-medium'}`}>{label}</span>
          </button>
        );
      })}
    </nav>
  );
}
