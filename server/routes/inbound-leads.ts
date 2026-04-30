/**
 * Routes pour la réception des leads entrants :
 * 1. POST /api/leads/inbound       — Formulaire Shopify (JSON direct)
 * 2. POST /api/webhooks/email-lead — Webhook Resend pour emails entrants
 * 3. GET  /api/leads/inbound/ping  — Vérification de santé
 */
import { Router, Request, Response } from 'express';
import rateLimit from 'express-rate-limit';
import { createLead } from '../db';
import {
  findBestPartnerForLead,
  parseEmailForLead,
  findExistingLead,
  enrichExistingLead,
} from '../lead-routing';
import mysql from 'mysql2/promise';

// ─── Détection pays par code postal ─────────────────────────────────────────

/**
 * Détecte le pays réel à partir du code postal.
 * Surcharge le pays déclaré par le formulaire si incohérent.
 * 
 * Règles :
 * - Belgique : 4 chiffres, 1000-9999
 * - France : 5 chiffres
 * - Luxembourg : 4 chiffres, 1000-9999 (préfixes spécifiques : 1xxx-6xxx)
 * - Suisse : 4 chiffres, 1000-9999 (préfixes : 1xxx-9xxx)
 * 
 * Distinction BE/LU : Les CP luxembourgeois vont de 1000 à 9999 mais sont
 * principalement dans les plages 1000-2999 et 4000-6999.
 * Les CP belges couvrent 1000-9999 aussi.
 * → On utilise le téléphone comme discriminant secondaire.
 */
export function detectCountryFromPostalCode(
  postalCode: string | undefined,
  declaredCountry: string | undefined,
  phone: string | undefined
): { country: string; phonePrefix: string } {
  const cp = (postalCode || '').replace(/\s/g, '').replace(/^[A-Za-z]-?/, '');
  const cleanPhone = (phone || '').replace(/[\s\-\.()]/g, '');
  const declared = (declaredCountry || '').toLowerCase().trim();

  // Défauts
  let detectedCountry = declaredCountry || '';
  let phonePrefix = '';

  // ── Détection par code postal ─────────────────────────────────────────────
  if (/^\d{5}$/.test(cp)) {
    // 5 chiffres → France (ou DOM-TOM)
    detectedCountry = 'France';
    phonePrefix = '+33';
  } else if (/^\d{4}$/.test(cp)) {
    const cpNum = parseInt(cp, 10);
    // 4 chiffres → Belgique, Luxembourg ou Suisse
    // Discrimination par téléphone en priorité
    if (cleanPhone.startsWith('+32') || cleanPhone.startsWith('0032')) {
      detectedCountry = 'Belgium';
      phonePrefix = '+32';
    } else if (cleanPhone.startsWith('+352')) {
      detectedCountry = 'Luxembourg';
      phonePrefix = '+352';
    } else if (cleanPhone.startsWith('+41') || cleanPhone.startsWith('0041')) {
      detectedCountry = 'Switzerland';
      phonePrefix = '+41';
    } else if (cleanPhone.startsWith('+33') || cleanPhone.startsWith('0033')) {
      // Téléphone français mais CP 4 chiffres → probablement une erreur
      // On fait confiance au CP
      detectedCountry = 'Belgium';
      phonePrefix = '+32';
    } else {
      // Pas de préfixe international → analyser le format du numéro local
      if (/^0[4-9]/.test(cleanPhone)) {
        // Numéro belge local (04xx, 047x, 048x, 049x = mobile BE)
        // Numéro français local (06xx, 07xx = mobile FR) mais CP 4 chiffres → BE
        detectedCountry = 'Belgium';
        phonePrefix = '+32';
      } else if (/^[26]\d{5,}$/.test(cleanPhone)) {
        // Luxembourg : commence par 2 ou 6 sans 0
        detectedCountry = 'Luxembourg';
        phonePrefix = '+352';
      } else {
        // Fallback : CP 4 chiffres dans la plage belge
        if (cpNum >= 1000 && cpNum <= 9999) {
          // Heuristique : si le pays déclaré est "Luxembourg" ou "Suisse", on le garde
          if (declared === 'luxembourg') {
            detectedCountry = 'Luxembourg';
            phonePrefix = '+352';
          } else if (declared === 'suisse' || declared === 'switzerland' || declared === 'schweiz') {
            detectedCountry = 'Switzerland';
            phonePrefix = '+41';
          } else {
            // Par défaut, 4 chiffres = Belgique (marché principal)
            detectedCountry = 'Belgium';
            phonePrefix = '+32';
          }
        }
      }
    }
  }

  return { country: detectedCountry, phonePrefix };
}

/**
 * Normalise un numéro de téléphone avec le bon préfixe international.
 * Supprime le +33 incorrect si le pays détecté est la Belgique.
 */
export function normalizePhoneWithCountry(
  phone: string | undefined,
  detectedPrefix: string
): string {
  if (!phone) return '';
  let clean = phone.replace(/[\s\-\.()]/g, '');

  // Si le numéro a déjà un préfixe international correct, le garder
  if (clean.startsWith(detectedPrefix)) return phone;

  // Si le numéro a un mauvais préfixe international, le corriger
  const wrongPrefixes = ['+33', '+32', '+352', '+41', '+49', '+31'];
  for (const wp of wrongPrefixes) {
    if (clean.startsWith(wp) && wp !== detectedPrefix) {
      // Retirer le mauvais préfixe et ajouter le bon
      clean = clean.substring(wp.length);
      // Si le numéro commence par 0, c'est un format local → garder tel quel avec préfixe
      if (clean.startsWith('0')) {
        return `${detectedPrefix} ${clean}`;
      }
      return `${detectedPrefix} ${clean}`;
    }
  }

  // Si le numéro est local (commence par 0), ajouter le préfixe
  if (clean.startsWith('0') && detectedPrefix) {
    // Format : +32 0475222731 → garder le 0 pour la lisibilité locale
    return `${detectedPrefix} ${clean}`;
  }

  // Sinon, retourner tel quel
  return phone;
}

// ─── Déduplication en mémoire (fenêtre temporelle) ──────────────────────────

/**
 * Map en mémoire pour la déduplication des soumissions simultanées.
 * Clé = email|source, Valeur = timestamp de la première soumission.
 * TTL = 30 secondes.
 */
const recentSubmissions = new Map<string, number>();
const DEDUP_WINDOW_MS = 30_000; // 30 secondes

function isDuplicateSubmission(email?: string, phone?: string, source?: string): boolean {
  const now = Date.now();
  // Nettoyer les entrées expirées
  recentSubmissions.forEach((ts, key) => {
    if (now - ts > DEDUP_WINDOW_MS) {
      recentSubmissions.delete(key);
    }
  });

  // Vérifier par email
  if (email) {
    const emailKey = `${email.toLowerCase().trim()}|${source || ''}`;
    if (recentSubmissions.has(emailKey)) {
      return true;
    }
    recentSubmissions.set(emailKey, now);
  }

  // Vérifier par téléphone
  if (phone) {
    const phoneKey = `phone:${phone.replace(/[\s\-\.()]/g, '')}|${source || ''}`;
    if (recentSubmissions.has(phoneKey)) {
      return true;
    }
    recentSubmissions.set(phoneKey, now);
  }

  return false;
}

// ─── Rate Limiting ──────────────────────────────────────────────────────────
// Limite les soumissions de leads à 10 par minute par IP pour éviter le spam
const inboundLeadLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // max 10 requêtes par fenêtre par IP
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Trop de soumissions. Veuillez réessayer dans une minute.' },
});

// Rate limiter plus strict pour le webhook email (5 par minute)
const emailWebhookLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30, // Resend peut envoyer plusieurs webhooks rapidement
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Rate limit exceeded' },
});

// ─── Helpers SAV clients ─────────────────────────────────────────────────────

async function createCustomerSavTicket(params: {
  subject: string;
  message: string;
  fromEmail: string;
  customerName?: string;
  customerPhone?: string;
  priority?: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
}): Promise<number | null> {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) return null;

  let conn: mysql.Connection | null = null;
  try {
    conn = await mysql.createConnection(dbUrl);
    const ticketNumber = `CST-${Date.now().toString(36).toUpperCase()}`;
    const [result] = await conn.execute<mysql.ResultSetHeader>(
      `INSERT INTO customer_sav_tickets
       (ticketNumber, customerEmail, customerName, customerPhone, subject, message, source, category, status, priority, rawEmailFrom, rawEmailSubject)
       VALUES (?, ?, ?, ?, ?, ?, 'EMAIL', 'SAV', 'NEW', ?, ?, ?)`,
      [
        ticketNumber,
        params.fromEmail,
        params.customerName || null,
        params.customerPhone || null,
        params.subject.substring(0, 500),
        params.message?.substring(0, 5000) || null,
        params.priority || 'NORMAL',
        params.fromEmail,
        params.subject.substring(0, 500),
      ]
    );
    console.info(`[CustomerSAV] Ticket créé: ${ticketNumber} (ID: ${result.insertId})`);
    return result.insertId;
  } catch (err) {
    console.error('[CustomerSAV] Error creating ticket:', err);
    return null;
  } finally {
    if (conn) await conn.end();
  }
}

export const inboundLeadsRouter = Router();

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function updateLeadAssignment(leadId: number, reason: string, partnerId: number | null) {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) return;
  let conn: mysql.Connection | null = null;
  try {
    conn = await mysql.createConnection(dbUrl);
    await conn.execute(
      'UPDATE leads SET assignmentReason = ?, assignedPartnerId = ?, assignedAt = ? WHERE id = ?',
      [reason, partnerId, partnerId ? new Date() : null, leadId]
    );
  } catch (err) {
    console.error('[InboundLead] Error updating assignment:', err);
  } finally {
    if (conn) await conn.end();
  }
}

// ─── CORS pour les endpoints publics (Shopify, formulaires externes) ───────────────────────────────────────────────
inboundLeadsRouter.options('/api/leads/inbound', (_req: Request, res: Response) => {
  res.set({
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  }).status(204).send();
});

// ─── 1. Endpoint formulaire Shopify ───────────────────────────────────────────────
inboundLeadsRouter.post('/api/leads/inbound', inboundLeadLimiter, async (req: Request, res: Response) => {
  // CORS headers pour autoriser les requêtes depuis Shopify et autres domaines externes
  res.set({
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  });
  try {
    const {
      firstName,
      lastName,
      email,
      phone,
      postalCode,
      city,
      country,
      productInterest,
      budget,
      message,
      source = 'WEBSITE',
      // Champs supplémentaires envoyés par le formulaire Shopify
      subject,
      projectType,
      metadata,
    } = req.body;

    // Mapper projectType vers productInterest si productInterest n'est pas fourni
    const resolvedProductInterest = productInterest || projectType || null;

    // Validation minimale
    if (!email && !phone && !firstName) {
      return res.status(400).json({ error: 'At least one contact field required (email, phone, or firstName)' });
    }

    // ── Déduplication en mémoire (soumissions simultanées) ────────────────────
    if (isDuplicateSubmission(email, phone, source)) {
      console.info(`[InboundLead] Soumission simultanée bloquée: ${email} (${source})`);
      return res.status(200).json({
        success: true,
        duplicate: true,
        message: 'Duplicate submission blocked (same email/phone within 30s window)',
      });
    }

    // ── Détection et correction du pays par code postal ───────────────────────
    const { country: detectedCountry, phonePrefix } = detectCountryFromPostalCode(postalCode, country, phone);
    const correctedPhone = normalizePhoneWithCountry(phone, phonePrefix);
    const correctedCountry = detectedCountry || country;

    if (correctedCountry !== country) {
      console.info(`[InboundLead] Pays corrigé: "${country}" → "${correctedCountry}" (basé sur CP ${postalCode})`);
    }
    if (correctedPhone !== phone) {
      console.info(`[InboundLead] Téléphone corrigé: "${phone}" → "${correctedPhone}" (préfixe ${phonePrefix})`);
    }

    console.info(`[InboundLead] Nouveau lead Shopify: ${firstName} ${lastName} <${email}> CP:${postalCode} Pays:${correctedCountry} Projet:${resolvedProductInterest || 'N/A'}`);

    // ── Anti-doublon DB (leads existants dans les 60 jours) ───────────────────
    const existingLeadId = await findExistingLead({ email, phone: correctedPhone });
    if (existingLeadId) {
      // Enrichir le lead existant sans le dupliquer
      const enrichMessage = [
        subject ? `Sujet: ${subject}` : '',
        message || '',
        metadata?.shopifyPage ? `Page: ${metadata.shopifyPage}` : '',
      ].filter(Boolean).join('\n');
      await enrichExistingLead(existingLeadId, { postalCode, city, country: correctedCountry, productInterest: resolvedProductInterest, budget, message: enrichMessage || message });
      console.info(`[InboundLead] Doublon détecté → enrichissement du lead #${existingLeadId}`);
      return res.status(200).json({
        success: true,
        duplicate: true,
        existingLeadId,
        message: 'Lead already exists, data enriched',
      });
    }

    // ── Attribution automatique au partenaire ─────────────────────────────────
    const { partnerId, reason } = await findBestPartnerForLead({ postalCode, city, country: correctedCountry, phone: correctedPhone });

    // ── Construire le message enrichi (SANS les coordonnées, seulement le contenu) ──
    const messageParts: string[] = [];
    if (subject) messageParts.push(`Sujet: ${subject}`);
    if (resolvedProductInterest) messageParts.push(`Projet: ${resolvedProductInterest}`);
    if (budget) messageParts.push(`Budget: ${budget}`);
    if (message) {
      messageParts.push('');
      messageParts.push(message);
    }
    if (metadata?.shopifyPage || metadata?.submittedAt) {
      messageParts.push('');
      messageParts.push('--- Informations complémentaires ---');
      if (metadata.shopifyPage) messageParts.push(`Page source: ${metadata.shopifyPage}`);
      if (metadata.submittedAt) messageParts.push(`Soumis le: ${new Date(metadata.submittedAt).toLocaleString('fr-FR')}`);
    }
    const fullMessage = messageParts.join('\n');

    // ── Créer le lead ─────────────────────────────────────────────────────────
    const result = await createLead({
      firstName,
      lastName,
      email,
      phone: correctedPhone,
      postalCode,
      city,
      country: correctedCountry,
      source: source as any,
      productInterest: resolvedProductInterest,
      budget,
      message: fullMessage || message,
      assignedPartnerId: partnerId || undefined,
    });

    if (result.insertId) {
      await updateLeadAssignment(result.insertId, reason, partnerId);
    }

    console.info(`[InboundLead] Lead créé ID:${result.insertId} → Partenaire:${partnerId || 'non assigné'} (${reason})`);

    return res.status(201).json({
      success: true,
      leadId: result.insertId,
      assignedPartnerId: partnerId,
      assignmentReason: reason,
    });
  } catch (error: any) {
    console.error('[InboundLead] Erreur:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// ─── 2. Webhook Resend — emails entrants sur info@marketspas.com ──────────────
inboundLeadsRouter.post('/api/webhooks/email-lead', emailWebhookLimiter, async (req: Request, res: Response) => {
  try {
    const payload = req.body;

    // Format Resend inbound email webhook
    const fromEmail: string = (payload?.from || payload?.sender || '').toLowerCase();
    const subject: string = payload?.subject || '';
    const body: string = payload?.text || payload?.html || payload?.body || '';
    const toEmail: string = (payload?.to || '').toLowerCase();

    console.info(`[EmailLead] Email reçu de: ${fromEmail} → ${toEmail} | Sujet: "${subject}"`);

    // ── Filtres préliminaires ─────────────────────────────────────────────────

    // Ignorer les emails qui ne sont pas destinés à info@marketspas.com
    if (toEmail && !toEmail.includes('info@marketspas.com') && !toEmail.includes('info@marketspas.pro')) {
      return res.status(200).json({ ignored: true, reason: 'not_target_address' });
    }

    // Ignorer les emails internes (de nos propres domaines)
    if (
      fromEmail.includes('@marketspas.com') ||
      fromEmail.includes('@marketspas.pro') ||
      fromEmail.includes('@spas-wellis.com') ||
      fromEmail.includes('noreply') ||
      fromEmail.includes('no-reply') ||
      fromEmail.includes('donotreply') ||
      fromEmail.includes('mailer-daemon') ||
      fromEmail.includes('postmaster')
    ) {
      return res.status(200).json({ ignored: true, reason: 'internal_or_automated_email' });
    }

    // ── Classification intelligente ───────────────────────────────────────────
    const parsed = parseEmailForLead(subject, body, fromEmail);

    if (!parsed.isLead) {
      // Si c'est un SAV client final, créer un ticket dans customer_sav_tickets
      if (parsed.category === 'SAV') {
        const ticketId = await createCustomerSavTicket({
          subject,
          message: `[Email reçu]\nDe: ${fromEmail}\nSujet: ${subject}\n\n${body.substring(0, 5000)}`,
          fromEmail,
          customerName: parsed.firstName && parsed.lastName
            ? `${parsed.firstName} ${parsed.lastName}`.trim()
            : parsed.firstName || undefined,
          customerPhone: parsed.phone,
          priority: 'NORMAL',
        });
        console.info(`[EmailLead] Ticket SAV client créé: #${ticketId} | Sujet: "${subject}"`);
        return res.status(200).json({
          success: true,
          savTicketId: ticketId,
          category: 'SAV',
          message: 'SAV ticket created for end customer',
        });
      }

      console.info(`[EmailLead] Email ignoré — Catégorie: ${parsed.category} (${parsed.confidence}) | Sujet: "${subject}"`);
      return res.status(200).json({
        ignored: true,
        reason: 'not_a_lead',
        category: parsed.category,
        confidence: parsed.confidence,
      });
    }

    console.info(`[EmailLead] Lead détecté — Catégorie: ${parsed.category} (${parsed.confidence}) | De: ${fromEmail}`);

    // ── Anti-doublon ──────────────────────────────────────────────────────────
    const existingLeadId = await findExistingLead({ email: parsed.email, phone: parsed.phone });
    if (existingLeadId) {
      await enrichExistingLead(existingLeadId, {
        postalCode: parsed.postalCode,
        city: parsed.city,
        country: parsed.country,
        productInterest: parsed.productInterest,
        budget: parsed.budget,
        message: `[Email supplémentaire]\nDe: ${fromEmail}\nSujet: ${subject}\n\n${parsed.message}`,
      });
      console.info(`[EmailLead] Doublon détecté → enrichissement du lead #${existingLeadId}`);
      return res.status(200).json({
        success: true,
        duplicate: true,
        existingLeadId,
        category: parsed.category,
      });
    }

    // ── Leads PARTENARIAT → PAS d'assignation partenaire ─────────────────────
    if (parsed.category === 'LEAD_PARTENARIAT') {
      const result = await createLead({
        firstName: parsed.firstName,
        lastName: parsed.lastName,
        email: parsed.email,
        phone: parsed.phone,
        postalCode: parsed.postalCode,
        city: parsed.city,
        country: parsed.country,
        source: 'EMAIL',
        productInterest: `[Demande de partenariat] ${parsed.productInterest || ''}`.trim(),
        budget: parsed.budget,
        message: `[Email reçu]\nDe: ${fromEmail}\nSujet: ${subject}\nCatégorie: LEAD_PARTENARIAT\n\n${parsed.message}`,
        // PAS de assignedPartnerId — les demandes de partenariat vont dans la carte du réseau
      });

      if (result.insertId) {
        await updateLeadAssignment(result.insertId, 'partnership_request_no_assignment', null);
      }

      console.info(`[EmailLead] Lead PARTENARIAT créé ID:${result.insertId} → PAS assigné (carte du réseau)`);

      return res.status(200).json({
        success: true,
        leadId: result.insertId,
        category: 'LEAD_PARTENARIAT',
        confidence: parsed.confidence,
        assignedPartnerId: null,
        assignmentReason: 'partnership_request_no_assignment',
      });
    }

    // ── Leads VENTE → Attribution automatique au partenaire ───────────────────
    const { partnerId, reason } = await findBestPartnerForLead({
      postalCode: parsed.postalCode,
      city: parsed.city,
      country: parsed.country,
      phone: parsed.phone,
    });

    const result = await createLead({
      firstName: parsed.firstName,
      lastName: parsed.lastName,
      email: parsed.email,
      phone: parsed.phone,
      postalCode: parsed.postalCode,
      city: parsed.city,
      country: parsed.country,
      source: 'EMAIL',
      productInterest: parsed.productInterest,
      budget: parsed.budget,
      message: `[Email reçu]\nDe: ${fromEmail}\nSujet: ${subject}\nCatégorie: LEAD_VENTE\n\n${parsed.message}`,
      assignedPartnerId: partnerId || undefined,
    });

    if (result.insertId) {
      await updateLeadAssignment(result.insertId, reason, partnerId);
    }

    console.info(`[EmailLead] Lead VENTE créé ID:${result.insertId} → Partenaire:${partnerId || 'non assigné'} (${reason})`);

    return res.status(200).json({
      success: true,
      leadId: result.insertId,
      category: parsed.category,
      confidence: parsed.confidence,
      assignedPartnerId: partnerId,
      assignmentReason: reason,
    });
  } catch (error: any) {
    console.error('[EmailLead] Erreur:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// ─── 3. Endpoint de test (GET) ────────────────────────────────────────────────
inboundLeadsRouter.get('/api/leads/inbound/ping', (_req: Request, res: Response) => {
  res.json({ status: 'ok', message: 'Inbound leads endpoint is active' });
});
