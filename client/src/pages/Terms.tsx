import { useTranslation } from "react-i18next";

export default function Terms() {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg p-4 md:p-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-6">
          Conditions Générales d'Utilisation
        </h1>
        
        <p className="text-slate-600 mb-6">
          Dernière mise à jour : {new Date().toLocaleDateString('fr-FR')}
        </p>

        <section className="mb-8">
          <h2 className="text-2xl text-display text-display font-semibold text-slate-800 mb-4">
            1. Acceptation des Conditions
          </h2>
          <p className="text-slate-700 leading-relaxed mb-4">
            En accédant et en utilisant le portail B2B Market Spas (ci-après "le Portail"), vous acceptez d'être lié 
            par ces Conditions Générales d'Utilisation. Si vous n'acceptez pas ces conditions, veuillez ne pas utiliser 
            le Portail.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl text-display text-display font-semibold text-slate-800 mb-4">
            2. Description du Service
          </h2>
          <p className="text-slate-700 leading-relaxed mb-4">
            Market Spas fournit un portail B2B permettant à ses partenaires revendeurs de :
          </p>
          <ul className="list-disc list-inside text-slate-700 space-y-2 ml-4">
            <li>Consulter le catalogue de produits (spas, jacuzzis, accessoires)</li>
            <li>Passer des commandes en ligne</li>
            <li>Suivre l'état de leurs commandes</li>
            <li>Accéder à des ressources marketing et techniques</li>
            <li>Gérer leur compte et leurs informations</li>
            <li>Suivre leurs campagnes publicitaires Google Ads</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl text-display text-display font-semibold text-slate-800 mb-4">
            3. Inscription et Compte
          </h2>
          <p className="text-slate-700 leading-relaxed mb-4">
            L'accès au Portail est réservé aux partenaires professionnels agréés par Market Spas. Pour créer un compte :
          </p>
          <ul className="list-disc list-inside text-slate-700 space-y-2 ml-4">
            <li>Vous devez recevoir une invitation de Market Spas</li>
            <li>Vous devez fournir des informations exactes et complètes</li>
            <li>Vous êtes responsable de la confidentialité de vos identifiants</li>
            <li>Vous devez nous informer immédiatement de toute utilisation non autorisée</li>
            <li>Market Spas se réserve le droit de suspendre ou résilier tout compte</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl text-display text-display font-semibold text-slate-800 mb-4">
            4. Commandes et Paiements
          </h2>
          <p className="text-slate-700 leading-relaxed mb-4">
            Les commandes passées via le Portail sont soumises aux conditions suivantes :
          </p>
          <ul className="list-disc list-inside text-slate-700 space-y-2 ml-4">
            <li>Toutes les commandes sont soumises à validation par Market Spas</li>
            <li>Les prix affichés sont hors taxes et peuvent varier selon votre niveau partenaire</li>
            <li>Un acompte peut être requis pour certaines commandes</li>
            <li>Les paiements sont traités de manière sécurisée via Stripe</li>
            <li>Les délais de livraison sont indicatifs et non contractuels</li>
            <li>Market Spas se réserve le droit d'annuler toute commande en cas de stock insuffisant</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl text-display text-display font-semibold text-slate-800 mb-4">
            5. Prix et Remises
          </h2>
          <p className="text-slate-700 leading-relaxed mb-4">
            Les prix et remises appliqués dépendent de votre niveau partenaire (Bronze, Silver, Gold, Platinum, VIP). 
            Market Spas se réserve le droit de modifier les prix et les conditions tarifaires à tout moment, 
            avec notification préalable aux partenaires.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl text-display text-display font-semibold text-slate-800 mb-4">
            6. Intégration Google Ads
          </h2>
          <p className="text-slate-700 leading-relaxed mb-4">
            Le Portail offre une intégration avec Google Ads pour vous permettre de suivre vos campagnes publicitaires :
          </p>
          <ul className="list-disc list-inside text-slate-700 space-y-2 ml-4">
            <li>La connexion à Google Ads est optionnelle et requiert votre autorisation OAuth</li>
            <li>Vous pouvez révoquer l'accès à tout moment</li>
            <li>Market Spas n'est pas responsable des données fournies par l'API Google Ads</li>
            <li>L'utilisation de cette fonctionnalité est soumise aux conditions d'utilisation de Google</li>
            <li>Market Spas ne modifie pas vos campagnes publicitaires, l'accès est en lecture seule</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl text-display text-display font-semibold text-slate-800 mb-4">
            7. Propriété Intellectuelle
          </h2>
          <p className="text-slate-700 leading-relaxed mb-4">
            Tous les contenus du Portail (textes, images, logos, vidéos, documents) sont la propriété de Market Spas 
            ou de ses fournisseurs et sont protégés par les lois sur la propriété intellectuelle. Vous n'êtes autorisé 
            à utiliser ces contenus que dans le cadre de votre activité commerciale avec Market Spas.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl text-display text-display font-semibold text-slate-800 mb-4">
            8. Utilisation Acceptable
          </h2>
          <p className="text-slate-700 leading-relaxed mb-4">
            Vous vous engagez à ne pas :
          </p>
          <ul className="list-disc list-inside text-slate-700 space-y-2 ml-4">
            <li>Utiliser le Portail à des fins illégales ou non autorisées</li>
            <li>Tenter d'accéder à des zones restreintes du système</li>
            <li>Perturber ou interférer avec le fonctionnement du Portail</li>
            <li>Transmettre des virus, malwares ou codes malveillants</li>
            <li>Collecter des données d'autres utilisateurs sans autorisation</li>
            <li>Partager vos identifiants de connexion avec des tiers</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl text-display text-display font-semibold text-slate-800 mb-4">
            9. Limitation de Responsabilité
          </h2>
          <p className="text-slate-700 leading-relaxed mb-4">
            Market Spas ne peut être tenu responsable de :
          </p>
          <ul className="list-disc list-inside text-slate-700 space-y-2 ml-4">
            <li>Interruptions temporaires du service pour maintenance</li>
            <li>Pertes de données dues à des problèmes techniques</li>
            <li>Erreurs dans les informations affichées sur le Portail</li>
            <li>Dommages indirects ou consécutifs résultant de l'utilisation du Portail</li>
            <li>Problèmes liés aux services tiers (Stripe, Google Ads)</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl text-display text-display font-semibold text-slate-800 mb-4">
            10. Confidentialité
          </h2>
          <p className="text-slate-700 leading-relaxed mb-4">
            L'utilisation de vos données personnelles est régie par notre{" "}
            <a href="/privacy" className="text-info dark:text-info-dark hover:underline">
              Politique de Confidentialité
            </a>. En utilisant le Portail, vous acceptez également cette politique.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl text-display text-display font-semibold text-slate-800 mb-4">
            11. Modifications des Conditions
          </h2>
          <p className="text-slate-700 leading-relaxed mb-4">
            Market Spas se réserve le droit de modifier ces Conditions Générales d'Utilisation à tout moment. 
            Les modifications entreront en vigueur dès leur publication sur le Portail. Votre utilisation continue 
            du Portail après la publication des modifications constitue votre acceptation de ces modifications.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl text-display text-display font-semibold text-slate-800 mb-4">
            12. Résiliation
          </h2>
          <p className="text-slate-700 leading-relaxed mb-4">
            Market Spas peut suspendre ou résilier votre accès au Portail à tout moment, avec ou sans préavis, 
            en cas de violation de ces conditions ou pour toute autre raison jugée appropriée.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl text-display text-display font-semibold text-slate-800 mb-4">
            13. Droit Applicable
          </h2>
          <p className="text-slate-700 leading-relaxed mb-4">
            Ces Conditions Générales d'Utilisation sont régies par le droit belge. Tout litige sera soumis à la 
            compétence exclusive des tribunaux de Belgique.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl text-display text-display font-semibold text-slate-800 mb-4">
            14. Contact
          </h2>
          <p className="text-slate-700 leading-relaxed mb-4">
            Pour toute question concernant ces conditions, contactez-nous :
          </p>
          <div className="bg-slate-50 p-4 rounded-lg">
            <p className="text-slate-700"><strong>Market Spas</strong></p>
            <p className="text-slate-700">Email : <a href="mailto:support@marketspas.pro" className="text-info dark:text-info-dark hover:underline">support@marketspas.pro</a></p>
            <p className="text-slate-700">Site web : <a href="https://marketspas.pro" className="text-info dark:text-info-dark hover:underline">https://marketspas.pro</a></p>
          </div>
        </section>
      </div>
    </div>
  );
}
