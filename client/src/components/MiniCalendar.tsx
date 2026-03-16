import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  ChevronLeft,
  ChevronRight,
  Gift,
  Megaphone,
  GraduationCap,
  Video,
  Star,
  Clock,
  ExternalLink,
  CalendarDays,
  ArrowRight,
  Plus,
} from "lucide-react";
import { Link } from "wouter";

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
  PROMOTION: { label: "Promotion", icon: Gift, dotColor: "bg-emerald-500", color: "bg-emerald-500/15 dark:bg-emerald-500/25 text-emerald-800 dark:text-emerald-400 border-emerald-500/20 dark:border-emerald-500/30" },
  EVENT: { label: "Événement", icon: Star, dotColor: "bg-blue-500", color: "bg-blue-500/15 dark:bg-blue-500/25 text-blue-800 dark:text-blue-400 border-blue-500/20 dark:border-blue-500/30" },
  ANNOUNCEMENT: { label: "Annonce", icon: Megaphone, dotColor: "bg-amber-500", color: "bg-amber-500/15 dark:bg-amber-500/25 text-amber-800 dark:text-amber-400 border-amber-500/20 dark:border-amber-500/30" },
  TRAINING: { label: "Formation", icon: GraduationCap, dotColor: "bg-purple-500", color: "bg-purple-500/15 dark:bg-purple-500/25 text-purple-800 dark:text-purple-400 border-purple-500/20 dark:border-purple-500/30" },
  WEBINAR: { label: "Webinaire", icon: Video, dotColor: "bg-pink-500", color: "bg-pink-500/15 dark:bg-pink-500/25 text-pink-800 dark:text-pink-400 border-pink-500/20 dark:border-pink-500/30" },
};

const MONTHS = [
  "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
  "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"
];

const DAYS = ["L", "M", "M", "J", "V", "S", "D"];

interface MiniCalendarProps {
  /** Show admin-specific actions like "Gérer" and "Ajouter" links */
  isAdmin?: boolean;
}

export default function MiniCalendar({ isAdmin = false }: MiniCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [selectedDayEvents, setSelectedDayEvents] = useState<Event[] | null>(null);
  const [selectedDayLabel, setSelectedDayLabel] = useState("");

  const { data: eventsData } = trpc.events.list.useQuery({});
  const { data: upcomingEventsData } = trpc.events.upcoming.useQuery({ limit: 5 });

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

  const goToPreviousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const generateCalendarDays = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);
    let startDay = firstDayOfMonth.getDay() - 1;
    if (startDay < 0) startDay = 6;
    const daysInMonth = lastDayOfMonth.getDate();
    const days: Array<{ date: Date | null; events: Event[] }> = [];

    for (let i = 0; i < startDay; i++) {
      days.push({ date: null, events: [] });
    }

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
      year: "numeric",
    });
  };

  const formatTime = (dateStr: string | Date) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
  };

  const handleDayClick = (dayEvents: Event[], date: Date) => {
    if (dayEvents.length === 1) {
      setSelectedEvent(dayEvents[0]);
    } else if (dayEvents.length > 1) {
      setSelectedDayEvents(dayEvents);
      setSelectedDayLabel(
        date.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })
      );
    }
  };

  return (
    <>
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base">
              <CalendarDays className="w-5 h-5 text-primary" />
              Calendrier
            </CardTitle>
            <div className="flex items-center gap-1">
              {isAdmin && (
                <Link href="/admin/calendar">
                  <Button variant="ghost" size="sm" className="gap-1 text-xs">
                    Gérer <ArrowRight className="w-3 h-3" />
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Month navigation */}
          <div className="flex items-center justify-between">
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={goToPreviousMonth}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <div className="text-center">
              <span className="text-sm font-semibold">
                {MONTHS[currentDate.getMonth()]} {currentDate.getFullYear()}
              </span>
            </div>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={goToNextMonth}>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>

          {/* Calendar grid */}
          <div>
            {/* Day headers */}
            <div className="grid grid-cols-7 gap-0.5 mb-1">
              {DAYS.map((day, i) => (
                <div key={i} className="text-center text-[10px] font-medium text-muted-foreground uppercase">
                  {day}
                </div>
              ))}
            </div>

            {/* Days */}
            <div className="grid grid-cols-7 gap-0.5">
              {calendarDays.map((day, index) => {
                const isToday = day.date && day.date.getTime() === today.getTime();
                const hasEvents = day.events.length > 0;

                return (
                  <button
                    key={index}
                    disabled={!day.date}
                    onClick={() => day.date && hasEvents && handleDayClick(day.events, day.date)}
                    className={`relative aspect-square flex flex-col items-center justify-center rounded-md text-xs transition-colors ${
                      !day.date
                        ? "invisible"
                        : hasEvents
                        ? "cursor-pointer hover:bg-accent"
                        : "cursor-default"
                    } ${isToday ? "bg-primary text-primary-foreground font-bold" : "text-foreground"}`}
                  >
                    {day.date && (
                      <>
                        <span className="leading-none">{day.date.getDate()}</span>
                        {hasEvents && (
                          <div className="flex gap-0.5 mt-0.5">
                            {day.events.slice(0, 3).map((event, i) => (
                              <div
                                key={i}
                                className={`w-1 h-1 rounded-full ${
                                  isToday ? "bg-primary-foreground" : EVENT_TYPES[event.type].dotColor
                                }`}
                              />
                            ))}
                          </div>
                        )}
                      </>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Legend */}
          <div className="flex flex-wrap gap-x-3 gap-y-1 pt-1 border-t">
            {Object.entries(EVENT_TYPES).map(([key, config]) => (
              <div key={key} className="flex items-center gap-1">
                <div className={`w-1.5 h-1.5 rounded-full ${config.dotColor}`} />
                <span className="text-[10px] text-muted-foreground">{config.label}</span>
              </div>
            ))}
          </div>

          {/* Upcoming events list */}
          {upcomingEvents.length > 0 && (
            <div className="space-y-1.5 pt-1 border-t">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">À venir</p>
              {upcomingEvents.slice(0, 4).map((event) => {
                const typeConfig = EVENT_TYPES[event.type];
                return (
                  <button
                    key={event.id}
                    onClick={() => setSelectedEvent(event)}
                    className="w-full text-left flex items-center gap-2 p-1.5 rounded-md hover:bg-muted/50 transition-colors group"
                  >
                    <div className={`w-2 h-2 rounded-full flex-shrink-0 ${typeConfig.dotColor}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium truncate group-hover:text-primary transition-colors">
                        {event.title}
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        {new Date(event.startDate).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Event detail modal */}
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

                {selectedEvent.description && (
                  <p className="text-sm text-foreground leading-relaxed">{selectedEvent.description}</p>
                )}

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

                {selectedEvent.imageUrl && (
                  <img src={selectedEvent.imageUrl} alt={selectedEvent.title} className="w-full rounded-xl" />
                )}

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

      {/* Day events list modal */}
      <Dialog open={!!selectedDayEvents} onOpenChange={() => setSelectedDayEvents(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="capitalize">{selectedDayLabel}</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            {selectedDayEvents?.map((event) => {
              const typeConfig = EVENT_TYPES[event.type];
              const TypeIcon = typeConfig.icon;
              return (
                <button
                  key={event.id}
                  onClick={() => {
                    setSelectedDayEvents(null);
                    setSelectedEvent(event);
                  }}
                  className="w-full text-left flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                >
                  <div className={`p-2 rounded-lg ${typeConfig.color}`}>
                    <TypeIcon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{event.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(event.startDate).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                      {event.endDate && ` → ${new Date(event.endDate).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}`}
                    </p>
                  </div>
                  <Badge variant="outline" className={`text-[10px] ${typeConfig.color}`}>
                    {typeConfig.label}
                  </Badge>
                </button>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
