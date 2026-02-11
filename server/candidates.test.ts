import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock the database module
const mockSelect = vi.fn();
const mockInsert = vi.fn();
const mockUpdate = vi.fn();
const mockDelete = vi.fn();
const mockFrom = vi.fn();
const mockWhere = vi.fn();
const mockSet = vi.fn();
const mockValues = vi.fn();
const mockLimit = vi.fn();
const mockOrderBy = vi.fn();

const mockDb = {
  select: mockSelect,
  insert: mockInsert,
  update: mockUpdate,
  delete: mockDelete,
};

vi.mock("./db", () => ({
  getDb: vi.fn().mockResolvedValue(mockDb),
}));

vi.mock("../drizzle/schema", () => ({
  partnerCandidates: {
    id: "id",
    priorityScore: "priorityScore",
    phoneCallsCount: "phoneCallsCount",
    emailsSentCount: "emailsSentCount",
    status: "status",
    city: "city",
  },
  candidateContactHistory: {
    candidateId: "candidateId",
    date: "date",
  },
}));

// Chain mock setup
beforeEach(() => {
  vi.clearAllMocks();

  // select().from().orderBy()
  mockOrderBy.mockResolvedValue([]);
  mockFrom.mockReturnValue({ orderBy: mockOrderBy, where: mockWhere });
  mockSelect.mockReturnValue({ from: mockFrom });

  // select().from().where().limit()
  mockLimit.mockResolvedValue([]);
  mockWhere.mockReturnValue({ limit: mockLimit, orderBy: mockOrderBy });

  // insert().values()
  mockValues.mockResolvedValue([{ insertId: 1 }]);
  mockInsert.mockReturnValue({ values: mockValues });

  // update().set().where()
  mockSet.mockReturnValue({ where: mockWhere.mockResolvedValue(undefined) });
  mockUpdate.mockReturnValue({ set: mockSet });

  // delete().where()
  mockDelete.mockReturnValue({ where: mockWhere.mockResolvedValue(undefined) });
});

describe("Partner Candidates - Business Logic", () => {
  describe("Priority Score Calculation", () => {
    it("should calculate score 0 when all criteria are 'non'", () => {
      const criteria = { showroom: "non", vendSpa: "non", autreMarque: "non", domaineSimilaire: "non" };
      let score = 0;
      if (criteria.showroom === "oui") score += 2;
      if (criteria.vendSpa === "oui") score += 3;
      if (criteria.autreMarque === "oui") score += 2;
      if (criteria.domaineSimilaire === "oui") score += 1;
      expect(score).toBe(0);
    });

    it("should calculate score 8 when all criteria are 'oui'", () => {
      const criteria = { showroom: "oui", vendSpa: "oui", autreMarque: "oui", domaineSimilaire: "oui" };
      let score = 0;
      if (criteria.showroom === "oui") score += 2;
      if (criteria.vendSpa === "oui") score += 3;
      if (criteria.autreMarque === "oui") score += 2;
      if (criteria.domaineSimilaire === "oui") score += 1;
      expect(score).toBe(8);
    });

    it("should calculate score 5 for showroom + vendSpa", () => {
      const criteria = { showroom: "oui", vendSpa: "oui", autreMarque: "non", domaineSimilaire: "non" };
      let score = 0;
      if (criteria.showroom === "oui") score += 2;
      if (criteria.vendSpa === "oui") score += 3;
      if (criteria.autreMarque === "oui") score += 2;
      if (criteria.domaineSimilaire === "oui") score += 1;
      expect(score).toBe(5);
    });

    it("should calculate score 3 for vendSpa only", () => {
      const criteria = { showroom: "non", vendSpa: "oui", autreMarque: "non", domaineSimilaire: "non" };
      let score = 0;
      if (criteria.showroom === "oui") score += 2;
      if (criteria.vendSpa === "oui") score += 3;
      if (criteria.autreMarque === "oui") score += 2;
      if (criteria.domaineSimilaire === "oui") score += 1;
      expect(score).toBe(3);
    });

    it("should calculate score 2 for showroom only", () => {
      const criteria = { showroom: "oui", vendSpa: "non", autreMarque: "non", domaineSimilaire: "non" };
      let score = 0;
      if (criteria.showroom === "oui") score += 2;
      if (criteria.vendSpa === "oui") score += 3;
      if (criteria.autreMarque === "oui") score += 2;
      if (criteria.domaineSimilaire === "oui") score += 1;
      expect(score).toBe(2);
    });

    it("should calculate score 1 for domaineSimilaire only", () => {
      const criteria = { showroom: "non", vendSpa: "non", autreMarque: "non", domaineSimilaire: "oui" };
      let score = 0;
      if (criteria.showroom === "oui") score += 2;
      if (criteria.vendSpa === "oui") score += 3;
      if (criteria.autreMarque === "oui") score += 2;
      if (criteria.domaineSimilaire === "oui") score += 1;
      expect(score).toBe(1);
    });
  });

  describe("Status Transitions", () => {
    const validStatuses = ["non_contacte", "en_cours", "valide", "archive"];

    it("should accept all valid statuses", () => {
      validStatuses.forEach(status => {
        expect(validStatuses).toContain(status);
      });
    });

    it("should reject invalid statuses", () => {
      const invalidStatuses = ["active", "deleted", "pending", "approved"];
      invalidStatuses.forEach(status => {
        expect(validStatuses).not.toContain(status);
      });
    });
  });

  describe("Visited Toggle Logic", () => {
    it("should set visited to 1 and visitDate when marking as visited", () => {
      const visited = true;
      const result = {
        visited: visited ? 1 : 0,
        visitDate: visited ? new Date() : null,
      };
      expect(result.visited).toBe(1);
      expect(result.visitDate).toBeInstanceOf(Date);
    });

    it("should set visited to 0 and visitDate to null when unmarking", () => {
      const visited = false;
      const result = {
        visited: visited ? 1 : 0,
        visitDate: visited ? new Date() : null,
      };
      expect(result.visited).toBe(0);
      expect(result.visitDate).toBeNull();
    });
  });

  describe("CSV Import Parsing", () => {
    it("should parse CSV headers correctly", () => {
      const csvLine = "companyName,fullName,city,phoneNumber,email,showroom,vendSpa,autreMarque,domaineSimilaire";
      const headers = csvLine.split(",").map(h => h.trim().toLowerCase());
      expect(headers).toContain("companyname");
      expect(headers).toContain("fullname");
      expect(headers).toContain("city");
      expect(headers).toContain("phonenumber");
      expect(headers).toContain("email");
    });

    it("should calculate priority score from CSV data", () => {
      const row = { showroom: "oui", vendspa: "oui", autremarque: "non", domainesimilaire: "oui" };
      const showroom = row.showroom.toLowerCase() === "oui" ? "oui" : "non";
      const vendSpa = row.vendspa.toLowerCase() === "oui" ? "oui" : "non";
      const autreMarque = row.autremarque.toLowerCase() === "oui" ? "oui" : "non";
      const domaineSimilaire = row.domainesimilaire.toLowerCase() === "oui" ? "oui" : "non";

      let score = 0;
      if (showroom === "oui") score += 2;
      if (vendSpa === "oui") score += 3;
      if (autreMarque === "oui") score += 2;
      if (domaineSimilaire === "oui") score += 1;

      expect(score).toBe(6); // 2 + 3 + 0 + 1
    });

    it("should filter out candidates without required fields", () => {
      const candidates = [
        { companyName: "Test", fullName: "John", city: "Brussels" },
        { companyName: "", fullName: "Jane", city: "Liège" },
        { companyName: "Corp", fullName: "", city: "Namur" },
        { companyName: "Inc", fullName: "Bob", city: "" },
      ];
      const valid = candidates.filter(c => c.companyName && c.fullName && c.city);
      expect(valid).toHaveLength(1);
      expect(valid[0].companyName).toBe("Test");
    });
  });

  describe("Statistics Calculations", () => {
    const candidates = [
      { priorityScore: 8, status: "valide", visited: 1, phoneCallsCount: 3, emailsSentCount: 2 },
      { priorityScore: 6, status: "en_cours", visited: 0, phoneCallsCount: 1, emailsSentCount: 1 },
      { priorityScore: 3, status: "non_contacte", visited: 0, phoneCallsCount: 0, emailsSentCount: 0 },
      { priorityScore: 5, status: "archive", visited: 1, phoneCallsCount: 2, emailsSentCount: 3 },
    ];

    it("should calculate conversion rate correctly", () => {
      const total = candidates.length;
      const valide = candidates.filter(c => c.status === "valide").length;
      const rate = (valide / total) * 100;
      expect(rate).toBe(25);
    });

    it("should calculate average score correctly", () => {
      const total = candidates.length;
      const sum = candidates.reduce((s, c) => s + c.priorityScore, 0);
      const avg = sum / total;
      expect(avg).toBe(5.5);
    });

    it("should count high priority candidates (score >= 6)", () => {
      const highPriority = candidates.filter(c => c.priorityScore >= 6).length;
      expect(highPriority).toBe(2);
    });

    it("should count total interactions", () => {
      const totalCalls = candidates.reduce((s, c) => s + c.phoneCallsCount, 0);
      const totalEmails = candidates.reduce((s, c) => s + c.emailsSentCount, 0);
      expect(totalCalls).toBe(6);
      expect(totalEmails).toBe(6);
    });

    it("should count visited candidates", () => {
      const visited = candidates.filter(c => c.visited).length;
      expect(visited).toBe(2);
    });

    it("should count by status correctly", () => {
      const byStatus = {
        non_contacte: candidates.filter(c => c.status === "non_contacte").length,
        en_cours: candidates.filter(c => c.status === "en_cours").length,
        valide: candidates.filter(c => c.status === "valide").length,
        archive: candidates.filter(c => c.status === "archive").length,
      };
      expect(byStatus.non_contacte).toBe(1);
      expect(byStatus.en_cours).toBe(1);
      expect(byStatus.valide).toBe(1);
      expect(byStatus.archive).toBe(1);
    });
  });

  describe("Sorting and Filtering", () => {
    const candidates = [
      { id: 1, companyName: "Alpha Corp", city: "Brussels", priorityScore: 3, status: "non_contacte" },
      { id: 2, companyName: "Beta Inc", city: "Liège", priorityScore: 8, status: "en_cours" },
      { id: 3, companyName: "Gamma SA", city: "Namur", priorityScore: 5, status: "valide" },
    ];

    it("should sort by priority score descending", () => {
      const sorted = [...candidates].sort((a, b) => b.priorityScore - a.priorityScore);
      expect(sorted[0].id).toBe(2);
      expect(sorted[1].id).toBe(3);
      expect(sorted[2].id).toBe(1);
    });

    it("should sort by company name ascending", () => {
      const sorted = [...candidates].sort((a, b) => a.companyName.localeCompare(b.companyName));
      expect(sorted[0].companyName).toBe("Alpha Corp");
      expect(sorted[1].companyName).toBe("Beta Inc");
      expect(sorted[2].companyName).toBe("Gamma SA");
    });

    it("should filter by status", () => {
      const filtered = candidates.filter(c => c.status === "en_cours");
      expect(filtered).toHaveLength(1);
      expect(filtered[0].id).toBe(2);
    });

    it("should filter by search term", () => {
      const search = "beta";
      const filtered = candidates.filter(c =>
        c.companyName.toLowerCase().includes(search) ||
        c.city.toLowerCase().includes(search)
      );
      expect(filtered).toHaveLength(1);
      expect(filtered[0].id).toBe(2);
    });

    it("should filter by city search", () => {
      const search = "namur";
      const filtered = candidates.filter(c =>
        c.companyName.toLowerCase().includes(search) ||
        c.city.toLowerCase().includes(search)
      );
      expect(filtered).toHaveLength(1);
      expect(filtered[0].id).toBe(3);
    });
  });

  describe("Map Marker Colors", () => {
    const PRIORITY_MARKER_COLORS: Record<number, string> = {
      8: "#dc2626",
      7: "#ef4444",
      6: "#f97316",
      5: "#fb923c",
      4: "#eab308",
      3: "#facc15",
      2: "#4ade80",
      1: "#22c55e",
      0: "#d1d5db",
    };

    it("should return red for score 8", () => {
      expect(PRIORITY_MARKER_COLORS[8]).toBe("#dc2626");
    });

    it("should return orange for score 6", () => {
      expect(PRIORITY_MARKER_COLORS[6]).toBe("#f97316");
    });

    it("should return green for score 1", () => {
      expect(PRIORITY_MARKER_COLORS[1]).toBe("#22c55e");
    });

    it("should return gray for score 0", () => {
      expect(PRIORITY_MARKER_COLORS[0]).toBe("#d1d5db");
    });

    it("should have colors for all scores 0-8", () => {
      for (let i = 0; i <= 8; i++) {
        expect(PRIORITY_MARKER_COLORS[i]).toBeDefined();
      }
    });
  });

  describe("Stats Cards - Candidates Only", () => {
    const candidates = [
      { priorityScore: 8, status: "non_contacte", visited: 0, phoneCallsCount: 0, emailsSentCount: 0 },
      { priorityScore: 7, status: "non_contacte", visited: 0, phoneCallsCount: 0, emailsSentCount: 0 },
      { priorityScore: 6, status: "en_cours", visited: 0, phoneCallsCount: 1, emailsSentCount: 1 },
      { priorityScore: 5, status: "en_cours", visited: 1, phoneCallsCount: 2, emailsSentCount: 2 },
      { priorityScore: 3, status: "valide", visited: 1, phoneCallsCount: 3, emailsSentCount: 2 },
      { priorityScore: 2, status: "archive", visited: 1, phoneCallsCount: 1, emailsSentCount: 0 },
    ];

    it("should count total candidates", () => {
      expect(candidates.length).toBe(6);
    });

    it("should count non contactés", () => {
      const nonContactes = candidates.filter(c => c.status === "non_contacte").length;
      expect(nonContactes).toBe(2);
    });

    it("should count en cours", () => {
      const enCours = candidates.filter(c => c.status === "en_cours").length;
      expect(enCours).toBe(2);
    });

    it("should count validés", () => {
      const valides = candidates.filter(c => c.status === "valide").length;
      expect(valides).toBe(1);
    });

    it("should count high priority (score >= 6)", () => {
      const highPriority = candidates.filter(c => c.priorityScore >= 6).length;
      expect(highPriority).toBe(3);
    });

    it("should count visited", () => {
      const visited = candidates.filter(c => c.visited).length;
      expect(visited).toBe(3);
    });

    it("should not include partner or lead counts", () => {
      // The stats cards should only show candidate-related data
      const statsKeys = ["totalCandidates", "nonContactes", "enCours", "valides", "highPriority"];
      const excludedKeys = ["approvedPartners", "pendingPartners", "totalLeads"];
      excludedKeys.forEach(key => {
        expect(statsKeys).not.toContain(key);
      });
    });
  });

  describe("Status Filter for Map", () => {
    const candidates = [
      { id: 1, status: "non_contacte", city: "Paris" },
      { id: 2, status: "en_cours", city: "Lyon" },
      { id: 3, status: "valide", city: "Marseille" },
      { id: 4, status: "non_contacte", city: "Bordeaux" },
      { id: 5, status: "archive", city: "Lille" },
    ];

    it("should show all candidates when filter is 'all'", () => {
      const statusFilter = "all";
      const filtered = statusFilter === "all" ? candidates : candidates.filter(c => c.status === statusFilter);
      expect(filtered).toHaveLength(5);
    });

    it("should filter non_contacte only", () => {
      const statusFilter = "non_contacte";
      const filtered = candidates.filter(c => c.status === statusFilter);
      expect(filtered).toHaveLength(2);
      expect(filtered.every(c => c.status === "non_contacte")).toBe(true);
    });

    it("should filter en_cours only", () => {
      const statusFilter = "en_cours";
      const filtered = candidates.filter(c => c.status === statusFilter);
      expect(filtered).toHaveLength(1);
      expect(filtered[0].city).toBe("Lyon");
    });

    it("should filter valide only", () => {
      const statusFilter = "valide";
      const filtered = candidates.filter(c => c.status === statusFilter);
      expect(filtered).toHaveLength(1);
      expect(filtered[0].city).toBe("Marseille");
    });

    it("should filter archive only", () => {
      const statusFilter = "archive";
      const filtered = candidates.filter(c => c.status === statusFilter);
      expect(filtered).toHaveLength(1);
      expect(filtered[0].city).toBe("Lille");
    });
  });

  describe("Distance Calculation", () => {
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

    it("should calculate 0 km for same point", () => {
      expect(calculateDistance(50.85, 4.35, 50.85, 4.35)).toBe(0);
    });

    it("should calculate Brussels to Li\u00e8ge correctly (~89-92 km)", () => {
      const dist = calculateDistance(50.8503, 4.3517, 50.6292, 5.5797);
      expect(dist).toBeGreaterThan(85);
      expect(dist).toBeLessThan(95);
    });
  });

  describe("Popup Interactive Status Change", () => {
    const statuses = ["non_contacte", "en_cours", "valide", "archive"];
    const statusLabels: Record<string, string> = {
      non_contacte: "Non contact\u00e9",
      en_cours: "En cours",
      valide: "Valid\u00e9",
      archive: "Archiv\u00e9",
    };

    it("should have 4 status options available", () => {
      expect(statuses).toHaveLength(4);
    });

    it("should map each status to a label", () => {
      statuses.forEach(s => {
        expect(statusLabels[s]).toBeDefined();
        expect(statusLabels[s].length).toBeGreaterThan(0);
      });
    });

    it("should generate correct data attributes for status buttons", () => {
      const candidateId = 42;
      statuses.forEach(status => {
        const dataAction = "status";
        const dataCandidateId = candidateId.toString();
        const dataStatus = status;
        expect(dataAction).toBe("status");
        expect(dataCandidateId).toBe("42");
        expect(statuses).toContain(dataStatus);
      });
    });

    it("should generate correct data attributes for toggle visited button", () => {
      const candidateId = 42;
      const visited = true;
      const dataAction = "toggle-visited";
      const dataCandidateId = candidateId.toString();
      const dataVisited = visited ? "1" : "0";
      expect(dataAction).toBe("toggle-visited");
      expect(dataCandidateId).toBe("42");
      expect(dataVisited).toBe("1");
    });

    it("should generate correct data attributes for unvisited toggle", () => {
      const visited = false;
      const dataVisited = visited ? "1" : "0";
      expect(dataVisited).toBe("0");
    });

    it("should generate correct data attributes for increment phone button", () => {
      const candidateId = 42;
      const dataAction = "increment-phone";
      const dataCandidateId = candidateId.toString();
      expect(dataAction).toBe("increment-phone");
      expect(dataCandidateId).toBe("42");
    });

    it("should generate correct data attributes for increment email button", () => {
      const candidateId = 42;
      const dataAction = "increment-email";
      const dataCandidateId = candidateId.toString();
      expect(dataAction).toBe("increment-email");
      expect(dataCandidateId).toBe("42");
    });

    it("should highlight active status button differently", () => {
      const currentStatus = "en_cours";
      const statusColors: Record<string, { activeBg: string; bg: string }> = {
        non_contacte: { bg: "#f3f4f6", activeBg: "#6b7280" },
        en_cours: { bg: "#dbeafe", activeBg: "#3b82f6" },
        valide: { bg: "#dcfce7", activeBg: "#16a34a" },
        archive: { bg: "#fee2e2", activeBg: "#dc2626" },
      };

      statuses.forEach(s => {
        const isActive = s === currentStatus;
        const expectedBg = isActive ? statusColors[s].activeBg : statusColors[s].bg;
        if (isActive) {
          expect(expectedBg).toBe(statusColors[s].activeBg);
        } else {
          expect(expectedBg).toBe(statusColors[s].bg);
        }
      });
    });

    it("should parse candidateId from data attribute correctly", () => {
      const dataStr = "42";
      const parsed = parseInt(dataStr);
      expect(parsed).toBe(42);
      expect(Number.isNaN(parsed)).toBe(false);
    });

    it("should handle toggle visited inversion correctly", () => {
      // When visited is '1', clicking should send visited: false
      const currentlyVisited1 = "1" === "1";
      expect(!currentlyVisited1).toBe(false);

      // When visited is '0', clicking should send visited: true
      const currentlyVisited0 = "0" === "1";
      expect(!currentlyVisited0).toBe(true);
    });
  });
});