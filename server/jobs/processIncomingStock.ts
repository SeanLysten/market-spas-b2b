import { processArrivedStock } from "../db";

/**
 * Job périodique pour traiter automatiquement les arrivages de stock
 * Vérifie toutes les heures si des arrivages programmés doivent être transférés vers le stock réel
 */
export async function runIncomingStockJob() {
  try {
    console.info("[IncomingStockJob] Vérification des arrivages programmés...");
    
    const result = await processArrivedStock();
    
    if (result.processed > 0) {
      console.info(`[IncomingStockJob] ✓ ${result.processed} arrivage(s) traité(s) avec succès`);
    } else {
      console.info("[IncomingStockJob] Aucun arrivage à traiter");
    }
    
    return result;
  } catch (error) {
    console.error("[IncomingStockJob] ✗ Erreur lors du traitement des arrivages:", error);
    throw error;
  }
}

/**
 * Démarre le job périodique (toutes les heures)
 */
export function startIncomingStockJob() {
  // Exécuter immédiatement au démarrage
  runIncomingStockJob().catch(console.error);
  
  // Puis toutes les heures (3600000 ms = 1 heure)
  const intervalId = setInterval(() => {
    runIncomingStockJob().catch(console.error);
  }, 3600000);
  
  console.info("[IncomingStockJob] Job périodique démarré (vérification toutes les heures)");
  
  return intervalId;
}
