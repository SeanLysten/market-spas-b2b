import { jsPDF } from "jspdf";

interface SAVService {
  ticketNumber: string;
  serialNumber: string;
  issueType: string;
  description: string;
  urgency: string;
  status: string;
  customerName?: string | null;
  customerEmail?: string | null;
  customerPhone?: string | null;
  customerAddress?: string | null;
  installationDate?: Date | string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
  resolutionNotes?: string | null;
}

interface SAVMedia {
  id: number;
  serviceId: number;
  mediaUrl: string;
  mediaKey: string;
  mediaType: "IMAGE" | "VIDEO";
  description: string | null;
  createdAt: Date;
}

interface SAVNote {
  note: {
    id: number;
    serviceId: number;
    userId: number;
    note: string;
    isInternal: boolean;
    createdAt: Date;
  };
  user: {
    id: number;
    name: string | null;
    email: string | null;
  } | null;
}

interface SAVData {
  service: SAVService;
  partner?: {
    companyName: string;
  } | null;
  media: SAVMedia[];
  notes: SAVNote[];
}

const issueTypeLabels: Record<string, string> = {
  TECHNICAL: "Technique",
  LEAK: "Fuite",
  ELECTRICAL: "Électrique",
  HEATING: "Chauffage",
  JETS: "Jets",
  CONTROL_PANEL: "Panneau de contrôle",
  OTHER: "Autre",
};

const urgencyLabels: Record<string, string> = {
  NORMAL: "Normale",
  URGENT: "Urgente",
  CRITICAL: "Critique",
};

const statusLabels: Record<string, string> = {
  NEW: "Nouveau",
  IN_PROGRESS: "En cours",
  WAITING_PARTS: "En attente de pièces",
  RESOLVED: "Résolu",
  CLOSED: "Fermé",
};

export function generateSAVPDF(data: SAVData) {
  const doc = new jsPDF();
  const { service, partner, media, notes } = data;
  
  let y = 20;
  const lineHeight = 7;
  const pageHeight = doc.internal.pageSize.height;
  const margin = 20;

  // Helper function to add text with page break
  const addText = (text: string, x: number, fontSize: number = 10, isBold: boolean = false) => {
    if (y > pageHeight - margin) {
      doc.addPage();
      y = margin;
    }
    doc.setFontSize(fontSize);
    if (isBold) {
      doc.setFont("helvetica", "bold");
    } else {
      doc.setFont("helvetica", "normal");
    }
    doc.text(text, x, y);
    y += lineHeight;
  };

  // Title
  addText("RAPPORT DE SERVICE APRÈS-VENTE", 20, 16, true);
  y += 5;

  // Ticket info
  addText(`Numéro de ticket: ${service.ticketNumber}`, 20, 12, true);
  addText(`Statut: ${statusLabels[service.status] || service.status}`, 20);
  addText(`Urgence: ${urgencyLabels[service.urgency] || service.urgency}`, 20);
  y += 3;

  // Partner info
  if (partner) {
    addText("PARTENAIRE", 20, 12, true);
    addText(`${partner.companyName}`, 20);
    y += 3;
  }

  // Product info
  addText("INFORMATIONS PRODUIT", 20, 12, true);
  addText(`Numéro de série: ${service.serialNumber}`, 20);
  addText(`Type de problème: ${issueTypeLabels[service.issueType] || service.issueType}`, 20);
  if (service.installationDate) {
    addText(`Date d'installation: ${new Date(service.installationDate).toLocaleDateString("fr-FR")}`, 20);
  }
  y += 3;

  // Customer info
  if (service.customerName || service.customerEmail || service.customerPhone) {
    addText("INFORMATIONS CLIENT", 20, 12, true);
    if (service.customerName) addText(`Nom: ${service.customerName}`, 20);
    if (service.customerEmail) addText(`Email: ${service.customerEmail}`, 20);
    if (service.customerPhone) addText(`Téléphone: ${service.customerPhone}`, 20);
    if (service.customerAddress) addText(`Adresse: ${service.customerAddress}`, 20);
    y += 3;
  }

  // Description
  addText("DESCRIPTION DU PROBLÈME", 20, 12, true);
  const descLines = doc.splitTextToSize(service.description, 170);
  descLines.forEach((line: string) => addText(line, 20));
  y += 3;

  // Media
  if (media && media.length > 0) {
    addText("MÉDIAS JOINTS", 20, 12, true);
    media.forEach((item, index) => {
      addText(`${index + 1}. ${item.mediaType === "IMAGE" ? "Photo" : "Vidéo"}: ${item.mediaUrl}`, 20, 9);
      if (item.description) {
        addText(`   Description: ${item.description}`, 20, 9);
      }
    });
    y += 3;
  }

  // Notes
  if (notes && notes.length > 0) {
    addText("HISTORIQUE DES NOTES", 20, 12, true);
    notes.filter(n => !n.note.isInternal).forEach((item) => {
      const date = new Date(item.note.createdAt).toLocaleString("fr-FR");
      const userName = item.user?.name || "Utilisateur inconnu";
      addText(`[${date}] ${userName}:`, 20, 9, true);
      const noteLines = doc.splitTextToSize(item.note.note, 170);
      noteLines.forEach((line: string) => addText(line, 20, 9));
      y += 2;
    });
  }

  // Resolution notes
  if (service.resolutionNotes) {
    y += 3;
    addText("NOTES DE RÉSOLUTION", 20, 12, true);
    const resLines = doc.splitTextToSize(service.resolutionNotes, 170);
    resLines.forEach((line: string) => addText(line, 20));
  }

  // Footer
  y += 10;
  addText(`Créé le: ${new Date(service.createdAt).toLocaleString("fr-FR")}`, 20, 8);
  addText(`Dernière mise à jour: ${new Date(service.updatedAt).toLocaleString("fr-FR")}`, 20, 8);

  // Save
  doc.save(`SAV-${service.ticketNumber}.pdf`);
}
