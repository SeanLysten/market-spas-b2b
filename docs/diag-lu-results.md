# Diagnostic Lead Luxembourg — Juan-Cristobal (CP 6740, +352)

## Résultats

### 1. Pays Luxembourg en DB
- ID: 60001, Code: LU

### 2. Régions Luxembourg
- ID: 60001, Code: LU-L, Name: Luxembourg

### 3. POSTAL CODE RANGES pour Luxembourg (LU-L)
**VIDE !** — Aucune range de codes postaux n'est définie pour le Luxembourg.

### 4. Territoire SaniDesign
- SaniDesign (ID 60015) est bien assigné à la région Luxembourg (LU-L, ID 60001)

### 5. Lead Juan-Cristobal
- CP: 6740, Pays: "Luxembourg", Téléphone: +352661148113
- Assigné à: partnerId 60013 (Tahiti Piscines — Province du Luxembourg belge BE-WLX)
- Le country hint "Luxembourg" ne matche aucune range LU (car il n'y en a pas)
- Le CP 6740 matche la Province du Luxembourg belge (BE-WLX, range 6600-6999)

## Root Cause
1. **Aucune postal_code_range n'est définie pour le Luxembourg (LU)** — la table est vide pour ce pays
2. Quand le country hint "Luxembourg" ne matche rien, le système fallback sur les ranges belges
3. Le CP 6740 matche BE-WLX (Province du Luxembourg belge)

## Solution
1. Ajouter les postal_code_ranges pour le Luxembourg (1000-9999 → LU-L)
2. OU : quand le country hint est fourni et qu'aucune range ne matche dans ce pays, chercher le partenaire qui couvre le pays entier (via partner_territories → regions → countries)
3. La solution 2 est meilleure car elle gère aussi les cas où les ranges ne sont pas exhaustives
