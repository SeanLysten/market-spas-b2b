// ============================================
// MARKET SPAS — UNIFIED EMAIL SYSTEM
// Premium B2B email templates with consistent branding
// All templates: table-based for Outlook/Gmail/Apple Mail compatibility
// ============================================

import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM_EMAIL = process.env.EMAIL_FROM || 'Market Spas <noreply@marketspas.com>';
const LOGO_URL = "https://d2xsxph8kpxj0f.cloudfront.net/310419663031645455/jX4Ppf2KXZ8z9Tppipem7T/logo-market-spa_177731cb.png";

// Environment helpers
const ENV = {
  siteUrl: process.env.SITE_URL || process.env.VITE_SITE_URL || 'https://marketspas.pro',
};

// ============================================
// DESIGN SYSTEM CONSTANTS
// ============================================
const DS = {
  // Brand colors
  primary: '#3d9b85',
  primaryLight: '#5ab89f',
  primaryDark: '#2d7a68',
  primaryGradient: 'linear-gradient(135deg, #5ab89f 0%, #3d9b85 100%)',
  // Semantic colors
  success: '#059669',
  successLight: '#d1fae5',
  successDark: '#065f46',
  warning: '#d97706',
  warningLight: '#fef3c7',
  warningDark: '#92400e',
  danger: '#dc2626',
  dangerLight: '#fee2e2',
  dangerDark: '#991b1b',
  info: '#2563eb',
  infoLight: '#dbeafe',
  infoDark: '#1e40af',
  // Neutrals
  text: '#1e293b',
  textSecondary: '#64748b',
  textMuted: '#94a3b8',
  border: '#e2e8f0',
  bgPage: '#f5f5f5',
  bgCard: '#ffffff',
  bgSubtle: '#f8fafc',
  bgFooter: '#1e293b',
  // Typography
  fontStack: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
};

// ============================================
// SHARED LAYOUT COMPONENTS
// ============================================

function emailWrapper(content: string): string {
  return `<!DOCTYPE html>
<html lang="fr" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>Market Spas</title>
  <!--[if mso]><xml><o:OfficeDocumentSettings><o:AllowPNG/><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml><![endif]-->
</head>
<body style="margin: 0; padding: 0; font-family: ${DS.fontStack}; background-color: ${DS.bgPage}; -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%;">
  <table role="presentation" cellpadding="0" cellspacing="0" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 16px;">
        ${content}
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function emailHeader(opts: { subtitle?: string; accentColor?: string; accentGradient?: string }): string {
  const gradient = opts.accentGradient || DS.primaryGradient;
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="width: 640px; max-width: 100%; border-collapse: collapse;">
          <!-- Header -->
          <tr>
            <td style="padding: 36px 40px 28px; text-align: center; background: ${gradient}; border-radius: 12px 12px 0 0;">
              <img src="${LOGO_URL}" alt="Market Spas" width="52" height="52" style="display: block; margin: 0 auto 14px; border-radius: 10px; border: 2px solid rgba(255,255,255,0.25);" />
              <h1 style="margin: 0; color: #ffffff; font-size: 22px; font-weight: 700; letter-spacing: -0.3px;">Market Spas</h1>
              ${opts.subtitle ? `<p style="margin: 8px 0 0; color: rgba(255,255,255,0.9); font-size: 14px; font-weight: 400;">${opts.subtitle}</p>` : ''}
            </td>
          </tr>`;
}

function emailFooter(extraText?: string): string {
  return `<!-- Footer -->
          <tr>
            <td style="padding: 28px 40px; background-color: ${DS.bgSubtle}; border-radius: 0 0 12px 12px; border-top: 1px solid ${DS.border};">
              ${extraText ? `<p style="margin: 0 0 12px; color: ${DS.textSecondary}; font-size: 13px; line-height: 1.6; text-align: center;">${extraText}</p>` : ''}
              <table role="presentation" cellpadding="0" cellspacing="0" style="width: 100%;">
                <tr>
                  <td align="center">
                    <p style="margin: 0; color: ${DS.textMuted}; font-size: 11px; line-height: 1.6;">
                      &copy; ${new Date().getFullYear()} Market Spas &mdash; Votre partenaire wellness<br>
                      Cet email a \u00e9t\u00e9 envoy\u00e9 automatiquement, merci de ne pas y r\u00e9pondre.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>`;
}

function ctaButton(text: string, url: string, opts?: { color?: string; gradient?: string }): string {
  const gradient = opts?.gradient || DS.primaryGradient;
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="width: 100%;">
    <tr>
      <td align="center" style="padding: 8px 0;">
        <!--[if mso]><v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" href="${url}" style="height:52px;v-text-anchor:middle;width:260px;" arcsize="12%" fillcolor="${opts?.color || DS.primary}"><center style="color:#ffffff;font-family:${DS.fontStack};font-size:16px;font-weight:600;">${text}</center></v:roundrect><![endif]-->
        <!--[if !mso]><!-->
        <a href="${url}" style="display: inline-block; padding: 14px 36px; background: ${gradient}; color: #ffffff; text-decoration: none; border-radius: 8px; font-size: 15px; font-weight: 600; font-family: ${DS.fontStack}; letter-spacing: -0.2px; mso-hide: all;">
          ${text}
        </a>
        <!--<![endif]-->
      </td>
    </tr>
  </table>`;
}

function alertBox(text: string, type: 'success' | 'warning' | 'danger' | 'info'): string {
  const colors = {
    success: { bg: DS.successLight, border: DS.success, text: DS.successDark },
    warning: { bg: DS.warningLight, border: DS.warning, text: DS.warningDark },
    danger: { bg: DS.dangerLight, border: DS.danger, text: DS.dangerDark },
    info: { bg: DS.infoLight, border: DS.info, text: DS.infoDark },
  };
  const c = colors[type];
  return `<td style="padding: 0 40px 24px;">
    <table role="presentation" cellpadding="0" cellspacing="0" style="width: 100%;">
      <tr>
        <td style="padding: 16px 20px; background-color: ${c.bg}; border-left: 4px solid ${c.border}; border-radius: 0 6px 6px 0;">
          <p style="margin: 0; color: ${c.text}; font-size: 14px; line-height: 1.6; font-weight: 500;">${text}</p>
        </td>
      </tr>
    </table>
  </td>`;
}

function infoRow(label: string, value: string, opts?: { bold?: boolean; color?: string }): string {
  return `<tr>
    <td style="padding: 7px 0; color: ${DS.textSecondary}; font-size: 13px; width: 45%;">${label}</td>
    <td style="padding: 7px 0; color: ${opts?.color || DS.text}; font-size: 13px; text-align: right; font-weight: ${opts?.bold ? '700' : '400'};">${value}</td>
  </tr>`;
}

function sectionTitle(icon: string, title: string): string {
  return `<tr>
    <td style="padding: 28px 40px 16px;">
      <p style="margin: 0; color: ${DS.text}; font-size: 15px; font-weight: 700; letter-spacing: -0.2px;">
        ${icon}&nbsp;&nbsp;${title}
      </p>
      <hr style="border: none; border-top: 1px solid ${DS.border}; margin: 10px 0 0;">
    </td>
  </tr>`;
}

// ============================================
// UTILITY HELPERS
// ============================================

function formatPrice(price: number | string): string {
  const num = typeof price === 'string' ? parseFloat(price) : price;
  if (isNaN(num)) return '0,00';
  return num.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatDate(date: Date): string {
  return date.toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatDateShort(date: Date): string {
  return date.toLocaleDateString('fr-FR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

const countryNames: Record<string, string> = {
  BE: 'Belgique', FR: 'France', NL: 'Pays-Bas', DE: 'Allemagne', LU: 'Luxembourg',
  CH: 'Suisse', AT: 'Autriche', ES: 'Espagne', IT: 'Italie', GB: 'Royaume-Uni',
};

// Helper function to replace template variables
function renderTemplate(template: string, variables: Record<string, string>): string {
  let result = template;
  for (const [key, value] of Object.entries(variables)) {
    result = result.replace(new RegExp(`{{${key}}}`, "g"), value);
  }
  return result;
}


// ============================================
// STATUS CONFIGURATION
// ============================================

const statusConfig: Record<string, { label: string; message: string; class: string }> = {
  PENDING: { label: "En attente", message: "Votre commande est en attente de validation.", class: "processing" },
  CONFIRMED: { label: "Confirm\u00e9e", message: "Votre commande a \u00e9t\u00e9 confirm\u00e9e et sera trait\u00e9e prochainement.", class: "confirmed" },
  PROCESSING: { label: "En pr\u00e9paration", message: "Votre commande est en cours de pr\u00e9paration dans nos entrep\u00f4ts.", class: "processing" },
  SHIPPED: { label: "Exp\u00e9di\u00e9e", message: "Votre commande a \u00e9t\u00e9 exp\u00e9di\u00e9e et est en route vers vous.", class: "shipped" },
  DELIVERED: { label: "Livr\u00e9e", message: "Votre commande a \u00e9t\u00e9 livr\u00e9e. Merci pour votre confiance !", class: "delivered" },
  CANCELLED: { label: "Annul\u00e9e", message: "Votre commande a \u00e9t\u00e9 annul\u00e9e.", class: "processing" },
};

// Inline templates (used by renderTemplate)
const templates = {
  orderConfirmation: {
    subject: "Confirmation de commande #{{orderNumber}}",
    html: `PLACEHOLDER_REPLACED_BY_FUNCTION`,
  },
  orderStatusUpdate: {
    subject: "Mise \u00e0 jour de votre commande #{{orderNumber}}",
    html: `PLACEHOLDER_REPLACED_BY_FUNCTION`,
  },
  lowStockAlert: {
    subject: "Alerte stock bas - {{productName}}",
    html: `PLACEHOLDER_REPLACED_BY_FUNCTION`,
  },
  newPartnerRegistration: {
    subject: "Nouveau partenaire inscrit - {{companyName}}",
    html: `PLACEHOLDER_REPLACED_BY_FUNCTION`,
  },
  welcomePartner: {
    subject: "Bienvenue chez Market Spas, {{companyName}} !",
    html: `PLACEHOLDER_REPLACED_BY_FUNCTION`,
  },
};

// Order status config for status change emails
const orderStatusConfig: Record<string, { label: string; emoji: string; color: string; bgColor: string; message: string }> = {
  PENDING_APPROVAL: { label: "En attente d'approbation", emoji: "\u23f3", color: "#92400e", bgColor: "#fef3c7", message: "Votre commande est en cours de validation par notre \u00e9quipe." },
  PENDING_DEPOSIT: { label: "Acompte requis", emoji: "\ud83d\udcb3", color: "#1e40af", bgColor: "#dbeafe", message: "Un acompte est requis pour confirmer votre commande. Veuillez proc\u00e9der au paiement." },
  DEPOSIT_PAID: { label: "Acompte pay\u00e9", emoji: "\u2705", color: "#166534", bgColor: "#dcfce7", message: "Votre acompte a \u00e9t\u00e9 re\u00e7u. Votre commande va \u00eatre mise en production." },
  IN_PRODUCTION: { label: "En production", emoji: "\ud83c\udfed", color: "#7c3aed", bgColor: "#ede9fe", message: "Votre commande est actuellement en cours de fabrication." },
  READY_TO_SHIP: { label: "Pr\u00eat \u00e0 exp\u00e9dier", emoji: "\ud83d\udce6", color: "#0369a1", bgColor: "#e0f2fe", message: "Votre commande est pr\u00eate et sera exp\u00e9di\u00e9e tr\u00e8s prochainement." },
  SHIPPED: { label: "Exp\u00e9di\u00e9", emoji: "\ud83d\ude9a", color: "#0891b2", bgColor: "#cffafe", message: "Votre commande a \u00e9t\u00e9 exp\u00e9di\u00e9e ! Elle est en route vers l'adresse de livraison." },
  DELIVERED: { label: "Livr\u00e9", emoji: "\ud83c\udf89", color: "#059669", bgColor: "#d1fae5", message: "Votre commande a \u00e9t\u00e9 livr\u00e9e avec succ\u00e8s. Merci pour votre confiance !" },
  COMPLETED: { label: "Termin\u00e9", emoji: "\u2728", color: "#065f46", bgColor: "#d1fae5", message: "Votre commande est compl\u00e8te. Merci pour votre fid\u00e9lit\u00e9 !" },
  CANCELLED: { label: "Annul\u00e9", emoji: "\u274c", color: "#dc2626", bgColor: "#fee2e2", message: "Votre commande a \u00e9t\u00e9 annul\u00e9e. Contactez-nous pour plus d'informations." },
};


// ============================================
// 1. INVITATION EMAIL
// ============================================

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
  const expirationDate = formatDate(new Date(expiresAt));

  const body = `
          <!-- Greeting -->
          <tr>
            <td style="padding: 32px 40px 16px;">
              <h2 style="margin: 0 0 16px; color: ${DS.text}; font-size: 20px; font-weight: 700; letter-spacing: -0.3px;">Bienvenue ${fullName}\u00a0!</h2>
              <p style="margin: 0; color: ${DS.textSecondary}; font-size: 15px; line-height: 1.7;">
                Vous avez \u00e9t\u00e9 invit\u00e9(e) \u00e0 rejoindre le portail partenaires <strong style="color: ${DS.text};">Market Spas</strong>.
                Notre plateforme vous permet de g\u00e9rer vos commandes, consulter le catalogue produits et acc\u00e9der \u00e0 toutes vos ressources en un seul endroit.
              </p>
            </td>
          </tr>

          <!-- Info box -->
          <tr>
            <td style="padding: 0 40px 24px;">
              <table role="presentation" cellpadding="0" cellspacing="0" style="width: 100%; background-color: ${DS.bgSubtle}; border-radius: 8px; border: 1px solid ${DS.border};">
                <tr>
                  <td style="padding: 18px 22px;">
                    <table role="presentation" cellpadding="0" cellspacing="0" style="width: 100%;">
                      ${infoRow('Email', to)}
                      ${infoRow('Expire le', expirationDate)}
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Instruction -->
          <tr>
            <td style="padding: 0 40px 24px;">
              <p style="margin: 0; color: ${DS.textSecondary}; font-size: 15px; line-height: 1.7;">
                Cliquez sur le bouton ci-dessous pour cr\u00e9er votre compte et renseigner les informations de votre entreprise\u00a0:
              </p>
            </td>
          </tr>

          <!-- CTA -->
          <tr>
            <td style="padding: 0 40px 28px;">
              ${ctaButton('Cr\u00e9er mon compte', invitationUrl)}
            </td>
          </tr>

          <!-- Fallback link -->
          <tr>
            <td style="padding: 0 40px 8px;">
              <p style="margin: 0; color: ${DS.textMuted}; font-size: 12px; line-height: 1.6;">
                Si le bouton ne fonctionne pas, copiez et collez ce lien\u00a0:<br>
                <a href="${invitationUrl}" style="color: ${DS.primary}; text-decoration: underline; word-break: break-all; font-size: 12px;">${invitationUrl}</a>
              </p>
            </td>
          </tr>`;

  const htmlContent = emailWrapper(
    emailHeader({ subtitle: 'Portail Partenaires B2B' }) +
    body +
    emailFooter('Cette invitation est personnelle et expire dans 7 jours. Pour des raisons de s\u00e9curit\u00e9, elle ne peut \u00eatre utilis\u00e9e que par ' + to + '.')
  );

  const textContent = `
Bienvenue ${fullName} !

Vous avez \u00e9t\u00e9 invit\u00e9(e) \u00e0 rejoindre le portail partenaires Market Spas.

Email : ${to}
Expire le : ${expirationDate}

Pour cr\u00e9er votre compte, cliquez sur ce lien :
${invitationUrl}

Cette invitation est personnelle et expire dans 7 jours.

\u00a9 ${new Date().getFullYear()} Market Spas. Tous droits r\u00e9serv\u00e9s.
  `.trim();

  try {
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: [to],
      subject: `Invitation \u00e0 rejoindre Market Spas \u2014 Portail Partenaires`,
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
// 2. NEW ORDER NOTIFICATION FOR ADMINS
// ============================================

interface OrderItem {
  name: string;
  quantity: number;
  unitPriceHT: number | string;
  totalHT: number | string;
  color?: string;
}

interface NewOrderNotificationParams {
  orderNumber: string;
  partnerName: string;
  partnerEmail: string;
  items: OrderItem[];
  totalHT: number | string;
  shippingCostHT: number | string;
  depositAmount: number | string;
  remainingBalance: number | string;
  deliveryStreet: string;
  deliveryCity: string;
  deliveryPostalCode: string;
  deliveryCountry: string;
  deliveryContactName: string;
  deliveryContactPhone: string;
  createdAt: Date;
  portalUrl: string;
}

export async function sendNewOrderNotificationToAdmins(
  adminEmails: string[],
  params: NewOrderNotificationParams
): Promise<{ success: boolean; results: Array<{ email: string; success: boolean; messageId?: string; error?: string }> }> {
  const {
    orderNumber, partnerName, partnerEmail, items, totalHT, shippingCostHT,
    depositAmount, remainingBalance, deliveryStreet, deliveryCity,
    deliveryPostalCode, deliveryCountry, deliveryContactName, deliveryContactPhone,
    createdAt, portalUrl,
  } = params;

  const formattedDate = formatDate(new Date(createdAt));

  const itemsHtml = items.map(item => `
    <tr>
      <td style="padding: 10px 12px; border-bottom: 1px solid ${DS.border}; color: ${DS.text}; font-size: 13px;">
        ${item.name}${item.color ? `<br><span style="color: ${DS.textMuted}; font-size: 11px;">Couleur : ${item.color}</span>` : ''}
      </td>
      <td style="padding: 10px 8px; border-bottom: 1px solid ${DS.border}; text-align: center; color: ${DS.text}; font-size: 13px;">${item.quantity}</td>
      <td style="padding: 10px 8px; border-bottom: 1px solid ${DS.border}; text-align: right; color: ${DS.text}; font-size: 13px;">${formatPrice(item.unitPriceHT)}\u00a0\u20ac</td>
      <td style="padding: 10px 12px; border-bottom: 1px solid ${DS.border}; text-align: right; color: ${DS.text}; font-size: 13px; font-weight: 600;">${formatPrice(item.totalHT)}\u00a0\u20ac</td>
    </tr>`).join('');

  const fullAddress = [deliveryStreet, `${deliveryPostalCode} ${deliveryCity}`, countryNames[deliveryCountry] || deliveryCountry].filter(Boolean).join(', ');

  const body = `
          <!-- Banner -->
          <tr>
            <td style="padding: 20px 40px; background-color: ${DS.successLight}; border-bottom: 1px solid #a7f3d0;">
              <table role="presentation" cellpadding="0" cellspacing="0" style="width: 100%;">
                <tr>
                  <td style="width: 36px; vertical-align: top; padding-top: 2px;">
                    <span style="font-size: 20px;">\ud83d\udce8</span>
                  </td>
                  <td>
                    <p style="margin: 0; color: ${DS.successDark}; font-size: 14px; font-weight: 600;">Nouvelle commande sur le portail B2B</p>
                    <p style="margin: 4px 0 0; color: ${DS.success}; font-size: 12px;">${formattedDate}</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          ${sectionTitle('\ud83d\udc64', 'Partenaire')}
          <tr>
            <td style="padding: 0 40px 20px;">
              <table role="presentation" cellpadding="0" cellspacing="0" style="width: 100%;">
                ${infoRow('Entreprise', partnerName, { bold: true })}
                ${infoRow('Email', `<a href="mailto:${partnerEmail}" style="color: ${DS.primary}; text-decoration: none;">${partnerEmail}</a>`)}
                ${infoRow('Livraison', `${deliveryStreet ? deliveryStreet + '<br>' : ''}${deliveryPostalCode} ${deliveryCity}${deliveryCountry ? ', ' + (countryNames[deliveryCountry] || deliveryCountry) : ''}`)}
                ${deliveryContactName ? infoRow('Contact', `${deliveryContactName}${deliveryContactPhone ? ' \u2014 ' + deliveryContactPhone : ''}`) : ''}
              </table>
            </td>
          </tr>

          ${sectionTitle('\ud83d\udce6', 'D\u00e9tails de la commande')}
          <tr>
            <td style="padding: 0 40px 20px;">
              <table role="presentation" cellpadding="0" cellspacing="0" style="width: 100%; border-collapse: collapse;">
                <thead>
                  <tr style="background-color: ${DS.bgSubtle};">
                    <th style="padding: 10px 12px; text-align: left; color: ${DS.textMuted}; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Produit</th>
                    <th style="padding: 10px 8px; text-align: center; color: ${DS.textMuted}; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Qt\u00e9</th>
                    <th style="padding: 10px 8px; text-align: right; color: ${DS.textMuted}; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Prix HT</th>
                    <th style="padding: 10px 12px; text-align: right; color: ${DS.textMuted}; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Total HT</th>
                  </tr>
                </thead>
                <tbody>${itemsHtml}</tbody>
              </table>

              <!-- Totals -->
              <table role="presentation" cellpadding="0" cellspacing="0" style="width: 100%; margin-top: 16px;">
                ${infoRow('Sous-total HT', formatPrice(totalHT) + '\u00a0\u20ac', { bold: true })}
                ${parseFloat(String(shippingCostHT)) > 0 ? infoRow('Frais de livraison HT', formatPrice(shippingCostHT) + '\u00a0\u20ac') : ''}
                <tr>
                  <td colspan="2" style="padding: 8px 0 0;"><hr style="border: none; border-top: 2px solid ${DS.border}; margin: 0;"></td>
                </tr>
                <tr>
                  <td style="padding: 10px 0; color: ${DS.text}; font-size: 16px; font-weight: 700;">Total HT</td>
                  <td style="padding: 10px 0; text-align: right; color: ${DS.success}; font-size: 18px; font-weight: 700;">${formatPrice(parseFloat(String(totalHT)) + parseFloat(String(shippingCostHT)))}\u00a0\u20ac</td>
                </tr>
              </table>

              <!-- Deposit -->
              <table role="presentation" cellpadding="0" cellspacing="0" style="width: 100%; margin-top: 12px; background-color: ${DS.successLight}; border-radius: 8px;">
                <tr>
                  <td style="padding: 14px 18px;">
                    <table role="presentation" cellpadding="0" cellspacing="0" style="width: 100%;">
                      <tr>
                        <td style="padding: 4px 0; color: ${DS.successDark}; font-size: 13px; font-weight: 600;">Acompte \u00e0 r\u00e9gler</td>
                        <td style="padding: 4px 0; text-align: right; color: ${DS.success}; font-size: 15px; font-weight: 700;">${formatPrice(depositAmount)}\u00a0\u20ac HT</td>
                      </tr>
                      <tr>
                        <td colspan="2" style="padding: 4px 0 0;"><hr style="border: none; border-top: 1px solid #a7f3d0; margin: 0;"></td>
                      </tr>
                      <tr>
                        <td style="padding: 4px 0; color: ${DS.textSecondary}; font-size: 12px;">Solde restant</td>
                        <td style="padding: 4px 0; text-align: right; color: ${DS.text}; font-size: 13px; font-weight: 600;">${formatPrice(remainingBalance)}\u00a0\u20ac HT</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- CTA -->
          <tr>
            <td style="padding: 8px 40px 32px;">
              ${ctaButton('Voir la commande', portalUrl + '/admin/orders', { gradient: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)', color: '#2563eb' })}
            </td>
          </tr>`;

  const htmlContent = emailWrapper(
    emailHeader({ subtitle: `Nouvelle commande #${orderNumber}`, accentGradient: 'linear-gradient(135deg, #10b981 0%, #059669 100%)' }) +
    body +
    emailFooter()
  );

  const textContent = `
NOUVELLE COMMANDE - #${orderNumber}
=====================================

Date : ${formattedDate}

PARTENAIRE
----------
Entreprise : ${partnerName}
Email : ${partnerEmail}
Livraison : ${fullAddress}
${deliveryContactName ? `Contact : ${deliveryContactName}${deliveryContactPhone ? ' - ' + deliveryContactPhone : ''}` : ''}

ARTICLES
--------
${items.map(i => `- ${i.name} x${i.quantity} = ${formatPrice(i.totalHT)} \u20ac HT`).join('\n')}

Total HT : ${formatPrice(parseFloat(String(totalHT)) + parseFloat(String(shippingCostHT)))} \u20ac
Acompte : ${formatPrice(depositAmount)} \u20ac HT
Solde : ${formatPrice(remainingBalance)} \u20ac HT

Voir la commande : ${portalUrl}/admin/orders

---
\u00a9 ${new Date().getFullYear()} Market Spas. Tous droits r\u00e9serv\u00e9s.
  `.trim();

  const results: Array<{ email: string; success: boolean; messageId?: string; error?: string }> = [];
  let allSuccess = true;

  for (const adminEmail of adminEmails) {
    try {
      const { data, error } = await resend.emails.send({
        from: FROM_EMAIL,
        to: [adminEmail],
        subject: `Nouvelle commande #${orderNumber} \u2014 ${partnerName}`,
        html: htmlContent,
        text: textContent,
      });
      if (error) {
        console.error(`[Email] Error sending new order notification to ${adminEmail}:`, error);
        results.push({ email: adminEmail, success: false, error: error.message });
        allSuccess = false;
      } else {
        console.log(`[Email] New order notification sent to ${adminEmail}:`, data?.id);
        results.push({ email: adminEmail, success: true, messageId: data?.id });
      }
    } catch (error) {
      console.error(`[Email] Exception sending to ${adminEmail}:`, error);
      results.push({ email: adminEmail, success: false, error: error instanceof Error ? error.message : String(error) });
      allSuccess = false;
    }
  }

  return { success: allSuccess, results };
}


// ============================================
// HELPER: GET ADMIN EMAILS
// ============================================

export async function getAdminEmails(): Promise<string[]> {
  return [];
}


// ============================================
// 3. ORDER STATUS CHANGE NOTIFICATION
// ============================================

interface OrderStatusChangeParams {
  orderNumber: string;
  partnerName: string;
  contactName: string;
  oldStatus: string;
  newStatus: string;
  totalHT: number | string;
  depositAmount?: number | string;
  remainingBalance?: number | string;
  portalUrl: string;
  trackingNumber?: string;
  estimatedDelivery?: string;
}

export async function sendOrderStatusChangeToPartner(
  partnerEmail: string,
  params: OrderStatusChangeParams
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const { orderNumber, partnerName, contactName, oldStatus, newStatus, totalHT, depositAmount, remainingBalance, portalUrl, trackingNumber, estimatedDelivery } = params;

  const statusInfo = orderStatusConfig[newStatus] || { label: newStatus, emoji: "\ud83d\udccb", color: DS.textSecondary, bgColor: DS.bgSubtle, message: "Le statut de votre commande a \u00e9t\u00e9 mis \u00e0 jour." };
  const oldStatusInfo = orderStatusConfig[oldStatus] || { label: oldStatus, emoji: "\ud83d\udccb", color: DS.textSecondary, bgColor: DS.bgSubtle, message: "" };

  const trackingHtml = trackingNumber ? `
          <tr>
            <td style="padding: 0 40px 24px;">
              <table role="presentation" cellpadding="0" cellspacing="0" style="width: 100%; background-color: #f0f9ff; border-radius: 8px;">
                <tr>
                  <td style="padding: 16px 20px;">
                    <p style="margin: 0 0 8px; color: #0369a1; font-size: 13px; font-weight: 600;">\ud83d\udccd Informations de suivi</p>
                    <p style="margin: 0; color: ${DS.text}; font-size: 13px;"><strong>N\u00b0 de suivi :</strong> ${trackingNumber}</p>
                    ${estimatedDelivery ? `<p style="margin: 4px 0 0; color: ${DS.text}; font-size: 13px;"><strong>Livraison estim\u00e9e :</strong> ${estimatedDelivery}</p>` : ''}
                  </td>
                </tr>
              </table>
            </td>
          </tr>` : '';

  const body = `
          <!-- Order Number -->
          <tr>
            <td style="padding: 28px 40px 16px; text-align: center;">
              <p style="margin: 0; color: ${DS.textMuted}; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">Commande</p>
              <p style="margin: 6px 0 0; color: ${DS.text}; font-size: 22px; font-weight: 700; letter-spacing: -0.5px;">#${orderNumber}</p>
            </td>
          </tr>

          <!-- Status Change -->
          <tr>
            <td style="padding: 0 40px 24px;">
              <table role="presentation" cellpadding="0" cellspacing="0" style="width: 100%;">
                <tr>
                  <td style="width: 44%; text-align: center; padding: 12px;">
                    <p style="margin: 0 0 6px; color: ${DS.textMuted}; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px;">Ancien statut</p>
                    <span style="display: inline-block; padding: 7px 14px; background-color: #f1f5f9; color: ${DS.textSecondary}; border-radius: 16px; font-size: 12px; text-decoration: line-through;">
                      ${oldStatusInfo.emoji} ${oldStatusInfo.label}
                    </span>
                  </td>
                  <td style="width: 12%; text-align: center; color: ${DS.textMuted}; font-size: 18px;">\u2192</td>
                  <td style="width: 44%; text-align: center; padding: 12px;">
                    <p style="margin: 0 0 6px; color: ${DS.textMuted}; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px;">Nouveau statut</p>
                    <span style="display: inline-block; padding: 8px 16px; background-color: ${statusInfo.bgColor}; color: ${statusInfo.color}; border-radius: 16px; font-size: 13px; font-weight: 600;">
                      ${statusInfo.emoji} ${statusInfo.label}
                    </span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Message -->
          <tr>
            ${alertBox(statusInfo.message, newStatus === 'CANCELLED' ? 'danger' : 'info')}
          </tr>

          ${trackingHtml}

          <!-- Summary -->
          <tr>
            <td style="padding: 20px 40px;">
              <table role="presentation" cellpadding="0" cellspacing="0" style="width: 100%; background-color: ${DS.bgSubtle}; border-radius: 8px;">
                <tr>
                  <td style="padding: 18px 22px;">
                    <p style="margin: 0 0 12px; color: ${DS.text}; font-size: 14px; font-weight: 600;">R\u00e9capitulatif</p>
                    <table role="presentation" cellpadding="0" cellspacing="0" style="width: 100%;">
                      ${infoRow('Entreprise', partnerName)}
                      ${infoRow('Total HT', formatPrice(totalHT) + '\u00a0\u20ac', { bold: true })}
                      ${depositAmount ? infoRow('Acompte pay\u00e9', formatPrice(depositAmount) + '\u00a0\u20ac', { color: DS.success }) : ''}
                      ${remainingBalance ? infoRow('Solde restant', formatPrice(remainingBalance) + '\u00a0\u20ac', { bold: true }) : ''}
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- CTA -->
          <tr>
            <td style="padding: 8px 40px 32px;">
              ${ctaButton('Suivre ma commande', portalUrl + '/order/' + orderNumber)}
            </td>
          </tr>`;

  const htmlContent = emailWrapper(
    emailHeader({ subtitle: 'Mise \u00e0 jour de votre commande' }) +
    body +
    emailFooter('Une question ? Contactez notre \u00e9quipe via le portail partenaires.')
  );

  const textContent = `
MISE \u00c0 JOUR DE VOTRE COMMANDE
=============================

Bonjour ${contactName},

Le statut de votre commande #${orderNumber} a \u00e9t\u00e9 mis \u00e0 jour.

${oldStatusInfo.emoji} ${oldStatusInfo.label} \u2192 ${statusInfo.emoji} ${statusInfo.label}

${statusInfo.message}
${trackingNumber ? `N\u00b0 de suivi : ${trackingNumber}` : ''}
${estimatedDelivery ? `Livraison estim\u00e9e : ${estimatedDelivery}` : ''}

Entreprise : ${partnerName}
Total HT : ${formatPrice(totalHT)} \u20ac
${depositAmount ? `Acompte pay\u00e9 : ${formatPrice(depositAmount)} \u20ac` : ''}
${remainingBalance ? `Solde restant : ${formatPrice(remainingBalance)} \u20ac` : ''}

Suivre ma commande : ${portalUrl}/order/${orderNumber}

---
\u00a9 ${new Date().getFullYear()} Market Spas. Tous droits r\u00e9serv\u00e9s.
  `.trim();

  try {
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: [partnerEmail],
      subject: `${statusInfo.emoji} Commande #${orderNumber} \u2014 ${statusInfo.label}`,
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
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }
}


// ============================================
// 4. DEPOSIT REMINDER EMAIL
// ============================================

interface DepositReminderParams {
  orderNumber: string;
  partnerName: string;
  contactName: string;
  depositAmount: number | string;
  totalHT: number | string;
  orderDate: Date;
  portalUrl: string;
  hoursOverdue: number;
}

export async function sendDepositReminderEmail(
  partnerEmail: string,
  params: DepositReminderParams
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const { orderNumber, partnerName, contactName, depositAmount, totalHT, orderDate, portalUrl, hoursOverdue } = params;

  const isUrgent = hoursOverdue >= 72;
  const urgencyColor = isUrgent ? DS.danger : DS.warning;
  const urgencyGradient = isUrgent
    ? 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)'
    : 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)';
  const urgencyMessage = isUrgent
    ? 'Votre commande risque d\u2019\u00eatre annul\u00e9e si le paiement n\u2019est pas effectu\u00e9 rapidement.'
    : 'Nous vous rappelons qu\u2019un acompte est n\u00e9cessaire pour confirmer votre commande.';

  const body = `
          <!-- Greeting -->
          <tr>
            <td style="padding: 28px 40px 16px;">
              <p style="margin: 0; color: ${DS.text}; font-size: 15px; line-height: 1.6;">
                Bonjour <strong>${contactName}</strong>,
              </p>
            </td>
          </tr>

          <!-- Alert -->
          <tr>
            ${alertBox(urgencyMessage, isUrgent ? 'danger' : 'warning')}
          </tr>

          <!-- Order Details -->
          <tr>
            <td style="padding: 0 40px 24px;">
              <table role="presentation" cellpadding="0" cellspacing="0" style="width: 100%; background-color: ${DS.bgSubtle}; border-radius: 8px;">
                <tr>
                  <td style="padding: 20px 22px;">
                    <p style="margin: 0 0 14px; color: ${DS.text}; font-size: 14px; font-weight: 600;">D\u00e9tails de la commande</p>
                    <table role="presentation" cellpadding="0" cellspacing="0" style="width: 100%;">
                      ${infoRow('N\u00b0 de commande', '#' + orderNumber, { bold: true })}
                      ${infoRow('Date de commande', formatDateShort(orderDate))}
                      ${infoRow('Entreprise', partnerName)}
                      <tr><td colspan="2" style="padding: 8px 0;"><hr style="border: none; border-top: 1px solid ${DS.border}; margin: 0;"></td></tr>
                      ${infoRow('Total HT', formatPrice(totalHT) + '\u00a0\u20ac')}
                      <tr>
                        <td style="padding: 7px 0; color: ${urgencyColor}; font-size: 14px; font-weight: 600;">Acompte \u00e0 r\u00e9gler</td>
                        <td style="padding: 7px 0; text-align: right; color: ${urgencyColor}; font-size: 16px; font-weight: 700;">${formatPrice(depositAmount)}\u00a0\u20ac</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- CTA -->
          <tr>
            <td style="padding: 0 40px 20px;">
              ${ctaButton('Payer mon acompte', portalUrl + '/order/' + orderNumber, { gradient: urgencyGradient, color: urgencyColor })}
            </td>
          </tr>

          <!-- Help -->
          <tr>
            <td style="padding: 0 40px 8px;">
              <p style="margin: 0; color: ${DS.textMuted}; font-size: 12px; text-align: center; line-height: 1.6;">
                Vous avez d\u00e9j\u00e0 effectu\u00e9 le paiement ? Ignorez ce message.<br>
                Une question ? Contactez notre \u00e9quipe via le portail partenaires.
              </p>
            </td>
          </tr>`;

  const subjectEmoji = isUrgent ? '\ud83d\udea8' : '\ud83d\udcb3';
  const subjectText = isUrgent ? 'URGENT' : 'Rappel';

  const htmlContent = emailWrapper(
    emailHeader({ subtitle: 'Acompte en attente', accentGradient: urgencyGradient }) +
    body +
    emailFooter()
  );

  const textContent = `
RAPPEL DE PAIEMENT \u2014 ACOMPTE EN ATTENTE

Bonjour ${contactName},

${urgencyMessage}

N\u00b0 de commande : #${orderNumber}
Date : ${formatDateShort(orderDate)}
Entreprise : ${partnerName}
Total HT : ${formatPrice(totalHT)} \u20ac
Acompte \u00e0 r\u00e9gler : ${formatPrice(depositAmount)} \u20ac

Payer : ${portalUrl}/order/${orderNumber}

---
\u00a9 ${new Date().getFullYear()} Market Spas. Tous droits r\u00e9serv\u00e9s.
  `.trim();

  try {
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: [partnerEmail],
      subject: `${subjectEmoji} ${subjectText} : Acompte en attente \u2014 Commande #${orderNumber}`,
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
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }
}


// ============================================
// 5. PASSWORD RESET EMAIL
// ============================================

export async function sendPasswordResetEmail(
  email: string,
  resetToken: string,
  resetUrl: string
) {
  const body = `
          <!-- Greeting -->
          <tr>
            <td style="padding: 32px 40px 16px;">
              <h2 style="margin: 0 0 16px; color: ${DS.text}; font-size: 20px; font-weight: 700;">Bonjour,</h2>
              <p style="margin: 0; color: ${DS.textSecondary}; font-size: 15px; line-height: 1.7;">
                Vous avez demand\u00e9 \u00e0 r\u00e9initialiser votre mot de passe pour acc\u00e9der au portail B2B Market Spas.
              </p>
            </td>
          </tr>

          <!-- Instruction -->
          <tr>
            <td style="padding: 0 40px 24px;">
              <p style="margin: 0; color: ${DS.textSecondary}; font-size: 15px; line-height: 1.7;">
                Cliquez sur le bouton ci-dessous pour cr\u00e9er un nouveau mot de passe\u00a0:
              </p>
            </td>
          </tr>

          <!-- CTA -->
          <tr>
            <td style="padding: 0 40px 24px;">
              ${ctaButton('R\u00e9initialiser mon mot de passe', resetUrl)}
            </td>
          </tr>

          <!-- Warning -->
          <tr>
            ${alertBox('<strong>Important :</strong> Ce lien est valable pendant 1 heure seulement. Si vous n\u2019avez pas demand\u00e9 cette r\u00e9initialisation, ignorez cet email.', 'warning')}
          </tr>

          <!-- Fallback link -->
          <tr>
            <td style="padding: 0 40px 8px;">
              <p style="margin: 0; color: ${DS.textMuted}; font-size: 12px; line-height: 1.6;">
                Si le bouton ne fonctionne pas, copiez et collez ce lien\u00a0:<br>
                <a href="${resetUrl}" style="color: ${DS.primary}; text-decoration: underline; word-break: break-all; font-size: 12px;">${resetUrl}</a>
              </p>
            </td>
          </tr>`;

  const htmlContent = emailWrapper(
    emailHeader({ subtitle: 'R\u00e9initialisation de mot de passe', accentGradient: 'linear-gradient(135deg, #64748b 0%, #475569 100%)' }) +
    body +
    emailFooter()
  );

  const textContent = `
R\u00c9INITIALISATION DE MOT DE PASSE
Market Spas \u2014 Portail B2B

Bonjour,

Vous avez demand\u00e9 \u00e0 r\u00e9initialiser votre mot de passe.

Cliquez sur ce lien : ${resetUrl}

Ce lien est valable pendant 1 heure.
Si vous n'avez pas demand\u00e9 cette r\u00e9initialisation, ignorez cet email.

---
\u00a9 ${new Date().getFullYear()} Market Spas. Tous droits r\u00e9serv\u00e9s.
  `.trim();

  try {
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: [email],
      subject: `R\u00e9initialisation de votre mot de passe \u2014 Market Spas`,
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
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }
}


// ============================================
// 6. PAYMENT CONFIRMATION EMAIL
// ============================================

export async function sendPaymentConfirmationEmail(
  email: string,
  orderNumber: string,
  amount: number,
  paymentMethod: string
) {
  const body = `
          <!-- Success Banner -->
          <tr>
            ${alertBox('<strong>Votre paiement a \u00e9t\u00e9 trait\u00e9 avec succ\u00e8s !</strong>', 'success')}
          </tr>

          <!-- Greeting -->
          <tr>
            <td style="padding: 0 40px 20px;">
              <h2 style="margin: 0 0 12px; color: ${DS.text}; font-size: 20px; font-weight: 700;">Bonjour,</h2>
              <p style="margin: 0; color: ${DS.textSecondary}; font-size: 15px; line-height: 1.7;">
                Nous avons bien re\u00e7u votre paiement pour la commande <strong style="color: ${DS.text};">#${orderNumber}</strong>.
              </p>
            </td>
          </tr>

          <!-- Payment Details -->
          <tr>
            <td style="padding: 0 40px 24px;">
              <table role="presentation" cellpadding="0" cellspacing="0" style="width: 100%; background-color: ${DS.bgSubtle}; border-radius: 8px; border: 1px solid ${DS.border};">
                <tr>
                  <td style="padding: 20px 22px;">
                    <p style="margin: 0 0 14px; color: ${DS.text}; font-size: 14px; font-weight: 600;">D\u00e9tails du paiement</p>
                    <table role="presentation" cellpadding="0" cellspacing="0" style="width: 100%;">
                      ${infoRow('N\u00b0 de commande', '#' + orderNumber, { bold: true })}
                      ${infoRow('Montant pay\u00e9', formatPrice(amount) + '\u00a0\u20ac', { bold: true, color: DS.success })}
                      ${infoRow('M\u00e9thode', paymentMethod)}
                      ${infoRow('Date', formatDate(new Date()))}
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Next steps -->
          <tr>
            <td style="padding: 0 40px 24px;">
              <p style="margin: 0; color: ${DS.textSecondary}; font-size: 14px; line-height: 1.7;">
                Votre commande est maintenant en cours de traitement. Vous recevrez une notification lorsqu\u2019elle sera exp\u00e9di\u00e9e.
              </p>
            </td>
          </tr>

          <!-- CTA -->
          <tr>
            <td style="padding: 0 40px 32px;">
              ${ctaButton('Voir ma commande', ENV.siteUrl + '/orders/' + orderNumber)}
            </td>
          </tr>`;

  const htmlContent = emailWrapper(
    emailHeader({ subtitle: 'Paiement confirm\u00e9', accentGradient: 'linear-gradient(135deg, #10b981 0%, #059669 100%)' }) +
    body +
    emailFooter()
  );

  const textContent = `
PAIEMENT CONFIRM\u00c9
Market Spas \u2014 Portail B2B

Bonjour,

Nous avons bien re\u00e7u votre paiement pour la commande #${orderNumber}.

N\u00b0 de commande : #${orderNumber}
Montant pay\u00e9 : ${formatPrice(amount)} \u20ac
M\u00e9thode : ${paymentMethod}
Date : ${formatDate(new Date())}

Voir ma commande : ${ENV.siteUrl}/orders/${orderNumber}

---
\u00a9 ${new Date().getFullYear()} Market Spas. Tous droits r\u00e9serv\u00e9s.
  `.trim();

  try {
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: [email],
      subject: `Paiement confirm\u00e9 \u2014 Commande #${orderNumber}`,
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
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }
}


// ============================================
// 7. PAYMENT FAILURE EMAIL
// ============================================

export async function sendPaymentFailureEmail(
  email: string,
  orderNumber: string,
  amount: number,
  reason: string
) {
  const body = `
          <!-- Error Banner -->
          <tr>
            ${alertBox('<strong>Votre paiement n\u2019a pas pu \u00eatre trait\u00e9</strong>', 'danger')}
          </tr>

          <!-- Greeting -->
          <tr>
            <td style="padding: 0 40px 20px;">
              <h2 style="margin: 0 0 12px; color: ${DS.text}; font-size: 20px; font-weight: 700;">Bonjour,</h2>
              <p style="margin: 0; color: ${DS.textSecondary}; font-size: 15px; line-height: 1.7;">
                Malheureusement, nous n\u2019avons pas pu traiter votre paiement pour la commande <strong style="color: ${DS.text};">#${orderNumber}</strong>.
              </p>
            </td>
          </tr>

          <!-- Details -->
          <tr>
            <td style="padding: 0 40px 24px;">
              <table role="presentation" cellpadding="0" cellspacing="0" style="width: 100%; background-color: ${DS.bgSubtle}; border-radius: 8px; border: 1px solid ${DS.border};">
                <tr>
                  <td style="padding: 20px 22px;">
                    <table role="presentation" cellpadding="0" cellspacing="0" style="width: 100%;">
                      ${infoRow('Raison', reason, { color: DS.danger })}
                      ${infoRow('Montant', formatPrice(amount) + '\u00a0\u20ac')}
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Help -->
          <tr>
            <td style="padding: 0 40px 24px;">
              <p style="margin: 0; color: ${DS.textSecondary}; font-size: 14px; line-height: 1.7;">
                Nous vous invitons \u00e0 r\u00e9essayer avec une autre m\u00e9thode de paiement ou \u00e0 contacter votre banque si le probl\u00e8me persiste.
              </p>
            </td>
          </tr>

          <!-- CTA -->
          <tr>
            <td style="padding: 0 40px 32px;">
              ${ctaButton('R\u00e9essayer le paiement', ENV.siteUrl + '/orders/' + orderNumber, { gradient: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)', color: '#2563eb' })}
            </td>
          </tr>`;

  const htmlContent = emailWrapper(
    emailHeader({ subtitle: '\u00c9chec du paiement', accentGradient: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)' }) +
    body +
    emailFooter()
  );

  const textContent = `
\u00c9CHEC DU PAIEMENT
Market Spas \u2014 Portail B2B

Bonjour,

Nous n'avons pas pu traiter votre paiement pour la commande #${orderNumber}.

Raison : ${reason}
Montant : ${formatPrice(amount)} \u20ac

R\u00e9essayer : ${ENV.siteUrl}/orders/${orderNumber}

---
\u00a9 ${new Date().getFullYear()} Market Spas. Tous droits r\u00e9serv\u00e9s.
  `.trim();

  try {
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: [email],
      subject: `\u00c9chec du paiement \u2014 Commande #${orderNumber}`,
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
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }
}


// ============================================
// 8. REFUND CONFIRMATION EMAIL
// ============================================

export async function sendRefundConfirmationEmail(
  email: string,
  orderNumber: string,
  amount: number
) {
  const body = `
          <!-- Info Banner -->
          <tr>
            ${alertBox('<strong>Votre remboursement a \u00e9t\u00e9 trait\u00e9</strong>', 'info')}
          </tr>

          <!-- Greeting -->
          <tr>
            <td style="padding: 0 40px 20px;">
              <h2 style="margin: 0 0 12px; color: ${DS.text}; font-size: 20px; font-weight: 700;">Bonjour,</h2>
              <p style="margin: 0; color: ${DS.textSecondary}; font-size: 15px; line-height: 1.7;">
                Nous avons proc\u00e9d\u00e9 au remboursement de votre commande <strong style="color: ${DS.text};">#${orderNumber}</strong>.
              </p>
            </td>
          </tr>

          <!-- Details -->
          <tr>
            <td style="padding: 0 40px 24px;">
              <table role="presentation" cellpadding="0" cellspacing="0" style="width: 100%; background-color: ${DS.bgSubtle}; border-radius: 8px; border: 1px solid ${DS.border};">
                <tr>
                  <td style="padding: 20px 22px;">
                    <table role="presentation" cellpadding="0" cellspacing="0" style="width: 100%;">
                      ${infoRow('Montant rembours\u00e9', formatPrice(amount) + '\u00a0\u20ac', { bold: true, color: DS.info })}
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Info -->
          <tr>
            <td style="padding: 0 40px 24px;">
              <p style="margin: 0; color: ${DS.textSecondary}; font-size: 14px; line-height: 1.7;">
                Le montant sera cr\u00e9dit\u00e9 sur votre compte bancaire sous 5 \u00e0 10 jours ouvr\u00e9s, selon votre banque.
                Si vous avez des questions, n\u2019h\u00e9sitez pas \u00e0 nous contacter via le portail partenaires.
              </p>
            </td>
          </tr>

          <!-- CTA -->
          <tr>
            <td style="padding: 0 40px 32px;">
              ${ctaButton('Voir ma commande', ENV.siteUrl + '/orders/' + orderNumber)}
            </td>
          </tr>`;

  const htmlContent = emailWrapper(
    emailHeader({ subtitle: 'Remboursement effectu\u00e9', accentGradient: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)' }) +
    body +
    emailFooter()
  );

  const textContent = `
REMBOURSEMENT EFFECTU\u00c9
Market Spas \u2014 Portail B2B

Bonjour,

Nous avons proc\u00e9d\u00e9 au remboursement de votre commande #${orderNumber}.

Montant rembours\u00e9 : ${formatPrice(amount)} \u20ac

Le montant sera cr\u00e9dit\u00e9 sous 5 \u00e0 10 jours ouvr\u00e9s.

Voir ma commande : ${ENV.siteUrl}/orders/${orderNumber}

---
\u00a9 ${new Date().getFullYear()} Market Spas. Tous droits r\u00e9serv\u00e9s.
  `.trim();

  try {
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: [email],
      subject: `Remboursement effectu\u00e9 \u2014 Commande #${orderNumber}`,
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
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }
}


// ============================================
// 9. NEWSLETTER EMAIL
// ============================================

export async function sendNewsletterEmail(
  recipients: string[],
  subject: string,
  htmlContent: string,
  textContent?: string
): Promise<{ success: boolean; results: Array<{ email: string; success: boolean; messageId?: string; error?: string }> }> {
  const results: Array<{ email: string; success: boolean; messageId?: string; error?: string }> = [];

  const batchSize = 10;
  for (let i = 0; i < recipients.length; i += batchSize) {
    const batch = recipients.slice(i, i + batchSize);

    const batchPromises = batch.map(async (email) => {
      try {
        const { data, error } = await resend.emails.send({
          from: FROM_EMAIL,
          to: [email],
          subject,
          html: htmlContent,
          text: textContent || '',
        });
        if (error) {
          console.error(`[Email] Error sending newsletter to ${email}:`, error);
          return { email, success: false, error: error.message };
        }
        console.log(`[Email] Newsletter sent to ${email}:`, data?.id);
        return { email, success: true, messageId: data?.id };
      } catch (error) {
        console.error(`[Email] Exception sending newsletter to ${email}:`, error);
        return { email, success: false, error: error instanceof Error ? error.message : String(error) };
      }
    });

    const batchResults = await Promise.all(batchPromises);
    results.push(...batchResults);

    if (i + batchSize < recipients.length) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  const successCount = results.filter(r => r.success).length;
  console.log(`[Email] Newsletter sent: ${successCount}/${recipients.length} successful`);

  return { success: successCount > 0, results };
}


// ============================================
// 10. NEWSLETTER TEMPLATE BUILDER
// ============================================

export function createNewsletterTemplate(
  title: string,
  content: string,
  ctaText?: string,
  ctaUrl?: string
): string {
  const ctaHtml = ctaText && ctaUrl ? `
          <!-- CTA -->
          <tr>
            <td style="padding: 0 40px 32px;">
              ${ctaButton(ctaText, ctaUrl)}
            </td>
          </tr>` : '';

  return emailWrapper(
    emailHeader({ subtitle: 'Portail Partenaires B2B' }) + `
          <!-- Title -->
          <tr>
            <td style="padding: 32px 40px 16px;">
              <h2 style="margin: 0; color: ${DS.text}; font-size: 22px; font-weight: 700; line-height: 1.3; letter-spacing: -0.3px;">
                ${title}
              </h2>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 0 40px 28px;">
              <div style="color: ${DS.textSecondary}; font-size: 15px; line-height: 1.7;">
                ${content}
              </div>
            </td>
          </tr>
          ${ctaHtml}` +
    emailFooter('Vous recevez cet email car vous \u00eates partenaire Market Spas.<br><a href="{{unsubscribeUrl}}" style="color: ' + DS.textMuted + '; text-decoration: underline;">Se d\u00e9sabonner</a>')
  );
}


// ============================================
// 11. ORDER REFUSED EMAIL
// ============================================

export async function sendOrderRefusedEmail(
  email: string,
  orderNumber: string,
  depositAmount: number,
  totalAmount: number,
  partnerName?: string
) {
  const greeting = partnerName ? `Bonjour ${partnerName},` : 'Bonjour,';

  const body = `
          <!-- Alert -->
          <tr>
            ${alertBox(`Votre commande <strong>#${orderNumber}</strong> a \u00e9t\u00e9 annul\u00e9e car le paiement de l\u2019acompte n\u2019a pas \u00e9t\u00e9 re\u00e7u dans le d\u00e9lai imparti de 3 jours.`, 'danger')}
          </tr>

          <!-- Greeting -->
          <tr>
            <td style="padding: 0 40px 20px;">
              <h2 style="margin: 0 0 12px; color: ${DS.text}; font-size: 20px; font-weight: 700;">${greeting}</h2>
              <p style="margin: 0; color: ${DS.textSecondary}; font-size: 14px; line-height: 1.7;">
                Nous vous informons que votre commande <strong style="color: ${DS.text};">#${orderNumber}</strong> a \u00e9t\u00e9 automatiquement refus\u00e9e car nous n\u2019avons pas re\u00e7u le virement bancaire correspondant \u00e0 l\u2019acompte dans les 3 jours suivant la validation.
              </p>
            </td>
          </tr>

          <!-- Details -->
          <tr>
            <td style="padding: 0 40px 24px;">
              <table role="presentation" cellpadding="0" cellspacing="0" style="width: 100%; background-color: ${DS.bgSubtle}; border-radius: 8px; border: 1px solid ${DS.border};">
                <tr>
                  <td style="padding: 20px 22px;">
                    <table role="presentation" cellpadding="0" cellspacing="0" style="width: 100%;">
                      ${infoRow('Commande', '#' + orderNumber, { bold: true })}
                      ${infoRow('Acompte attendu', formatPrice(depositAmount) + '\u00a0\u20ac', { color: DS.danger, bold: true })}
                      ${infoRow('Montant total', formatPrice(totalAmount) + '\u00a0\u20ac')}
                      ${infoRow('Statut', 'Refus\u00e9e', { color: DS.danger, bold: true })}
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Consequences -->
          <tr>
            <td style="padding: 0 40px 20px;">
              <p style="margin: 0 0 8px; color: ${DS.text}; font-size: 14px; font-weight: 600;">Cons\u00e9quences :</p>
              <table role="presentation" cellpadding="0" cellspacing="0">
                <tr><td style="padding: 3px 0; color: ${DS.textSecondary}; font-size: 13px;">\u2022 Les produits r\u00e9serv\u00e9s ont \u00e9t\u00e9 remis en stock</td></tr>
                <tr><td style="padding: 3px 0; color: ${DS.textSecondary}; font-size: 13px;">\u2022 La commande est d\u00e9finitivement annul\u00e9e</td></tr>
                <tr><td style="padding: 3px 0; color: ${DS.textSecondary}; font-size: 13px;">\u2022 Aucun montant n\u2019a \u00e9t\u00e9 d\u00e9bit\u00e9</td></tr>
              </table>
            </td>
          </tr>

          <!-- Note -->
          <tr>
            ${alertBox('<strong>Vous souhaitez repasser commande ?</strong> Les produits sont de nouveau disponibles dans le catalogue. N\u2019h\u00e9sitez pas \u00e0 repasser commande et \u00e0 effectuer le virement dans les 3 jours.', 'warning')}
          </tr>

          <!-- CTA -->
          <tr>
            <td style="padding: 0 40px 24px;">
              ${ctaButton('Voir le catalogue', ENV.siteUrl + '/catalog')}
            </td>
          </tr>

          <!-- Help -->
          <tr>
            <td style="padding: 0 40px 8px;">
              <p style="margin: 0; color: ${DS.textMuted}; font-size: 12px; line-height: 1.6;">
                Si vous avez effectu\u00e9 un virement qui n\u2019a pas encore \u00e9t\u00e9 trait\u00e9, veuillez nous contacter directement pour r\u00e9gulariser la situation.
              </p>
            </td>
          </tr>`;

  const htmlContent = emailWrapper(
    emailHeader({ subtitle: 'Commande refus\u00e9e', accentGradient: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)' }) +
    body +
    emailFooter()
  );

  const textContent = `
COMMANDE REFUS\u00c9E
Market Spas \u2014 Portail B2B

${greeting}

Votre commande #${orderNumber} a \u00e9t\u00e9 automatiquement refus\u00e9e car le paiement de l'acompte n'a pas \u00e9t\u00e9 re\u00e7u dans le d\u00e9lai imparti de 3 jours.

Commande : #${orderNumber}
Acompte attendu : ${formatPrice(depositAmount)} \u20ac
Montant total : ${formatPrice(totalAmount)} \u20ac
Statut : Refus\u00e9e

Cons\u00e9quences :
- Les produits r\u00e9serv\u00e9s ont \u00e9t\u00e9 remis en stock
- La commande est d\u00e9finitivement annul\u00e9e
- Aucun montant n'a \u00e9t\u00e9 d\u00e9bit\u00e9

Voir le catalogue : ${ENV.siteUrl}/catalog

---
\u00a9 ${new Date().getFullYear()} Market Spas. Tous droits r\u00e9serv\u00e9s.
  `.trim();

  try {
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: [email],
      subject: `Commande #${orderNumber} refus\u00e9e \u2014 Paiement non re\u00e7u`,
      html: htmlContent,
      text: textContent,
    });
    if (error) {
      console.error(`[Email] Error sending order refused to ${email}:`, error);
      return { success: false, error: error.message };
    }
    console.log(`[Email] Order refused email sent to ${email}:`, data?.id);
    return { success: true, messageId: data?.id };
  } catch (error) {
    console.error(`[Email] Exception sending order refused to ${email}:`, error);
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }
}
