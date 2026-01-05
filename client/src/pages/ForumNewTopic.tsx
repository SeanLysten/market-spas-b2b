import { useState } from "react";
import { useLocation } from "wouter";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

export default function ForumNewTopic() {
  const [, setLocation] = useLocation();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [productCategory, setProductCategory] = useState("");

  const createTopicMutation = trpc.admin.forum.createTopic.useMutation({
    onSuccess: () => {
      toast.success("Sujet créé avec succès");
      setLocation("/technical-resources?tab=forum");
    },
    onError: (error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim()) {
      toast.error("Le titre est requis");
      return;
    }
    
    if (!description.trim()) {
      toast.error("La description est requise");
      return;
    }
    
    if (!category) {
      toast.error("La catégorie est requise");
      return;
    }

    createTopicMutation.mutate({
      title: title.trim(),
      description: description.trim(),
      category,
      productCategory: productCategory || undefined,
    });
  };

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

      <div className="container py-8 max-w-3xl">
        <Card>
          <CardHeader>
            <CardTitle>Créer un nouveau sujet</CardTitle>
            <CardDescription>
              Posez une question ou partagez une information technique avec la communauté
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="title">Titre du sujet *</Label>
                <Input
                  id="title"
                  placeholder="Ex: Problème de chauffage sur modèle X200"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  maxLength={200}
                />
                <p className="text-xs text-muted-foreground">
                  {title.length}/200 caractères
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  placeholder="Décrivez votre question ou problème en détail..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={8}
                  className="resize-none"
                />
                <p className="text-xs text-muted-foreground">
                  Soyez aussi précis que possible pour obtenir des réponses pertinentes
                </p>
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="category">Catégorie *</Label>
                  <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger id="category">
                      <SelectValue placeholder="Sélectionner une catégorie" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="installation">Installation</SelectItem>
                      <SelectItem value="maintenance">Maintenance</SelectItem>
                      <SelectItem value="reparation">Réparation</SelectItem>
                      <SelectItem value="diagnostic">Diagnostic</SelectItem>
                      <SelectItem value="pieces">Pièces détachées</SelectItem>
                      <SelectItem value="autre">Autre</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="productCategory">Catégorie de produit</Label>
                  <Select value={productCategory} onValueChange={setProductCategory}>
                    <SelectTrigger id="productCategory">
                      <SelectValue placeholder="Optionnel" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="spas">Spas</SelectItem>
                      <SelectItem value="jacuzzis">Jacuzzis</SelectItem>
                      <SelectItem value="saunas">Saunas</SelectItem>
                      <SelectItem value="accessoires">Accessoires</SelectItem>
                      <SelectItem value="produits-entretien">Produits d'entretien</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setLocation("/technical-resources?tab=forum")}
                  className="flex-1"
                >
                  Annuler
                </Button>
                <Button
                  type="submit"
                  disabled={createTopicMutation.isPending}
                  className="flex-1"
                >
                  {createTopicMutation.isPending ? "Création..." : "Créer le sujet"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
