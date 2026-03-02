import { AdminLayout } from "@/components/AdminLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { toast } from "sonner";
import {
  Plus,
  Calendar,
  Trash2,
  Edit3,
  Eye,
  EyeOff,
  Tag,
  Megaphone,
  GraduationCap,
  Video,
  CalendarDays,
  X,
  Save,
  ChevronDown,
  ChevronUp,
  Search,
  Filter,
} from "lucide-react";

/* ── Types ── */
const EVENT_TYPES = [
  { value: "PROMOTION", label: "Promotion", icon: Tag, color: "bg-orange-100 text-orange-700 border-orange-200" },
  { value: "EVENT", label: "Événement", icon: CalendarDays, color: "bg-blue-100 text-blue-700 border-blue-200" },
  { value: "ANNOUNCEMENT", label: "Annonce", icon: Megaphone, color: "bg-purple-100 text-purple-700 border-purple-200" },
  { value: "TRAINING", label: "Formation", icon: GraduationCap, color: "bg-green-100 text-green-700 border-green-200" },
  { value: "WEBINAR", label: "Webinaire", icon: Video, color: "bg-pink-100 text-pink-700 border-pink-200" },
] as const;

type EventType = (typeof EVENT_TYPES)[number]["value"];

interface EventFormData {
  title: string;
  description: string;
  type: EventType;
  startDate: string;
  endDate: string;
  allDay: boolean;
  discountPercent: string;
  promoCode: string;
  isPublished: boolean;
}

const defaultForm: EventFormData = {
  title: "",
  description: "",
  type: "PROMOTION",
  startDate: "",
  endDate: "",
  allDay: false,
  discountPercent: "",
  promoCode: "",
  isPublished: false,
};

/* ── Helper ── */
function formatDate(d: string | Date) {
  const date = new Date(d);
  return date.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
}

function formatDateInput(d: string | Date) {
  const date = new Date(d);
  return date.toISOString().slice(0, 16);
}

function getTypeInfo(type: string) {
  return EVENT_TYPES.find((t) => t.value === type) || EVENT_TYPES[0];
}

export default function AdminCalendar() {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<EventFormData>(defaultForm);
  const [filterType, setFilterType] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const utils = trpc.useUtils();
  const eventsQuery = trpc.admin.events.list.useQuery(
    filterType !== "all" ? { type: filterType } : undefined
  );
  const createMutation = trpc.admin.events.create.useMutation({
    onSuccess: () => {
      toast.success("Événement créé avec succès");
      utils.admin.events.list.invalidate();
      resetForm();
    },
    onError: (err) => toast.error(err.message),
  });
  const updateMutation = trpc.admin.events.update.useMutation({
    onSuccess: () => {
      toast.success("Événement mis à jour");
      utils.admin.events.list.invalidate();
      resetForm();
    },
    onError: (err) => toast.error(err.message),
  });
  const togglePublishMutation = trpc.admin.events.togglePublish.useMutation({
    onSuccess: () => {
      toast.success("Visibilité modifiée");
      utils.admin.events.list.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });
  const deleteMutation = trpc.admin.events.delete.useMutation({
    onSuccess: () => {
      toast.success("Événement supprimé");
      utils.admin.events.list.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  function resetForm() {
    setForm(defaultForm);
    setShowForm(false);
    setEditingId(null);
  }

  function startEdit(event: any) {
    setForm({
      title: event.title,
      description: event.description || "",
      type: event.type,
      startDate: formatDateInput(event.startDate),
      endDate: event.endDate ? formatDateInput(event.endDate) : "",
      allDay: event.allDay || false,
      discountPercent: event.discountPercent || "",
      promoCode: event.promoCode || "",
      isPublished: event.isPublished || false,
    });
    setEditingId(event.id);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title || !form.startDate) {
      toast.error("Le titre et la date de début sont obligatoires");
      return;
    }

    const payload = {
      title: form.title,
      description: form.description || undefined,
      type: form.type,
      startDate: new Date(form.startDate),
      endDate: form.endDate ? new Date(form.endDate) : undefined,
      allDay: form.allDay,
      discountPercent: form.discountPercent ? parseFloat(form.discountPercent) : undefined,
      promoCode: form.promoCode || undefined,
      isPublished: form.isPublished,
    };

    if (editingId) {
      updateMutation.mutate({ id: editingId, ...payload });
    } else {
      createMutation.mutate(payload);
    }
  }

  const events = (eventsQuery.data || []).filter((e: any) =>
    searchQuery
      ? e.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (e.description || "").toLowerCase().includes(searchQuery.toLowerCase())
      : true
  );

  // Séparer événements à venir et passés
  const now = new Date();
  const upcoming = events.filter((e: any) => new Date(e.startDate) >= now);
  const past = events.filter((e: any) => new Date(e.startDate) < now);

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* ── Header ── */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Calendar className="w-7 h-7 text-primary" />
              Agenda
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              Gérez les événements, promotions et dates importantes visibles par vos partenaires
            </p>
          </div>
          <Button
            onClick={() => {
              if (showForm) resetForm();
              else setShowForm(true);
            }}
            className="gap-2"
          >
            {showForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            {showForm ? "Annuler" : "Nouvel événement"}
          </Button>
        </div>

        {/* ── Formulaire ── */}
        {showForm && (
          <Card className="border-2 border-primary/20">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg">
                {editingId ? "Modifier l'événement" : "Créer un événement"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Titre */}
                <div>
                  <label className="text-sm font-medium mb-1.5 block">Titre *</label>
                  <Input
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    placeholder="Ex: Promotion été -20% sur tous les spas"
                    className="text-base"
                  />
                </div>

                {/* Type */}
                <div>
                  <label className="text-sm font-medium mb-1.5 block">Type d'événement</label>
                  <div className="flex flex-wrap gap-2">
                    {EVENT_TYPES.map((t) => (
                      <button
                        key={t.value}
                        type="button"
                        onClick={() => setForm({ ...form, type: t.value })}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border transition-all ${
                          form.type === t.value
                            ? t.color + " ring-2 ring-offset-1 ring-current"
                            : "bg-muted text-muted-foreground border-transparent hover:bg-muted/80"
                        }`}
                      >
                        <t.icon className="w-3.5 h-3.5" />
                        {t.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="text-sm font-medium mb-1.5 block">Description</label>
                  <textarea
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    placeholder="Décrivez l'événement en détail..."
                    rows={3}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  />
                </div>

                {/* Dates */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-1.5 block">Date de début *</label>
                    <Input
                      type="datetime-local"
                      value={form.startDate}
                      onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1.5 block">Date de fin</label>
                    <Input
                      type="datetime-local"
                      value={form.endDate}
                      onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                    />
                  </div>
                </div>

                {/* Journée entière */}
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.allDay}
                    onChange={(e) => setForm({ ...form, allDay: e.target.checked })}
                    className="rounded border-input"
                  />
                  <span className="text-sm">Journée entière</span>
                </label>

                {/* Champs promotion */}
                {form.type === "PROMOTION" && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-orange-50 dark:bg-orange-950/20 rounded-lg border border-orange-200 dark:border-orange-800">
                    <div>
                      <label className="text-sm font-medium mb-1.5 block">Réduction (%)</label>
                      <Input
                        type="number"
                        min="0"
                        max="100"
                        value={form.discountPercent}
                        onChange={(e) => setForm({ ...form, discountPercent: e.target.value })}
                        placeholder="Ex: 20"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-1.5 block">Code promo</label>
                      <Input
                        value={form.promoCode}
                        onChange={(e) => setForm({ ...form, promoCode: e.target.value.toUpperCase() })}
                        placeholder="Ex: ETE2026"
                      />
                    </div>
                  </div>
                )}

                {/* Publier */}
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.isPublished}
                    onChange={(e) => setForm({ ...form, isPublished: e.target.checked })}
                    className="rounded border-input"
                  />
                  <span className="text-sm font-medium">Publier immédiatement</span>
                  <span className="text-xs text-muted-foreground">(visible par les partenaires)</span>
                </label>

                {/* Actions */}
                <div className="flex gap-3 pt-2">
                  <Button type="submit" className="gap-2" disabled={createMutation.isPending || updateMutation.isPending}>
                    <Save className="w-4 h-4" />
                    {editingId ? "Mettre à jour" : "Créer l'événement"}
                  </Button>
                  <Button type="button" variant="outline" onClick={resetForm}>
                    Annuler
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* ── Filtres ── */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher un événement..."
              className="pl-9"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-muted-foreground" />
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="all">Tous les types</option>
              {EVENT_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* ── Statistiques rapides ── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Card className="border">
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-primary">{events.length}</p>
              <p className="text-xs text-muted-foreground">Total</p>
            </CardContent>
          </Card>
          <Card className="border">
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-green-600">{events.filter((e: any) => e.isPublished).length}</p>
              <p className="text-xs text-muted-foreground">Publiés</p>
            </CardContent>
          </Card>
          <Card className="border">
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-blue-600">{upcoming.length}</p>
              <p className="text-xs text-muted-foreground">À venir</p>
            </CardContent>
          </Card>
          <Card className="border">
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-muted-foreground">{past.length}</p>
              <p className="text-xs text-muted-foreground">Passés</p>
            </CardContent>
          </Card>
        </div>

        {/* ── Événements à venir ── */}
        {upcoming.length > 0 && (
          <div>
            <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <CalendarDays className="w-5 h-5 text-blue-500" />
              Événements à venir ({upcoming.length})
            </h2>
            <div className="space-y-3">
              {upcoming.map((event: any) => (
                <EventCard
                  key={event.id}
                  event={event}
                  expanded={expandedId === event.id}
                  onToggleExpand={() => setExpandedId(expandedId === event.id ? null : event.id)}
                  onEdit={() => startEdit(event)}
                  onTogglePublish={() =>
                    togglePublishMutation.mutate({ id: event.id, isPublished: !event.isPublished })
                  }
                  onDelete={() => {
                    if (confirm("Supprimer cet événement ?")) {
                      deleteMutation.mutate({ id: event.id });
                    }
                  }}
                />
              ))}
            </div>
          </div>
        )}

        {/* ── Événements passés ── */}
        {past.length > 0 && (
          <div>
            <h2 className="text-lg font-semibold mb-3 flex items-center gap-2 text-muted-foreground">
              <Calendar className="w-5 h-5" />
              Événements passés ({past.length})
            </h2>
            <div className="space-y-3 opacity-70">
              {past.map((event: any) => (
                <EventCard
                  key={event.id}
                  event={event}
                  expanded={expandedId === event.id}
                  onToggleExpand={() => setExpandedId(expandedId === event.id ? null : event.id)}
                  onEdit={() => startEdit(event)}
                  onTogglePublish={() =>
                    togglePublishMutation.mutate({ id: event.id, isPublished: !event.isPublished })
                  }
                  onDelete={() => {
                    if (confirm("Supprimer cet événement ?")) {
                      deleteMutation.mutate({ id: event.id });
                    }
                  }}
                />
              ))}
            </div>
          </div>
        )}

        {/* ── Vide ── */}
        {events.length === 0 && !eventsQuery.isLoading && (
          <Card className="border-dashed border-2">
            <CardContent className="p-10 text-center">
              <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Aucun événement</h3>
              <p className="text-muted-foreground text-sm mb-4">
                Créez votre premier événement pour qu'il apparaisse dans le calendrier de vos partenaires.
              </p>
              <Button onClick={() => setShowForm(true)} className="gap-2">
                <Plus className="w-4 h-4" />
                Créer un événement
              </Button>
            </CardContent>
          </Card>
        )}

        {eventsQuery.isLoading && (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

/* ── EventCard ── */
function EventCard({
  event,
  expanded,
  onToggleExpand,
  onEdit,
  onTogglePublish,
  onDelete,
}: {
  event: any;
  expanded: boolean;
  onToggleExpand: () => void;
  onEdit: () => void;
  onTogglePublish: () => void;
  onDelete: () => void;
}) {
  const typeInfo = getTypeInfo(event.type);
  const TypeIcon = typeInfo.icon;
  const isPast = new Date(event.startDate) < new Date();

  return (
    <Card className="border hover:shadow-sm transition-shadow">
      <CardContent className="p-0">
        {/* Main row */}
        <div
          className="flex items-center gap-3 p-4 cursor-pointer"
          onClick={onToggleExpand}
        >
          {/* Type badge */}
          <div className={`shrink-0 w-10 h-10 rounded-lg flex items-center justify-center border ${typeInfo.color}`}>
            <TypeIcon className="w-5 h-5" />
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-semibold text-sm truncate">{event.title}</h3>
              {!event.isPublished && (
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-yellow-100 text-yellow-700 border border-yellow-200 font-medium">
                  Brouillon
                </span>
              )}
              {event.promoCode && (
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-orange-100 text-orange-700 border border-orange-200 font-mono font-medium">
                  {event.promoCode}
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              {formatDate(event.startDate)}
              {event.endDate && ` → ${formatDate(event.endDate)}`}
              {event.discountPercent && ` · -${event.discountPercent}%`}
            </p>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onTogglePublish();
              }}
              className={`p-1.5 rounded-md transition-colors ${
                event.isPublished
                  ? "text-green-600 hover:bg-green-50"
                  : "text-muted-foreground hover:bg-muted"
              }`}
              title={event.isPublished ? "Dépublier" : "Publier"}
            >
              {event.isPublished ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEdit();
              }}
              className="p-1.5 rounded-md text-muted-foreground hover:bg-muted transition-colors"
              title="Modifier"
            >
              <Edit3 className="w-4 h-4" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
              className="p-1.5 rounded-md text-muted-foreground hover:bg-red-50 hover:text-red-600 transition-colors"
              title="Supprimer"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            {expanded ? (
              <ChevronUp className="w-4 h-4 text-muted-foreground" />
            ) : (
              <ChevronDown className="w-4 h-4 text-muted-foreground" />
            )}
          </div>
        </div>

        {/* Expanded details */}
        {expanded && (
          <div className="px-4 pb-4 pt-0 border-t">
            <div className="pt-3 space-y-2">
              {event.description && (
                <p className="text-sm text-muted-foreground">{event.description}</p>
              )}
              <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                <span>
                  <strong>Type :</strong> {typeInfo.label}
                </span>
                {event.allDay && <span>· Journée entière</span>}
                {event.discountPercent && (
                  <span>
                    · <strong>Réduction :</strong> {event.discountPercent}%
                  </span>
                )}
                {event.promoCode && (
                  <span>
                    · <strong>Code :</strong> {event.promoCode}
                  </span>
                )}
                <span>
                  · <strong>Statut :</strong> {event.isPublished ? "Publié" : "Brouillon"}
                </span>
                {isPast && <span className="text-red-500">· Terminé</span>}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
