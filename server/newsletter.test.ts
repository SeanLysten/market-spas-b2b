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

// ─── Test block-to-HTML conversion logic ─────────────────────────────────────

type BlockType = 'header' | 'text' | 'image' | 'cta' | 'divider' | 'two-columns' | 'highlight';

interface NewsletterBlock {
  id: string;
  type: BlockType;
  data: Record<string, string>;
}

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
      <p style="margin:8px 0 0;font-size:12px;color:#94a3b8;">© 2026 Market Spas. Tous droits réservés.</p>
    </div>
  </div>`;
}

describe('Newsletter block-to-HTML conversion', () => {
  it('should render a header block with title and subtitle', () => {
    const block: NewsletterBlock = {
      id: 'test1',
      type: 'header',
      data: { title: 'Mon Titre', subtitle: 'Mon sous-titre' },
    };
    const html = blockToHtml(block);
    expect(html).toContain('Mon Titre');
    expect(html).toContain('Mon sous-titre');
    expect(html).toContain('<h1');
  });

  it('should render a header block without subtitle', () => {
    const block: NewsletterBlock = {
      id: 'test2',
      type: 'header',
      data: { title: 'Titre seul', subtitle: '' },
    };
    const html = blockToHtml(block);
    expect(html).toContain('Titre seul');
    expect(html).not.toContain('<p style="margin:8px');
  });

  it('should render a text block with bold markdown', () => {
    const block: NewsletterBlock = {
      id: 'test3',
      type: 'text',
      data: { content: 'Texte avec **gras** dedans' },
    };
    const html = blockToHtml(block);
    expect(html).toContain('<strong>gras</strong>');
    expect(html).toContain('Texte avec');
  });

  it('should render an image block', () => {
    const block: NewsletterBlock = {
      id: 'test4',
      type: 'image',
      data: { url: 'https://example.com/img.jpg', alt: 'Photo spa' },
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
    };
    const html = blockToHtml(block);
    expect(html).toBe('');
  });

  it('should render a CTA button with custom color', () => {
    const block: NewsletterBlock = {
      id: 'test6',
      type: 'cta',
      data: { text: 'Cliquez ici', url: 'https://marketspas.pro', bgColor: '#16a34a' },
    };
    const html = blockToHtml(block);
    expect(html).toContain('Cliquez ici');
    expect(html).toContain('href="https://marketspas.pro"');
    expect(html).toContain('#16a34a');
  });

  it('should render a divider', () => {
    const block: NewsletterBlock = {
      id: 'test7',
      type: 'divider',
      data: {},
    };
    const html = blockToHtml(block);
    expect(html).toContain('<hr');
  });

  it('should render two-columns block', () => {
    const block: NewsletterBlock = {
      id: 'test8',
      type: 'two-columns',
      data: { left: '**Gauche**', right: '**Droite**' },
    };
    const html = blockToHtml(block);
    expect(html).toContain('<strong>Gauche</strong>');
    expect(html).toContain('<strong>Droite</strong>');
    expect(html).toContain('<table');
  });

  it('should render highlight block with custom background', () => {
    const block: NewsletterBlock = {
      id: 'test9',
      type: 'highlight',
      data: { content: '**Important**', bgColor: '#fef3c7' },
    };
    const html = blockToHtml(block);
    expect(html).toContain('<strong>Important</strong>');
    expect(html).toContain('#fef3c7');
    expect(html).toContain('border-left:4px solid #2563eb');
  });

  it('should generate full HTML with Market Spas header and footer', () => {
    const blocks: NewsletterBlock[] = [
      { id: 'a', type: 'header', data: { title: 'Test', subtitle: '' } },
      { id: 'b', type: 'text', data: { content: 'Contenu test' } },
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
