import { useTranslation } from "react-i18next";

export default function Privacy() {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg p-4 md:p-4 md:p-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-6">
          Politique de Confidentialité
        </h1>
        
        <p className="text-slate-600 mb-6">
          Dernière mise à jour : {new Date().toLocaleDateString('fr-FR')}
        </p>

        <section className="mb-8">
          <h2 className="text-2xl text-display text-display font-semibold text-slate-800 mb-4">
            1. Introduction
          </h2>
          <p className="text-slate-700 leading-relaxed mb-4">
            Market Spas ("nous", "notre", "nos") s'engage à protéger la confidentialité de vos données personnelles. 
            Cette politique de confidentialité explique comment nous collectons, utilisons, partageons et protégeons 
            vos informations lorsque vous utilisez notre portail B2B.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl text-display text-display font-semibold text-slate-800 mb-4">
            2. Données Collectées
          </h2>
          <p className="text-slate-700 leading-relaxed mb-4">
            Nous collectons les types de données suivants :
          </p>
          <ul className="list-disc list-inside text-slate-700 space-y-2 ml-4">
            <li>Informations d'identification : nom, prénom, adresse e-mail</li>
            <li>Informations professionnelles : nom de l'entreprise, numéro de TVA, adresse</li>
            <li>Données de connexion : adresse IP, type de navigateur, pages visitées</li>
            <li>Données de commande : historique des achats, préférences produits</li>
            <li>Données Google Ads : identifiant client, tokens d'accès OAuth, statistiques de campagnes publicitaires</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl text-display text-display font-semibold text-slate-800 mb-4">
            3. Utilisation des Données
          </h2>
          <p className="text-slate-700 leading-relaxed mb-4">
            Nous utilisons vos données pour :
          </p>
          <ul className="list-disc list-inside text-slate-700 space-y-2 ml-4">
            <li>Gérer votre compte et vos commandes</li>
            <li>Traiter vos paiements de manière sécurisée</li>
            <li>Vous envoyer des notifications importantes concernant vos commandes</li>
            <li>Améliorer nos services et personnaliser votre expérience</li>
            <li>Afficher les statistiques de vos campagnes publicitaires Google Ads</li>
            <li>Respecter nos obligations légales et réglementaires</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl text-display text-display font-semibold text-slate-800 mb-4">
            4. Intégration Google Ads
          </h2>
          <p className="text-slate-700 leading-relaxed mb-4">
            Notre portail s'intègre avec Google Ads pour vous permettre de suivre vos campagnes publicitaires. 
            Lorsque vous connectez votre compte Google Ads :
          </p>
          <ul className="list-disc list-inside text-slate-700 space-y-2 ml-4">
            <li>Nous accédons à vos données de campagnes publicitaires Google Ads via l'API Google Ads</li>
            <li>Nous stockons votre identifiant client Google Ads et les tokens d'accès OAuth de manière sécurisée</li>
            <li>Nous affichons les statistiques de vos campagnes (impressions, clics, dépenses, conversions)</li>
            <li>Vous pouvez révoquer l'accès à tout moment depuis votre compte Google ou notre interface</li>
          </ul>
          <p className="text-slate-700 leading-relaxed mt-4">
            L'utilisation de l'API Google Ads est soumise aux{" "}
            <a 
              href="https://developers.google.com/terms" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-info dark:text-info-dark hover:underline"
            >
              Conditions d'utilisation des API Google
            </a>.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl text-display text-display font-semibold text-slate-800 mb-4">
            5. Partage des Données
          </h2>
          <p className="text-slate-700 leading-relaxed mb-4">
            Nous ne vendons jamais vos données personnelles. Nous pouvons partager vos données avec :
          </p>
          <ul className="list-disc list-inside text-slate-700 space-y-2 ml-4">
            <li>Stripe pour le traitement sécurisé des paiements</li>
            <li>Google pour l'authentification OAuth et l'accès aux données Google Ads</li>
            <li>Nos prestataires de services (hébergement, email) sous contrat de confidentialité</li>
            <li>Les autorités légales si requis par la loi</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl text-display text-display font-semibold text-slate-800 mb-4">
            6. Sécurité des Données
          </h2>
          <p className="text-slate-700 leading-relaxed mb-4">
            Nous mettons en œuvre des mesures de sécurité techniques et organisationnelles appropriées pour protéger 
            vos données contre tout accès non autorisé, modification, divulgation ou destruction, notamment :
          </p>
          <ul className="list-disc list-inside text-slate-700 space-y-2 ml-4">
            <li>Chiffrement SSL/TLS pour toutes les communications</li>
            <li>Authentification sécurisée par email/mot de passe avec sessions JWT</li>
            <li>Stockage chiffré des tokens d'accès et données sensibles</li>
            <li>Contrôle d'accès basé sur les rôles (RBAC)</li>
            <li>Surveillance et journalisation des accès</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl text-display text-display font-semibold text-slate-800 mb-4">
            7. Vos Droits
          </h2>
          <p className="text-slate-700 leading-relaxed mb-4">
            Conformément au RGPD, vous disposez des droits suivants :
          </p>
          <ul className="list-disc list-inside text-slate-700 space-y-2 ml-4">
            <li>Droit d'accès à vos données personnelles</li>
            <li>Droit de rectification de vos données inexactes</li>
            <li>Droit à l'effacement ("droit à l'oubli")</li>
            <li>Droit à la limitation du traitement</li>
            <li>Droit à la portabilité de vos données</li>
            <li>Droit d'opposition au traitement</li>
            <li>Droit de retirer votre consentement à tout moment</li>
          </ul>
          <p className="text-slate-700 leading-relaxed mt-4">
            Pour exercer ces droits, contactez-nous à : <a href="mailto:privacy@marketspas.pro" className="text-info dark:text-info-dark hover:underline">privacy@marketspas.pro</a>
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl text-display text-display font-semibold text-slate-800 mb-4">
            8. Conservation des Données
          </h2>
          <p className="text-slate-700 leading-relaxed mb-4">
            Nous conservons vos données personnelles aussi longtemps que nécessaire pour les finalités décrites 
            dans cette politique, sauf si une période de conservation plus longue est requise ou permise par la loi.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl text-display text-display font-semibold text-slate-800 mb-4">
            9. Cookies
          </h2>
          <p className="text-slate-700 leading-relaxed mb-4">
            Nous utilisons des cookies essentiels pour le fonctionnement de notre portail (authentification, session). 
            Vous pouvez configurer votre navigateur pour refuser les cookies, mais cela peut affecter certaines fonctionnalités.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl text-display text-display font-semibold text-slate-800 mb-4">
            10. Modifications
          </h2>
          <p className="text-slate-700 leading-relaxed mb-4">
            Nous pouvons mettre à jour cette politique de confidentialité périodiquement. La date de dernière mise à jour 
            est indiquée en haut de cette page. Nous vous encourageons à consulter régulièrement cette politique.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl text-display text-display font-semibold text-slate-800 mb-4">
            11. Contact
          </h2>
          <p className="text-slate-700 leading-relaxed mb-4">
            Pour toute question concernant cette politique de confidentialité, contactez-nous :
          </p>
          <div className="bg-slate-50 p-4 rounded-lg">
            <p className="text-slate-700"><strong>Market Spas</strong></p>
            <p className="text-slate-700">Email : <a href="mailto:privacy@marketspas.pro" className="text-info dark:text-info-dark hover:underline">privacy@marketspas.pro</a></p>
            <p className="text-slate-700">Site web : <a href="https://marketspas.pro" className="text-info dark:text-info-dark hover:underline">https://marketspas.pro</a></p>
          </div>
        </section>
      </div>
    </div>
  );
}
