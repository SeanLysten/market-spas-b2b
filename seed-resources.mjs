import { drizzle } from "drizzle-orm/mysql2";
import { resources } from "./drizzle/schema.ts";

const db = drizzle(process.env.DATABASE_URL);

const testResources = [
  {
    title: "Catalogue Jacuzzis 2025",
    description: "Catalogue complet de notre gamme de jacuzzis pour l'année 2025 avec prix et spécifications techniques",
    category: "CATALOG",
    fileUrl: "https://example.com/catalog-2025.pdf",
    fileType: "application/pdf",
    fileSize: 5242880,
    language: "fr",
    isPublic: false,
    isActive: true,
    requiredPartnerLevel: "BRONZE",
    uploadedById: 1,
    downloadCount: 0,
    viewCount: 0,
  },
  {
    title: "Guide d'installation Spa",
    description: "Instructions détaillées pour l'installation d'un spa extérieur",
    category: "INSTALLATION",
    fileUrl: "https://example.com/installation-guide.pdf",
    fileType: "application/pdf",
    fileSize: 2097152,
    language: "fr",
    isPublic: false,
    isActive: true,
    requiredPartnerLevel: "BRONZE",
    uploadedById: 1,
    downloadCount: 0,
    viewCount: 0,
  },
  {
    title: "Vidéo: Présentation gamme Premium",
    description: "Vidéo de présentation de notre gamme premium de spas et jacuzzis",
    category: "VIDEO_TUTORIAL",
    fileUrl: "https://example.com/video-premium.mp4",
    fileType: "video/mp4",
    fileSize: 52428800,
    language: "fr",
    isPublic: false,
    isActive: true,
    requiredPartnerLevel: "SILVER",
    uploadedById: 1,
    downloadCount: 0,
    viewCount: 0,
  },
  {
    title: "Images marketing HD",
    description: "Pack d'images haute définition pour vos supports marketing",
    category: "MARKETING_IMAGE",
    fileUrl: "https://example.com/marketing-pack.zip",
    fileType: "application/zip",
    fileSize: 104857600,
    language: "fr",
    isPublic: false,
    isActive: true,
    requiredPartnerLevel: "BRONZE",
    uploadedById: 1,
    downloadCount: 0,
    viewCount: 0,
  },
  {
    title: "PLV Promotions Été 2025",
    description: "Supports PLV pour les promotions d'été: affiches, flyers, banderoles",
    category: "PLV",
    fileUrl: "https://example.com/plv-ete-2025.zip",
    fileType: "application/zip",
    fileSize: 31457280,
    language: "fr",
    isPublic: false,
    isActive: true,
    requiredPartnerLevel: "BRONZE",
    uploadedById: 1,
    downloadCount: 0,
    viewCount: 0,
  },
  {
    title: "Guide de vente - Arguments commerciaux",
    description: "Arguments de vente et réponses aux objections courantes",
    category: "SALES_GUIDE",
    fileUrl: "https://example.com/sales-guide.pdf",
    fileType: "application/pdf",
    fileSize: 1572864,
    language: "fr",
    isPublic: false,
    isActive: true,
    requiredPartnerLevel: "BRONZE",
    uploadedById: 1,
    downloadCount: 0,
    viewCount: 0,
  },
];

async function seed() {
  console.log("🌱 Seeding resources...");
  
  for (const resource of testResources) {
    await db.insert(resources).values(resource);
    console.log(`✅ Added: ${resource.title}`);
  }
  
  console.log("✨ Done!");
  process.exit(0);
}

seed().catch((error) => {
  console.error("❌ Error:", error);
  process.exit(1);
});
