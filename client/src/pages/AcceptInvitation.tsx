import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { CheckCircle2, XCircle, Loader2, Mail } from "lucide-react";

export default function AcceptInvitation() {
  const [, setLocation] = useLocation();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");

  // Get token from URL
  const urlParams = new URLSearchParams(window.location.search);
  const token = urlParams.get("token");

  const acceptMutation = trpc.team.acceptInvitation.useMutation({
    onSuccess: () => {
      setStatus("success");
      setMessage("Invitation acceptée avec succès ! Vous pouvez maintenant vous connecter.");
      setTimeout(() => {
        setLocation("/");
      }, 3000);
    },
    onError: (error) => {
      setStatus("error");
      setMessage(error.message || "Une erreur est survenue lors de l'acceptation de l'invitation");
    },
  });

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setMessage("Token d'invitation manquant");
      return;
    }

    // Accept invitation
    acceptMutation.mutate({ token });
  }, [token]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            {status === "loading" && (
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
              </div>
            )}
            {status === "success" && (
              <div className="w-16 h-16 rounded-full bg-emerald-500/15 dark:bg-emerald-500/25 flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
              </div>
            )}
            {status === "error" && (
              <div className="w-16 h-16 rounded-full bg-destructive/15 dark:bg-destructive/25 flex items-center justify-center">
                <XCircle className="w-8 h-8 text-destructive dark:text-destructive" />
              </div>
            )}
          </div>
          <CardTitle>
            {status === "loading" && "Acceptation de l'invitation..."}
            {status === "success" && "Invitation acceptée !"}
            {status === "error" && "Erreur"}
          </CardTitle>
          <CardDescription>{message}</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center">
          {status === "success" && (
            <Button onClick={() => setLocation("/")}>
              Aller au portail
            </Button>
          )}
          {status === "error" && (
            <Button variant="outline" onClick={() => setLocation("/")}>
              Retour à l'accueil
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
