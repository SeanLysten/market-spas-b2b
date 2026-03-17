import { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  ChevronLeft,
  ChevronRight,
  X,
  Download,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Maximize2,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Types ──────────────────────────────────────────────────────────────────────

export interface ViewerResource {
  id: number;
  title: string;
  fileUrl: string;
  fileType: string;
  fileSize?: number;
  thumbnailUrl?: string | null;
}

interface FullscreenImageViewerProps {
  resources: ViewerResource[];
  currentIndex: number;
  open: boolean;
  onClose: () => void;
  onDownload?: (resource: ViewerResource) => void;
}

// ─── Helpers ────────────────────────────────────────────────────────────────────

const formatSize = (bytes?: number) => {
  if (!bytes) return "";
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
};

// ─── Component ──────────────────────────────────────────────────────────────────

export default function FullscreenImageViewer({
  resources,
  currentIndex,
  open,
  onClose,
  onDownload,
}: FullscreenImageViewerProps) {
  const [index, setIndex] = useState(currentIndex);
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [touchStart, setTouchStart] = useState<{ x: number; y: number } | null>(null);
  const [translate, setTranslate] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  // Filter to only image resources for navigation
  const imageResources = resources.filter((r) => r.fileType.startsWith("image/"));
  const currentResource = imageResources[index];

  // Sync index when currentIndex changes
  useEffect(() => {
    if (open) {
      // Find the correct index in imageResources
      const targetResource = resources[currentIndex];
      if (targetResource) {
        const imgIdx = imageResources.findIndex((r) => r.id === targetResource.id);
        setIndex(imgIdx >= 0 ? imgIdx : 0);
      }
      setZoom(1);
      setRotation(0);
      setTranslate({ x: 0, y: 0 });
      setIsLoading(true);
    }
  }, [currentIndex, open]);

  // Reset zoom/rotation when navigating
  const resetView = useCallback(() => {
    setZoom(1);
    setRotation(0);
    setTranslate({ x: 0, y: 0 });
    setIsLoading(true);
  }, []);

  const goNext = useCallback(() => {
    if (index < imageResources.length - 1) {
      setIndex((i) => i + 1);
      resetView();
    }
  }, [index, imageResources.length, resetView]);

  const goPrev = useCallback(() => {
    if (index > 0) {
      setIndex((i) => i - 1);
      resetView();
    }
  }, [index, resetView]);

  // Keyboard navigation
  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case "ArrowRight":
        case "ArrowDown":
          e.preventDefault();
          goNext();
          break;
        case "ArrowLeft":
        case "ArrowUp":
          e.preventDefault();
          goPrev();
          break;
        case "Escape":
          e.preventDefault();
          onClose();
          break;
        case "+":
        case "=":
          e.preventDefault();
          setZoom((z) => Math.min(z + 0.25, 5));
          break;
        case "-":
          e.preventDefault();
          setZoom((z) => Math.max(z - 0.25, 0.25));
          break;
        case "0":
          e.preventDefault();
          resetView();
          break;
        case "r":
          e.preventDefault();
          setRotation((r) => (r + 90) % 360);
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, goNext, goPrev, onClose, resetView]);

  // Lock body scroll when open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = "";
      };
    }
  }, [open]);

  // Touch swipe for mobile
  const handleTouchStart = (e: React.TouchEvent) => {
    if (zoom > 1) return; // Don't swipe when zoomed
    setTouchStart({ x: e.touches[0].clientX, y: e.touches[0].clientY });
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStart || zoom > 1) return;
    const dx = e.changedTouches[0].clientX - touchStart.x;
    const dy = e.changedTouches[0].clientY - touchStart.y;

    // Only horizontal swipes
    if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 50) {
      if (dx < 0) goNext();
      else goPrev();
    }
    setTouchStart(null);
  };

  // Mouse drag for panning when zoomed
  const handleMouseDown = (e: React.MouseEvent) => {
    if (zoom <= 1) return;
    e.preventDefault();
    setIsDragging(true);
    setDragStart({ x: e.clientX - translate.x, y: e.clientY - translate.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || zoom <= 1) return;
    setTranslate({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Scroll to zoom
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.15 : 0.15;
    setZoom((z) => Math.min(Math.max(z + delta, 0.25), 5));
  };

  if (!open || !currentResource) return null;

  const counter = `${index + 1} / ${imageResources.length}`;
  const hasPrev = index > 0;
  const hasNext = index < imageResources.length - 1;

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-[100] bg-black/95 flex flex-col select-none"
      onWheel={handleWheel}
    >
      {/* Top bar */}
      <div className="relative z-10 flex items-center justify-between px-3 py-2 md:px-6 md:py-3 bg-gradient-to-b from-black/80 to-transparent">
        {/* Left: counter + title */}
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <span className="text-white/70 text-xs md:text-sm font-mono shrink-0">{counter}</span>
          <h3 className="text-white text-sm md:text-base font-medium truncate">
            {currentResource.title}
          </h3>
          {currentResource.fileSize && (
            <span className="text-white/50 text-xs shrink-0 hidden md:inline">
              {formatSize(currentResource.fileSize)}
            </span>
          )}
        </div>

        {/* Right: actions */}
        <div className="flex items-center gap-1 md:gap-2 shrink-0">
          {/* Zoom controls - desktop only */}
          <div className="hidden md:flex items-center gap-1 mr-2">
            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8 text-white/70 hover:text-white hover:bg-white/10"
              onClick={() => setZoom((z) => Math.max(z - 0.25, 0.25))}
            >
              <ZoomOut className="w-4 h-4" />
            </Button>
            <span className="text-white/60 text-xs font-mono w-12 text-center">
              {Math.round(zoom * 100)}%
            </span>
            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8 text-white/70 hover:text-white hover:bg-white/10"
              onClick={() => setZoom((z) => Math.min(z + 0.25, 5))}
            >
              <ZoomIn className="w-4 h-4" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8 text-white/70 hover:text-white hover:bg-white/10"
              onClick={() => setRotation((r) => (r + 90) % 360)}
            >
              <RotateCw className="w-4 h-4" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8 text-white/70 hover:text-white hover:bg-white/10"
              onClick={resetView}
              title="Réinitialiser"
            >
              <Maximize2 className="w-4 h-4" />
            </Button>
          </div>

          {onDownload && (
            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8 md:h-9 md:w-9 text-white/70 hover:text-white hover:bg-white/10"
              onClick={() => onDownload(currentResource)}
            >
              <Download className="w-4 h-4 md:w-5 md:h-5" />
            </Button>
          )}
          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8 md:h-9 md:w-9 text-white/70 hover:text-white hover:bg-white/10"
            onClick={onClose}
          >
            <X className="w-5 h-5 md:w-6 md:h-6" />
          </Button>
        </div>
      </div>

      {/* Main image area */}
      <div
        className="flex-1 relative flex items-center justify-center overflow-hidden"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        style={{ cursor: zoom > 1 ? (isDragging ? "grabbing" : "grab") : "default" }}
      >
        {/* Loading spinner */}
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center z-10">
            <div className="w-10 h-10 border-3 border-white/20 border-t-white rounded-full animate-spin" />
          </div>
        )}

        {/* Image */}
        <img
          key={currentResource.id}
          src={currentResource.fileUrl}
          alt={currentResource.title}
          className={cn(
            "max-w-[90vw] max-h-[80vh] object-contain transition-opacity duration-300",
            isLoading ? "opacity-0" : "opacity-100"
          )}
          style={{
            transform: `translate(${translate.x}px, ${translate.y}px) scale(${zoom}) rotate(${rotation}deg)`,
            transition: isDragging ? "none" : "transform 0.2s ease-out",
          }}
          onLoad={() => setIsLoading(false)}
          draggable={false}
        />

        {/* Navigation arrows - desktop */}
        {hasPrev && (
          <button
            className="hidden md:flex absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 items-center justify-center rounded-full bg-black/40 hover:bg-black/70 text-white/80 hover:text-white transition-all backdrop-blur-sm border border-white/10"
            onClick={goPrev}
          >
            <ChevronLeft className="w-7 h-7" />
          </button>
        )}
        {hasNext && (
          <button
            className="hidden md:flex absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 items-center justify-center rounded-full bg-black/40 hover:bg-black/70 text-white/80 hover:text-white transition-all backdrop-blur-sm border border-white/10"
            onClick={goNext}
          >
            <ChevronRight className="w-7 h-7" />
          </button>
        )}

        {/* Navigation arrows - mobile (bottom area) */}
        <div className="md:hidden absolute bottom-4 left-0 right-0 flex items-center justify-center gap-8">
          <button
            className={cn(
              "w-11 h-11 flex items-center justify-center rounded-full bg-black/50 backdrop-blur-sm border border-white/10 transition-all",
              hasPrev ? "text-white/80 active:bg-white/20" : "text-white/20 pointer-events-none"
            )}
            onClick={goPrev}
            disabled={!hasPrev}
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <span className="text-white/60 text-sm font-mono">{counter}</span>
          <button
            className={cn(
              "w-11 h-11 flex items-center justify-center rounded-full bg-black/50 backdrop-blur-sm border border-white/10 transition-all",
              hasNext ? "text-white/80 active:bg-white/20" : "text-white/20 pointer-events-none"
            )}
            onClick={goNext}
            disabled={!hasNext}
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* Bottom thumbnail strip - desktop */}
      <div className="hidden md:block bg-gradient-to-t from-black/80 to-transparent py-3 px-4">
        <div className="flex items-center justify-center gap-1.5 overflow-x-auto max-w-4xl mx-auto scrollbar-thin">
          {imageResources.map((r, i) => (
            <button
              key={r.id}
              className={cn(
                "w-14 h-14 rounded-lg overflow-hidden shrink-0 border-2 transition-all",
                i === index
                  ? "border-white ring-1 ring-white/50 scale-110"
                  : "border-transparent opacity-50 hover:opacity-80 hover:border-white/30"
              )}
              onClick={() => {
                setIndex(i);
                resetView();
              }}
            >
              <img
                src={r.thumbnailUrl || `/api/resources/thumbnail/${r.id}`}
                alt={r.title}
                className="w-full h-full object-cover"
                loading="lazy"
                decoding="async"
              />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
