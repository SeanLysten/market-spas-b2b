import { describe, it, expect } from 'vitest';

describe('Resource Favorites Feature', () => {
  // ---- Schema Tests ----
  it('should have resourceFavorites table in schema', async () => {
    const schema = await import('../drizzle/schema');
    expect(schema.resourceFavorites).toBeDefined();
  });

  it('should have correct columns in resourceFavorites table', async () => {
    const fs = await import('fs');
    const path = await import('path');
    const schemaPath = path.resolve(__dirname, '../drizzle/schema.ts');
    const content = fs.readFileSync(schemaPath, 'utf-8');
    expect(content).toContain('"resource_favorites"');
    expect(content).toContain('userId: int("userId").notNull()');
    expect(content).toContain('resourceId: int("resourceId").notNull()');
    expect(content).toContain('createdAt: timestamp("createdAt")');
  });

  it('should have unique constraint on userId + resourceId', async () => {
    const fs = await import('fs');
    const path = await import('path');
    const schemaPath = path.resolve(__dirname, '../drizzle/schema.ts');
    const content = fs.readFileSync(schemaPath, 'utf-8');
    expect(content).toContain('rf_user_resource_unique');
    expect(content).toContain('unique(');
  });

  it('should export ResourceFavorite and InsertResourceFavorite types', async () => {
    const schema = await import('../drizzle/schema');
    expect(schema).toHaveProperty('resourceFavorites');
  });

  // ---- DB Functions Tests ----
  it('should export toggleResourceFavorite function', async () => {
    const db = await import('./db');
    expect(typeof db.toggleResourceFavorite).toBe('function');
  });

  it('should export getUserResourceFavorites function', async () => {
    const db = await import('./db');
    expect(typeof db.getUserResourceFavorites).toBe('function');
  });

  it('should export getUserFavoriteResources function', async () => {
    const db = await import('./db');
    expect(typeof db.getUserFavoriteResources).toBe('function');
  });

  // ---- tRPC Routes Tests ----
  it('should have resourceFavorites router in appRouter', async () => {
    const fs = await import('fs');
    const path = await import('path');
    const routersPath = path.resolve(__dirname, './routers.ts');
    const content = fs.readFileSync(routersPath, 'utf-8');
    expect(content).toContain('resourceFavorites: router({');
  });

  it('should have toggle mutation in resourceFavorites router', async () => {
    const fs = await import('fs');
    const path = await import('path');
    const routersPath = path.resolve(__dirname, './routers.ts');
    const content = fs.readFileSync(routersPath, 'utf-8');
    expect(content).toContain('toggle: protectedProcedure');
    expect(content).toContain('toggleResourceFavorite');
  });

  it('should have list query in resourceFavorites router', async () => {
    const fs = await import('fs');
    const path = await import('path');
    const routersPath = path.resolve(__dirname, './routers.ts');
    const content = fs.readFileSync(routersPath, 'utf-8');
    expect(content).toContain('list: protectedProcedure');
    expect(content).toContain('getUserResourceFavorites');
  });

  it('should have listWithDetails query in resourceFavorites router', async () => {
    const fs = await import('fs');
    const path = await import('path');
    const routersPath = path.resolve(__dirname, './routers.ts');
    const content = fs.readFileSync(routersPath, 'utf-8');
    expect(content).toContain('listWithDetails: protectedProcedure');
    expect(content).toContain('getUserFavoriteResources');
  });

  it('should require resourceId input for toggle mutation', async () => {
    const fs = await import('fs');
    const path = await import('path');
    const routersPath = path.resolve(__dirname, './routers.ts');
    const content = fs.readFileSync(routersPath, 'utf-8');
    expect(content).toContain('z.object({ resourceId: z.number() })');
  });

  // ---- Frontend Integration Tests ----
  it('should have favorite star button in user TechnicalResources page', async () => {
    const fs = await import('fs');
    const path = await import('path');
    const pagePath = path.resolve(__dirname, '../client/src/pages/TechnicalResources.tsx');
    const content = fs.readFileSync(pagePath, 'utf-8');
    expect(content).toContain('Star');
    expect(content).toContain('handleToggleFavorite');
    expect(content).toContain('isFavorite');
  });

  it('should have favorites section at top of resources list', async () => {
    const fs = await import('fs');
    const path = await import('path');
    const pagePath = path.resolve(__dirname, '../client/src/pages/TechnicalResources.tsx');
    const content = fs.readFileSync(pagePath, 'utf-8');
    expect(content).toContain('Mes favoris');
    expect(content).toContain('favoriteResources');
  });

  it('should use trpc.resourceFavorites hooks in TechnicalResources', async () => {
    const fs = await import('fs');
    const path = await import('path');
    const pagePath = path.resolve(__dirname, '../client/src/pages/TechnicalResources.tsx');
    const content = fs.readFileSync(pagePath, 'utf-8');
    expect(content).toContain('trpc.resourceFavorites.list.useQuery');
    expect(content).toContain('trpc.resourceFavorites.listWithDetails.useQuery');
    expect(content).toContain('trpc.resourceFavorites.toggle.useMutation');
  });

  it('should show toast notifications when toggling favorites', async () => {
    const fs = await import('fs');
    const path = await import('path');
    const pagePath = path.resolve(__dirname, '../client/src/pages/TechnicalResources.tsx');
    const content = fs.readFileSync(pagePath, 'utf-8');
    expect(content).toContain('Ajouté aux favoris');
    expect(content).toContain('Retiré des favoris');
    expect(content).toContain('toast');
  });

  it('should conditionally show favorites section only when there are favorites and at root level', async () => {
    const fs = await import('fs');
    const path = await import('path');
    const pagePath = path.resolve(__dirname, '../client/src/pages/TechnicalResources.tsx');
    const content = fs.readFileSync(pagePath, 'utf-8');
    expect(content).toContain('favoriteResources.length > 0 && currentFolderId === null');
  });

  it('should have amber styling for favorite stars', async () => {
    const fs = await import('fs');
    const path = await import('path');
    const pagePath = path.resolve(__dirname, '../client/src/pages/TechnicalResources.tsx');
    const content = fs.readFileSync(pagePath, 'utf-8');
    expect(content).toContain('text-amber-500 fill-amber-500');
  });

  it('should have Lire button in favorites section for PDF resources', async () => {
    const fs = await import('fs');
    const path = await import('path');
    const pagePath = path.resolve(__dirname, '../client/src/pages/TechnicalResources.tsx');
    const content = fs.readFileSync(pagePath, 'utf-8');
    // Check that the favorites section has a Lire button for PDFs
    expect(content).toContain('BookOpen');
    expect(content).toContain('Lire');
  });
});
