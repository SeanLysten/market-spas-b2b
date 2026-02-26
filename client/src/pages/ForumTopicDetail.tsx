import { useState } from "react";
import { useLocation, useParams } from "wouter";
import { ArrowLeft, MessageSquare, CheckCircle2, ThumbsUp, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { useAuth } from "@/_core/hooks/useAuth";

export default function ForumTopicDetail() {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const [replyContent, setReplyContent] = useState("");

  const topicId = parseInt(id || "0");
  
  const { data, isLoading, refetch } = trpc.admin.forum.getTopic.useQuery(
    { id: topicId },
    { enabled: topicId > 0 }
  );

  const createReplyMutation = trpc.admin.forum.createReply.useMutation({
    onSuccess: () => {
      toast.success("Réponse ajoutée avec succès");
      setReplyContent("");
      refetch();
    },
    onError: (error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });

  const markResolvedMutation = trpc.admin.forum.markResolved.useMutation({
    onSuccess: () => {
      toast.success("Sujet marqué comme résolu");
      refetch();
    },
    onError: (error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });

  const markHelpfulMutation = trpc.admin.forum.markHelpful.useMutation({
    onSuccess: () => {
      toast.success("Réponse marquée comme utile");
      refetch();
    },
    onError: (error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });

  const handleSubmitReply = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!replyContent.trim()) {
      toast.error("La réponse ne peut pas être vide");
      return;
    }

    createReplyMutation.mutate({
      topicId,
      content: replyContent.trim(),
    });
  };

  const handleMarkResolved = () => {
    if (confirm("Marquer ce sujet comme résolu ?")) {
      markResolvedMutation.mutate({ topicId });
    }
  };

  const handleMarkHelpful = (replyId: number) => {
    markHelpfulMutation.mutate({ replyId });
  };

  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      installation: "Installation",
      maintenance: "Maintenance",
      reparation: "Réparation",
      diagnostic: "Diagnostic",
      pieces: "Pièces détachées",
      autre: "Autre",
    };
    return labels[category] || category;
  };

  const getProductCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      spas: "Spas",
      jacuzzis: "Jacuzzis",
      saunas: "Saunas",
      accessoires: "Accessoires",
      "produits-entretien": "Produits d'entretien",
    };
    return labels[category] || category;
  };

  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5 flex items-center justify-center">
        <p className="text-muted-foreground">Chargement...</p>
      </div>
    );
  }

  const { topic, replies } = data || {};
  const isResolved = topic?.status === "RESOLVED";
  const isAuthor = user?.id === topic?.authorId;

  if (!data || !topic) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5">
        <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
          <div className="container py-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLocation("/technical-resources?tab=forum")}
              className="gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Retour au forum
            </Button>
          </div>
        </header>
        <div className="container py-8 text-center">
          <p className="text-muted-foreground">Sujet non trouvé</p>
        </div>
      </div>
    );
  }



  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container py-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setLocation("/technical-resources?tab=forum")}
            className="gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Retour au forum
          </Button>
        </div>
      </header>

        <div className="container py-4 md:py-8 max-w-4xl space-y-4 md:space-y-6">
        {/* Topic */}
        <Card>
          <CardHeader>
            <div className="space-y-3">
              <div className="space-y-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant={isResolved ? "default" : "secondary"}>
                    {getCategoryLabel(topic.category || "autre")}
                  </Badge>
                  {topic.productCategory && (
                    <Badge variant="outline">
                      {getProductCategoryLabel(topic.productCategory)}
                    </Badge>
                  )}
                  {isResolved && (
                    <Badge variant="default" className="gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      Résolu
                    </Badge>
                  )}
                </div>
                <CardTitle className="text-xl md:text-2xl">{topic.title}</CardTitle>
                <CardDescription className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs sm:text-sm">
                  <span className="flex items-center gap-1">
                    <User className="w-3 h-3 sm:w-4 sm:h-4" />
                    {topic.authorName || "Utilisateur"}
                  </span>
                  <span>{formatDate(topic.createdAt)}</span>
                  <span className="flex items-center gap-1">
                    <MessageSquare className="w-3 h-3 sm:w-4 sm:h-4" />
                    {topic.replyCount || 0} réponse{(topic.replyCount || 0) > 1 ? "s" : ""}
                  </span>
                </CardDescription>
              </div>
              {!isResolved && isAuthor && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleMarkResolved}
                  disabled={markResolvedMutation.isPending}
                  className="gap-2 w-full sm:w-auto"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Marquer comme résolu
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap text-sm leading-relaxed">
              {topic.description}
            </p>
          </CardContent>
        </Card>

        {/* Replies */}
        {replies && replies.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">
                {replies.length} réponse{replies.length > 1 ? "s" : ""}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {replies.map((reply, index) => (
                <div key={reply.id}>
                  {index > 0 && <Separator className="my-6" />}
                  <div className="flex gap-4">
                    <Avatar className="w-10 h-10">
                      <AvatarFallback className={reply.isAdminReply ? "bg-primary text-primary-foreground" : ""}>
                        {getInitials(reply.authorName || "U")}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">
                          {reply.authorName || "Utilisateur"}
                        </span>
                        {reply.isAdminReply && (
                          <Badge variant="default" className="text-xs">
                            Admin
                          </Badge>
                        )}
                        {reply.isHelpful && (
                          <Badge variant="secondary" className="text-xs gap-1">
                            <ThumbsUp className="w-3 h-3" />
                            Utile
                          </Badge>
                        )}
                        <span className="text-xs text-muted-foreground">
                          {formatDate(reply.createdAt)}
                        </span>
                      </div>
                      <p className="whitespace-pre-wrap text-sm leading-relaxed">
                        {reply.content}
                      </p>
                      {!reply.isHelpful && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleMarkHelpful(reply.id)}
                          disabled={markHelpfulMutation.isPending}
                          className="gap-2 h-8 text-xs"
                        >
                          <ThumbsUp className="w-3 h-3" />
                          Marquer comme utile
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Reply Form */}
        {!isResolved && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Ajouter une réponse</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmitReply} className="space-y-4">
                <Textarea
                  placeholder="Partagez votre solution ou vos conseils..."
                  value={replyContent}
                  onChange={(e) => setReplyContent(e.target.value)}
                  rows={6}
                  className="resize-none"
                />
                <div className="flex justify-end">
                  <Button
                    type="submit"
                    disabled={createReplyMutation.isPending || !replyContent.trim()}
                  >
                    {createReplyMutation.isPending ? "Envoi..." : "Envoyer la réponse"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {isResolved && (
          <Card className="bg-muted/50">
            <CardContent className="py-4 text-center text-sm text-muted-foreground">
              <CheckCircle2 className="w-5 h-5 mx-auto mb-2 text-emerald-600 dark:text-emerald-400" />
              Ce sujet est marqué comme résolu. Les nouvelles réponses sont désactivées.
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
