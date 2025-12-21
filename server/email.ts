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
