import { describe, it, expect } from "vitest";
import { readFileSync, existsSync } from "fs";
import { resolve } from "path";

const ROOT = resolve(__dirname, "..");

function readFile(relPath: string): string {
  const fullPath = resolve(ROOT, relPath);
  if (!existsSync(fullPath)) throw new Error(`File not found: ${fullPath}`);
  return readFileSync(fullPath, "utf-8");
}

describe("Phase E — Formulaires", () => {
  it("Input component has transition-all and hover border", () => {
    const content = readFile("client/src/components/ui/input.tsx");
    expect(content).toContain("transition-all");
    expect(content).toContain("duration-200");
    expect(content).toContain("ease-out");
    expect(content).toContain("hover:border-muted-foreground/30");
    expect(content).toContain("focus-visible:shadow-md");
  });

  it("Textarea component has transition-all and hover border", () => {
    const content = readFile("client/src/components/ui/textarea.tsx");
    expect(content).toContain("transition-all");
    expect(content).toContain("duration-200");
    expect(content).toContain("hover:border-muted-foreground/30");
    expect(content).toContain("focus-visible:shadow-md");
  });

  it("Select trigger has transition-all and hover border", () => {
    const content = readFile("client/src/components/ui/select.tsx");
    expect(content).toContain("transition-all");
    expect(content).toContain("duration-200");
    expect(content).toContain("hover:border-muted-foreground/30");
    expect(content).toContain("focus-visible:shadow-md");
  });

  it("Label has transition-colors and text-muted-foreground", () => {
    const content = readFile("client/src/components/ui/label.tsx");
    expect(content).toContain("transition-colors");
    expect(content).toContain("duration-200");
    expect(content).toContain("text-muted-foreground");
  });

  it("Tabs component has sliding indicator with MutationObserver", () => {
    const content = readFile("client/src/components/ui/tabs.tsx");
    expect(content).toContain("MutationObserver");
    expect(content).toContain("indicatorStyle");
    expect(content).toContain("aria-hidden");
    expect(content).toContain("transition-all");
    expect(content).toContain("duration-300");
  });

  it("TabsTrigger has z-[1] and bg-transparent for sliding indicator", () => {
    const content = readFile("client/src/components/ui/tabs.tsx");
    expect(content).toContain("z-[1]");
    expect(content).toContain("bg-transparent");
  });

  it("Checkbox has transition-all for smooth state change", () => {
    const content = readFile("client/src/components/ui/checkbox.tsx");
    expect(content).toContain("transition-all");
    expect(content).toContain("duration-200");
  });

  it("Design system has form-group focus-within label color", () => {
    const content = readFile("client/src/styles/design-system.css");
    expect(content).toContain(".form-group:focus-within");
    expect(content).toContain('data-slot="label"');
    expect(content).toContain("var(--p-500)");
  });
});

describe("Phase F — Polish final", () => {
  it("Dialog has backdrop-blur and improved animations", () => {
    const content = readFile("client/src/components/ui/dialog.tsx");
    expect(content).toContain("backdrop-blur");
    expect(content).toContain("bg-black/40");
    expect(content).toContain("rounded-xl");
    expect(content).toContain("shadow-xl");
    expect(content).toContain("duration-300");
  });

  it("Sheet has backdrop-blur overlay", () => {
    const content = readFile("client/src/components/ui/sheet.tsx");
    expect(content).toContain("backdrop-blur");
    expect(content).toContain("bg-black/40");
  });

  it("Skeleton uses skeleton-shimmer class from design system", () => {
    const content = readFile("client/src/components/ui/skeleton.tsx");
    expect(content).toContain("skeleton-shimmer");
    // Should NOT have the old animate-pulse approach
    expect(content).not.toContain("animate-pulse");
  });

  it("Design system has global scrollbar styles", () => {
    const content = readFile("client/src/styles/design-system.css");
    expect(content).toContain("scrollbar-width: thin");
    expect(content).toContain("::-webkit-scrollbar");
    expect(content).toContain("width: 6px");
  });

  it("Design system has skeleton variant classes", () => {
    const content = readFile("client/src/styles/design-system.css");
    expect(content).toContain(".skeleton-text");
    expect(content).toContain(".skeleton-title");
    expect(content).toContain(".skeleton-avatar");
    expect(content).toContain(".skeleton-card");
  });

  it("Design system has page-enter animation class", () => {
    const content = readFile("client/src/styles/design-system.css");
    expect(content).toContain(".page-enter");
    expect(content).toContain("fadeInUp");
  });

  it("DashboardLayout uses page-enter class", () => {
    const content = readFile("client/src/components/DashboardLayout.tsx");
    expect(content).toContain("page-enter");
  });

  it("AdminLayout uses page-enter class", () => {
    const content = readFile("client/src/components/AdminLayout.tsx");
    expect(content).toContain("page-enter");
  });

  it("prefers-reduced-motion disables all animations", () => {
    const content = readFile("client/src/styles/design-system.css");
    expect(content).toContain("prefers-reduced-motion: reduce");
    expect(content).toContain(".page-enter");
    expect(content).toContain(".skeleton-shimmer");
    expect(content).toContain("scroll-behavior: auto");
    expect(content).toContain(".animate-fade-in-up");
    expect(content).toContain("opacity: 1");
  });

  it("Toaster is configured with position and rounded style", () => {
    const content = readFile("client/src/App.tsx");
    expect(content).toContain('position="top-right"');
    expect(content).toContain("!rounded-xl");
  });

  it("Card component has transition-all ease-out", () => {
    const content = readFile("client/src/components/ui/card.tsx");
    expect(content).toContain("transition-all");
    expect(content).toContain("ease-out");
  });
});
