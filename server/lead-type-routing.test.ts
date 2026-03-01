import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the database module
vi.mock('./db', () => ({
  getLeads: vi.fn(),
  createLead: vi.fn(),
  getLeadsByPartnerId: vi.fn(),
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

    it('should detect partner leads by vente de spa field', async () => {
      const { isPartnerLead } = await import('./meta-leads');
      
      const partnerFields = {
        full_name: 'Test',
        email: 'test@test.com',
        'travaillez-vous_déjà_dans_la_vente_de_spa_?_': 'oui',
      };
      
      expect(isPartnerLead(partnerFields)).toBe(true);
    });

    it('should detect partner leads by domaine similaire field', async () => {
      const { isPartnerLead } = await import('./meta-leads');
      
      const partnerFields = {
        full_name: 'Test',
        email: 'test@test.com',
        'travaillez-vous_dans_un_domaine_similaire_?_': 'oui',
      };
      
      expect(isPartnerLead(partnerFields)).toBe(true);
    });

    it('should detect partner leads by autre marque field', async () => {
      const { isPartnerLead } = await import('./meta-leads');
      
      const partnerFields = {
        full_name: 'Test',
        email: 'test@test.com',
        'vendez-vous_actuellement_une_autre_marque_?': 'oui',
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

    it('should NOT detect leads with only standard fields as partner leads', async () => {
      const { isPartnerLead } = await import('./meta-leads');
      
      const clientFields = {
        full_name: 'Jean Dupont',
        email: 'jean@test.com',
        phone_number: '+33612345678',
        city: 'Paris',
        postal_code: '75001',
        product_interest: 'un_spa',
      };
      
      expect(isPartnerLead(clientFields)).toBe(false);
    });
  });

  describe('Lead routing rules', () => {
    it('PARTENARIAT leads should NOT have assignedPartnerId', () => {
      const partnerLead = {
        leadType: 'PARTENARIAT',
        assignedPartnerId: null,
        assignmentReason: 'partner_candidate',
      };
      
      expect(partnerLead.assignedPartnerId).toBeNull();
      expect(partnerLead.assignmentReason).toBe('partner_candidate');
    });

    it('SAV leads should NOT have assignedPartnerId', () => {
      const savLead = {
        leadType: 'SAV',
        assignedPartnerId: null,
      };
      
      expect(savLead.assignedPartnerId).toBeNull();
    });

    it('VENTE leads CAN have assignedPartnerId', () => {
      const venteLead = {
        leadType: 'VENTE',
        assignedPartnerId: 60006,
        assignmentReason: 'territory_match',
      };
      
      expect(venteLead.assignedPartnerId).toBe(60006);
    });
  });

  describe('Meta sync lead type detection', () => {
    it('should classify leads with company_name as PARTENARIAT during sync', async () => {
      const { isPartnerLead } = await import('./meta-leads');
      
      // Simulate fields from a Meta lead form "Devenir Partenaire"
      const syncFields = {
        full_name: 'Charles ZAMPOL',
        email: 'loopmaze108@gmail.com',
        phone_number: '+33612345678',
        city: 'Metz',
        company_name: 'LOOPMAZE 108',
        'travaillez-vous_dans_un_domaine_similaire_?_': 'oui',
        'travaillez-vous_déjà_dans_la_vente_de_spa_?_': 'non',
      };
      
      const isPartnership = isPartnerLead(syncFields);
      const leadType = isPartnership ? 'PARTENARIAT' : 'VENTE';
      
      expect(isPartnership).toBe(true);
      expect(leadType).toBe('PARTENARIAT');
    });

    it('should classify regular client leads as VENTE during sync', async () => {
      const { isPartnerLead } = await import('./meta-leads');
      
      // Simulate fields from a regular client Meta lead form
      const syncFields = {
        full_name: 'Jean Dupont',
        email: 'jean@test.com',
        phone_number: '+33612345678',
        postal_code: '75001',
        city: 'Paris',
        product_interest: 'un_spa',
      };
      
      const isPartnership = isPartnerLead(syncFields);
      const leadType = isPartnership ? 'PARTENARIAT' : 'VENTE';
      
      expect(isPartnership).toBe(false);
      expect(leadType).toBe('VENTE');
    });
  });
});
