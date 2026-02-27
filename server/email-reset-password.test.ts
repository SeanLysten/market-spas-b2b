import { describe, it, expect } from 'vitest';
import { sendPasswordResetEmail } from './email';

describe('Password Reset Email', () => {
  it('should send password reset email successfully', async () => {
    const testEmail = 'marketing@spas-wellis.com';
    const testToken = 'test-reset-token-123';
    const testResetUrl = `https://marketspas.pro/reset-password?token=${testToken}`;

    const result = await sendPasswordResetEmail(testEmail, testToken, testResetUrl);

    console.log('[Test] Password reset email result:', result);

    expect(result).toBeDefined();
    expect(result.success).toBe(true);
    
    if (result.success) {
      expect(result.messageId).toBeDefined();
      console.log('[Test] ✅ Email sent successfully with ID:', result.messageId);
    } else {
      console.error('[Test] ❌ Email failed to send:', result.error);
    }
  }, 30000); // 30s timeout for email API
});
