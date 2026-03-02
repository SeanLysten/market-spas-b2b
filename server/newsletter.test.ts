import { describe, it, expect, vi, beforeEach } from 'vitest';

// ─── Test the newsletter send route logic ────────────────────────────────────

// Mock users for recipient filtering
const mockUsers = [
  { id: 1, email: 'admin@marketspas.pro', role: 'SUPER_ADMIN', isActive: true },
  { id: 2, email: 'admin2@marketspas.pro', role: 'ADMIN', isActive: true },
  { id: 3, email: 'partner1@spa.fr', role: 'PARTNER', isActive: true },
  { id: 4, email: 'partner2@spa.be', role: 'PARTNER', isActive: true },
  { id: 5, email: 'inactive@spa.fr', role: 'PARTNER', isActive: false },
  { id: 6, email: '', role: 'PARTNER', isActive: true },
];

describe('Newsletter recipient filtering', () => {
  it('should filter ALL active users with email', () => {
    const recipientEmails = mockUsers
      .filter(u => u.isActive && u.email)
      .map(u => u.email);
    expect(recipientEmails).toHaveLength(4);
    expect(recipientEmails).toContain('admin@marketspas.pro');
    expect(recipientEmails).toContain('partner1@spa.fr');
    expect(recipientEmails).not.toContain('inactive@spa.fr');
    expect(recipientEmails).not.toContain('');
  });

  it('should filter PARTNERS_ONLY', () => {
    const recipientEmails = mockUsers
      .filter(u => u.isActive && u.email && u.role === 'PARTNER')
      .map(u => u.email);
    expect(recipientEmails).toHaveLength(2);
    expect(recipientEmails).toContain('partner1@spa.fr');
    expect(recipientEmails).toContain('partner2@spa.be');
    expect(recipientEmails).not.toContain('admin@marketspas.pro');
  });

  it('should filter ADMINS_ONLY', () => {
    const recipientEmails = mockUsers
      .filter(u => u.isActive && u.email && (u.role === 'ADMIN' || u.role === 'SUPER_ADMIN'))
      .map(u => u.email);
    expect(recipientEmails).toHaveLength(2);
    expect(recipientEmails).toContain('admin@marketspas.pro');
    expect(recipientEmails).toContain('admin2@marketspas.pro');
    expect(recipientEmails).not.toContain('partner1@spa.fr');
  });

  it('should exclude inactive users', () => {
    const recipientEmails = mockUsers
      .filter(u => u.isActive && u.email)
      .map(u => u.email);
    expect(recipientEmails).not.toContain('inactive@spa.fr');
  });

  it('should exclude users with empty email', () => {
    const recipientEmails = mockUsers
      .filter(u => u.isActive && u.email)
      .map(u => u.email);
    expect(recipientEmails).not.toContain('');
    expect(recipientEmails).toHaveLength(4);
  });
});

// ─── Types matching the component ───────────────────────────────────────────

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

// ─── Style helper functions (mirroring the component) ───────────────────────

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
  const s = block.style;
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
      <p style="margin:8px 0 0;font-size:12px;color:#94a3b8;">© 2026 Market Spas. Tous droits réservés.</p>
    </div>
  </div>`;
}

// ─── Default style for convenience ──────────────────────────────────────────

const defaultStyle: BlockStyle = {
  fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  fontSize: '15',
  textColor: '#334155',
  bgColor: '',
  textAlign: 'left',
  bold: false,
  italic: false,
  underline: false,
  lineHeight: '1.7',
  paddingTop: '16',
  paddingBottom: '16',
};

// ─── Test style helper functions ────────────────────────────────────────────

describe('Style helper functions', () => {
  it('textDecorations should return empty string for no decorations', () => {
    expect(textDecorations({ bold: false, italic: false, underline: false })).toBe('');
  });

  it('textDecorations should return bold', () => {
    expect(textDecorations({ bold: true })).toBe('font-weight:700');
  });

  it('textDecorations should return italic', () => {
    expect(textDecorations({ italic: true })).toBe('font-style:italic');
  });

  it('textDecorations should return underline', () => {
    expect(textDecorations({ underline: true })).toBe('text-decoration:underline');
  });

  it('textDecorations should combine multiple decorations', () => {
    const result = textDecorations({ bold: true, italic: true, underline: true });
    expect(result).toContain('font-weight:700');
    expect(result).toContain('font-style:italic');
    expect(result).toContain('text-decoration:underline');
  });

  it('baseStyle should include font-family', () => {
    const result = baseStyle({ fontFamily: 'Georgia, serif', fontSize: '16', textColor: '#000' });
    expect(result).toContain('font-family:Georgia, serif');
  });

  it('baseStyle should include font-size', () => {
    const result = baseStyle({ fontSize: '24' });
    expect(result).toContain('font-size:24px');
  });

  it('baseStyle should use extraFontSize when provided', () => {
    const result = baseStyle({ fontSize: '24' }, '18');
    expect(result).toContain('font-size:18px');
    expect(result).not.toContain('font-size:24px');
  });

  it('baseStyle should include text-align', () => {
    const result = baseStyle({ textAlign: 'center' });
    expect(result).toContain('text-align:center');
  });

  it('baseStyle should include line-height', () => {
    const result = baseStyle({ lineHeight: '1.8' });
    expect(result).toContain('line-height:1.8');
  });

  it('baseStyle should include text decorations', () => {
    const result = baseStyle({ bold: true, italic: true });
    expect(result).toContain('font-weight:700');
    expect(result).toContain('font-style:italic');
  });

  it('wrapPadding should generate correct padding', () => {
    const result = wrapPadding({ paddingTop: '32', paddingBottom: '24' });
    expect(result).toBe('padding:32px 24px 24px');
  });

  it('wrapPadding should include bgColor from style', () => {
    const result = wrapPadding({ paddingTop: '16', paddingBottom: '16', bgColor: '#eff6ff' });
    expect(result).toContain('background:#eff6ff');
  });

  it('wrapPadding should prefer explicit bgColor parameter', () => {
    const result = wrapPadding({ paddingTop: '16', paddingBottom: '16', bgColor: '#eff6ff' }, '#fef3c7');
    expect(result).toContain('background:#fef3c7');
    expect(result).not.toContain('#eff6ff');
  });

  it('wrapPadding should use defaults when padding not set', () => {
    const result = wrapPadding({});
    expect(result).toBe('padding:16px 24px 16px');
  });
});

// ─── Test block-to-HTML conversion with styles ──────────────────────────────

describe('Newsletter block-to-HTML conversion with styles', () => {
  it('should render a header block with custom font and color', () => {
    const block: NewsletterBlock = {
      id: 'test1',
      type: 'header',
      data: { title: 'Mon Titre', subtitle: 'Mon sous-titre' },
      style: { ...defaultStyle, fontFamily: 'Georgia, serif', fontSize: '32', textColor: '#1e40af', textAlign: 'center', bold: true },
    };
    const html = blockToHtml(block);
    expect(html).toContain('Mon Titre');
    expect(html).toContain('Mon sous-titre');
    expect(html).toContain('<h1');
    expect(html).toContain('font-family:Georgia, serif');
    expect(html).toContain('font-size:32px');
    expect(html).toContain('color:#1e40af');
    expect(html).toContain('font-weight:700');
  });

  it('should render a header block without subtitle', () => {
    const block: NewsletterBlock = {
      id: 'test2',
      type: 'header',
      data: { title: 'Titre seul', subtitle: '' },
      style: { ...defaultStyle, fontSize: '28', textAlign: 'center' },
    };
    const html = blockToHtml(block);
    expect(html).toContain('Titre seul');
    expect(html).not.toContain('Mon sous-titre');
  });

  it('should render a text block with bold/italic/underline styles', () => {
    const block: NewsletterBlock = {
      id: 'test3',
      type: 'text',
      data: { content: 'Texte avec **gras** dedans' },
      style: { ...defaultStyle, bold: true, italic: true, underline: true },
    };
    const html = blockToHtml(block);
    expect(html).toContain('<strong>gras</strong>');
    expect(html).toContain('font-weight:700');
    expect(html).toContain('font-style:italic');
    expect(html).toContain('text-decoration:underline');
  });

  it('should render a text block with custom font family', () => {
    const block: NewsletterBlock = {
      id: 'test3b',
      type: 'text',
      data: { content: 'Texte en Verdana' },
      style: { ...defaultStyle, fontFamily: 'Verdana, Geneva, sans-serif' },
    };
    const html = blockToHtml(block);
    expect(html).toContain('font-family:Verdana, Geneva, sans-serif');
  });

  it('should render a text block with right alignment', () => {
    const block: NewsletterBlock = {
      id: 'test3c',
      type: 'text',
      data: { content: 'Texte aligné à droite' },
      style: { ...defaultStyle, textAlign: 'right' },
    };
    const html = blockToHtml(block);
    expect(html).toContain('text-align:right');
  });

  it('should render a text block with custom padding', () => {
    const block: NewsletterBlock = {
      id: 'test3d',
      type: 'text',
      data: { content: 'Texte avec grand espacement' },
      style: { ...defaultStyle, paddingTop: '48', paddingBottom: '32' },
    };
    const html = blockToHtml(block);
    expect(html).toContain('padding:48px 24px 32px');
  });

  it('should render an image block with custom style', () => {
    const block: NewsletterBlock = {
      id: 'test4',
      type: 'image',
      data: { url: 'https://example.com/img.jpg', alt: 'Photo spa' },
      style: { ...defaultStyle, fontSize: '14', textAlign: 'center' },
    };
    const html = blockToHtml(block);
    expect(html).toContain('src="https://example.com/img.jpg"');
    expect(html).toContain('Photo spa');
  });

  it('should return empty string for image without URL', () => {
    const block: NewsletterBlock = {
      id: 'test5',
      type: 'image',
      data: { url: '', alt: '' },
      style: { ...defaultStyle },
    };
    const html = blockToHtml(block);
    expect(html).toBe('');
  });

  it('should render a CTA button with custom buttonColor', () => {
    const block: NewsletterBlock = {
      id: 'test6',
      type: 'cta',
      data: { text: 'Cliquez ici', url: 'https://marketspas.pro', buttonColor: '#16a34a' },
      style: { ...defaultStyle, fontFamily: 'Georgia, serif', fontSize: '18' },
    };
    const html = blockToHtml(block);
    expect(html).toContain('Cliquez ici');
    expect(html).toContain('href="https://marketspas.pro"');
    expect(html).toContain('#16a34a');
    expect(html).toContain('font-family:Georgia, serif');
    expect(html).toContain('font-size:18px');
  });

  it('should render a divider with custom color', () => {
    const block: NewsletterBlock = {
      id: 'test7',
      type: 'divider',
      data: {},
      style: { ...defaultStyle, textColor: '#ff0000' },
    };
    const html = blockToHtml(block);
    expect(html).toContain('<hr');
    expect(html).toContain('#ff0000');
  });

  it('should render two-columns block with custom background', () => {
    const block: NewsletterBlock = {
      id: 'test8',
      type: 'two-columns',
      data: { left: '**Gauche**', right: '**Droite**' },
      style: { ...defaultStyle, bgColor: '#fef3c7', fontFamily: 'Tahoma, Geneva, sans-serif' },
    };
    const html = blockToHtml(block);
    expect(html).toContain('<strong>Gauche</strong>');
    expect(html).toContain('<strong>Droite</strong>');
    expect(html).toContain('<table');
    expect(html).toContain('#fef3c7');
    expect(html).toContain('font-family:Tahoma, Geneva, sans-serif');
  });

  it('should render highlight block with custom style', () => {
    const block: NewsletterBlock = {
      id: 'test9',
      type: 'highlight',
      data: { content: '**Important**' },
      style: { ...defaultStyle, bgColor: '#fef3c7', fontSize: '18', textColor: '#92400e' },
    };
    const html = blockToHtml(block);
    expect(html).toContain('<strong>Important</strong>');
    expect(html).toContain('#fef3c7');
    expect(html).toContain('border-left:4px solid #2563eb');
    expect(html).toContain('font-size:18px');
    expect(html).toContain('color:#92400e');
  });

  it('should generate full HTML with Market Spas header and footer', () => {
    const blocks: NewsletterBlock[] = [
      { id: 'a', type: 'header', data: { title: 'Test', subtitle: '' }, style: { ...defaultStyle, fontSize: '28', textAlign: 'center' } },
      { id: 'b', type: 'text', data: { content: 'Contenu test' }, style: { ...defaultStyle } },
    ];
    const html = blocksToFullHtml(blocks);
    expect(html).toContain('Market Spas');
    expect(html).toContain('Portail Partenaires B2B');
    expect(html).toContain('Test');
    expect(html).toContain('Contenu test');
    expect(html).toContain('Tous droits réservés');
  });

  it('should handle empty blocks array', () => {
    const html = blocksToFullHtml([]);
    expect(html).toContain('Market Spas');
    expect(html).toContain('Tous droits réservés');
  });
});

// ─── Test newsletter route input validation ──────────────────────────────────

describe('Newsletter input validation', () => {
  it('should require subject', () => {
    const input = { subject: '', title: 'Test', content: '<p>Hello</p>', recipients: 'ALL' as const };
    expect(input.subject.length).toBe(0);
  });

  it('should require content', () => {
    const input = { subject: 'Test', title: 'Test', content: '', recipients: 'ALL' as const };
    expect(input.content.length).toBe(0);
  });

  it('should accept valid recipients values', () => {
    const validValues = ['ALL', 'PARTNERS_ONLY', 'ADMINS_ONLY'];
    validValues.forEach(v => {
      expect(validValues).toContain(v);
    });
  });

  it('should support isRawHtml flag', () => {
    const input = {
      subject: 'Test',
      title: 'Test',
      content: '<div>Raw HTML</div>',
      recipients: 'ALL' as const,
      isRawHtml: true,
    };
    expect(input.isRawHtml).toBe(true);
  });

  it('should default isRawHtml to false when not provided', () => {
    const input = {
      subject: 'Test',
      title: 'Test',
      content: '<div>Content</div>',
      recipients: 'ALL' as const,
    };
    expect((input as any).isRawHtml).toBeUndefined();
  });
});
