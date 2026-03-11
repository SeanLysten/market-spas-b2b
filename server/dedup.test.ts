import { describe, it, expect } from "vitest";

// Test the normalize and normalizePhone functions logic
// We replicate the logic here since they are not exported

function normalize(str: string | null | undefined): string {
  if (!str) return "";
  return str.trim().toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/g, "");
}

function normalizePhone(phone: string | null | undefined): string {
  if (!phone) return "";
  let digits = phone.replace(/[^0-9]/g, "");
  if (digits.startsWith("33") && digits.length > 9) digits = "0" + digits.slice(2);
  if (digits.startsWith("32") && digits.length > 9) digits = "0" + digits.slice(2);
  if (digits.startsWith("352") && digits.length > 9) digits = "0" + digits.slice(3);
  if (digits.startsWith("0032")) digits = "0" + digits.slice(4);
  if (digits.startsWith("0033")) digits = "0" + digits.slice(4);
  return digits;
}

describe("Deduplication - normalize", () => {
  it("should normalize strings by removing accents and special chars", () => {
    expect(normalize("Café du Spa")).toBe("cafeduspa");
    expect(normalize("CAFÉ DU SPA")).toBe("cafeduspa");
    expect(normalize("  Éric Müller  ")).toBe("ericmuller");
    expect(normalize(null)).toBe("");
    expect(normalize(undefined)).toBe("");
    expect(normalize("")).toBe("");
  });

  it("should treat accented and non-accented versions as equal", () => {
    expect(normalize("Réseau Spas")).toBe(normalize("Reseau Spas"));
    expect(normalize("François")).toBe(normalize("Francois"));
    expect(normalize("Hôtel & Spa")).toBe(normalize("Hotel  Spa"));
  });

  it("should handle email normalization", () => {
    expect(normalize("John@Example.COM")).toBe("johnexamplecom");
    expect(normalize("john@example.com")).toBe("johnexamplecom");
  });
});

describe("Deduplication - normalizePhone", () => {
  it("should strip non-digit characters", () => {
    expect(normalizePhone("+33 6 12 34 56 78")).toBe("0612345678");
    expect(normalizePhone("06.12.34.56.78")).toBe("0612345678");
    expect(normalizePhone("06-12-34-56-78")).toBe("0612345678");
  });

  it("should handle French country code +33", () => {
    expect(normalizePhone("+33612345678")).toBe("0612345678");
    expect(normalizePhone("0033612345678")).toBe("0612345678");
  });

  it("should handle Belgian country code +32", () => {
    expect(normalizePhone("+32475123456")).toBe("0475123456");
    expect(normalizePhone("0032475123456")).toBe("0475123456");
  });

  it("should handle Luxembourg country code +352", () => {
    expect(normalizePhone("+352621123456")).toBe("0621123456");
  });

  it("should handle local numbers without country code", () => {
    expect(normalizePhone("0612345678")).toBe("0612345678");
    expect(normalizePhone("0475123456")).toBe("0475123456");
  });

  it("should handle null/undefined/empty", () => {
    expect(normalizePhone(null)).toBe("");
    expect(normalizePhone(undefined)).toBe("");
    expect(normalizePhone("")).toBe("");
  });

  it("should detect same phone with different formats", () => {
    const phone1 = normalizePhone("+33 6 12 34 56 78");
    const phone2 = normalizePhone("06.12.34.56.78");
    const phone3 = normalizePhone("0033612345678");
    expect(phone1).toBe(phone2);
    expect(phone2).toBe(phone3);
  });
});

describe("Deduplication - duplicate detection logic", () => {
  it("should detect email duplicates", () => {
    const candidates = [
      { id: 1, email: "john@spa.com", phoneNumber: "0612345678", companyName: "Spa A", city: "Paris" },
      { id: 2, email: "JOHN@SPA.COM", phoneNumber: "0698765432", companyName: "Spa B", city: "Lyon" },
    ];

    const emailMap = new Map<string, typeof candidates>();
    for (const c of candidates) {
      const normEmail = normalize(c.email);
      if (!normEmail || normEmail.length < 3) continue;
      if (!emailMap.has(normEmail)) emailMap.set(normEmail, []);
      emailMap.get(normEmail)!.push(c);
    }

    const duplicateEmails = [...emailMap.values()].filter(g => g.length >= 2);
    expect(duplicateEmails.length).toBe(1);
    expect(duplicateEmails[0].length).toBe(2);
  });

  it("should detect phone duplicates", () => {
    const candidates = [
      { id: 1, email: "a@test.com", phoneNumber: "+33 6 12 34 56 78", companyName: "Spa A", city: "Paris" },
      { id: 2, email: "b@test.com", phoneNumber: "06.12.34.56.78", companyName: "Spa B", city: "Lyon" },
    ];

    const phoneMap = new Map<string, typeof candidates>();
    for (const c of candidates) {
      const normPhone = normalizePhone(c.phoneNumber);
      if (!normPhone || normPhone.length < 6) continue;
      if (!phoneMap.has(normPhone)) phoneMap.set(normPhone, []);
      phoneMap.get(normPhone)!.push(c);
    }

    const duplicatePhones = [...phoneMap.values()].filter(g => g.length >= 2);
    expect(duplicatePhones.length).toBe(1);
    expect(duplicatePhones[0].length).toBe(2);
  });

  it("should detect company+city duplicates", () => {
    const candidates = [
      { id: 1, email: "a@test.com", phoneNumber: "0611111111", companyName: "Spa Détente", city: "Bruxelles" },
      { id: 2, email: "b@test.com", phoneNumber: "0622222222", companyName: "spa detente", city: "bruxelles" },
    ];

    const companyMap = new Map<string, typeof candidates>();
    for (const c of candidates) {
      const normCompany = normalize(c.companyName);
      const normCity = normalize(c.city);
      if (!normCompany || normCompany.length < 3) continue;
      const key = `${normCompany}|${normCity}`;
      if (!companyMap.has(key)) companyMap.set(key, []);
      companyMap.get(key)!.push(c);
    }

    const duplicateCompanies = [...companyMap.values()].filter(g => g.length >= 2);
    expect(duplicateCompanies.length).toBe(1);
    expect(duplicateCompanies[0].length).toBe(2);
  });

  it("should not detect false positives for different companies in same city", () => {
    const candidates = [
      { id: 1, email: "a@test.com", phoneNumber: "0611111111", companyName: "Spa Détente", city: "Paris" },
      { id: 2, email: "b@test.com", phoneNumber: "0622222222", companyName: "Spa Luxe", city: "Paris" },
    ];

    const companyMap = new Map<string, typeof candidates>();
    for (const c of candidates) {
      const normCompany = normalize(c.companyName);
      const normCity = normalize(c.city);
      if (!normCompany || normCompany.length < 3) continue;
      const key = `${normCompany}|${normCity}`;
      if (!companyMap.has(key)) companyMap.set(key, []);
      companyMap.get(key)!.push(c);
    }

    const duplicateCompanies = [...companyMap.values()].filter(g => g.length >= 2);
    expect(duplicateCompanies.length).toBe(0);
  });

  it("should skip non-fourni emails", () => {
    const candidates = [
      { id: 1, email: "non-fourni@marketspas.pro", phoneNumber: "0611111111", companyName: "Spa A", city: "Paris" },
      { id: 2, email: "non-fourni@marketspas.pro", phoneNumber: "0622222222", companyName: "Spa B", city: "Lyon" },
    ];

    const emailMap = new Map<string, typeof candidates>();
    for (const c of candidates) {
      const normEmail = normalize(c.email);
      if (!normEmail || normEmail.length < 3 || normEmail.includes("nonfourni")) continue;
      if (!emailMap.has(normEmail)) emailMap.set(normEmail, []);
      emailMap.get(normEmail)!.push(c);
    }

    const duplicateEmails = [...emailMap.values()].filter(g => g.length >= 2);
    expect(duplicateEmails.length).toBe(0);
  });
});

describe("Deduplication - merge strategy", () => {
  it("should keep highest priority score", () => {
    const primary = { priorityScore: 3 };
    const secondary = { priorityScore: 6 };
    const merged: any = {};
    if (secondary.priorityScore > primary.priorityScore) {
      merged.priorityScore = secondary.priorityScore;
    }
    expect(merged.priorityScore).toBe(6);
  });

  it("should keep 'oui' answers for scoring criteria", () => {
    const primary = { showroom: "non", vendSpa: "oui", autreMarque: "non", domaineSimilaire: "non" };
    const secondary = { showroom: "oui", vendSpa: "non", autreMarque: "oui", domaineSimilaire: "non" };
    const merged: any = {};
    if (secondary.showroom === "oui" && primary.showroom !== "oui") merged.showroom = "oui";
    if (secondary.vendSpa === "oui" && primary.vendSpa !== "oui") merged.vendSpa = "oui";
    if (secondary.autreMarque === "oui" && primary.autreMarque !== "oui") merged.autreMarque = "oui";
    if (secondary.domaineSimilaire === "oui" && primary.domaineSimilaire !== "oui") merged.domaineSimilaire = "oui";
    expect(merged.showroom).toBe("oui");
    expect(merged.vendSpa).toBeUndefined(); // primary already has oui
    expect(merged.autreMarque).toBe("oui");
    expect(merged.domaineSimilaire).toBeUndefined(); // neither has oui
  });

  it("should keep better status", () => {
    const statusPriority: Record<string, number> = { archive: 0, non_contacte: 1, en_cours: 2, valide: 3 };
    
    // en_cours > non_contacte
    const primary1 = { status: "non_contacte" };
    const secondary1 = { status: "en_cours" };
    let merged1: any = {};
    if ((statusPriority[secondary1.status] || 0) > (statusPriority[primary1.status] || 0)) {
      merged1.status = secondary1.status;
    }
    expect(merged1.status).toBe("en_cours");

    // valide > en_cours
    const primary2 = { status: "en_cours" };
    const secondary2 = { status: "valide" };
    let merged2: any = {};
    if ((statusPriority[secondary2.status] || 0) > (statusPriority[primary2.status] || 0)) {
      merged2.status = secondary2.status;
    }
    expect(merged2.status).toBe("valide");
  });

  it("should sum contact counts", () => {
    const primary = { phoneCallsCount: 3, emailsSentCount: 2 };
    const secondary = { phoneCallsCount: 1, emailsSentCount: 5 };
    const merged = {
      phoneCallsCount: (primary.phoneCallsCount || 0) + (secondary.phoneCallsCount || 0),
      emailsSentCount: (primary.emailsSentCount || 0) + (secondary.emailsSentCount || 0),
    };
    expect(merged.phoneCallsCount).toBe(4);
    expect(merged.emailsSentCount).toBe(7);
  });
});
