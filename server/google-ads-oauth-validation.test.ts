import { describe, it, expect } from 'vitest';
import { getGoogleAdsOAuthClient, getGoogleAdsAuthUrl } from './google-ads-oauth';

describe('Google Ads OAuth Configuration', () => {
  it('should have GOOGLE_ADS_CLIENT_ID environment variable set', () => {
    expect(process.env.GOOGLE_ADS_CLIENT_ID).toBeDefined();
    expect(process.env.GOOGLE_ADS_CLIENT_ID).not.toBe('');
    expect(process.env.GOOGLE_ADS_CLIENT_ID).toContain('.apps.googleusercontent.com');
  });

  it('should have GOOGLE_ADS_CLIENT_SECRET environment variable set', () => {
    expect(process.env.GOOGLE_ADS_CLIENT_SECRET).toBeDefined();
    expect(process.env.GOOGLE_ADS_CLIENT_SECRET).not.toBe('');
    expect(process.env.GOOGLE_ADS_CLIENT_SECRET).toMatch(/^GOCSPX-/);
  });

  it('should create Google Ads OAuth client successfully', () => {
    const client = getGoogleAdsOAuthClient();
    expect(client).not.toBeNull();
    expect(client).toBeDefined();
  });

  it('should generate Google Ads OAuth URL successfully', () => {
    const authUrl = getGoogleAdsAuthUrl();
    expect(authUrl).not.toBeNull();
    expect(authUrl).toBeDefined();
    expect(authUrl).toContain('accounts.google.com/o/oauth2/v2/auth');
    expect(authUrl).toContain('client_id=');
    expect(authUrl).toContain('redirect_uri=');
    expect(authUrl).toContain('scope=');
    expect(authUrl).toContain(encodeURIComponent('https://www.googleapis.com/auth/adwords'));
  });

  it('should include correct redirect URI in OAuth URL', () => {
    const authUrl = getGoogleAdsAuthUrl();
    expect(authUrl).toContain(encodeURIComponent('/api/google-ads/callback'));
  });
});
