# Observations après ajout sidebar sur toutes les pages

## Screenshot Dashboard
- La sidebar s'affiche correctement sur le Dashboard avec tous les liens de navigation
- Le header interne du Dashboard (Thème, Notifications, Mon Équipe, Admin, Déconnexion) est maintenant redondant avec la sidebar
- Il faudra nettoyer les headers internes des pages qui ont leur propre navigation
- Le layout fonctionne bien, pas de double-sidebar

## Pages modifiées
- App.tsx : toutes les routes partenaire wrappées dans withDashboard()
- Calendar.tsx : supprimé DashboardLayout interne
- SpareParts.tsx : supprimé DashboardLayout interne

## À faire encore
- Nettoyer les headers redondants dans Dashboard.tsx (boutons déconnexion, thème, etc.)
- Vérifier OrderTracking.tsx et OrderSummary.tsx 
- Corriger les articles manquants dans OrderTracking
