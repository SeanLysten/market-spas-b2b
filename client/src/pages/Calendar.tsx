import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon,
  Gift,
  Megaphone,
  GraduationCap,
  Video,
  Star,
  MapPin,
  Clock,
  ExternalLink,
  Loader2
} from "lucide-react";
import { Link } from "wouter";

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
  PROMOTION: { label: "Promotion", icon: Gift, color: "bg-emerald-500/15 dark:bg-emerald-500/25 text-emerald-800 dark:text-emerald-400 border-emerald-500/20 dark:border-emerald-500/30" },
  EVENT: { label: "Événement", icon: Star, color: "bg-info/15 dark:bg-info-light text-info dark:text-info-dark border-info/20 dark:border-info/30" },
  ANNOUNCEMENT: { label: "Annonce", icon: Megaphone, color: "bg-amber-500/15 dark:bg-amber-500/25 text-amber-800 dark:text-amber-400 border-amber-500/20 dark:border-amber-500/30" },
  TRAINING: { label: "Formation", icon: GraduationCap, color: "bg-purple-500/15 dark:bg-purple-500/25 text-purple-800 dark:text-purple-400 border-purple-500/20 dark:border-purple-500/30" },
  WEBINAR: { label: "Webinaire", icon: Video, color: "bg-pink-100 text-pink-800 border-pink-200" },
};

const MONTHS = [
  "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
  "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"
];

const DAYS = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

export default function Calendar() {
  const { user } = useAuth();
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

  const formatTime = (dateStr: string | Date) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-muted/50 dark:bg-muted/30 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/50 dark:bg-muted/30">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="container py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/dashboard">
                <Button variant="ghost" size="sm">
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  Retour
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl text-display text-display font-bold text-gray-900">Calendrier</h1>
                <p className="text-sm text-muted-foreground dark:text-muted-foreground">Événements, promotions et formations</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant={viewMode === "month" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode("month")}
              >
                <CalendarIcon className="w-4 h-4 mr-1" />
                Mois
              </Button>
              <Button
                variant={viewMode === "list" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode("list")}
              >
                Liste
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Calendrier principal */}
          <div className="lg:col-span-3">
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <Button variant="outline" size="icon" onClick={goToPreviousMonth}>
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <h2 className="text-xl text-display text-display font-semibold">
                      {MONTHS[currentDate.getMonth()]} {currentDate.getFullYear()}
                    </h2>
                    <Button variant="outline" size="icon" onClick={goToNextMonth}>
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                  <Button variant="outline" size="sm" onClick={goToToday}>
                    Aujourd'hui
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {viewMode === "month" ? (
                  <>
                    {/* En-têtes des jours */}
                    <div className="grid grid-cols-7 gap-1 mb-2">
                      {DAYS.map(day => (
                        <div key={day} className="text-center text-sm font-medium text-muted-foreground dark:text-muted-foreground py-2">
                          {day}
                        </div>
                      ))}
                    </div>
                    
                    {/* Grille du calendrier */}
                    <div className="grid grid-cols-7 gap-1">
                      {calendarDays.map((day, index) => {
                        const isToday = day.date && day.date.getTime() === today.getTime();
                        const isCurrentMonth = day.date !== null;
                        
                        return (
                          <div
                            key={index}
                            className={`min-h-[100px] p-1 border rounded-lg ${
                              isCurrentMonth ? "bg-white" : "bg-muted/50 dark:bg-muted/30"
                            } ${isToday ? "ring-2 ring-primary" : ""}`}
                          >
                            {day.date && (
                              <>
                                <div className={`text-sm font-medium mb-1 ${
                                  isToday ? "text-primary" : "text-foreground dark:text-foreground"
                                }`}>
                                  {day.date.getDate()}
                                </div>
                                <div className="space-y-1">
                                  {day.events.slice(0, 3).map(event => {
                                    const typeConfig = EVENT_TYPES[event.type];
                                    return (
                                      <button
                                        key={event.id}
                                        onClick={() => setSelectedEvent(event)}
                                        className={`w-full text-left text-xs px-1 py-0.5 rounded truncate ${typeConfig.color} hover:opacity-80 transition-opacity`}
                                      >
                                        {event.title}
                                      </button>
                                    );
                                  })}
                                  {day.events.length > 3 && (
                                    <div className="text-xs text-muted-foreground dark:text-muted-foreground px-1">
                                      +{day.events.length - 3} autres
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
                  <div className="space-y-4">
                    {events.length === 0 ? (
                      <div className="text-center py-12 text-muted-foreground dark:text-muted-foreground">
                        <CalendarIcon className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        <p>Aucun événement prévu</p>
                      </div>
                    ) : (
                      events
                        .sort((a: Event, b: Event) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())
                        .map((event: Event) => {
                          const typeConfig = EVENT_TYPES[event.type];
                          const TypeIcon = typeConfig.icon;
                          
                          return (
                            <Card 
                              key={event.id} 
                              className="cursor-pointer hover:shadow-md transition-shadow"
                              onClick={() => setSelectedEvent(event)}
                            >
                              <CardContent className="p-4">
                                <div className="flex items-start gap-4">
                                  <div className={`p-2 rounded-lg ${typeConfig.color}`}>
                                    <TypeIcon className="w-5 h-5" />
                                  </div>
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                      <h3 className="font-semibold">{event.title}</h3>
                                      <Badge variant="outline" className={typeConfig.color}>
                                        {typeConfig.label}
                                      </Badge>
                                    </div>
                                    <p className="text-sm text-muted-foreground dark:text-muted-foreground mb-2">
                                      {formatDate(event.startDate)}
                                      {event.endDate && ` - ${formatDate(event.endDate)}`}
                                    </p>
                                    {event.description && (
                                      <p className="text-sm text-muted-foreground dark:text-muted-foreground line-clamp-2">
                                        {event.description}
                                      </p>
                                    )}
                                    {event.promoCode && (
                                      <div className="mt-2 inline-flex items-center gap-2 bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 px-3 py-1 rounded-full text-sm">
                                        <Gift className="w-4 h-4" />
                                        Code: <span className="font-mono font-bold">{event.promoCode}</span>
                                        {event.discountPercent && ` (-${event.discountPercent}%)`}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          );
                        })
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Légende */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Légende</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {Object.entries(EVENT_TYPES).map(([key, config]) => {
                  const Icon = config.icon;
                  return (
                    <div key={key} className="flex items-center gap-2">
                      <div className={`p-1 rounded ${config.color}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <span className="text-sm">{config.label}</span>
                    </div>
                  );
                })}
              </CardContent>
            </Card>

            {/* Prochains événements */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Prochains événements</CardTitle>
                <CardDescription>Les 10 prochains</CardDescription>
              </CardHeader>
              <CardContent>
                {upcomingEvents.length === 0 ? (
                  <p className="text-sm text-muted-foreground dark:text-muted-foreground text-center py-4">
                    Aucun événement à venir
                  </p>
                ) : (
                  <div className="space-y-3">
                    {upcomingEvents.map(event => {
                      const typeConfig = EVENT_TYPES[event.type];
                      return (
                        <button
                          key={event.id}
                          onClick={() => setSelectedEvent(event)}
                          className="w-full text-left p-2 rounded-lg hover:bg-muted/50 dark:bg-muted/30 transition-colors"
                        >
                          <div className="flex items-center gap-2 mb-1">
                            <div className={`w-2 h-2 rounded-full ${typeConfig.color.split(' ')[0]}`} />
                            <span className="text-sm font-medium truncate">{event.title}</span>
                          </div>
                          <p className="text-xs text-muted-foreground dark:text-muted-foreground pl-4">
                            {formatDate(event.startDate)}
                          </p>
                        </button>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

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
                      <div className={`p-2 rounded-lg ${typeConfig.color}`}>
                        <TypeIcon className="w-6 h-6" />
                      </div>
                    );
                  })()}
                  <div>
                    <DialogTitle>{selectedEvent.title}</DialogTitle>
                    <Badge variant="outline" className={EVENT_TYPES[selectedEvent.type].color}>
                      {EVENT_TYPES[selectedEvent.type].label}
                    </Badge>
                  </div>
                </div>
              </DialogHeader>
              
              <div className="space-y-4">
                {/* Dates */}
                <div className="flex items-center gap-2 text-muted-foreground dark:text-muted-foreground">
                  <Clock className="w-4 h-4" />
                  <span>
                    {formatDate(selectedEvent.startDate)}
                    {!selectedEvent.allDay && ` à ${formatTime(selectedEvent.startDate)}`}
                    {selectedEvent.endDate && (
                      <>
                        {" - "}
                        {formatDate(selectedEvent.endDate)}
                        {!selectedEvent.allDay && ` à ${formatTime(selectedEvent.endDate)}`}
                      </>
                    )}
                  </span>
                </div>

                {/* Description */}
                {selectedEvent.description && (
                  <p className="text-foreground dark:text-foreground">{selectedEvent.description}</p>
                )}

                {/* Code promo */}
                {selectedEvent.promoCode && (
                  <div className="bg-emerald-500/10 dark:bg-emerald-500/20 border border-emerald-500/20 dark:border-emerald-500/30 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Gift className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                      <span className="font-semibold text-emerald-800 dark:text-emerald-400">Offre promotionnelle</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <div>
                        <p className="text-sm text-emerald-700 dark:text-emerald-400">Code promo:</p>
                        <p className="font-mono font-bold text-lg text-green-900">
                          {selectedEvent.promoCode}
                        </p>
                      </div>
                      {selectedEvent.discountPercent && (
                        <div className="bg-emerald-600 dark:bg-emerald-500 text-white px-3 py-1 rounded-full font-bold">
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
                    className="w-full rounded-lg"
                  />
                )}

                {/* Pièce jointe */}
                {selectedEvent.attachmentUrl && (
                  <a 
                    href={selectedEvent.attachmentUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-primary hover:underline"
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
    </div>
  );
}
