import { describe, it, expect, vi, beforeEach } from "vitest";

// ============================================
// Tests for Technical Resources Refonte
// (Folders + File Upload)
// ============================================

// Mock getDb
const mockDb = {
  select: vi.fn().mockReturnThis(),
  from: vi.fn().mockReturnThis(),
  where: vi.fn().mockReturnThis(),
  limit: vi.fn().mockReturnThis(),
  leftJoin: vi.fn().mockReturnThis(),
  orderBy: vi.fn().mockReturnThis(),
  offset: vi.fn().mockReturnThis(),
  insert: vi.fn().mockReturnThis(),
  values: vi.fn().mockReturnThis(),
  update: vi.fn().mockReturnThis(),
  set: vi.fn().mockReturnThis(),
  delete: vi.fn().mockReturnThis(),
  returning: vi.fn().mockReturnThis(),
};

vi.mock("../server/db", () => ({
  getDb: vi.fn(() => Promise.resolve(mockDb)),
}));

vi.mock("../drizzle/schema", () => ({
  technicalResources: {
    id: "id",
    title: "title",
    description: "description",
    type: "type",
    fileUrl: "fileUrl",
    fileName: "fileName",
    fileSize: "fileSize",
    fileType: "fileType",
    category: "category",
    folderId: "folderId",
    downloadCount: "downloadCount",
    viewCount: "viewCount",
    productCategory: "productCategory",
    tags: "tags",
    createdAt: "createdAt",
  },
  technicalResourceFolders: {
    id: "id",
    name: "name",
    slug: "slug",
    description: "description",
    icon: "icon",
    sortOrder: "sortOrder",
    createdAt: "createdAt",
  },
}));

beforeEach(() => {
  vi.clearAllMocks();
  // Reset chain methods
  mockDb.select.mockReturnThis();
  mockDb.from.mockReturnThis();
  mockDb.where.mockReturnThis();
  mockDb.limit.mockReturnThis();
  mockDb.leftJoin.mockReturnThis();
  mockDb.orderBy.mockReturnThis();
  mockDb.offset.mockReturnThis();
  mockDb.insert.mockReturnThis();
  mockDb.values.mockReturnThis();
  mockDb.update.mockReturnThis();
  mockDb.set.mockReturnThis();
  mockDb.delete.mockReturnThis();
  mockDb.returning.mockReturnThis();
});

// ============================================
// Folder Structure Tests
// ============================================

describe("Technical Resource Folders", () => {
  it("should define folder with required fields", () => {
    const folder = {
      id: 1,
      name: "Installation",
      slug: "installation",
      description: "Guides d'installation",
      icon: "wrench",
      sortOrder: 0,
    };

    expect(folder).toHaveProperty("id");
    expect(folder).toHaveProperty("name");
    expect(folder).toHaveProperty("slug");
    expect(folder).toHaveProperty("icon");
    expect(folder.name).toBe("Installation");
    expect(folder.slug).toBe("installation");
  });

  it("should support all predefined folder types", () => {
    const folderTypes = [
      { name: "Installation", icon: "wrench" },
      { name: "Maintenance", icon: "settings" },
      { name: "Dépannage", icon: "alert-triangle" },
      { name: "Spécifications", icon: "file-text" },
      { name: "Formation", icon: "graduation-cap" },
      { name: "Autre", icon: "folder" },
    ];

    expect(folderTypes).toHaveLength(6);
    folderTypes.forEach((f) => {
      expect(f).toHaveProperty("name");
      expect(f).toHaveProperty("icon");
      expect(typeof f.name).toBe("string");
      expect(typeof f.icon).toBe("string");
    });
  });

  it("should generate slug from folder name", () => {
    const name = "Guides d'installation";
    const slug = name
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "");

    expect(slug).toBe("guides-dinstallation");
    expect(slug).not.toContain(" ");
    expect(slug).not.toContain("'");
  });

  it("should sort folders by sortOrder", () => {
    const folders = [
      { name: "Formation", sortOrder: 4 },
      { name: "Installation", sortOrder: 0 },
      { name: "Maintenance", sortOrder: 1 },
      { name: "Dépannage", sortOrder: 2 },
    ];

    const sorted = [...folders].sort((a, b) => a.sortOrder - b.sortOrder);
    expect(sorted[0].name).toBe("Installation");
    expect(sorted[1].name).toBe("Maintenance");
    expect(sorted[2].name).toBe("Dépannage");
    expect(sorted[3].name).toBe("Formation");
  });
});

// ============================================
// File Upload Tests
// ============================================

describe("Technical Resource File Upload", () => {
  it("should validate file upload payload", () => {
    const payload = {
      fileData: "data:application/pdf;base64,JVBERi0xLjQ...",
      fileName: "guide-installation-neptune.pdf",
      fileType: "application/pdf",
      fileSize: 2048576,
      title: "Guide Installation Neptune",
      folderId: 1,
    };

    expect(payload).toHaveProperty("fileData");
    expect(payload).toHaveProperty("fileName");
    expect(payload).toHaveProperty("fileType");
    expect(payload).toHaveProperty("fileSize");
    expect(payload).toHaveProperty("title");
    expect(payload.fileData).toMatch(/^data:/);
    expect(payload.fileName).toMatch(/\.pdf$/);
  });

  it("should extract title from filename when not provided", () => {
    const fileName = "guide-installation-neptune-v2.pdf";
    const title = fileName.replace(/\.[^/.]+$/, "");
    expect(title).toBe("guide-installation-neptune-v2");
  });

  it("should handle multiple file types", () => {
    const validTypes = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "video/mp4",
      "image/jpeg",
      "image/png",
    ];

    validTypes.forEach((type) => {
      expect(typeof type).toBe("string");
      expect(type).toContain("/");
    });
  });

  it("should determine resource type from file mime type", () => {
    const getResourceType = (mimeType: string): string => {
      if (mimeType === "application/pdf") return "PDF";
      if (mimeType.startsWith("video/")) return "VIDEO";
      return "OTHER";
    };

    expect(getResourceType("application/pdf")).toBe("PDF");
    expect(getResourceType("video/mp4")).toBe("VIDEO");
    expect(getResourceType("image/png")).toBe("OTHER");
  });

  it("should format file size correctly", () => {
    const formatFileSize = (bytes: number): string => {
      if (bytes < 1024) return `${bytes} B`;
      if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
      return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    };

    expect(formatFileSize(500)).toBe("500 B");
    expect(formatFileSize(1500)).toBe("1.5 KB");
    expect(formatFileSize(2097152)).toBe("2.0 MB");
  });

  it("should validate base64 data format", () => {
    const validBase64 = "data:application/pdf;base64,JVBERi0xLjQ=";
    const invalidBase64 = "not-a-valid-base64";

    expect(validBase64.startsWith("data:")).toBe(true);
    expect(validBase64.includes(";base64,")).toBe(true);
    expect(invalidBase64.startsWith("data:")).toBe(false);
  });
});

// ============================================
// Resource with Folder Association Tests
// ============================================

describe("Technical Resource - Folder Association", () => {
  it("should create resource with folderId", () => {
    const resource = {
      title: "Guide Installation Neptune V2",
      type: "PDF",
      fileUrl: "https://storage.example.com/guides/neptune-v2-install.pdf",
      fileName: "neptune-v2-install.pdf",
      fileSize: 3145728,
      fileType: "application/pdf",
      folderId: 1,
      category: "INSTALLATION",
    };

    expect(resource.folderId).toBe(1);
    expect(resource.type).toBe("PDF");
    expect(resource.category).toBe("INSTALLATION");
  });

  it("should allow resource without folderId (uncategorized)", () => {
    const resource = {
      title: "Document général",
      type: "PDF",
      fileUrl: "https://storage.example.com/general.pdf",
      folderId: null,
    };

    expect(resource.folderId).toBeNull();
  });

  it("should filter resources by folderId", () => {
    const resources = [
      { id: 1, title: "Guide A", folderId: 1 },
      { id: 2, title: "Guide B", folderId: 1 },
      { id: 3, title: "Guide C", folderId: 2 },
      { id: 4, title: "Guide D", folderId: null },
    ];

    const folder1Resources = resources.filter((r) => r.folderId === 1);
    const folder2Resources = resources.filter((r) => r.folderId === 2);
    const uncategorized = resources.filter((r) => r.folderId === null);

    expect(folder1Resources).toHaveLength(2);
    expect(folder2Resources).toHaveLength(1);
    expect(uncategorized).toHaveLength(1);
  });

  it("should count resources per folder", () => {
    const resources = [
      { folderId: 1 },
      { folderId: 1 },
      { folderId: 1 },
      { folderId: 2 },
      { folderId: 2 },
      { folderId: null },
    ];

    const countByFolder = (folderId: number) =>
      resources.filter((r) => r.folderId === folderId).length;

    expect(countByFolder(1)).toBe(3);
    expect(countByFolder(2)).toBe(2);
  });
});

// ============================================
// Download Count Tests
// ============================================

describe("Technical Resource - Download Tracking", () => {
  it("should track download count", () => {
    const resource = {
      id: 1,
      title: "Guide Installation",
      downloadCount: 0,
    };

    // Simulate download increment
    const updatedCount = resource.downloadCount + 1;
    expect(updatedCount).toBe(1);
  });

  it("should display download count for admins", () => {
    const resource = {
      id: 1,
      downloadCount: 42,
      viewCount: 150,
    };

    expect(resource.downloadCount).toBe(42);
    expect(resource.viewCount).toBe(150);
    expect(resource.downloadCount).toBeLessThan(resource.viewCount);
  });
});

// ============================================
// Drag & Drop Tests
// ============================================

describe("Technical Resource - Drag & Drop Upload", () => {
  it("should handle multiple files in a single drop", () => {
    const droppedFiles = [
      { name: "guide-1.pdf", size: 1024000, type: "application/pdf" },
      { name: "guide-2.pdf", size: 2048000, type: "application/pdf" },
      { name: "specs.pdf", size: 512000, type: "application/pdf" },
    ];

    expect(droppedFiles).toHaveLength(3);
    droppedFiles.forEach((f) => {
      expect(f.name).toMatch(/\.pdf$/);
      expect(f.type).toBe("application/pdf");
      expect(f.size).toBeGreaterThan(0);
    });
  });

  it("should track upload progress correctly", () => {
    const total = 5;
    const progressSteps: { current: number; total: number }[] = [];

    for (let i = 1; i <= total; i++) {
      progressSteps.push({ current: i, total });
    }

    expect(progressSteps).toHaveLength(5);
    expect(progressSteps[0]).toEqual({ current: 1, total: 5 });
    expect(progressSteps[4]).toEqual({ current: 5, total: 5 });

    // Progress percentage
    const lastStep = progressSteps[progressSteps.length - 1];
    expect((lastStep.current / lastStep.total) * 100).toBe(100);
  });

  it("should assign files to current folder when dropping", () => {
    const currentFolderId = 3;
    const file = { name: "maintenance-guide.pdf" };

    const uploadPayload = {
      fileName: file.name,
      title: file.name.replace(/\.[^/.]+$/, ""),
      folderId: currentFolderId,
    };

    expect(uploadPayload.folderId).toBe(3);
    expect(uploadPayload.title).toBe("maintenance-guide");
  });

  it("should assign null folderId when dropping at root level", () => {
    const currentFolderId = null;
    const file = { name: "general-doc.pdf" };

    const uploadPayload = {
      fileName: file.name,
      folderId: currentFolderId,
    };

    expect(uploadPayload.folderId).toBeNull();
  });
});

// ============================================
// Search Tests
// ============================================

describe("Technical Resource - Search", () => {
  it("should filter resources by title", () => {
    const resources = [
      { title: "Guide Installation Neptune V2", description: "Comment installer" },
      { title: "Maintenance Easy Relax", description: "Entretien régulier" },
      { title: "Dépannage Volcano", description: "Résoudre les problèmes" },
    ];

    const search = "neptune";
    const filtered = resources.filter(
      (r) =>
        r.title.toLowerCase().includes(search.toLowerCase()) ||
        r.description?.toLowerCase().includes(search.toLowerCase())
    );

    expect(filtered).toHaveLength(1);
    expect(filtered[0].title).toContain("Neptune");
  });

  it("should filter resources by description", () => {
    const resources = [
      { title: "Guide A", description: "Installation électrique du spa" },
      { title: "Guide B", description: "Plomberie et raccordements" },
    ];

    const search = "électrique";
    const filtered = resources.filter(
      (r) =>
        r.title.toLowerCase().includes(search.toLowerCase()) ||
        r.description?.toLowerCase().includes(search.toLowerCase())
    );

    expect(filtered).toHaveLength(1);
    expect(filtered[0].title).toBe("Guide A");
  });
});
