"use client";

import { useRouter } from "next/navigation";
import { useCallback } from "react";

/**
 * Après une mutation réussie : navigue puis invalide le Client Cache
 * App Router pour recharger les Server Components depuis Supabase.
 *
 * Ne pas utiliser window.location (contournement) : avec un SW qui ne
 * cache plus HTML/RSC, push + refresh est le flux correct.
 */
export function useMutationNavigation() {
  const router = useRouter();

  return useCallback(
    (href: string) => {
      router.push(href);
      router.refresh();
    },
    [router],
  );
}
