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


// ============================================
// NEW ORDER NOTIFICATION FOR ADMINS
// ============================================

interface OrderItem {
  name: string;
  quantity: number;
  unitPriceHT: number | string;
  totalTTC: number | string;
}

interface NewOrderNotificationParams {
  orderNumber: string;
  partnerName: string;
  partnerEmail: string;
  items: OrderItem[];
  totalHT: number | string;
  totalTTC: number | string;
  deliveryCity: string;
  deliveryPostalCode: string;
  createdAt: Date;
  portalUrl: string;
}

export async function sendNewOrderNotificationToAdmins(
  adminEmails: string[],
  params: NewOrderNotificationParams
): Promise<{ success: boolean; results: Array<{ email: string; success: boolean; messageId?: string; error?: string }> }> {
  const {
    orderNumber,
    partnerName,
    partnerEmail,
    items,
    totalHT,
    totalTTC,
    deliveryCity,
    deliveryPostalCode,
    createdAt,
    portalUrl,
  } = params;

  const formatPrice = (price: number | string): string => {
    const num = typeof price === 'string' ? parseFloat(price) : price;
    return num.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const formattedDate = new Date(createdAt).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const itemsHtml = items.map(item => `
    <tr>
      <td style="padding: 12px; border-bottom: 1px solid #e2e8f0;">${item.name}</td>
      <td style="padding: 12px; border-bottom: 1px solid #e2e8f0; text-align: center;">${item.quantity}</td>
      <td style="padding: 12px; border-bottom: 1px solid #e2e8f0; text-align: right;">${formatPrice(item.unitPriceHT)} €</td>
      <td style="padding: 12px; border-bottom: 1px solid #e2e8f0; text-align: right; font-weight: 600;">${formatPrice(item.totalTTC)} €</td>
    </tr>
  `).join('');

  const htmlContent = `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Nouvelle commande - Market Spas</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 0;">
        <table role="presentation" style="width: 650px; max-width: 100%; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="padding: 30px 40px; text-align: center; background: linear-gradient(135deg, #10b981 0%, #059669 100%); border-radius: 8px 8px 0 0;">
              <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 700;">🛒 Nouvelle Commande</h1>
              <p style="margin: 10px 0 0; color: #ffffff; font-size: 18px; opacity: 0.95;">#${orderNumber}</p>
            </td>
          </tr>
          
          <!-- Alert Banner -->
          <tr>
            <td style="padding: 20px 40px; background-color: #ecfdf5; border-bottom: 1px solid #d1fae5;">
              <table role="presentation" style="width: 100%;">
                <tr>
                  <td style="width: 40px; vertical-align: top;">
                    <span style="font-size: 24px;">📬</span>
                  </td>
                  <td>
                    <p style="margin: 0; color: #065f46; font-size: 14px; font-weight: 600;">
                      Une nouvelle commande a été passée sur le portail B2B
                    </p>
                    <p style="margin: 5px 0 0; color: #047857; font-size: 13px;">
                      ${formattedDate}
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Partner Info -->
          <tr>
            <td style="padding: 30px 40px;">
              <h2 style="margin: 0 0 20px; color: #1a1a1a; font-size: 18px; font-weight: 600; border-bottom: 2px solid #e2e8f0; padding-bottom: 10px;">
                👤 Informations du partenaire
              </h2>
              <table role="presentation" style="width: 100%;">
                <tr>
                  <td style="padding: 8px 0; color: #64748b; font-size: 14px; width: 140px;">Entreprise :</td>
                  <td style="padding: 8px 0; color: #1e293b; font-size: 14px; font-weight: 600;">${partnerName}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #64748b; font-size: 14px;">Email :</td>
                  <td style="padding: 8px 0; color: #1e293b; font-size: 14px;">
                    <a href="mailto:${partnerEmail}" style="color: #2563eb; text-decoration: none;">${partnerEmail}</a>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #64748b; font-size: 14px;">Livraison :</td>
                  <td style="padding: 8px 0; color: #1e293b; font-size: 14px;">${deliveryPostalCode} ${deliveryCity}</td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Order Items -->
          <tr>
            <td style="padding: 0 40px 30px;">
              <h2 style="margin: 0 0 20px; color: #1a1a1a; font-size: 18px; font-weight: 600; border-bottom: 2px solid #e2e8f0; padding-bottom: 10px;">
                📦 Détails de la commande
              </h2>
              <table role="presentation" style="width: 100%; border-collapse: collapse;">
                <thead>
                  <tr style="background-color: #f8fafc;">
                    <th style="padding: 12px; text-align: left; color: #64748b; font-size: 12px; font-weight: 600; text-transform: uppercase;">Produit</th>
                    <th style="padding: 12px; text-align: center; color: #64748b; font-size: 12px; font-weight: 600; text-transform: uppercase;">Qté</th>
                    <th style="padding: 12px; text-align: right; color: #64748b; font-size: 12px; font-weight: 600; text-transform: uppercase;">Prix HT</th>
                    <th style="padding: 12px; text-align: right; color: #64748b; font-size: 12px; font-weight: 600; text-transform: uppercase;">Total TTC</th>
                  </tr>
                </thead>
                <tbody>
                  ${itemsHtml}
                </tbody>
              </table>
              
              <!-- Totals -->
              <table role="presentation" style="width: 100%; margin-top: 20px;">
                <tr>
                  <td style="text-align: right; padding: 8px 0;">
                    <span style="color: #64748b; font-size: 14px;">Total HT :</span>
                    <span style="color: #1e293b; font-size: 14px; font-weight: 600; margin-left: 20px;">${formatPrice(totalHT)} €</span>
                  </td>
                </tr>
                <tr>
                  <td style="text-align: right; padding: 12px 0; border-top: 2px solid #e2e8f0;">
                    <span style="color: #1e293b; font-size: 18px; font-weight: 700;">Total TTC :</span>
                    <span style="color: #059669; font-size: 20px; font-weight: 700; margin-left: 20px;">${formatPrice(totalTTC)} €</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- CTA Button -->
          <tr>
            <td style="padding: 0 40px 40px;">
              <table role="presentation" style="width: 100%;">
                <tr>
                  <td align="center">
                    <a href="${portalUrl}/admin/orders" style="display: inline-block; padding: 16px 40px; background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); color: #ffffff; text-decoration: none; border-radius: 6px; font-size: 16px; font-weight: 600; box-shadow: 0 4px 6px rgba(37, 99, 235, 0.3);">
                      Voir la commande
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 25px 40px; background-color: #f8fafc; border-radius: 0 0 8px 8px; border-top: 1px solid #e2e8f0;">
              <p style="margin: 0; color: #94a3b8; font-size: 12px; text-align: center;">
                Cette notification a été envoyée automatiquement par le portail B2B Market Spas.<br>
                © ${new Date().getFullYear()} Market Spas. Tous droits réservés.
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
NOUVELLE COMMANDE - #${orderNumber}
=====================================

Une nouvelle commande a été passée sur le portail B2B Market Spas.

Date : ${formattedDate}

PARTENAIRE
----------
Entreprise : ${partnerName}
Email : ${partnerEmail}
Livraison : ${deliveryPostalCode} ${deliveryCity}

PRODUITS
--------
${items.map(item => `- ${item.name} x${item.quantity} : ${formatPrice(item.totalTTC)} €`).join('\n')}

TOTAL HT : ${formatPrice(totalHT)} €
TOTAL TTC : ${formatPrice(totalTTC)} €

Voir la commande : ${portalUrl}/admin/orders

---
Cette notification a été envoyée automatiquement par le portail B2B Market Spas.
  `.trim();

  const results: Array<{ email: string; success: boolean; messageId?: string; error?: string }> = [];

  for (const adminEmail of adminEmails) {
    try {
      const { data, error } = await resend.emails.send({
        from: FROM_EMAIL,
        to: [adminEmail],
        subject: `🛒 Nouvelle commande #${orderNumber} - ${partnerName}`,
        html: htmlContent,
        text: textContent,
      });

      if (error) {
        console.error(`[Email] Error sending new order notification to ${adminEmail}:`, error);
        results.push({ email: adminEmail, success: false, error: error.message });
      } else {
        console.log(`[Email] New order notification sent to ${adminEmail}:`, data?.id);
        results.push({ email: adminEmail, success: true, messageId: data?.id });
      }
    } catch (error) {
      console.error(`[Email] Exception sending new order notification to ${adminEmail}:`, error);
      results.push({ 
        email: adminEmail, 
        success: false, 
        error: error instanceof Error ? error.message : String(error) 
      });
    }
  }

  const allSuccess = results.every(r => r.success);
  return { success: allSuccess, results };
}

// Helper function to get admin emails from database
export async function getAdminEmails(): Promise<string[]> {
  // This will be called from db.ts to avoid circular imports
  // The actual implementation is in db.ts
  return [];
}


// ============================================
// ORDER STATUS CHANGE NOTIFICATION FOR PARTNERS
// ============================================

interface StatusConfig {
  label: string;
  emoji: string;
  color: string;
  bgColor: string;
  message: string;
}

const orderStatusConfig: Record<string, StatusConfig> = {
  PENDING_APPROVAL: {
    label: "En attente d'approbation",
    emoji: "⏳",
    color: "#92400e",
    bgColor: "#fef3c7",
    message: "Votre commande est en cours de validation par notre équipe.",
  },
  PENDING_DEPOSIT: {
    label: "Acompte requis",
    emoji: "💳",
    color: "#1e40af",
    bgColor: "#dbeafe",
    message: "Un acompte est requis pour confirmer votre commande. Veuillez procéder au paiement.",
  },
  DEPOSIT_PAID: {
    label: "Acompte payé",
    emoji: "✅",
    color: "#166534",
    bgColor: "#dcfce7",
    message: "Votre acompte a été reçu. Votre commande va être mise en production.",
  },
  IN_PRODUCTION: {
    label: "En production",
    emoji: "🏭",
    color: "#7c3aed",
    bgColor: "#ede9fe",
    message: "Votre commande est actuellement en cours de fabrication.",
  },
  READY_TO_SHIP: {
    label: "Prêt à expédier",
    emoji: "📦",
    color: "#0369a1",
    bgColor: "#e0f2fe",
    message: "Votre commande est prête et sera expédiée très prochainement.",
  },
  SHIPPED: {
    label: "Expédié",
    emoji: "🚚",
    color: "#0891b2",
    bgColor: "#cffafe",
    message: "Votre commande a été expédiée ! Elle est en route vers l'adresse de livraison.",
  },
  DELIVERED: {
    label: "Livré",
    emoji: "🎉",
    color: "#059669",
    bgColor: "#d1fae5",
    message: "Votre commande a été livrée avec succès. Merci pour votre confiance !",
  },
  COMPLETED: {
    label: "Terminé",
    emoji: "✨",
    color: "#065f46",
    bgColor: "#d1fae5",
    message: "Votre commande est complète. Merci pour votre fidélité !",
  },
  CANCELLED: {
    label: "Annulé",
    emoji: "❌",
    color: "#dc2626",
    bgColor: "#fee2e2",
    message: "Votre commande a été annulée. Contactez-nous pour plus d'informations.",
  },
};

interface OrderStatusChangeParams {
  orderNumber: string;
  partnerName: string;
  contactName: string;
  oldStatus: string;
  newStatus: string;
  totalTTC: number | string;
  portalUrl: string;
  trackingNumber?: string;
  estimatedDelivery?: string;
}

export async function sendOrderStatusChangeToPartner(
  partnerEmail: string,
  params: OrderStatusChangeParams
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const {
    orderNumber,
    partnerName,
    contactName,
    oldStatus,
    newStatus,
    totalTTC,
    portalUrl,
    trackingNumber,
    estimatedDelivery,
  } = params;

  const formatPrice = (price: number | string): string => {
    const num = typeof price === 'string' ? parseFloat(price) : price;
    return num.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const statusInfo = orderStatusConfig[newStatus] || {
    label: newStatus,
    emoji: "📋",
    color: "#64748b",
    bgColor: "#f1f5f9",
    message: "Le statut de votre commande a été mis à jour.",
  };

  const oldStatusInfo = orderStatusConfig[oldStatus] || {
    label: oldStatus,
    emoji: "📋",
    color: "#64748b",
    bgColor: "#f1f5f9",
    message: "",
  };

  // Additional info for shipped orders
  const trackingHtml = trackingNumber ? `
    <tr>
      <td style="padding: 15px 20px; background-color: #f0f9ff; border-radius: 8px; margin-top: 20px;">
        <p style="margin: 0 0 10px; color: #0369a1; font-size: 14px; font-weight: 600;">
          📍 Informations de suivi
        </p>
        <p style="margin: 0; color: #1e293b; font-size: 14px;">
          <strong>N° de suivi :</strong> ${trackingNumber}
        </p>
        ${estimatedDelivery ? `<p style="margin: 5px 0 0; color: #1e293b; font-size: 14px;"><strong>Livraison estimée :</strong> ${estimatedDelivery}</p>` : ''}
      </td>
    </tr>
  ` : '';

  const htmlContent = `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Mise à jour de commande - Market Spas</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 0;">
        <table role="presentation" style="width: 600px; max-width: 100%; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="padding: 30px 40px; text-align: center; background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%); border-radius: 8px 8px 0 0;">
              <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 700;">Market Spas</h1>
              <p style="margin: 10px 0 0; color: #ffffff; font-size: 16px; opacity: 0.95;">Mise à jour de votre commande</p>
            </td>
          </tr>
          
          <!-- Order Number -->
          <tr>
            <td style="padding: 25px 40px 15px; text-align: center;">
              <p style="margin: 0; color: #64748b; font-size: 14px;">Commande</p>
              <p style="margin: 5px 0 0; color: #1e293b; font-size: 22px; font-weight: 700;">#${orderNumber}</p>
            </td>
          </tr>
          
          <!-- Status Change -->
          <tr>
            <td style="padding: 0 40px 25px;">
              <table role="presentation" style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="width: 45%; text-align: center; padding: 15px;">
                    <p style="margin: 0 0 8px; color: #94a3b8; font-size: 12px; text-transform: uppercase;">Ancien statut</p>
                    <span style="display: inline-block; padding: 8px 16px; background-color: #f1f5f9; color: #64748b; border-radius: 20px; font-size: 13px; text-decoration: line-through;">
                      ${oldStatusInfo.emoji} ${oldStatusInfo.label}
                    </span>
                  </td>
                  <td style="width: 10%; text-align: center; color: #94a3b8; font-size: 20px;">→</td>
                  <td style="width: 45%; text-align: center; padding: 15px;">
                    <p style="margin: 0 0 8px; color: #94a3b8; font-size: 12px; text-transform: uppercase;">Nouveau statut</p>
                    <span style="display: inline-block; padding: 10px 20px; background-color: ${statusInfo.bgColor}; color: ${statusInfo.color}; border-radius: 20px; font-size: 14px; font-weight: 600;">
                      ${statusInfo.emoji} ${statusInfo.label}
                    </span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Message -->
          <tr>
            <td style="padding: 0 40px 25px;">
              <div style="padding: 20px; background-color: ${statusInfo.bgColor}; border-left: 4px solid ${statusInfo.color}; border-radius: 4px;">
                <p style="margin: 0; color: ${statusInfo.color}; font-size: 15px; line-height: 1.6;">
                  ${statusInfo.message}
                </p>
              </div>
            </td>
          </tr>
          
          <!-- Tracking Info (if shipped) -->
          ${trackingHtml}
          
          <!-- Order Summary -->
          <tr>
            <td style="padding: 25px 40px;">
              <table role="presentation" style="width: 100%; background-color: #f8fafc; border-radius: 8px; padding: 20px;">
                <tr>
                  <td>
                    <p style="margin: 0 0 15px; color: #1e293b; font-size: 16px; font-weight: 600;">Récapitulatif</p>
                    <table role="presentation" style="width: 100%;">
                      <tr>
                        <td style="padding: 5px 0; color: #64748b; font-size: 14px;">Entreprise :</td>
                        <td style="padding: 5px 0; color: #1e293b; font-size: 14px; text-align: right;">${partnerName}</td>
                      </tr>
                      <tr>
                        <td style="padding: 5px 0; color: #64748b; font-size: 14px;">Total TTC :</td>
                        <td style="padding: 5px 0; color: #1e293b; font-size: 14px; font-weight: 600; text-align: right;">${formatPrice(totalTTC)} €</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- CTA Button -->
          <tr>
            <td style="padding: 0 40px 40px;">
              <table role="presentation" style="width: 100%;">
                <tr>
                  <td align="center">
                    <a href="${portalUrl}/order/${orderNumber}" style="display: inline-block; padding: 16px 40px; background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); color: #ffffff; text-decoration: none; border-radius: 6px; font-size: 16px; font-weight: 600; box-shadow: 0 4px 6px rgba(37, 99, 235, 0.3);">
                      Suivre ma commande
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 25px 40px; background-color: #f8fafc; border-radius: 0 0 8px 8px; border-top: 1px solid #e2e8f0;">
              <p style="margin: 0 0 10px; color: #64748b; font-size: 13px; text-align: center;">
                Une question ? Contactez notre équipe via le portail partenaires.
              </p>
              <p style="margin: 0; color: #94a3b8; font-size: 12px; text-align: center;">
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
MISE À JOUR DE VOTRE COMMANDE
=============================

Bonjour ${contactName},

Le statut de votre commande #${orderNumber} a été mis à jour.

CHANGEMENT DE STATUT
--------------------
${oldStatusInfo.emoji} ${oldStatusInfo.label} → ${statusInfo.emoji} ${statusInfo.label}

${statusInfo.message}
${trackingNumber ? `\nN° de suivi : ${trackingNumber}` : ''}
${estimatedDelivery ? `Livraison estimée : ${estimatedDelivery}` : ''}

RÉCAPITULATIF
-------------
Entreprise : ${partnerName}
Total TTC : ${formatPrice(totalTTC)} €

Suivre ma commande : ${portalUrl}/order/${orderNumber}

---
© ${new Date().getFullYear()} Market Spas. Tous droits réservés.
Cet email a été envoyé automatiquement, merci de ne pas y répondre.
  `.trim();

  try {
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: [partnerEmail],
      subject: `${statusInfo.emoji} Commande #${orderNumber} - ${statusInfo.label}`,
      html: htmlContent,
      text: textContent,
    });

    if (error) {
      console.error(`[Email] Error sending order status change to ${partnerEmail}:`, error);
      return { success: false, error: error.message };
    }

    console.log(`[Email] Order status change notification sent to ${partnerEmail}:`, data?.id);
    return { success: true, messageId: data?.id };
  } catch (error) {
    console.error(`[Email] Exception sending order status change to ${partnerEmail}:`, error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : String(error) 
    };
  }
}


// ============================================
// DEPOSIT REMINDER EMAIL FOR PARTNERS
// ============================================

interface DepositReminderParams {
  orderNumber: string;
  partnerName: string;
  contactName: string;
  depositAmount: number | string;
  totalTTC: number | string;
  orderDate: Date;
  portalUrl: string;
  hoursOverdue: number;
}

export async function sendDepositReminderEmail(
  partnerEmail: string,
  params: DepositReminderParams
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const {
    orderNumber,
    partnerName,
    contactName,
    depositAmount,
    totalTTC,
    orderDate,
    portalUrl,
    hoursOverdue,
  } = params;

  const formatPrice = (price: number | string): string => {
    const num = typeof price === 'string' ? parseFloat(price) : price;
    return num.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const formatDate = (date: Date): string => {
    return date.toLocaleDateString('fr-FR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const urgencyLevel = hoursOverdue >= 72 ? 'high' : 'medium';
  const urgencyColor = urgencyLevel === 'high' ? '#dc2626' : '#f59e0b';
  const urgencyBgColor = urgencyLevel === 'high' ? '#fef2f2' : '#fffbeb';
  const urgencyMessage = urgencyLevel === 'high' 
    ? 'Votre commande risque d\'être annulée si le paiement n\'est pas effectué rapidement.'
    : 'Nous vous rappelons qu\'un acompte est nécessaire pour confirmer votre commande.';

  const htmlContent = `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Rappel de paiement - Market Spas</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 0;">
        <table role="presentation" style="width: 600px; max-width: 100%; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="padding: 30px 40px; text-align: center; background: linear-gradient(135deg, ${urgencyColor} 0%, ${urgencyLevel === 'high' ? '#b91c1c' : '#d97706'} 100%); border-radius: 8px 8px 0 0;">
              <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 700;">💳 Rappel de paiement</h1>
              <p style="margin: 10px 0 0; color: #ffffff; font-size: 16px; opacity: 0.95;">Acompte en attente</p>
            </td>
          </tr>
          
          <!-- Greeting -->
          <tr>
            <td style="padding: 30px 40px 15px;">
              <p style="margin: 0; color: #1e293b; font-size: 16px; line-height: 1.6;">
                Bonjour <strong>${contactName}</strong>,
              </p>
            </td>
          </tr>
          
          <!-- Alert Box -->
          <tr>
            <td style="padding: 0 40px 25px;">
              <div style="padding: 20px; background-color: ${urgencyBgColor}; border-left: 4px solid ${urgencyColor}; border-radius: 4px;">
                <p style="margin: 0; color: ${urgencyColor}; font-size: 15px; line-height: 1.6; font-weight: 500;">
                  ⚠️ ${urgencyMessage}
                </p>
              </div>
            </td>
          </tr>
          
          <!-- Order Details -->
          <tr>
            <td style="padding: 0 40px 25px;">
              <table role="presentation" style="width: 100%; background-color: #f8fafc; border-radius: 8px; padding: 20px;">
                <tr>
                  <td>
                    <p style="margin: 0 0 15px; color: #1e293b; font-size: 16px; font-weight: 600;">📦 Détails de la commande</p>
                    <table role="presentation" style="width: 100%;">
                      <tr>
                        <td style="padding: 8px 0; color: #64748b; font-size: 14px;">N° de commande :</td>
                        <td style="padding: 8px 0; color: #1e293b; font-size: 14px; font-weight: 600; text-align: right;">#${orderNumber}</td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; color: #64748b; font-size: 14px;">Date de commande :</td>
                        <td style="padding: 8px 0; color: #1e293b; font-size: 14px; text-align: right;">${formatDate(orderDate)}</td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; color: #64748b; font-size: 14px;">Entreprise :</td>
                        <td style="padding: 8px 0; color: #1e293b; font-size: 14px; text-align: right;">${partnerName}</td>
                      </tr>
                      <tr>
                        <td colspan="2" style="padding: 15px 0 8px;">
                          <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 0;">
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; color: #64748b; font-size: 14px;">Total de la commande :</td>
                        <td style="padding: 8px 0; color: #1e293b; font-size: 14px; text-align: right;">${formatPrice(totalTTC)} €</td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; color: ${urgencyColor}; font-size: 16px; font-weight: 600;">Acompte à régler :</td>
                        <td style="padding: 8px 0; color: ${urgencyColor}; font-size: 18px; font-weight: 700; text-align: right;">${formatPrice(depositAmount)} €</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- CTA Button -->
          <tr>
            <td style="padding: 0 40px 20px;">
              <table role="presentation" style="width: 100%;">
                <tr>
                  <td align="center">
                    <a href="${portalUrl}/order/${orderNumber}" style="display: inline-block; padding: 18px 50px; background: linear-gradient(135deg, ${urgencyColor} 0%, ${urgencyLevel === 'high' ? '#b91c1c' : '#d97706'} 100%); color: #ffffff; text-decoration: none; border-radius: 6px; font-size: 16px; font-weight: 700; box-shadow: 0 4px 6px rgba(0,0,0,0.2);">
                      Payer mon acompte maintenant
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Help Text -->
          <tr>
            <td style="padding: 0 40px 30px;">
              <p style="margin: 0; color: #64748b; font-size: 14px; text-align: center; line-height: 1.6;">
                Vous avez déjà effectué le paiement ? Ignorez ce message.<br>
                Une question ? Contactez notre équipe via le portail partenaires.
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 25px 40px; background-color: #f8fafc; border-radius: 0 0 8px 8px; border-top: 1px solid #e2e8f0;">
              <p style="margin: 0; color: #94a3b8; font-size: 12px; text-align: center;">
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
RAPPEL DE PAIEMENT - ACOMPTE EN ATTENTE
=======================================

Bonjour ${contactName},

${urgencyMessage}

DÉTAILS DE LA COMMANDE
----------------------
N° de commande : #${orderNumber}
Date de commande : ${formatDate(orderDate)}
Entreprise : ${partnerName}

Total de la commande : ${formatPrice(totalTTC)} €
ACOMPTE À RÉGLER : ${formatPrice(depositAmount)} €

Payer mon acompte : ${portalUrl}/order/${orderNumber}

---
Vous avez déjà effectué le paiement ? Ignorez ce message.
Une question ? Contactez notre équipe via le portail partenaires.

© ${new Date().getFullYear()} Market Spas. Tous droits réservés.
Cet email a été envoyé automatiquement, merci de ne pas y répondre.
  `.trim();

  const subjectEmoji = urgencyLevel === 'high' ? '🚨' : '💳';
  const subjectText = urgencyLevel === 'high' ? 'URGENT' : 'Rappel';

  try {
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: [partnerEmail],
      subject: `${subjectEmoji} ${subjectText} : Acompte en attente - Commande #${orderNumber}`,
      html: htmlContent,
      text: textContent,
    });

    if (error) {
      console.error(`[Email] Error sending deposit reminder to ${partnerEmail}:`, error);
      return { success: false, error: error.message };
    }

    console.log(`[Email] Deposit reminder sent to ${partnerEmail}:`, data?.id);
    return { success: true, messageId: data?.id };
  } catch (error) {
    console.error(`[Email] Exception sending deposit reminder to ${partnerEmail}:`, error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : String(error) 
    };
  }
}

/**
 * Send password reset email
 */
export async function sendPasswordResetEmail(
  email: string,
  resetToken: string,
  resetUrl: string
) {
  const htmlContent = `
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
    .btn { display: inline-block; background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 20px; }
    .warning { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; border-radius: 4px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🔒 Market Spas</h1>
      <p>Réinitialisation de mot de passe</p>
    </div>
    <div class="content">
      <h2>Bonjour,</h2>
      <p>Vous avez demandé à réinitialiser votre mot de passe pour accéder au portail B2B Market Spas.</p>
      
      <p>Cliquez sur le bouton ci-dessous pour créer un nouveau mot de passe :</p>
      <a href="${resetUrl}" class="btn">Réinitialiser mon mot de passe</a>
      
      <div class="warning">
        <p><strong>⚠️ Important :</strong></p>
        <p>Ce lien est valable pendant 1 heure seulement.</p>
        <p>Si vous n'avez pas demandé cette réinitialisation, ignorez cet email.</p>
      </div>
      
      <p style="margin-top: 20px; font-size: 12px; color: #64748b;">
        Si le bouton ne fonctionne pas, copiez et collez ce lien dans votre navigateur :<br>
        <a href="${resetUrl}" style="color: #2563eb; word-break: break-all;">${resetUrl}</a>
      </p>
    </div>
    <div class="footer">
      <p>Market Spas - Votre partenaire wellness</p>
      <p>Cet email a été envoyé automatiquement, merci de ne pas y répondre.</p>
    </div>
  </div>
</body>
</html>
  `.trim();

  const textContent = `
RÉINITIALISATION DE MOT DE PASSE
Market Spas - Portail B2B

Bonjour,

Vous avez demandé à réinitialiser votre mot de passe pour accéder au portail B2B Market Spas.

Cliquez sur ce lien pour créer un nouveau mot de passe :
${resetUrl}

⚠️ IMPORTANT :
- Ce lien est valable pendant 1 heure seulement
- Si vous n'avez pas demandé cette réinitialisation, ignorez cet email

---
© ${new Date().getFullYear()} Market Spas. Tous droits réservés.
Cet email a été envoyé automatiquement, merci de ne pas y répondre.
  `.trim();

  try {
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: [email],
      subject: "🔒 Réinitialisation de votre mot de passe - Market Spas",
      html: htmlContent,
      text: textContent,
    });

    if (error) {
      console.error(`[Email] Error sending password reset to ${email}:`, error);
      return { success: false, error: error.message };
    }

    console.log(`[Email] Password reset sent to ${email}:`, data?.id);
    return { success: true, messageId: data?.id };
  } catch (error) {
    console.error(`[Email] Exception sending password reset to ${email}:`, error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : String(error) 
    };
  }
}

/**
 * Send payment confirmation email (Stripe)
 */
export async function sendPaymentConfirmationEmail(
  email: string,
  orderNumber: string,
  amount: number,
  paymentMethod: string
) {
  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #10b981 0%, #34d399 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background: #f8fafc; padding: 30px; border: 1px solid #e2e8f0; }
    .footer { background: #1e293b; color: #94a3b8; padding: 20px; text-align: center; font-size: 12px; border-radius: 0 0 8px 8px; }
    .success-box { background: #d1fae5; border-left: 4px solid #10b981; padding: 15px; margin: 20px 0; border-radius: 4px; }
    .payment-details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
    .detail-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #e2e8f0; }
    .btn { display: inline-block; background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 20px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>✅ Paiement confirmé</h1>
      <p>Market Spas</p>
    </div>
    <div class="content">
      <div class="success-box">
        <p style="margin: 0;"><strong>✅ Votre paiement a été traité avec succès !</strong></p>
      </div>
      
      <h2>Bonjour,</h2>
      <p>Nous avons bien reçu votre paiement pour la commande <strong>#${orderNumber}</strong>.</p>
      
      <div class="payment-details">
        <h3>Détails du paiement</h3>
        <div class="detail-row">
          <span>N° de commande</span>
          <span><strong>#${orderNumber}</strong></span>
        </div>
        <div class="detail-row">
          <span>Montant payé</span>
          <span><strong>${formatPrice(amount)} €</strong></span>
        </div>
        <div class="detail-row">
          <span>Méthode de paiement</span>
          <span>${paymentMethod}</span>
        </div>
        <div class="detail-row">
          <span>Date</span>
          <span>${formatDate(new Date())}</span>
        </div>
      </div>
      
      <p>Votre commande est maintenant en cours de traitement. Vous recevrez une notification lorsqu'elle sera expédiée.</p>
      <a href="${ENV.siteUrl}/orders/${orderNumber}" class="btn">Voir ma commande</a>
    </div>
    <div class="footer">
      <p>Market Spas - Votre partenaire wellness</p>
      <p>Cet email a été envoyé automatiquement, merci de ne pas y répondre.</p>
    </div>
  </div>
</body>
</html>
  `.trim();

  const textContent = `
✅ PAIEMENT CONFIRMÉ
Market Spas - Portail B2B

Bonjour,

Nous avons bien reçu votre paiement pour la commande #${orderNumber}.

DÉTAILS DU PAIEMENT
-------------------
N° de commande : #${orderNumber}
Montant payé : ${formatPrice(amount)} €
Méthode de paiement : ${paymentMethod}
Date : ${formatDate(new Date())}

Votre commande est maintenant en cours de traitement. Vous recevrez une notification lorsqu'elle sera expédiée.

Voir ma commande : ${ENV.siteUrl}/orders/${orderNumber}

---
© ${new Date().getFullYear()} Market Spas. Tous droits réservés.
Cet email a été envoyé automatiquement, merci de ne pas y répondre.
  `.trim();

  try {
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: [email],
      subject: `✅ Paiement confirmé - Commande #${orderNumber}`,
      html: htmlContent,
      text: textContent,
    });

    if (error) {
      console.error(`[Email] Error sending payment confirmation to ${email}:`, error);
      return { success: false, error: error.message };
    }

    console.log(`[Email] Payment confirmation sent to ${email}:`, data?.id);
    return { success: true, messageId: data?.id };
  } catch (error) {
    console.error(`[Email] Exception sending payment confirmation to ${email}:`, error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : String(error) 
    };
  }
}

/**
 * Send payment failure email (Stripe)
 */
export async function sendPaymentFailureEmail(
  email: string,
  orderNumber: string,
  amount: number,
  reason: string
) {
  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #ef4444 0%, #f87171 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background: #f8fafc; padding: 30px; border: 1px solid #e2e8f0; }
    .footer { background: #1e293b; color: #94a3b8; padding: 20px; text-align: center; font-size: 12px; border-radius: 0 0 8px 8px; }
    .error-box { background: #fee2e2; border-left: 4px solid #ef4444; padding: 15px; margin: 20px 0; border-radius: 4px; }
    .btn { display: inline-block; background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 20px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>❌ Échec du paiement</h1>
      <p>Market Spas</p>
    </div>
    <div class="content">
      <div class="error-box">
        <p style="margin: 0;"><strong>❌ Votre paiement n'a pas pu être traité</strong></p>
      </div>
      
      <h2>Bonjour,</h2>
      <p>Malheureusement, nous n'avons pas pu traiter votre paiement pour la commande <strong>#${orderNumber}</strong>.</p>
      
      <p><strong>Raison :</strong> ${reason}</p>
      
      <p><strong>Montant :</strong> ${formatPrice(amount)} €</p>
      
      <p>Nous vous invitons à réessayer avec une autre méthode de paiement ou à contacter votre banque si le problème persiste.</p>
      
      <a href="${ENV.siteUrl}/orders/${orderNumber}" class="btn">Réessayer le paiement</a>
    </div>
    <div class="footer">
      <p>Market Spas - Votre partenaire wellness</p>
      <p>Cet email a été envoyé automatiquement, merci de ne pas y répondre.</p>
    </div>
  </div>
</body>
</html>
  `.trim();

  const textContent = `
❌ ÉCHEC DU PAIEMENT
Market Spas - Portail B2B

Bonjour,

Malheureusement, nous n'avons pas pu traiter votre paiement pour la commande #${orderNumber}.

Raison : ${reason}
Montant : ${formatPrice(amount)} €

Nous vous invitons à réessayer avec une autre méthode de paiement ou à contacter votre banque si le problème persiste.

Réessayer le paiement : ${ENV.siteUrl}/orders/${orderNumber}

---
© ${new Date().getFullYear()} Market Spas. Tous droits réservés.
Cet email a été envoyé automatiquement, merci de ne pas y répondre.
  `.trim();

  try {
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: [email],
      subject: `❌ Échec du paiement - Commande #${orderNumber}`,
      html: htmlContent,
      text: textContent,
    });

    if (error) {
      console.error(`[Email] Error sending payment failure to ${email}:`, error);
      return { success: false, error: error.message };
    }

    console.log(`[Email] Payment failure sent to ${email}:`, data?.id);
    return { success: true, messageId: data?.id };
  } catch (error) {
    console.error(`[Email] Exception sending payment failure to ${email}:`, error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : String(error) 
    };
  }
}

/**
 * Send refund confirmation email (Stripe)
 */
export async function sendRefundConfirmationEmail(
  email: string,
  orderNumber: string,
  amount: number
) {
  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #3b82f6 0%, #60a5fa 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background: #f8fafc; padding: 30px; border: 1px solid #e2e8f0; }
    .footer { background: #1e293b; color: #94a3b8; padding: 20px; text-align: center; font-size: 12px; border-radius: 0 0 8px 8px; }
    .info-box { background: #dbeafe; border-left: 4px solid #3b82f6; padding: 15px; margin: 20px 0; border-radius: 4px; }
    .btn { display: inline-block; background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 20px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>💰 Remboursement effectué</h1>
      <p>Market Spas</p>
    </div>
    <div class="content">
      <div class="info-box">
        <p style="margin: 0;"><strong>💰 Votre remboursement a été traité</strong></p>
      </div>
      
      <h2>Bonjour,</h2>
      <p>Nous avons procédé au remboursement de votre commande <strong>#${orderNumber}</strong>.</p>
      
      <p><strong>Montant remboursé :</strong> ${formatPrice(amount)} €</p>
      
      <p>Le montant sera crédité sur votre compte bancaire sous 5 à 10 jours ouvrés, selon votre banque.</p>
      
      <p>Si vous avez des questions concernant ce remboursement, n'hésitez pas à nous contacter via le portail partenaires.</p>
      
      <a href="${ENV.siteUrl}/orders/${orderNumber}" class="btn">Voir ma commande</a>
    </div>
    <div class="footer">
      <p>Market Spas - Votre partenaire wellness</p>
      <p>Cet email a été envoyé automatiquement, merci de ne pas y répondre.</p>
    </div>
  </div>
</body>
</html>
  `.trim();

  const textContent = `
💰 REMBOURSEMENT EFFECTUÉ
Market Spas - Portail B2B

Bonjour,

Nous avons procédé au remboursement de votre commande #${orderNumber}.

Montant remboursé : ${formatPrice(amount)} €

Le montant sera crédité sur votre compte bancaire sous 5 à 10 jours ouvrés, selon votre banque.

Si vous avez des questions concernant ce remboursement, n'hésitez pas à nous contacter via le portail partenaires.

Voir ma commande : ${ENV.siteUrl}/orders/${orderNumber}

---
© ${new Date().getFullYear()} Market Spas. Tous droits réservés.
Cet email a été envoyé automatiquement, merci de ne pas y répondre.
  `.trim();

  try {
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: [email],
      subject: `💰 Remboursement effectué - Commande #${orderNumber}`,
      html: htmlContent,
      text: textContent,
    });

    if (error) {
      console.error(`[Email] Error sending refund confirmation to ${email}:`, error);
      return { success: false, error: error.message };
    }

    console.log(`[Email] Refund confirmation sent to ${email}:`, data?.id);
    return { success: true, messageId: data?.id };
  } catch (error) {
    console.error(`[Email] Exception sending refund confirmation to ${email}:`, error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : String(error) 
    };
  }
}
