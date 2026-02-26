import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock, CheckCircle2, Mail, ArrowLeft } from "lucide-react";
import { Link } from "wouter";

export default function PartnerPending() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5 flex items-center justify-center p-4">
      <Card className="max-w-lg w-full">
        <CardHeader className="text-center">
          <div className="w-20 h-20 rounded-full bg-amber-500/15 dark:bg-amber-500/25 flex items-center justify-center mx-auto mb-4">
            <Clock className="w-10 h-10 text-amber-600" />
          </div>
          <CardTitle className="text-2xl text-display text-display">Demande en cours de traitement</CardTitle>
          <CardDescription>
            Votre demande de partenariat a été envoyée avec succès
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-muted/50 rounded-lg p-4 space-y-4">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 mt-0.5" />
              <div>
                <p className="font-medium">Demande reçue</p>
                <p className="text-xs md:text-sm text-muted-foreground">
                  Nous avons bien reçu votre demande de partenariat.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Clock className="w-5 h-5 text-amber-600 mt-0.5" />
              <div>
                <p className="font-medium">En cours de vérification</p>
                <p className="text-xs md:text-sm text-muted-foreground">
                  Notre équipe examine actuellement votre dossier. Ce processus prend généralement 24 à 48 heures ouvrées.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Mail className="w-5 h-5 text-info dark:text-info-dark mt-0.5" />
              <div>
                <p className="font-medium">Notification par email</p>
                <p className="text-xs md:text-sm text-muted-foreground">
                  Vous recevrez un email dès que votre compte sera activé.
                </p>
              </div>
            </div>
          </div>

          <div className="text-center text-sm text-muted-foreground">
            <p>
              Une question ? Contactez-nous à{" "}
              <a href="mailto:partners@marketspas.be" className="text-primary hover:underline">
                partners@marketspas.be
              </a>
            </p>
          </div>

          <Link href="/">
            <Button variant="outline" className="w-full gap-2">
              <ArrowLeft className="w-4 h-4" />
              Retour à l'accueil
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
