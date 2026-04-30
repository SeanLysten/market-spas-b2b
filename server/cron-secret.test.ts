import { describe, it, expect } from 'vitest';

describe('CRON_SECRET configuration', () => {
  it('should have CRON_SECRET environment variable set', () => {
    const cronSecret = process.env.CRON_SECRET;
    expect(cronSecret).toBeDefined();
    expect(cronSecret).not.toBe('');
    expect(cronSecret).not.toBe('default-secret-change-me');
  });

  it('should be a strong secret (at least 32 characters)', () => {
    const cronSecret = process.env.CRON_SECRET!;
    expect(cronSecret.length).toBeGreaterThanOrEqual(32);
  });

  it('should not contain the old fallback value', () => {
    const cronSecret = process.env.CRON_SECRET;
    expect(cronSecret).not.toBe('default-secret-change-me');
  });
});
