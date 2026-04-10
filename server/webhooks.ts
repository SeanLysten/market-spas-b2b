import { Router } from 'express';
import * as db from './db';
import { notifyAdmins } from './_core/websocket';
import { findBestPartnerForPostalCode } from './territories-db';
import { resolveCountry } from './meta-leads';

export const webhooksRouter = Router();

// Webhook pour les leads Facebook/Instagram depuis Make
webhooksRouter.post('/facebook-leads', async (req, res) => {
  try {
    const {
      email,
      firstName,
      lastName,
      phone,
      city,
      postalCode,
      country,
      message,
      source = 'FACEBOOK',
      campaignId,
      campaignName,
      adId,
      adName,
      productInterest,
      budget,
    } = req.body;

    // Validation minimale
    if (!email) {
      return res.status(400).json({ 
        success: false, 
        error: 'Email is required' 
      });
    }

    // Mapper la source
    const sourceMap: Record<string, any> = {
      FACEBOOK: "META_ADS",
      INSTAGRAM: "META_ADS",
      GOOGLE: "GOOGLE_ADS",
      WEBSITE: "WEBSITE",
      REFERRAL: "REFERRAL",
      OTHER: "OTHER",
    };

    // Créer le lead dans la base de données
    const leadId = await db.createLead({
      firstName: firstName || null,
      lastName: lastName || null,
      email: email,
      phone: phone || null,
      city: city || null,
      postalCode: postalCode || null,
      productInterest: productInterest || null,
      budget: budget || null,
      message: message || null,
      source: sourceMap[source] || 'META_ADS',
      metaCampaignId: campaignId || null,
      metaAdId: adId || null,
    });

    // Assignation automatique au partenaire selon le code postal
    if (postalCode && leadId) {
      try {
        // Résoudre le pays via préfixe téléphonique > champ pays
        const resolvedCountry = resolveCountry(country || '', phone || '');
        const partner = await findBestPartnerForPostalCode(postalCode, resolvedCountry || undefined);
        if (partner) {
          await db.assignLeadToPartner(leadId[0].insertId, partner.partnerId);
          console.log(`[Webhook] Lead ${leadId[0].insertId} auto-assigné au partenaire ${partner.partnerName} (${partner.region}, ${partner.country})`);
        } else {
          console.log(`[Webhook] Aucun partenaire trouvé pour le code postal ${postalCode}`);
        }
      } catch (error) {
        console.error('[Webhook] Erreur lors de l\'assignation automatique:', error);
        // Ne pas bloquer la création du lead si l'assignation échoue
      }
    }

    // Notifier les admins
    try {
      notifyAdmins("NEW_LEAD", {
        title: "Nouveau lead reçu",
        message: `${firstName || ''} ${lastName || ''} (${email})`,
        leadId: leadId,
      });
    } catch (error) {
      console.error('Failed to send notification:', error);
    }

    return res.status(200).json({ 
      success: true, 
      leadId: leadId 
    });

  } catch (error) {
    console.error('Error processing Facebook lead:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Internal server error' 
    });
  }
});

// Webhook pour les statistiques Meta Ads depuis Make
webhooksRouter.post('/meta-ads-stats', async (req, res) => {
  try {
    const {
      campaignId,
      campaignName,
      impressions,
      clicks,
      spend,
      reach,
      cpc,
      cpm,
      ctr,
      conversions,
      costPerConversion,
      date,
    } = req.body;

    // Validation minimale
    if (!campaignId || !campaignName) {
      return res.status(400).json({ 
        success: false, 
        error: 'campaignId and campaignName are required' 
      });
    }

    // Mettre à jour ou créer les stats de campagne
    await db.upsertMetaCampaignStats({
      campaignId,
      campaignName,
      impressions: impressions || 0,
      clicks: clicks || 0,
      spend: spend || 0,
      date: new Date(),
    });
    console.log('Meta Ads stats saved:', { campaignId, campaignName, impressions, clicks, spend });

    return res.status(200).json({ 
      success: true 
    });

  } catch (error) {
    console.error('Error processing Meta Ads stats:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Internal server error' 
    });
  }
});
