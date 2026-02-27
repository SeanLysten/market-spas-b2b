/**
 * Tests pour le module lead-routing et l'endpoint inbound leads
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { parseEmailForLead } from './lead-routing';

// ── Tests parseEmailForLead ───────────────────────────────────────────────────
describe('parseEmailForLead', () => {
  it('détecte un email de demande de devis spa', () => {
    const result = parseEmailForLead(
      'Demande de devis spa',
      'Bonjour, je souhaite un devis pour un spa standard.\nPrénom: Jean\nNom: Dupont\nEmail: jean@test.com\nCode postal: 33500\nVille: Bordeaux\nBudget: 10000€ - 15000€',
      'jean@test.com'
    );
    expect(result.isLeadEmail).toBe(true);
    expect(result.postalCode).toBe('33500');
  });

  it('ignore un email non commercial', () => {
    const result = parseEmailForLead(
      'Facture mensuelle',
      'Veuillez trouver ci-joint votre facture du mois de janvier.',
      'comptabilite@fournisseur.com'
    );
    expect(result.isLeadEmail).toBe(false);
  });

  it('détecte un email de partenariat', () => {
    const result = parseEmailForLead(
      'Demande de partenariat',
      'Bonjour, nous souhaitons devenir revendeur Market Spas dans notre région.',
      'contact@piscines-xyz.fr'
    );
    expect(result.isLeadEmail).toBe(true);
    expect(result.email).toBe('contact@piscines-xyz.fr');
  });

  it('extrait le code postal depuis le corps de l\'email', () => {
    const result = parseEmailForLead(
      'Contact spa',
      'Je suis intéressé par un jacuzzi. Je suis à 69000 Lyon.',
      'client@example.com'
    );
    expect(result.isLeadEmail).toBe(true);
    expect(result.postalCode).toBe('69000');
  });

  it('extrait l\'email depuis le corps si différent de l\'expéditeur', () => {
    const result = parseEmailForLead(
      'Demande de devis',
      'Contact: marie.dupont@gmail.com\nJe veux un spa.',
      'noreply@shopify.com'
    );
    expect(result.isLeadEmail).toBe(true);
    expect(result.email).toBe('marie.dupont@gmail.com');
  });

  it('détecte un email en néerlandais (aanvraag)', () => {
    const result = parseEmailForLead(
      'Offerte aanvraag spa',
      'Ik wil graag een offerte voor een spa. Postcode: 1000 Brussel.',
      'klant@test.be'
    );
    expect(result.isLeadEmail).toBe(true);
    expect(result.postalCode).toBe('1000');
  });
});

// ── Tests normalisation des pays ─────────────────────────────────────────────
describe('normalizeCountry (via parseEmailForLead)', () => {
  it('extrait le pays depuis le corps de l\'email', () => {
    const result = parseEmailForLead(
      'Demande de devis',
      'Pays: France\nCode postal: 75001\nJe cherche un spa.',
      'test@test.fr'
    );
    expect(result.isLeadEmail).toBe(true);
    expect(result.country).toBe('France');
  });
});
