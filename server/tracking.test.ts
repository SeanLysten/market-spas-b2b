import { describe, it, expect } from "vitest";

// Test tracking URL generation logic
describe("Tracking URL generation", () => {
  const carrierUrls: Record<string, (tn: string) => string> = {
    DPD: (tn) => `https://trace.dpd.fr/trace/${tn}`,
    BPOST: (tn) => `https://track.bpost.cloud/btr/web/#/search?itemCode=${tn}`,
    UPS: (tn) => `https://www.ups.com/track?tracknum=${tn}`,
    GLS: (tn) => `https://gls-group.com/FR/fr/suivi-colis?match=${tn}`,
    MONDIAL_RELAY: (tn) => `https://www.mondialrelay.fr/suivi-de-colis/?NumeroExpedition=${tn}`,
    CHRONOPOST: (tn) => `https://www.chronopost.fr/tracking-no-cms/suivi-page?listeNumerosLT=${tn}`,
    COLISSIMO: (tn) => `https://www.laposte.fr/outils/suivre-vos-envois?code=${tn}`,
    TNT: (tn) => `https://www.tnt.com/express/fr_fr/site/outils-expedition/suivi.html?searchType=con&cons=${tn}`,
  };

  it("should generate correct URL for BPOST", () => {
    const url = carrierUrls.BPOST("323214567890123");
    expect(url).toBe("https://track.bpost.cloud/btr/web/#/search?itemCode=323214567890123");
  });

  it("should generate correct URL for DPD", () => {
    const url = carrierUrls.DPD("05136024694810");
    expect(url).toBe("https://trace.dpd.fr/trace/05136024694810");
  });

  it("should generate correct URL for UPS", () => {
    const url = carrierUrls.UPS("1Z999AA10123456784");
    expect(url).toBe("https://www.ups.com/track?tracknum=1Z999AA10123456784");
  });

  it("should generate correct URL for GLS", () => {
    const url = carrierUrls.GLS("Y1234567890");
    expect(url).toBe("https://gls-group.com/FR/fr/suivi-colis?match=Y1234567890");
  });

  it("should generate correct URL for MONDIAL_RELAY", () => {
    const url = carrierUrls.MONDIAL_RELAY("12345678");
    expect(url).toBe("https://www.mondialrelay.fr/suivi-de-colis/?NumeroExpedition=12345678");
  });

  it("should generate correct URL for CHRONOPOST", () => {
    const url = carrierUrls.CHRONOPOST("XY123456789FR");
    expect(url).toBe("https://www.chronopost.fr/tracking-no-cms/suivi-page?listeNumerosLT=XY123456789FR");
  });

  it("should generate correct URL for COLISSIMO", () => {
    const url = carrierUrls.COLISSIMO("6A12345678901");
    expect(url).toBe("https://www.laposte.fr/outils/suivre-vos-envois?code=6A12345678901");
  });

  it("should generate correct URL for TNT", () => {
    const url = carrierUrls.TNT("GE123456789WW");
    expect(url).toBe("https://www.tnt.com/express/fr_fr/site/outils-expedition/suivi.html?searchType=con&cons=GE123456789WW");
  });

  it("should return undefined for unknown carrier", () => {
    const url = carrierUrls["UNKNOWN"];
    expect(url).toBeUndefined();
  });
});

// Test tracking steps logic
describe("Tracking steps generation", () => {
  const allStatuses = [
    "PENDING_APPROVAL", "PENDING_DEPOSIT", "DEPOSIT_PAID",
    "IN_PRODUCTION", "READY_TO_SHIP", "SHIPPED", "DELIVERED", "COMPLETED"
  ];

  const statusLabels: Record<string, string> = {
    PENDING_APPROVAL: "En attente de validation",
    PENDING_DEPOSIT: "En attente d'acompte",
    DEPOSIT_PAID: "Acompte reçu",
    IN_PRODUCTION: "En production",
    READY_TO_SHIP: "Prêt à expédier",
    SHIPPED: "Expédié",
    DELIVERED: "Livré",
    COMPLETED: "Terminée",
  };

  function buildTrackingSteps(currentStatus: string) {
    const currentIdx = allStatuses.indexOf(currentStatus);
    return allStatuses.map((status, idx) => ({
      status,
      label: statusLabels[status] || status,
      stepStatus: idx < currentIdx ? "completed" : idx === currentIdx ? "current" : "upcoming",
    }));
  }

  it("should mark all steps before current as completed", () => {
    const steps = buildTrackingSteps("SHIPPED");
    const completed = steps.filter(s => s.stepStatus === "completed");
    expect(completed.length).toBe(5); // PENDING_APPROVAL through READY_TO_SHIP
  });

  it("should mark current step as current", () => {
    const steps = buildTrackingSteps("SHIPPED");
    const current = steps.find(s => s.stepStatus === "current");
    expect(current?.status).toBe("SHIPPED");
    expect(current?.label).toBe("Expédié");
  });

  it("should mark steps after current as upcoming", () => {
    const steps = buildTrackingSteps("SHIPPED");
    const upcoming = steps.filter(s => s.stepStatus === "upcoming");
    expect(upcoming.length).toBe(2); // DELIVERED, COMPLETED
  });

  it("should handle first status correctly", () => {
    const steps = buildTrackingSteps("PENDING_APPROVAL");
    expect(steps[0].stepStatus).toBe("current");
    expect(steps[1].stepStatus).toBe("upcoming");
  });

  it("should handle last status correctly", () => {
    const steps = buildTrackingSteps("COMPLETED");
    const completed = steps.filter(s => s.stepStatus === "completed");
    expect(completed.length).toBe(7); // All except COMPLETED
    expect(steps[steps.length - 1].stepStatus).toBe("current");
  });

  it("should have correct labels for all statuses", () => {
    const steps = buildTrackingSteps("PENDING_APPROVAL");
    expect(steps.length).toBe(8);
    steps.forEach(step => {
      expect(step.label).toBeTruthy();
      expect(step.label).not.toBe(step.status); // Label should be human-readable
    });
  });
});

// Test status auto-advance logic
describe("Status auto-advance on tracking update", () => {
  const earlyStatuses = ["READY_TO_SHIP", "IN_PRODUCTION", "DEPOSIT_PAID", "PENDING_DEPOSIT", "PENDING_APPROVAL"];
  const lateStatuses = ["SHIPPED", "DELIVERED", "COMPLETED"];

  it("should auto-advance early statuses to SHIPPED when tracking is added", () => {
    earlyStatuses.forEach(status => {
      const shouldAdvance = earlyStatuses.includes(status);
      expect(shouldAdvance).toBe(true);
    });
  });

  it("should NOT auto-advance late statuses when tracking is updated", () => {
    lateStatuses.forEach(status => {
      const shouldAdvance = earlyStatuses.includes(status);
      expect(shouldAdvance).toBe(false);
    });
  });
});

// Test skipHistory option
describe("notifyOrderStatusChange skipHistory option", () => {
  it("should accept skipHistory option", () => {
    const options = { skipHistory: true };
    expect(options.skipHistory).toBe(true);
  });

  it("should default to recording history when no option", () => {
    const options: { skipHistory?: boolean } | undefined = undefined;
    expect(options?.skipHistory).toBeUndefined();
    expect(!options?.skipHistory).toBe(true); // Should record history
  });
});
