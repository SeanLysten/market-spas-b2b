/**
 * Tests pour le module lead-routing :
 * - Classification des emails (LEAD_VENTE, LEAD_PARTENARIAT, SAV, SPAM, UNKNOWN)
 * - Parsing des données de contact
 * - Logique anti-doublon (parseEmailForLead)
 */
import { describe, it, expect } from 'vitest';
import { classifyEmail, parseEmailForLead } from './lead-routing';

// ─── Tests classifyEmail ──────────────────────────────────────────────────────

describe('classifyEmail', () => {
  it('classifie un email de demande de devis spa comme LEAD_VENTE', () => {
    const result = classifyEmail(
      'Demande de devis spa',
      'Bonjour, je souhaite un devis pour un spa standard 6 places. Merci.',
      'client@gmail.com'
    );
    expect(result.category).toBe('LEAD_VENTE');
    expect(result.productType).toBe('VENTE');
  });

  it('classifie un email de partenariat comme LEAD_PARTENARIAT', () => {
    const result = classifyEmail(
      'Demande de partenariat revendeur',
      'Bonjour, nous souhaitons devenir revendeur Market Spas dans notre région.',
      'contact@piscines-xyz.fr'
    );
    expect(result.category).toBe('LEAD_PARTENARIAT');
    expect(result.productType).toBe('PARTENARIAT');
  });

  it('classifie un email SAV comme SAV', () => {
    const result = classifyEmail(
      'Problème avec mon spa - panne chauffage',
      'Bonjour, mon spa est en panne depuis 3 jours, le chauffage ne fonctionne plus. Garantie ?',
      'client@orange.fr'
    );
    expect(result.category).toBe('SAV');
  });

  it('classifie un email de démarchage SEO comme SPAM', () => {
    const result = classifyEmail(
      'Améliorez votre référencement Google',
      'Bonjour, notre agence de référencement SEO peut améliorer votre visibilité sur Google. Audit gratuit.',
      'contact@agence-seo.fr'
    );
    expect(result.category).toBe('SPAM');
  });

  it('classifie un email de création de site comme SPAM', () => {
    const result = classifyEmail(
      'Refonte de votre site web',
      'Bonjour, nous proposons la création de site web et développement web pour votre entreprise.',
      'dev@agence.com'
    );
    expect(result.category).toBe('SPAM');
  });

  it('classifie une facture comme SPAM', () => {
    const result = classifyEmail(
      'Facture n°2024-001',
      'Veuillez trouver ci-joint votre facture du mois de janvier 2024.',
      'comptabilite@fournisseur.com'
    );
    expect(result.category).toBe('SPAM');
  });

  it('classifie un email de candidature comme SPAM', () => {
    const result = classifyEmail(
      'Candidature spontanée',
      'Bonjour, je vous adresse ma candidature pour un poste dans votre entreprise. CV en pièce jointe.',
      'candidat@gmail.com'
    );
    expect(result.category).toBe('SPAM');
  });

  it('classifie un email d\'intérêt pour jacuzzi comme LEAD_VENTE', () => {
    const result = classifyEmail(
      'Information jacuzzi',
      'Bonjour, je suis intéressé par un jacuzzi pour ma terrasse. Quels sont vos tarifs ?',
      'prospect@hotmail.fr'
    );
    expect(result.category).toBe('LEAD_VENTE');
  });

  it('classifie un email en néerlandais (offerte spa) comme LEAD_VENTE', () => {
    const result = classifyEmail(
      'Offerte aanvraag spa',
      'Goedendag, ik wil graag een offerte voor een spa. Wat zijn de prijzen?',
      'klant@telenet.be'
    );
    expect(result.category).toBe('LEAD_VENTE');
  });

  it('classifie un email SAV avec garantie comme SAV même avec le mot spa', () => {
    const result = classifyEmail(
      'Mon spa est défectueux',
      'Bonjour, mon spa acheté il y a 6 mois est défectueux. La garantie couvre-t-elle ce problème ?',
      'client@free.fr'
    );
    expect(result.category).toBe('SAV');
  });

  it('classifie un email inconnu comme UNKNOWN', () => {
    const result = classifyEmail(
      'Bonjour',
      'Bonjour, comment allez-vous ?',
      'quelquun@gmail.com'
    );
    expect(result.category).toBe('UNKNOWN');
  });
});

// ─── Tests parseEmailForLead ──────────────────────────────────────────────────

describe('parseEmailForLead', () => {
  it('retourne isLead=true pour un email de devis spa', () => {
    const result = parseEmailForLead(
      'Demande de devis spa',
      'Je souhaite un devis pour un spa standard.\nCode postal: 33500\nVille: Bordeaux',
      'jean@test.com'
    );
    expect(result.isLead).toBe(true);
    expect(result.category).toBe('LEAD_VENTE');
    expect(result.postalCode).toBe('33500');
  });

  it('retourne isLead=false pour un email SAV', () => {
    const result = parseEmailForLead(
      'Panne sur mon spa',
      'Mon spa est en panne, la pompe ne fonctionne plus. Garantie ?',
      'client@gmail.com'
    );
    expect(result.isLead).toBe(false);
    expect(result.category).toBe('SAV');
  });

  it('retourne isLead=false pour un email de démarchage', () => {
    const result = parseEmailForLead(
      'Création de site web',
      'Notre agence propose la création de site web et référencement SEO.',
      'agence@web.fr'
    );
    expect(result.isLead).toBe(false);
    expect(result.category).toBe('SPAM');
  });

  it('extrait le code postal depuis le corps de l\'email', () => {
    const result = parseEmailForLead(
      'Intérêt pour un spa',
      'Je suis intéressé par un jacuzzi. Je suis situé à 69000 Lyon.',
      'client@example.com'
    );
    expect(result.isLead).toBe(true);
    expect(result.postalCode).toBe('69000');
  });

  it('utilise l\'email de l\'expéditeur comme email du lead', () => {
    const result = parseEmailForLead(
      'Demande de devis spa',
      'Contact: marie.dupont@gmail.com\nJe veux un spa standard.',
      'noreply@shopify.com'
    );
    expect(result.isLead).toBe(true);
    expect(result.email).toBe('marie.dupont@gmail.com'); // parseEmailForLead extrait l'email du corps si trouvé
  });

  it('marque un email de partenariat comme LEAD_PARTENARIAT', () => {
    const result = parseEmailForLead(
      'Demande de partenariat',
      'Bonjour, nous souhaitons devenir revendeur Market Spas.',
      'contact@piscines.fr'
    );
    expect(result.isLead).toBe(true);
    expect(result.category).toBe('LEAD_PARTENARIAT');
    expect(result.productType).toBe('PARTENARIAT');
  });

  it('extrait le code postal belge (4 chiffres)', () => {
    const result = parseEmailForLead(
      'Offerte aanvraag spa',
      'Ik wil graag een offerte voor een spa. Postcode: 1000 Brussel.',
      'klant@test.be'
    );
    expect(result.isLead).toBe(true);
    expect(result.postalCode).toBe('1000');
  });

  it('extrait le numéro de téléphone français', () => {
    const result = parseEmailForLead(
      'Demande de devis jacuzzi',
      'Bonjour, je souhaite un devis.\nTéléphone: 06 12 34 56 78\nCode postal: 75001',
      'client@gmail.com'
    );
    expect(result.isLead).toBe(true);
    expect(result.phone).toBeTruthy();
  });
});

// ─── Tests de cohérence architecture (coherence-guard 2026-04-10) ─────────────

describe('Lead Routing — Cohérence architecture', () => {
  it('lead-routing.ts exporte findBestPartnerForLead', async () => {
    const module = await import('./lead-routing');
    expect(typeof module.findBestPartnerForLead).toBe('function');
  });

  it('meta-leads.ts exporte distributeLeadToPartner', async () => {
    const module = await import('./meta-leads');
    expect(typeof module.distributeLeadToPartner).toBe('function');
  });

  it('meta-leads.ts exporte resolveCountry', async () => {
    const module = await import('./meta-leads');
    expect(typeof module.resolveCountry).toBe('function');
  });

  it('territories-db.ts exporte findBestPartnerForPostalCode', async () => {
    const module = await import('./territories-db');
    expect(typeof module.findBestPartnerForPostalCode).toBe('function');
  });
});

describe('Lead Routing — resolveCountry', () => {
  it('résout la France via préfixe téléphonique +33', async () => {
    const { resolveCountry } = await import('./meta-leads');
    expect(resolveCountry('', '+33 6 12 34 56 78')).toBe('France');
  });

  it('résout la Belgique via préfixe téléphonique +32', async () => {
    const { resolveCountry } = await import('./meta-leads');
    expect(resolveCountry('', '+32 4 123 45 67')).toBe('Belgium');
  });

  it('résout le Luxembourg via préfixe téléphonique +352', async () => {
    const { resolveCountry } = await import('./meta-leads');
    expect(resolveCountry('', '+352 621 123 456')).toBe('Luxembourg');
  });

  it('résout la France via le champ formulaire', async () => {
    const { resolveCountry } = await import('./meta-leads');
    expect(resolveCountry('FR', '')).toBe('France');
    expect(resolveCountry('france', '')).toBe('France');
  });

  it('résout la Belgique via le champ formulaire', async () => {
    const { resolveCountry } = await import('./meta-leads');
    expect(resolveCountry('BE', '')).toBe('Belgium');
    expect(resolveCountry('belgique', '')).toBe('Belgium');
  });

  it('retourne vide si aucune info disponible', async () => {
    const { resolveCountry } = await import('./meta-leads');
    expect(resolveCountry('', '')).toBe('');
  });
});

describe('Lead Routing — Pas de fallback hardcodé', () => {
  it('lead-routing.ts ne contient pas de fallback hardcodé vers Les Valentins (ID 60006)', async () => {
    const fs = await import('fs');
    const content = fs.readFileSync('./server/lead-routing.ts', 'utf-8');
    expect(content).not.toContain('60006');
    expect(content).not.toContain('DEFAULT_FALLBACK_PARTNER_ID');
  });

  it('meta-leads.ts distributeLeadToPartner ne contient pas de fallback hardcodé', async () => {
    const fs = await import('fs');
    const content = fs.readFileSync('./server/meta-leads.ts', 'utf-8');
    expect(content).not.toContain('60006');
    expect(content).not.toContain('DEFAULT_FALLBACK_PARTNER_ID');
  });

  it('lead-routing.ts utilise findBestPartnerForPostalCode de territories-db', async () => {
    const fs = await import('fs');
    const content = fs.readFileSync('./server/lead-routing.ts', 'utf-8');
    expect(content).toContain("import { findBestPartnerForPostalCode } from './territories-db'");
  });

  it('meta-leads.ts utilise findBestPartnerForPostalCode de territories-db', async () => {
    const fs = await import('fs');
    const content = fs.readFileSync('./server/meta-leads.ts', 'utf-8');
    expect(content).toContain("import { findBestPartnerForPostalCode } from \"./territories-db\"");
  });
});
