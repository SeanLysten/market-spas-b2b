import { eq, desc, sql } from "drizzle-orm";
import { getDb } from "./db";
import {
  partnerCandidates,
  candidateContactHistory,
  type InsertPartnerCandidate,
  type InsertCandidateContactHistory,
} from "../drizzle/schema";

export async function getAllCandidates() {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.select().from(partnerCandidates).orderBy(desc(partnerCandidates.priorityScore));
}

export async function getCandidateById(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.select().from(partnerCandidates).where(eq(partnerCandidates.id, id)).limit(1);
  return result[0] || null;
}

export async function createCandidate(candidate: Omit<InsertPartnerCandidate, "id" | "createdAt" | "updatedAt">) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(partnerCandidates).values(candidate);
  return { id: result[0].insertId, ...candidate };
}

export async function updateCandidate(id: number, updates: Partial<InsertPartnerCandidate>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(partnerCandidates).set(updates).where(eq(partnerCandidates.id, id));
  return await getCandidateById(id);
}

export async function deleteCandidate(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(candidateContactHistory).where(eq(candidateContactHistory.candidateId, id));
  await db.delete(partnerCandidates).where(eq(partnerCandidates.id, id));
}

export async function incrementPhoneCall(candidateId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(partnerCandidates)
    .set({
      phoneCallsCount: sql`${partnerCandidates.phoneCallsCount} + 1`,
      lastContactDate: new Date(),
      lastContact: new Date(),
    })
    .where(eq(partnerCandidates.id, candidateId));
  return await getCandidateById(candidateId);
}

export async function incrementEmail(candidateId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(partnerCandidates)
    .set({
      emailsSentCount: sql`${partnerCandidates.emailsSentCount} + 1`,
      lastContactDate: new Date(),
      lastContact: new Date(),
    })
    .where(eq(partnerCandidates.id, candidateId));
  return await getCandidateById(candidateId);
}

export async function toggleVisited(candidateId: number, visited: boolean) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(partnerCandidates)
    .set({
      visited: visited ? 1 : 0,
      visitDate: visited ? new Date() : null,
    })
    .where(eq(partnerCandidates.id, candidateId));
  return await getCandidateById(candidateId);
}

export async function getContactHistory(candidateId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.select().from(candidateContactHistory)
    .where(eq(candidateContactHistory.candidateId, candidateId))
    .orderBy(desc(candidateContactHistory.date));
}

export async function addContactHistory(entry: Omit<InsertCandidateContactHistory, "id" | "createdAt">) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(candidateContactHistory).values(entry);
}

// ===== DEDUPLICATION =====

/** Normalize string for comparison: lowercase, trim, remove accents */
function normalize(str: string | null | undefined): string {
  if (!str) return "";
  return str.trim().toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/g, "");
}

/** Normalize phone: keep only digits, remove leading country code */
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

export interface DuplicateGroup {
  key: string;
  matchType: "email" | "phone" | "company_city";
  candidates: Array<{
    id: number;
    companyName: string;
    fullName: string;
    city: string;
    phoneNumber: string;
    email: string;
    priorityScore: number;
    status: string;
    source: string | null;
    visited: number;
    phoneCallsCount: number;
    emailsSentCount: number;
    notes: string | null;
    latitude: string | null;
    longitude: string | null;
    showroom: string;
    vendSpa: string;
    autreMarque: string;
    domaineSimilaire: string;
    metaLeadId: number | null;
    createdAt: Date | null;
  }>;
}

/** Detect all duplicate groups among candidates */
export async function detectDuplicates(): Promise<DuplicateGroup[]> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const allCandidates = await db.select().from(partnerCandidates).orderBy(desc(partnerCandidates.priorityScore));
  
  const groups: DuplicateGroup[] = [];
  const usedIds = new Set<number>();
  
  const mapCandidate = (c: typeof allCandidates[0]) => ({
    id: c.id, companyName: c.companyName, fullName: c.fullName, city: c.city,
    phoneNumber: c.phoneNumber, email: c.email, priorityScore: c.priorityScore,
    status: c.status, source: c.source, visited: c.visited,
    phoneCallsCount: c.phoneCallsCount, emailsSentCount: c.emailsSentCount,
    notes: c.notes, latitude: c.latitude, longitude: c.longitude,
    showroom: c.showroom, vendSpa: c.vendSpa, autreMarque: c.autreMarque,
    domaineSimilaire: c.domaineSimilaire, metaLeadId: c.metaLeadId, createdAt: c.createdAt,
  });
  
  // 1. Group by normalized email
  const emailMap = new Map<string, typeof allCandidates>();
  for (const c of allCandidates) {
    const normEmail = normalize(c.email);
    if (!normEmail || normEmail.length < 3 || normEmail.includes("nonfourni")) continue;
    if (!emailMap.has(normEmail)) emailMap.set(normEmail, []);
    emailMap.get(normEmail)!.push(c);
  }
  for (const [email, candidates] of emailMap) {
    if (candidates.length < 2) continue;
    candidates.forEach(c => usedIds.add(c.id));
    groups.push({ key: `email:${email}`, matchType: "email", candidates: candidates.map(mapCandidate) });
  }
  
  // 2. Group by normalized phone (only candidates not already in a group)
  const phoneMap = new Map<string, typeof allCandidates>();
  for (const c of allCandidates) {
    if (usedIds.has(c.id)) continue;
    const normPhone = normalizePhone(c.phoneNumber);
    if (!normPhone || normPhone.length < 6 || normPhone === "0000000000") continue;
    if (!phoneMap.has(normPhone)) phoneMap.set(normPhone, []);
    phoneMap.get(normPhone)!.push(c);
  }
  for (const [phone, candidates] of phoneMap) {
    if (candidates.length < 2) continue;
    candidates.forEach(c => usedIds.add(c.id));
    groups.push({ key: `phone:${phone}`, matchType: "phone", candidates: candidates.map(mapCandidate) });
  }
  
  // 3. Group by company name + city (only candidates not already in a group)
  const companyMap = new Map<string, typeof allCandidates>();
  for (const c of allCandidates) {
    if (usedIds.has(c.id)) continue;
    const normCompany = normalize(c.companyName);
    const normCity = normalize(c.city);
    if (!normCompany || normCompany.length < 3) continue;
    const key = `${normCompany}|${normCity}`;
    if (!companyMap.has(key)) companyMap.set(key, []);
    companyMap.get(key)!.push(c);
  }
  for (const [compCity, candidates] of companyMap) {
    if (candidates.length < 2) continue;
    groups.push({ key: `company:${compCity}`, matchType: "company_city", candidates: candidates.map(mapCandidate) });
  }
  
  return groups;
}

/** Merge duplicates: keep the primary candidate, absorb data from secondary, delete secondary */
export async function mergeCandidates(primaryId: number, secondaryId: number): Promise<{ success: boolean; merged: any }> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const [primary] = await db.select().from(partnerCandidates).where(eq(partnerCandidates.id, primaryId)).limit(1);
  const [secondary] = await db.select().from(partnerCandidates).where(eq(partnerCandidates.id, secondaryId)).limit(1);
  
  if (!primary || !secondary) throw new Error("Candidat introuvable");
  
  const mergedUpdates: Partial<InsertPartnerCandidate> = {};
  
  // Keep highest priority score
  if (secondary.priorityScore > primary.priorityScore) {
    mergedUpdates.priorityScore = secondary.priorityScore;
  }
  
  // Keep "oui" answers for scoring criteria
  if (secondary.showroom === "oui" && primary.showroom !== "oui") mergedUpdates.showroom = "oui";
  if (secondary.vendSpa === "oui" && primary.vendSpa !== "oui") mergedUpdates.vendSpa = "oui";
  if (secondary.autreMarque === "oui" && primary.autreMarque !== "oui") mergedUpdates.autreMarque = "oui";
  if (secondary.domaineSimilaire === "oui" && primary.domaineSimilaire !== "oui") mergedUpdates.domaineSimilaire = "oui";
  
  // Keep better status (valide > en_cours > non_contacte > archive)
  const statusPriority: Record<string, number> = { archive: 0, non_contacte: 1, en_cours: 2, valide: 3 };
  if ((statusPriority[secondary.status] || 0) > (statusPriority[primary.status] || 0)) {
    mergedUpdates.status = secondary.status as any;
  }
  
  // Keep GPS coordinates if primary doesn't have them
  if (!primary.latitude && secondary.latitude) {
    mergedUpdates.latitude = secondary.latitude;
    mergedUpdates.longitude = secondary.longitude;
  }
  
  // Keep visited if either was visited
  if (secondary.visited && !primary.visited) {
    mergedUpdates.visited = 1;
    mergedUpdates.visitDate = secondary.visitDate;
  }
  
  // Sum contact counts
  mergedUpdates.phoneCallsCount = (primary.phoneCallsCount || 0) + (secondary.phoneCallsCount || 0);
  mergedUpdates.emailsSentCount = (primary.emailsSentCount || 0) + (secondary.emailsSentCount || 0);
  
  // Merge notes
  const primaryNotes = primary.notes || "";
  const secondaryNotes = secondary.notes || "";
  if (secondaryNotes && secondaryNotes !== primaryNotes) {
    mergedUpdates.notes = [primaryNotes, `[Fusionné depuis #${secondaryId}] ${secondaryNotes}`].filter(Boolean).join("\n");
  }
  
  // Keep non-empty fields from secondary if primary is empty
  if (!primary.companyName && secondary.companyName) mergedUpdates.companyName = secondary.companyName;
  if (!primary.fullName && secondary.fullName) mergedUpdates.fullName = secondary.fullName;
  if ((!primary.email || primary.email === "non-fourni@marketspas.pro") && secondary.email && secondary.email !== "non-fourni@marketspas.pro") {
    mergedUpdates.email = secondary.email;
  }
  if ((!primary.phoneNumber || primary.phoneNumber === "non-fourni") && secondary.phoneNumber && secondary.phoneNumber !== "non-fourni") {
    mergedUpdates.phoneNumber = secondary.phoneNumber;
  }
  if (!primary.city && secondary.city) mergedUpdates.city = secondary.city;
  
  // Keep lastContactDate (most recent)
  if (secondary.lastContactDate && (!primary.lastContactDate || secondary.lastContactDate > primary.lastContactDate)) {
    mergedUpdates.lastContactDate = secondary.lastContactDate;
    mergedUpdates.lastContact = secondary.lastContactDate;
  }
  
  // Apply merged updates to primary
  if (Object.keys(mergedUpdates).length > 0) {
    await db.update(partnerCandidates).set(mergedUpdates).where(eq(partnerCandidates.id, primaryId));
  }
  
  // Move contact history from secondary to primary
  await db.update(candidateContactHistory)
    .set({ candidateId: primaryId })
    .where(eq(candidateContactHistory.candidateId, secondaryId));
  
  // Add a merge note in contact history
  await db.insert(candidateContactHistory).values({
    candidateId: primaryId,
    type: "note",
    content: `Fusion avec le candidat #${secondaryId} (${secondary.companyName} - ${secondary.fullName})`,
  });
  
  // Delete the secondary candidate
  await db.delete(partnerCandidates).where(eq(partnerCandidates.id, secondaryId));
  
  const merged = await getCandidateById(primaryId);
  return { success: true, merged };
}

/** Auto-merge all detected duplicate groups */
export async function autoMergeAllDuplicates(): Promise<{ groupsMerged: number; candidatesRemoved: number }> {
  const groups = await detectDuplicates();
  let groupsMerged = 0;
  let candidatesRemoved = 0;
  
  for (const group of groups) {
    // Sort: highest score first, most interactions, oldest created
    const sorted = [...group.candidates].sort((a, b) => {
      if (b.priorityScore !== a.priorityScore) return b.priorityScore - a.priorityScore;
      const aInt = (a.phoneCallsCount || 0) + (a.emailsSentCount || 0) + (a.visited || 0);
      const bInt = (b.phoneCallsCount || 0) + (b.emailsSentCount || 0) + (b.visited || 0);
      if (bInt !== aInt) return bInt - aInt;
      return (a.createdAt?.getTime() || 0) - (b.createdAt?.getTime() || 0);
    });
    
    const primaryId = sorted[0].id;
    for (let i = 1; i < sorted.length; i++) {
      await mergeCandidates(primaryId, sorted[i].id);
      candidatesRemoved++;
    }
    groupsMerged++;
  }
  
  return { groupsMerged, candidatesRemoved };
}

export async function importCandidates(candidates: Omit<InsertPartnerCandidate, "id" | "createdAt" | "updatedAt">[]) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  if (candidates.length === 0) return { count: 0 };
  for (const candidate of candidates) {
    await db.insert(partnerCandidates).values(candidate);
  }
  return { count: candidates.length };
}
