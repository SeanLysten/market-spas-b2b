import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Search, AlertCircle, Clock, CheckCircle, XCircle, Package, ArrowLeft, ArrowUpDown, ArrowUp, ArrowDown, RotateCcw, Shield, ShieldAlert, ShieldCheck, ShieldX, Truck, CreditCard, Info, ChevronRight, ChevronLeft, Upload, Wrench, Eye, BarChart3, Timer, CircleDot } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import AfterSalesDetail from "@/components/AfterSalesDetail";

// ===== BRAND LABELS =====
const BRAND_LABELS: Record<string, string> = {
  MARKET_SPAS: "Market Spas",
  WELLIS_CLASSIC: "Wellis Classic",
  WELLIS_LIFE: "Wellis Life",
  WELLIS_WIBES: "Wellis Wibes",
  PASSION_SPAS: "Passion Spas",
  PLATINUM_SPAS: "Platinum Spas",
};

const BRANDS = Object.keys(BRAND_LABELS);

// ===== STATUS CONFIG =====
const STATUS_CONFIG: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline"; icon: any; color?: string }> = {
  NEW: { label: "Nouveau", variant: "default", icon: AlertCircle },
  ANALYZING: { label: "En analyse", variant: "default", icon: Eye, color: "bg-blue-500" },
  INFO_REQUIRED: { label: "Infos requises", variant: "secondary", icon: Info, color: "bg-amber-500 dark:bg-amber-400" },
  QUOTE_PENDING: { label: "Devis en attente", variant: "secondary", icon: CreditCard },
  PAYMENT_PENDING: { label: "Paiement en attente", variant: "destructive", icon: CreditCard },
  PAYMENT_CONFIRMED: { label: "Paiement confirmé", variant: "default", icon: CheckCircle, color: "bg-emerald-500 dark:bg-emerald-400" },
  PARTS_ORDERED: { label: "Pièces commandées", variant: "secondary", icon: Package },
  SHIPPED: { label: "Expédié", variant: "default", icon: Truck, color: "bg-indigo-500" },
  RESOLVED: { label: "Résolu", variant: "outline", icon: CheckCircle },
  CLOSED: { label: "Fermé", variant: "outline", icon: XCircle },
};

const WARRANTY_STATUS_CONFIG: Record<string, { label: string; icon: any; color: string }> = {
  COVERED: { label: "Sous garantie", icon: ShieldCheck, color: "text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 dark:bg-emerald-500/20 border-emerald-500/20 dark:border-emerald-500/30" },
  PARTIAL: { label: "Garantie partielle", icon: Shield, color: "text-yellow-600 bg-amber-500/10 dark:bg-amber-500/20 border-amber-500/20 dark:border-amber-500/30" },
  EXPIRED: { label: "Garantie expirée", icon: ShieldX, color: "text-destructive dark:text-destructive bg-destructive/10 dark:bg-destructive/20 border-destructive/20 dark:border-destructive/30" },
  EXCLUDED: { label: "Hors garantie", icon: ShieldAlert, color: "text-destructive dark:text-destructive bg-destructive/10 dark:bg-destructive/20 border-destructive/20 dark:border-destructive/30" },
  REVIEW_NEEDED: { label: "Analyse requise", icon: Info, color: "text-info dark:text-info-dark bg-info/10 dark:bg-info-light border-info/20 dark:border-info/30" },
};

// ===== STEPPER FORM =====
type FormStep = 1 | 2 | 3 | 4 | 5;

interface SavFormData {
  brand: string;
  productLine: string;
  modelName: string;
  serialNumber: string;
  component: string;
  defectType: string;
  issueType: string;
  description: string;
  urgency: "NORMAL" | "URGENT" | "CRITICAL";
  purchaseDate: string;
  deliveryDate: string;
  usageType: "PRIVATE" | "COMMERCIAL" | "HOLIDAY_LET";
  isOriginalBuyer: boolean;
  isModified: boolean;
  isMaintenanceConform: boolean;
  isChemistryConform: boolean;
  usesHydrogenPeroxide: boolean;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  customerAddress: string;
  installationDate: string;
}

const initialFormData: SavFormData = {
  brand: "",
  productLine: "",
  modelName: "",
  serialNumber: "",
  component: "",
  defectType: "",
  issueType: "",
  description: "",
  urgency: "NORMAL",
  purchaseDate: "",
  deliveryDate: "",
  usageType: "PRIVATE",
  isOriginalBuyer: true,
  isModified: false,
  isMaintenanceConform: true,
  isChemistryConform: true,
  usesHydrogenPeroxide: false,
  customerName: "",
  customerPhone: "",
  customerEmail: "",
  customerAddress: "",
  installationDate: "",
};

const ADMIN_ROLES = ["SUPER_ADMIN", "ADMIN", "SALES_MANAGER"];

function isAdminUser(user: any): boolean {
  return user && ADMIN_ROLES.includes(user.role);
}

// ===== SAV DASHBOARD SUMMARY =====
interface SavStats {
  total: number;
  open: number;
  actionRequired: number;
  quotePending: number;
  inProgress: number;
  shipped: number;
  resolved: number;
  urgentOrCritical: number;
}

function computeSavStats(services: any[]): SavStats {
  const stats: SavStats = {
    total: 0,
    open: 0,
    actionRequired: 0,
    quotePending: 0,
    inProgress: 0,
    shipped: 0,
    resolved: 0,
    urgentOrCritical: 0,
  };
  if (!services) return stats;
  stats.total = services.length;
  for (const item of services) {
    const s = item.service;
    const status = s.status;
    if (status === "NEW" || status === "ANALYZING") stats.open++;
    if (status === "INFO_REQUIRED") stats.actionRequired++;
    if (status === "QUOTE_PENDING") stats.quotePending++;
    if (status === "PAYMENT_CONFIRMED" || status === "WAITING_PARTS" || status === "PREPARING" || status === "IN_PROGRESS") stats.inProgress++;
    if (status === "SHIPPED") stats.shipped++;
    if (status === "RESOLVED" || status === "CLOSED") stats.resolved++;
    if (s.urgency === "URGENT" || s.urgency === "CRITICAL") stats.urgentOrCritical++;
  }
  return stats;
}

function SavDashboard({ services, isLoading, onFilterClick }: {
  services: any[];
  isLoading: boolean;
  onFilterClick: (status: string) => void;
}) {
  const stats = computeSavStats(services);

  const cards = [
    {
      label: "Total tickets",
      value: stats.total,
      icon: BarChart3,
      color: "text-slate-700",
      bg: "bg-slate-50 border-slate-200",
      filterValue: "all",
    },
    {
      label: "Ouverts",
      value: stats.open,
      icon: CircleDot,
      color: "text-info dark:text-info-dark",
      bg: "bg-info/10 dark:bg-info-light border-info/20 dark:border-info/30",
      filterValue: "NEW",
    },
    {
      label: "Action requise",
      value: stats.actionRequired,
      icon: AlertCircle,
      color: "text-yellow-600",
      bg: "bg-amber-500/10 dark:bg-amber-500/20 border-amber-500/20 dark:border-amber-500/30",
      filterValue: "INFO_REQUIRED",
    },
    {
      label: "Devis en attente",
      value: stats.quotePending,
      icon: CreditCard,
      color: "text-orange-600 dark:text-orange-400",
      bg: "bg-orange-500/10 dark:bg-orange-500/20 border-orange-500/20 dark:border-orange-500/30",
      filterValue: "QUOTE_PENDING",
    },
    {
      label: "En cours",
      value: stats.inProgress,
      icon: Timer,
      color: "text-purple-600 dark:text-purple-400",
      bg: "bg-purple-500/10 dark:bg-purple-500/20 border-purple-500/20 dark:border-purple-500/30",
      filterValue: "PAYMENT_CONFIRMED",
    },
    {
      label: "Expédiés",
      value: stats.shipped,
      icon: Truck,
      color: "text-indigo-600",
      bg: "bg-indigo-500/10 dark:bg-indigo-500/20 border-indigo-200",
      filterValue: "SHIPPED",
    },
    {
      label: "Résolus",
      value: stats.resolved,
      icon: CheckCircle,
      color: "text-emerald-600 dark:text-emerald-400",
      bg: "bg-emerald-500/10 dark:bg-emerald-500/20 border-emerald-500/20 dark:border-emerald-500/30",
      filterValue: "RESOLVED",
    },
  ];

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3 mb-6">
        {cards.map((_, i) => (
          <div key={i} className="h-24 rounded-lg border bg-muted/30 animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3 mb-6">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <button
            key={card.label}
            onClick={() => onFilterClick(card.filterValue)}
            className={`relative flex flex-col items-center justify-center p-3 rounded-lg border transition-all hover:shadow-md hover:scale-[1.02] active:scale-[0.98] ${card.bg}`}
          >
            <Icon className={`h-5 w-5 mb-1 ${card.color}`} />
            <span className={`text-2xl font-bold ${card.color}`}>{card.value}</span>
            <span className="text-xs text-muted-foreground text-center leading-tight mt-0.5">{card.label}</span>
            {card.filterValue !== "all" && card.value > 0 && (
              <span className={`absolute top-1.5 right-1.5 w-2 h-2 rounded-full ${card.color.replace("text-", "bg-")} opacity-60`} />
            )}
          </button>
        );
      })}
      {stats.urgentOrCritical > 0 && (
        <div className="col-span-full">
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-destructive/10 dark:bg-destructive/20 border border-destructive/20 dark:border-destructive/30 text-destructive dark:text-destructive text-sm">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            <span><strong>{stats.urgentOrCritical}</strong> ticket{stats.urgentOrCritical > 1 ? "s" : ""} urgent{stats.urgentOrCritical > 1 ? "s" : ""} ou critique{stats.urgentOrCritical > 1 ? "s" : ""}</span>
          </div>
        </div>
      )}
    </div>
  );
}

function CreateSavDialog({ open, onOpenChange, onSuccess, user, partners }: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  user: any;
  partners: any[];
}) {
  const [step, setStep] = useState<FormStep>(1);
  const [formData, setFormData] = useState<SavFormData>(initialFormData);
  const [mediaFiles, setMediaFiles] = useState<Array<{ file: File; type: "IMAGE" | "VIDEO"; preview: string }>>([]);
  const [selectedPartnerId, setSelectedPartnerId] = useState<number | null>(null);
  const [warrantyPreview, setWarrantyPreview] = useState<any>(null);

  // Dynamic data queries
  const { data: components } = trpc.afterSales.getComponentsByBrand.useQuery(
    { brand: formData.brand },
    { enabled: !!formData.brand }
  );
  const { data: defectTypes } = trpc.afterSales.getDefectTypesByComponent.useQuery(
    { component: formData.component },
    { enabled: !!formData.component }
  );
  const { data: productLines } = trpc.afterSales.getProductLinesByBrand.useQuery(
    { brand: formData.brand },
    { enabled: !!formData.brand }
  );

  // Warranty preview
  const { data: warrantyAnalysis } = trpc.afterSales.analyzeWarranty.useQuery(
    {
      brand: formData.brand,
      productLine: formData.productLine || undefined,
      component: formData.component,
      defectType: formData.defectType,
      purchaseDate: formData.purchaseDate,
      deliveryDate: formData.deliveryDate,
      usageType: formData.usageType,
      isOriginalBuyer: formData.isOriginalBuyer,
      isModified: formData.isModified,
      isMaintenanceConform: formData.isMaintenanceConform,
      isChemistryConform: formData.isChemistryConform,
      usesHydrogenPeroxide: formData.usesHydrogenPeroxide,
    },
    {
      enabled: !!formData.brand && !!formData.component && !!formData.defectType && !!formData.purchaseDate && !!formData.deliveryDate && step >= 4,
    }
  );

  const createMutation = trpc.afterSales.create.useMutation({
    onSuccess: () => {
      alert("Demande SAV créée avec succès !");
      resetForm();
      onOpenChange(false);
      onSuccess();
    },
    onError: (error) => {
      alert(`Erreur: ${error.message}`);
    },
  });

  const resetForm = () => {
    setFormData(initialFormData);
    setMediaFiles([]);
    setStep(1);
    setSelectedPartnerId(null);
    setWarrantyPreview(null);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const newMedia = files.map((file) => ({
      file,
      type: file.type.startsWith("video/") ? ("VIDEO" as const) : ("IMAGE" as const),
      preview: URL.createObjectURL(file),
    }));
    setMediaFiles([...mediaFiles, ...newMedia]);
  };

  const handleSubmit = async () => {
    const mediaPromises = mediaFiles.map(async (media) => {
      return new Promise<{ base64: string; mimeType: string; type: "IMAGE" | "VIDEO" }>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64 = (reader.result as string).split(",")[1];
          resolve({ base64, mimeType: media.file.type, type: media.type });
        };
        reader.readAsDataURL(media.file);
      });
    });

    const mediaData = await Promise.all(mediaPromises);

    createMutation.mutate({
      ...formData,
      media: mediaData.length > 0 ? mediaData : undefined,
      partnerId: selectedPartnerId || undefined,
    });
  };

  const canGoNext = (): boolean => {
    switch (step) {
      case 1: return !!formData.brand && !!formData.serialNumber;
      case 2: return !!formData.component && !!formData.defectType;
      case 3: return !!formData.purchaseDate && !!formData.deliveryDate;
      case 4: return mediaFiles.length >= 2;
      case 5: return !!formData.description;
      default: return false;
    }
  };

  const stepTitles = [
    "Identification du produit",
    "Diagnostic du problème",
    "Conditions de garantie",
    "Photos et preuves",
    "Récapitulatif et envoi",
  ];

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) resetForm(); onOpenChange(v); }}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl text-display text-display">Nouvelle demande SAV</DialogTitle>
        </DialogHeader>

        {/* Stepper */}
        <div className="flex items-center justify-between mb-6 px-4">
          {stepTitles.map((title, i) => (
            <div key={i} className="flex items-center">
              <div className={`flex flex-col items-center ${i + 1 <= step ? "text-primary" : "text-muted-foreground"}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border-2 ${
                  i + 1 < step ? "bg-primary text-white border-primary" :
                  i + 1 === step ? "border-primary text-primary" :
                  "border-muted text-muted-foreground"
                }`}>
                  {i + 1 < step ? "✓" : i + 1}
                </div>
                <span className="text-xs mt-1 text-center max-w-[80px]">{title}</span>
              </div>
              {i < stepTitles.length - 1 && (
                <div className={`h-0.5 w-8 mx-1 mt-[-16px] ${i + 1 < step ? "bg-primary" : "bg-muted"}`} />
              )}
            </div>
          ))}
        </div>

        {/* Step 1: Product Identification */}
        {step === 1 && (
          <div className="space-y-4">
            <h3 className="font-semibold text-lg flex items-center gap-2">
              <Wrench className="h-5 w-5" />
              Identification du produit
            </h3>

            {/* Sélection partenaire uniquement pour les admins */}
            {isAdminUser(user) && !user?.partnerId && partners && partners.length > 0 && (
              <div className="space-y-2">
                <Label>Partenaire *</Label>
                <Select value={selectedPartnerId?.toString() || ""} onValueChange={(v) => setSelectedPartnerId(parseInt(v))}>
                  <SelectTrigger><SelectValue placeholder="Sélectionnez un partenaire" /></SelectTrigger>
                  <SelectContent>
                    {partners.map((p: any) => (
                      <SelectItem key={p.id} value={p.id.toString()}>{p.companyName}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Marque *</Label>
                <Select value={formData.brand} onValueChange={(v) => setFormData({ ...formData, brand: v, productLine: "", component: "", defectType: "" })}>
                  <SelectTrigger><SelectValue placeholder="Sélectionnez la marque" /></SelectTrigger>
                  <SelectContent>
                    {BRANDS.map((b) => (
                      <SelectItem key={b} value={b}>{BRAND_LABELS[b]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {productLines && productLines.length > 0 && (
                <div className="space-y-2">
                  <Label>Gamme</Label>
                  <Select value={formData.productLine} onValueChange={(v) => setFormData({ ...formData, productLine: v })}>
                    <SelectTrigger><SelectValue placeholder="Sélectionnez la gamme" /></SelectTrigger>
                    <SelectContent>
                      {productLines.map((pl: string) => (
                        <SelectItem key={pl} value={pl}>{pl}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Modèle</Label>
                <Input
                  placeholder="Ex: MyLine Saturn, Wellis Pluto..."
                  value={formData.modelName}
                  onChange={(e) => setFormData({ ...formData, modelName: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Numéro de série *</Label>
                <Input
                  placeholder="Numéro de série du spa"
                  value={formData.serialNumber}
                  onChange={(e) => setFormData({ ...formData, serialNumber: e.target.value })}
                  required
                />
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Problem Diagnosis */}
        {step === 2 && (
          <div className="space-y-4">
            <h3 className="font-semibold text-lg flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              Diagnostic du problème
            </h3>

            <div className="space-y-2">
              <Label>Composant défectueux *</Label>
              <Select value={formData.component} onValueChange={(v) => setFormData({ ...formData, component: v, defectType: "" })}>
                <SelectTrigger><SelectValue placeholder="Sélectionnez le composant" /></SelectTrigger>
                <SelectContent>
                  {(components || []).map((c: string) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {formData.component && (
              <div className="space-y-2">
                <Label>Type de défaut *</Label>
                <Select value={formData.defectType} onValueChange={(v) => setFormData({ ...formData, defectType: v, issueType: v })}>
                  <SelectTrigger><SelectValue placeholder="Sélectionnez le type de défaut" /></SelectTrigger>
                  <SelectContent>
                    {(defectTypes || []).map((d: string) => (
                      <SelectItem key={d} value={d}>{d}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-2">
              <Label>Urgence</Label>
              <Select value={formData.urgency} onValueChange={(v: any) => setFormData({ ...formData, urgency: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="NORMAL">Normale</SelectItem>
                  <SelectItem value="URGENT">Urgente</SelectItem>
                  <SelectItem value="CRITICAL">Critique</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Description détaillée du problème *</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Décrivez le problème en détail : quand est-il apparu, dans quelles circonstances, symptômes observés..."
                rows={4}
              />
            </div>
          </div>
        )}

        {/* Step 3: Warranty Conditions */}
        {step === 3 && (
          <div className="space-y-4">
            <h3 className="font-semibold text-lg flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Conditions de garantie
            </h3>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Date d'achat *</Label>
                <Input type="date" value={formData.purchaseDate} onChange={(e) => setFormData({ ...formData, purchaseDate: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Date de livraison *</Label>
                <Input type="date" value={formData.deliveryDate} onChange={(e) => setFormData({ ...formData, deliveryDate: e.target.value })} />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Type d'usage</Label>
              <Select value={formData.usageType} onValueChange={(v: any) => setFormData({ ...formData, usageType: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="PRIVATE">Usage privé (résidentiel)</SelectItem>
                  <SelectItem value="COMMERCIAL">Usage commercial (hôtel, camping...)</SelectItem>
                  <SelectItem value="HOLIDAY_LET">Location saisonnière (Holiday Let)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3 border rounded-lg p-4 bg-muted/30">
              <h4 className="font-medium">Vérifications obligatoires</h4>

              <div className="flex items-center gap-3">
                <Checkbox id="isOriginalBuyer" checked={formData.isOriginalBuyer} onCheckedChange={(v) => setFormData({ ...formData, isOriginalBuyer: !!v })} />
                <Label htmlFor="isOriginalBuyer" className="cursor-pointer">Le client est l'acheteur initial du spa</Label>
              </div>

              <div className="flex items-center gap-3">
                <Checkbox id="isMaintenanceConform" checked={formData.isMaintenanceConform} onCheckedChange={(v) => setFormData({ ...formData, isMaintenanceConform: !!v })} />
                <Label htmlFor="isMaintenanceConform" className="cursor-pointer">L'entretien est conforme aux recommandations du fabricant</Label>
              </div>

              <div className="flex items-center gap-3">
                <Checkbox id="isChemistryConform" checked={formData.isChemistryConform} onCheckedChange={(v) => setFormData({ ...formData, isChemistryConform: !!v })} />
                <Label htmlFor="isChemistryConform" className="cursor-pointer">Les produits chimiques utilisés sont conformes</Label>
              </div>

              <div className="flex items-center gap-3">
                <Checkbox id="isModified" checked={formData.isModified} onCheckedChange={(v) => setFormData({ ...formData, isModified: !!v })} />
                <Label htmlFor="isModified" className="cursor-pointer text-destructive dark:text-destructive">Le spa a été modifié sans autorisation du fabricant</Label>
              </div>

              {formData.brand === "PLATINUM_SPAS" && (
                <div className="flex items-center gap-3">
                  <Checkbox id="usesHydrogenPeroxide" checked={formData.usesHydrogenPeroxide} onCheckedChange={(v) => setFormData({ ...formData, usesHydrogenPeroxide: !!v })} />
                  <Label htmlFor="usesHydrogenPeroxide" className="cursor-pointer text-destructive dark:text-destructive">Le client utilise du peroxyde d'hydrogène</Label>
                </div>
              )}
            </div>

            {/* Customer info */}
            <div className="border-t pt-4">
              <h4 className="font-medium mb-3">Informations du client final</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Nom du client</Label>
                  <Input value={formData.customerName} onChange={(e) => setFormData({ ...formData, customerName: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Téléphone</Label>
                  <Input value={formData.customerPhone} onChange={(e) => setFormData({ ...formData, customerPhone: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input type="email" value={formData.customerEmail} onChange={(e) => setFormData({ ...formData, customerEmail: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Date d'installation</Label>
                  <Input type="date" value={formData.installationDate} onChange={(e) => setFormData({ ...formData, installationDate: e.target.value })} />
                </div>
              </div>
              <div className="space-y-2 mt-4">
                <Label>Adresse</Label>
                <Textarea value={formData.customerAddress} onChange={(e) => setFormData({ ...formData, customerAddress: e.target.value })} rows={2} />
              </div>
            </div>
          </div>
        )}

        {/* Step 4: Photos */}
        {step === 4 && (
          <div className="space-y-4">
            <h3 className="font-semibold text-lg flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Photos et preuves
            </h3>

            <div className="border-2 border-dashed rounded-lg p-6 text-center bg-muted/30">
              <Upload className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
              <p className="text-sm text-muted-foreground mb-2">
                Ajoutez au minimum <strong>2 photos</strong> du problème
              </p>
              <p className="text-xs text-muted-foreground mb-4">
                Photos claires du défaut, de l'étiquette du spa (numéro de série), et de l'environnement
              </p>
              <Input type="file" accept="image/*,video/*" multiple onChange={handleFileUpload} className="max-w-xs mx-auto" />
            </div>

            {mediaFiles.length > 0 && (
              <div className="grid grid-cols-4 gap-3">
                {mediaFiles.map((media, index) => (
                  <div key={index} className="relative group">
                    {media.type === "IMAGE" ? (
                      <img src={media.preview} alt="Preview" className="w-full h-24 object-cover rounded border" />
                    ) : (
                      <video src={media.preview} className="w-full h-24 object-cover rounded border" />
                    )}
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      className="absolute top-1 right-1 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => setMediaFiles(mediaFiles.filter((_, i) => i !== index))}
                    >
                      ×
                    </Button>
                  </div>
                ))}
              </div>
            )}

            {mediaFiles.length < 2 && (
              <p className="text-sm text-red-500 flex items-center gap-1">
                <AlertCircle className="h-4 w-4" />
                Minimum 2 photos requises ({mediaFiles.length}/2)
              </p>
            )}
          </div>
        )}

        {/* Step 5: Summary & Submit */}
        {step === 5 && (
          <div className="space-y-4">
            <h3 className="font-semibold text-lg flex items-center gap-2">
              <CheckCircle className="h-5 w-5" />
              Récapitulatif
            </h3>

            {/* Warranty Preview */}
            {warrantyAnalysis && (
              <div className={`border rounded-lg p-4 ${WARRANTY_STATUS_CONFIG[warrantyAnalysis.status]?.color || ""}`}>
                <div className="flex items-center gap-2 mb-2">
                  {(() => {
                    const config = WARRANTY_STATUS_CONFIG[warrantyAnalysis.status];
                    const Icon = config?.icon || Info;
                    return <Icon className="h-5 w-5" />;
                  })()}
                  <span className="font-semibold text-lg">
                    Pré-analyse de garantie : {WARRANTY_STATUS_CONFIG[warrantyAnalysis.status]?.label || warrantyAnalysis.status}
                  </span>
                  {warrantyAnalysis.percentage > 0 && warrantyAnalysis.percentage < 100 && (
                    <Badge variant="secondary">{warrantyAnalysis.percentage}% couvert</Badge>
                  )}
                </div>
                <p className="text-sm">{warrantyAnalysis.details}</p>
                {warrantyAnalysis.warnings?.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {warrantyAnalysis.warnings.map((w: string, i: number) => (
                      <p key={i} className="text-xs flex items-center gap-1">
                        <AlertCircle className="h-3 w-3 flex-shrink-0" /> {w}
                      </p>
                    ))}
                  </div>
                )}
                <p className="text-xs mt-2 italic">
                  Cette pré-analyse sera vérifiée par un administrateur après examen des photos.
                </p>
              </div>
            )}

            {/* Summary */}
            <Card>
              <CardContent className="pt-6 space-y-3 text-sm">
                <div className="grid grid-cols-2 gap-x-8 gap-y-2">
                  <div><strong>Marque :</strong> {BRAND_LABELS[formData.brand] || formData.brand}</div>
                  {formData.productLine && <div><strong>Gamme :</strong> {formData.productLine}</div>}
                  {formData.modelName && <div><strong>Modèle :</strong> {formData.modelName}</div>}
                  <div><strong>N° de série :</strong> {formData.serialNumber}</div>
                  <div><strong>Composant :</strong> {formData.component}</div>
                  <div><strong>Défaut :</strong> {formData.defectType}</div>
                  <div><strong>Date d'achat :</strong> {formData.purchaseDate ? new Date(formData.purchaseDate).toLocaleDateString("fr-FR") : "-"}</div>
                  <div><strong>Date de livraison :</strong> {formData.deliveryDate ? new Date(formData.deliveryDate).toLocaleDateString("fr-FR") : "-"}</div>
                  <div><strong>Usage :</strong> {formData.usageType === "PRIVATE" ? "Privé" : formData.usageType === "COMMERCIAL" ? "Commercial" : "Location saisonnière"}</div>
                  <div><strong>Urgence :</strong> {formData.urgency === "CRITICAL" ? "Critique" : formData.urgency === "URGENT" ? "Urgente" : "Normale"}</div>
                </div>
                <div className="border-t pt-2">
                  <strong>Description :</strong>
                  <p className="mt-1 text-muted-foreground">{formData.description}</p>
                </div>
                {formData.customerName && (
                  <div className="border-t pt-2">
                    <strong>Client :</strong> {formData.customerName}
                    {formData.customerPhone && ` • ${formData.customerPhone}`}
                    {formData.customerEmail && ` • ${formData.customerEmail}`}
                  </div>
                )}
                <div className="border-t pt-2">
                  <strong>Photos :</strong> {mediaFiles.length} fichier(s) joint(s)
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Navigation */}
        <div className="flex justify-between pt-4 border-t">
          <Button variant="outline" onClick={() => step > 1 ? setStep((step - 1) as FormStep) : onOpenChange(false)}>
            <ChevronLeft className="mr-1 h-4 w-4" />
            {step === 1 ? "Annuler" : "Précédent"}
          </Button>

          {step < 5 ? (
            <Button onClick={() => setStep((step + 1) as FormStep)} disabled={!canGoNext()}>
              Suivant
              <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          ) : (
            <Button onClick={handleSubmit} disabled={createMutation.isPending || !formData.description}>
              {createMutation.isPending ? "Envoi en cours..." : "Envoyer la demande SAV"}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ===== MAIN PAGE =====
export default function AfterSales() {
  const { data: user } = trpc.auth.me.useQuery();
  // Only load partners list for admins (partners don't need to select a partner)
  const isAdmin = isAdminUser(user);
  const { data: partners } = trpc.partners.list.useQuery({}, { enabled: isAdmin });

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [urgencyFilter, setUrgencyFilter] = useState<string>("all");
  const [warrantyFilter, setWarrantyFilter] = useState<string>("all");
  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo] = useState<string>("");
  const [customerNameFilter, setCustomerNameFilter] = useState<string>("");
  const [orderBy, setOrderBy] = useState<string>("createdAt");
  const [orderDirection, setOrderDirection] = useState<"asc" | "desc">("desc");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedServiceId, setSelectedServiceId] = useState<number | null>(null);

  const handleSort = (column: string) => {
    if (orderBy === column) {
      setOrderDirection(orderDirection === "asc" ? "desc" : "asc");
    } else {
      setOrderBy(column);
      setOrderDirection("desc");
    }
  };

  const handleResetFilters = () => {
    setSearchQuery("");
    setStatusFilter("all");
    setUrgencyFilter("all");
    setWarrantyFilter("all");
    setDateFrom("");
    setDateTo("");
    setCustomerNameFilter("");
    setOrderBy("createdAt");
    setOrderDirection("desc");
  };

  // Unfiltered query for dashboard stats (always shows total counts)
  const { data: allServices, isLoading: isLoadingAll } = trpc.afterSales.list.useQuery({});

  const { data: services, isLoading, refetch } = trpc.afterSales.list.useQuery({
    status: statusFilter !== "all" ? statusFilter : undefined,
    urgency: urgencyFilter !== "all" ? urgencyFilter : undefined,
    warrantyStatus: warrantyFilter !== "all" ? warrantyFilter : undefined,
    dateFrom: dateFrom || undefined,
    dateTo: dateTo || undefined,
    customerName: customerNameFilter || undefined,
    search: searchQuery || undefined,
    orderBy,
    orderDirection,
  });

  const filteredServices = (services || []).filter((s: any) => {
    const service = s.service;
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      service.ticketNumber?.toLowerCase().includes(q) ||
      service.serialNumber?.toLowerCase().includes(q) ||
      service.description?.toLowerCase().includes(q) ||
      service.brand?.toLowerCase().includes(q) ||
      service.modelName?.toLowerCase().includes(q) ||
      service.customerName?.toLowerCase().includes(q)
    );
  });

  const getStatusBadge = (status: string) => {
    const config = STATUS_CONFIG[status] || STATUS_CONFIG.NEW;
    const Icon = config.icon;
    return (
      <Badge variant={config.variant} className={`gap-1 ${config.color || ""}`}>
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  const getWarrantyBadge = (warrantyStatus: string | null) => {
    if (!warrantyStatus) return null;
    const config = WARRANTY_STATUS_CONFIG[warrantyStatus];
    if (!config) return null;
    const Icon = config.icon;
    return (
      <Badge variant="outline" className={`gap-1 ${config.color}`}>
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  const getUrgencyBadge = (urgency: string) => {
    if (urgency === "CRITICAL") return <Badge variant="destructive">Critique</Badge>;
    if (urgency === "URGENT") return <Badge className="bg-orange-500 text-white">Urgent</Badge>;
    return <Badge variant="secondary">Normal</Badge>;
  };

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <Link href="/dashboard">
            <Button variant="outline" size="icon"><ArrowLeft className="h-4 w-4" /></Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">Service Après-Vente</h1>
            <p className="text-muted-foreground">Gérez vos demandes de SAV avec analyse de garantie automatique</p>
          </div>
        </div>

        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Nouvelle demande SAV
        </Button>
      </div>

      {/* Create Dialog */}
      <CreateSavDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        onSuccess={refetch}
        user={user}
        partners={partners || []}
      />

      {/* SAV Dashboard Summary */}
      <SavDashboard
        services={allServices || []}
        isLoading={isLoadingAll}
        onFilterClick={(filterValue) => {
          if (filterValue === "all") {
            setStatusFilter("all");
          } else {
            setStatusFilter(filterValue);
          }
        }}
      />

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div className="flex gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Rechercher par ticket, série, marque, modèle, client..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-48"><SelectValue placeholder="Statut" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les statuts</SelectItem>
                  {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
                    <SelectItem key={key} value={key}>{cfg.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={urgencyFilter} onValueChange={setUrgencyFilter}>
                <SelectTrigger className="w-40"><SelectValue placeholder="Urgence" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes</SelectItem>
                  <SelectItem value="NORMAL">Normale</SelectItem>
                  <SelectItem value="URGENT">Urgente</SelectItem>
                  <SelectItem value="CRITICAL">Critique</SelectItem>
                </SelectContent>
              </Select>

              <Select value={warrantyFilter} onValueChange={setWarrantyFilter}>
                <SelectTrigger className="w-48"><SelectValue placeholder="Garantie" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes garanties</SelectItem>
                  {Object.entries(WARRANTY_STATUS_CONFIG).map(([key, cfg]) => (
                    <SelectItem key={key} value={key}>{cfg.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-4 items-center">
              {isAdmin && (
              <div className="flex-1">
                <Input type="text" placeholder="Nom du client..." value={customerNameFilter} onChange={(e) => setCustomerNameFilter(e.target.value)} />
              </div>
              )}
              {!isAdmin && <div className="flex-1" />}
              <div className="w-48">
                <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
              </div>
              <div className="w-48">
                <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
              </div>
              <Button variant="outline" onClick={handleResetFilters} className="flex items-center gap-2">
                <RotateCcw className="h-4 w-4" /> Réinitialiser
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Sort Headers */}
      {!isLoading && filteredServices.length > 0 && (
        <Card className="mb-4">
          <CardContent className="pt-4 pb-4">
            <div className="flex gap-6 items-center text-sm font-medium">
              {[
                { key: "createdAt", label: "Date" },
                { key: "status", label: "Statut" },
                { key: "urgency", label: "Urgence" },
                { key: "brand", label: "Marque" },
                { key: "warrantyStatus", label: "Garantie" },
              ].map(({ key, label }) => (
                <button key={key} onClick={() => handleSort(key)} className="flex items-center gap-1 hover:text-primary transition-colors">
                  {label}
                  {orderBy === key ? (
                    orderDirection === "asc" ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />
                  ) : (
                    <ArrowUpDown className="h-4 w-4 opacity-50" />
                  )}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* SAV List */}
      {isLoading ? (
        <div className="text-center py-12">Chargement...</div>
      ) : filteredServices.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">Aucune demande de SAV trouvée</p>
            <Button className="mt-4" onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" /> Créer une demande
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredServices.map((item: any) => {
            const service = item.service;
            return (
              <Card key={service.id} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => setSelectedServiceId(service.id)}>
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg flex items-center gap-2">
                        {service.ticketNumber}
                        {service.brand && (
                          <span className="text-sm font-normal text-muted-foreground">
                            {BRAND_LABELS[service.brand] || service.brand}
                            {service.modelName && ` — ${service.modelName}`}
                          </span>
                        )}
                      </CardTitle>
                      <CardDescription>
                        N° série: {service.serialNumber} • Créé le {new Date(service.createdAt).toLocaleDateString("fr-FR")}
                        {service.component && ` • ${service.component}`}
                      </CardDescription>
                    </div>
                    <div className="flex gap-2 flex-wrap justify-end">
                      {getStatusBadge(service.status)}
                      {getUrgencyBadge(service.urgency)}
                      {getWarrantyBadge(service.warrantyStatus)}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground line-clamp-2">{service.description}</p>
                  <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                    {service.customerName && <span>Client: {service.customerName}</span>}
                    {service.defectType && <span>Défaut: {service.defectType}</span>}
                    {service.trackingNumber && (
                      <span className="flex items-center gap-1 text-indigo-600">
                        <Truck className="h-3 w-3" /> Suivi: {service.trackingNumber}
                      </span>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Detail Dialog */}
      {selectedServiceId && (
        <Dialog open={!!selectedServiceId} onOpenChange={() => setSelectedServiceId(null)}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader className="sr-only">
              <DialogTitle>Détail de la demande SAV</DialogTitle>
            </DialogHeader>
            <AfterSalesDetail serviceId={selectedServiceId} onClose={() => setSelectedServiceId(null)} />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
