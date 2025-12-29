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
  ExternalLink
} from "lucide-react";
import { Link } from "wouter";

// Types
interface Event {
  id: number;
  title: string;
  description: string | null;
  type: "PROMOTION" | "EVENT" | "ANNOUNCEMENT" | "TRAINING" | "WEBINAR";
  startDate: string;
  endDate: string | null;
  allDay: boolean;
  discountPercent: string | null;
  promoCode: string | null;
  imageUrl: string | null;
  attachmentUrl: string | null;
}

const EVENT_TYPES = {
  PROMOTION: { label: "Promotion", icon: Gift, color: "bg-green-100 text-green-800 border-green-200" },
  EVENT: { label: "Événement", icon: Star, color: "bg-blue-100 text-blue-800 border-blue-200" },
  ANNOUNCEMENT: { label: "Annonce", icon: Megaphone, color: "bg-yellow-100 text-yellow-800 border-yellow-200" },
  TRAINING: { label: "Formation", icon: GraduationCap, color: "bg-purple-100 text-purple-800 border-purple-200" },
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

  // Récupérer les événements de l'année en cours
  const year = currentDate.getFullYear();
  // Les événements seront chargés une fois le router events créé
  const events: Event[] = [];

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
        return date >= new Date(eventStart.setHours(0, 0, 0, 0)) && 
               date <= new Date(eventEnd.setHours(23, 59, 59, 999));
      });
      days.push({ date, events: dayEvents });
    }
    
    return days;
  };

  const calendarDays = generateCalendarDays();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Événements à venir (prochains 30 jours)
  const upcomingEvents = events
    .filter((event: Event) => new Date(event.startDate) >= today)
    .sort((a: Event, b: Event) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())
    .slice(0, 10);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("fr-FR", { 
      weekday: "long", 
      day: "numeric", 
      month: "long",
      year: "numeric"
    });
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div className="min-h-screen bg-gray-50">
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
                <h1 className="text-2xl font-bold text-gray-900">Calendrier</h1>
                <p className="text-sm text-gray-500">Événements, promotions et formations</p>
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
                    <h2 className="text-xl font-semibold">
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
                        <div key={day} className="text-center text-sm font-medium text-gray-500 py-2">
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
                              isCurrentMonth ? "bg-white" : "bg-gray-50"
                            } ${isToday ? "ring-2 ring-primary" : ""}`}
                          >
                            {day.date && (
                              <>
                                <div className={`text-sm font-medium mb-1 ${
                                  isToday ? "text-primary" : "text-gray-700"
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
                                    <div className="text-xs text-gray-500 px-1">
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
                      <div className="text-center py-12 text-gray-500">
                        <CalendarIcon className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        <p>Aucun événement prévu cette année</p>
                      </div>
                    ) : (
                      events
                        .sort((a: Event, b: Event) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())
                        .map((event: Event) => {
                          const typeConfig = EVENT_TYPES[event.type];
                          const Icon = typeConfig.icon;
                          const isPast = new Date(event.startDate) < today;
                          
                          return (
                            <div
                              key={event.id}
                              className={`flex items-start gap-4 p-4 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors ${
                                isPast ? "opacity-60" : ""
                              }`}
                              onClick={() => setSelectedEvent(event)}
                            >
                              <div className={`p-2 rounded-lg ${typeConfig.color}`}>
                                <Icon className="w-5 h-5" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <h3 className="font-medium text-gray-900">{event.title}</h3>
                                  <Badge variant="outline" className={typeConfig.color}>
                                    {typeConfig.label}
                                  </Badge>
                                </div>
                                <p className="text-sm text-gray-500 mb-2">
                                  {formatDate(event.startDate)}
                                  {!event.allDay && ` à ${formatTime(event.startDate)}`}
                                </p>
                                {event.description && (
                                  <p className="text-sm text-gray-600 line-clamp-2">{event.description}</p>
                                )}
                              </div>
                              {event.discountPercent && (
                                <Badge className="bg-green-600 text-white">
                                  -{event.discountPercent}%
                                </Badge>
                              )}
                            </div>
                          );
                        })
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar - Événements à venir */}
          <div className="space-y-6">
            {/* Légende */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Légende</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {Object.entries(EVENT_TYPES).map(([key, config]) => {
                  const Icon = config.icon;
                  return (
                    <div key={key} className="flex items-center gap-2">
                      <div className={`p-1 rounded ${config.color}`}>
                        <Icon className="w-3 h-3" />
                      </div>
                      <span className="text-sm text-gray-600">{config.label}</span>
                    </div>
                  );
                })}
              </CardContent>
            </Card>

            {/* Prochains événements */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Prochains événements</CardTitle>
                <CardDescription>Les 10 prochains</CardDescription>
              </CardHeader>
              <CardContent>
                {upcomingEvents.length === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-4">
                    Aucun événement à venir
                  </p>
                ) : (
                  <div className="space-y-3">
                    {upcomingEvents.map((event: Event) => {
                      const typeConfig = EVENT_TYPES[event.type];
                      const Icon = typeConfig.icon;
                      
                      return (
                        <button
                          key={event.id}
                          onClick={() => setSelectedEvent(event)}
                          className="w-full text-left p-2 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                          <div className="flex items-start gap-2">
                            <div className={`p-1 rounded ${typeConfig.color}`}>
                              <Icon className="w-3 h-3" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 truncate">
                                {event.title}
                              </p>
                              <p className="text-xs text-gray-500">
                                {new Date(event.startDate).toLocaleDateString("fr-FR", {
                                  day: "numeric",
                                  month: "short"
                                })}
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
      </main>

      {/* Modal détail événement */}
      <Dialog open={!!selectedEvent} onOpenChange={() => setSelectedEvent(null)}>
        <DialogContent className="max-w-lg">
          {selectedEvent && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-2 mb-2">
                  <Badge className={EVENT_TYPES[selectedEvent.type].color}>
                    {EVENT_TYPES[selectedEvent.type].label}
                  </Badge>
                  {selectedEvent.discountPercent && (
                    <Badge className="bg-green-600 text-white">
                      -{selectedEvent.discountPercent}% de réduction
                    </Badge>
                  )}
                </div>
                <DialogTitle className="text-xl">{selectedEvent.title}</DialogTitle>
                <DialogDescription asChild>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-gray-600">
                      <CalendarIcon className="w-4 h-4" />
                      <span>{formatDate(selectedEvent.startDate)}</span>
                    </div>
                    {!selectedEvent.allDay && (
                      <div className="flex items-center gap-2 text-gray-600">
                        <Clock className="w-4 h-4" />
                        <span>{formatTime(selectedEvent.startDate)}</span>
                        {selectedEvent.endDate && (
                          <span>- {formatTime(selectedEvent.endDate)}</span>
                        )}
                      </div>
                    )}
                  </div>
                </DialogDescription>
              </DialogHeader>
              
              {selectedEvent.imageUrl && (
                <div className="relative aspect-video rounded-lg overflow-hidden bg-gray-100">
                  <img
                    src={selectedEvent.imageUrl}
                    alt={selectedEvent.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              
              {selectedEvent.description && (
                <div className="prose prose-sm max-w-none">
                  <p className="text-gray-600">{selectedEvent.description}</p>
                </div>
              )}
              
              {selectedEvent.promoCode && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <p className="text-sm text-green-800 font-medium mb-1">Code promo</p>
                  <p className="text-lg font-mono font-bold text-green-900">
                    {selectedEvent.promoCode}
                  </p>
                </div>
              )}
              
              <div className="flex gap-2 pt-4">
                {selectedEvent.attachmentUrl && (
                  <Button asChild variant="outline" className="flex-1">
                    <a href={selectedEvent.attachmentUrl} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Voir le document
                    </a>
                  </Button>
                )}
                <Button onClick={() => setSelectedEvent(null)} className="flex-1">
                  Fermer
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
