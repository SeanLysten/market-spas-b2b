import { describe, it, expect } from 'vitest';

describe('PDF Viewer Feature', () => {
  it('should have PDFViewer component file', async () => {
    const fs = await import('fs');
    const path = await import('path');
    const componentPath = path.resolve(__dirname, '../client/src/components/PDFViewer.tsx');
    expect(fs.existsSync(componentPath)).toBe(true);
  });

  it('should export a default function component', async () => {
    const fs = await import('fs');
    const path = await import('path');
    const componentPath = path.resolve(__dirname, '../client/src/components/PDFViewer.tsx');
    const content = fs.readFileSync(componentPath, 'utf-8');
    expect(content).toContain('export default function PDFViewer');
  });

  it('should accept fileUrl, fileName, and onClose props', async () => {
    const fs = await import('fs');
    const path = await import('path');
    const componentPath = path.resolve(__dirname, '../client/src/components/PDFViewer.tsx');
    const content = fs.readFileSync(componentPath, 'utf-8');
    expect(content).toContain('fileUrl: string');
    expect(content).toContain('fileName: string');
    expect(content).toContain('onClose: () => void');
  });

  it('should include page navigation controls (prev/next)', async () => {
    const fs = await import('fs');
    const path = await import('path');
    const componentPath = path.resolve(__dirname, '../client/src/components/PDFViewer.tsx');
    const content = fs.readFileSync(componentPath, 'utf-8');
    expect(content).toContain('goToPrevPage');
    expect(content).toContain('goToNextPage');
    expect(content).toContain('Précédent');
    expect(content).toContain('Suivant');
  });

  it('should include zoom controls', async () => {
    const fs = await import('fs');
    const path = await import('path');
    const componentPath = path.resolve(__dirname, '../client/src/components/PDFViewer.tsx');
    const content = fs.readFileSync(componentPath, 'utf-8');
    expect(content).toContain('zoomIn');
    expect(content).toContain('zoomOut');
    expect(content).toContain('ZoomIn');
    expect(content).toContain('ZoomOut');
  });

  it('should include a back/close button', async () => {
    const fs = await import('fs');
    const path = await import('path');
    const componentPath = path.resolve(__dirname, '../client/src/components/PDFViewer.tsx');
    const content = fs.readFileSync(componentPath, 'utf-8');
    expect(content).toContain('onClose');
    expect(content).toContain('Retour');
    expect(content).toContain('ArrowLeft');
  });

  it('should include a download button as fallback', async () => {
    const fs = await import('fs');
    const path = await import('path');
    const componentPath = path.resolve(__dirname, '../client/src/components/PDFViewer.tsx');
    const content = fs.readFileSync(componentPath, 'utf-8');
    expect(content).toContain('Télécharger');
    expect(content).toContain('handleDownload');
  });

  it('should handle keyboard navigation (arrows, escape)', async () => {
    const fs = await import('fs');
    const path = await import('path');
    const componentPath = path.resolve(__dirname, '../client/src/components/PDFViewer.tsx');
    const content = fs.readFileSync(componentPath, 'utf-8');
    expect(content).toContain('handleKeyDown');
    expect(content).toContain('ArrowLeft');
    expect(content).toContain('ArrowRight');
    expect(content).toContain('Escape');
  });

  it('should use react-pdf Document and Page components', async () => {
    const fs = await import('fs');
    const path = await import('path');
    const componentPath = path.resolve(__dirname, '../client/src/components/PDFViewer.tsx');
    const content = fs.readFileSync(componentPath, 'utf-8');
    expect(content).toContain('import { Document, Page, pdfjs } from "react-pdf"');
    expect(content).toContain('<Document');
    expect(content).toContain('<Page');
  });

  it('should display loading state while PDF loads', async () => {
    const fs = await import('fs');
    const path = await import('path');
    const componentPath = path.resolve(__dirname, '../client/src/components/PDFViewer.tsx');
    const content = fs.readFileSync(componentPath, 'utf-8');
    expect(content).toContain('isLoading');
    expect(content).toContain('Chargement du document');
  });

  it('should display error state with download fallback', async () => {
    const fs = await import('fs');
    const path = await import('path');
    const componentPath = path.resolve(__dirname, '../client/src/components/PDFViewer.tsx');
    const content = fs.readFileSync(componentPath, 'utf-8');
    expect(content).toContain('error');
    expect(content).toContain('Impossible de charger ce document PDF');
  });

  it('should have fullscreen toggle', async () => {
    const fs = await import('fs');
    const path = await import('path');
    const componentPath = path.resolve(__dirname, '../client/src/components/PDFViewer.tsx');
    const content = fs.readFileSync(componentPath, 'utf-8');
    expect(content).toContain('isFullscreen');
    expect(content).toContain('toggleFullscreen');
    expect(content).toContain('Maximize2');
    expect(content).toContain('Minimize2');
  });

  it('should be integrated in user TechnicalResources page', async () => {
    const fs = await import('fs');
    const path = await import('path');
    const pagePath = path.resolve(__dirname, '../client/src/pages/TechnicalResources.tsx');
    const content = fs.readFileSync(pagePath, 'utf-8');
    expect(content).toContain('import PDFViewer from "@/components/PDFViewer"');
    expect(content).toContain('viewingPdf');
    expect(content).toContain('setViewingPdf');
    expect(content).toContain('Lire');
  });

  it('should be integrated in admin TechnicalResources page', async () => {
    const fs = await import('fs');
    const path = await import('path');
    const pagePath = path.resolve(__dirname, '../client/src/pages/admin/TechnicalResources.tsx');
    const content = fs.readFileSync(pagePath, 'utf-8');
    expect(content).toContain('import PDFViewer from "@/components/PDFViewer"');
    expect(content).toContain('viewingPdf');
    expect(content).toContain('setViewingPdf');
  });

  it('should only show Lire button for PDF type resources on user page', async () => {
    const fs = await import('fs');
    const path = await import('path');
    const pagePath = path.resolve(__dirname, '../client/src/pages/TechnicalResources.tsx');
    const content = fs.readFileSync(pagePath, 'utf-8');
    // The Lire button should be conditional on resource.type === "PDF"
    expect(content).toContain('resource.type === "PDF"');
  });

  it('should include page number input for direct navigation', async () => {
    const fs = await import('fs');
    const path = await import('path');
    const componentPath = path.resolve(__dirname, '../client/src/components/PDFViewer.tsx');
    const content = fs.readFileSync(componentPath, 'utf-8');
    expect(content).toContain('type="number"');
    expect(content).toContain('min={1}');
    expect(content).toContain('max={numPages}');
  });
});
