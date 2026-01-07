import { useEffect, useRef } from "react";
import { io, Socket } from "socket.io-client";
import { useAuth } from "@/_core/hooks/useAuth";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";

export function useWebSocket() {
  const { user } = useAuth();
  const socketRef = useRef<Socket | null>(null);
  
  // Charger les préférences de notification de l'utilisateur
  const { data: preferences } = trpc.notificationPreferences.get.useQuery(undefined, {
    enabled: !!user,
  });

  useEffect(() => {
    if (!user) return;

    // Connexion au serveur WebSocket
    const socket = io(window.location.origin, {
      transports: ["websocket", "polling"],
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      console.log("[WebSocket] Connected");

      // Rejoindre la room de l'utilisateur
      socket.emit("join:user", user.id);

      // Si l'utilisateur a un partnerId, rejoindre la room du partenaire
      if (user.partnerId) {
        socket.emit("join:partner", user.partnerId);
      }

      // Si l'utilisateur est admin, rejoindre la room des admins
      if (user.role === "SUPER_ADMIN" || user.role === "ADMIN") {
        socket.emit("join:admin");
      }
    });

    // Notifications de changement de statut de commande
    socket.on("order:status_changed", (data: {
      orderId: number;
      orderNumber: string;
      oldStatus: string;
      newStatus: string;
    }) => {
      // Vérifier si l'utilisateur souhaite recevoir ce type de notification
      if (preferences?.orderStatusChangedToast !== false) {
        toast.success("Commande mise à jour", {
          description: `La commande ${data.orderNumber} est maintenant ${getStatusLabel(data.newStatus)}`,
        });
      }
    });

    // Notifications de changement de statut SAV
    socket.on("sav:status_changed", (data: {
      savId: number;
      ticketNumber: string;
      oldStatus: string;
      newStatus: string;
    }) => {
      // Vérifier si l'utilisateur souhaite recevoir ce type de notification
      if (preferences?.savStatusChangedToast !== false) {
        toast.info("Ticket SAV mis à jour", {
          description: `Le ticket ${data.ticketNumber} est maintenant ${getSavStatusLabel(data.newStatus)}`,
        });
      }
    });

    // Notifications de nouveau lead
    socket.on("lead:new", (data: {
      leadId: number;
      customerName: string;
      city: string;
    }) => {
      // Vérifier si l'utilisateur souhaite recevoir ce type de notification
      if (preferences?.leadNewToast !== false) {
        toast.success("Nouveau lead", {
          description: `${data.customerName} de ${data.city}`,
        });
      }
    });

    // Notifications de nouveau ticket SAV
    socket.on("sav:new", (data: {
      savId: number;
      ticketNumber: string;
      urgency: string;
    }) => {
      // Vérifier si l'utilisateur souhaite recevoir ce type de notification
      if (preferences?.savNewToast !== false) {
        toast.warning("Nouveau ticket SAV", {
          description: `${data.ticketNumber} - Urgence: ${data.urgency}`,
        });
      }
    });

    // Notifications de nouvelle commande
    socket.on("order:new", (data: {
      orderId: number;
      orderNumber: string;
      totalAmount: number;
    }) => {
      // Vérifier si l'utilisateur souhaite recevoir ce type de notification
      if (preferences?.orderNewToast !== false) {
        toast.success("Nouvelle commande", {
          description: `${data.orderNumber} - ${data.totalAmount.toFixed(2)} €`,
        });
      }
    });

    socket.on("disconnect", () => {
      console.log("[WebSocket] Disconnected");
    });

    socket.on("error", (error) => {
      console.error("[WebSocket] Error:", error);
    });

    return () => {
      socket.disconnect();
    };
  }, [user, preferences]);

  return socketRef.current;
}

function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    PENDING: "En attente",
    CONFIRMED: "Confirmée",
    PROCESSING: "En préparation",
    SHIPPED: "Expédiée",
    DELIVERED: "Livrée",
    CANCELLED: "Annulée",
  };
  return labels[status] || status;
}

function getSavStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    NEW: "Nouveau",
    IN_PROGRESS: "En cours",
    WAITING_PARTS: "Attente pièces",
    RESOLVED: "Résolu",
    CLOSED: "Fermé",
  };
  return labels[status] || status;
}
