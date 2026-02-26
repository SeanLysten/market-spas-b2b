import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Mail, Copy, CheckCircle2, AlertCircle } from "lucide-react";


export default function InvitePartner() {
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [invitationUrl, setInvitationUrl] = useState("");
  const [expiresAt, setExpiresAt] = useState<Date | null>(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  const inviteMutation = trpc.admin.users.invite.useMutation({
    onSuccess: (data) => {
      setInvitationUrl(data.invitationUrl);
      setExpiresAt(data.expiresAt);
      setIsLoading(false);
      setSuccessMessage(`L'invitation pour ${email} a été générée avec succès.`);
      setTimeout(() => setSuccessMessage(""), 5000);
    },
    onError: (err) => {
      setError(err.message);
      setIsLoading(false);
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setInvitationUrl("");
    setExpiresAt(null);
    setIsLoading(true);

    inviteMutation.mutate({
      email,
      firstName: firstName || undefined,
      lastName: lastName || undefined,
    });
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(invitationUrl);
    setSuccessMessage("Le lien d'invitation a été copié dans le presse-papiers");
    setTimeout(() => setSuccessMessage(""), 3000);
  };

  const handleReset = () => {
    setEmail("");
    setFirstName("");
    setLastName("");
    setInvitationUrl("");
    setExpiresAt(null);
    setError("");
  };

  return (
    <div className="container max-w-4xl py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Inviter un partenaire</h1>
        <p className="text-muted-foreground dark:text-muted-foreground mt-2">
          Créez une invitation sécurisée pour permettre à un nouveau partenaire de créer son compte
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Formulaire d'invitation */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Nouvelle invitation
            </CardTitle>
            <CardDescription>
              Entrez l'adresse email du partenaire à inviter
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              
              {successMessage && (
                <Alert className="bg-emerald-500/10 dark:bg-emerald-500/20 border-emerald-500/20 dark:border-emerald-500/30">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                  <AlertDescription className="text-emerald-800 dark:text-emerald-400">{successMessage}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">Adresse email *</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="partenaire@exemple.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="firstName">Prénom (optionnel)</Label>
                <Input
                  id="firstName"
                  type="text"
                  placeholder="Jean"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="lastName">Nom (optionnel)</Label>
                <Input
                  id="lastName"
                  type="text"
                  placeholder="Dupont"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  disabled={isLoading}
                />
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Génération en cours...
                  </>
                ) : (
                  <>
                    <Mail className="mr-2 h-4 w-4" />
                    Générer l'invitation
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Résultat de l'invitation */}
        <Card className={invitationUrl ? "border-emerald-500/20 dark:border-emerald-500/30 bg-emerald-500/10 dark:bg-emerald-500/20" : ""}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {invitationUrl ? (
                <>
                  <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                  Invitation générée
                </>
              ) : (
                <>
                  <AlertCircle className="h-5 w-5 text-gray-400" />
                  En attente
                </>
              )}
            </CardTitle>
            <CardDescription>
              {invitationUrl
                ? "Copiez et envoyez ce lien au partenaire"
                : "Le lien d'invitation apparaîtra ici"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {invitationUrl ? (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Lien d'invitation</Label>
                  <div className="flex gap-2">
                    <Input
                      value={invitationUrl}
                      readOnly
                      className="font-mono text-sm"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={handleCopyLink}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {expiresAt && (
                  <Alert>
                    <AlertDescription>
                      <strong>Expire le :</strong>{" "}
                      {new Date(expiresAt).toLocaleDateString("fr-FR", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </AlertDescription>
                  </Alert>
                )}

                <div className="pt-4 border-t">
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    onClick={handleReset}
                  >
                    Créer une nouvelle invitation
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-400">
                <Mail className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Aucune invitation générée</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Instructions */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Comment ça fonctionne ?</CardTitle>
        </CardHeader>
        <CardContent className="prose prose-sm max-w-none">
          <ol className="space-y-2">
            <li>
              <strong>Générez l'invitation</strong> : Entrez l'email du partenaire et cliquez sur "Générer l'invitation"
            </li>
            <li>
              <strong>Copiez le lien</strong> : Un lien unique et sécurisé sera généré automatiquement
            </li>
            <li>
              <strong>Envoyez le lien</strong> : Transmettez ce lien au partenaire par email ou tout autre moyen sécurisé
            </li>
            <li>
              <strong>Le partenaire s'inscrit</strong> : En cliquant sur le lien, il accédera au formulaire d'inscription
            </li>
          </ol>
          
          <div className="mt-4 p-4 bg-info/10 dark:bg-info-light border border-info/20 dark:border-info/30 rounded-lg">
            <p className="text-sm text-blue-900 mb-0">
              <strong>🔒 Sécurité :</strong> Le lien est valable 7 jours et ne peut être utilisé qu'une seule fois. 
              Il est lié à l'adresse email spécifiée et ne peut pas être transféré à une autre personne.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
