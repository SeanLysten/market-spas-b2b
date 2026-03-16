import type { TourStep } from "@/components/OnboardingTour";

/**
 * Onboarding tour definitions for each page.
 * Each tour is shown only once (first visit).
 * Selectors must match elements rendered on the page.
 */

export const dashboardTour: TourStep[] = [
  {
    target: '[data-tour="dashboard-header"]',
    title: "Bienvenue sur votre tableau de bord !",
    description:
      "C'est votre espace central. Depuis ici, vous accédez à toutes les fonctionnalités du portail : catalogue, commandes, SAV, leads, et plus encore.",
    position: "bottom",
  },
  {
    target: '[data-tour="quick-access"]',
    title: "Accès rapides",
    description:
      "Ces cartes vous donnent un accès direct aux sections principales : le catalogue produits, les ressources marketing et techniques, le forum d'entraide et le service après-vente.",
    position: "bottom",
  },
  {
    target: '[data-tour="leads-section"]',
    title: "Vos Leads",
    description:
      "Retrouvez ici vos prospects. Les leads vous sont attribués automatiquement selon votre zone géographique. Cliquez pour gérer vos opportunités commerciales.",
    position: "bottom",
  },
  {
    target: '[data-tour="events-section"]',
    title: "Événements à venir",
    description:
      "Consultez les promotions en cours, les formations planifiées et les annonces importantes. Cliquez sur \"Voir tout\" pour ouvrir le calendrier complet.",
    position: "top",
  },
  {
    target: '[data-tour="notifications-section"]',
    title: "Vos Notifications",
    description:
      "Toutes vos mises à jour sont ici : changements de statut de commande, paiements, tickets SAV, nouvelles ressources. Cliquez sur une notification pour accéder directement à l'élément concerné.",
    position: "top",
  },
  {
    target: '[data-tour="secondary-actions"]',
    title: "Actions rapides",
    description:
      "Accédez rapidement à vos commandes en cours, votre panier, vos produits favoris et votre profil. Ces raccourcis sont toujours disponibles ici.",
    position: "top",
  },
];

export const catalogTour: TourStep[] = [
  {
    target: '[data-tour="catalog-header"]',
    title: "Catalogue Produits",
    description:
      "Bienvenue dans le catalogue ! Parcourez l'ensemble des produits disponibles. Vous pouvez rechercher, filtrer et ajouter des produits à votre panier pour passer commande.",
    position: "bottom",
  },
  {
    target: '[data-tour="catalog-search"]',
    title: "Recherche et filtres",
    description:
      "Utilisez la barre de recherche pour trouver un produit par nom, référence ou EAN. Les filtres vous permettent d'affiner par catégorie, gamme, disponibilité et prix.",
    position: "bottom",
  },
  {
    target: '[data-tour="catalog-product"]',
    title: "Fiche produit",
    description:
      "Chaque carte affiche le nom, la photo, le prix partenaire et la disponibilité. Les badges indiquent si le produit est en stock immédiat ou en arrivage (semaine estimée). Cliquez pour voir les détails et les variantes de couleur.",
    position: "bottom",
  },
  {
    target: '[data-tour="catalog-cart"]',
    title: "Ajout au panier",
    description:
      "Cliquez sur le bouton d'ajout pour sélectionner la couleur, la quantité et la source de stock (stock disponible ou arrivage). Votre panier est accessible depuis le menu latéral.",
    position: "left",
  },
];

export const ordersTour: TourStep[] = [
  {
    target: '[data-tour="orders-header"]',
    title: "Mes Commandes",
    description:
      "Retrouvez ici l'historique complet de vos commandes. Chaque commande est suivie de la création jusqu'à la livraison.",
    position: "bottom",
  },
  {
    target: '[data-tour="orders-filters"]',
    title: "Filtrer par statut",
    description:
      "Filtrez vos commandes par statut : en attente d'acompte, acompte payé, en production, expédié, livré, etc. Le compteur indique le nombre de commandes par statut.",
    position: "bottom",
  },
  {
    target: '[data-tour="orders-list"]',
    title: "Liste des commandes",
    description:
      "Chaque ligne affiche le numéro de commande, la date, le statut actuel, le montant et le nombre d'articles. Utilisez les boutons d'action pour voir le suivi détaillé, le récapitulatif ou télécharger le PDF.",
    position: "top",
  },
  {
    target: '[data-tour="orders-actions"]',
    title: "Actions disponibles",
    description:
      "Le bouton \"Suivi\" ouvre le détail avec l'historique des étapes. Le bouton \"Récapitulatif\" affiche un résumé complet exportable en PDF. Vous pouvez aussi recommander les mêmes articles en un clic.",
    position: "left",
  },
];

export const savTour: TourStep[] = [
  {
    target: '[data-tour="sav-header"]',
    title: "Service Après-Vente",
    description:
      "Gérez vos demandes SAV depuis cette page. Créez des tickets pour signaler un problème, suivez leur avancement et échangez avec l'équipe support.",
    position: "bottom",
  },
  {
    target: '[data-tour="sav-create"]',
    title: "Créer un ticket",
    description:
      "Cliquez ici pour ouvrir un nouveau ticket SAV. Décrivez le problème, sélectionnez le produit concerné et ajoutez des photos si nécessaire. L'équipe sera notifiée immédiatement.",
    position: "bottom",
  },
  {
    target: '[data-tour="sav-list"]',
    title: "Suivi des tickets",
    description:
      "Vos tickets sont listés avec leur statut (ouvert, en cours, résolu, fermé). Cliquez sur un ticket pour voir les détails, l'historique des échanges et les pièces jointes.",
    position: "top",
  },
];

export const leadsTour: TourStep[] = [
  {
    target: '[data-tour="leads-header"]',
    title: "Gestion des Leads",
    description:
      "Vos prospects sont automatiquement attribués selon votre zone géographique. Gérez-les ici pour suivre vos opportunités commerciales.",
    position: "bottom",
  },
  {
    target: '[data-tour="leads-list"]',
    title: "Liste des prospects",
    description:
      "Chaque lead affiche le nom, la ville, le téléphone et la date de réception. Les leads récents apparaissent en premier. Cliquez pour voir les détails et ajouter des notes.",
    position: "top",
  },
  {
    target: '[data-tour="leads-stats"]',
    title: "Statistiques de conversion",
    description:
      "Les compteurs en haut résument votre pipeline : total de leads, nouveaux, en cours de traitement et convertis. Suivez vos performances commerciales en un coup d'\u0153il.",
    position: "bottom",
  },
];

export const resourcesTour: TourStep[] = [
  {
    target: '[data-tour="resources-header"]',
    title: "Ressources Marketing",
    description:
      "Accédez à tous les supports marketing mis à disposition : PLV, catalogues, visuels produits, vidéos et documents de formation.",
    position: "bottom",
  },
  {
    target: '[data-tour="resources-sidebar"]',
    title: "Dossiers et catégories",
    description:
      "Les ressources sont organisées en dossiers dans le panneau latéral. Naviguez entre les PLV, catalogues, visuels et vidéos pour trouver ce dont vous avez besoin.",
    position: "right",
  },
];

export const calendarTour: TourStep[] = [
  {
    target: '[data-tour="calendar-header"]',
    title: "Calendrier des événements",
    description:
      "Consultez tous les événements à venir : promotions, formations, salons et annonces importantes. Les événements sont ajoutés par l'équipe Market Spas.",
    position: "bottom",
  },
  {
    target: '[data-tour="calendar-grid"]',
    title: "Vue mensuelle",
    description:
      "Le calendrier affiche les événements du mois en cours. Les jours avec des événements sont marqués par des points colorés. Cliquez sur un jour pour voir les détails.",
    position: "bottom",
  },

];
