import { describe, it, expect } from "vitest";

/**
 * Tests pour la normalisation Unicode dans le mapping des champs Meta Lead Ads.
 * 
 * Problème identifié : Meta envoie parfois les noms de champs en NFD (forme décomposée)
 * ex: "prénom" = "pre" + accent combinant + "nom" (7 bytes)
 * alors que le code JS utilise NFC (forme composée)
 * ex: "prénom" = "pré" + "nom" (6 bytes)
 * 
 * Sans normalisation, fields["prénom"] (NFC) ne matche pas la clé stockée en NFD.
 */

describe("Unicode NFC normalization for Meta field names", () => {
  // Simuler le parsing des champs Meta
  function parseMetaFields(fieldData: Array<{ name: string; values: string[] }>): Record<string, string> {
    const fields: Record<string, string> = {};
    for (const field of fieldData) {
      fields[field.name.normalize("NFC").toLowerCase()] = field.values[0] || "";
    }
    return fields;
  }

  function mapLeadFields(fields: Record<string, string>) {
    const firstName = fields.first_name || fields.prenom || fields["prénom"] || fields.firstname || "";
    const lastName = fields.last_name || fields.nom || fields.nom_de_famille || fields.lastname || "";
    const email = fields.email || fields["e-mail"] || "";
    const phone = fields.phone_number || fields.phone || fields.telephone || fields["téléphone"] || fields["numéro_de_téléphone"] || "";
    const postalCode = fields.post_code || fields.postal_code || fields.zip || fields.code_postal || fields.postcode || "";
    const productInterest = fields.product_interest || fields.produit || fields.interest || fields["que_recherchez-vous_?"] || fields.votre_projet_concerne || "";
    const budget = fields.budget || fields["budget_envisagé"] || "";
    return { firstName, lastName, email, phone, postalCode, productInterest, budget };
  }

  it("should handle NFC-encoded field names (standard)", () => {
    const fieldData = [
      { name: "prénom", values: ["Jean"] },
      { name: "nom_de_famille", values: ["Dupont"] },
      { name: "e-mail", values: ["jean@test.fr"] },
      { name: "numéro_de_téléphone", values: ["+33612345678"] },
      { name: "code_postal", values: ["75001"] },
    ];
    const fields = parseMetaFields(fieldData);
    const result = mapLeadFields(fields);
    expect(result.firstName).toBe("Jean");
    expect(result.lastName).toBe("Dupont");
    expect(result.email).toBe("jean@test.fr");
    expect(result.phone).toBe("+33612345678");
    expect(result.postalCode).toBe("75001");
  });

  it("should handle NFD-encoded field names (decomposed accents)", () => {
    // NFD: accent is a separate combining character
    const fieldData = [
      { name: "pre\u0301nom", values: ["Marie"] },  // NFD prénom
      { name: "nom_de_famille", values: ["Martin"] },
      { name: "e-mail", values: ["marie@test.fr"] },
      { name: "nume\u0301ro_de_te\u0301le\u0301phone", values: ["+33698765432"] },  // NFD numéro_de_téléphone
      { name: "code_postal", values: ["69001"] },
    ];
    const fields = parseMetaFields(fieldData);
    const result = mapLeadFields(fields);
    expect(result.firstName).toBe("Marie");
    expect(result.lastName).toBe("Martin");
    expect(result.email).toBe("marie@test.fr");
    expect(result.phone).toBe("+33698765432");
    expect(result.postalCode).toBe("69001");
  });

  it("should handle English field names", () => {
    const fieldData = [
      { name: "first_name", values: ["John"] },
      { name: "last_name", values: ["Doe"] },
      { name: "email", values: ["john@test.com"] },
      { name: "phone_number", values: ["+32471234567"] },
      { name: "post_code", values: ["1000"] },
    ];
    const fields = parseMetaFields(fieldData);
    const result = mapLeadFields(fields);
    expect(result.firstName).toBe("John");
    expect(result.lastName).toBe("Doe");
    expect(result.email).toBe("john@test.com");
    expect(result.phone).toBe("+32471234567");
    expect(result.postalCode).toBe("1000");
  });

  it("should handle French form fields with budget and product interest", () => {
    const fieldData = [
      { name: "prénom", values: ["Pierre"] },
      { name: "nom_de_famille", values: ["Durand"] },
      { name: "e-mail", values: ["pierre@test.fr"] },
      { name: "numéro_de_téléphone", values: ["+33612345678"] },
      { name: "code_postal", values: ["33000"] },
      { name: "votre_projet_concerne", values: ["spa_&_jacuzzi"] },
      { name: "budget_envisagé", values: ["10_000€_-_15_000€"] },
    ];
    const fields = parseMetaFields(fieldData);
    const result = mapLeadFields(fields);
    expect(result.firstName).toBe("Pierre");
    expect(result.productInterest).toBe("spa_&_jacuzzi");
    expect(result.budget).toBe("10_000€_-_15_000€");
  });

  it("should handle mixed NFC and NFD in the same payload", () => {
    const fieldData = [
      { name: "pre\u0301nom", values: ["Alice"] },  // NFD
      { name: "nom_de_famille", values: ["Bernard"] },  // ASCII only
      { name: "e-mail", values: ["alice@test.fr"] },  // ASCII only
      { name: "numéro_de_téléphone", values: ["+33612345678"] },  // NFC
      { name: "budget_envisage\u0301", values: ["5_000€"] },  // NFD
    ];
    const fields = parseMetaFields(fieldData);
    const result = mapLeadFields(fields);
    expect(result.firstName).toBe("Alice");
    expect(result.lastName).toBe("Bernard");
    expect(result.email).toBe("alice@test.fr");
    expect(result.phone).toBe("+33612345678");
    expect(result.budget).toBe("5_000€");
  });

  it("should NOT match without normalization (proving the bug)", () => {
    // This test proves that WITHOUT NFC normalization, NFD keys don't match
    const nfdKey = "pre\u0301nom";  // NFD
    const nfcKey = "prénom";  // NFC
    expect(nfdKey).not.toBe(nfcKey);
    expect(nfdKey.length).toBe(7);
    expect(nfcKey.length).toBe(6);
    
    // But after normalization they match
    expect(nfdKey.normalize("NFC")).toBe(nfcKey);
  });
});
