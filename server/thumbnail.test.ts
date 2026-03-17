import { describe, it, expect } from "vitest";
import { isThumbableImage } from "./thumbnail";

describe("Thumbnail Service", () => {
  describe("isThumbableImage", () => {
    it("should return true for JPEG images", () => {
      expect(isThumbableImage("image/jpeg")).toBe(true);
      expect(isThumbableImage("image/jpg")).toBe(true);
    });

    it("should return true for PNG images", () => {
      expect(isThumbableImage("image/png")).toBe(true);
    });

    it("should return true for WebP images", () => {
      expect(isThumbableImage("image/webp")).toBe(true);
    });

    it("should return true for other supported image formats", () => {
      expect(isThumbableImage("image/gif")).toBe(true);
      expect(isThumbableImage("image/tiff")).toBe(true);
      expect(isThumbableImage("image/bmp")).toBe(true);
      expect(isThumbableImage("image/avif")).toBe(true);
    });

    it("should return false for non-image types", () => {
      expect(isThumbableImage("application/pdf")).toBe(false);
      expect(isThumbableImage("video/mp4")).toBe(false);
      expect(isThumbableImage("text/plain")).toBe(false);
      expect(isThumbableImage("application/zip")).toBe(false);
    });

    it("should return false for SVG (not raster)", () => {
      expect(isThumbableImage("image/svg+xml")).toBe(false);
    });
  });

  describe("getThumbnailUrl helper (client-side logic)", () => {
    // Simulating the client-side getThumbnailUrl function
    const getThumbnailUrl = (resource: { id: number; fileUrl: string; fileType: string; thumbnailUrl?: string | null }) => {
      if (!resource.fileType.includes("image")) return null;
      if (resource.thumbnailUrl) return resource.thumbnailUrl;
      return `/api/resources/thumbnail/${resource.id}`;
    };

    it("should return thumbnailUrl if available", () => {
      const resource = {
        id: 1,
        fileUrl: "https://s3.example.com/original.jpg",
        fileType: "image/jpeg",
        thumbnailUrl: "https://s3.example.com/thumb.webp",
      };
      expect(getThumbnailUrl(resource)).toBe("https://s3.example.com/thumb.webp");
    });

    it("should return API URL if no thumbnailUrl", () => {
      const resource = {
        id: 42,
        fileUrl: "https://s3.example.com/original.jpg",
        fileType: "image/jpeg",
        thumbnailUrl: null,
      };
      expect(getThumbnailUrl(resource)).toBe("/api/resources/thumbnail/42");
    });

    it("should return null for non-image files", () => {
      const resource = {
        id: 1,
        fileUrl: "https://s3.example.com/doc.pdf",
        fileType: "application/pdf",
        thumbnailUrl: null,
      };
      expect(getThumbnailUrl(resource)).toBeNull();
    });

    it("should return null for video files", () => {
      const resource = {
        id: 1,
        fileUrl: "https://s3.example.com/video.mp4",
        fileType: "video/mp4",
        thumbnailUrl: null,
      };
      expect(getThumbnailUrl(resource)).toBeNull();
    });
  });
});
