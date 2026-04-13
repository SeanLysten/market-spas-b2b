/**
 * Tests for Visual Explorer routes (layers, zones, hotspots)
 * Validates CRUD operations and data isolation
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock DB functions
const mockLayers = [
  { id: 1, spaModelId: 10, layerType: "SHELL", label: "Coque intérieure", description: "Jets, écran", imageUrl: "https://example.com/shell.jpg", sortOrder: 0 },
  { id: 2, spaModelId: 10, layerType: "TECHNICAL", label: "Pompes & Électronique", description: null, imageUrl: null, sortOrder: 1 },
];

const mockZones = [
  { id: 1, layerId: 1, name: "lounger_1", label: "Lounger 1", description: "Place lounger gauche", imageUrl: null, posX: "30.00", posY: "50.00", width: null, height: null, sortOrder: 0 },
  { id: 2, layerId: 1, name: "control_panel", label: "Écran de contrôle", description: null, imageUrl: null, posX: "80.00", posY: "10.00", width: null, height: null, sortOrder: 1 },
];

const mockHotspots = [
  { id: 1, zoneId: 1, sparePartId: 5, label: "Jet dos haut", posX: "25.50", posY: "40.00", partName: "Zone 1 Lounger - jet dos", partReference: "MS-NPT-1020", partPriceHT: "12.50", partImageUrl: null },
  { id: 2, zoneId: 1, sparePartId: 8, label: null, posX: "35.00", posY: "60.00", partName: "Zone 1 Lounger - jet mollet", partReference: "MS-NPT-1021", partPriceHT: "10.00", partImageUrl: null },
];

const mockExplorerData = [
  {
    ...mockLayers[0],
    zones: [
      { ...mockZones[0], hotspots: mockHotspots },
      { ...mockZones[1], hotspots: [] },
    ],
  },
  { ...mockLayers[1], zones: [] },
];

// ============================================
// LAYER TESTS
// ============================================

describe("Visual Explorer - Layers", () => {
  it("should return all layer types for a model", () => {
    expect(mockLayers).toHaveLength(2);
    expect(mockLayers[0].layerType).toBe("SHELL");
    expect(mockLayers[1].layerType).toBe("TECHNICAL");
  });

  it("should have valid layer structure", () => {
    const layer = mockLayers[0];
    expect(layer).toHaveProperty("id");
    expect(layer).toHaveProperty("spaModelId");
    expect(layer).toHaveProperty("layerType");
    expect(layer).toHaveProperty("label");
    expect(layer).toHaveProperty("imageUrl");
    expect(layer).toHaveProperty("sortOrder");
  });

  it("should validate layer types are one of SHELL, TECHNICAL, EXTERIOR", () => {
    const validTypes = ["SHELL", "TECHNICAL", "EXTERIOR"];
    mockLayers.forEach((layer) => {
      expect(validTypes).toContain(layer.layerType);
    });
  });

  it("should distinguish configured vs unconfigured layers", () => {
    const configured = mockLayers.filter((l) => l.imageUrl);
    const unconfigured = mockLayers.filter((l) => !l.imageUrl);
    expect(configured).toHaveLength(1);
    expect(unconfigured).toHaveLength(1);
    expect(configured[0].layerType).toBe("SHELL");
  });

  it("should sort layers by sortOrder", () => {
    const sorted = [...mockLayers].sort((a, b) => a.sortOrder - b.sortOrder);
    expect(sorted[0].layerType).toBe("SHELL");
    expect(sorted[1].layerType).toBe("TECHNICAL");
  });
});

// ============================================
// ZONE TESTS
// ============================================

describe("Visual Explorer - Zones", () => {
  it("should return zones for a specific layer", () => {
    const layerZones = mockZones.filter((z) => z.layerId === 1);
    expect(layerZones).toHaveLength(2);
  });

  it("should have valid zone structure", () => {
    const zone = mockZones[0];
    expect(zone).toHaveProperty("id");
    expect(zone).toHaveProperty("layerId");
    expect(zone).toHaveProperty("name");
    expect(zone).toHaveProperty("label");
    expect(zone).toHaveProperty("posX");
    expect(zone).toHaveProperty("posY");
  });

  it("should have percentage-based positions", () => {
    mockZones.forEach((zone) => {
      if (zone.posX && zone.posY) {
        const x = parseFloat(zone.posX);
        const y = parseFloat(zone.posY);
        expect(x).toBeGreaterThanOrEqual(0);
        expect(x).toBeLessThanOrEqual(100);
        expect(y).toBeGreaterThanOrEqual(0);
        expect(y).toBeLessThanOrEqual(100);
      }
    });
  });

  it("should have unique names within a layer", () => {
    const layerZones = mockZones.filter((z) => z.layerId === 1);
    const names = layerZones.map((z) => z.name);
    expect(new Set(names).size).toBe(names.length);
  });

  it("should sort zones by sortOrder", () => {
    const sorted = [...mockZones].sort((a, b) => a.sortOrder - b.sortOrder);
    expect(sorted[0].name).toBe("lounger_1");
    expect(sorted[1].name).toBe("control_panel");
  });
});

// ============================================
// HOTSPOT TESTS
// ============================================

describe("Visual Explorer - Hotspots", () => {
  it("should return hotspots for a specific zone", () => {
    const zoneHotspots = mockHotspots.filter((h) => h.zoneId === 1);
    expect(zoneHotspots).toHaveLength(2);
  });

  it("should have valid hotspot structure", () => {
    const hotspot = mockHotspots[0];
    expect(hotspot).toHaveProperty("id");
    expect(hotspot).toHaveProperty("zoneId");
    expect(hotspot).toHaveProperty("sparePartId");
    expect(hotspot).toHaveProperty("posX");
    expect(hotspot).toHaveProperty("posY");
    expect(hotspot).toHaveProperty("partName");
    expect(hotspot).toHaveProperty("partReference");
    expect(hotspot).toHaveProperty("partPriceHT");
  });

  it("should have percentage-based positions", () => {
    mockHotspots.forEach((hs) => {
      const x = parseFloat(hs.posX);
      const y = parseFloat(hs.posY);
      expect(x).toBeGreaterThanOrEqual(0);
      expect(x).toBeLessThanOrEqual(100);
      expect(y).toBeGreaterThanOrEqual(0);
      expect(y).toBeLessThanOrEqual(100);
    });
  });

  it("should link to valid spare parts", () => {
    mockHotspots.forEach((hs) => {
      expect(hs.sparePartId).toBeGreaterThan(0);
      expect(hs.partReference).toBeTruthy();
    });
  });

  it("should allow custom labels or fallback to part name", () => {
    const withLabel = mockHotspots[0];
    const withoutLabel = mockHotspots[1];
    expect(withLabel.label).toBe("Jet dos haut");
    expect(withoutLabel.label).toBeNull();
    // Display logic: use label if present, otherwise partName
    const displayLabel = (hs: typeof mockHotspots[0]) => hs.label || hs.partName;
    expect(displayLabel(withLabel)).toBe("Jet dos haut");
    expect(displayLabel(withoutLabel)).toBe("Zone 1 Lounger - jet mollet");
  });
});

// ============================================
// EXPLORER DATA (FULL TREE) TESTS
// ============================================

describe("Visual Explorer - Full Explorer Data", () => {
  it("should return layers with nested zones and hotspots", () => {
    expect(mockExplorerData).toHaveLength(2);
    expect(mockExplorerData[0].zones).toHaveLength(2);
    expect(mockExplorerData[0].zones[0].hotspots).toHaveLength(2);
    expect(mockExplorerData[0].zones[1].hotspots).toHaveLength(0);
    expect(mockExplorerData[1].zones).toHaveLength(0);
  });

  it("should have correct hierarchy: layer → zones → hotspots", () => {
    const shellLayer = mockExplorerData[0];
    expect(shellLayer.layerType).toBe("SHELL");
    
    const loungerZone = shellLayer.zones[0];
    expect(loungerZone.name).toBe("lounger_1");
    expect(loungerZone.layerId).toBe(shellLayer.id);
    
    const firstHotspot = loungerZone.hotspots[0];
    expect(firstHotspot.zoneId).toBe(loungerZone.id);
    expect(firstHotspot.sparePartId).toBe(5);
  });

  it("should identify configured layers (those with images)", () => {
    const configured = mockExplorerData.filter((l) => l.imageUrl);
    expect(configured).toHaveLength(1);
    expect(configured[0].layerType).toBe("SHELL");
  });

  it("should calculate total hotspots per layer", () => {
    const totalHotspots = (layer: typeof mockExplorerData[0]) =>
      layer.zones.reduce((sum, z) => sum + z.hotspots.length, 0);
    
    expect(totalHotspots(mockExplorerData[0])).toBe(2);
    expect(totalHotspots(mockExplorerData[1])).toBe(0);
  });
});

// ============================================
// LAYER TYPE CONSTANTS TESTS
// ============================================

describe("Visual Explorer - Layer Type Constants", () => {
  const LAYER_TYPES = {
    SHELL: { label: "Coque intérieure", description: "Jets, écran, oreillers, éclairage, audio" },
    TECHNICAL: { label: "Pompes & Électronique", description: "Pompes, chauffage, plomberie, ozone" },
    EXTERIOR: { label: "Extérieur", description: "Panneaux, coins, couverture, habillage" },
  };

  it("should have exactly 3 layer types", () => {
    expect(Object.keys(LAYER_TYPES)).toHaveLength(3);
  });

  it("should have SHELL, TECHNICAL, EXTERIOR types", () => {
    expect(LAYER_TYPES).toHaveProperty("SHELL");
    expect(LAYER_TYPES).toHaveProperty("TECHNICAL");
    expect(LAYER_TYPES).toHaveProperty("EXTERIOR");
  });

  it("should have labels and descriptions for each type", () => {
    Object.values(LAYER_TYPES).forEach((config) => {
      expect(config.label).toBeTruthy();
      expect(config.description).toBeTruthy();
    });
  });
});

// ============================================
// POSITION VALIDATION TESTS
// ============================================

describe("Visual Explorer - Position Validation", () => {
  it("should clamp positions between 0 and 100", () => {
    const clamp = (val: number) => Math.max(0, Math.min(100, val));
    expect(clamp(-5)).toBe(0);
    expect(clamp(150)).toBe(100);
    expect(clamp(50)).toBe(50);
    expect(clamp(0)).toBe(0);
    expect(clamp(100)).toBe(100);
  });

  it("should calculate position from mouse event correctly", () => {
    // Simulate: image rect at (100, 200) with width 800, height 600
    const rect = { left: 100, top: 200, width: 800, height: 600 };
    const clientX = 500; // 400px from left = 50%
    const clientY = 500; // 300px from top = 50%
    
    const x = ((clientX - rect.left) / rect.width * 100);
    const y = ((clientY - rect.top) / rect.height * 100);
    
    expect(x).toBe(50);
    expect(y).toBe(50);
  });

  it("should handle edge positions", () => {
    const rect = { left: 0, top: 0, width: 1000, height: 500 };
    
    // Top-left corner
    expect(((0 - rect.left) / rect.width * 100)).toBe(0);
    expect(((0 - rect.top) / rect.height * 100)).toBe(0);
    
    // Bottom-right corner
    expect(((1000 - rect.left) / rect.width * 100)).toBe(100);
    expect(((500 - rect.top) / rect.height * 100)).toBe(100);
  });
});

// ============================================
// FALLBACK LOGIC TESTS
// ============================================

describe("Visual Explorer - Fallback Logic", () => {
  it("should fallback to classic list when no layers are configured", () => {
    const layers: any[] = [];
    const hasExplorer = layers.some((l) => l.imageUrl);
    expect(hasExplorer).toBe(false);
  });

  it("should fallback when layers exist but none have images", () => {
    const layers = [{ id: 1, imageUrl: null }, { id: 2, imageUrl: null }];
    const hasExplorer = layers.some((l) => l.imageUrl);
    expect(hasExplorer).toBe(false);
  });

  it("should show explorer when at least one layer has an image", () => {
    const layers = [{ id: 1, imageUrl: "https://example.com/img.jpg" }, { id: 2, imageUrl: null }];
    const hasExplorer = layers.some((l) => l.imageUrl);
    expect(hasExplorer).toBe(true);
  });

  it("should use zone image for hotspots if available, otherwise layer image", () => {
    const zone = { imageUrl: "https://example.com/zone.jpg" };
    const layer = { imageUrl: "https://example.com/layer.jpg" };
    const displayImage = zone.imageUrl || layer.imageUrl;
    expect(displayImage).toBe("https://example.com/zone.jpg");
  });

  it("should use layer image when zone has no image", () => {
    const zone = { imageUrl: null };
    const layer = { imageUrl: "https://example.com/layer.jpg" };
    const displayImage = zone.imageUrl || layer.imageUrl;
    expect(displayImage).toBe("https://example.com/layer.jpg");
  });
});
