import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { Bell, Mail, Package, Wrench, UserPlus, AlertTriangle, TrendingUp } from "lucide-react";

export default function NotificationPreferences() {
  const { data: preferences, isLoading, refetch } = trpc.notificationPreferences.get.useQuery();
  const updateMutation = trpc.notificationPreferences.update.useMutation();

  const [localPrefs, setLocalPrefs] = useState<any>(null);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (preferences) {
      setLocalPrefs(preferences);
    }
  }, [preferences]);

  const handleToggle = (key: string, value: boolean) => {
    setLocalPrefs((prev: any) => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  const handleSave = async () => {
    if (!localPrefs) return;

    try {
      await updateMutation.mutateAsync({
        orderStatusChangedToast: localPrefs.orderStatusChangedToast,
        orderStatusChangedEmail: localPrefs.orderStatusChangedEmail,
        orderNewToast: localPrefs.orderNewToast,
        orderNewEmail: localPrefs.orderNewEmail,
        savStatusChangedToast: localPrefs.savStatusChangedToast,
        savStatusChangedEmail: localPrefs.savStatusChangedEmail,
        savNewToast: localPrefs.savNewToast,
        savNewEmail: localPrefs.savNewEmail,
        leadNewToast: localPrefs.leadNewToast,
        leadNewEmail: localPrefs.leadNewEmail,
        systemAlertToast: localPrefs.systemAlertToast,
        systemAlertEmail: localPrefs.systemAlertEmail,
        stockLowToast: localPrefs.stockLowToast,
        stockLowEmail: localPrefs.stockLowEmail,
        partnerNewToast: localPrefs.partnerNewToast,
        partnerNewEmail: localPrefs.partnerNewEmail,
      });

      toast.success("Préférences enregistrées", {
        description: "Vos préférences de notification ont été mises à jour avec succès.",
      });

      setHasChanges(false);
      refetch();
    } catch (error) {
      toast.error("Erreur", {
        description: "Impossible d'enregistrer vos préférences. Veuillez réessayer.",
      });
    }
  };

  const handleReset = () => {
    if (preferences) {
      setLocalPrefs(preferences);
      setHasChanges(false);
    }
  };

  if (isLoading || !localPrefs) {
    return (
      <div className="container py-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Préférences de notification</h1>
            <p className="text-muted-foreground">Chargement...</p>
          </div>
        </div>
      </div>
    );
  }

  const NotificationRow = ({
    icon: Icon,
    title,
    description,
    toastKey,
    emailKey,
  }: {
    icon: any;
    title: string;
    description: string;
    toastKey: string;
    emailKey: string;
  }) => (
    <div className="space-y-4">
      <div className="flex items-start gap-4">
        <div className="mt-1">
          <Icon className="h-5 w-5 text-muted-foreground" />
        </div>
        <div className="flex-1 space-y-1">
          <h3 className="font-medium">{title}</h3>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
      </div>
      <div className="ml-9 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell className="h-4 w-4 text-muted-foreground" />
            <Label htmlFor={toastKey} className="text-sm cursor-pointer">
              Notification toast
            </Label>
          </div>
          <Switch
            id={toastKey}
            checked={localPrefs[toastKey]}
            onCheckedChange={(checked) => handleToggle(toastKey, checked)}
          />
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Mail className="h-4 w-4 text-muted-foreground" />
            <Label htmlFor={emailKey} className="text-sm cursor-pointer">
              Notification par email
            </Label>
          </div>
          <Switch
            id={emailKey}
            checked={localPrefs[emailKey]}
            onCheckedChange={(checked) => handleToggle(emailKey, checked)}
          />
        </div>
      </div>
    </div>
  );

  return (
    <div className="container py-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Préférences de notification</h1>
          <p className="text-muted-foreground">
            Personnalisez vos notifications pour chaque type d'événement. Vous pouvez choisir de recevoir des
            notifications toast (dans l'application) et/ou des notifications par email.
          </p>
        </div>

        <div className="space-y-6">
          {/* Commandes */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Commandes
              </CardTitle>
              <CardDescription>Notifications liées à vos commandes</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <NotificationRow
                icon={Package}
                title="Changement de statut de commande"
                description="Recevez une notification lorsque le statut d'une de vos commandes change (en production, expédiée, livrée, etc.)"
                toastKey="orderStatusChangedToast"
                emailKey="orderStatusChangedEmail"
              />
              <Separator />
              <NotificationRow
                icon={Package}
                title="Nouvelle commande"
                description="Recevez une notification lorsqu'une nouvelle commande est créée (administrateurs uniquement)"
                toastKey="orderNewToast"
                emailKey="orderNewEmail"
              />
            </CardContent>
          </Card>

          {/* Service après-vente */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wrench className="h-5 w-5" />
                Service après-vente
              </CardTitle>
              <CardDescription>Notifications liées aux tickets SAV</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <NotificationRow
                icon={Wrench}
                title="Changement de statut SAV"
                description="Recevez une notification lorsque le statut d'un ticket SAV change (nouveau, en cours, résolu, etc.)"
                toastKey="savStatusChangedToast"
                emailKey="savStatusChangedEmail"
              />
              <Separator />
              <NotificationRow
                icon={Wrench}
                title="Nouveau ticket SAV"
                description="Recevez une notification lorsqu'un nouveau ticket SAV est créé (administrateurs uniquement)"
                toastKey="savNewToast"
                emailKey="savNewEmail"
              />
            </CardContent>
          </Card>

          {/* Leads */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Leads commerciaux
              </CardTitle>
              <CardDescription>Notifications liées aux leads qui vous sont attribués</CardDescription>
            </CardHeader>
            <CardContent>
              <NotificationRow
                icon={TrendingUp}
                title="Nouveau lead attribué"
                description="Recevez une notification lorsqu'un nouveau lead vous est attribué"
                toastKey="leadNewToast"
                emailKey="leadNewEmail"
              />
            </CardContent>
          </Card>

          {/* Système */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Alertes système
              </CardTitle>
              <CardDescription>Notifications importantes du système</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <NotificationRow
                icon={AlertTriangle}
                title="Alertes système"
                description="Recevez des notifications pour les alertes système importantes (maintenance, mises à jour, etc.)"
                toastKey="systemAlertToast"
                emailKey="systemAlertEmail"
              />
              <Separator />
              <NotificationRow
                icon={Package}
                title="Stock bas"
                description="Recevez une notification lorsque le stock d'un produit est bas (administrateurs uniquement)"
                toastKey="stockLowToast"
                emailKey="stockLowEmail"
              />
              <Separator />
              <NotificationRow
                icon={UserPlus}
                title="Nouveau partenaire"
                description="Recevez une notification lorsqu'un nouveau partenaire s'inscrit (administrateurs uniquement)"
                toastKey="partnerNewToast"
                emailKey="partnerNewEmail"
              />
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex items-center justify-end gap-4">
            <Button variant="outline" onClick={handleReset} disabled={!hasChanges || updateMutation.isPending}>
              Annuler
            </Button>
            <Button onClick={handleSave} disabled={!hasChanges || updateMutation.isPending}>
              {updateMutation.isPending ? "Enregistrement..." : "Enregistrer les préférences"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
