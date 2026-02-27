/**
 * Routes pour la réception des leads entrants :
 * 1. POST /api/leads/inbound       — Formulaire Shopify (JSON direct)
 * 2. POST /api/webhooks/email-lead — Webhook Resend pour emails entrants
 */
import { Router, Request, Response } from 'express';
import { createLead } from '../db';
import { findBestPartnerForLead, parseEmailForLead } from '../lead-routing';
import { getDb } from '../db';
import { leads } from '../../drizzle/schema';
import { eq } from 'drizzle-orm';

export const inboundLeadsRouter = Router();

// ─── 1. Endpoint formulaire Shopify ──────────────────────────────────────────
// Le formulaire Shopify envoie un POST JSON à cette URL
// Champs attendus : firstName, lastName, email, phone, postalCode, city, country,
//                  productInterest, budget, message
inboundLeadsRouter.post('/api/leads/inbound', async (req: Request, res: Response) => {
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
    } = req.body;

    // Validation minimale
    if (!email && !phone && !firstName) {
      return res.status(400).json({ error: 'At least one contact field required (email, phone, or firstName)' });
    }

    console.log(`[InboundLead] Nouveau lead Shopify: ${firstName} ${lastName} <${email}> CP:${postalCode} Pays:${country}`);

    // Attribution automatique au partenaire
    const { partnerId, reason } = await findBestPartnerForLead({ postalCode, city, country });

    // Créer le lead
    const result = await createLead({
      firstName,
      lastName,
      email,
      phone,
      postalCode,
      city,
      country,
      source: source as any,
      productInterest,
      budget,
      message,
      assignedPartnerId: partnerId || undefined,
    });

    // Mettre à jour la raison d'attribution si un partenaire a été trouvé
    if (partnerId && result.insertId) {
      const db = await getDb();
      if (db) {
        await db.update(leads)
          .set({ assignmentReason: reason, assignedAt: new Date() })
          .where(eq(leads.id, result.insertId));
      }
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
// Resend envoie un POST quand un email est reçu sur le domaine
// Documentation : https://resend.com/docs/dashboard/emails/inbound
inboundLeadsRouter.post('/api/webhooks/email-lead', async (req: Request, res: Response) => {
  try {
    const payload = req.body;

    // Format Resend inbound email webhook
    const fromEmail: string = payload?.from || payload?.sender || '';
    const subject: string = payload?.subject || '';
    const body: string = payload?.text || payload?.html || payload?.body || '';
    const toEmail: string = payload?.to || '';

    console.log(`[EmailLead] Email reçu de: ${fromEmail} → ${toEmail} | Sujet: ${subject}`);

    // Ignorer les emails qui ne sont pas destinés à info@marketspas.com
    if (toEmail && !toEmail.includes('info@marketspas.com') && !toEmail.includes('france@marketspas.com')) {
      return res.status(200).json({ ignored: true, reason: 'not_target_address' });
    }

    // Ignorer les emails internes (de nos propres domaines)
    if (fromEmail.includes('@marketspas.com') || fromEmail.includes('@marketspas.pro') || fromEmail.includes('@spas-wellis.com')) {
      return res.status(200).json({ ignored: true, reason: 'internal_email' });
    }

    // Parser l'email pour détecter si c'est un lead
    const parsed = parseEmailForLead(subject, body, fromEmail);

    if (!parsed.isLeadEmail) {
      console.log(`[EmailLead] Email ignoré (non-commercial): ${subject}`);
      return res.status(200).json({ ignored: true, reason: 'not_a_lead' });
    }

    // Attribution automatique
    const { partnerId, reason } = await findBestPartnerForLead({
      postalCode: parsed.postalCode,
      city: parsed.city,
      country: parsed.country,
    });

    // Créer le lead
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
      message: `[Email reçu]\nDe: ${fromEmail}\nSujet: ${subject}\n\n${parsed.message}`,
      assignedPartnerId: partnerId || undefined,
    });

    // Mettre à jour la raison d'attribution
    if (result.insertId) {
      const db = await getDb();
      if (db) {
        await db.update(leads)
          .set({
            assignmentReason: reason,
            assignedAt: partnerId ? new Date() : null,
          })
          .where(eq(leads.id, result.insertId));
      }
    }

    console.log(`[EmailLead] Lead créé ID:${result.insertId} → Partenaire:${partnerId || 'non assigné'} (${reason})`);

    return res.status(200).json({
      success: true,
      leadId: result.insertId,
      assignedPartnerId: partnerId,
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
