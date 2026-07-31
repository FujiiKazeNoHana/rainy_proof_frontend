"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { loadFavoriteIds, saveFavoriteIds } from "../lib/favorites";
import {
  collectFavoriteableNavItems,
  findNavItemById,
  type SapNavItem,
} from "../lib/nav";

type NavFavoritesContextValue = {
  ready: boolean;
  favoriteIds: string[];
  favorites: SapNavItem[];
  isFavorite: (id: string) => boolean;
  toggleFavorite: (id: string) => void;
  removeFavorite: (id: string) => void;
};

const NavFavoritesContext = createContext<NavFavoritesContextValue | null>(
  null,
);

export function NavFavoritesProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [ready, setReady] = useState(false);
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);

  useEffect(() => {
    const allowed = new Set(
      collectFavoriteableNavItems().map((item) => item.id),
    );
    setFavoriteIds(loadFavoriteIds().filter((id) => allowed.has(id)));
    setReady(true);
  }, []);

  const persist = useCallback((ids: string[]) => {
    setFavoriteIds(ids);
    saveFavoriteIds(ids);
  }, []);

  const isFavorite = useCallback(
    (id: string) => favoriteIds.includes(id),
    [favoriteIds],
  );

  const toggleFavorite = useCallback(
    (id: string) => {
      const item = findNavItemById(id);
      if (!item?.href || item.status === "planned") return;
      persist(
        favoriteIds.includes(id)
          ? favoriteIds.filter((x) => x !== id)
          : [...favoriteIds, id],
      );
    },
    [favoriteIds, persist],
  );

  const removeFavorite = useCallback(
    (id: string) => {
      if (!favoriteIds.includes(id)) return;
      persist(favoriteIds.filter((x) => x !== id));
    },
    [favoriteIds, persist],
  );

  const favorites = useMemo(
    () =>
      favoriteIds
        .map((id) => findNavItemById(id))
        .filter((item): item is SapNavItem => !!item?.href),
    [favoriteIds],
  );

  const value = useMemo<NavFavoritesContextValue>(
    () => ({
      ready,
      favoriteIds,
      favorites,
      isFavorite,
      toggleFavorite,
      removeFavorite,
    }),
    [
      ready,
      favoriteIds,
      favorites,
      isFavorite,
      toggleFavorite,
      removeFavorite,
    ],
  );

  return (
    <NavFavoritesContext.Provider value={value}>
      {children}
    </NavFavoritesContext.Provider>
  );
}

export function useNavFavorites() {
  const ctx = useContext(NavFavoritesContext);
  if (!ctx) {
    throw new Error("useNavFavorites must be used within NavFavoritesProvider");
  }
  return ctx;
}
