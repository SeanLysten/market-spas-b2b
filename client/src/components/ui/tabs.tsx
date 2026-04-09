import * as React from "react";
import * as TabsPrimitive from "@radix-ui/react-tabs";

import { cn } from "@/lib/utils";

function Tabs({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Root>) {
  return (
    <TabsPrimitive.Root
      data-slot="tabs"
      className={cn("flex flex-col gap-2", className)}
      {...props}
    />
  );
}

function TabsList({
  className,
  children,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.List>) {
  const listRef = React.useRef<HTMLDivElement>(null);
  const [indicatorStyle, setIndicatorStyle] = React.useState<React.CSSProperties>({
    opacity: 0,
  });

  const updateIndicator = React.useCallback(() => {
    const list = listRef.current;
    if (!list) return;
    const activeTab = list.querySelector<HTMLElement>('[data-state="active"]');
    if (!activeTab) {
      setIndicatorStyle({ opacity: 0 });
      return;
    }
    const listRect = list.getBoundingClientRect();
    const tabRect = activeTab.getBoundingClientRect();
    setIndicatorStyle({
      left: tabRect.left - listRect.left,
      width: tabRect.width,
      opacity: 1,
    });
  }, []);

  React.useEffect(() => {
    updateIndicator();
    const list = listRef.current;
    if (!list) return;
    // Observe attribute changes on children (data-state)
    const observer = new MutationObserver(updateIndicator);
    observer.observe(list, {
      attributes: true,
      subtree: true,
      attributeFilter: ["data-state"],
    });
    window.addEventListener("resize", updateIndicator);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", updateIndicator);
    };
  }, [updateIndicator]);

  return (
    <TabsPrimitive.List
      ref={listRef}
      data-slot="tabs-list"
      className={cn(
        "bg-muted text-muted-foreground relative inline-flex h-10 w-fit items-center justify-center rounded-xl p-1 gap-0.5",
        className
      )}
      {...props}
    >
      {/* Sliding indicator */}
      <span
        aria-hidden="true"
        className="absolute top-1 bottom-1 rounded-lg bg-background shadow-sm transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] dark:bg-input/30"
        style={indicatorStyle}
      />
      {children}
    </TabsPrimitive.List>
  );
}

function TabsTrigger({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Trigger>) {
  return (
    <TabsPrimitive.Trigger
      data-slot="tabs-trigger"
      className={cn(
        "relative z-[1] inline-flex h-[calc(100%-2px)] flex-1 items-center justify-center gap-1.5 rounded-lg bg-transparent px-3 py-1.5 text-sm font-medium whitespace-nowrap transition-colors duration-200 ease-out text-muted-foreground hover:text-foreground/80 data-[state=active]:text-foreground dark:data-[state=active]:text-foreground focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:outline-ring focus-visible:ring-[3px] focus-visible:outline-1 disabled:pointer-events-none disabled:opacity-50 border border-transparent [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        className
      )}
      {...props}
    />
  );
}

function TabsContent({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Content>) {
  return (
    <TabsPrimitive.Content
      data-slot="tabs-content"
      className={cn("flex-1 outline-none animate-fade-in-up", className)}
      {...props}
    />
  );
}

export { Tabs, TabsList, TabsTrigger, TabsContent };
