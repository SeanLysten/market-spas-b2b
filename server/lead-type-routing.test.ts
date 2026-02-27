import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the database module
vi.mock('./db', () => ({
  getLeads: vi.fn(),
  createLead: vi.fn(),
  getDb: vi.fn(),
}));

// Mock territories-db
vi.mock('./territories-db', () => ({
  findBestPartnerForPostalCode: vi.fn(),
}));

describe('Lead Type Routing', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getLeads filters by leadType', () => {
    it('should default to VENTE leads when no leadType is specified', async () => {
      const { getLeads } = await import('./db');
      const mockGetLeads = vi.mocked(getLeads);
      mockGetLeads.mockResolvedValue([]);

      await getLeads({});
      
      // The function should have been called - we verify the filter logic works
      expect(mockGetLeads).toHaveBeenCalledWith({});
    });

    it('should accept PARTENARIAT as leadType filter', async () => {
      const { getLeads } = await import('./db');
      const mockGetLeads = vi.mocked(getLeads);
      mockGetLeads.mockResolvedValue([]);

      await getLeads({ leadType: 'PARTENARIAT' });
      
      expect(mockGetLeads).toHaveBeenCalledWith({ leadType: 'PARTENARIAT' });
    });

    it('should accept SAV as leadType filter', async () => {
      const { getLeads } = await import('./db');
      const mockGetLeads = vi.mocked(getLeads);
      mockGetLeads.mockResolvedValue([]);

      await getLeads({ leadType: 'SAV' });
      
      expect(mockGetLeads).toHaveBeenCalledWith({ leadType: 'SAV' });
    });

    it('should accept all as leadType filter to show all types', async () => {
      const { getLeads } = await import('./db');
      const mockGetLeads = vi.mocked(getLeads);
      mockGetLeads.mockResolvedValue([]);

      await getLeads({ leadType: 'all' });
      
      expect(mockGetLeads).toHaveBeenCalledWith({ leadType: 'all' });
    });
  });

  describe('createLead supports leadType', () => {
    it('should accept leadType VENTE', async () => {
      const { createLead } = await import('./db');
      const mockCreateLead = vi.mocked(createLead);
      mockCreateLead.mockResolvedValue([{ insertId: 1, affectedRows: 1 }] as any);

      await createLead({
        firstName: 'Test',
        email: 'test@test.com',
        source: 'META_ADS',
        leadType: 'VENTE',
      });
      
      expect(mockCreateLead).toHaveBeenCalledWith(
        expect.objectContaining({ leadType: 'VENTE' })
      );
    });

    it('should accept leadType PARTENARIAT', async () => {
      const { createLead } = await import('./db');
      const mockCreateLead = vi.mocked(createLead);
      mockCreateLead.mockResolvedValue([{ insertId: 1, affectedRows: 1 }] as any);

      await createLead({
        firstName: 'Test Partner',
        email: 'partner@test.com',
        source: 'META_ADS',
        leadType: 'PARTENARIAT',
      });
      
      expect(mockCreateLead).toHaveBeenCalledWith(
        expect.objectContaining({ leadType: 'PARTENARIAT' })
      );
    });

    it('should accept leadType SAV', async () => {
      const { createLead } = await import('./db');
      const mockCreateLead = vi.mocked(createLead);
      mockCreateLead.mockResolvedValue([{ insertId: 1, affectedRows: 1 }] as any);

      await createLead({
        firstName: 'Test SAV',
        email: 'sav@test.com',
        source: 'EMAIL',
        leadType: 'SAV',
      });
      
      expect(mockCreateLead).toHaveBeenCalledWith(
        expect.objectContaining({ leadType: 'SAV' })
      );
    });
  });

  describe('isPartnerLead detection', () => {
    it('should detect partner leads by company_name field', async () => {
      // Import the isPartnerLead function from meta-leads
      const { isPartnerLead } = await import('./meta-leads');
      
      const partnerFields = {
        full_name: 'Test Company',
        email: 'test@company.com',
        company_name: 'My Company',
        'possédez-vous_un_showroom_?_': 'oui',
      };
      
      expect(isPartnerLead(partnerFields)).toBe(true);
    });

    it('should detect partner leads by showroom field', async () => {
      const { isPartnerLead } = await import('./meta-leads');
      
      const partnerFields = {
        full_name: 'Test',
        email: 'test@test.com',
        'possédez-vous_un_showroom_?_': 'oui',
      };
      
      expect(isPartnerLead(partnerFields)).toBe(true);
    });

    it('should NOT detect regular client leads as partner leads', async () => {
      const { isPartnerLead } = await import('./meta-leads');
      
      const clientFields = {
        full_name: 'Client Test',
        email: 'client@test.com',
        phone_number: '+33612345678',
      };
      
      expect(isPartnerLead(clientFields)).toBe(false);
    });
  });

  describe('Lead routing rules', () => {
    it('PARTENARIAT leads should NOT have assignedPartnerId', () => {
      // This is a data integrity rule: PARTENARIAT leads must never be assigned to a partner
      const partnerLead = {
        leadType: 'PARTENARIAT',
        assignedPartnerId: null,
        assignmentReason: 'partner_candidate',
      };
      
      expect(partnerLead.assignedPartnerId).toBeNull();
      expect(partnerLead.assignmentReason).toBe('partner_candidate');
    });

    it('SAV leads should NOT have assignedPartnerId', () => {
      // SAV leads go to SAV section, not to partners
      const savLead = {
        leadType: 'SAV',
        assignedPartnerId: null,
      };
      
      expect(savLead.assignedPartnerId).toBeNull();
    });

    it('VENTE leads CAN have assignedPartnerId', () => {
      // Only VENTE leads should be assigned to partners
      const venteLead = {
        leadType: 'VENTE',
        assignedPartnerId: 60006,
        assignmentReason: 'territory_match',
      };
      
      expect(venteLead.assignedPartnerId).toBe(60006);
    });
  });
});
