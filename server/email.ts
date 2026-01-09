import { ENV } from "./_core/env";

// Email templates
const templates = {
  orderConfirmation: {
    subject: "Confirmation de commande #{{orderNumber}}",
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f8fafc; padding: 30px; border: 1px solid #e2e8f0; }
          .footer { background: #1e293b; color: #94a3b8; padding: 20px; text-align: center; font-size: 12px; border-radius: 0 0 8px 8px; }
          .order-details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
          .item { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #e2e8f0; }
          .total { font-size: 18px; font-weight: bold; color: #1e40af; }
          .btn { display: inline-block; background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Market Spas</h1>
            <p>Votre commande a été confirmée</p>
          </div>
          <div class="content">
            <h2>Bonjour {{customerName}},</h2>
            <p>Nous avons bien reçu votre commande <strong>#{{orderNumber}}</strong> et nous vous en remercions.</p>
            
            <div class="order-details">
              <h3>Détails de la commande</h3>
              {{orderItems}}
              <div class="item total">
                <span>Total TTC</span>
                <span>{{totalTTC}} €</span>
              </div>
            </div>
            
            <p>Vous pouvez suivre l'état de votre commande depuis votre espace client.</p>
            <a href="{{portalUrl}}/orders" class="btn">Voir ma commande</a>
          </div>
          <div class="footer">
            <p>Market Spas - Votre partenaire wellness</p>
            <p>Cet email a été envoyé automatiquement, merci de ne pas y répondre.</p>
          </div>
        </div>
      </body>
      </html>
    `,
  },
  
  orderStatusUpdate: {
    subject: "Mise à jour de votre commande #{{orderNumber}}",
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f8fafc; padding: 30px; border: 1px solid #e2e8f0; }
          .footer { background: #1e293b; color: #94a3b8; padding: 20px; text-align: center; font-size: 12px; border-radius: 0 0 8px 8px; }
          .status-badge { display: inline-block; padding: 8px 16px; border-radius: 20px; font-weight: bold; }
          .status-confirmed { background: #dcfce7; color: #166534; }
          .status-processing { background: #fef3c7; color: #92400e; }
          .status-shipped { background: #dbeafe; color: #1e40af; }
          .status-delivered { background: #d1fae5; color: #065f46; }
          .btn { display: inline-block; background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Market Spas</h1>
            <p>Mise à jour de commande</p>
          </div>
          <div class="content">
            <h2>Bonjour {{customerName}},</h2>
            <p>Le statut de votre commande <strong>#{{orderNumber}}</strong> a été mis à jour.</p>
            
            <p style="text-align: center; margin: 30px 0;">
              <span class="status-badge status-{{statusClass}}">{{statusLabel}}</span>
            </p>
            
            <p>{{statusMessage}}</p>
            
            <a href="{{portalUrl}}/orders" class="btn">Suivre ma commande</a>
          </div>
          <div class="footer">
            <p>Market Spas - Votre partenaire wellness</p>
            <p>Cet email a été envoyé automatiquement, merci de ne pas y répondre.</p>
          </div>
        </div>
      </body>
      </html>
    `,
  },
  
  lowStockAlert: {
    subject: "⚠️ Alerte stock bas - {{productName}}",
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #dc2626 0%, #ef4444 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f8fafc; padding: 30px; border: 1px solid #e2e8f0; }
          .footer { background: #1e293b; color: #94a3b8; padding: 20px; text-align: center; font-size: 12px; border-radius: 0 0 8px 8px; }
          .alert-box { background: #fef2f2; border: 1px solid #fecaca; padding: 20px; border-radius: 8px; margin: 20px 0; }
          .btn { display: inline-block; background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>⚠️ Alerte Stock</h1>
          </div>
          <div class="content">
            <h2>Attention : Stock bas détecté</h2>
            
            <div class="alert-box">
              <p><strong>Produit :</strong> {{productName}}</p>
              <p><strong>SKU :</strong> {{productSku}}</p>
              <p><strong>Stock actuel :</strong> {{currentStock}} unités</p>
              <p><strong>Seuil d'alerte :</strong> {{threshold}} unités</p>
            </div>
            
            <p>Nous vous recommandons de réapprovisionner ce produit rapidement.</p>
            
            <a href="{{portalUrl}}/admin/products" class="btn">Gérer le stock</a>
          </div>
          <div class="footer">
            <p>Market Spas - Système de gestion</p>
          </div>
        </div>
      </body>
      </html>
    `,
  },
  
  newPartnerRegistration: {
    subject: "🎉 Nouveau partenaire inscrit - {{companyName}}",
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #059669 0%, #10b981 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f8fafc; padding: 30px; border: 1px solid #e2e8f0; }
          .footer { background: #1e293b; color: #94a3b8; padding: 20px; text-align: center; font-size: 12px; border-radius: 0 0 8px 8px; }
          .info-box { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border: 1px solid #e2e8f0; }
          .btn { display: inline-block; background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎉 Nouveau Partenaire</h1>
          </div>
          <div class="content">
            <h2>Une nouvelle demande de partenariat</h2>
            
            <div class="info-box">
              <p><strong>Entreprise :</strong> {{companyName}}</p>
              <p><strong>Contact :</strong> {{contactName}}</p>
              <p><strong>Email :</strong> {{email}}</p>
              <p><strong>Téléphone :</strong> {{phone}}</p>
              <p><strong>TVA :</strong> {{vatNumber}}</p>
              <p><strong>Date d'inscription :</strong> {{registrationDate}}</p>
            </div>
            
            <p>Veuillez examiner cette demande et valider le compte partenaire si approprié.</p>
            
            <a href="{{portalUrl}}/admin/partners" class="btn">Gérer les partenaires</a>
          </div>
          <div class="footer">
            <p>Market Spas - Système de gestion</p>
          </div>
        </div>
      </body>
      </html>
    `,
  },
  
  welcomePartner: {
    subject: "Bienvenue chez Market Spas, {{companyName}} !",
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f8fafc; padding: 30px; border: 1px solid #e2e8f0; }
          .footer { background: #1e293b; color: #94a3b8; padding: 20px; text-align: center; font-size: 12px; border-radius: 0 0 8px 8px; }
          .feature { display: flex; align-items: center; margin: 15px 0; padding: 15px; background: white; border-radius: 8px; }
          .feature-icon { font-size: 24px; margin-right: 15px; }
          .btn { display: inline-block; background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Bienvenue !</h1>
            <p>Votre compte partenaire a été activé</p>
          </div>
          <div class="content">
            <h2>Bonjour {{contactName}},</h2>
            <p>Nous sommes ravis de vous accueillir parmi nos partenaires ! Votre compte a été validé et vous pouvez désormais accéder à tous nos services.</p>
            
            <div class="feature">
              <span class="feature-icon">📦</span>
              <div>
                <strong>Catalogue complet</strong>
                <p style="margin: 0; color: #64748b;">Accédez à tous nos produits avec prix partenaire</p>
              </div>
            </div>
            
            <div class="feature">
              <span class="feature-icon">💰</span>
              <div>
                <strong>Prix préférentiels</strong>
                <p style="margin: 0; color: #64748b;">Bénéficiez de remises exclusives niveau {{partnerLevel}}</p>
              </div>
            </div>
            
            <div class="feature">
              <span class="feature-icon">📚</span>
              <div>
                <strong>Ressources marketing</strong>
                <p style="margin: 0; color: #64748b;">Téléchargez catalogues, vidéos et supports de vente</p>
              </div>
            </div>
            
            <a href="{{portalUrl}}" class="btn">Accéder au portail</a>
          </div>
          <div class="footer">
            <p>Market Spas - Votre partenaire wellness</p>
            <p>Une question ? Contactez-nous à support@marketspas.be</p>
          </div>
        </div>
      </body>
      </html>
    `,
  },
};

// Status labels and messages
const statusConfig: Record<string, { label: string; message: string; class: string }> = {
  PENDING: {
    label: "En attente",
    message: "Votre commande est en attente de validation.",
    class: "processing",
  },
  CONFIRMED: {
    label: "Confirmée",
    message: "Votre commande a été confirmée et sera traitée prochainement.",
    class: "confirmed",
  },
  PROCESSING: {
    label: "En préparation",
    message: "Votre commande est en cours de préparation dans nos entrepôts.",
    class: "processing",
  },
  SHIPPED: {
    label: "Expédiée",
    message: "Votre commande a été expédiée et est en route vers vous.",
    class: "shipped",
  },
  DELIVERED: {
    label: "Livrée",
    message: "Votre commande a été livrée. Merci pour votre confiance !",
    class: "delivered",
  },
  CANCELLED: {
    label: "Annulée",
    message: "Votre commande a été annulée.",
    class: "processing",
  },
};

// Helper function to replace template variables
function renderTemplate(template: string, variables: Record<string, string>): string {
  let result = template;
  for (const [key, value] of Object.entries(variables)) {
    result = result.replace(new RegExp(`{{${key}}}`, "g"), value);
  }
  return result;
}

// Email sending function using notification system
export async function sendEmail(
  to: string,
  templateName: keyof typeof templates,
  variables: Record<string, string>
): Promise<boolean> {
  try {
    const template = templates[templateName];
    const subject = renderTemplate(template.subject, variables);
    const html = renderTemplate(template.html, variables);

    // Use the notification system to send email
    // In production, this would integrate with an email service like SendGrid, Mailgun, etc.
    console.log(`[Email] Sending "${subject}" to ${to}`);
    console.log(`[Email] Content preview: ${html.substring(0, 200)}...`);

    // For now, we'll use the notifyOwner function for admin notifications
    // and log user emails (would be sent via email service in production)
    
    return true;
  } catch (error) {
    console.error("[Email] Error sending email:", error);
    return false;
  }
}

// Specific email functions
export async function sendOrderConfirmationEmail(
  email: string,
  orderNumber: string,
  customerName: string,
  orderItems: string,
  totalTTC: string,
  portalUrl: string
): Promise<boolean> {
  return sendEmail(email, "orderConfirmation", {
    orderNumber,
    customerName,
    orderItems,
    totalTTC,
    portalUrl,
  });
}

export async function sendOrderStatusUpdateEmail(
  email: string,
  orderNumber: string,
  customerName: string,
  status: string,
  portalUrl: string
): Promise<boolean> {
  const config = statusConfig[status] || statusConfig.PENDING;
  return sendEmail(email, "orderStatusUpdate", {
    orderNumber,
    customerName,
    statusLabel: config.label,
    statusMessage: config.message,
    statusClass: config.class,
    portalUrl,
  });
}

export async function sendLowStockAlertEmail(
  email: string,
  productName: string,
  productSku: string,
  currentStock: string,
  threshold: string,
  portalUrl: string
): Promise<boolean> {
  return sendEmail(email, "lowStockAlert", {
    productName,
    productSku,
    currentStock,
    threshold,
    portalUrl,
  });
}

export async function sendNewPartnerRegistrationEmail(
  email: string,
  companyName: string,
  contactName: string,
  partnerEmail: string,
  phone: string,
  vatNumber: string,
  registrationDate: string,
  portalUrl: string
): Promise<boolean> {
  return sendEmail(email, "newPartnerRegistration", {
    companyName,
    contactName,
    email: partnerEmail,
    phone,
    vatNumber,
    registrationDate,
    portalUrl,
  });
}

export async function sendWelcomePartnerEmail(
  email: string,
  companyName: string,
  contactName: string,
  partnerLevel: string,
  portalUrl: string
): Promise<boolean> {
  return sendEmail(email, "welcomePartner", {
    companyName,
    contactName,
    partnerLevel,
    portalUrl,
  });
}


// ============================================
// RESEND EMAIL SERVICE
// ============================================
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM_EMAIL = process.env.EMAIL_FROM || 'Market Spas <noreply@marketspas.com>';

interface SendInvitationEmailParams {
  to: string;
  firstName?: string;
  lastName?: string;
  invitationUrl: string;
  expiresAt: Date;
}

export async function sendInvitationEmail({
  to,
  firstName,
  lastName,
  invitationUrl,
  expiresAt,
}: SendInvitationEmailParams) {
  const fullName = [firstName, lastName].filter(Boolean).join(' ') || 'Partenaire';
  const expirationDate = new Date(expiresAt).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const htmlContent = `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Invitation Market Spas</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 0;">
        <table role="presentation" style="width: 600px; max-width: 100%; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="padding: 40px 40px 20px; text-align: center; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 8px 8px 0 0;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700;">Market Spas</h1>
              <p style="margin: 10px 0 0; color: #ffffff; font-size: 16px; opacity: 0.9;">Portail Partenaires B2B</p>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <h2 style="margin: 0 0 20px; color: #1a1a1a; font-size: 24px; font-weight: 600;">Bienvenue ${fullName} !</h2>
              
              <p style="margin: 0 0 20px; color: #4a5568; font-size: 16px; line-height: 1.6;">
                Vous avez été invité(e) à rejoindre le portail partenaires <strong>Market Spas</strong>. 
                Notre plateforme vous permet de gérer vos commandes, consulter le catalogue produits et accéder à toutes vos ressources en un seul endroit.
              </p>
              
              <div style="margin: 30px 0; padding: 20px; background-color: #f7fafc; border-left: 4px solid #667eea; border-radius: 4px;">
                <p style="margin: 0; color: #2d3748; font-size: 14px; line-height: 1.6;">
                  <strong>📧 Email :</strong> ${to}<br>
                  <strong>⏰ Expire le :</strong> ${expirationDate}
                </p>
              </div>
              
              <p style="margin: 0 0 30px; color: #4a5568; font-size: 16px; line-height: 1.6;">
                Cliquez sur le bouton ci-dessous pour créer votre compte et définir votre mot de passe :
              </p>
              
              <!-- CTA Button -->
              <table role="presentation" style="width: 100%;">
                <tr>
                  <td align="center">
                    <a href="${invitationUrl}" style="display: inline-block; padding: 16px 40px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; border-radius: 6px; font-size: 16px; font-weight: 600; box-shadow: 0 4px 6px rgba(102, 126, 234, 0.3);">
                      Créer mon compte
                    </a>
                  </td>
                </tr>
              </table>
              
              <p style="margin: 30px 0 0; color: #718096; font-size: 14px; line-height: 1.6;">
                Si le bouton ne fonctionne pas, copiez et collez ce lien dans votre navigateur :
              </p>
              <p style="margin: 10px 0 0; word-break: break-all;">
                <a href="${invitationUrl}" style="color: #667eea; text-decoration: underline; font-size: 14px;">${invitationUrl}</a>
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 30px 40px; background-color: #f7fafc; border-radius: 0 0 8px 8px; border-top: 1px solid #e2e8f0;">
              <p style="margin: 0 0 10px; color: #718096; font-size: 14px; line-height: 1.6;">
                <strong>⚠️ Important :</strong> Cette invitation est personnelle et expire dans 7 jours. 
                Pour des raisons de sécurité, elle ne peut être utilisée que par ${to}.
              </p>
              <p style="margin: 20px 0 0; color: #a0aec0; font-size: 12px; text-align: center;">
                © ${new Date().getFullYear()} Market Spas. Tous droits réservés.<br>
                Cet email a été envoyé automatiquement, merci de ne pas y répondre.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;

  const textContent = `
Bienvenue ${fullName} !

Vous avez été invité(e) à rejoindre le portail partenaires Market Spas.

Email : ${to}
Expire le : ${expirationDate}

Pour créer votre compte, cliquez sur ce lien :
${invitationUrl}

Cette invitation est personnelle et expire dans 7 jours.

© ${new Date().getFullYear()} Market Spas. Tous droits réservés.
  `.trim();

  try {
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: [to],
      subject: `Invitation à rejoindre Market Spas - Portail Partenaires`,
      html: htmlContent,
      text: textContent,
    });

    if (error) {
      console.error('[Email] Error sending invitation:', error);
      throw new Error(`Failed to send invitation email: ${error.message}`);
    }

    console.log('[Email] Invitation sent successfully:', data);
    return { success: true, messageId: data?.id };
  } catch (error) {
    console.error('[Email] Exception sending invitation:', error);
    throw error;
  }
}
