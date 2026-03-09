import { describe, it, expect } from 'vitest';
import { testGA4Connection, getGA4TrafficReport } from './ga4-api';

describe('Google Analytics 4 Integration', () => {
  it('should connect to GA4 and return data', async () => {
    const isConnected = await testGA4Connection();
    expect(isConnected).toBe(true);
  }, 30000);

  it('should return traffic report with valid structure', async () => {
    const now = new Date();
    const endDate = now.toISOString().split('T')[0];
    const startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const report = await getGA4TrafficReport(startDate, endDate);

    expect(report).toBeDefined();
    expect(typeof report.totalSessions).toBe('number');
    expect(typeof report.totalUsers).toBe('number');
    expect(typeof report.totalPageViews).toBe('number');
    expect(typeof report.avgBounceRate).toBe('number');
    expect(Array.isArray(report.dailySessions)).toBe(true);
    expect(Array.isArray(report.trafficSources)).toBe(true);
    expect(Array.isArray(report.topPages)).toBe(true);
    expect(report.totalSessions).toBeGreaterThanOrEqual(0);
  }, 30000);
});
