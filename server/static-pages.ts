// Static HTML pages for Google OAuth validation
// These pages must be accessible without authentication

export function getPrivacyHTML(): string {
  return `<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Politique de Confidentialité - Market Spas B2B</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; background: linear-gradient(135deg, #f8fafc 0%, #e0f2fe 100%); padding: 20px; }
        .container { max-width: 900px; margin: 0 auto; background: white; padding: 40px; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
        h1 { color: #1e40af; margin-bottom: 20px; font-size: 2em; }
        h2 { color: #1e3a8a; margin-top: 30px; margin-bottom: 15px; font-size: 1.5em; }
        p { margin-bottom: 15px; }
        ul { margin-left: 30px; margin-bottom: 15px; }
        li { margin-bottom: 8px; }
        a { color: #2563eb; text-decoration: none; }
        a:hover { text-decoration: underline; }
        .date { color: #64748b; margin-bottom: 30px; }
        .contact-box { background: #f1f5f9; padding: 20px; border-radius: 6px; margin-top: 20px; }
        .nav { margin-bottom: 30px; padding-bottom: 20px; border-bottom: 1px solid #e2e8f0; }
        .nav a { margin-right: 20px; font-weight: 500; }
    </style>
</head>
<body>
    <div class="container">
        <div class="nav">
            <a href="/">Market Spas B2B</a>
            <a href="/privacy">Confidentialité</a>
            <a href="/terms">Conditions</a>
        </div>
        <h1>Politique de Confidentialité</h1>
        <p class="date">Dernière mise à jour : 14 février 2026</p>

        <h2>1. Introduction</h2>
        <p>Market Spas ("nous", "notre", "nos") s'engage à protéger la confidentialité de vos données personnelles. Cette politique de confidentialité explique comment nous collectons, utilisons, partageons et protégeons vos informations lorsque vous utilisez notre portail B2B.</p>

        <h2>2. Données Collectées</h2>
        <p>Nous collectons les types de données suivants :</p>
        <ul>
            <li>Informations d'identification : nom, prénom, adresse e-mail</li>
            <li>Informations professionnelles : nom de l'entreprise, numéro de TVA, adresse</li>
            <li>Données de connexion : adresse IP, type de navigateur, pages visitées</li>
            <li>Données de commande : historique des achats, préférences produits</li>
            <li>Données Google Ads : identifiant client, tokens d'accès OAuth, statistiques de campagnes publicitaires</li>
        </ul>

        <h2>3. Utilisation des Données</h2>
        <p>Nous utilisons vos données pour :</p>
        <ul>
            <li>Gérer votre compte et vos commandes</li>
            <li>Traiter vos paiements de manière sécurisée</li>
            <li>Vous envoyer des notifications importantes concernant vos commandes</li>
            <li>Améliorer nos services et personnaliser votre expérience</li>
            <li>Afficher les statistiques de vos campagnes publicitaires Google Ads</li>
            <li>Respecter nos obligations légales et réglementaires</li>
        </ul>

        <h2>4. Intégration Google Ads</h2>
        <p>Notre portail s'intègre avec Google Ads pour vous permettre de suivre vos campagnes publicitaires. Lorsque vous connectez votre compte Google Ads :</p>
        <ul>
            <li>Nous accédons à vos données de campagnes publicitaires Google Ads via l'API Google Ads</li>
            <li>Nous stockons votre identifiant client Google Ads et les tokens d'accès OAuth de manière sécurisée</li>
            <li>Nous affichons les statistiques de vos campagnes (impressions, clics, dépenses, conversions)</li>
            <li>Vous pouvez révoquer l'accès à tout moment depuis votre compte Google ou notre interface</li>
        </ul>
        <p>L'utilisation de l'API Google Ads est soumise aux <a href="https://developers.google.com/terms" target="_blank" rel="noopener noreferrer">Conditions d'utilisation des API Google</a>.</p>

        <h2>5. Partage des Données</h2>
        <p>Nous ne vendons jamais vos données personnelles. Nous pouvons partager vos données avec :</p>
        <ul>
            <li>Mollie pour le traitement sécurisé des paiements par virement SEPA</li>
            <li>Google pour l'authentification OAuth et l'accès aux données Google Ads</li>
            <li>Nos prestataires de services (hébergement, email) sous contrat de confidentialité</li>
            <li>Les autorités légales si requis par la loi</li>
        </ul>

        <h2>6. Sécurité des Données</h2>
        <p>Nous mettons en œuvre des mesures de sécurité techniques et organisationnelles appropriées pour protéger vos données, notamment :</p>
        <ul>
            <li>Chiffrement SSL/TLS pour toutes les communications</li>
            <li>Authentification sécurisée par email/mot de passe avec sessions JWT</li>
            <li>Stockage chiffré des tokens d'accès et données sensibles</li>
            <li>Contrôle d'accès basé sur les rôles (RBAC)</li>
        </ul>

        <h2>7. Vos Droits</h2>
        <p>Conformément au RGPD, vous disposez des droits suivants :</p>
        <ul>
            <li>Droit d'accès à vos données personnelles</li>
            <li>Droit de rectification de vos données inexactes</li>
            <li>Droit à l'effacement ("droit à l'oubli")</li>
            <li>Droit à la limitation du traitement</li>
            <li>Droit à la portabilité de vos données</li>
            <li>Droit d'opposition au traitement</li>
            <li>Droit de retirer votre consentement à tout moment</li>
        </ul>
        <p>Pour exercer ces droits, contactez-nous à : <a href="mailto:privacy@marketspas.pro">privacy@marketspas.pro</a></p>

        <h2>8. Conservation des Données</h2>
        <p>Nous conservons vos données personnelles aussi longtemps que nécessaire pour les finalités décrites dans cette politique, sauf si une période de conservation plus longue est requise ou permise par la loi.</p>

        <h2>9. Cookies</h2>
        <p>Nous utilisons des cookies essentiels pour le fonctionnement de notre portail (authentification, session). Vous pouvez configurer votre navigateur pour refuser les cookies, mais cela peut affecter certaines fonctionnalités.</p>

        <h2>10. Modifications</h2>
        <p>Nous pouvons mettre à jour cette politique de confidentialité périodiquement. La date de dernière mise à jour est indiquée en haut de cette page.</p>

        <h2>11. Contact</h2>
        <div class="contact-box">
            <p><strong>Market Spas</strong></p>
            <p>Email : <a href="mailto:privacy@marketspas.pro">privacy@marketspas.pro</a></p>
            <p>Site web : <a href="https://marketspas.pro">https://marketspas.pro</a></p>
        </div>
    </div>
</body>
</html>`;
}

export function getTermsHTML(): string {
  return `<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Conditions Générales d'Utilisation - Market Spas B2B</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; background: linear-gradient(135deg, #f8fafc 0%, #e0f2fe 100%); padding: 20px; }
        .container { max-width: 900px; margin: 0 auto; background: white; padding: 40px; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
        h1 { color: #1e40af; margin-bottom: 20px; font-size: 2em; }
        h2 { color: #1e3a8a; margin-top: 30px; margin-bottom: 15px; font-size: 1.5em; }
        p { margin-bottom: 15px; }
        ul { margin-left: 30px; margin-bottom: 15px; }
        li { margin-bottom: 8px; }
        a { color: #2563eb; text-decoration: none; }
        a:hover { text-decoration: underline; }
        .date { color: #64748b; margin-bottom: 30px; }
        .contact-box { background: #f1f5f9; padding: 20px; border-radius: 6px; margin-top: 20px; }
        .nav { margin-bottom: 30px; padding-bottom: 20px; border-bottom: 1px solid #e2e8f0; }
        .nav a { margin-right: 20px; font-weight: 500; }
    </style>
</head>
<body>
    <div class="container">
        <div class="nav">
            <a href="/">Market Spas B2B</a>
            <a href="/privacy">Confidentialité</a>
            <a href="/terms">Conditions</a>
        </div>
        <h1>Conditions Générales d'Utilisation</h1>
        <p class="date">Dernière mise à jour : 14 février 2026</p>

        <h2>1. Acceptation des Conditions</h2>
        <p>En accédant et en utilisant le portail B2B Market Spas (ci-après "le Portail"), vous acceptez d'être lié par ces Conditions Générales d'Utilisation.</p>

        <h2>2. Description du Service</h2>
        <p>Market Spas fournit un portail B2B permettant à ses partenaires revendeurs de :</p>
        <ul>
            <li>Consulter le catalogue de produits (spas, jacuzzis, accessoires)</li>
            <li>Passer des commandes en ligne</li>
            <li>Suivre l'état de leurs commandes</li>
            <li>Accéder à des ressources marketing et techniques</li>
            <li>Gérer leur compte et leurs informations</li>
            <li>Suivre leurs campagnes publicitaires Google Ads</li>
        </ul>

        <h2>3. Inscription et Compte</h2>
        <p>L'accès au Portail est réservé aux partenaires professionnels agréés par Market Spas. Vous devez recevoir une invitation pour créer un compte. Vous êtes responsable de la confidentialité de vos identifiants.</p>

        <h2>4. Commandes et Paiements</h2>
        <p>Les commandes passées via le Portail sont soumises à validation par Market Spas. Les prix affichés sont hors taxes et peuvent varier selon votre niveau partenaire. Les paiements sont traités de manière sécurisée via Mollie (virement SEPA).</p>

        <h2>5. Intégration Google Ads</h2>
        <p>Le Portail offre une intégration avec Google Ads en lecture seule pour vous permettre de suivre vos campagnes publicitaires. La connexion est optionnelle et vous pouvez révoquer l'accès à tout moment.</p>

        <h2>6. Propriété Intellectuelle</h2>
        <p>Tous les contenus du Portail sont la propriété de Market Spas ou de ses fournisseurs et sont protégés par les lois sur la propriété intellectuelle.</p>

        <h2>7. Limitation de Responsabilité</h2>
        <p>Market Spas ne peut être tenu responsable des interruptions temporaires du service, des pertes de données dues à des problèmes techniques, ou des problèmes liés aux services tiers (Mollie, Google Ads).</p>

        <h2>8. Confidentialité</h2>
        <p>L'utilisation de vos données personnelles est régie par notre <a href="/privacy">Politique de Confidentialité</a>.</p>

        <h2>9. Droit Applicable</h2>
        <p>Ces Conditions Générales d'Utilisation sont régies par le droit belge. Tout litige sera soumis à la compétence exclusive des tribunaux de Belgique.</p>

        <h2>10. Contact</h2>
        <div class="contact-box">
            <p><strong>Market Spas</strong></p>
            <p>Email : <a href="mailto:support@marketspas.pro">support@marketspas.pro</a></p>
            <p>Site web : <a href="https://marketspas.pro">https://marketspas.pro</a></p>
        </div>
    </div>
</body>
</html>`;
}
