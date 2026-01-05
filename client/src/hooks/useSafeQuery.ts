/**
 * Hook personnalisé qui encapsule la logique de protection Array.isArray()
 * pour garantir qu'une requête tRPC retourne toujours un tableau valide.
 * 
 * @param queryResult - Le résultat de trpc.*.useQuery()
 * @param defaultValue - La valeur par défaut si les données sont undefined (par défaut: [])
 * @returns Les données sécurisées (toujours un tableau)
 * 
 * @example
 * ```tsx
 * const { data, isLoading, error, refetch } = trpc.admin.users.list.useQuery();
 * const safeData = useSafeQuery(data);
 * // `safeData` est garanti d'être un tableau, jamais undefined
 * ```
 */
export function useSafeQuery<T>(
  data: T[] | undefined,
  defaultValue: T[] = []
): T[] {
  // Garantir que data est toujours un tableau valide
  return Array.isArray(data) ? data : defaultValue;
}

/**
 * Version alternative pour les requêtes qui retournent un objet unique
 * au lieu d'un tableau.
 * 
 * @param data - Les données de trpc.*.useQuery()
 * @param defaultValue - La valeur par défaut si les données sont undefined
 * @returns Les données sécurisées
 * 
 * @example
 * ```tsx
 * const { data, isLoading } = trpc.admin.stats.summary.useQuery();
 * const safeData = useSafeQueryObject(data, { totalUsers: 0, totalOrders: 0 });
 * ```
 */
export function useSafeQueryObject<T extends object>(
  data: T | undefined,
  defaultValue: T
): T {
  // Garantir que data est toujours un objet valide
  return data ?? defaultValue;
}
