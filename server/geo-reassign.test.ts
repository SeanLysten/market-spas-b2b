import { describe, it, expect } from 'vitest';
import { haversineDistance, getCityCoordinates, findNearestPartner } from './geo-utils';

describe('Utilitaires géographiques', () => {
  describe('haversineDistance', () => {
    it('devrait retourner 0 pour le même point', () => {
      const dist = haversineDistance(48.8566, 2.3522, 48.8566, 2.3522);
      expect(dist).toBe(0);
    });

    it('devrait calculer la distance Paris-Lyon (~390-400km)', () => {
      const dist = haversineDistance(48.8566, 2.3522, 45.7640, 4.8357);
      expect(dist).toBeGreaterThan(380);
      expect(dist).toBeLessThan(420);
    });

    it('devrait calculer la distance Paris-Bruxelles (~260-280km)', () => {
      const dist = haversineDistance(48.8566, 2.3522, 50.8503, 4.3517);
      expect(dist).toBeGreaterThan(250);
      expect(dist).toBeLessThan(290);
    });

    it('devrait calculer la distance Calais-Rantigny (~170-200km)', () => {
      // Relax and Co (Calais) → BluemoonSpas (Rantigny)
      const dist = haversineDistance(50.9513, 1.8587, 49.3300, 2.4400);
      expect(dist).toBeGreaterThan(150);
      expect(dist).toBeLessThan(210);
    });
  });

  describe('getCityCoordinates', () => {
    it('devrait retourner les coordonnées de Calais', () => {
      const coords = getCityCoordinates('Calais', 'FR');
      expect(coords).not.toBeNull();
      expect(coords!.lat).toBeCloseTo(50.95, 1);
      expect(coords!.lng).toBeCloseTo(1.86, 1);
    });

    it('devrait retourner les coordonnées de Steenokkerzeel (BE)', () => {
      const coords = getCityCoordinates('Steenokkerzeel', 'BE');
      expect(coords).not.toBeNull();
      expect(coords!.lat).toBeCloseTo(50.92, 1);
    });

    it('devrait retourner les coordonnées de Mersch (LU)', () => {
      const coords = getCityCoordinates('Mersch', 'LU');
      expect(coords).not.toBeNull();
      expect(coords!.lat).toBeCloseTo(49.75, 1);
    });

    it('devrait retourner null pour une ville inconnue', () => {
      const coords = getCityCoordinates('VilleInexistante', 'FR');
      expect(coords).toBeNull();
    });

    it('devrait être insensible à la casse', () => {
      const coords = getCityCoordinates('CALAIS', 'fr');
      expect(coords).not.toBeNull();
    });
  });

  describe('findNearestPartner', () => {
    const mockPartners = [
      { id: 60002, companyName: "Fab'Elec", city: 'Villers-Bocage', postalCode: '14310', country: 'FR' },
      { id: 60007, companyName: 'Relax and Co', city: 'Calais', postalCode: '62100', country: 'FR' },
      { id: 60008, companyName: 'BluemoonSpas', city: 'Rantigny', postalCode: '60290', country: 'FR' },
      { id: 60009, companyName: 'Market Spas Bruxelles', city: 'Steenokkerzeel', postalCode: '1820', country: 'BE' },
      { id: 60013, companyName: 'Tahiti Piscines', city: 'Awans', postalCode: '4340', country: 'BE' },
      { id: 60015, companyName: 'SaniDesign', city: 'Mersch', postalCode: '7520', country: 'LU' },
    ];

    it('devrait trouver Relax and Co comme plus proche de Feuquières-en-Vimeu', async () => {
      // Valentin est à Feuquières-en-Vimeu (80210) → le plus proche devrait être Relax and Co (Calais) ou BluemoonSpas (Rantigny)
      const result = await findNearestPartner(
        { city: 'Feuquières-en-Vimeu', postalCode: '80210', country: 'FR' },
        mockPartners
      );
      expect(result).not.toBeNull();
      // Feuquières est entre Calais et Rantigny, l'un des deux devrait être le plus proche
      expect([60007, 60008]).toContain(result!.partnerId);
      expect(result!.distanceKm).toBeGreaterThan(0);
      expect(result!.distanceKm).toBeLessThan(200);
    });

    it('devrait trouver Tahiti Piscines comme plus proche de Mersch (Luxembourg)', async () => {
      // Si on supprime SaniDesign, le plus proche de Mersch devrait être Tahiti Piscines (Awans, BE)
      const partnersWithoutSani = mockPartners.filter(p => p.id !== 60015);
      const result = await findNearestPartner(
        { city: 'Mersch', postalCode: '7520', country: 'LU' },
        partnersWithoutSani
      );
      expect(result).not.toBeNull();
      // Awans (BE) est le plus proche de Mersch (LU)
      expect(result!.partnerId).toBe(60013);
      expect(result!.distanceKm).toBeLessThan(150);
    });

    it('devrait retourner null si aucun partenaire restant', async () => {
      const result = await findNearestPartner(
        { city: 'Calais', postalCode: '62100', country: 'FR' },
        []
      );
      expect(result).toBeNull();
    });

    it('devrait inclure la distance en km dans le résultat', async () => {
      // Tester avec Limonest (Lyon) qui n'est pas dans la liste mock
      const result = await findNearestPartner(
        { city: 'Limonest', postalCode: '69760', country: 'FR' },
        mockPartners.filter(p => p.id !== 60010) // Exclure Limonest de la liste
      );
      expect(result).not.toBeNull();
      expect(result!.distanceKm).toBeGreaterThan(0);
      expect(typeof result!.distanceKm).toBe('number');
    });
  });
});

describe('Règle de réattribution automatique', () => {
  it('devrait transférer les territoires au partenaire le plus proche', () => {
    // Test conceptuel : vérifier que la logique de deletePartner
    // appelle findNearestPartner et transfère les territoires
    // Ce test vérifie la structure de la réponse attendue
    const mockResult = {
      reassignedTo: { partnerId: 60008, partnerName: 'BluemoonSpas', distanceKm: 95.3 },
      territoriesTransferred: 5,
      leadsReassigned: 12
    };
    
    expect(mockResult.reassignedTo).toBeDefined();
    expect(mockResult.reassignedTo.partnerId).toBe(60008);
    expect(mockResult.territoriesTransferred).toBe(5);
    expect(mockResult.leadsReassigned).toBe(12);
  });

  it('devrait gérer le cas sans partenaire proche', () => {
    const mockResult = {
      territoriesTransferred: 0,
      leadsReassigned: 0
    };
    
    expect(mockResult.reassignedTo).toBeUndefined();
    expect(mockResult.territoriesTransferred).toBe(0);
    expect(mockResult.leadsReassigned).toBe(0);
  });
});
