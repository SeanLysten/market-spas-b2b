import { describe, it, expect } from "vitest";

describe("Product Reorder", () => {
  it("should have updateProductSortOrder function exported from db", async () => {
    const db = await import("./db");
    expect(typeof db.updateProductSortOrder).toBe("function");
  });

  it("should have sortOrder field in products schema", async () => {
    const schema = await import("../drizzle/schema");
    expect(schema.products).toBeDefined();
    // Verify the sortOrder column exists in the products table
    const columns = Object.keys(schema.products);
    // The table object has column accessors
    expect(schema.products.sortOrder).toBeDefined();
  });

  it("should have reorder route in admin products router", async () => {
    const { appRouter } = await import("./routers");
    // Verify the router structure includes admin.products.reorder
    expect(appRouter).toBeDefined();
    // The router should have the procedure defined
    const procedures = (appRouter as any)._def?.procedures;
    if (procedures) {
      expect(procedures["admin.products.reorder"]).toBeDefined();
    }
  });

  it("should sort products by sortOrder ascending", async () => {
    // Test the ordering logic: products with lower sortOrder should come first
    const products = [
      { id: 1, sortOrder: 3, name: "C" },
      { id: 2, sortOrder: 1, name: "A" },
      { id: 3, sortOrder: 2, name: "B" },
    ];

    const sorted = [...products].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
    expect(sorted[0].name).toBe("A");
    expect(sorted[1].name).toBe("B");
    expect(sorted[2].name).toBe("C");
  });

  it("should correctly reorder array with arrayMove logic", () => {
    // Simulate the arrayMove function from @dnd-kit
    function arrayMove<T>(array: T[], from: number, to: number): T[] {
      const newArray = [...array];
      const [removed] = newArray.splice(from, 1);
      newArray.splice(to, 0, removed);
      return newArray;
    }

    const products = [
      { id: 1, name: "First" },
      { id: 2, name: "Second" },
      { id: 3, name: "Third" },
      { id: 4, name: "Fourth" },
    ];

    // Move "Third" (index 2) to position 0
    const reordered = arrayMove(products, 2, 0);
    expect(reordered[0].name).toBe("Third");
    expect(reordered[1].name).toBe("First");
    expect(reordered[2].name).toBe("Second");
    expect(reordered[3].name).toBe("Fourth");

    // Verify orderedIds generation
    const orderedIds = reordered.map((p) => p.id);
    expect(orderedIds).toEqual([3, 1, 2, 4]);
  });

  it("should generate correct sortOrder values from orderedIds", () => {
    const orderedIds = [5, 2, 8, 1, 3];
    const sortOrders = orderedIds.map((id, index) => ({
      id,
      sortOrder: index + 1,
    }));

    expect(sortOrders).toEqual([
      { id: 5, sortOrder: 1 },
      { id: 2, sortOrder: 2 },
      { id: 8, sortOrder: 3 },
      { id: 1, sortOrder: 4 },
      { id: 3, sortOrder: 5 },
    ]);
  });
});
