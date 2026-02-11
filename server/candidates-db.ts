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

export async function importCandidates(candidates: Omit<InsertPartnerCandidate, "id" | "createdAt" | "updatedAt">[]) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  if (candidates.length === 0) return { count: 0 };
  for (const candidate of candidates) {
    await db.insert(partnerCandidates).values(candidate);
  }
  return { count: candidates.length };
}
