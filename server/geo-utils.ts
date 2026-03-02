/**
 * Utilitaires géographiques pour le calcul de distances entre partenaires.
 * Utilisé pour la réattribution automatique des territoires et leads
 * lorsqu'un partenaire est supprimé.
 */

// Coordonnées pré-calculées des villes des partenaires (pour éviter les appels API)
// Basé sur les adresses réelles des partenaires en base
const CITY_COORDINATES: Record<string, { lat: number; lng: number }> = {
  // Espagne
  'palmones_ES': { lat: 36.1780, lng: -5.4340 },
  // France
  'villers-bocage_FR': { lat: 49.0800, lng: -0.6500 },
  'arveyres_FR': { lat: 44.8700, lng: -0.2900 },
  'pourville sur mer_FR': { lat: 49.9200, lng: 1.0400 },
  'ussac_FR': { lat: 45.1700, lng: 1.5100 },
  'feuquières-en-vimeu_FR': { lat: 50.0600, lng: 1.6100 },
  'calais_FR': { lat: 50.9513, lng: 1.8587 },
  'rantigny_FR': { lat: 49.3300, lng: 2.4400 },
  'limonest_FR': { lat: 45.8400, lng: 4.7700 },
  'sainte-marie-la-blanche_FR': { lat: 46.9700, lng: 4.8400 },
  'estrablin_FR': { lat: 45.5000, lng: 4.9600 },
  'franois_FR': { lat: 47.2300, lng: 5.9700 },
  // Belgique
  'steenokkerzeel_BE': { lat: 50.9200, lng: 4.5100 },
  'awans_BE': { lat: 50.6700, lng: 5.4600 },
  // Luxembourg
  'mersch_LU': { lat: 49.7500, lng: 6.1100 },
};

/**
 * Formule de Haversine pour calculer la distance en km entre deux points GPS.
 */
export function haversineDistance(
  lat1: number, lng1: number,
  lat2: number, lng2: number
): number {
  const R = 6371; // Rayon de la Terre en km
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(deg: number): number {
  return deg * (Math.PI / 180);
}

/**
 * Obtenir les coordonnées d'une ville à partir du cache local.
 * Utilise la clé "ville_pays" normalisée.
 */
export function getCityCoordinates(city: string, country: string): { lat: number; lng: number } | null {
  const key = `${city.toLowerCase().trim()}_${(country || 'FR').toUpperCase()}`;
  return CITY_COORDINATES[key] || null;
}

/**
 * Géocode une adresse via l'API Nominatim (OpenStreetMap).
 * Utilisé en fallback si la ville n'est pas dans le cache.
 */
export async function geocodeAddress(city: string, postalCode: string, country: string): Promise<{ lat: number; lng: number } | null> {
  // D'abord essayer le cache
  const cached = getCityCoordinates(city, country);
  if (cached) return cached;

  // Sinon, appeler Nominatim
  try {
    const query = encodeURIComponent(`${postalCode} ${city}, ${country}`);
    const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${query}&format=json&limit=1`, {
      headers: { 'User-Agent': 'MarketSpas-B2B/1.0' }
    });
    const data = await res.json() as Array<{ lat: string; lon: string }>;
    if (data.length > 0) {
      return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
    }
  } catch (err) {
    console.error(`[GeoUtils] Erreur géocodage ${city} ${postalCode} ${country}:`, err);
  }
  return null;
}

/**
 * Trouve le partenaire le plus proche géographiquement parmi une liste de partenaires.
 * 
 * @param deletedPartner - Les infos du partenaire supprimé (ville, CP, pays)
 * @param remainingPartners - Liste des partenaires restants avec leurs infos géographiques
 * @returns Le partenaire le plus proche avec la distance en km
 */
export async function findNearestPartner(
  deletedPartner: { city: string; postalCode: string; country: string },
  remainingPartners: Array<{ id: number; companyName: string; city: string; postalCode: string; country: string }>
): Promise<{ partnerId: number; partnerName: string; distanceKm: number } | null> {
  
  // Géocoder le partenaire supprimé
  const deletedCoords = await geocodeAddress(
    deletedPartner.city,
    deletedPartner.postalCode,
    deletedPartner.country
  );
  
  if (!deletedCoords) {
    console.error(`[GeoUtils] Impossible de géocoder le partenaire supprimé: ${deletedPartner.city}`);
    return null;
  }

  let nearest: { partnerId: number; partnerName: string; distanceKm: number } | null = null;

  for (const partner of remainingPartners) {
    const coords = await geocodeAddress(partner.city, partner.postalCode, partner.country);
    if (!coords) continue;

    const dist = haversineDistance(deletedCoords.lat, deletedCoords.lng, coords.lat, coords.lng);
    
    if (!nearest || dist < nearest.distanceKm) {
      nearest = {
        partnerId: partner.id,
        partnerName: partner.companyName,
        distanceKm: Math.round(dist * 10) / 10
      };
    }
  }

  return nearest;
}
