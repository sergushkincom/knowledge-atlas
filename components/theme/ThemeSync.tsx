'use client';

import { useEffect, useSyncExternalStore } from 'react';
import { useAtlasStore } from '@/lib/store';

function subscribe(onChange: () => void): () => void {
  if (useAtlasStore.persist.hasHydrated()) {
    return () => undefined;
  }
  return useAtlasStore.persist.onFinishHydration(() => {
    onChange();
  });
}

function hydratedNow(): boolean {
  return useAtlasStore.persist.hasHydrated();
}

export function ThemeSync() {
  const theme = useAtlasStore((state) => state.settings.theme);
  const hydrated = useSyncExternalStore(subscribe, hydratedNow, () => false);

  useEffect(() => {
    if (!hydrated) {
      return;
    }
    document.documentElement.dataset.theme = theme;
  }, [hydrated, theme]);

  return null;
}
