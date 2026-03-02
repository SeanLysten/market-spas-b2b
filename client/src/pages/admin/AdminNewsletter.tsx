import { useState, useCallback } from 'react';
import { AdminLayout } from '@/components/AdminLayout';
import { trpc } from '../../lib/trpc';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Textarea } from '../../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Label } from '../../components/ui/label';
import { Alert, AlertDescription } from '../../components/ui/alert';
import {
  Mail, Send, CheckCircle2, AlertCircle, Users, Plus, Trash2, GripVertical,
  Type, Image as ImageIcon, MousePointerClick, Minus, LayoutTemplate, Eye,
  Edit, ArrowUp, ArrowDown, Palette, Copy, Sparkles
} from 'lucide-react';
import { toast } from 'sonner';

// ─── Types ───────────────────────────────────────────────────────────────────

type BlockType = 'header' | 'text' | 'image' | 'cta' | 'divider' | 'two-columns' | 'highlight';

interface NewsletterBlock {
  id: string;
  type: BlockType;
  data: Record<string, string>;
}

// ─── Block Templates ─────────────────────────────────────────────────────────

const BLOCK_TYPES: { type: BlockType; label: string; icon: any; description: string }[] = [
  { type: 'header', label: 'En-tête', icon: Type, description: 'Titre avec sous-titre' },
  { type: 'text', label: 'Texte', icon: Type, description: 'Paragraphe de texte' },
  { type: 'image', label: 'Image', icon: ImageIcon, description: 'Image avec légende' },
  { type: 'cta', label: 'Bouton', icon: MousePointerClick, description: 'Bouton d\'action' },
  { type: 'divider', label: 'Séparateur', icon: Minus, description: 'Ligne de séparation' },
  { type: 'two-columns', label: '2 Colonnes', icon: LayoutTemplate, description: 'Texte sur 2 colonnes' },
  { type: 'highlight', label: 'Encadré', icon: Sparkles, description: 'Texte mis en avant' },
];

const NEWSLETTER_TEMPLATES = [
  {
    name: 'Promotion',
    description: 'Annonce de promotion ou offre spéciale',
    blocks: [
      { type: 'header' as BlockType, data: { title: '🎉 Offre Spéciale Partenaires', subtitle: 'Profitez de remises exceptionnelles sur notre gamme' } },
      { type: 'image' as BlockType, data: { url: '', alt: 'Promotion en cours' } },
      { type: 'text' as BlockType, data: { content: 'Chers partenaires,\n\nNous avons le plaisir de vous annoncer une offre exceptionnelle sur notre gamme de spas. Pendant une durée limitée, bénéficiez de conditions préférentielles sur les modèles sélectionnés.\n\nN\'hésitez pas à nous contacter pour plus de détails.' } },
      { type: 'cta' as BlockType, data: { text: 'Voir les offres', url: 'https://marketspas.pro/catalog', bgColor: '#2563eb' } },
    ],
  },
  {
    name: 'Nouveautés',
    description: 'Présentation de nouveaux produits',
    blocks: [
      { type: 'header' as BlockType, data: { title: 'Nouveaux Modèles Disponibles', subtitle: 'Découvrez les dernières nouveautés de notre catalogue' } },
      { type: 'text' as BlockType, data: { content: 'Nous sommes ravis de vous présenter nos nouveaux modèles qui viennent enrichir notre gamme. Ces spas ont été conçus pour répondre aux attentes de vos clients les plus exigeants.' } },
      { type: 'two-columns' as BlockType, data: { left: '**Modèle Premium**\nCapacité : 5 places\nJets : 45\nDimensions : 220x220cm\nGarantie : 5 ans', right: '**Modèle Confort**\nCapacité : 4 places\nJets : 32\nDimensions : 200x200cm\nGarantie : 5 ans' } },
      { type: 'cta' as BlockType, data: { text: 'Consulter le catalogue', url: 'https://marketspas.pro/catalog', bgColor: '#2563eb' } },
    ],
  },
  {
    name: 'Événement',
    description: 'Invitation à un événement ou salon',
    blocks: [
      { type: 'header' as BlockType, data: { title: '📅 Événement à venir', subtitle: 'Nous vous invitons à nous rejoindre' } },
      { type: 'highlight' as BlockType, data: { content: '**Date :** [À compléter]\n**Lieu :** [À compléter]\n**Horaires :** [À compléter]', bgColor: '#eff6ff' } },
      { type: 'text' as BlockType, data: { content: 'Nous serions ravis de vous accueillir lors de cet événement. Ce sera l\'occasion de découvrir nos dernières innovations et d\'échanger avec notre équipe technique.' } },
      { type: 'cta' as BlockType, data: { text: 'Confirmer ma présence', url: 'https://marketspas.pro', bgColor: '#16a34a' } },
    ],
  },
  {
    name: 'Information',
    description: 'Communication générale ou mise à jour',
    blocks: [
      { type: 'header' as BlockType, data: { title: 'Information importante', subtitle: 'Mise à jour de nos services' } },
      { type: 'text' as BlockType, data: { content: 'Chers partenaires,\n\nNous souhaitons vous informer des dernières évolutions concernant nos services et notre plateforme. Votre satisfaction est notre priorité et nous travaillons constamment à améliorer votre expérience.' } },
      { type: 'divider' as BlockType, data: {} },
      { type: 'text' as BlockType, data: { content: 'N\'hésitez pas à contacter votre interlocuteur habituel pour toute question.' } },
    ],
  },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function generateId() {
  return Math.random().toString(36).substring(2, 9);
}

function createBlock(type: BlockType): NewsletterBlock {
  const defaults: Record<BlockType, Record<string, string>> = {
    header: { title: '', subtitle: '' },
    text: { content: '' },
    image: { url: '', alt: '' },
    cta: { text: '', url: '', bgColor: '#2563eb' },
    divider: {},
    'two-columns': { left: '', right: '' },
    highlight: { content: '', bgColor: '#eff6ff' },
  };
  return { id: generateId(), type, data: { ...defaults[type] } };
}

// ─── Block to HTML conversion ────────────────────────────────────────────────

function blockToHtml(block: NewsletterBlock): string {
  switch (block.type) {
    case 'header':
      return `<div style="text-align:center;padding:32px 24px 16px;">
        <h1 style="margin:0;font-size:28px;font-weight:700;color:#1e293b;line-height:1.3;">${block.data.title || ''}</h1>
        ${block.data.subtitle ? `<p style="margin:8px 0 0;font-size:16px;color:#64748b;">${block.data.subtitle}</p>` : ''}
      </div>`;
    case 'text':
      return `<div style="padding:16px 24px;">
        <p style="margin:0;font-size:15px;line-height:1.7;color:#334155;white-space:pre-line;">${(block.data.content || '').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')}</p>
      </div>`;
    case 'image':
      if (!block.data.url) return '';
      return `<div style="padding:16px 24px;text-align:center;">
        <img src="${block.data.url}" alt="${block.data.alt || ''}" style="max-width:100%;height:auto;border-radius:8px;" />
        ${block.data.alt ? `<p style="margin:8px 0 0;font-size:13px;color:#94a3b8;">${block.data.alt}</p>` : ''}
      </div>`;
    case 'cta':
      return `<div style="padding:24px;text-align:center;">
        <a href="${block.data.url || '#'}" style="display:inline-block;padding:14px 32px;background:${block.data.bgColor || '#2563eb'};color:#ffffff;font-size:16px;font-weight:600;text-decoration:none;border-radius:8px;">${block.data.text || 'Cliquez ici'}</a>
      </div>`;
    case 'divider':
      return `<div style="padding:16px 24px;"><hr style="border:none;border-top:1px solid #e2e8f0;margin:0;" /></div>`;
    case 'two-columns':
      return `<div style="padding:16px 24px;">
        <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
          <tr>
            <td width="48%" valign="top" style="padding:12px;background:#f8fafc;border-radius:8px;font-size:14px;line-height:1.6;color:#334155;white-space:pre-line;">${(block.data.left || '').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')}</td>
            <td width="4%"></td>
            <td width="48%" valign="top" style="padding:12px;background:#f8fafc;border-radius:8px;font-size:14px;line-height:1.6;color:#334155;white-space:pre-line;">${(block.data.right || '').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')}</td>
          </tr>
        </table>
      </div>`;
    case 'highlight':
      return `<div style="padding:16px 24px;">
        <div style="padding:20px;background:${block.data.bgColor || '#eff6ff'};border-radius:8px;border-left:4px solid #2563eb;">
          <p style="margin:0;font-size:15px;line-height:1.7;color:#1e293b;white-space:pre-line;">${(block.data.content || '').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')}</p>
        </div>
      </div>`;
    default:
      return '';
  }
}

function blocksToFullHtml(blocks: NewsletterBlock[]): string {
  const bodyHtml = blocks.map(blockToHtml).join('');
  return `<div style="max-width:600px;margin:0 auto;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
    <div style="background:linear-gradient(135deg,#1e40af,#3b82f6);padding:32px 24px;text-align:center;border-radius:12px 12px 0 0;">
      <h2 style="margin:0;color:#ffffff;font-size:24px;font-weight:700;">Market Spas</h2>
      <p style="margin:6px 0 0;color:rgba(255,255,255,0.85);font-size:14px;">Portail Partenaires B2B</p>
    </div>
    <div style="background:#ffffff;padding:8px 0;">
      ${bodyHtml}
    </div>
    <div style="background:#f1f5f9;padding:24px;text-align:center;border-radius:0 0 12px 12px;">
      <p style="margin:0;font-size:12px;color:#94a3b8;">Vous recevez cet email car vous êtes partenaire Market Spas.</p>
      <p style="margin:8px 0 0;font-size:12px;color:#94a3b8;">© ${new Date().getFullYear()} Market Spas. Tous droits réservés.</p>
    </div>
  </div>`;
}

// ─── Block Editor Component ──────────────────────────────────────────────────

function BlockEditor({ block, onChange, onDelete, onMoveUp, onMoveDown, onDuplicate, isFirst, isLast }: {
  block: NewsletterBlock;
  onChange: (data: Record<string, string>) => void;
  onDelete: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onDuplicate: () => void;
  isFirst: boolean;
  isLast: boolean;
}) {
  const blockInfo = BLOCK_TYPES.find(b => b.type === block.type);
  const Icon = blockInfo?.icon || Type;

  return (
    <div className="group relative border rounded-lg bg-card hover:border-primary/30 transition-colors">
      {/* Block Header */}
      <div className="flex items-center gap-2 px-3 py-2 border-b bg-muted/30 rounded-t-lg">
        <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
        <Icon className="h-4 w-4 text-primary" />
        <span className="text-xs font-medium text-muted-foreground flex-1">{blockInfo?.label}</span>
        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onMoveUp} disabled={isFirst}>
            <ArrowUp className="h-3 w-3" />
          </Button>
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onMoveDown} disabled={isLast}>
            <ArrowDown className="h-3 w-3" />
          </Button>
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onDuplicate}>
            <Copy className="h-3 w-3" />
          </Button>
          <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive hover:text-destructive" onClick={onDelete}>
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {/* Block Content */}
      <div className="p-3 space-y-3">
        {block.type === 'header' && (
          <>
            <Input
              placeholder="Titre principal"
              value={block.data.title || ''}
              onChange={e => onChange({ ...block.data, title: e.target.value })}
              className="text-lg font-semibold"
            />
            <Input
              placeholder="Sous-titre (optionnel)"
              value={block.data.subtitle || ''}
              onChange={e => onChange({ ...block.data, subtitle: e.target.value })}
              className="text-sm"
            />
          </>
        )}

        {block.type === 'text' && (
          <Textarea
            placeholder="Écrivez votre texte ici... Utilisez **gras** pour mettre en valeur."
            value={block.data.content || ''}
            onChange={e => onChange({ ...block.data, content: e.target.value })}
            rows={4}
            className="text-sm"
          />
        )}

        {block.type === 'image' && (
          <>
            <Input
              placeholder="URL de l'image"
              value={block.data.url || ''}
              onChange={e => onChange({ ...block.data, url: e.target.value })}
              className="text-sm"
            />
            <Input
              placeholder="Légende (optionnel)"
              value={block.data.alt || ''}
              onChange={e => onChange({ ...block.data, alt: e.target.value })}
              className="text-sm"
            />
            {block.data.url && (
              <div className="rounded-lg overflow-hidden border bg-muted/30 p-2">
                <img src={block.data.url} alt={block.data.alt || ''} className="max-h-40 mx-auto rounded" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
              </div>
            )}
          </>
        )}

        {block.type === 'cta' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              placeholder="Texte du bouton"
              value={block.data.text || ''}
              onChange={e => onChange({ ...block.data, text: e.target.value })}
              className="text-sm"
            />
            <Input
              placeholder="URL du lien"
              value={block.data.url || ''}
              onChange={e => onChange({ ...block.data, url: e.target.value })}
              className="text-sm"
            />
            <div className="flex items-center gap-2 sm:col-span-2">
              <Label className="text-xs text-muted-foreground whitespace-nowrap">Couleur :</Label>
              <input
                type="color"
                value={block.data.bgColor || '#2563eb'}
                onChange={e => onChange({ ...block.data, bgColor: e.target.value })}
                className="h-8 w-12 rounded border cursor-pointer"
              />
              <span className="text-xs text-muted-foreground">{block.data.bgColor || '#2563eb'}</span>
            </div>
          </div>
        )}

        {block.type === 'divider' && (
          <div className="py-2">
            <hr className="border-dashed" />
            <p className="text-xs text-muted-foreground text-center mt-1">Ligne de séparation</p>
          </div>
        )}

        {block.type === 'two-columns' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Textarea
              placeholder="Colonne gauche... Utilisez **gras**"
              value={block.data.left || ''}
              onChange={e => onChange({ ...block.data, left: e.target.value })}
              rows={4}
              className="text-sm"
            />
            <Textarea
              placeholder="Colonne droite... Utilisez **gras**"
              value={block.data.right || ''}
              onChange={e => onChange({ ...block.data, right: e.target.value })}
              rows={4}
              className="text-sm"
            />
          </div>
        )}

        {block.type === 'highlight' && (
          <>
            <Textarea
              placeholder="Texte mis en avant... Utilisez **gras** pour les points clés."
              value={block.data.content || ''}
              onChange={e => onChange({ ...block.data, content: e.target.value })}
              rows={3}
              className="text-sm"
            />
            <div className="flex items-center gap-2">
              <Label className="text-xs text-muted-foreground whitespace-nowrap">Fond :</Label>
              <input
                type="color"
                value={block.data.bgColor || '#eff6ff'}
                onChange={e => onChange({ ...block.data, bgColor: e.target.value })}
                className="h-8 w-12 rounded border cursor-pointer"
              />
              <span className="text-xs text-muted-foreground">{block.data.bgColor || '#eff6ff'}</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────

export default function AdminNewsletter() {
  const [subject, setSubject] = useState('');
  const [recipients, setRecipients] = useState<'ALL' | 'PARTNERS_ONLY' | 'ADMINS_ONLY'>('ALL');
  const [blocks, setBlocks] = useState<NewsletterBlock[]>([]);
  const [sending, setSending] = useState(false);
  const [view, setView] = useState<'editor' | 'preview'>('editor');
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
      toast.success('Newsletter envoyée', { description: data.message });
    },
    onError: (error) => {
      setSending(false);
      toast.error('Erreur', { description: error.message });
    },
  });

  // Block operations
  const addBlock = useCallback((type: BlockType) => {
    setBlocks(prev => [...prev, createBlock(type)]);
  }, []);

  const updateBlock = useCallback((id: string, data: Record<string, string>) => {
    setBlocks(prev => prev.map(b => b.id === id ? { ...b, data } : b));
  }, []);

  const deleteBlock = useCallback((id: string) => {
    setBlocks(prev => prev.filter(b => b.id !== id));
  }, []);

  const moveBlock = useCallback((id: string, direction: 'up' | 'down') => {
    setBlocks(prev => {
      const idx = prev.findIndex(b => b.id === id);
      if (idx < 0) return prev;
      const newIdx = direction === 'up' ? idx - 1 : idx + 1;
      if (newIdx < 0 || newIdx >= prev.length) return prev;
      const arr = [...prev];
      [arr[idx], arr[newIdx]] = [arr[newIdx], arr[idx]];
      return arr;
    });
  }, []);

  const duplicateBlock = useCallback((id: string) => {
    setBlocks(prev => {
      const idx = prev.findIndex(b => b.id === id);
      if (idx < 0) return prev;
      const clone = { ...prev[idx], id: generateId(), data: { ...prev[idx].data } };
      const arr = [...prev];
      arr.splice(idx + 1, 0, clone);
      return arr;
    });
  }, []);

  const loadTemplate = useCallback((templateIndex: number) => {
    const template = NEWSLETTER_TEMPLATES[templateIndex];
    if (!template) return;
    setBlocks(template.blocks.map(b => ({ id: generateId(), type: b.type, data: { ...b.data } })));
    toast.success('Template chargé', { description: `Template "${template.name}" appliqué` });
  }, []);

  // Extract title from first header block for the mutation
  const firstHeader = blocks.find(b => b.type === 'header');
  const title = firstHeader?.data.title || subject;

  const handleSend = () => {
    if (!subject) {
      toast.error('Erreur', { description: 'Veuillez remplir le sujet de l\'email' });
      return;
    }
    if (blocks.length === 0) {
      toast.error('Erreur', { description: 'Ajoutez au moins un bloc de contenu' });
      return;
    }

    setSending(true);
    setResult(null);

    const htmlContent = blocksToFullHtml(blocks);
    const firstCta = blocks.find(b => b.type === 'cta');

    sendNewsletterMutation.mutate({
      subject,
      title: title,
      content: htmlContent,
      ctaText: firstCta?.data.text || undefined,
      ctaUrl: firstCta?.data.url || undefined,
      recipients,
      isRawHtml: true,
    });
  };

  const previewHtml = blocksToFullHtml(blocks);

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground flex items-center gap-2">
              <Mail className="h-7 w-7 text-primary" />
              Newsletter
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Créez et envoyez des newsletters visuelles à vos partenaires
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant={view === 'editor' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setView('editor')}
            >
              <Edit className="h-4 w-4 mr-1" />
              Éditeur
            </Button>
            <Button
              variant={view === 'preview' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setView('preview')}
            >
              <Eye className="h-4 w-4 mr-1" />
              Aperçu
            </Button>
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
                <div className="text-green-600 dark:text-green-400">Envoyés : {result.successCount}</div>
                {result.failureCount > 0 && (
                  <div className="text-red-600 dark:text-red-400">Échecs : {result.failureCount}</div>
                )}
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Settings Bar */}
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs">Sujet de l'email *</Label>
                <Input
                  placeholder="Ex: Nouveaux produits disponibles"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs flex items-center gap-1">
                  <Users className="h-3 w-3" /> Destinataires
                </Label>
                <Select value={recipients} onValueChange={(value: any) => setRecipients(value)}>
                  <SelectTrigger className="text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">Tous les utilisateurs actifs</SelectItem>
                    <SelectItem value="PARTNERS_ONLY">Partenaires uniquement</SelectItem>
                    <SelectItem value="ADMINS_ONLY">Administrateurs uniquement</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs flex items-center gap-1">
                  <LayoutTemplate className="h-3 w-3" /> Template
                </Label>
                <Select onValueChange={(value) => loadTemplate(parseInt(value))}>
                  <SelectTrigger className="text-sm">
                    <SelectValue placeholder="Choisir un template..." />
                  </SelectTrigger>
                  <SelectContent>
                    {NEWSLETTER_TEMPLATES.map((t, i) => (
                      <SelectItem key={i} value={i.toString()}>
                        {t.name} — {t.description}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {view === 'editor' ? (
          <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
            {/* Block Editor */}
            <div className="xl:col-span-3 space-y-3">
              {blocks.length === 0 ? (
                <Card className="border-dashed">
                  <CardContent className="py-12 text-center">
                    <LayoutTemplate className="h-12 w-12 mx-auto text-muted-foreground/40 mb-4" />
                    <p className="text-muted-foreground font-medium mb-1">Aucun contenu</p>
                    <p className="text-sm text-muted-foreground mb-4">
                      Ajoutez des blocs ci-dessous ou choisissez un template pour commencer
                    </p>
                  </CardContent>
                </Card>
              ) : (
                blocks.map((block, index) => (
                  <BlockEditor
                    key={block.id}
                    block={block}
                    onChange={(data) => updateBlock(block.id, data)}
                    onDelete={() => deleteBlock(block.id)}
                    onMoveUp={() => moveBlock(block.id, 'up')}
                    onMoveDown={() => moveBlock(block.id, 'down')}
                    onDuplicate={() => duplicateBlock(block.id)}
                    isFirst={index === 0}
                    isLast={index === blocks.length - 1}
                  />
                ))
              )}

              {/* Add Block Buttons */}
              <Card>
                <CardHeader className="py-3 px-4">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Plus className="h-4 w-4" />
                    Ajouter un bloc
                  </CardTitle>
                </CardHeader>
                <CardContent className="pb-4 px-4">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {BLOCK_TYPES.map(bt => {
                      const Icon = bt.icon;
                      return (
                        <Button
                          key={bt.type}
                          variant="outline"
                          size="sm"
                          className="h-auto py-3 flex flex-col gap-1.5 text-xs"
                          onClick={() => addBlock(bt.type)}
                        >
                          <Icon className="h-4 w-4" />
                          {bt.label}
                        </Button>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              {/* Send Button */}
              <Button
                onClick={handleSend}
                disabled={sending || !subject || blocks.length === 0}
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
            </div>

            {/* Live Preview Sidebar */}
            <div className="hidden xl:block xl:col-span-2">
              <Card className="sticky top-4">
                <CardHeader className="py-3 px-4">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Eye className="h-4 w-4" />
                    Aperçu en direct
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Rendu fidèle à l'email reçu
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="border-t overflow-y-auto" style={{ maxHeight: '80vh' }}>
                    <div
                      className="bg-[#f1f5f9]"
                      style={{ padding: '16px 8px' }}
                      dangerouslySetInnerHTML={{ __html: previewHtml }}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        ) : (
          /* Full Preview */
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5" />
                Aperçu de la newsletter
              </CardTitle>
              <CardDescription>
                Voici comment votre newsletter apparaîtra dans les boîtes mail
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="max-w-[640px] mx-auto border rounded-lg overflow-hidden bg-gray-50 dark:bg-gray-900 p-4">
                <div className="text-xs text-muted-foreground mb-3 px-2">
                  <strong>De :</strong> Market Spas &lt;noreply@marketspas.pro&gt;<br />
                  <strong>Sujet :</strong> {subject || '(aucun sujet)'}
                </div>
                <div dangerouslySetInnerHTML={{ __html: previewHtml }} />
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </AdminLayout>
  );
}
