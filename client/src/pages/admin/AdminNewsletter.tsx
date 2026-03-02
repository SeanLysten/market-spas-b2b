import { useState, useCallback, useRef } from 'react';
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
  Edit, ArrowUp, ArrowDown, Palette, Copy, Sparkles, Bold, Italic, Underline,
  AlignLeft, AlignCenter, AlignRight, ChevronDown, ChevronUp, Upload,
  Clock, Calendar, X, Ban, List, Monitor, Smartphone, Maximize2
} from 'lucide-react';
import { toast } from 'sonner';

// ─── Constants ──────────────────────────────────────────────────────────────

const FONT_FAMILIES = [
  { value: 'Arial, Helvetica, sans-serif', label: 'Arial' },
  { value: 'Georgia, serif', label: 'Georgia' },
  { value: 'Verdana, Geneva, sans-serif', label: 'Verdana' },
  { value: "'Times New Roman', Times, serif", label: 'Times New Roman' },
  { value: "'Trebuchet MS', sans-serif", label: 'Trebuchet MS' },
  { value: "'Courier New', Courier, monospace", label: 'Courier New' },
  { value: 'Tahoma, Geneva, sans-serif', label: 'Tahoma' },
  { value: "'Lucida Sans', sans-serif", label: 'Lucida Sans' },
  { value: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif", label: 'Système (défaut)' },
];

const FONT_SIZES = [
  { value: '11', label: '11px' }, { value: '12', label: '12px' }, { value: '13', label: '13px' },
  { value: '14', label: '14px' }, { value: '15', label: '15px' }, { value: '16', label: '16px' },
  { value: '18', label: '18px' }, { value: '20', label: '20px' }, { value: '22', label: '22px' },
  { value: '24', label: '24px' }, { value: '28', label: '28px' }, { value: '32', label: '32px' },
  { value: '36', label: '36px' }, { value: '42', label: '42px' }, { value: '48', label: '48px' },
];

const LINE_HEIGHTS = [
  { value: '1.2', label: 'Serré' }, { value: '1.4', label: 'Compact' },
  { value: '1.6', label: 'Normal' }, { value: '1.8', label: 'Aéré' }, { value: '2.0', label: 'Large' },
];

const PADDING_OPTIONS = [
  { value: '0', label: 'Aucun' }, { value: '8', label: 'Petit' }, { value: '16', label: 'Normal' },
  { value: '24', label: 'Moyen' }, { value: '32', label: 'Grand' }, { value: '48', label: 'Très grand' },
];

// ─── Types ───────────────────────────────────────────────────────────────────

type BlockType = 'header' | 'text' | 'image' | 'cta' | 'divider' | 'two-columns' | 'highlight';

interface BlockStyle {
  fontFamily?: string;
  fontSize?: string;
  textColor?: string;
  bgColor?: string;
  textAlign?: 'left' | 'center' | 'right';
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  lineHeight?: string;
  paddingTop?: string;
  paddingBottom?: string;
}

interface NewsletterBlock {
  id: string;
  type: BlockType;
  data: Record<string, string>;
  style: BlockStyle;
}

type TabView = 'editor' | 'preview' | 'scheduled';

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

const DEFAULT_STYLES: Record<BlockType, BlockStyle> = {
  header: { fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif", fontSize: '28', textColor: '#1e293b', bgColor: '', textAlign: 'center', bold: true, italic: false, underline: false, lineHeight: '1.4', paddingTop: '32', paddingBottom: '16' },
  text: { fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif", fontSize: '15', textColor: '#334155', bgColor: '', textAlign: 'left', bold: false, italic: false, underline: false, lineHeight: '1.7', paddingTop: '16', paddingBottom: '16' },
  image: { fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif", fontSize: '13', textColor: '#94a3b8', bgColor: '', textAlign: 'center', bold: false, italic: false, underline: false, lineHeight: '1.4', paddingTop: '16', paddingBottom: '16' },
  cta: { fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif", fontSize: '16', textColor: '#ffffff', bgColor: '', textAlign: 'center', bold: true, italic: false, underline: false, lineHeight: '1.4', paddingTop: '24', paddingBottom: '24' },
  divider: { fontFamily: '', fontSize: '', textColor: '#e2e8f0', bgColor: '', textAlign: 'center', bold: false, italic: false, underline: false, lineHeight: '1', paddingTop: '16', paddingBottom: '16' },
  'two-columns': { fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif", fontSize: '14', textColor: '#334155', bgColor: '#f8fafc', textAlign: 'left', bold: false, italic: false, underline: false, lineHeight: '1.6', paddingTop: '16', paddingBottom: '16' },
  highlight: { fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif", fontSize: '15', textColor: '#1e293b', bgColor: '#eff6ff', textAlign: 'left', bold: false, italic: false, underline: false, lineHeight: '1.7', paddingTop: '16', paddingBottom: '16' },
};

const NEWSLETTER_TEMPLATES = [
  {
    name: 'Promotion',
    description: 'Annonce de promotion ou offre spéciale',
    blocks: [
      { type: 'header' as BlockType, data: { title: '🎉 Offre Spéciale Partenaires', subtitle: 'Profitez de remises exceptionnelles sur notre gamme' }, style: { ...DEFAULT_STYLES.header } },
      { type: 'image' as BlockType, data: { url: '', alt: 'Promotion en cours' }, style: { ...DEFAULT_STYLES.image } },
      { type: 'text' as BlockType, data: { content: 'Chers partenaires,\n\nNous avons le plaisir de vous annoncer une offre exceptionnelle sur notre gamme de spas. Pendant une durée limitée, bénéficiez de conditions préférentielles sur les modèles sélectionnés.\n\nN\'hésitez pas à nous contacter pour plus de détails.' }, style: { ...DEFAULT_STYLES.text } },
      { type: 'cta' as BlockType, data: { text: 'Voir les offres', url: 'https://marketspas.pro/catalog', buttonColor: '#2563eb' }, style: { ...DEFAULT_STYLES.cta } },
    ],
  },
  {
    name: 'Nouveautés',
    description: 'Présentation de nouveaux produits',
    blocks: [
      { type: 'header' as BlockType, data: { title: 'Nouveaux Modèles Disponibles', subtitle: 'Découvrez les dernières nouveautés de notre catalogue' }, style: { ...DEFAULT_STYLES.header } },
      { type: 'text' as BlockType, data: { content: 'Nous sommes ravis de vous présenter nos nouveaux modèles qui viennent enrichir notre gamme. Ces spas ont été conçus pour répondre aux attentes de vos clients les plus exigeants.' }, style: { ...DEFAULT_STYLES.text } },
      { type: 'two-columns' as BlockType, data: { left: '**Modèle Premium**\nCapacité : 5 places\nJets : 45\nDimensions : 220x220cm\nGarantie : 5 ans', right: '**Modèle Confort**\nCapacité : 4 places\nJets : 32\nDimensions : 200x200cm\nGarantie : 5 ans' }, style: { ...DEFAULT_STYLES['two-columns'] } },
      { type: 'cta' as BlockType, data: { text: 'Consulter le catalogue', url: 'https://marketspas.pro/catalog', buttonColor: '#2563eb' }, style: { ...DEFAULT_STYLES.cta } },
    ],
  },
  {
    name: 'Événement',
    description: 'Invitation à un événement ou salon',
    blocks: [
      { type: 'header' as BlockType, data: { title: '📅 Événement à venir', subtitle: 'Nous vous invitons à nous rejoindre' }, style: { ...DEFAULT_STYLES.header } },
      { type: 'highlight' as BlockType, data: { content: '**Date :** [À compléter]\n**Lieu :** [À compléter]\n**Horaires :** [À compléter]' }, style: { ...DEFAULT_STYLES.highlight } },
      { type: 'text' as BlockType, data: { content: 'Nous serions ravis de vous accueillir lors de cet événement. Ce sera l\'occasion de découvrir nos dernières innovations et d\'échanger avec notre équipe technique.' }, style: { ...DEFAULT_STYLES.text } },
      { type: 'cta' as BlockType, data: { text: 'Confirmer ma présence', url: 'https://marketspas.pro', buttonColor: '#16a34a' }, style: { ...DEFAULT_STYLES.cta } },
    ],
  },
  {
    name: 'Information',
    description: 'Communication générale ou mise à jour',
    blocks: [
      { type: 'header' as BlockType, data: { title: 'Information importante', subtitle: 'Mise à jour de nos services' }, style: { ...DEFAULT_STYLES.header } },
      { type: 'text' as BlockType, data: { content: 'Chers partenaires,\n\nNous souhaitons vous informer des dernières évolutions concernant nos services et notre plateforme. Votre satisfaction est notre priorité et nous travaillons constamment à améliorer votre expérience.' }, style: { ...DEFAULT_STYLES.text } },
      { type: 'divider' as BlockType, data: {}, style: { ...DEFAULT_STYLES.divider } },
      { type: 'text' as BlockType, data: { content: 'N\'hésitez pas à contacter votre interlocuteur habituel pour toute question.' }, style: { ...DEFAULT_STYLES.text } },
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
    cta: { text: '', url: '', buttonColor: '#2563eb' },
    divider: {},
    'two-columns': { left: '', right: '' },
    highlight: { content: '' },
  };
  return { id: generateId(), type, data: { ...defaults[type] }, style: { ...DEFAULT_STYLES[type] } };
}

// ─── Block to HTML conversion ────────────────────────────────────────────────

function textDecorations(s: BlockStyle): string {
  const parts: string[] = [];
  if (s.bold) parts.push('font-weight:700');
  if (s.italic) parts.push('font-style:italic');
  if (s.underline) parts.push('text-decoration:underline');
  return parts.join(';');
}

function baseStyle(s: BlockStyle, extraFontSize?: string): string {
  const parts: string[] = [];
  if (s.fontFamily) parts.push(`font-family:${s.fontFamily}`);
  parts.push(`font-size:${extraFontSize || s.fontSize || '15'}px`);
  if (s.textColor) parts.push(`color:${s.textColor}`);
  if (s.textAlign) parts.push(`text-align:${s.textAlign}`);
  if (s.lineHeight) parts.push(`line-height:${s.lineHeight}`);
  const deco = textDecorations(s);
  if (deco) parts.push(deco);
  return parts.join(';');
}

function wrapPadding(s: BlockStyle, bgColor?: string): string {
  const pt = s.paddingTop || '16';
  const pb = s.paddingBottom || '16';
  let style = `padding:${pt}px 24px ${pb}px`;
  if (bgColor) style += `;background:${bgColor}`;
  else if (s.bgColor) style += `;background:${s.bgColor}`;
  return style;
}

function blockToHtml(block: NewsletterBlock): string {
  const s = block.style || DEFAULT_STYLES[block.type];
  switch (block.type) {
    case 'header': {
      const subtitleSize = Math.max(12, Math.round(parseInt(s.fontSize || '28') * 0.57));
      return `<div style="${wrapPadding(s)}">
        <h1 style="margin:0;${baseStyle(s)}">${block.data.title || ''}</h1>
        ${block.data.subtitle ? `<p style="margin:8px 0 0;font-family:${s.fontFamily || 'inherit'};font-size:${subtitleSize}px;color:#64748b;text-align:${s.textAlign || 'center'};">${block.data.subtitle}</p>` : ''}
      </div>`;
    }
    case 'text':
      return `<div style="${wrapPadding(s)}">
        <p style="margin:0;${baseStyle(s)};white-space:pre-line;">${(block.data.content || '').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')}</p>
      </div>`;
    case 'image':
      if (!block.data.url) return '';
      return `<div style="${wrapPadding(s)}">
        <img src="${block.data.url}" alt="${block.data.alt || ''}" style="max-width:100%;height:auto;border-radius:8px;" />
        ${block.data.alt ? `<p style="margin:8px 0 0;font-family:${s.fontFamily || 'inherit'};font-size:${s.fontSize || '13'}px;color:${s.textColor || '#94a3b8'};text-align:${s.textAlign || 'center'};">${block.data.alt}</p>` : ''}
      </div>`;
    case 'cta':
      return `<div style="${wrapPadding(s)}">
        <a href="${block.data.url || '#'}" style="display:inline-block;padding:14px 32px;background:${block.data.buttonColor || '#2563eb'};color:#ffffff;font-family:${s.fontFamily || 'inherit'};font-size:${s.fontSize || '16'}px;font-weight:600;text-decoration:none;border-radius:8px;">${block.data.text || 'Cliquez ici'}</a>
      </div>`;
    case 'divider':
      return `<div style="${wrapPadding(s)}"><hr style="border:none;border-top:1px solid ${s.textColor || '#e2e8f0'};margin:0;" /></div>`;
    case 'two-columns':
      return `<div style="${wrapPadding(s)}">
        <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
          <tr>
            <td width="48%" valign="top" style="padding:12px;background:${s.bgColor || '#f8fafc'};border-radius:8px;${baseStyle(s)};white-space:pre-line;">${(block.data.left || '').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')}</td>
            <td width="4%"></td>
            <td width="48%" valign="top" style="padding:12px;background:${s.bgColor || '#f8fafc'};border-radius:8px;${baseStyle(s)};white-space:pre-line;">${(block.data.right || '').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')}</td>
          </tr>
        </table>
      </div>`;
    case 'highlight':
      return `<div style="${wrapPadding(s, '')}">
        <div style="padding:20px;background:${s.bgColor || '#eff6ff'};border-radius:8px;border-left:4px solid #2563eb;">
          <p style="margin:0;${baseStyle(s)};white-space:pre-line;">${(block.data.content || '').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')}</p>
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
      <p style="margin:8px 0 0;font-size:12px;color:#94a3b8;">&copy; ${new Date().getFullYear()} Market Spas. Tous droits réservés.</p>
    </div>
  </div>`;
}

// ─── Style Toolbar Component ────────────────────────────────────────────────

function StyleToolbar({ style, onChange, blockType }: {
  style: BlockStyle;
  onChange: (style: BlockStyle) => void;
  blockType: BlockType;
}) {
  const [expanded, setExpanded] = useState(false);
  if (blockType === 'divider') return null;
  const showTextFormatting = blockType !== 'image';
  const showBgColor = blockType === 'highlight' || blockType === 'two-columns';

  return (
    <div className="border-t bg-muted/20 px-3 py-2">
      <div className="flex flex-wrap items-center gap-1.5">
        {showTextFormatting && (
          <select value={style.fontFamily || FONT_FAMILIES[FONT_FAMILIES.length - 1].value} onChange={e => onChange({ ...style, fontFamily: e.target.value })} className="h-7 text-[11px] bg-background border rounded px-1.5 max-w-[110px] cursor-pointer" title="Police">
            {FONT_FAMILIES.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
          </select>
        )}
        <select value={style.fontSize || '15'} onChange={e => onChange({ ...style, fontSize: e.target.value })} className="h-7 text-[11px] bg-background border rounded px-1 w-[60px] cursor-pointer" title="Taille">
          {FONT_SIZES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>
        <div className="w-px h-5 bg-border mx-0.5" />
        {showTextFormatting && (
          <>
            <button type="button" onClick={() => onChange({ ...style, bold: !style.bold })} className={`h-7 w-7 flex items-center justify-center rounded text-xs transition-colors ${style.bold ? 'bg-primary text-primary-foreground' : 'bg-background border hover:bg-muted'}`} title="Gras"><Bold className="h-3.5 w-3.5" /></button>
            <button type="button" onClick={() => onChange({ ...style, italic: !style.italic })} className={`h-7 w-7 flex items-center justify-center rounded text-xs transition-colors ${style.italic ? 'bg-primary text-primary-foreground' : 'bg-background border hover:bg-muted'}`} title="Italique"><Italic className="h-3.5 w-3.5" /></button>
            <button type="button" onClick={() => onChange({ ...style, underline: !style.underline })} className={`h-7 w-7 flex items-center justify-center rounded text-xs transition-colors ${style.underline ? 'bg-primary text-primary-foreground' : 'bg-background border hover:bg-muted'}`} title="Souligné"><Underline className="h-3.5 w-3.5" /></button>
          </>
        )}
        <div className="w-px h-5 bg-border mx-0.5" />
        <button type="button" onClick={() => onChange({ ...style, textAlign: 'left' })} className={`h-7 w-7 flex items-center justify-center rounded text-xs transition-colors ${style.textAlign === 'left' ? 'bg-primary text-primary-foreground' : 'bg-background border hover:bg-muted'}`} title="Gauche"><AlignLeft className="h-3.5 w-3.5" /></button>
        <button type="button" onClick={() => onChange({ ...style, textAlign: 'center' })} className={`h-7 w-7 flex items-center justify-center rounded text-xs transition-colors ${style.textAlign === 'center' ? 'bg-primary text-primary-foreground' : 'bg-background border hover:bg-muted'}`} title="Centrer"><AlignCenter className="h-3.5 w-3.5" /></button>
        <button type="button" onClick={() => onChange({ ...style, textAlign: 'right' })} className={`h-7 w-7 flex items-center justify-center rounded text-xs transition-colors ${style.textAlign === 'right' ? 'bg-primary text-primary-foreground' : 'bg-background border hover:bg-muted'}`} title="Droite"><AlignRight className="h-3.5 w-3.5" /></button>
        <div className="w-px h-5 bg-border mx-0.5" />
        {showTextFormatting && (
          <div className="flex items-center gap-1" title="Couleur du texte">
            <span className="text-[10px] text-muted-foreground">A</span>
            <input type="color" value={style.textColor || '#334155'} onChange={e => onChange({ ...style, textColor: e.target.value })} className="h-6 w-6 rounded border cursor-pointer p-0" />
          </div>
        )}
        {showBgColor && (
          <div className="flex items-center gap-1" title="Couleur de fond">
            <Palette className="h-3 w-3 text-muted-foreground" />
            <input type="color" value={style.bgColor || '#eff6ff'} onChange={e => onChange({ ...style, bgColor: e.target.value })} className="h-6 w-6 rounded border cursor-pointer p-0" />
          </div>
        )}
        <button type="button" onClick={() => setExpanded(!expanded)} className="h-7 px-1.5 flex items-center gap-0.5 rounded text-[10px] text-muted-foreground bg-background border hover:bg-muted ml-auto" title={expanded ? 'Moins d\'options' : 'Plus d\'options'}>
          {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
          <span className="hidden sm:inline">{expanded ? 'Moins' : 'Plus'}</span>
        </button>
      </div>
      {expanded && (
        <div className="flex flex-wrap items-center gap-3 mt-2 pt-2 border-t border-dashed">
          <div className="flex items-center gap-1.5">
            <Label className="text-[10px] text-muted-foreground whitespace-nowrap">Interligne</Label>
            <select value={style.lineHeight || '1.6'} onChange={e => onChange({ ...style, lineHeight: e.target.value })} className="h-7 text-[11px] bg-background border rounded px-1 cursor-pointer">
              {LINE_HEIGHTS.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
            </select>
          </div>
          <div className="flex items-center gap-1.5">
            <Label className="text-[10px] text-muted-foreground whitespace-nowrap">Espace haut</Label>
            <select value={style.paddingTop || '16'} onChange={e => onChange({ ...style, paddingTop: e.target.value })} className="h-7 text-[11px] bg-background border rounded px-1 cursor-pointer">
              {PADDING_OPTIONS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
            </select>
          </div>
          <div className="flex items-center gap-1.5">
            <Label className="text-[10px] text-muted-foreground whitespace-nowrap">Espace bas</Label>
            <select value={style.paddingBottom || '16'} onChange={e => onChange({ ...style, paddingBottom: e.target.value })} className="h-7 text-[11px] bg-background border rounded px-1 cursor-pointer">
              {PADDING_OPTIONS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
            </select>
          </div>
          {!showBgColor && (
            <div className="flex items-center gap-1.5">
              <Label className="text-[10px] text-muted-foreground whitespace-nowrap">Fond du bloc</Label>
              <input type="color" value={style.bgColor || '#ffffff'} onChange={e => onChange({ ...style, bgColor: e.target.value === '#ffffff' ? '' : e.target.value })} className="h-6 w-6 rounded border cursor-pointer p-0" />
              {style.bgColor && <button type="button" onClick={() => onChange({ ...style, bgColor: '' })} className="text-[10px] text-muted-foreground hover:text-foreground">✕</button>}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Image Upload Hook ──────────────────────────────────────────────────────

function useImageUpload() {
  const uploadMutation = trpc.admin.newsletter.uploadImage.useMutation();

  const uploadImage = useCallback(async (file: File): Promise<string | null> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          const base64 = reader.result as string;
          const result = await uploadMutation.mutateAsync({
            fileData: base64,
            fileName: file.name,
            fileType: file.type,
          });
          resolve(result.url);
        } catch (err: any) {
          toast.error('Erreur d\'upload', { description: err.message });
          resolve(null);
        }
      };
      reader.readAsDataURL(file);
    });
  }, [uploadMutation]);

  return { uploadImage, isUploading: uploadMutation.isPending };
}

// ─── Block Editor Component ──────────────────────────────────────────────────

function BlockEditor({ block, onChange, onStyleChange, onDelete, onMoveUp, onMoveDown, onDuplicate, isFirst, isLast }: {
  block: NewsletterBlock;
  onChange: (data: Record<string, string>) => void;
  onStyleChange: (style: BlockStyle) => void;
  onDelete: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onDuplicate: () => void;
  isFirst: boolean;
  isLast: boolean;
}) {
  const blockInfo = BLOCK_TYPES.find(b => b.type === block.type);
  const Icon = blockInfo?.icon || Type;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { uploadImage, isUploading } = useImageUpload();

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Fichier invalide', { description: 'Veuillez sélectionner une image (JPG, PNG, GIF, WebP)' });
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error('Fichier trop volumineux', { description: 'La taille maximale est de 10 Mo' });
      return;
    }
    toast.info('Upload en cours...', { description: file.name });
    const url = await uploadImage(file);
    if (url) {
      onChange({ ...block.data, url });
      toast.success('Image uploadée', { description: 'L\'image a été ajoutée à votre newsletter' });
    }
    // Reset input
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="group relative border rounded-lg bg-card hover:border-primary/30 transition-colors">
      {/* Block Header */}
      <div className="flex items-center gap-2 px-3 py-2 border-b bg-muted/30 rounded-t-lg">
        <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
        <Icon className="h-4 w-4 text-primary" />
        <span className="text-xs font-medium text-muted-foreground flex-1">{blockInfo?.label}</span>
        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onMoveUp} disabled={isFirst}><ArrowUp className="h-3 w-3" /></Button>
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onMoveDown} disabled={isLast}><ArrowDown className="h-3 w-3" /></Button>
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onDuplicate}><Copy className="h-3 w-3" /></Button>
          <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive hover:text-destructive" onClick={onDelete}><Trash2 className="h-3 w-3" /></Button>
        </div>
      </div>

      {/* Block Content */}
      <div className="p-3 space-y-3">
        {block.type === 'header' && (
          <>
            <Input placeholder="Titre principal" value={block.data.title || ''} onChange={e => onChange({ ...block.data, title: e.target.value })} className="text-lg font-semibold" />
            <Input placeholder="Sous-titre (optionnel)" value={block.data.subtitle || ''} onChange={e => onChange({ ...block.data, subtitle: e.target.value })} className="text-sm" />
          </>
        )}

        {block.type === 'text' && (
          <Textarea placeholder="Écrivez votre texte ici... Utilisez **gras** pour mettre en valeur." value={block.data.content || ''} onChange={e => onChange({ ...block.data, content: e.target.value })} rows={4} className="text-sm" />
        )}

        {block.type === 'image' && (
          <>
            <div className="flex gap-2">
              <Input placeholder="URL de l'image ou uploadez un fichier" value={block.data.url || ''} onChange={e => onChange({ ...block.data, url: e.target.value })} className="text-sm flex-1" />
              <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileSelect} className="hidden" />
              <Button type="button" variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} disabled={isUploading} className="shrink-0">
                {isUploading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary" />
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-1" />
                    Uploader
                  </>
                )}
              </Button>
            </div>
            <Input placeholder="Légende (optionnel)" value={block.data.alt || ''} onChange={e => onChange({ ...block.data, alt: e.target.value })} className="text-sm" />
            {block.data.url && (
              <div className="rounded-lg overflow-hidden border bg-muted/30 p-2 relative">
                <img src={block.data.url} alt={block.data.alt || ''} className="max-h-40 mx-auto rounded" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                <button type="button" onClick={() => onChange({ ...block.data, url: '' })} className="absolute top-3 right-3 h-6 w-6 bg-destructive/80 hover:bg-destructive text-white rounded-full flex items-center justify-center" title="Supprimer l'image">
                  <X className="h-3 w-3" />
                </button>
              </div>
            )}
          </>
        )}

        {block.type === 'cta' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input placeholder="Texte du bouton" value={block.data.text || ''} onChange={e => onChange({ ...block.data, text: e.target.value })} className="text-sm" />
            <Input placeholder="URL du lien" value={block.data.url || ''} onChange={e => onChange({ ...block.data, url: e.target.value })} className="text-sm" />
            <div className="flex items-center gap-2 sm:col-span-2">
              <Label className="text-xs text-muted-foreground whitespace-nowrap">Couleur du bouton :</Label>
              <input type="color" value={block.data.buttonColor || '#2563eb'} onChange={e => onChange({ ...block.data, buttonColor: e.target.value })} className="h-8 w-12 rounded border cursor-pointer" />
              <span className="text-xs text-muted-foreground">{block.data.buttonColor || '#2563eb'}</span>
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
            <Textarea placeholder="Colonne gauche... Utilisez **gras**" value={block.data.left || ''} onChange={e => onChange({ ...block.data, left: e.target.value })} rows={4} className="text-sm" />
            <Textarea placeholder="Colonne droite... Utilisez **gras**" value={block.data.right || ''} onChange={e => onChange({ ...block.data, right: e.target.value })} rows={4} className="text-sm" />
          </div>
        )}

        {block.type === 'highlight' && (
          <Textarea placeholder="Texte mis en avant... Utilisez **gras** pour les points clés." value={block.data.content || ''} onChange={e => onChange({ ...block.data, content: e.target.value })} rows={3} className="text-sm" />
        )}
      </div>

      <StyleToolbar style={block.style} onChange={onStyleChange} blockType={block.type} />
    </div>
  );
}

// ─── Scheduled Newsletters List ─────────────────────────────────────────────

function ScheduledNewslettersList() {
  const { data: scheduled, refetch } = trpc.admin.newsletter.listScheduled.useQuery();
  const cancelMutation = trpc.admin.newsletter.cancel.useMutation({
    onSuccess: () => { toast.success('Newsletter annulée'); refetch(); },
    onError: (err) => toast.error('Erreur', { description: err.message }),
  });
  const deleteMutation = trpc.admin.newsletter.deleteScheduled.useMutation({
    onSuccess: () => { toast.success('Newsletter supprimée'); refetch(); },
    onError: (err) => toast.error('Erreur', { description: err.message }),
  });

  const statusLabel = (status: string) => {
    switch (status) {
      case 'PENDING': return <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-600 bg-amber-50 dark:bg-amber-950 dark:text-amber-400 px-2 py-0.5 rounded-full"><Clock className="h-3 w-3" />En attente</span>;
      case 'SENT': return <span className="inline-flex items-center gap-1 text-xs font-medium text-green-600 bg-green-50 dark:bg-green-950 dark:text-green-400 px-2 py-0.5 rounded-full"><CheckCircle2 className="h-3 w-3" />Envoyée</span>;
      case 'CANCELLED': return <span className="inline-flex items-center gap-1 text-xs font-medium text-gray-500 bg-gray-100 dark:bg-gray-800 dark:text-gray-400 px-2 py-0.5 rounded-full"><Ban className="h-3 w-3" />Annulée</span>;
      case 'FAILED': return <span className="inline-flex items-center gap-1 text-xs font-medium text-red-600 bg-red-50 dark:bg-red-950 dark:text-red-400 px-2 py-0.5 rounded-full"><AlertCircle className="h-3 w-3" />Échouée</span>;
      default: return status;
    }
  };

  if (!scheduled || scheduled.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="py-12 text-center">
          <Calendar className="h-12 w-12 mx-auto text-muted-foreground/40 mb-4" />
          <p className="text-muted-foreground font-medium mb-1">Aucune newsletter programmée</p>
          <p className="text-sm text-muted-foreground">Les newsletters programmées apparaîtront ici</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {scheduled.map((nl: any) => (
        <Card key={nl.id}>
          <CardContent className="py-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  {statusLabel(nl.status)}
                  <span className="text-xs text-muted-foreground">
                    {nl.recipients === 'ALL' ? 'Tous' : nl.recipients === 'PARTNERS_ONLY' ? 'Partenaires' : 'Admins'}
                  </span>
                </div>
                <h3 className="font-medium text-sm truncate">{nl.subject}</h3>
                <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    Programmée : {new Date(nl.scheduledAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </span>
                  {nl.sentAt && (
                    <span className="flex items-center gap-1">
                      <Send className="h-3 w-3" />
                      Envoyée : {new Date(nl.sentAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </span>
                  )}
                  {nl.successCount != null && (
                    <span className="text-green-600 dark:text-green-400">{nl.successCount}/{nl.totalRecipients} envoyés</span>
                  )}
                </div>
                {nl.errorMessage && (
                  <p className="text-xs text-red-500 mt-1">{nl.errorMessage}</p>
                )}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {nl.status === 'PENDING' && (
                  <Button variant="outline" size="sm" onClick={() => cancelMutation.mutate({ id: nl.id })} disabled={cancelMutation.isPending}>
                    <Ban className="h-3 w-3 mr-1" />
                    Annuler
                  </Button>
                )}
                {(nl.status === 'CANCELLED' || nl.status === 'SENT' || nl.status === 'FAILED') && (
                  <Button variant="ghost" size="sm" onClick={() => deleteMutation.mutate({ id: nl.id })} disabled={deleteMutation.isPending} className="text-destructive hover:text-destructive">
                    <Trash2 className="h-3 w-3 mr-1" />
                    Supprimer
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────

export default function AdminNewsletter() {
  const [subject, setSubject] = useState('');
  const [recipients, setRecipients] = useState<'ALL' | 'PARTNERS_ONLY' | 'ADMINS_ONLY'>('ALL');
  const [blocks, setBlocks] = useState<NewsletterBlock[]>([]);
  const [sending, setSending] = useState(false);
  const [view, setView] = useState<TabView>('editor');
  const [showSchedule, setShowSchedule] = useState(false);
  const [scheduleDate, setScheduleDate] = useState('');
  const [scheduleTime, setScheduleTime] = useState('');
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'mobile'>('desktop');
  const [fullscreenPreview, setFullscreenPreview] = useState(false);
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

  const scheduleMutation = trpc.admin.newsletter.schedule.useMutation({
    onSuccess: (data) => {
      setSending(false);
      setShowSchedule(false);
      setScheduleDate('');
      setScheduleTime('');
      toast.success('Newsletter programmée', { description: data.message });
      setView('scheduled');
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

  const updateBlockStyle = useCallback((id: string, style: BlockStyle) => {
    setBlocks(prev => prev.map(b => b.id === id ? { ...b, style } : b));
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
      const clone = { ...prev[idx], id: generateId(), data: { ...prev[idx].data }, style: { ...prev[idx].style } };
      const arr = [...prev];
      arr.splice(idx + 1, 0, clone);
      return arr;
    });
  }, []);

  const loadTemplate = useCallback((templateIndex: number) => {
    const template = NEWSLETTER_TEMPLATES[templateIndex];
    if (!template) return;
    setBlocks(template.blocks.map(b => ({ id: generateId(), type: b.type, data: { ...b.data }, style: { ...b.style } })));
    toast.success('Template chargé', { description: `Template "${template.name}" appliqué` });
  }, []);

  const firstHeader = blocks.find(b => b.type === 'header');
  const title = firstHeader?.data.title || subject;

  const handleSend = () => {
    if (!subject) { toast.error('Erreur', { description: 'Veuillez remplir le sujet de l\'email' }); return; }
    if (blocks.length === 0) { toast.error('Erreur', { description: 'Ajoutez au moins un bloc de contenu' }); return; }
    setSending(true);
    setResult(null);
    const htmlContent = blocksToFullHtml(blocks);
    const firstCta = blocks.find(b => b.type === 'cta');
    sendNewsletterMutation.mutate({
      subject, title, content: htmlContent,
      ctaText: firstCta?.data.text || undefined,
      ctaUrl: firstCta?.data.url || undefined,
      recipients, isRawHtml: true,
    });
  };

  const handleSchedule = () => {
    if (!subject) { toast.error('Erreur', { description: 'Veuillez remplir le sujet de l\'email' }); return; }
    if (blocks.length === 0) { toast.error('Erreur', { description: 'Ajoutez au moins un bloc de contenu' }); return; }
    if (!scheduleDate || !scheduleTime) { toast.error('Erreur', { description: 'Veuillez sélectionner une date et une heure' }); return; }
    const scheduledAt = new Date(`${scheduleDate}T${scheduleTime}`);
    if (scheduledAt <= new Date()) { toast.error('Erreur', { description: 'La date doit être dans le futur' }); return; }
    setSending(true);
    const htmlContent = blocksToFullHtml(blocks);
    scheduleMutation.mutate({
      subject, title, content: htmlContent, recipients,
      scheduledAt: scheduledAt.toISOString(),
    });
  };

  const previewHtml = blocksToFullHtml(blocks);

  // Minimum date for schedule (today)
  const today = new Date().toISOString().split('T')[0];

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
              Créez, programmez et envoyez des newsletters visuelles à vos partenaires
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant={view === 'editor' ? 'default' : 'outline'} size="sm" onClick={() => setView('editor')}>
              <Edit className="h-4 w-4 mr-1" /> Éditeur
            </Button>
            <Button variant={view === 'preview' ? 'default' : 'outline'} size="sm" onClick={() => setView('preview')}>
              <Eye className="h-4 w-4 mr-1" /> Aperçu
            </Button>
            <Button variant={view === 'scheduled' ? 'default' : 'outline'} size="sm" onClick={() => setView('scheduled')}>
              <List className="h-4 w-4 mr-1" /> Programmées
            </Button>
          </div>
        </div>

        {/* Result Alert */}
        {result && (
          <Alert className={result.success ? 'border-green-500 bg-green-50 dark:bg-green-950' : 'border-red-500 bg-red-50 dark:bg-red-950'}>
            {result.success ? <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" /> : <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />}
            <AlertDescription className="text-sm">
              <strong>{result.message}</strong>
              <div className="mt-2 text-xs">
                <div>Total : {result.totalRecipients} destinataires</div>
                <div className="text-green-600 dark:text-green-400">Envoyés : {result.successCount}</div>
                {result.failureCount > 0 && <div className="text-red-600 dark:text-red-400">Échecs : {result.failureCount}</div>}
              </div>
            </AlertDescription>
          </Alert>
        )}

        {view === 'scheduled' ? (
          <ScheduledNewslettersList />
        ) : (
          <>
            {/* Settings Bar */}
            <Card>
              <CardContent className="pt-4 pb-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Sujet de l'email *</Label>
                    <Input placeholder="Ex: Nouveaux produits disponibles" value={subject} onChange={(e) => setSubject(e.target.value)} className="text-sm" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs flex items-center gap-1"><Users className="h-3 w-3" /> Destinataires</Label>
                    <Select value={recipients} onValueChange={(value: any) => setRecipients(value)}>
                      <SelectTrigger className="text-sm"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ALL">Tous les utilisateurs actifs</SelectItem>
                        <SelectItem value="PARTNERS_ONLY">Partenaires uniquement</SelectItem>
                        <SelectItem value="ADMINS_ONLY">Administrateurs uniquement</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs flex items-center gap-1"><LayoutTemplate className="h-3 w-3" /> Template</Label>
                    <Select onValueChange={(value) => loadTemplate(parseInt(value))}>
                      <SelectTrigger className="text-sm"><SelectValue placeholder="Choisir un template..." /></SelectTrigger>
                      <SelectContent>
                        {NEWSLETTER_TEMPLATES.map((t, i) => <SelectItem key={i} value={i.toString()}>{t.name} — {t.description}</SelectItem>)}
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
                        <p className="text-sm text-muted-foreground mb-4">Ajoutez des blocs ci-dessous ou choisissez un template pour commencer</p>
                      </CardContent>
                    </Card>
                  ) : (
                    blocks.map((block, index) => (
                      <BlockEditor
                        key={block.id} block={block}
                        onChange={(data) => updateBlock(block.id, data)}
                        onStyleChange={(style) => updateBlockStyle(block.id, style)}
                        onDelete={() => deleteBlock(block.id)}
                        onMoveUp={() => moveBlock(block.id, 'up')}
                        onMoveDown={() => moveBlock(block.id, 'down')}
                        onDuplicate={() => duplicateBlock(block.id)}
                        isFirst={index === 0} isLast={index === blocks.length - 1}
                      />
                    ))
                  )}

                  {/* Add Block Buttons */}
                  <Card>
                    <CardHeader className="py-3 px-4">
                      <CardTitle className="text-sm flex items-center gap-2"><Plus className="h-4 w-4" /> Ajouter un bloc</CardTitle>
                    </CardHeader>
                    <CardContent className="pb-4 px-4">
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {BLOCK_TYPES.map(bt => {
                          const BIcon = bt.icon;
                          return (
                            <Button key={bt.type} variant="outline" size="sm" className="h-auto py-3 flex flex-col gap-1.5 text-xs" onClick={() => addBlock(bt.type)}>
                              <BIcon className="h-4 w-4" /> {bt.label}
                            </Button>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Schedule Section */}
                  {showSchedule && (
                    <Card className="border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/20">
                      <CardHeader className="py-3 px-4">
                        <CardTitle className="text-sm flex items-center gap-2">
                          <Clock className="h-4 w-4 text-amber-600" />
                          Programmer l'envoi
                          <button type="button" onClick={() => setShowSchedule(false)} className="ml-auto text-muted-foreground hover:text-foreground">
                            <X className="h-4 w-4" />
                          </button>
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="pb-4 px-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div className="space-y-1.5">
                            <Label className="text-xs">Date d'envoi</Label>
                            <Input type="date" min={today} value={scheduleDate} onChange={e => setScheduleDate(e.target.value)} className="text-sm" />
                          </div>
                          <div className="space-y-1.5">
                            <Label className="text-xs">Heure d'envoi</Label>
                            <Input type="time" value={scheduleTime} onChange={e => setScheduleTime(e.target.value)} className="text-sm" />
                          </div>
                        </div>
                        <Button onClick={handleSchedule} disabled={sending || !scheduleDate || !scheduleTime} className="w-full mt-3" variant="outline">
                          {sending ? (
                            <><div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary mr-2" /> Programmation...</>
                          ) : (
                            <><Calendar className="h-4 w-4 mr-2" /> Programmer l'envoi</>
                          )}
                        </Button>
                      </CardContent>
                    </Card>
                  )}

                  {/* Action Buttons */}
                  <div className="flex gap-3">
                    <Button onClick={handleSend} disabled={sending || !subject || blocks.length === 0} className="flex-1" size="lg">
                      {sending && !showSchedule ? (
                        <><div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" /> Envoi en cours...</>
                      ) : (
                        <><Send className="h-4 w-4 mr-2" /> Envoyer maintenant</>
                      )}
                    </Button>
                    {!showSchedule && (
                      <Button variant="outline" size="lg" onClick={() => setShowSchedule(true)} disabled={!subject || blocks.length === 0}>
                        <Clock className="h-4 w-4 mr-2" /> Programmer
                      </Button>
                    )}
                  </div>
                </div>

                {/* Live Preview Sidebar */}
                <div className="hidden xl:block xl:col-span-2">
                  <Card className="sticky top-4">
                    <CardHeader className="py-3 px-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="text-sm flex items-center gap-2"><Eye className="h-4 w-4" /> Aperçu en direct</CardTitle>
                          <CardDescription className="text-xs mt-0.5">
                            {previewDevice === 'desktop' ? 'Bureau (600px)' : 'Mobile (375px)'}
                          </CardDescription>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button
                            variant={previewDevice === 'desktop' ? 'default' : 'ghost'}
                            size="icon" className="h-7 w-7"
                            onClick={() => setPreviewDevice('desktop')}
                            title="Aperçu bureau"
                          >
                            <Monitor className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant={previewDevice === 'mobile' ? 'default' : 'ghost'}
                            size="icon" className="h-7 w-7"
                            onClick={() => setPreviewDevice('mobile')}
                            title="Aperçu mobile"
                          >
                            <Smartphone className="h-3.5 w-3.5" />
                          </Button>
                          <div className="w-px h-5 bg-border mx-1" />
                          <Button
                            variant="ghost" size="icon" className="h-7 w-7"
                            onClick={() => setFullscreenPreview(true)}
                            title="Plein écran"
                          >
                            <Maximize2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="p-0">
                      <div className="border-t overflow-y-auto flex justify-center" style={{ maxHeight: '80vh', backgroundColor: '#e2e8f0' }}>
                        <div
                          className="transition-all duration-300 bg-[#f1f5f9]"
                          style={{
                            width: previewDevice === 'mobile' ? '375px' : '100%',
                            maxWidth: '600px',
                            padding: '16px 8px',
                            margin: previewDevice === 'mobile' ? '16px auto' : '0',
                            borderRadius: previewDevice === 'mobile' ? '16px' : '0',
                            boxShadow: previewDevice === 'mobile' ? '0 4px 24px rgba(0,0,0,0.15)' : 'none',
                            minHeight: previewDevice === 'mobile' ? '667px' : 'auto',
                          }}
                          dangerouslySetInnerHTML={{ __html: previewHtml }}
                        />
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            ) : (
              /* Full Preview with device toggle */
              <Card>
                <CardHeader>
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div>
                      <CardTitle className="flex items-center gap-2"><Eye className="h-5 w-5" /> Aperçu de la newsletter</CardTitle>
                      <CardDescription className="mt-1">Voici comment votre newsletter apparaîtra dans les boîtes mail</CardDescription>
                    </div>
                    <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
                      <Button
                        variant={previewDevice === 'desktop' ? 'default' : 'ghost'}
                        size="sm" className="h-8 gap-1.5 text-xs"
                        onClick={() => setPreviewDevice('desktop')}
                      >
                        <Monitor className="h-3.5 w-3.5" /> Bureau
                      </Button>
                      <Button
                        variant={previewDevice === 'mobile' ? 'default' : 'ghost'}
                        size="sm" className="h-8 gap-1.5 text-xs"
                        onClick={() => setPreviewDevice('mobile')}
                      >
                        <Smartphone className="h-3.5 w-3.5" /> Mobile
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-center" style={{ backgroundColor: '#e2e8f0', borderRadius: '12px', padding: '24px 16px', minHeight: '500px' }}>
                    <div
                      className="transition-all duration-300"
                      style={{
                        width: previewDevice === 'mobile' ? '375px' : '640px',
                        maxWidth: '100%',
                        backgroundColor: '#f1f5f9',
                        borderRadius: previewDevice === 'mobile' ? '24px' : '8px',
                        boxShadow: '0 4px 24px rgba(0,0,0,0.12)',
                        overflow: 'hidden',
                        border: previewDevice === 'mobile' ? '8px solid #1e293b' : 'none',
                      }}
                    >
                      {previewDevice === 'mobile' && (
                        <div className="bg-[#1e293b] flex justify-center py-1.5">
                          <div className="w-20 h-1.5 bg-gray-600 rounded-full" />
                        </div>
                      )}
                      <div style={{ padding: '16px' }}>
                        <div className="text-xs text-muted-foreground mb-3 px-2" style={{ fontSize: previewDevice === 'mobile' ? '10px' : '12px' }}>
                          <strong>De :</strong> Market Spas &lt;noreply@marketspas.pro&gt;<br />
                          <strong>Sujet :</strong> {subject || '(aucun sujet)'}
                        </div>
                        <div dangerouslySetInnerHTML={{ __html: previewHtml }} />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>

      {/* Fullscreen Preview Modal */}
      {fullscreenPreview && (
        <div className="fixed inset-0 z-50 bg-black/80 flex flex-col" onClick={() => setFullscreenPreview(false)}>
          {/* Toolbar */}
          <div className="flex items-center justify-between px-6 py-3 bg-background/95 backdrop-blur border-b" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-3">
              <Eye className="h-5 w-5 text-primary" />
              <span className="font-semibold text-sm">Prévisualisation</span>
              <span className="text-xs text-muted-foreground">
                {previewDevice === 'desktop' ? 'Bureau (600px)' : 'Mobile (375px)'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
                <Button
                  variant={previewDevice === 'desktop' ? 'default' : 'ghost'}
                  size="sm" className="h-8 gap-1.5 text-xs"
                  onClick={() => setPreviewDevice('desktop')}
                >
                  <Monitor className="h-3.5 w-3.5" /> Bureau
                </Button>
                <Button
                  variant={previewDevice === 'mobile' ? 'default' : 'ghost'}
                  size="sm" className="h-8 gap-1.5 text-xs"
                  onClick={() => setPreviewDevice('mobile')}
                >
                  <Smartphone className="h-3.5 w-3.5" /> Mobile
                </Button>
              </div>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setFullscreenPreview(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
          {/* Preview Area */}
          <div className="flex-1 overflow-y-auto flex justify-center" style={{ backgroundColor: '#cbd5e1', padding: '32px 16px' }} onClick={e => e.stopPropagation()}>
            <div
              className="transition-all duration-300"
              style={{
                width: previewDevice === 'mobile' ? '375px' : '640px',
                maxWidth: '100%',
                backgroundColor: '#f1f5f9',
                borderRadius: previewDevice === 'mobile' ? '32px' : '8px',
                boxShadow: '0 8px 40px rgba(0,0,0,0.2)',
                overflow: 'hidden',
                border: previewDevice === 'mobile' ? '10px solid #1e293b' : 'none',
                alignSelf: 'flex-start',
              }}
            >
              {previewDevice === 'mobile' && (
                <div className="bg-[#1e293b] flex justify-center py-2">
                  <div className="w-24 h-1.5 bg-gray-600 rounded-full" />
                </div>
              )}
              <div style={{ padding: '16px' }}>
                <div className="text-xs mb-3 px-2" style={{ color: '#64748b', fontSize: previewDevice === 'mobile' ? '10px' : '12px' }}>
                  <strong>De :</strong> Market Spas &lt;noreply@marketspas.pro&gt;<br />
                  <strong>Sujet :</strong> {subject || '(aucun sujet)'}
                </div>
                <div dangerouslySetInnerHTML={{ __html: previewHtml }} />
              </div>
              {previewDevice === 'mobile' && (
                <div className="bg-[#1e293b] flex justify-center py-2">
                  <div className="w-10 h-10 border-2 border-gray-600 rounded-full" />
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
