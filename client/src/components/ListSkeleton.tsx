import { Skeleton } from "@/components/ui/skeleton";

interface ListSkeletonProps {
  /**
   * Nombre d'éléments à afficher
   * @default 5
   */
  items?: number;
  /**
   * Afficher un avatar/icône à gauche
   * @default false
   */
  showAvatar?: boolean;
  /**
   * Afficher une action à droite
   * @default false
   */
  showAction?: boolean;
}

/**
 * Skeleton loader pour les listes
 * Affiche un placeholder élégant pendant le chargement des données
 */
export function ListSkeleton({
  items = 5,
  showAvatar = false,
  showAction = false,
}: ListSkeletonProps) {
  return (
    <div className="space-y-3">
      {Array.from({ length: items }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 p-3 rounded-lg border">
          {showAvatar && <Skeleton className="h-10 w-10 rounded-full flex-shrink-0" />}
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
          {showAction && <Skeleton className="h-8 w-20 flex-shrink-0" />}
        </div>
      ))}
    </div>
  );
}
