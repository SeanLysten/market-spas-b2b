import { useState } from 'react';
import { trpc } from '../../lib/trpc';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Textarea } from '../../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Label } from '../../components/ui/label';
import { Alert, AlertDescription } from '../../components/ui/alert';
import { Mail, Send, CheckCircle2, AlertCircle, Users } from 'lucide-react';
import { toast } from 'sonner';

export default function AdminNewsletter() {
  const [subject, setSubject] = useState('');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [ctaText, setCtaText] = useState('');
  const [ctaUrl, setCtaUrl] = useState('');
  const [recipients, setRecipients] = useState<'ALL' | 'PARTNERS_ONLY' | 'ADMINS_ONLY'>('ALL');
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    totalRecipients: number;
    successCount: number;
    failureCount: number;
    message: string;
  } | null>(null);

  const sendNewsletterMutation = trpc.admin.newsletter.send.useMutation({
    onSuccess: (data) => {
      setResult(data);
      setSending(false);
      toast.success('Newsletter envoyée', {
        description: data.message,
      });
      // Reset form
      setSubject('');
      setTitle('');
      setContent('');
      setCtaText('');
      setCtaUrl('');
    },
    onError: (error) => {
      setSending(false);
      toast.error('Erreur', {
        description: error.message,
      });
    },
  });

  const handleSend = () => {
    if (!subject || !title || !content) {
      toast.error('Erreur', {
        description: 'Veuillez remplir tous les champs obligatoires',
      });
      return;
    }

    setSending(true);
    setResult(null);
    sendNewsletterMutation.mutate({
      subject,
      title,
      content,
      ctaText: ctaText || undefined,
      ctaUrl: ctaUrl || undefined,
      recipients,
    });
  };

  return (
    <div className="p-4 md:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground flex items-center gap-2">
            <Mail className="h-7 w-7 text-primary" />
            Newsletter
          </h1>
          <p className="text-sm md:text-base text-muted-foreground mt-1">
            Envoyez des communications par email à vos partenaires
          </p>
        </div>
      </div>

      {/* Result Alert */}
      {result && (
        <Alert className={result.success ? 'border-green-500 bg-green-50 dark:bg-green-950' : 'border-red-500 bg-red-50 dark:bg-red-950'}>
          {result.success ? (
            <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
          ) : (
            <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
          )}
          <AlertDescription className="text-sm">
            <strong>{result.message}</strong>
            <div className="mt-2 text-xs">
              <div>Total : {result.totalRecipients} destinataires</div>
              <div className="text-green-600 dark:text-green-400">✓ Envoyés : {result.successCount}</div>
              {result.failureCount > 0 && (
                <div className="text-red-600 dark:text-red-400">✗ Échecs : {result.failureCount}</div>
              )}
            </div>
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Form */}
        <Card>
          <CardHeader>
            <CardTitle>Composer la newsletter</CardTitle>
            <CardDescription>
              Créez votre message et sélectionnez les destinataires
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Recipients */}
            <div className="space-y-2">
              <Label htmlFor="recipients">
                <Users className="inline h-4 w-4 mr-1" />
                Destinataires *
              </Label>
              <Select value={recipients} onValueChange={(value: any) => setRecipients(value)}>
                <SelectTrigger id="recipients">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Tous les utilisateurs actifs</SelectItem>
                  <SelectItem value="PARTNERS_ONLY">Partenaires uniquement</SelectItem>
                  <SelectItem value="ADMINS_ONLY">Administrateurs uniquement</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Subject */}
            <div className="space-y-2">
              <Label htmlFor="subject">Sujet de l'email *</Label>
              <Input
                id="subject"
                placeholder="Ex: Nouveaux produits disponibles"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
              />
            </div>

            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="title">Titre de la newsletter *</Label>
              <Input
                id="title"
                placeholder="Ex: Découvrez notre nouvelle collection"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            {/* Content */}
            <div className="space-y-2">
              <Label htmlFor="content">Contenu *</Label>
              <Textarea
                id="content"
                placeholder="Écrivez votre message ici... Vous pouvez utiliser du HTML basique."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={8}
                className="font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground">
                Vous pouvez utiliser du HTML : &lt;p&gt;, &lt;strong&gt;, &lt;em&gt;, &lt;ul&gt;, &lt;li&gt;, etc.
              </p>
            </div>

            {/* CTA (optional) */}
            <div className="space-y-2">
              <Label htmlFor="ctaText">Bouton d'action (optionnel)</Label>
              <Input
                id="ctaText"
                placeholder="Ex: Voir le catalogue"
                value={ctaText}
                onChange={(e) => setCtaText(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="ctaUrl">Lien du bouton (optionnel)</Label>
              <Input
                id="ctaUrl"
                type="url"
                placeholder="https://marketspas.pro/catalog"
                value={ctaUrl}
                onChange={(e) => setCtaUrl(e.target.value)}
              />
            </div>

            {/* Send Button */}
            <Button
              onClick={handleSend}
              disabled={sending || !subject || !title || !content}
              className="w-full"
              size="lg"
            >
              {sending ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Envoi en cours...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Envoyer la newsletter
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Preview */}
        <Card>
          <CardHeader>
            <CardTitle>Aperçu</CardTitle>
            <CardDescription>
              Voici comment votre newsletter apparaîtra dans les boîtes mail
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="border rounded-lg p-4 bg-gray-50 dark:bg-gray-900">
              {/* Email Header */}
              <div className="bg-gradient-to-r from-primary to-primary/80 text-white p-6 rounded-t-lg text-center">
                <h2 className="text-2xl font-bold">Market Spas</h2>
                <p className="text-sm opacity-90 mt-1">Portail Partenaires B2B</p>
              </div>

              {/* Email Body */}
              <div className="bg-white dark:bg-gray-800 p-6">
                {title && (
                  <h3 className="text-xl font-semibold text-foreground mb-4">
                    {title}
                  </h3>
                )}
                
                {content && (
                  <div 
                    className="text-muted-foreground text-sm leading-relaxed mb-4"
                    dangerouslySetInnerHTML={{ __html: content }}
                  />
                )}

                {ctaText && ctaUrl && (
                  <div className="text-center mt-6">
                    <a
                      href={ctaUrl}
                      className="inline-block bg-gradient-to-r from-primary to-primary/80 text-white px-8 py-3 rounded-lg font-semibold shadow-lg"
                    >
                      {ctaText}
                    </a>
                  </div>
                )}
              </div>

              {/* Email Footer */}
              <div className="bg-gray-100 dark:bg-gray-900 p-4 rounded-b-lg text-center">
                <p className="text-xs text-muted-foreground">
                  Vous recevez cet email car vous êtes partenaire Market Spas.
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  © {new Date().getFullYear()} Market Spas. Tous droits réservés.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
