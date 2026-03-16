import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import DashboardLayout from "@/components/DashboardLayout";
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon,
  Gift,
  Megaphone,
  GraduationCap,
  Video,
  Star,
  Clock,
  ExternalLink,
  Loader2,
  CalendarDays,
  List,
  ArrowLeft
} from "lucide-react";
import { OnboardingTour } from "@/components/OnboardingTour";
import { useOnboarding } from "@/hooks/useOnboarding";
import { calendarTour } from "@/config/onboarding-tours";

// Types
interface Event {
  id: number;
  title: string;
  description: string | null;
  type: "PROMOTION" | "EVENT" | "ANNOUNCEMENT" | "TRAINING" | "WEBINAR";
  startDate: string | Date;
  endDate: string | Date | null;
  allDay: boolean;
  discountPercent: string | null;
  promoCode: string | null;
  imageUrl: string | null;
  attachmentUrl: string | null;
}

const EVENT_TYPES = {
  PROMOTION: { label: "Promotion", icon: Gift, color: "bg-emerald-500/15 dark:bg-emerald-500/25 text-emerald-800 dark:text-emerald-400 border-emerald-500/20 dark:border-emerald-500/30", dotColor: "bg-emerald-500" },
  EVENT: { label: "Événement", icon: Star, color: "bg-blue-500/15 dark:bg-blue-500/25 text-blue-800 dark:text-blue-400 border-blue-500/20 dark:border-blue-500/30", dotColor: "bg-blue-500" },
  ANNOUNCEMENT: { label: "Annonce", icon: Megaphone, color: "bg-amber-500/15 dark:bg-amber-500/25 text-amber-800 dark:text-amber-400 border-amber-500/20 dark:border-amber-500/30", dotColor: "bg-amber-500" },
  TRAINING: { label: "Formation", icon: GraduationCap, color: "bg-purple-500/15 dark:bg-purple-500/25 text-purple-800 dark:text-purple-400 border-purple-500/20 dark:border-purple-500/30", dotColor: "bg-purple-500" },
  WEBINAR: { label: "Webinaire", icon: Video, color: "bg-pink-500/15 dark:bg-pink-500/25 text-pink-800 dark:text-pink-400 border-pink-500/20 dark:border-pink-500/30", dotColor: "bg-pink-500" },
};

const MONTHS = [
  "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
  "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"
];

const DAYS = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

export default function Calendar() {
  const { user } = useAuth();
  const onboarding = useOnboarding("calendar");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [viewMode, setViewMode] = useState<"month" | "list">("month");

  // Récupérer les événements via tRPC
  const { data: eventsData, isLoading } = trpc.events.list.useQuery({});
  const { data: upcomingEventsData } = trpc.events.upcoming.useQuery({ limit: 10 });

  // Convertir les données en format Event
  const events: Event[] = (eventsData || []).map((e: any) => ({
    ...e,
    startDate: e.startDate instanceof Date ? e.startDate.toISOString() : e.startDate,
    endDate: e.endDate ? (e.endDate instanceof Date ? e.endDate.toISOString() : e.endDate) : null,
  }));

  const upcomingEvents: Event[] = (upcomingEventsData || []).map((e: any) => ({
    ...e,
    startDate: e.startDate instanceof Date ? e.startDate.toISOString() : e.startDate,
    endDate: e.endDate ? (e.endDate instanceof Date ? e.endDate.toISOString() : e.endDate) : null,
  }));

  // Navigation
  const goToPreviousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  // Générer les jours du mois
  const generateCalendarDays = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);
    
    // Ajuster pour commencer par Lundi (0 = Lundi, 6 = Dimanche)
    let startDay = firstDayOfMonth.getDay() - 1;
    if (startDay < 0) startDay = 6;
    
    const daysInMonth = lastDayOfMonth.getDate();
    const days: Array<{ date: Date | null; events: Event[] }> = [];
    
    // Jours vides avant le premier jour du mois
    for (let i = 0; i < startDay; i++) {
      days.push({ date: null, events: [] });
    }
    
    // Jours du mois
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const dayEvents = events.filter((event: Event) => {
        const eventStart = new Date(event.startDate);
        const eventEnd = event.endDate ? new Date(event.endDate) : eventStart;
        const dateStart = new Date(date);
        dateStart.setHours(0, 0, 0, 0);
        const dateEnd = new Date(date);
        dateEnd.setHours(23, 59, 59, 999);
        
        const eventStartDate = new Date(eventStart);
        eventStartDate.setHours(0, 0, 0, 0);
        const eventEndDate = new Date(eventEnd);
        eventEndDate.setHours(23, 59, 59, 999);
        
        return dateStart <= eventEndDate && dateEnd >= eventStartDate;
      });
      days.push({ date, events: dayEvents });
    }
    
    return days;
  };

  const calendarDays = generateCalendarDays();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const formatDate = (dateStr: string | Date) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("fr-FR", { 
      weekday: "long", 
      day: "numeric", 
      month: "long",
      year: "numeric"
    });
  };

  const formatDateShort = (dateStr: string | Date) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("fr-FR", { 
      day: "numeric", 
      month: "short",
    });
  };

  const formatTime = (dateStr: string | Date) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center py-32">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-4 md:p-6 space-y-4 md:space-y-6">
        {/* Page header */}
        <div data-tour="calendar-header" className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-foreground">Calendrier</h1>
            <p className="text-xs md:text-sm text-muted-foreground">Événements, promotions et formations</p>
          </div>
          <div className="flex items-center gap-2">
            {/* View mode toggle */}
            <div className="flex bg-muted rounded-lg p-0.5">
              <button
                onClick={() => setViewMode("month")}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${viewMode === "month" ? "bg-card shadow text-foreground" : "text-muted-foreground hover:text-foreground"}`}
              >
                <CalendarDays className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Mois</span>
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${viewMode === "list" ? "bg-card shadow text-foreground" : "text-muted-foreground hover:text-foreground"}`}
              >
                <List className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Liste</span>
              </button>
            </div>
          </div>
        </div>

        <div data-tour="calendar-grid" className="grid grid-cols-1 lg:grid-cols-4 gap-4 md:gap-6">
          {/* Calendrier principal */}
          <div className="lg:col-span-3">
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 sm:gap-4">
                    <Button variant="outline" size="icon" className="h-8 w-8" onClick={goToPreviousMonth}>
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <h2 className="text-base sm:text-xl font-semibold min-w-[160px] text-center">
                      {MONTHS[currentDate.getMonth()]} {currentDate.getFullYear()}
                    </h2>
                    <Button variant="outline" size="icon" className="h-8 w-8" onClick={goToNextMonth}>
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                  <Button variant="outline" size="sm" onClick={goToToday} className="text-xs">
                    Aujourd'hui
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {viewMode === "month" ? (
                  <>
                    {/* En-têtes des jours */}
                    <div className="grid grid-cols-7 gap-0.5 sm:gap-1 mb-1 sm:mb-2">
                      {DAYS.map(day => (
                        <div key={day} className="text-center text-[10px] sm:text-xs font-medium text-muted-foreground py-1 sm:py-2 uppercase tracking-wide">
                          {day}
                        </div>
                      ))}
                    </div>
                    
                    {/* Grille du calendrier */}
                    <div className="grid grid-cols-7 gap-0.5 sm:gap-1">
                      {calendarDays.map((day, index) => {
                        const isToday = day.date && day.date.getTime() === today.getTime();
                        const isCurrentMonth = day.date !== null;
                        const hasEvents = day.events.length > 0;
                        
                        return (
                          <div
                            key={index}
                            className={`min-h-[44px] sm:min-h-[90px] p-0.5 sm:p-1.5 border rounded-md sm:rounded-lg transition-colors ${
                              isCurrentMonth ? "bg-card hover:bg-accent/5" : "bg-muted/30"
                            } ${isToday ? "ring-2 ring-primary border-primary/30" : "border-border/50"}`}
                          >
                            {day.date && (
                              <>
                                <div className={`text-[10px] sm:text-xs font-medium sm:mb-1 text-center sm:text-left ${
                                  isToday 
                                    ? "bg-primary text-primary-foreground w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center mx-auto sm:mx-0" 
                                    : "text-foreground"
                                }`}>
                                  {day.date.getDate()}
                                </div>
                                {/* Mobile: points colorés */}
                                <div className="sm:hidden flex justify-center gap-0.5 mt-0.5">
                                  {day.events.slice(0, 3).map(event => {
                                    const typeConfig = EVENT_TYPES[event.type];
                                    return (
                                      <button
                                        key={event.id}
                                        onClick={() => setSelectedEvent(event)}
                                        className={`w-1.5 h-1.5 rounded-full ${typeConfig.dotColor}`}
                                      />
                                    );
                                  })}
                                </div>
                                {/* Desktop: titres */}
                                <div className="hidden sm:block space-y-0.5">
                                  {day.events.slice(0, 2).map(event => {
                                    const typeConfig = EVENT_TYPES[event.type];
                                    return (
                                      <button
                                        key={event.id}
                                        onClick={() => setSelectedEvent(event)}
                                        className={`w-full text-left text-[10px] px-1.5 py-0.5 rounded truncate border ${typeConfig.color} hover:opacity-80 transition-opacity`}
                                      >
                                        {event.title}
                                      </button>
                                    );
                                  })}
                                  {day.events.length > 2 && (
                                    <div className="text-[10px] text-muted-foreground px-1">
                                      +{day.events.length - 2} autres
                                    </div>
                                  )}
                                </div>
                              </>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </>
                ) : (
                  /* Vue liste */
                  <div className="space-y-3">
                    {events.length === 0 ? (
                      <div className="text-center py-16">
                        <CalendarDays className="w-12 h-12 mx-auto mb-4 text-muted-foreground/30" />
                        <p className="text-muted-foreground font-medium">Aucun événement prévu</p>
                        <p className="text-sm text-muted-foreground mt-1">
                          Les événements apparaîtront ici dès qu'ils seront publiés
                        </p>
                      </div>
                    ) : (
                      events
                        .sort((a: Event, b: Event) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())
                        .map((event: Event) => {
                          const typeConfig = EVENT_TYPES[event.type];
                          const TypeIcon = typeConfig.icon;
                          const isPast = new Date(event.endDate || event.startDate) < new Date();
                          
                          return (
                            <button 
                              key={event.id} 
                              className={`w-full text-left p-3 sm:p-4 rounded-lg border transition-all hover:shadow-sm hover:border-primary/30 ${isPast ? "opacity-60" : ""}`}
                              onClick={() => setSelectedEvent(event)}
                            >
                              <div className="flex items-start gap-3 sm:gap-4">
                                {/* Date badge */}
                                <div className="flex-shrink-0 w-12 sm:w-14 text-center">
                                  <div className="text-lg sm:text-2xl font-bold text-foreground leading-none">
                                    {new Date(event.startDate).getDate()}
                                  </div>
                                  <div className="text-[10px] sm:text-xs text-muted-foreground uppercase">
                                    {new Date(event.startDate).toLocaleDateString("fr-FR", { month: "short" })}
                                  </div>
                                </div>
                                {/* Divider */}
                                <div className={`w-0.5 self-stretch rounded-full ${typeConfig.dotColor}`} />
                                {/* Content */}
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                                    <h3 className="font-semibold text-sm sm:text-base truncate">{event.title}</h3>
                                    <Badge variant="outline" className={`text-[10px] ${typeConfig.color}`}>
                                      {typeConfig.label}
                                    </Badge>
                                    {isPast && (
                                      <Badge variant="secondary" className="text-[10px]">Passé</Badge>
                                    )}
                                  </div>
                                  {event.description && (
                                    <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2 mb-1.5">
                                      {event.description}
                                    </p>
                                  )}
                                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                    <span className="flex items-center gap-1">
                                      <Clock className="w-3 h-3" />
                                      {formatDateShort(event.startDate)}
                                      {event.endDate && ` → ${formatDateShort(event.endDate)}`}
                                    </span>
                                  </div>
                                  {event.promoCode && (
                                    <div className="mt-2 inline-flex items-center gap-1.5 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 px-2.5 py-1 rounded-full text-xs">
                                      <Gift className="w-3 h-3" />
                                      Code: <span className="font-mono font-bold">{event.promoCode}</span>
                                      {event.discountPercent && ` (-${event.discountPercent}%)`}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </button>
                          );
                        })
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Légende */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold">Légende</CardTitle>
              </CardHeader>
              <CardContent className="space-y-1.5">
                {Object.entries(EVENT_TYPES).map(([key, config]) => {
                  const Icon = config.icon;
                  return (
                    <div key={key} className="flex items-center gap-2">
                      <div className={`w-2.5 h-2.5 rounded-full ${config.dotColor}`} />
                      <span className="text-xs text-muted-foreground">{config.label}</span>
                    </div>
                  );
                })}
              </CardContent>
            </Card>

            {/* Prochains événements */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold">À venir</CardTitle>
                <CardDescription className="text-xs">Prochains événements</CardDescription>
              </CardHeader>
              <CardContent>
                {upcomingEvents.length === 0 ? (
                  <div className="text-center py-6">
                    <CalendarDays className="w-8 h-8 mx-auto mb-2 text-muted-foreground/30" />
                    <p className="text-xs text-muted-foreground">
                      Aucun événement à venir
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {upcomingEvents.map(event => {
                      const typeConfig = EVENT_TYPES[event.type];
                      return (
                        <button
                          key={event.id}
                          onClick={() => setSelectedEvent(event)}
                          className="w-full text-left p-2 rounded-lg hover:bg-muted/50 transition-colors group"
                        >
                          <div className="flex items-start gap-2">
                            <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${typeConfig.dotColor}`} />
                            <div className="min-w-0 flex-1">
                              <span className="text-xs font-medium truncate block group-hover:text-primary transition-colors">{event.title}</span>
                              <p className="text-[10px] text-muted-foreground">
                                {formatDateShort(event.startDate)}
                              </p>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Modal de détail d'événement */}
      <Dialog open={!!selectedEvent} onOpenChange={() => setSelectedEvent(null)}>
        <DialogContent className="max-w-lg">
          {selectedEvent && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-3">
                  {(() => {
                    const typeConfig = EVENT_TYPES[selectedEvent.type];
                    const TypeIcon = typeConfig.icon;
                    return (
                      <div className={`p-2.5 rounded-xl ${typeConfig.color}`}>
                        <TypeIcon className="w-5 h-5" />
                      </div>
                    );
                  })()}
                  <div>
                    <DialogTitle className="text-lg">{selectedEvent.title}</DialogTitle>
                    <Badge variant="outline" className={`mt-1 text-[10px] ${EVENT_TYPES[selectedEvent.type].color}`}>
                      {EVENT_TYPES[selectedEvent.type].label}
                    </Badge>
                  </div>
                </div>
              </DialogHeader>
              
              <div className="space-y-4 mt-2">
                {/* Dates */}
                <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 rounded-lg px-3 py-2">
                  <Clock className="w-4 h-4 flex-shrink-0" />
                  <span>
                    {formatDate(selectedEvent.startDate)}
                    {!selectedEvent.allDay && ` à ${formatTime(selectedEvent.startDate)}`}
                    {selectedEvent.endDate && (
                      <>
                        {" → "}
                        {formatDate(selectedEvent.endDate)}
                        {!selectedEvent.allDay && ` à ${formatTime(selectedEvent.endDate)}`}
                      </>
                    )}
                  </span>
                </div>

                {/* Description */}
                {selectedEvent.description && (
                  <p className="text-sm text-foreground leading-relaxed">{selectedEvent.description}</p>
                )}

                {/* Code promo */}
                {selectedEvent.promoCode && (
                  <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Gift className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      <span className="font-semibold text-sm text-emerald-800 dark:text-emerald-400">Offre promotionnelle</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <div>
                        <p className="text-xs text-emerald-700 dark:text-emerald-400">Code promo:</p>
                        <p className="font-mono font-bold text-lg text-emerald-900 dark:text-emerald-300">
                          {selectedEvent.promoCode}
                        </p>
                      </div>
                      {selectedEvent.discountPercent && (
                        <div className="bg-emerald-600 text-white px-3 py-1 rounded-full font-bold text-sm">
                          -{selectedEvent.discountPercent}%
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Image */}
                {selectedEvent.imageUrl && (
                  <img 
                    src={selectedEvent.imageUrl} 
                    alt={selectedEvent.title}
                    className="w-full rounded-xl"
                  />
                )}

                {/* Pièce jointe */}
                {selectedEvent.attachmentUrl && (
                  <a 
                    href={selectedEvent.attachmentUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
                  >
                    <ExternalLink className="w-4 h-4" />
                    Voir le document
                  </a>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
      <OnboardingTour
        steps={calendarTour}
        isActive={onboarding.isActive}
        currentStep={onboarding.currentStep}
        onNext={onboarding.nextStep}
        onPrev={onboarding.prevStep}
        onSkip={onboarding.skipTour}
        onComplete={onboarding.markCompleted}
      />
    </DashboardLayout>
  );
}
