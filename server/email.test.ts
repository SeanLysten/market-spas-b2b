import { describe, it, expect } from 'vitest';
import { Resend } from 'resend';

describe('Resend API Configuration', () => {
  it('should have valid RESEND_API_KEY configured', async () => {
    expect(process.env.RESEND_API_KEY).toBeDefined();
    expect(process.env.RESEND_API_KEY).toMatch(/^re_/);
    
    // Test that Resend client can be instantiated
    const resend = new Resend(process.env.RESEND_API_KEY);
    expect(resend).toBeDefined();
  });

  it('should have EMAIL_FROM configured', () => {
    expect(process.env.EMAIL_FROM).toBeDefined();
    expect(process.env.EMAIL_FROM).toContain('@');
  });

  it('should be able to send a test email', async () => {
    const resend = new Resend(process.env.RESEND_API_KEY);
    
    try {
      const { data, error } = await resend.emails.send({
        from: process.env.EMAIL_FROM || 'onboarding@resend.dev',
        to: ['delivered@resend.dev'], // Resend test email that always succeeds
        subject: 'Test Email - Market Spas',
        html: '<p>This is a test email to validate Resend configuration.</p>',
      });

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(data?.id).toBeDefined();
    } catch (err) {
      // If the test fails, it means the API key is invalid
      throw new Error(`Resend API test failed: ${err instanceof Error ? err.message : String(err)}`);
    }
  }, 10000); // 10 second timeout for API call
});
