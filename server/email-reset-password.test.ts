import { describe, it, expect } from 'vitest';
import { sendPasswordResetEmail } from './email';

describe('Password Reset Email', () => {
  it('should send password reset email successfully', async () => {
    // Use Resend test address to avoid sending real emails to production addresses
    const testEmail = 'delivered@resend.dev';
    const testToken = 'test-reset-token-123';
    const testResetUrl = `https://marketspas.pro/reset-password?token=${testToken}`;

    const result = await sendPasswordResetEmail(testEmail, testToken, testResetUrl);

    expect(result).toBeDefined();
    expect(result.success).toBe(true);
    
    if (result.success) {
      expect(result.messageId).toBeDefined();
    }
  }, 30000); // 30s timeout for email API
});
