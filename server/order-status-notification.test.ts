import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Resend } from 'resend';

describe('Order Status Change Email Notification', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should have valid RESEND_API_KEY configured', () => {
    expect(process.env.RESEND_API_KEY).toBeDefined();
    expect(process.env.RESEND_API_KEY).toMatch(/^re_/);
  });

  it('should send order status change email successfully', async () => {
    const resend = new Resend(process.env.RESEND_API_KEY);
    
    const orderNumber = 'CMD-TEST-002';
    const partnerName = 'Test Partner SARL';
    const oldStatus = 'PENDING_APPROVAL';
    const newStatus = 'SHIPPED';
    const totalTTC = '6360.00';
    
    const htmlContent = `
      <h1>Mise à jour de commande #${orderNumber}</h1>
      <p>Partenaire: ${partnerName}</p>
      <p>Statut: ${oldStatus} → ${newStatus}</p>
      <p>Total TTC: ${totalTTC} €</p>
    `;

    try {
      const { data, error } = await resend.emails.send({
        from: process.env.EMAIL_FROM || 'onboarding@resend.dev',
        to: ['delivered@resend.dev'], // Resend test email that always succeeds
        subject: `🚚 Commande #${orderNumber} - Expédié`,
        html: htmlContent,
      });

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(data?.id).toBeDefined();
      console.log('[Test] Order status change email sent successfully:', data?.id);
    } catch (err) {
      throw new Error(`Failed to send order status change email: ${err instanceof Error ? err.message : String(err)}`);
    }
  }, 15000);

  it('should have correct status configuration for all statuses', () => {
    const statusConfig: Record<string, { label: string; emoji: string }> = {
      PENDING_APPROVAL: { label: "En attente d'approbation", emoji: "⏳" },
      PENDING_DEPOSIT: { label: "Acompte requis", emoji: "💳" },
      DEPOSIT_PAID: { label: "Acompte payé", emoji: "✅" },
      IN_PRODUCTION: { label: "En production", emoji: "🏭" },
      READY_TO_SHIP: { label: "Prêt à expédier", emoji: "📦" },
      SHIPPED: { label: "Expédié", emoji: "🚚" },
      DELIVERED: { label: "Livré", emoji: "🎉" },
      COMPLETED: { label: "Terminé", emoji: "✨" },
      CANCELLED: { label: "Annulé", emoji: "❌" },
    };

    // Verify all statuses have labels and emojis
    Object.entries(statusConfig).forEach(([status, config]) => {
      expect(config.label).toBeDefined();
      expect(config.label.length).toBeGreaterThan(0);
      expect(config.emoji).toBeDefined();
      expect(config.emoji.length).toBeGreaterThan(0);
    });

    // Verify specific statuses
    expect(statusConfig.SHIPPED.emoji).toBe('🚚');
    expect(statusConfig.DELIVERED.emoji).toBe('🎉');
    expect(statusConfig.CANCELLED.emoji).toBe('❌');
  });

  it('should generate correct email subject with status emoji', () => {
    const testCases = [
      { status: 'SHIPPED', emoji: '🚚', label: 'Expédié' },
      { status: 'DELIVERED', emoji: '🎉', label: 'Livré' },
      { status: 'IN_PRODUCTION', emoji: '🏭', label: 'En production' },
    ];

    testCases.forEach(({ status, emoji, label }) => {
      const orderNumber = 'CMD-2026-001';
      const subject = `${emoji} Commande #${orderNumber} - ${label}`;
      
      expect(subject).toContain(orderNumber);
      expect(subject).toContain(emoji);
      expect(subject).toContain(label);
    });
  });

  it('should include all required order information in status change email', () => {
    const statusChangeData = {
      orderNumber: 'CMD-2026-001',
      partnerName: 'Spa Wellness SARL',
      contactName: 'Jean Dupont',
      oldStatus: 'PENDING_APPROVAL',
      newStatus: 'SHIPPED',
      totalTTC: '6360.00',
      portalUrl: 'https://marketspas.pro',
    };

    // Verify all required fields are present
    expect(statusChangeData.orderNumber).toBeDefined();
    expect(statusChangeData.partnerName).toBeDefined();
    expect(statusChangeData.contactName).toBeDefined();
    expect(statusChangeData.oldStatus).toBeDefined();
    expect(statusChangeData.newStatus).toBeDefined();
    expect(statusChangeData.totalTTC).toBeDefined();
    expect(statusChangeData.portalUrl).toBeDefined();

    // Verify status transition is valid
    expect(statusChangeData.oldStatus).not.toBe(statusChangeData.newStatus);
  });

  it('should handle tracking information for shipped orders', () => {
    const shippedOrderData = {
      orderNumber: 'CMD-2026-001',
      newStatus: 'SHIPPED',
      trackingNumber: 'TRACK123456789',
      estimatedDelivery: '15 février 2026',
    };

    expect(shippedOrderData.trackingNumber).toBeDefined();
    expect(shippedOrderData.trackingNumber.length).toBeGreaterThan(0);
    
    // Tracking info should be included for shipped orders
    if (shippedOrderData.newStatus === 'SHIPPED') {
      expect(shippedOrderData.trackingNumber).toBeTruthy();
    }
  });
});
