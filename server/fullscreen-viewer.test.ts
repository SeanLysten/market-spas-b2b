import { describe, it, expect } from "vitest";

// ─── Test the client-side logic used by FullscreenImageViewer ────────────────

interface ViewerResource {
  id: number;
  title: string;
  fileUrl: string;
  fileType: string;
  fileSize?: number;
  thumbnailUrl?: string | null;
}

// Simulating the filtering logic used in the component
function filterImageResources(resources: ViewerResource[]): ViewerResource[] {
  return resources.filter((r) => r.fileType.startsWith("image/"));
}

// Simulating the index mapping logic
function findImageIndex(resources: ViewerResource[], targetId: number): number {
  const images = filterImageResources(resources);
  return images.findIndex((r) => r.id === targetId);
}

// Simulating the handleView routing logic
function shouldOpenFullscreen(fileType: string): boolean {
  return fileType.startsWith("image/");
}

// Simulating the thumbnail URL logic
function getThumbnailStripUrl(resource: ViewerResource): string {
  if (resource.thumbnailUrl) return resource.thumbnailUrl;
  return `/api/resources/thumbnail/${resource.id}`;
}

// Simulating navigation bounds
function canGoNext(index: number, imageCount: number): boolean {
  return index < imageCount - 1;
}

function canGoPrev(index: number): boolean {
  return index > 0;
}

// ─── Test data ──────────────────────────────────────────────────────────────────

const mockResources: ViewerResource[] = [
  { id: 1, title: "Image 1", fileUrl: "https://example.com/img1.jpg", fileType: "image/jpeg", fileSize: 1024000 },
  { id: 2, title: "Video File", fileUrl: "https://example.com/vid.mp4", fileType: "video/mp4", fileSize: 5000000 },
  { id: 3, title: "Image 2", fileUrl: "https://example.com/img2.png", fileType: "image/png", fileSize: 2048000 },
  { id: 4, title: "Image 3", fileUrl: "https://example.com/img3.webp", fileType: "image/webp", fileSize: 512000, thumbnailUrl: "https://example.com/thumb3.webp" },
  { id: 5, title: "PDF Doc", fileUrl: "https://example.com/doc.pdf", fileType: "application/pdf", fileSize: 300000 },
  { id: 6, title: "Image 4", fileUrl: "https://example.com/img4.jpg", fileType: "image/jpeg", fileSize: 3000000, thumbnailUrl: null },
];

// ─── Tests ──────────────────────────────────────────────────────────────────────

describe("FullscreenImageViewer Logic", () => {
  describe("filterImageResources", () => {
    it("should filter only image resources", () => {
      const images = filterImageResources(mockResources);
      expect(images).toHaveLength(4);
      expect(images.every((r) => r.fileType.startsWith("image/"))).toBe(true);
    });

    it("should exclude video and PDF files", () => {
      const images = filterImageResources(mockResources);
      expect(images.find((r) => r.fileType === "video/mp4")).toBeUndefined();
      expect(images.find((r) => r.fileType === "application/pdf")).toBeUndefined();
    });

    it("should return empty array for no images", () => {
      const noImages = [
        { id: 1, title: "Video", fileUrl: "v.mp4", fileType: "video/mp4" },
        { id: 2, title: "PDF", fileUrl: "d.pdf", fileType: "application/pdf" },
      ];
      expect(filterImageResources(noImages)).toHaveLength(0);
    });
  });

  describe("findImageIndex", () => {
    it("should find the correct index in the filtered image list", () => {
      // Image 1 (id=1) is at index 0 in the image list
      expect(findImageIndex(mockResources, 1)).toBe(0);
      // Image 2 (id=3) is at index 1 in the image list (video id=2 is skipped)
      expect(findImageIndex(mockResources, 3)).toBe(1);
      // Image 3 (id=4) is at index 2
      expect(findImageIndex(mockResources, 4)).toBe(2);
      // Image 4 (id=6) is at index 3
      expect(findImageIndex(mockResources, 6)).toBe(3);
    });

    it("should return -1 for non-image resources", () => {
      expect(findImageIndex(mockResources, 2)).toBe(-1); // video
      expect(findImageIndex(mockResources, 5)).toBe(-1); // PDF
    });

    it("should return -1 for non-existent IDs", () => {
      expect(findImageIndex(mockResources, 999)).toBe(-1);
    });
  });

  describe("shouldOpenFullscreen", () => {
    it("should return true for image types", () => {
      expect(shouldOpenFullscreen("image/jpeg")).toBe(true);
      expect(shouldOpenFullscreen("image/png")).toBe(true);
      expect(shouldOpenFullscreen("image/webp")).toBe(true);
      expect(shouldOpenFullscreen("image/gif")).toBe(true);
      expect(shouldOpenFullscreen("image/svg+xml")).toBe(true);
    });

    it("should return false for non-image types", () => {
      expect(shouldOpenFullscreen("video/mp4")).toBe(false);
      expect(shouldOpenFullscreen("application/pdf")).toBe(false);
      expect(shouldOpenFullscreen("text/plain")).toBe(false);
    });
  });

  describe("getThumbnailStripUrl", () => {
    it("should return thumbnailUrl when available", () => {
      const resource = mockResources[3]; // Image 3 with thumbnailUrl
      expect(getThumbnailStripUrl(resource)).toBe("https://example.com/thumb3.webp");
    });

    it("should return API URL when thumbnailUrl is null", () => {
      const resource = mockResources[5]; // Image 4 with null thumbnailUrl
      expect(getThumbnailStripUrl(resource)).toBe("/api/resources/thumbnail/6");
    });

    it("should return API URL when thumbnailUrl is undefined", () => {
      const resource = mockResources[0]; // Image 1 with no thumbnailUrl
      expect(getThumbnailStripUrl(resource)).toBe("/api/resources/thumbnail/1");
    });
  });

  describe("Navigation bounds", () => {
    const imageCount = 4; // 4 images in our mock data

    it("should allow going next when not at the end", () => {
      expect(canGoNext(0, imageCount)).toBe(true);
      expect(canGoNext(1, imageCount)).toBe(true);
      expect(canGoNext(2, imageCount)).toBe(true);
    });

    it("should not allow going next at the last image", () => {
      expect(canGoNext(3, imageCount)).toBe(false);
    });

    it("should allow going prev when not at the start", () => {
      expect(canGoPrev(1)).toBe(true);
      expect(canGoPrev(2)).toBe(true);
      expect(canGoPrev(3)).toBe(true);
    });

    it("should not allow going prev at the first image", () => {
      expect(canGoPrev(0)).toBe(false);
    });
  });

  describe("Counter display", () => {
    it("should show correct counter format", () => {
      const images = filterImageResources(mockResources);
      const index = 0;
      const counter = `${index + 1} / ${images.length}`;
      expect(counter).toBe("1 / 4");
    });

    it("should show correct counter for last image", () => {
      const images = filterImageResources(mockResources);
      const index = images.length - 1;
      const counter = `${index + 1} / ${images.length}`;
      expect(counter).toBe("4 / 4");
    });
  });
});
