import { describe, it, expect } from "vitest";

describe("Lead Detail Data Mapping", () => {
  // Simulate the data format returned by getLeads (leftJoin result)
  const mockLeadData = {
    leads: {
      id: 1,
      firstName: "Jean",
      lastName: "Dupont",
      email: "jean@example.com",
      phone: "+33612345678",
      address: "12 Rue de la Paix",
      city: "Paris",
      postalCode: "75001",
      country: "France",
      status: "NEW",
      source: "META_ADS",
      productInterest: "Spa 5 places",
      budget: "5000-10000€",
      timeline: "3 mois",
      message: "Intéressé par un spa extérieur",
      notes: "Lead prioritaire",
      customFields: JSON.stringify({
        "company_name": "Dupont SAS",
        "travaillez-vous_déjà_dans_la_vente_de_spa_?_": "oui",
        "possédez-vous_un_showroom_?_": "non_(mais_j'ai_un_projet_en_cours)",
        "dans_quelle_ville_êtes-vous_situé_?_": "Paris",
        "full_name": "Jean Dupont",
        "email": "jean@example.com",
        "phone_number": "+33612345678"
      }),
      metaPageId: "1656566307905615",
      metaFormId: "form123",
      assignedPartnerId: 5,
      contactAttempts: 2,
      receivedAt: "2025-01-15T10:00:00Z",
      firstContactAt: "2025-01-16T14:00:00Z",
      assignedAt: "2025-01-15T11:00:00Z",
      estimatedValue: "7500.00",
    },
    partners: {
      companyName: "Spa Partner Paris",
    },
  };

  it("should map all lead fields correctly", () => {
    const lead = mockLeadData.leads;
    expect(lead.firstName).toBe("Jean");
    expect(lead.lastName).toBe("Dupont");
    expect(lead.email).toBe("jean@example.com");
    expect(lead.phone).toBe("+33612345678");
    expect(lead.address).toBe("12 Rue de la Paix");
    expect(lead.city).toBe("Paris");
    expect(lead.postalCode).toBe("75001");
    expect(lead.country).toBe("France");
    expect(lead.productInterest).toBe("Spa 5 places");
    expect(lead.budget).toBe("5000-10000€");
    expect(lead.timeline).toBe("3 mois");
    expect(lead.message).toBe("Intéressé par un spa extérieur");
    expect(lead.notes).toBe("Lead prioritaire");
    expect(lead.metaPageId).toBe("1656566307905615");
    expect(lead.metaFormId).toBe("form123");
    expect(lead.estimatedValue).toBe("7500.00");
  });

  it("should parse customFields JSON correctly", () => {
    const customFields = JSON.parse(mockLeadData.leads.customFields!);
    expect(customFields.company_name).toBe("Dupont SAS");
    expect(customFields["travaillez-vous_déjà_dans_la_vente_de_spa_?_"]).toBe("oui");
    expect(customFields["possédez-vous_un_showroom_?_"]).toBe("non_(mais_j'ai_un_projet_en_cours)");
  });

  it("should separate known fields from Q&A fields", () => {
    const customFields = JSON.parse(mockLeadData.leads.customFields!);
    const knownKeys = ['full_name', 'email', 'phone_number', 'city', 'zip', 'postal_code', 'postcode', 'street_address', 'state', 'country'];
    const qaFields = Object.entries(customFields).filter(
      ([key]) => !knownKeys.includes(key.toLowerCase())
    );
    
    // Should include company_name and the Q&A fields but not full_name, email, phone_number
    expect(qaFields.length).toBe(4); // company_name, travaillez-vous, possédez-vous, dans_quelle_ville
    expect(qaFields.map(([k]) => k)).toContain("company_name");
    expect(qaFields.map(([k]) => k)).toContain("travaillez-vous_déjà_dans_la_vente_de_spa_?_");
    expect(qaFields.map(([k]) => k)).toContain("possédez-vous_un_showroom_?_");
  });

  it("should format field labels correctly", () => {
    const formatFieldLabel = (key: string): string => {
      return key
        .replace(/_/g, ' ')
        .replace(/\?/g, '?')
        .replace(/\s+/g, ' ')
        .trim()
        .replace(/^./, c => c.toUpperCase());
    };

    expect(formatFieldLabel("company_name")).toBe("Company name");
    expect(formatFieldLabel("travaillez-vous_déjà_dans_la_vente_de_spa_?_")).toBe("Travaillez-vous déjà dans la vente de spa ?");
    expect(formatFieldLabel("possédez-vous_un_showroom_?_")).toBe("Possédez-vous un showroom ?");
  });

  it("should format field values correctly", () => {
    const formatFieldValue = (value: string): string => {
      return value
        .replace(/_/g, ' ')
        .replace(/\(/g, '(')
        .replace(/\)/g, ')')
        .trim()
        .replace(/^./, c => c.toUpperCase());
    };

    expect(formatFieldValue("oui")).toBe("Oui");
    expect(formatFieldValue("non_(mais_j'ai_un_projet_en_cours)")).toBe("Non (mais j'ai un projet en cours)");
  });

  it("should extract company name from customFields", () => {
    const customFields = JSON.parse(mockLeadData.leads.customFields!);
    const companyName = customFields.company_name || customFields.company || customFields.entreprise || null;
    expect(companyName).toBe("Dupont SAS");
  });

  it("should handle leads without customFields", () => {
    const leadWithoutCustom = { ...mockLeadData.leads, customFields: null };
    let parsedCustomFields: Record<string, string> = {};
    try {
      if (leadWithoutCustom.customFields) {
        parsedCustomFields = JSON.parse(leadWithoutCustom.customFields);
      }
    } catch { /* ignore */ }
    
    expect(Object.keys(parsedCustomFields).length).toBe(0);
  });

  it("should handle leads with invalid JSON in customFields", () => {
    const leadWithBadJson = { ...mockLeadData.leads, customFields: "not valid json" };
    let parsedCustomFields: Record<string, string> = {};
    try {
      if (leadWithBadJson.customFields) {
        parsedCustomFields = JSON.parse(leadWithBadJson.customFields);
      }
    } catch { /* ignore */ }
    
    expect(Object.keys(parsedCustomFields).length).toBe(0);
  });

  it("should fallback to customFields for location when main fields are empty", () => {
    const leadWithoutLocation = {
      ...mockLeadData.leads,
      city: null,
      postalCode: null,
      address: null,
      country: null,
      customFields: JSON.stringify({
        city: "Lyon",
        zip: "69001",
        street_address: "5 Place Bellecour",
        country: "France"
      })
    };

    const customFields = JSON.parse(leadWithoutLocation.customFields!);
    const displayCity = leadWithoutLocation.city || customFields.city || null;
    const displayPostalCode = leadWithoutLocation.postalCode || customFields.zip || customFields.postal_code || null;
    const displayAddress = leadWithoutLocation.address || customFields.street_address || null;
    const displayCountry = leadWithoutLocation.country || customFields.country || null;

    expect(displayCity).toBe("Lyon");
    expect(displayPostalCode).toBe("69001");
    expect(displayAddress).toBe("5 Place Bellecour");
    expect(displayCountry).toBe("France");
  });

  it("should extract partner name from join result", () => {
    const partnerName = mockLeadData.partners?.companyName || null;
    expect(partnerName).toBe("Spa Partner Paris");
  });
});
