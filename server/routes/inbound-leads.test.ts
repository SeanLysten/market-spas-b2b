import { describe, it, expect } from 'vitest';
import { detectCountryFromPostalCode, normalizePhoneWithCountry } from './inbound-leads';

describe('detectCountryFromPostalCode', () => {
  describe('Code postal 5 chiffres → France', () => {
    it('75001 → France', () => {
      const result = detectCountryFromPostalCode('75001', 'France', '0612345678');
      expect(result.country).toBe('France');
      expect(result.phonePrefix).toBe('+33');
    });

    it('13001 → France même si pays déclaré est Belgique', () => {
      const result = detectCountryFromPostalCode('13001', 'Belgique', '0612345678');
      expect(result.country).toBe('France');
      expect(result.phonePrefix).toBe('+33');
    });

    it('97100 (DOM-TOM) → France', () => {
      const result = detectCountryFromPostalCode('97100', 'France', '');
      expect(result.country).toBe('France');
      expect(result.phonePrefix).toBe('+33');
    });
  });

  describe('Code postal 4 chiffres + téléphone belge → Belgique', () => {
    it('5500 + 0475... → Belgique (corrige France déclaré)', () => {
      const result = detectCountryFromPostalCode('5500', 'France', '0475222731');
      expect(result.country).toBe('Belgium');
      expect(result.phonePrefix).toBe('+32');
    });

    it('1000 + +32... → Belgique', () => {
      const result = detectCountryFromPostalCode('1000', 'Belgique', '+32 470 12 34 56');
      expect(result.country).toBe('Belgium');
      expect(result.phonePrefix).toBe('+32');
    });

    it('4000 + 04xx → Belgique', () => {
      const result = detectCountryFromPostalCode('4000', 'France', '0498123456');
      expect(result.country).toBe('Belgium');
      expect(result.phonePrefix).toBe('+32');
    });

    it('9000 + pas de tel → Belgique par défaut (marché principal)', () => {
      const result = detectCountryFromPostalCode('9000', '', '');
      expect(result.country).toBe('Belgium');
      expect(result.phonePrefix).toBe('+32');
    });
  });

  describe('Code postal 4 chiffres + téléphone luxembourgeois → Luxembourg', () => {
    it('1234 + +352... → Luxembourg', () => {
      const result = detectCountryFromPostalCode('1234', 'Luxembourg', '+352 621 123 456');
      expect(result.country).toBe('Luxembourg');
      expect(result.phonePrefix).toBe('+352');
    });

    it('4000 + 621... (format LU) → Luxembourg', () => {
      const result = detectCountryFromPostalCode('4000', '', '621123456');
      expect(result.country).toBe('Luxembourg');
      expect(result.phonePrefix).toBe('+352');
    });

    it('2000 + pas de tel mais pays déclaré Luxembourg → Luxembourg', () => {
      const result = detectCountryFromPostalCode('2000', 'Luxembourg', '');
      expect(result.country).toBe('Luxembourg');
      expect(result.phonePrefix).toBe('+352');
    });
  });

  describe('Code postal 4 chiffres + téléphone suisse → Suisse', () => {
    it('1200 + +41... → Suisse', () => {
      const result = detectCountryFromPostalCode('1200', 'Suisse', '+41 79 123 45 67');
      expect(result.country).toBe('Switzerland');
      expect(result.phonePrefix).toBe('+41');
    });

    it('8000 + pays déclaré Suisse → Suisse', () => {
      const result = detectCountryFromPostalCode('8000', 'Suisse', '');
      expect(result.country).toBe('Switzerland');
      expect(result.phonePrefix).toBe('+41');
    });
  });

  describe('CP 4 chiffres + tel français → Belgique (confiance au CP)', () => {
    it('5500 + +33... → Belgique (CP gagne sur tel)', () => {
      const result = detectCountryFromPostalCode('5500', 'France', '+33 6 12 34 56 78');
      expect(result.country).toBe('Belgium');
      expect(result.phonePrefix).toBe('+32');
    });
  });

  describe('Pas de code postal → garde le pays déclaré', () => {
    it('pas de CP → retourne le pays déclaré', () => {
      const result = detectCountryFromPostalCode('', 'France', '+33 6 12 34 56 78');
      expect(result.country).toBe('France');
      expect(result.phonePrefix).toBe('');
    });

    it('CP invalide → retourne le pays déclaré', () => {
      const result = detectCountryFromPostalCode('ABC', 'Belgium', '');
      expect(result.country).toBe('Belgium');
      expect(result.phonePrefix).toBe('');
    });
  });
});

describe('normalizePhoneWithCountry', () => {
  it('ajoute +32 à un numéro local belge', () => {
    const result = normalizePhoneWithCountry('0475222731', '+32');
    expect(result).toBe('+32 0475222731');
  });

  it('corrige +33 → +32 pour un numéro belge', () => {
    const result = normalizePhoneWithCountry('+33 0475222731', '+32');
    expect(result).toBe('+32 0475222731');
  });

  it('garde un numéro déjà correct', () => {
    const result = normalizePhoneWithCountry('+32 470 12 34 56', '+32');
    expect(result).toBe('+32 470 12 34 56');
  });

  it('retourne vide si pas de téléphone', () => {
    const result = normalizePhoneWithCountry('', '+32');
    expect(result).toBe('');
  });

  it('retourne vide si undefined', () => {
    const result = normalizePhoneWithCountry(undefined, '+32');
    expect(result).toBe('');
  });

  it('ajoute +33 à un numéro local français', () => {
    const result = normalizePhoneWithCountry('0612345678', '+33');
    expect(result).toBe('+33 0612345678');
  });

  it('ne modifie pas un numéro sans préfixe détecté', () => {
    const result = normalizePhoneWithCountry('0475222731', '');
    expect(result).toBe('0475222731');
  });
});
