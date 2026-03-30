/**
 * Script de traitement automatique des arrivages de stock
 *
 * Exécuté chaque lundi à 6h00 via Make.com.
 * Appelle processArrivedStock() qui :
 *   1. Calcule le numéro de semaine ISO 8601 courant
 *   2. Trouve tous les arrivages PENDING dont expectedWeek <= semaine actuelle
 *   3. Incrémente stockQuantity dans product_variants ou products
 *   4. Met le statut à ARRIVED avec la date de traitement
 *
 * Usage : npx tsx scripts/process-arrived-stock.ts
 * Requis : DATABASE_URL dans les variables d'environnement
 */

import { processArrivedStock } from "../server/db";
import dotenv from "dotenv";

// Charger les variables d'environnement depuis .env
dotenv.config();

/** Calcule le numéro de semaine ISO 8601 */
function getISOWeekInfo(date: Date): { week: number; year: number } {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const week = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  return { week, year: d.getUTCFullYear() };
}

async function main() {
  const startTime = new Date();
  const { week, year } = getISOWeekInfo(startTime);

  console.log("=".repeat(60));
  console.log("[ProcessArrivedStock] Démarrage du traitement des arrivages");
  console.log(`[ProcessArrivedStock] Date d'exécution : ${startTime.toISOString()}`);
  console.log(`[ProcessArrivedStock] Semaine ISO courante : S${week}/${year}`);
  console.log("=".repeat(60));

  if (!process.env.DATABASE_URL) {
    console.error("[ProcessArrivedStock] ERREUR : DATABASE_URL non définie.");
    process.exit(1);
  }

  try {
    console.log("[ProcessArrivedStock] Connexion à la base de données...");
    const result = await processArrivedStock();
    const durationMs = Date.now() - startTime.getTime();

    console.log("=".repeat(60));
    if (result.processed === 0) {
      console.log("[ProcessArrivedStock] ✓ Aucun arrivage à traiter pour cette semaine.");
    } else {
      console.log(`[ProcessArrivedStock] ✓ ${result.processed} arrivage(s) traité(s) avec succès.`);
      console.log("[ProcessArrivedStock]   → Entrée supprimée de la table incoming_stock");
      console.log("[ProcessArrivedStock]   → Stock incrémenté dans products / product_variants");
    }
    console.log(`[ProcessArrivedStock] Durée d'exécution : ${durationMs}ms`);
    console.log("=".repeat(60));
    process.exit(0);
  } catch (error) {
    const durationMs = Date.now() - startTime.getTime();
    console.error("=".repeat(60));
    console.error("[ProcessArrivedStock] ✗ ERREUR lors du traitement des arrivages :");
    console.error(error);
    console.error(`[ProcessArrivedStock] Durée avant échec : ${durationMs}ms`);
    console.error("=".repeat(60));
    process.exit(1);
  }
}

main();
