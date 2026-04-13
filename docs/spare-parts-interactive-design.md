# Design — Explorateur interactif de pièces détachées

## Objectif

Remplacer la liste plate de 30+ pièces par une expérience d'exploration visuelle par couches, où l'utilisateur "navigue" dans le spa pour identifier la bonne pièce. Le système est entièrement configurable depuis l'administration.

---

## Section 1 : Architecture des données

### Nouvelles tables DB

Le système repose sur 3 concepts : **couches** (layers), **zones** et **hotspots**.

| Table | Rôle | Champs clés |
|-------|------|-------------|
| `spa_model_layers` | Les 3 couches par modèle | `spaModelId`, `layerType` (SHELL, TECHNICAL, EXTERIOR), `imageUrl`, `sortOrder` |
| `spa_model_zones` | Zones cliquables dans une couche (ex: "Lounger 1", "Pompes") | `layerId`, `name`, `label`, `description`, `imageUrl` (optionnel), `sortOrder` |
| `spa_model_hotspots` | Points cliquables positionnés sur l'image d'une couche ou d'une zone | `zoneId`, `sparePartId`, `posX` (%), `posY` (%), `label` (optionnel) |

Les positions `posX` et `posY` sont en **pourcentage** (0-100) de l'image, ce qui les rend indépendantes de la résolution et responsive.

### Relations

```
spaModel (1) → (N) layers → (N) zones → (N) hotspots → (1) sparePart
```

Chaque modèle a jusqu'à 3 couches. Chaque couche a une image de fond et des zones. Chaque zone peut avoir sa propre image de détail et contient des hotspots liés aux pièces détachées.

---

## Section 2 : Parcours utilisateur (côté partenaire)

### Étape 0 — Sélection du modèle

Identique à aujourd'hui : grille de modèles avec image, nom, dimensions. On garde le design actuel qui fonctionne bien.

### Étape 1 — Choix de la couche

Après avoir sélectionné un modèle, l'utilisateur voit **3 cartes** côte à côte (ou empilées sur mobile) :

| Couche | Icône | Description courte | Contenu typique |
|--------|-------|-------------------|-----------------|
| **Coque intérieure** | Vue de dessus | "Jets, écran, oreillers, éclairage" | JETS, SCREENS, LIGHTING, AUDIO |
| **Pompes & Électronique** | Vue technique | "Pompes, chauffage, plomberie, ozone" | PUMPS, ELECTRONICS, HEATING, PLUMBING, OZONE_UVC |
| **Extérieur** | Vue latérale | "Panneaux, coins, couverture" | COVERS, CABINETS, OTHER |

Chaque carte affiche l'image de la couche (uploadée par l'admin) en miniature. Animation de transition fluide au clic.

### Étape 2 — Exploration de la couche

L'image de la couche s'affiche en grand. Les **zones** apparaissent comme des régions survolables/cliquables sur l'image. Par exemple pour la couche "Coque intérieure" :

- Zone "Lounger 1" (contour de la place lounger gauche)
- Zone "Lounger 2" (contour de la place lounger droite)
- Zone "Siège 1", "Siège 2"...
- Zone "Écran de contrôle"
- Zone "Cascade"

Au survol d'une zone, elle s'illumine (highlight semi-transparent) avec le nom qui apparaît. Au clic, on "zoome" dans cette zone.

### Étape 3 — Détail d'une zone

Quand on clique sur une zone, deux cas :

**Si la zone a une image de détail** (uploadée par l'admin) : on affiche cette image avec les hotspots positionnés dessus. Chaque hotspot est un point pulsant cliquable. Au survol, le nom de la pièce apparaît. Au clic, la fiche pièce s'affiche (nom, référence, prix, photo, description).

**Si la zone n'a pas d'image de détail** : on affiche directement la liste des pièces liées à cette zone sous forme de cartes (comme aujourd'hui mais filtrées).

### Navigation

Un fil d'Ariane (breadcrumb) permet de revenir à tout moment : `Modèle > Couche > Zone`. Un bouton "Retour" est toujours visible. On peut aussi naviguer entre zones sans repasser par la couche.

### Fallback

Si un modèle n'a pas encore été configuré avec les couches/zones/hotspots, on affiche l'ancienne vue (liste groupée par catégorie) pour ne pas bloquer l'utilisation.

---

## Section 3 : Éditeur admin (configuration des hotspots)

### Accès

Dans la page admin des pièces détachées, quand on sélectionne un modèle, un nouvel onglet **"Explorateur visuel"** apparaît à côté de l'onglet "Pièces liées" existant.

### Workflow de configuration

**1. Gestion des couches** : l'admin voit les 3 couches (Coque, Technique, Extérieur). Pour chaque couche, il peut uploader une image de fond. Un indicateur montre si la couche est configurée ou non.

**2. Gestion des zones** : après avoir uploadé l'image d'une couche, l'admin peut ajouter des zones. Pour chaque zone : nom, label affiché, description optionnelle, image de détail optionnelle, et un ordre d'affichage.

**3. Placement des hotspots** : c'est le coeur de l'éditeur. L'admin voit l'image de la zone (ou de la couche si pas d'image de zone). Il peut **cliquer sur l'image pour placer un hotspot**. Un menu déroulant lui permet de lier ce hotspot à une pièce détachée du catalogue. Il peut déplacer les hotspots par drag-and-drop. Il peut supprimer un hotspot.

L'éditeur affiche l'image avec les hotspots déjà placés (cercles numérotés). À côté, un panneau liste les hotspots avec la pièce liée, la position, et un bouton supprimer.

### Prévisualisation

Un bouton "Prévisualiser" permet à l'admin de voir exactement ce que le partenaire verra, avec les animations et les interactions.

---

## Section 4 : Animations et transitions

En suivant la philosophie d'Emil Kowalski (design engineering) :

| Transition | Animation | Durée | Easing |
|-----------|-----------|-------|--------|
| Sélection de couche | Scale-in depuis la carte + fade | 250ms | cubic-bezier(0.23, 1, 0.32, 1) |
| Survol de zone | Highlight progressif + scale léger | 200ms | ease-out |
| Zoom dans une zone | Transition de position + scale vers la zone | 300ms | cubic-bezier(0.23, 1, 0.32, 1) |
| Hotspot pulsant | Scale 1→1.2→1 en boucle | 2s | ease-in-out |
| Ouverture fiche pièce | Slide-up + fade | 200ms | ease-out |
| Retour (breadcrumb) | Reverse de l'animation d'entrée | 200ms | ease-out |

Pas d'animation sur les actions répétées (recherche, filtres). Les animations servent uniquement à donner un sens spatial à la navigation.

---

## Section 5 : Responsive mobile

Sur mobile, le parcours est identique mais adapté :

- Les 3 cartes de couche s'empilent verticalement (1 colonne)
- L'image de la couche est zoomable par pinch
- Les zones sont cliquables (pas de survol)
- Les hotspots sont légèrement plus grands pour être touchables (min 44px)
- La fiche pièce s'ouvre en bottom sheet au lieu d'un dialog centré

---

## Section 6 : Résumé des fichiers impactés

| Fichier | Action |
|---------|--------|
| `drizzle/schema.ts` | Ajouter 3 tables (layers, zones, hotspots) |
| `server/routers.ts` | Ajouter routes CRUD pour layers/zones/hotspots |
| `client/src/pages/SpareParts.tsx` | Refonte complète avec le parcours par couches |
| `client/src/pages/admin/AdminSpareParts.tsx` | Ajouter l'onglet éditeur visuel |
| `server/spa-models-db.ts` | Ajouter fonctions DB pour les nouvelles tables |
