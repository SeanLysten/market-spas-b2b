/**
 * Routes pour la réception des leads entrants :
 * 1. POST /api/leads/inbound       — Formulaire Shopify (JSON direct)
 * 2. POST /api/webhooks/email-lead — Webhook Resend pour emails entrants
 * 3. GET  /api/leads/inbound/ping  — Vérification de santé
 */
import { Router, Request, Response } from 'express';
import { createLead } from '../db';
import {
  findBestPartnerForLead,
  parseEmailForLead,
  findExistingLead,
  enrichExistingLead,
} from '../lead-routing';
import mysql from 'mysql2/promise';

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
    console.log(`[CustomerSAV] Ticket créé: ${ticketNumber} (ID: ${result.insertId})`);
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
inboundLeadsRouter.post('/api/leads/inbound', async (req: Request, res: Response) => {
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

    console.log(`[InboundLead] Nouveau lead Shopify: ${firstName} ${lastName} <${email}> CP:${postalCode} Pays:${country} Projet:${resolvedProductInterest || 'N/A'}`);

    // ── Anti-doublon ──────────────────────────────────────────────────────────
    const existingLeadId = await findExistingLead({ email, phone });
    if (existingLeadId) {
      // Enrichir le lead existant sans le dupliquer
      const enrichMessage = [
        subject ? `Sujet: ${subject}` : '',
        message || '',
        metadata?.shopifyPage ? `Page: ${metadata.shopifyPage}` : '',
      ].filter(Boolean).join('\n');
      await enrichExistingLead(existingLeadId, { postalCode, city, country, productInterest: resolvedProductInterest, budget, message: enrichMessage || message });
      console.log(`[InboundLead] Doublon détecté → enrichissement du lead #${existingLeadId}`);
      return res.status(200).json({
        success: true,
        duplicate: true,
        existingLeadId,
        message: 'Lead already exists, data enriched',
      });
    }

    // ── Attribution automatique au partenaire ─────────────────────────────────
    const { partnerId, reason } = await findBestPartnerForLead({ postalCode, city, country, phone });

    // ── Construire le message enrichi avec les données Shopify ──────────────
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
      phone,
      postalCode,
      city,
      country,
      source: source as any,
      productInterest: resolvedProductInterest,
      budget,
      message: fullMessage || message,
      assignedPartnerId: partnerId || undefined,
    });

    if (result.insertId) {
      await updateLeadAssignment(result.insertId, reason, partnerId);
    }

    console.log(`[InboundLead] Lead créé ID:${result.insertId} → Partenaire:${partnerId || 'non assigné'} (${reason})`);

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
inboundLeadsRouter.post('/api/webhooks/email-lead', async (req: Request, res: Response) => {
  try {
    const payload = req.body;

    // Format Resend inbound email webhook
    const fromEmail: string = (payload?.from || payload?.sender || '').toLowerCase();
    const subject: string = payload?.subject || '';
    const body: string = payload?.text || payload?.html || payload?.body || '';
    const toEmail: string = (payload?.to || '').toLowerCase();

    console.log(`[EmailLead] Email reçu de: ${fromEmail} → ${toEmail} | Sujet: "${subject}"`);

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
        console.log(`[EmailLead] Ticket SAV client créé: #${ticketId} | Sujet: "${subject}"`);
        return res.status(200).json({
          success: true,
          savTicketId: ticketId,
          category: 'SAV',
          message: 'SAV ticket created for end customer',
        });
      }

      console.log(`[EmailLead] Email ignoré — Catégorie: ${parsed.category} (${parsed.confidence}) | Sujet: "${subject}"`);
      return res.status(200).json({
        ignored: true,
        reason: 'not_a_lead',
        category: parsed.category,
        confidence: parsed.confidence,
      });
    }

    console.log(`[EmailLead] Lead détecté — Catégorie: ${parsed.category} (${parsed.confidence}) | De: ${fromEmail}`);

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
      console.log(`[EmailLead] Doublon détecté → enrichissement du lead #${existingLeadId}`);
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

      console.log(`[EmailLead] Lead PARTENARIAT créé ID:${result.insertId} → PAS assigné (carte du réseau)`);

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

    console.log(`[EmailLead] Lead VENTE créé ID:${result.insertId} → Partenaire:${partnerId || 'non assigné'} (${reason})`);

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
