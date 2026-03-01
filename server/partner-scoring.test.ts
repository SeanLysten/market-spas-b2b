import { describe, it, expect } from 'vitest';
import { calculatePartnerScore, isPartnerLead } from './meta-leads';

describe('Partner Lead Scoring System', () => {
  describe('calculatePartnerScore', () => {
    it('should return minimum score of 1 for empty fields', () => {
      const result = calculatePartnerScore({});
      expect(result.score).toBe(1);
      expect(result.showroom).toBe('non');
      expect(result.vendSpa).toBe('non');
      expect(result.autreMarque).toBe('non');
      expect(result.domaineSimilaire).toBe('non');
    });

    it('should add +2 for showroom', () => {
      const result = calculatePartnerScore({
        "possédez-vous_un_showroom_?_": "oui",
      });
      expect(result.score).toBe(3); // 1 base + 2 showroom
      expect(result.showroom).toBe('oui');
    });

    it('should add +3 for vendSpa (most important criterion)', () => {
      const result = calculatePartnerScore({
        "travaillez-vous_déjà_dans_la_vente_de_spa_?_": "oui",
      });
      expect(result.score).toBe(4); // 1 base + 3 vendSpa
      expect(result.vendSpa).toBe('oui');
    });

    it('should add +1 for autreMarque', () => {
      const result = calculatePartnerScore({
        "vendez-vous_actuellement_une_autre_marque_?": "oui",
      });
      expect(result.score).toBe(2); // 1 base + 1 autreMarque
      expect(result.autreMarque).toBe('oui');
    });

    it('should add +1 for domaineSimilaire', () => {
      const result = calculatePartnerScore({
        "travaillez-vous_dans_un_domaine_similaire_?_": "oui",
      });
      expect(result.score).toBe(2); // 1 base + 1 domaineSimilaire
      expect(result.domaineSimilaire).toBe('oui');
    });

    it('should return max score of 8 with all criteria', () => {
      const result = calculatePartnerScore({
        "possédez-vous_un_showroom_?_": "oui",
        "travaillez-vous_déjà_dans_la_vente_de_spa_?_": "oui",
        "vendez-vous_actuellement_une_autre_marque_?": "oui",
        "travaillez-vous_dans_un_domaine_similaire_?_": "oui",
      });
      expect(result.score).toBe(8); // 1 + 2 + 3 + 1 + 1 = 8
    });

    it('should never exceed 8', () => {
      const result = calculatePartnerScore({
        "possédez-vous_un_showroom_?_": "oui",
        "travaillez-vous_déjà_dans_la_vente_de_spa_?_": "oui",
        "vendez-vous_actuellement_une_autre_marque_?": "oui",
        "travaillez-vous_dans_un_domaine_similaire_?_": "oui",
      });
      expect(result.score).toBeLessThanOrEqual(8);
    });

    it('should handle "oui" variants (e.g., "oui_(piscine_ou_mobilier_de_jardin)")', () => {
      const result = calculatePartnerScore({
        "travaillez-vous_dans_un_domaine_similaire_?_": "oui_(piscine_ou_mobilier_de_jardin)",
      });
      expect(result.domaineSimilaire).toBe('oui');
      expect(result.score).toBe(2); // 1 base + 1
    });

    it('should handle "non" responses correctly', () => {
      const result = calculatePartnerScore({
        "possédez-vous_un_showroom_?_": "non",
        "travaillez-vous_déjà_dans_la_vente_de_spa_?_": "non",
        "vendez-vous_actuellement_une_autre_marque_?": "non",
        "travaillez-vous_dans_un_domaine_similaire_?_": "non",
      });
      expect(result.score).toBe(1); // Only base score
    });

    it('should calculate correct score for typical partner (showroom + vendSpa)', () => {
      const result = calculatePartnerScore({
        "possédez-vous_un_showroom_?_": "oui",
        "travaillez-vous_déjà_dans_la_vente_de_spa_?_": "oui",
        "vendez-vous_actuellement_une_autre_marque_?": "non",
        "travaillez-vous_dans_un_domaine_similaire_?_": "non",
      });
      expect(result.score).toBe(6); // 1 + 2 + 3 = 6
    });
  });

  describe('isPartnerLead', () => {
    it('should detect partner lead with company_name field', () => {
      expect(isPartnerLead({ company_name: 'Test Company' })).toBe(true);
    });

    it('should detect partner lead with showroom field', () => {
      expect(isPartnerLead({ "possédez-vous_un_showroom_?_": "oui" })).toBe(true);
    });

    it('should detect partner lead with vendSpa field', () => {
      expect(isPartnerLead({ "travaillez-vous_déjà_dans_la_vente_de_spa_?_": "oui" })).toBe(true);
    });

    it('should detect partner lead with autreMarque field', () => {
      expect(isPartnerLead({ "vendez-vous_actuellement_une_autre_marque_?": "non" })).toBe(true);
    });

    it('should detect partner lead with domaineSimilaire field', () => {
      expect(isPartnerLead({ "travaillez-vous_dans_un_domaine_similaire_?_": "non" })).toBe(true);
    });

    it('should NOT detect regular sales lead', () => {
      expect(isPartnerLead({
        full_name: 'John Doe',
        email: 'john@test.com',
        phone_number: '0600000000',
        city: 'Paris',
      })).toBe(false);
    });

    it('should be case-insensitive for field keys', () => {
      expect(isPartnerLead({ COMPANY_NAME: 'Test' })).toBe(true);
    });
  });

  describe('Scoring Distribution', () => {
    it('should produce scores from 1 to 8', () => {
      const scenarios = [
        { fields: {}, expectedScore: 1 },
        { fields: { "vendez-vous_actuellement_une_autre_marque_?": "oui" }, expectedScore: 2 },
        { fields: { "possédez-vous_un_showroom_?_": "oui" }, expectedScore: 3 },
        { fields: { "travaillez-vous_déjà_dans_la_vente_de_spa_?_": "oui" }, expectedScore: 4 },
        { fields: { "travaillez-vous_déjà_dans_la_vente_de_spa_?_": "oui", "vendez-vous_actuellement_une_autre_marque_?": "oui" }, expectedScore: 5 },
        { fields: { "possédez-vous_un_showroom_?_": "oui", "travaillez-vous_déjà_dans_la_vente_de_spa_?_": "oui" }, expectedScore: 6 },
        { fields: { "possédez-vous_un_showroom_?_": "oui", "travaillez-vous_déjà_dans_la_vente_de_spa_?_": "oui", "vendez-vous_actuellement_une_autre_marque_?": "oui" }, expectedScore: 7 },
        { fields: { "possédez-vous_un_showroom_?_": "oui", "travaillez-vous_déjà_dans_la_vente_de_spa_?_": "oui", "vendez-vous_actuellement_une_autre_marque_?": "oui", "travaillez-vous_dans_un_domaine_similaire_?_": "oui" }, expectedScore: 8 },
      ];

      for (const { fields, expectedScore } of scenarios) {
        const result = calculatePartnerScore(fields);
        expect(result.score).toBe(expectedScore);
      }
    });
  });
});
