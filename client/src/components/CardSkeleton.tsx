import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

interface CardSkeletonProps {
  /**
   * Afficher l'en-tête de la carte
   * @default true
   */
  showHeader?: boolean;
  /**
   * Nombre de lignes de contenu à afficher
   * @default 3
   */
  lines?: number;
}

/**
 * Skeleton loader pour les cartes
 * Affiche un placeholder élégant pendant le chargement des données
 */
export function CardSkeleton({ showHeader = true, lines = 3 }: CardSkeletonProps) {
  return (
    <Card>
      {showHeader && (
        <CardHeader>
          <Skeleton className="h-6 w-3/4 mb-2" />
          <Skeleton className="h-4 w-1/2" />
        </CardHeader>
      )}
      <CardContent className="space-y-3">
        {Array.from({ length: lines }).map((_, i) => (
          <Skeleton
            key={i}
            className="h-4"
            style={{
              width: `${70 + Math.random() * 30}%`,
            }}
          />
        ))}
      </CardContent>
    </Card>
  );
}

/**
 * Skeleton loader pour une grille de cartes
 */
export function CardGridSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <CardSkeleton key={i} />
      ))}
    </div>
  );
}
