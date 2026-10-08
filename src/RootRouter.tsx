import React, { useState, useEffect } from 'react';
import BengalBetApp from './App';
import NeextPlayApp from './neextplay/App';
import { FavoritesProvider } from './hooks/useFavorites';

export function navigateTo(path: string) {
  if (typeof window !== 'undefined') {
    window.history.pushState(null, '', path);
    window.dispatchEvent(new Event('app-route-change'));
  }
}

export default function RootRouter() {
  const [currentPath, setCurrentPath] = useState<string>(() => {
    return typeof window !== 'undefined' ? window.location.pathname : '/';
  });

  useEffect(() => {
    const handleRouteChange = () => {
      setCurrentPath(window.location.pathname);
    };

    window.addEventListener('popstate', handleRouteChange);
    window.addEventListener('app-route-change', handleRouteChange);

    return () => {
      window.removeEventListener('popstate', handleRouteChange);
      window.removeEventListener('app-route-change', handleRouteChange);
    };
  }, []);

  const isNeextPlay = currentPath.startsWith('/neextplay');

  if (isNeextPlay) {
    return <NeextPlayApp />;
  }

  return (
    <FavoritesProvider>
      <BengalBetApp />
    </FavoritesProvider>
  );
}
