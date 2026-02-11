import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock territories-db module
vi.mock('./territories-db', () => ({
  getAllPartnerTerritories: vi.fn().mockResolvedValue([
    {
      id: 1,
      partnerId: 1,
      partnerName: 'Spa Center Brussels',
      regionId: 10,
      regionName: 'Bruxelles-Capitale',
      regionCode: 'BRU',
      countryCode: 'BE',
      countryName: 'Belgique',
      assignedAt: new Date('2025-01-01'),
    },
    {
      id: 2,
      partnerId: 2,
      partnerName: 'Wellness Liège',
      regionId: 20,
      regionName: 'Province de Liège',
      regionCode: 'LIE',
      countryCode: 'BE',
      countryName: 'Belgique',
      assignedAt: new Date('2025-02-01'),
    },
  ]),
  getAllRegionsWithCountry: vi.fn().mockResolvedValue([
    {
      id: 10,
      code: 'BRU',
      name: 'Bruxelles-Capitale',
      nameEn: 'Brussels-Capital',
      nameFr: 'Bruxelles-Capitale',
      nameNl: 'Brussel-Hoofdstad',
      countryId: 1,
      countryCode: 'BE',
      countryName: 'Belgique',
    },
    {
      id: 20,
      code: 'LIE',
      name: 'Province de Liège',
      nameEn: 'Province of Liège',
      nameFr: 'Province de Liège',
      nameNl: 'Provincie Luik',
      countryId: 1,
      countryCode: 'BE',
      countryName: 'Belgique',
    },
  ]),
}));

// ============================================
// UNIT TESTS: Distance calculation
// ============================================

describe('Distance Calculation (Haversine)', () => {
  const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  it('should return 0 for same point', () => {
    const dist = calculateDistance(50.8503, 4.3517, 50.8503, 4.3517);
    expect(dist).toBe(0);
  });

  it('should calculate distance between Brussels and Liège correctly (~90 km)', () => {
    const dist = calculateDistance(50.8503, 4.3517, 50.6292, 5.5797);
    expect(dist).toBeGreaterThan(85);
    expect(dist).toBeLessThan(95);
  });

  it('should calculate distance between Brussels and Paris correctly (~264 km)', () => {
    const dist = calculateDistance(50.8503, 4.3517, 48.8566, 2.3522);
    expect(dist).toBeGreaterThan(250);
    expect(dist).toBeLessThan(280);
  });

  it('should be symmetric (A to B = B to A)', () => {
    const distAB = calculateDistance(50.8503, 4.3517, 50.6292, 5.5797);
    const distBA = calculateDistance(50.6292, 5.5797, 50.8503, 4.3517);
    expect(Math.abs(distAB - distBA)).toBeLessThan(0.001);
  });
});

// ============================================
// UNIT TESTS: Data structures and filtering
// ============================================

describe('Partner Map Data Filtering', () => {
  const mockPartners = [
    {
      id: 1,
      companyName: 'Spa Center Brussels',
      addressStreet: 'Rue de la Loi 1',
      addressCity: 'Bruxelles',
      addressPostalCode: '1000',
      addressCountry: 'BE',
      primaryContactName: 'Jean Dupont',
      primaryContactEmail: 'jean@spacenter.be',
      primaryContactPhone: '+32 2 123 4567',
      status: 'APPROVED',
      level: 'GOLD',
      totalOrders: 15,
      totalRevenue: '45000.00',
    },
    {
      id: 2,
      companyName: 'Wellness Liège',
      addressStreet: 'Place Saint-Lambert 10',
      addressCity: 'Liège',
      addressPostalCode: '4000',
      addressCountry: 'BE',
      primaryContactName: 'Marie Martin',
      primaryContactEmail: 'marie@wellness-liege.be',
      primaryContactPhone: '+32 4 234 5678',
      status: 'PENDING',
      level: 'SILVER',
      totalOrders: 0,
      totalRevenue: '0.00',
    },
    {
      id: 3,
      companyName: 'Spa Antwerp',
      addressStreet: 'Meir 50',
      addressCity: 'Antwerpen',
      addressPostalCode: '2000',
      addressCountry: 'BE',
      primaryContactName: 'Pieter Janssen',
      primaryContactEmail: 'pieter@spa-antwerp.be',
      primaryContactPhone: '+32 3 345 6789',
      status: 'SUSPENDED',
      level: 'BRONZE',
      totalOrders: 3,
      totalRevenue: '8500.00',
    },
  ];

  const mockLeads = [
    {
      leads: {
        id: 1,
        firstName: 'Alice',
        lastName: 'Lemaire',
        email: 'alice@example.com',
        phone: '+32 470 123 456',
        city: 'Namur',
        postalCode: '5000',
        status: 'NEW',
        source: 'META_ADS',
        assignedPartnerId: null,
        productInterest: 'Spa 4 places',
      },
      partners: null,
    },
    {
      leads: {
        id: 2,
        firstName: 'Bob',
        lastName: 'Vandenberghe',
        email: 'bob@example.com',
        phone: '+32 471 234 567',
        city: 'Bruxelles',
        postalCode: '1000',
        status: 'CONTACTED',
        source: 'WEBSITE',
        assignedPartnerId: 1,
        productInterest: 'Swim Spa',
      },
      partners: mockPartners[0],
    },
    {
      leads: {
        id: 3,
        firstName: 'Claire',
        lastName: 'Dubois',
        email: 'claire@example.com',
        phone: null,
        city: 'Liège',
        postalCode: '4000',
        status: 'WON',
        source: 'REFERRAL',
        assignedPartnerId: 2,
        productInterest: 'Spa 6 places',
      },
      partners: mockPartners[1],
    },
  ];

  it('should filter partners by status APPROVED', () => {
    const filtered = mockPartners.filter(p => p.status === 'APPROVED');
    expect(filtered).toHaveLength(1);
    expect(filtered[0].companyName).toBe('Spa Center Brussels');
  });

  it('should filter partners by status PENDING', () => {
    const filtered = mockPartners.filter(p => p.status === 'PENDING');
    expect(filtered).toHaveLength(1);
    expect(filtered[0].companyName).toBe('Wellness Liège');
  });

  it('should return all partners when filter is "all"', () => {
    const statusFilter = 'all';
    const filtered = statusFilter === 'all' ? mockPartners : mockPartners.filter(p => p.status === statusFilter);
    expect(filtered).toHaveLength(3);
  });

  it('should filter leads by status NEW', () => {
    const filtered = mockLeads.filter(l => l.leads.status === 'NEW');
    expect(filtered).toHaveLength(1);
    expect(filtered[0].leads.firstName).toBe('Alice');
  });

  it('should filter leads by status WON', () => {
    const filtered = mockLeads.filter(l => l.leads.status === 'WON');
    expect(filtered).toHaveLength(1);
    expect(filtered[0].leads.firstName).toBe('Claire');
  });

  it('should identify assigned vs unassigned leads', () => {
    const assigned = mockLeads.filter(l => l.leads.assignedPartnerId !== null);
    const unassigned = mockLeads.filter(l => l.leads.assignedPartnerId === null);
    expect(assigned).toHaveLength(2);
    expect(unassigned).toHaveLength(1);
  });

  it('should skip leads without city or postalCode for geocoding', () => {
    const leadsWithLocation = mockLeads.filter(l => l.leads.city || l.leads.postalCode);
    expect(leadsWithLocation).toHaveLength(3);

    const leadsWithoutLocation = [
      { leads: { id: 99, firstName: 'Test', city: null, postalCode: null, status: 'NEW', source: 'OTHER' }, partners: null },
    ];
    const filteredForGeocode = leadsWithoutLocation.filter(l => l.leads.city || l.leads.postalCode);
    expect(filteredForGeocode).toHaveLength(0);
  });
});

// ============================================
// UNIT TESTS: Territory mapping
// ============================================

describe('Territory Mapping for Partners', () => {
  const mockTerritories = [
    { id: 1, partnerId: 1, partnerName: 'Spa Center Brussels', regionId: 10, regionName: 'Bruxelles-Capitale', regionCode: 'BRU', countryCode: 'BE', countryName: 'Belgique' },
    { id: 2, partnerId: 1, partnerName: 'Spa Center Brussels', regionId: 11, regionName: 'Brabant Wallon', regionCode: 'BW', countryCode: 'BE', countryName: 'Belgique' },
    { id: 3, partnerId: 2, partnerName: 'Wellness Liège', regionId: 20, regionName: 'Province de Liège', regionCode: 'LIE', countryCode: 'BE', countryName: 'Belgique' },
  ];

  it('should find territories for a specific partner', () => {
    const partner1Territories = mockTerritories.filter(t => t.partnerId === 1);
    expect(partner1Territories).toHaveLength(2);
    expect(partner1Territories.map(t => t.regionName)).toContain('Bruxelles-Capitale');
    expect(partner1Territories.map(t => t.regionName)).toContain('Brabant Wallon');
  });

  it('should format territory list as comma-separated string', () => {
    const partner1Territories = mockTerritories.filter(t => t.partnerId === 1);
    const formatted = partner1Territories.map(t => `${t.regionName} (${t.countryCode})`).join(', ');
    expect(formatted).toBe('Bruxelles-Capitale (BE), Brabant Wallon (BE)');
  });

  it('should return empty for partner with no territories', () => {
    const partner3Territories = mockTerritories.filter(t => t.partnerId === 99);
    expect(partner3Territories).toHaveLength(0);
    const formatted = partner3Territories.map(t => `${t.regionName} (${t.countryCode})`).join(', ') || 'Aucun territoire';
    expect(formatted).toBe('Aucun territoire');
  });
});

// ============================================
// UNIT TESTS: Stats calculation
// ============================================

describe('Map Stats Calculation', () => {
  const mockPartners = [
    { id: 1, status: 'APPROVED', level: 'GOLD' },
    { id: 2, status: 'PENDING', level: 'SILVER' },
    { id: 3, status: 'APPROVED', level: 'BRONZE' },
    { id: 4, status: 'SUSPENDED', level: 'GOLD' },
  ];

  const mockLeads = [
    { leads: { id: 1, assignedPartnerId: 1, status: 'NEW' }, partners: null },
    { leads: { id: 2, assignedPartnerId: null, status: 'CONTACTED' }, partners: null },
    { leads: { id: 3, assignedPartnerId: 2, status: 'WON' }, partners: null },
    { leads: { id: 4, assignedPartnerId: null, status: 'NEW' }, partners: null },
    { leads: { id: 5, assignedPartnerId: 1, status: 'LOST' }, partners: null },
  ];

  it('should count approved partners', () => {
    const count = mockPartners.filter(p => p.status === 'APPROVED').length;
    expect(count).toBe(2);
  });

  it('should count pending partners', () => {
    const count = mockPartners.filter(p => p.status === 'PENDING').length;
    expect(count).toBe(1);
  });

  it('should count total leads', () => {
    expect(mockLeads.length).toBe(5);
  });

  it('should count assigned leads', () => {
    const assigned = mockLeads.filter(l => l.leads.assignedPartnerId !== null).length;
    expect(assigned).toBe(3);
  });

  it('should count unassigned leads', () => {
    const unassigned = mockLeads.filter(l => l.leads.assignedPartnerId === null).length;
    expect(unassigned).toBe(2);
  });
});

// ============================================
// UNIT TESTS: Level and status color mapping
// ============================================

describe('Level and Status Color Mapping', () => {
  const LEVEL_COLORS: Record<string, string> = {
    VIP: '#7c3aed',
    PLATINUM: '#1e40af',
    GOLD: '#d97706',
    SILVER: '#6b7280',
    BRONZE: '#92400e',
  };

  const STATUS_COLORS: Record<string, string> = {
    APPROVED: '#16a34a',
    PENDING: '#f59e0b',
    SUSPENDED: '#ef4444',
    TERMINATED: '#6b7280',
  };

  const LEAD_STATUS_COLORS: Record<string, string> = {
    NEW: '#3b82f6',
    CONTACTED: '#8b5cf6',
    QUALIFIED: '#f59e0b',
    WON: '#16a34a',
    LOST: '#ef4444',
    ARCHIVED: '#6b7280',
  };

  it('should have a color for every partner level', () => {
    const levels = ['VIP', 'PLATINUM', 'GOLD', 'SILVER', 'BRONZE'];
    levels.forEach(level => {
      expect(LEVEL_COLORS[level]).toBeDefined();
      expect(LEVEL_COLORS[level]).toMatch(/^#[0-9a-f]{6}$/);
    });
  });

  it('should have a color for every partner status', () => {
    const statuses = ['APPROVED', 'PENDING', 'SUSPENDED', 'TERMINATED'];
    statuses.forEach(status => {
      expect(STATUS_COLORS[status]).toBeDefined();
      expect(STATUS_COLORS[status]).toMatch(/^#[0-9a-f]{6}$/);
    });
  });

  it('should have a color for every lead status', () => {
    const statuses = ['NEW', 'CONTACTED', 'QUALIFIED', 'WON', 'LOST', 'ARCHIVED'];
    statuses.forEach(status => {
      expect(LEAD_STATUS_COLORS[status]).toBeDefined();
      expect(LEAD_STATUS_COLORS[status]).toMatch(/^#[0-9a-f]{6}$/);
    });
  });

  it('should return undefined for unknown levels', () => {
    expect(LEVEL_COLORS['UNKNOWN']).toBeUndefined();
  });
});
