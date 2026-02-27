# Guide de configuration Resend pour Market Spas

## Problème actuel

Le compte Resend est en **mode test** et ne peut envoyer des emails qu'à l'adresse `info@marketspas.com`. Pour envoyer des emails à tous les partenaires (invitations, reset password, newsletters), il faut **vérifier un domaine**.

## Solution : Vérifier un domaine dans Resend

### Étape 1 : Accéder à Resend

1. Aller sur https://resend.com/domains
2. Se connecter avec le compte Resend de Market Spas

### Étape 2 : Ajouter un domaine

1. Cliquer sur "Add Domain"
2. Entrer le domaine : `marketspas.pro` (ou `marketspas.com`)
3. Cliquer sur "Add"

### Étape 3 : Configurer les enregistrements DNS

Resend va fournir 3 enregistrements DNS à ajouter :

1. **SPF** (TXT) : Autorise Resend à envoyer des emails depuis votre domaine
2. **DKIM** (TXT) : Signe numériquement vos emails pour prouver leur authenticité
3. **DMARC** (TXT) : Politique de sécurité pour les emails

**Exemple d'enregistrements** :

```
Type: TXT
Name: @
Value: v=spf1 include:amazonses.com include:_spf.resend.com ~all

Type: TXT
Name: resend._domainkey
Value: p=MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQC...

Type: TXT
Name: _dmarc
Value: v=DMARC1; p=none; rua=mailto:dmarc@marketspas.pro
```

### Étape 4 : Ajouter les enregistrements DNS

**Si le domaine est géré par Manus** :
- Les enregistrements DNS peuvent être ajoutés via le panneau de gestion des domaines dans Manus

**Si le domaine est géré ailleurs** (Cloudflare, OVH, etc.) :
1. Aller dans le panneau de configuration DNS du registrar
2. Ajouter les 3 enregistrements TXT fournis par Resend
3. Attendre la propagation DNS (5-30 minutes)

### Étape 5 : Vérifier le domaine

1. Retourner sur https://resend.com/domains
2. Cliquer sur "Verify" à côté du domaine
3. Resend va vérifier les enregistrements DNS
4. ✅ Le domaine est vérifié !

### Étape 6 : Mettre à jour EMAIL_FROM

Une fois le domaine vérifié, mettre à jour la variable `EMAIL_FROM` :

```
EMAIL_FROM=Market Spas <noreply@marketspas.pro>
```

Ou utiliser un autre email du domaine vérifié :

```
EMAIL_FROM=Market Spas <contact@marketspas.pro>
EMAIL_FROM=Market Spas <info@marketspas.pro>
EMAIL_FROM=Market Spas <partenaires@marketspas.pro>
```

## Solution temporaire (pour tester immédiatement)

En attendant la vérification du domaine, vous pouvez tester l'envoi d'emails en utilisant l'email déjà vérifié :

```
EMAIL_FROM=Market Spas <info@marketspas.com>
```

Et envoyer uniquement à `info@marketspas.com` pour les tests.

## Vérification après configuration

Une fois le domaine vérifié, tester l'envoi d'email :

```bash
cd /home/ubuntu/market-spas-b2b
pnpm vitest run server/email-reset-password.test.ts
```

Le test devrait maintenant réussir ! ✅

## Emails qui seront envoyés automatiquement

Une fois configuré, le portail enverra automatiquement :

✅ **Invitations partenaires** : Lien pour créer un compte
✅ **Réinitialisation mot de passe** : Lien pour reset le password
✅ **Confirmation de commande** : Email au partenaire après commande
✅ **Notification admin** : Email aux admins lors d'une nouvelle commande
✅ **Mise à jour statut commande** : Email au partenaire quand le statut change
✅ **Alertes stock bas** : Email aux admins quand le stock est bas
✅ **Paiements Stripe** : Confirmation/échec/remboursement

## Support

Si vous avez des questions sur la configuration Resend :
- Documentation : https://resend.com/docs
- Support : https://resend.com/support
