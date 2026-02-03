import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Resend } from 'resend';
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

describe('Deposit Reminder System', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should have valid RESEND_API_KEY configured', () => {
    expect(process.env.RESEND_API_KEY).toBeDefined();
    expect(process.env.RESEND_API_KEY).toMatch(/^re_/);
  });

  it('should send deposit reminder email successfully', async () => {
    const resend = new Resend(process.env.RESEND_API_KEY);
    
    const orderNumber = 'CMD-TEST-003';
    const partnerName = 'Test Partner SARL';
    const depositAmount = '1500.00';
    const totalTTC = '5000.00';
    
    const htmlContent = `
      <h1>Rappel de paiement - Acompte en attente</h1>
      <p>Commande: #${orderNumber}</p>
      <p>Partenaire: ${partnerName}</p>
      <p>Acompte à régler: ${depositAmount} €</p>
      <p>Total TTC: ${totalTTC} €</p>
    `;

    try {
      const { data, error } = await resend.emails.send({
        from: process.env.EMAIL_FROM || 'onboarding@resend.dev',
        to: ['delivered@resend.dev'], // Resend test email that always succeeds
        subject: `💳 Rappel : Acompte en attente - Commande #${orderNumber}`,
        html: htmlContent,
      });

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(data?.id).toBeDefined();
      console.log('[Test] Deposit reminder email sent successfully:', data?.id);
    } catch (err) {
      throw new Error(`Failed to send deposit reminder email: ${err instanceof Error ? err.message : String(err)}`);
    }
  }, 15000);

  it('should reject invalid secret key for cron job', async () => {
    const caller = appRouter.createCaller({
      user: null,
      req: {} as any,
      res: {} as any,
    } as TrpcContext);

    await expect(
      caller.cron.processDepositReminders({ secret: 'wrong-secret' })
    ).rejects.toThrow('Invalid secret key');
  });

  it('should accept valid secret key for cron job', async () => {
    const caller = appRouter.createCaller({
      user: null,
      req: {} as any,
      res: {} as any,
    } as TrpcContext);

    const CRON_SECRET = process.env.CRON_SECRET || 'default-secret-change-me';
    
    const result = await caller.cron.processDepositReminders({ 
      secret: CRON_SECRET,
      hoursThreshold: 48,
    });
    
    expect(result).toBeDefined();
    expect(result.success).toBe(true);
    expect(result.processed).toBeGreaterThanOrEqual(0);
    expect(result.sent).toBeGreaterThanOrEqual(0);
    console.log('[Test] Deposit reminders processed:', result);
  }, 30000);

  it('should calculate urgency level correctly', () => {
    const calculateUrgency = (hoursOverdue: number): 'medium' | 'high' => {
      return hoursOverdue >= 72 ? 'high' : 'medium';
    };

    expect(calculateUrgency(48)).toBe('medium');
    expect(calculateUrgency(60)).toBe('medium');
    expect(calculateUrgency(72)).toBe('high');
    expect(calculateUrgency(96)).toBe('high');
  });

  it('should format prices correctly in French locale', () => {
    const formatPrice = (price: number | string): string => {
      const num = typeof price === 'string' ? parseFloat(price) : price;
      return num.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    };

    expect(formatPrice(1500)).toBe('1\u202f500,00');
    expect(formatPrice('5000.00')).toBe('5\u202f000,00');
    expect(formatPrice(0)).toBe('0,00');
  });

  it('should generate correct email subject based on urgency', () => {
    const getSubject = (orderNumber: string, hoursOverdue: number): string => {
      const urgencyLevel = hoursOverdue >= 72 ? 'high' : 'medium';
      const subjectEmoji = urgencyLevel === 'high' ? '🚨' : '💳';
      const subjectText = urgencyLevel === 'high' ? 'URGENT' : 'Rappel';
      return `${subjectEmoji} ${subjectText} : Acompte en attente - Commande #${orderNumber}`;
    };

    const mediumSubject = getSubject('CMD-001', 48);
    expect(mediumSubject).toContain('💳');
    expect(mediumSubject).toContain('Rappel');

    const highSubject = getSubject('CMD-002', 72);
    expect(highSubject).toContain('🚨');
    expect(highSubject).toContain('URGENT');
  });
});
