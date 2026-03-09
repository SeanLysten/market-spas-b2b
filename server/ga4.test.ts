import { describe, it, expect } from 'vitest';
import { testGA4Connection, getGA4TrafficReport } from './ga4-api';

describe('Google Analytics 4 Integration', () => {
  it('should connect to GA4 and return data', async () => {
    const isConnected = await testGA4Connection();
    expect(isConnected).toBe(true);
  }, 30000);

  it('should return traffic report with valid structure including new dimensions', async () => {
    const now = new Date();
    const endDate = now.toISOString().split('T')[0];
    const startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const report = await getGA4TrafficReport(startDate, endDate);

    // KPIs de base
    expect(report).toBeDefined();
    expect(typeof report.totalSessions).toBe('number');
    expect(typeof report.totalUsers).toBe('number');
    expect(typeof report.totalPageViews).toBe('number');
    expect(typeof report.avgBounceRate).toBe('number');
    expect(typeof report.avgSessionDuration).toBe('number');
    expect(report.totalSessions).toBeGreaterThanOrEqual(0);

    // Séries temporelles
    expect(Array.isArray(report.dailySessions)).toBe(true);
    if (report.dailySessions.length > 0) {
      const day = report.dailySessions[0];
      expect(typeof day.date).toBe('string');
      expect(day.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(typeof day.sessions).toBe('number');
      expect(typeof day.users).toBe('number');
    }

    // Sources de trafic
    expect(Array.isArray(report.trafficSources)).toBe(true);
    if (report.trafficSources.length > 0) {
      const src = report.trafficSources[0];
      expect(typeof src.channel).toBe('string');
      expect(typeof src.sessions).toBe('number');
      expect(typeof src.users).toBe('number');
      expect(typeof src.pageViews).toBe('number');
      expect(typeof src.bounceRate).toBe('number');
    }

    // Top pages
    expect(Array.isArray(report.topPages)).toBe(true);

    // Géographie : pays
    expect(Array.isArray(report.geoCountries)).toBe(true);
    if (report.geoCountries.length > 0) {
      const country = report.geoCountries[0];
      expect(typeof country.country).toBe('string');
      expect(typeof country.countryCode).toBe('string');
      expect(typeof country.sessions).toBe('number');
      expect(typeof country.users).toBe('number');
      expect(typeof country.bounceRate).toBe('number');
    }

    // Géographie : villes
    expect(Array.isArray(report.geoCities)).toBe(true);
    if (report.geoCities.length > 0) {
      const city = report.geoCities[0];
      expect(typeof city.city).toBe('string');
      expect(typeof city.country).toBe('string');
      expect(typeof city.sessions).toBe('number');
    }

    // Appareils
    expect(Array.isArray(report.devices)).toBe(true);
    if (report.devices.length > 0) {
      const device = report.devices[0];
      expect(typeof device.device).toBe('string');
      expect(typeof device.sessions).toBe('number');
      expect(typeof device.bounceRate).toBe('number');
    }

    // Langues
    expect(Array.isArray(report.languages)).toBe(true);
    if (report.languages.length > 0) {
      const lang = report.languages[0];
      expect(typeof lang.language).toBe('string');
      expect(typeof lang.sessions).toBe('number');
    }

    // Landing pages
    expect(Array.isArray(report.landingPages)).toBe(true);
    if (report.landingPages.length > 0) {
      const lp = report.landingPages[0];
      expect(typeof lp.page).toBe('string');
      expect(typeof lp.sessions).toBe('number');
      expect(typeof lp.bounceRate).toBe('number');
      expect(typeof lp.avgSessionDuration).toBe('number');
    }
  }, 60000);
});
