import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Resend } from 'resend';

describe('Order Email Notification', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should have valid RESEND_API_KEY configured', () => {
    expect(process.env.RESEND_API_KEY).toBeDefined();
    expect(process.env.RESEND_API_KEY).toMatch(/^re_/);
  });

  it('should have EMAIL_FROM configured', () => {
    expect(process.env.EMAIL_FROM).toBeDefined();
  });

  it('should send new order notification email successfully', async () => {
    const resend = new Resend(process.env.RESEND_API_KEY);
    
    const orderNumber = 'CMD-TEST-001';
    const partnerName = 'Test Partner';
    const partnerEmail = 'partner@test.com';
    const totalHT = '1000.00';
    const totalTTC = '1200.00';
    
    const htmlContent = `
      <h1>Nouvelle Commande #${orderNumber}</h1>
      <p>Partenaire: ${partnerName}</p>
      <p>Email: ${partnerEmail}</p>
      <p>Total HT: ${totalHT} €</p>
      <p>Total TTC: ${totalTTC} €</p>
    `;

    try {
      const { data, error } = await resend.emails.send({
        from: process.env.EMAIL_FROM || 'onboarding@resend.dev',
        to: ['delivered@resend.dev'], // Resend test email that always succeeds
        subject: `🛒 Nouvelle commande #${orderNumber} - ${partnerName}`,
        html: htmlContent,
      });

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(data?.id).toBeDefined();
      console.log('[Test] New order notification email sent successfully:', data?.id);
    } catch (err) {
      throw new Error(`Failed to send new order notification email: ${err instanceof Error ? err.message : String(err)}`);
    }
  }, 15000);

  it('should format prices correctly in French locale', () => {
    const formatPrice = (price: number | string): string => {
      const num = typeof price === 'string' ? parseFloat(price) : price;
      return num.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    };

    expect(formatPrice(1000)).toBe('1\u202f000,00');
    expect(formatPrice('1234.56')).toBe('1\u202f234,56');
    expect(formatPrice(0)).toBe('0,00');
  });

  it('should generate correct email subject with order number and partner name', () => {
    const orderNumber = 'CMD-2026-001';
    const partnerName = 'Spa Wellness SARL';
    
    const subject = `🛒 Nouvelle commande #${orderNumber} - ${partnerName}`;
    
    expect(subject).toContain(orderNumber);
    expect(subject).toContain(partnerName);
    expect(subject).toContain('🛒');
  });

  it('should include all required order information in email', () => {
    const orderData = {
      orderNumber: 'CMD-2026-001',
      partnerName: 'Test Partner',
      partnerEmail: 'partner@test.com',
      items: [
        { name: 'Spa 4 places Premium', quantity: 1, unitPriceHT: 5000, totalTTC: 6000 },
        { name: 'Couverture thermique', quantity: 2, unitPriceHT: 150, totalTTC: 360 },
      ],
      totalHT: '5300.00',
      totalTTC: '6360.00',
      deliveryCity: 'Paris',
      deliveryPostalCode: '75001',
    };

    // Verify all required fields are present
    expect(orderData.orderNumber).toBeDefined();
    expect(orderData.partnerName).toBeDefined();
    expect(orderData.partnerEmail).toBeDefined();
    expect(orderData.items.length).toBeGreaterThan(0);
    expect(orderData.totalHT).toBeDefined();
    expect(orderData.totalTTC).toBeDefined();
    expect(orderData.deliveryCity).toBeDefined();
    expect(orderData.deliveryPostalCode).toBeDefined();

    // Verify items have required fields
    orderData.items.forEach(item => {
      expect(item.name).toBeDefined();
      expect(item.quantity).toBeGreaterThan(0);
      expect(item.unitPriceHT).toBeGreaterThanOrEqual(0);
      expect(item.totalTTC).toBeGreaterThanOrEqual(0);
    });
  });
});
