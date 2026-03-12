# Market Spas Design System - Guide de Style

## 📐 Direction Artistique

**Style** : Luxury Organic Wellness  
**Inspiration** : Nature, spa, bien-être haut de gamme  
**Ambiance** : Élégante, apaisante, professionnelle

---

## 🎨 Palette de Couleurs

### Couleurs Principales

#### Eucalyptus (Primary)
Utilisé pour les actions principales, liens, états actifs.

```css
--p-500: #389882  /* Couleur principale */
--p-600: #2b7a69  /* Hover states */
--p-700: #256356  /* Active states */
--p-50: #eef9f5   /* Backgrounds légers */
--p-100: #d5f0e8  /* Accents subtils */
```

**Usage** :
- Boutons primaires
- Liens
- Éléments de navigation actifs
- Indicateurs de succès

#### Blush Rose (Secondary)
Utilisé pour les accents chaleureux et les éléments secondaires.

```css
--s-500: #d9603f  /* Couleur secondaire */
--s-50: #fdf1ed   /* Backgrounds légers */
```

**Usage** :
- Boutons secondaires
- Accents décoratifs
- Éléments d'alerte non critiques

#### Warm Honey (Tertiary)
Utilisé pour les highlights et les éléments d'attention.

```css
--t-500: #d49a20  /* Couleur tertiaire */
--t-50: #fdf8e8   /* Backgrounds légers */
```

**Usage** :
- Badges d'avertissement
- Highlights
- Éléments promotionnels

### Couleurs Neutres (Stone)

```css
--n-0: #ffffff    /* Blanc pur */
--n-50: #faf8f6   /* Background principal */
--n-100: #eeebe7  /* Borders subtiles */
--n-200: #dbd6d0  /* Borders normales */
--n-500: #8a827a  /* Texte secondaire */
--n-700: #5a544f  /* Texte normal */
--n-800: #3d3935  /* Texte principal */
--n-900: #252220  /* Titres */
```

### Couleurs Sémantiques

```css
/* Success */
--ok: #4ead8a
--ok-light: #eef9f3
--ok-dark: #1f6b4a

/* Warning */
--warn: #e0a633
--warn-light: #fef8ea
--warn-dark: #7c5a12

/* Error */
--err: #d45757
--err-light: #fdf0f0
--err-dark: #8b2626

/* Info */
--info: #5b8ec9
--info-light: #eef4fb
--info-dark: #2c5a8f
```

---

## ✍️ Typographie

### Fonts

```css
--f-display: 'Lora', 'Georgia', serif;      /* Titres */
--f-body: 'Nunito Sans', 'Segoe UI', sans-serif;  /* Corps de texte */
--f-mono: 'JetBrains Mono', 'SF Mono', monospace; /* Code */
```

### Hiérarchie

```tsx
// Titre principal (H1)
<h1 className="text-4xl font-semibold text-display text-n-900">
  Titre Principal
</h1>

// Titre de section (H2)
<h2 className="text-2xl font-semibold text-display text-n-900">
  Titre de Section
</h2>

// Titre de sous-section (H3)
<h3 className="text-xl font-semibold text-display text-n-900">
  Sous-titre
</h3>

// Titre de card (H4)
<h4 className="text-base font-semibold text-display text-n-900">
  Titre de Card
</h4>

// Corps de texte
<p className="text-sm text-n-700">
  Texte normal
</p>

// Texte secondaire
<p className="text-sm text-n-500">
  Texte secondaire
</p>

// Label
<label className="text-[13px] font-medium text-n-700">
  Label de formulaire
</label>
```

---

## 🧩 Composants

### Buttons

```tsx
import { Button } from "@/components/ui/button";

// Primary (action principale)
<Button>Action Principale</Button>

// Secondary (action secondaire)
<Button variant="secondary">Action Secondaire</Button>

// Outline (action tertiaire)
<Button variant="outline">Action Tertiaire</Button>

// Soft (action subtile)
<Button variant="soft">Action Subtile</Button>

// Ghost (action minimale)
<Button variant="ghost">Action Minimale</Button>

// Destructive (action dangereuse)
<Button variant="destructive">Supprimer</Button>

// Tailles
<Button size="sm">Petit</Button>
<Button size="default">Normal</Button>
<Button size="lg">Grand</Button>
```

### Cards

```tsx
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";

<Card>
  <CardHeader>
    <CardTitle>Titre de la Card</CardTitle>
    <CardDescription>Description optionnelle</CardDescription>
  </CardHeader>
  <CardContent>
    Contenu de la card
  </CardContent>
</Card>
```

**Caractéristiques** :
- `rounded-xl` (coins arrondis)
- `shadow-sm` avec hover `shadow-md`
- Effet hover : `translateY(-2px)`
- Border subtile `border-n-150`

### Badges

```tsx
import { Badge } from "@/components/ui/badge";

// Par défaut (primary)
<Badge>Nouveau</Badge>

// Success
<Badge variant="success">Actif</Badge>

// Warning
<Badge variant="warning">En attente</Badge>

// Error
<Badge variant="error">Erreur</Badge>

// Info
<Badge variant="info">Information</Badge>
```

### Inputs

```tsx
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

<div className="space-y-2">
  <Label htmlFor="email">Email</Label>
  <Input 
    id="email" 
    type="email" 
    placeholder="votre@email.com"
  />
</div>
```

**Caractéristiques** :
- `rounded-lg`
- Border `border-n-200`
- Focus : `border-p-400` avec ring
- Height : `h-9`

### Tables

```tsx
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "@/components/ui/table";

<Table>
  <TableHeader>
    <TableRow>
      <TableHead>Colonne 1</TableHead>
      <TableHead>Colonne 2</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    <TableRow>
      <TableCell>Donnée 1</TableCell>
      <TableCell>Donnée 2</TableCell>
    </TableRow>
  </TableBody>
</Table>
```

**Caractéristiques** :
- Headers : `uppercase`, `text-[11px]`, `tracking-wider`, `text-n-500`
- Hover rows : `bg-accent/50`
- Border entre rows : `border-n-75`

---

## 📏 Spacing

```css
--sp-1: 4px    /* Très petit */
--sp-2: 8px    /* Petit */
--sp-3: 12px   /* Moyen-petit */
--sp-4: 16px   /* Moyen */
--sp-5: 20px   /* Moyen-grand */
--sp-6: 24px   /* Grand */
--sp-8: 32px   /* Très grand */
--sp-10: 40px  /* Extra grand */
--sp-12: 48px  /* Énorme */
--sp-16: 64px  /* Massif */
```

**Usage Tailwind** :
```tsx
<div className="p-6">      {/* padding: 24px */}
<div className="gap-4">    {/* gap: 16px */}
<div className="space-y-8"> {/* vertical spacing: 32px */}
```

---

## 🔲 Border Radius

```css
--r-xs: 4px     /* Très petit */
--r-sm: 6px     /* Petit */
--r-md: 10px    /* Moyen (défaut) */
--r-lg: 14px    /* Grand (standard) */
--r-xl: 20px    /* Très grand */
--r-2xl: 28px   /* Extra grand */
--r-full: 9999px /* Cercle */
```

**Standard** : Utiliser `rounded-lg` (14px) pour tous les composants par défaut.

---

## 🌑 Shadows

```css
--sh-xs: 0 1px 2px rgba(37,34,32,0.05)
--sh-sm: 0 1px 4px rgba(37,34,32,0.06), 0 1px 2px rgba(37,34,32,0.04)
--sh-md: 0 4px 16px rgba(37,34,32,0.07), 0 2px 4px rgba(37,34,32,0.03)
--sh-lg: 0 8px 32px rgba(37,34,32,0.08), 0 2px 8px rgba(37,34,32,0.04)
--sh-xl: 0 16px 48px rgba(37,34,32,0.1), 0 4px 12px rgba(37,34,32,0.04)
```

**Usage** :
- Cards : `shadow-sm` → hover `shadow-md`
- Buttons : `shadow-sm` → hover `shadow-md`
- Modals : `shadow-xl`
- Dropdowns : `shadow-lg`

---

## 🎬 Animations

```css
--ease-out: cubic-bezier(0.22, 1, 0.36, 1)
--ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1)
--dur-fast: 120ms
--dur-base: 200ms
--dur-slow: 350ms
```

**Transitions standards** :
```tsx
<div className="transition-all duration-200">
  Élément avec transition
</div>

<button className="hover:shadow-md hover:-translate-y-0.5 transition-all">
  Bouton avec hover effect
</button>
```

---

## 🎨 Effets Spéciaux

### Grain Texture

Appliqué globalement sur `body::after` avec `opacity: 0.028`.  
**Ne pas modifier** - déjà dans `design-system.css`.

### Backdrop Blur

Pour les éléments flottants (navigation sticky, modals) :

```tsx
<div className="backdrop-blur-lg bg-n-50/80">
  Navigation avec blur
</div>
```

---

## 📱 Responsive Design

### Breakpoints Tailwind

```css
sm: 640px   /* Mobile landscape */
md: 768px   /* Tablet */
lg: 1024px  /* Desktop */
xl: 1280px  /* Large desktop */
2xl: 1536px /* Extra large */
```

### Exemples

```tsx
// Responsive grid
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
  {/* Cards */}
</div>

// Responsive text
<h1 className="text-2xl md:text-3xl lg:text-4xl">
  Titre responsive
</h1>

// Responsive spacing
<div className="p-4 md:p-6 lg:p-8">
  Contenu avec padding responsive
</div>
```

---

## ✅ Checklist pour Nouvelles Pages

- [ ] Importer les fonts (Lora + Nunito Sans) dans index.css
- [ ] Utiliser `text-display` pour tous les titres (h1, h2, h3, h4)
- [ ] Utiliser `rounded-lg` pour tous les composants (buttons, cards, inputs)
- [ ] Appliquer la palette eucalyptus/stone pour les couleurs
- [ ] Utiliser les badges sémantiques (success, warning, error, info)
- [ ] Ajouter des transitions (`transition-all duration-200`)
- [ ] Utiliser `shadow-sm` avec hover `shadow-md` pour les cards
- [ ] Respecter le spacing standard (gap-4, gap-6, p-6)
- [ ] Tester le responsive design (mobile, tablet, desktop)
- [ ] Vérifier l'accessibilité (contraste, focus states)

---

## 🚫 À Éviter

❌ **Ne pas utiliser** :
- `rounded-md` → Utiliser `rounded-lg`
- `text-lg font-bold` pour les titres → Utiliser `text-base font-semibold text-display`
- Couleurs hardcodées (ex: `bg-blue-500`) → Utiliser les variables CSS
- Shadows trop fortes → Rester subtil avec `shadow-sm` et `shadow-md`
- Animations trop longues → Max 350ms

❌ **Ne pas oublier** :
- Ajouter `text-display` aux titres
- Utiliser les badges sémantiques au lieu de couleurs custom
- Tester sur mobile avant de livrer
- Ajouter des états hover/focus sur les éléments interactifs

---

## 📚 Ressources

- **Charte graphique complète** : `/home/ubuntu/upload/market-spas-design-system-v2.1.html`
- **Tokens CSS** : `/home/ubuntu/market-spas-b2b/client/src/styles/design-system.css`
- **Variables Tailwind** : `/home/ubuntu/market-spas-b2b/client/src/index.css`

---

## 🔄 Maintenance

Ce guide de style doit être mis à jour lorsque :
- De nouveaux composants sont ajoutés
- La palette de couleurs évolue
- De nouveaux patterns d'interaction sont créés
- Des problèmes d'accessibilité sont identifiés

**Dernière mise à jour** : 26 février 2026
