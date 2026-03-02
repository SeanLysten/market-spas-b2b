import { processArrivedStock } from "../server/db";
import dotenv from "dotenv";

dotenv.config();

async function main() {
  console.log("Démarrage du traitement des arrivages de stock...");
  try {
    const result = await processArrivedStock();
    console.log(`Traitement terminé. ${result.processed} arrivage(s) traité(s).`);
    process.exit(0);
  } catch (error) {
    console.error("Une erreur est survenue lors du traitement des arrivages de stock:", error);
    process.exit(1);
  }
}

main();
