import { useState, useMemo } from 'react';
import AdminLayout from '@/components/AdminLayout';
import InteractivePartnerMap from '@/components/InteractivePartnerMap';
import { trpc } from '@/lib/trpc';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Building2,
  Users,
  MapPin,
  Target,
  Filter,
  Loader2,
  Plus,
  Phone,
  Mail,
  Eye,
  EyeOff,
  Trash2,
  Search,
  ArrowUpDown,
  Upload,
  BarChart3,
  Map as MapIcon,
  TableIcon,
  Star,
  CheckCircle2,
  Clock,
  Archive,
  AlertCircle,
  Edit,
} from 'lucide-react';
import { toast } from 'sonner';

// ============================================
// TYPES & CONSTANTS
// ============================================

const STATUS_LABELS: Record<string, string> = {
  non_contacte: 'Non contacté',
  en_cours: 'En cours',
  valide: 'Validé',
  archive: 'Archivé',
};

const STATUS_COLORS: Record<string, string> = {
  non_contacte: 'bg-gray-100 text-gray-800',
  en_cours: 'bg-blue-100 text-blue-800',
  valide: 'bg-green-100 text-green-800',
  archive: 'bg-red-100 text-red-800',
};

const STATUS_ICONS: Record<string, any> = {
  non_contacte: AlertCircle,
  en_cours: Clock,
  valide: CheckCircle2,
  archive: Archive,
};

const PRIORITY_COLORS: Record<number, string> = {
  8: 'bg-red-600 text-white',
  7: 'bg-red-500 text-white',
  6: 'bg-orange-500 text-white',
  5: 'bg-orange-400 text-white',
  4: 'bg-yellow-500 text-white',
  3: 'bg-yellow-400 text-gray-900',
  2: 'bg-green-400 text-white',
  1: 'bg-green-500 text-white',
  0: 'bg-gray-300 text-gray-700',
};

const LEVEL_COLORS: Record<string, string> = {
  VIP: 'bg-violet-100 text-violet-800',
  PLATINUM: 'bg-blue-100 text-blue-800',
  GOLD: 'bg-amber-100 text-amber-800',
  SILVER: 'bg-gray-100 text-gray-800',
  BRONZE: 'bg-orange-100 text-orange-800',
};

// ============================================
// ADD CANDIDATE FORM
// ============================================

function AddCandidateForm({ onSuccess }: { onSuccess: () => void }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    companyName: '',
    fullName: '',
    city: '',
    phoneNumber: '',
    email: '',
    showroom: 'non',
    vendSpa: 'non',
    autreMarque: 'non',
    domaineSimilaire: 'non',
    notes: '',
  });

  const priorityScore = useMemo(() => {
    let score = 0;
    if (form.showroom === 'oui') score += 2;
    if (form.vendSpa === 'oui') score += 3;
    if (form.autreMarque === 'oui') score += 2;
    if (form.domaineSimilaire === 'oui') score += 1;
    return score;
  }, [form.showroom, form.vendSpa, form.autreMarque, form.domaineSimilaire]);

  const createMutation = trpc.admin.candidates.create.useMutation({
    onSuccess: () => {
      toast.success('Candidat ajouté avec succès');
      setOpen(false);
      setForm({ companyName: '', fullName: '', city: '', phoneNumber: '', email: '', showroom: 'non', vendSpa: 'non', autreMarque: 'non', domaineSimilaire: 'non', notes: '' });
      onSuccess();
    },
    onError: (err) => {
      toast.error(err.message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate({
      ...form,
      priorityScore,
      notes: form.notes || null,
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="w-4 h-4 mr-2" />
          Ajouter un candidat
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nouveau candidat partenaire</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Entreprise *</Label>
              <Input value={form.companyName} onChange={e => setForm(f => ({ ...f, companyName: e.target.value }))} required />
            </div>
            <div className="space-y-2">
              <Label>Nom complet *</Label>
              <Input value={form.fullName} onChange={e => setForm(f => ({ ...f, fullName: e.target.value }))} required />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Ville *</Label>
              <Input value={form.city} onChange={e => setForm(f => ({ ...f, city: e.target.value }))} required />
            </div>
            <div className="space-y-2">
              <Label>Téléphone *</Label>
              <Input value={form.phoneNumber} onChange={e => setForm(f => ({ ...f, phoneNumber: e.target.value }))} required />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Email *</Label>
            <Input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} required />
          </div>

          <div className="border rounded-lg p-4 space-y-3 bg-gray-50">
            <h4 className="font-semibold text-sm flex items-center gap-2">
              <Star className="w-4 h-4 text-amber-500" />
              Score de priorité : <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-sm font-bold ${PRIORITY_COLORS[priorityScore] || 'bg-gray-300'}`}>{priorityScore}</span>
            </h4>
            <div className="grid grid-cols-2 gap-3">
              {[
                { key: 'showroom', label: 'A un showroom ?', points: '+2' },
                { key: 'vendSpa', label: 'Vend déjà des spas ?', points: '+3' },
                { key: 'autreMarque', label: 'Autre marque de spa ?', points: '+2' },
                { key: 'domaineSimilaire', label: 'Domaine similaire ?', points: '+1' },
              ].map(({ key, label, points }) => (
                <div key={key} className="flex items-center justify-between p-2 bg-white rounded-lg border">
                  <div>
                    <p className="text-sm font-medium">{label}</p>
                    <p className="text-xs text-muted-foreground">{points} pts</p>
                  </div>
                  <Select value={(form as any)[key]} onValueChange={v => setForm(f => ({ ...f, [key]: v }))}>
                    <SelectTrigger className="w-20 h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="oui">Oui</SelectItem>
                      <SelectItem value="non">Non</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Notes</Label>
            <Textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={3} />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Annuler</Button>
            <Button type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Ajouter
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ============================================
// CSV IMPORT
// ============================================

function CSVImport({ onSuccess }: { onSuccess: () => void }) {
  const [open, setOpen] = useState(false);
  const importMutation = trpc.admin.candidates.importCSV.useMutation({
    onSuccess: (data) => {
      toast.success(`${data.count} candidats importés`);
      setOpen(false);
      onSuccess();
    },
    onError: (err) => {
      toast.error(err.message);
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const lines = text.split('\n').filter(l => l.trim());
      if (lines.length < 2) {
        toast.error('Le fichier CSV est vide ou invalide.');
        return;
      }

      const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
      const candidates = lines.slice(1).map(line => {
        const values = line.split(',').map(v => v.trim());
        const row: Record<string, string> = {};
        headers.forEach((h, i) => { row[h] = values[i] || ''; });

        const showroom = (row.showroom || 'non').toLowerCase() === 'oui' ? 'oui' : 'non';
        const vendSpa = (row.vendspa || row['vend_spa'] || 'non').toLowerCase() === 'oui' ? 'oui' : 'non';
        const autreMarque = (row.autremarque || row['autre_marque'] || 'non').toLowerCase() === 'oui' ? 'oui' : 'non';
        const domaineSimilaire = (row.domainesimilaire || row['domaine_similaire'] || 'non').toLowerCase() === 'oui' ? 'oui' : 'non';

        let score = 0;
        if (showroom === 'oui') score += 2;
        if (vendSpa === 'oui') score += 3;
        if (autreMarque === 'oui') score += 2;
        if (domaineSimilaire === 'oui') score += 1;

        return {
          companyName: row.companyname || row.entreprise || row.company || '',
          fullName: row.fullname || row.nom || row.name || '',
          city: row.city || row.ville || '',
          phoneNumber: row.phonenumber || row.telephone || row.phone || '',
          email: row.email || '',
          priorityScore: score,
          showroom,
          vendSpa,
          autreMarque,
          domaineSimilaire,
          notes: row.notes || null,
          status: 'non_contacte' as const,
        };
      }).filter(c => c.companyName && c.fullName && c.city);

      if (candidates.length === 0) {
        toast.error('Aucun candidat valide trouvé dans le CSV.');
        return;
      }

      importMutation.mutate({ candidates });
    };
    reader.readAsText(file);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Upload className="w-4 h-4 mr-2" />
          Import CSV
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Importer des candidats (CSV)</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Le fichier CSV doit contenir les colonnes : <strong>companyName, fullName, city, phoneNumber, email</strong>.
            Colonnes optionnelles : showroom, vendSpa, autreMarque, domaineSimilaire, notes.
          </p>
          <Input type="file" accept=".csv" onChange={handleFileChange} />
          {importMutation.isPending && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin" />
              Import en cours...
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ============================================
// CANDIDATES TABLE
// ============================================

function CandidatesTable({ candidates, onRefresh }: { candidates: any[]; onRefresh: () => void }) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortField, setSortField] = useState<string>('priorityScore');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<any>(null);

  const updateMutation = trpc.admin.candidates.update.useMutation({
    onSuccess: () => {
      toast.success('Mis à jour');
      setEditingId(null);
      setEditForm(null);
      onRefresh();
    },
  });

  const deleteMutation = trpc.admin.candidates.delete.useMutation({
    onSuccess: () => {
      toast.success('Supprimé');
      onRefresh();
    },
  });

  const incrementPhoneMutation = trpc.admin.candidates.incrementPhoneCall.useMutation({
    onSuccess: () => onRefresh(),
  });

  const incrementEmailMutation = trpc.admin.candidates.incrementEmail.useMutation({
    onSuccess: () => onRefresh(),
  });

  const toggleVisitedMutation = trpc.admin.candidates.toggleVisited.useMutation({
    onSuccess: () => onRefresh(),
  });

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDir('desc');
    }
  };

  const startEdit = (candidate: any) => {
    setEditingId(candidate.id);
    setEditForm({ ...candidate });
  };

  const saveEdit = () => {
    if (!editForm || !editingId) return;
    // Recalculate priority score
    let score = 0;
    if (editForm.showroom === 'oui') score += 2;
    if (editForm.vendSpa === 'oui') score += 3;
    if (editForm.autreMarque === 'oui') score += 2;
    if (editForm.domaineSimilaire === 'oui') score += 1;

    updateMutation.mutate({
      id: editingId,
      updates: {
        companyName: editForm.companyName,
        fullName: editForm.fullName,
        city: editForm.city,
        phoneNumber: editForm.phoneNumber,
        email: editForm.email,
        showroom: editForm.showroom,
        vendSpa: editForm.vendSpa,
        autreMarque: editForm.autreMarque,
        domaineSimilaire: editForm.domaineSimilaire,
        notes: editForm.notes || null,
        status: editForm.status,
        priorityScore: score,
      },
    });
  };

  const filtered = useMemo(() => {
    let result = [...candidates];

    // Search
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(c =>
        c.companyName.toLowerCase().includes(q) ||
        c.fullName.toLowerCase().includes(q) ||
        c.city.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q) ||
        c.phoneNumber.includes(q)
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      result = result.filter(c => c.status === statusFilter);
    }

    // Sort
    result.sort((a, b) => {
      let aVal = a[sortField];
      let bVal = b[sortField];
      if (typeof aVal === 'string') aVal = aVal.toLowerCase();
      if (typeof bVal === 'string') bVal = bVal.toLowerCase();
      if (aVal < bVal) return sortDir === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });

    return result;
  }, [candidates, search, statusFilter, sortField, sortDir]);

  const SortHeader = ({ field, children }: { field: string; children: React.ReactNode }) => (
    <TableHead className="cursor-pointer select-none hover:bg-muted/50" onClick={() => handleSort(field)}>
      <div className="flex items-center gap-1">
        {children}
        <ArrowUpDown className={`w-3 h-3 ${sortField === field ? 'text-foreground' : 'text-muted-foreground'}`} />
      </div>
    </TableHead>
  );

  return (
    <div className="space-y-4">
      {/* Search and filters */}
      <div className="flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher par nom, ville, email..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Tous les statuts" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les statuts</SelectItem>
            <SelectItem value="non_contacte">Non contacté</SelectItem>
            <SelectItem value="en_cours">En cours</SelectItem>
            <SelectItem value="valide">Validé</SelectItem>
            <SelectItem value="archive">Archivé</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <p className="text-sm text-muted-foreground">{filtered.length} candidat{filtered.length !== 1 ? 's' : ''} trouvé{filtered.length !== 1 ? 's' : ''}</p>

      {/* Table */}
      <div className="border rounded-lg overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <SortHeader field="priorityScore">Score</SortHeader>
              <SortHeader field="companyName">Entreprise</SortHeader>
              <SortHeader field="fullName">Contact</SortHeader>
              <SortHeader field="city">Ville</SortHeader>
              <SortHeader field="status">Statut</SortHeader>
              <TableHead>Critères</TableHead>
              <TableHead>Interactions</TableHead>
              <TableHead>Visité</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map(candidate => {
              const isEditing = editingId === candidate.id;

              return (
                <TableRow key={candidate.id} className={`${candidate.visited ? 'bg-green-50/50' : ''} ${isEditing ? 'bg-blue-50/50' : ''}`}>
                  {/* Priority Score */}
                  <TableCell>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${PRIORITY_COLORS[candidate.priorityScore] || 'bg-gray-300'}`}>
                      {candidate.priorityScore}
                    </div>
                  </TableCell>

                  {/* Company */}
                  <TableCell>
                    {isEditing ? (
                      <Input value={editForm.companyName} onChange={e => setEditForm((f: any) => ({ ...f, companyName: e.target.value }))} className="h-8 text-sm" />
                    ) : (
                      <div>
                        <p className="font-medium text-sm">{candidate.companyName}</p>
                        <p className="text-xs text-muted-foreground">{candidate.email}</p>
                      </div>
                    )}
                  </TableCell>

                  {/* Contact */}
                  <TableCell>
                    {isEditing ? (
                      <div className="space-y-1">
                        <Input value={editForm.fullName} onChange={e => setEditForm((f: any) => ({ ...f, fullName: e.target.value }))} className="h-8 text-sm" />
                        <Input value={editForm.phoneNumber} onChange={e => setEditForm((f: any) => ({ ...f, phoneNumber: e.target.value }))} className="h-8 text-sm" />
                      </div>
                    ) : (
                      <div>
                        <p className="text-sm">{candidate.fullName}</p>
                        <p className="text-xs text-muted-foreground">{candidate.phoneNumber}</p>
                      </div>
                    )}
                  </TableCell>

                  {/* City */}
                  <TableCell>
                    {isEditing ? (
                      <Input value={editForm.city} onChange={e => setEditForm((f: any) => ({ ...f, city: e.target.value }))} className="h-8 text-sm w-28" />
                    ) : (
                      <span className="text-sm">{candidate.city}</span>
                    )}
                  </TableCell>

                  {/* Status */}
                  <TableCell>
                    {isEditing ? (
                      <Select value={editForm.status} onValueChange={v => setEditForm((f: any) => ({ ...f, status: v }))}>
                        <SelectTrigger className="h-8 w-36 text-sm">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="non_contacte">Non contacté</SelectItem>
                          <SelectItem value="en_cours">En cours</SelectItem>
                          <SelectItem value="valide">Validé</SelectItem>
                          <SelectItem value="archive">Archivé</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <Badge className={STATUS_COLORS[candidate.status] || 'bg-gray-100'}>
                        {STATUS_LABELS[candidate.status] || candidate.status}
                      </Badge>
                    )}
                  </TableCell>

                  {/* Criteria */}
                  <TableCell>
                    {isEditing ? (
                      <div className="grid grid-cols-2 gap-1">
                        {['showroom', 'vendSpa', 'autreMarque', 'domaineSimilaire'].map(key => (
                          <Select key={key} value={editForm[key]} onValueChange={v => setEditForm((f: any) => ({ ...f, [key]: v }))}>
                            <SelectTrigger className="h-7 text-xs w-16">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="oui">Oui</SelectItem>
                              <SelectItem value="non">Non</SelectItem>
                            </SelectContent>
                          </Select>
                        ))}
                      </div>
                    ) : (
                      <div className="flex flex-wrap gap-1">
                        {candidate.showroom === 'oui' && <Badge variant="outline" className="text-xs">Showroom</Badge>}
                        {candidate.vendSpa === 'oui' && <Badge variant="outline" className="text-xs">Vend Spa</Badge>}
                        {candidate.autreMarque === 'oui' && <Badge variant="outline" className="text-xs">Autre marque</Badge>}
                        {candidate.domaineSimilaire === 'oui' && <Badge variant="outline" className="text-xs">Similaire</Badge>}
                        {candidate.showroom !== 'oui' && candidate.vendSpa !== 'oui' && candidate.autreMarque !== 'oui' && candidate.domaineSimilaire !== 'oui' && (
                          <span className="text-xs text-muted-foreground">Aucun</span>
                        )}
                      </div>
                    )}
                  </TableCell>

                  {/* Interactions */}
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2 text-xs"
                        onClick={() => incrementPhoneMutation.mutate({ candidateId: candidate.id })}
                        title="Incrémenter appels"
                      >
                        <Phone className="w-3 h-3 mr-1" />
                        {candidate.phoneCallsCount}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2 text-xs"
                        onClick={() => incrementEmailMutation.mutate({ candidateId: candidate.id })}
                        title="Incrémenter emails"
                      >
                        <Mail className="w-3 h-3 mr-1" />
                        {candidate.emailsSentCount}
                      </Button>
                    </div>
                  </TableCell>

                  {/* Visited */}
                  <TableCell>
                    <Button
                      variant={candidate.visited ? "default" : "outline"}
                      size="sm"
                      className={`h-7 text-xs ${candidate.visited ? 'bg-green-600 hover:bg-green-700' : ''}`}
                      onClick={() => toggleVisitedMutation.mutate({ candidateId: candidate.id, visited: !candidate.visited })}
                    >
                      {candidate.visited ? <Eye className="w-3 h-3 mr-1" /> : <EyeOff className="w-3 h-3 mr-1" />}
                      {candidate.visited ? 'Visité' : 'Non'}
                    </Button>
                  </TableCell>

                  {/* Actions */}
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      {isEditing ? (
                        <>
                          <Button size="sm" className="h-7 text-xs" onClick={saveEdit} disabled={updateMutation.isPending}>
                            {updateMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Sauver'}
                          </Button>
                          <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => { setEditingId(null); setEditForm(null); }}>
                            Annuler
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => startEdit(candidate)} title="Modifier">
                            <Edit className="w-3.5 h-3.5" />
                          </Button>
                          <a href={`tel:${candidate.phoneNumber}`} title="Appeler">
                            <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-blue-600">
                              <Phone className="w-3.5 h-3.5" />
                            </Button>
                          </a>
                          <a href={`mailto:${candidate.email}`} title="Email">
                            <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-blue-600">
                              <Mail className="w-3.5 h-3.5" />
                            </Button>
                          </a>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0 text-red-600 hover:text-red-700"
                            onClick={() => {
                              if (confirm('Supprimer ce candidat ?')) {
                                deleteMutation.mutate({ id: candidate.id });
                              }
                            }}
                            title="Supprimer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}

            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                  Aucun candidat trouvé
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

// ============================================
// STATISTICS TAB
// ============================================

function StatsTab({ candidates }: { candidates: any[] }) {
  const total = candidates.length;
  const byStatus = {
    non_contacte: candidates.filter(c => c.status === 'non_contacte').length,
    en_cours: candidates.filter(c => c.status === 'en_cours').length,
    valide: candidates.filter(c => c.status === 'valide').length,
    archive: candidates.filter(c => c.status === 'archive').length,
  };
  const visited = candidates.filter(c => c.visited).length;
  const avgScore = total > 0 ? (candidates.reduce((sum, c) => sum + c.priorityScore, 0) / total).toFixed(1) : '0';
  const highPriority = candidates.filter(c => c.priorityScore >= 6).length;
  const totalCalls = candidates.reduce((sum, c) => sum + (c.phoneCallsCount || 0), 0);
  const totalEmails = candidates.reduce((sum, c) => sum + (c.emailsSentCount || 0), 0);

  const conversionRate = total > 0 ? ((byStatus.valide / total) * 100).toFixed(1) : '0';

  // Priority distribution
  const priorityDist = Array.from({ length: 9 }, (_, i) => ({
    score: i,
    count: candidates.filter(c => c.priorityScore === i).length,
  }));

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Total candidats</p>
            <p className="text-3xl font-bold">{total}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Taux de conversion</p>
            <p className="text-3xl font-bold text-green-600">{conversionRate}%</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Score moyen</p>
            <p className="text-3xl font-bold text-amber-600">{avgScore}/8</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Haute priorité (6+)</p>
            <p className="text-3xl font-bold text-red-600">{highPriority}</p>
          </CardContent>
        </Card>
      </div>

      {/* Status breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Répartition par statut</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(byStatus).map(([status, count]) => {
              const Icon = STATUS_ICONS[status] || AlertCircle;
              const pct = total > 0 ? ((count / total) * 100).toFixed(0) : '0';
              return (
                <div key={status} className="text-center p-4 rounded-lg border">
                  <Icon className="w-6 h-6 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-2xl font-bold">{count}</p>
                  <p className="text-sm text-muted-foreground">{STATUS_LABELS[status]}</p>
                  <p className="text-xs text-muted-foreground mt-1">{pct}%</p>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Activity & Priority */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Activité commerciale</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-blue-600" />
                <span className="text-sm">Appels passés</span>
              </div>
              <span className="font-bold">{totalCalls}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-blue-600" />
                <span className="text-sm">Emails envoyés</span>
              </div>
              <span className="font-bold">{totalEmails}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4 text-green-600" />
                <span className="text-sm">Visites effectuées</span>
              </div>
              <span className="font-bold">{visited} / {total}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Répartition par priorité</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {priorityDist.filter(d => d.count > 0).sort((a, b) => b.score - a.score).map(d => {
                const maxCount = Math.max(...priorityDist.map(x => x.count), 1);
                const pct = (d.count / maxCount) * 100;
                return (
                  <div key={d.score} className="flex items-center gap-3">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${PRIORITY_COLORS[d.score]}`}>
                      {d.score}
                    </div>
                    <div className="flex-1">
                      <div className="h-6 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${d.score >= 6 ? 'bg-red-400' : d.score >= 4 ? 'bg-amber-400' : 'bg-green-400'}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                    <span className="text-sm font-medium w-8 text-right">{d.count}</span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// ============================================
// MAIN PAGE
// ============================================

export default function AdminPartnerMap() {
  const [activeTab, setActiveTab] = useState('carte');
  const [filter, setFilter] = useState<'all' | 'partners' | 'leads' | 'candidates'>('all');
  const [partnerStatusFilter, setPartnerStatusFilter] = useState('all');
  const [leadStatusFilter, setLeadStatusFilter] = useState('all');

  const { data: mapData, isLoading: mapLoading } = trpc.admin.territories.mapData.useQuery();
  const { data: candidates, isLoading: candidatesLoading, refetch: refetchCandidates } = trpc.admin.candidates.list.useQuery();

  const partners = mapData?.partners || [];
  const leads = mapData?.leads || [];
  const territories = mapData?.territories || [];

  const candidatesList = candidates || [];

  // Stats
  const approvedPartners = partners.filter((p: any) => p.status === 'APPROVED').length;
  const pendingPartners = partners.filter((p: any) => p.status === 'PENDING').length;
  const totalLeads = leads.length;
  const totalCandidates = candidatesList.length;
  const highPriorityCandidates = candidatesList.filter((c: any) => c.priorityScore >= 6).length;

  const isLoading = mapLoading || candidatesLoading;

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Carte du Réseau</h1>
            <p className="text-muted-foreground mt-1">
              Gérez vos partenaires, candidats et leads sur une carte interactive
            </p>
          </div>
          <div className="flex items-center gap-2">
            <CSVImport onSuccess={() => refetchCandidates()} />
            <AddCandidateForm onSuccess={() => refetchCandidates()} />
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Building2 className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Partenaires actifs</p>
                  <p className="text-2xl font-bold">{approvedPartners}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-100 rounded-lg">
                  <Building2 className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">En attente</p>
                  <p className="text-2xl font-bold">{pendingPartners}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Target className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Leads</p>
                  <p className="text-2xl font-bold">{totalLeads}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Users className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Candidats</p>
                  <p className="text-2xl font-bold">{totalCandidates}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-100 rounded-lg">
                  <Star className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Haute priorité</p>
                  <p className="text-2xl font-bold">{highPriorityCandidates}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs: Carte / Tableau / Statistiques */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="carte" className="flex items-center gap-2">
              <MapIcon className="w-4 h-4" />
              Carte
            </TabsTrigger>
            <TabsTrigger value="tableau" className="flex items-center gap-2">
              <TableIcon className="w-4 h-4" />
              Tableau
            </TabsTrigger>
            <TabsTrigger value="stats" className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              Statistiques
            </TabsTrigger>
          </TabsList>

          {/* CARTE TAB */}
          <TabsContent value="carte">
            <Card>
              <CardHeader className="pb-4">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="w-5 h-5" />
                    Carte Interactive
                  </CardTitle>
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="flex items-center gap-2">
                      <Filter className="w-4 h-4 text-muted-foreground" />
                      <Select value={filter} onValueChange={(v) => setFilter(v as any)}>
                        <SelectTrigger className="w-[160px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Tout afficher</SelectItem>
                          <SelectItem value="partners">Partenaires</SelectItem>
                          <SelectItem value="leads">Leads</SelectItem>
                          <SelectItem value="candidates">Candidats</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {(filter === 'all' || filter === 'partners') && (
                      <Select value={partnerStatusFilter} onValueChange={setPartnerStatusFilter}>
                        <SelectTrigger className="w-[160px]">
                          <SelectValue placeholder="Statut partenaire" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Tous les statuts</SelectItem>
                          <SelectItem value="APPROVED">Approuvés</SelectItem>
                          <SelectItem value="PENDING">En attente</SelectItem>
                          <SelectItem value="SUSPENDED">Suspendus</SelectItem>
                          <SelectItem value="TERMINATED">Résiliés</SelectItem>
                        </SelectContent>
                      </Select>
                    )}

                    {(filter === 'all' || filter === 'leads') && (
                      <Select value={leadStatusFilter} onValueChange={setLeadStatusFilter}>
                        <SelectTrigger className="w-[160px]">
                          <SelectValue placeholder="Statut lead" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Tous les leads</SelectItem>
                          <SelectItem value="NEW">Nouveaux</SelectItem>
                          <SelectItem value="CONTACTED">Contactés</SelectItem>
                          <SelectItem value="QUALIFIED">Qualifiés</SelectItem>
                          <SelectItem value="WON">Gagnés</SelectItem>
                          <SelectItem value="LOST">Perdus</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {isLoading ? (
                  <div className="flex items-center justify-center h-[600px]">
                    <div className="text-center space-y-3">
                      <Loader2 className="w-8 h-8 animate-spin mx-auto text-muted-foreground" />
                      <p className="text-muted-foreground">Chargement des données...</p>
                    </div>
                  </div>
                ) : (
                  <div className="h-[600px] md:h-[700px]">
                    <InteractivePartnerMap
                      partners={partners}
                      leads={leads}
                      territories={territories}
                      candidates={candidatesList}
                      filter={filter}
                      partnerStatusFilter={partnerStatusFilter}
                      leadStatusFilter={leadStatusFilter}
                    />
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Legend */}
            <Card className="mt-4">
              <CardHeader>
                <CardTitle className="text-base">Légende</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Priority scores */}
                  <div>
                    <h4 className="font-semibold text-sm mb-3 text-muted-foreground uppercase tracking-wide">Score de priorité (candidats)</h4>
                    <div className="flex flex-wrap gap-2">
                      {[8, 7, 6, 5, 4, 3, 2, 1].map(score => (
                        <div key={score} className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${PRIORITY_COLORS[score]}`}>
                          {score}
                        </div>
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">8 = priorité maximale (contacter absolument)</p>
                  </div>

                  {/* Partner levels */}
                  <div>
                    <h4 className="font-semibold text-sm mb-3 text-muted-foreground uppercase tracking-wide">Niveaux Partenaires</h4>
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(LEVEL_COLORS).map(([level, classes]) => (
                        <Badge key={level} className={classes}>
                          {level}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* Candidate statuses */}
                  <div>
                    <h4 className="font-semibold text-sm mb-3 text-muted-foreground uppercase tracking-wide">Statut Candidats</h4>
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(STATUS_LABELS).map(([status, label]) => (
                        <Badge key={status} className={STATUS_COLORS[status]}>
                          {label}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* TABLEAU TAB */}
          <TabsContent value="tableau">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TableIcon className="w-5 h-5" />
                  Candidats Partenaires
                </CardTitle>
              </CardHeader>
              <CardContent>
                {candidatesLoading ? (
                  <div className="flex items-center justify-center h-40">
                    <Loader2 className="w-6 h-6 animate-spin" />
                  </div>
                ) : (
                  <CandidatesTable candidates={candidatesList} onRefresh={() => refetchCandidates()} />
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* STATISTIQUES TAB */}
          <TabsContent value="stats">
            {candidatesLoading ? (
              <div className="flex items-center justify-center h-40">
                <Loader2 className="w-6 h-6 animate-spin" />
              </div>
            ) : (
              <StatsTab candidates={candidatesList} />
            )}
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}
