import React, { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { userService, type UserFormData } from "@/services/userService";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PlusCircle, Edit, Trash2, User as UserIcon, KeyRound } from "lucide-react";
import { User } from "@/types";

// New-user form state — password is only kept in component state and sent
// straight to Supabase Auth via userService.createUser. It never touches
// the users_atelier profile table.
const blankNewUser: UserFormData = {
  email:    "",
  password: "",
  name:     "",
  lastName: "",
  role:     "viewer",
};

export const UsersPage: React.FC = () => {
  const { toast } = useToast();

  const [users,   setUsers]   = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving,  setSaving]  = useState(false);

  // Add-user dialog
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newUser, setNewUser] = useState<UserFormData>(blankNewUser);

  // Edit-user dialog
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  // Reset-password dialog
  const [isResetDialogOpen, setIsResetDialogOpen] = useState(false);
  const [resetTarget, setResetTarget] = useState<User | null>(null);
  const [newPassword, setNewPassword] = useState("");

  // ── Load users ────────────────────────────────────────────────────────────
  const fetchUsers = async () => {
    setLoading(true);
    try {
      const data = await userService.getUsers();
      setUsers(data);
    } catch (err) {
      console.error(err);
      toast({
        title: "Erreur",
        description: "Erreur lors du chargement des utilisateurs.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
    // fetchUsers is a stable closure — safe to omit dependency.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Add user ──────────────────────────────────────────────────────────────
  const handleAddUser = async () => {
    if (!newUser.email || !newUser.password || !newUser.name || !newUser.lastName) {
      toast({
        title: "Erreur",
        description: "Veuillez remplir tous les champs obligatoires.",
        variant: "destructive",
      });
      return;
    }
    if (newUser.password.length < 6) {
      toast({
        title: "Erreur",
        description: "Le mot de passe doit contenir au moins 6 caractères.",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      const created = await userService.createUser(newUser);
      setUsers((prev) => [...prev, created]);
      toast({ title: "Succès", description: "Utilisateur ajouté avec succès." });
      setIsAddDialogOpen(false);
      setNewUser(blankNewUser);
    } catch (err) {
      console.error(err);
      toast({
        title: "Erreur",
        description: err instanceof Error ? err.message : "Erreur lors de l'ajout.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  // ── Edit user ─────────────────────────────────────────────────────────────
  const handleUpdateUser = async () => {
    if (!currentUser?.id || !currentUser.email || !currentUser.name || !currentUser.lastName) {
      toast({
        title: "Erreur",
        description: "Veuillez remplir tous les champs obligatoires.",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      const updated = await userService.updateUser(currentUser.id, {
        email:    currentUser.email,
        name:     currentUser.name,
        lastName: currentUser.lastName,
        role:     currentUser.role,
      });
      setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));
      toast({ title: "Succès", description: "Utilisateur mis à jour." });
      setIsEditDialogOpen(false);
      setCurrentUser(null);
    } catch (err) {
      console.error(err);
      toast({
        title: "Erreur",
        description: err instanceof Error ? err.message : "Erreur lors de la mise à jour.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  // ── Delete user ───────────────────────────────────────────────────────────
  const handleDeleteUser = async (userId: string) => {
    setSaving(true);
    try {
      await userService.deleteUser(userId);
      setUsers((prev) => prev.filter((u) => u.id !== userId));
      toast({ title: "Succès", description: "Utilisateur supprimé." });
    } catch (err) {
      console.error(err);
      toast({
        title: "Erreur",
        description: err instanceof Error ? err.message : "Erreur lors de la suppression.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  // ── Reset password ────────────────────────────────────────────────────────
  const handleResetPassword = async () => {
    if (!resetTarget?.id) return;
    if (newPassword.length < 6) {
      toast({
        title: "Erreur",
        description: "Le mot de passe doit contenir au moins 6 caractères.",
        variant: "destructive",
      });
      return;
    }
    setSaving(true);
    try {
      await userService.resetPassword(resetTarget.id, newPassword);
      toast({ title: "Succès", description: "Mot de passe mis à jour." });
      setIsResetDialogOpen(false);
      setResetTarget(null);
      setNewPassword("");
    } catch (err) {
      console.error(err);
      toast({
        title: "Erreur",
        description: err instanceof Error ? err.message : "Erreur lors du changement de mot de passe.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-automotive-dark flex items-center gap-2">
          <UserIcon className="h-7 w-7" /> Gestion des Utilisateurs
        </h1>

        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-red-500 text-white hover:bg-red-500/90">
              <PlusCircle className="mr-2 h-4 w-4" /> Ajouter Utilisateur
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Ajouter un nouvel utilisateur</DialogTitle>
              <DialogDescription>
                Le compte sera créé dans Supabase Auth, et son profil sera lié dans <code>users_atelier</code>.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="new-name" className="text-right">Nom</Label>
                <Input
                  id="new-name"
                  value={newUser.name}
                  onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="new-lastName" className="text-right">Prénom</Label>
                <Input
                  id="new-lastName"
                  value={newUser.lastName}
                  onChange={(e) => setNewUser({ ...newUser, lastName: e.target.value })}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="new-email" className="text-right">Email</Label>
                <Input
                  id="new-email"
                  type="email"
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="new-password" className="text-right">Mot de passe</Label>
                <Input
                  id="new-password"
                  type="password"
                  value={newUser.password}
                  onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                  className="col-span-3"
                  placeholder="Min. 6 caractères"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="new-role" className="text-right">Rôle</Label>
                <select
                  id="new-role"
                  value={newUser.role}
                  onChange={(e) =>
                    setNewUser({ ...newUser, role: e.target.value as User["role"] })
                  }
                  className="col-span-3 border border-gray-300 rounded-md p-2"
                >
                  <option value="viewer">Visualiseur</option>
                  <option value="reception">Réception</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
            </div>
            <DialogFooter>
              <Button
                onClick={handleAddUser}
                disabled={saving}
                className="bg-red-500 text-white hover:bg-red-500/90"
              >
                {saving ? "Ajout en cours..." : "Ajouter"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="shadow-card">
        <CardHeader>
          <CardTitle>Liste des utilisateurs</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">
              Chargement des utilisateurs...
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Aucun utilisateur trouvé.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nom</TableHead>
                  <TableHead>Prénom</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Rôle</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.name}</TableCell>
                    <TableCell>{user.lastName}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>{user.role}</TableCell>
                    <TableCell className="text-right">
                      {/* Edit */}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setCurrentUser(user);
                          setIsEditDialogOpen(true);
                        }}
                        className="mr-1"
                        title="Modifier"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>

                      {/* Reset password */}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setResetTarget(user);
                          setNewPassword("");
                          setIsResetDialogOpen(true);
                        }}
                        className="mr-1"
                        title="Réinitialiser le mot de passe"
                      >
                        <KeyRound className="h-4 w-4" />
                      </Button>

                      {/* Delete */}
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="destructive" size="sm" title="Supprimer">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Êtes-vous absolument sûr ?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Cette action supprimera définitivement l'utilisateur de Supabase Auth.
                              Son profil dans <code>users_atelier</code> sera également effacé automatiquement.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Annuler</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDeleteUser(user.id)}
                              className="bg-red-500 hover:bg-red-600"
                            >
                              Supprimer
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* ── Edit dialog (rendered once, outside the table) ─────────────────── */}
      <Dialog
        open={isEditDialogOpen}
        onOpenChange={(open) => {
          setIsEditDialogOpen(open);
          if (!open) setCurrentUser(null);
        }}
      >
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Modifier l'utilisateur</DialogTitle>
            <DialogDescription>
              Modifie le profil. Le mot de passe se change séparément via l'icône clé.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-name" className="text-right">Nom</Label>
              <Input
                id="edit-name"
                value={currentUser?.name ?? ""}
                onChange={(e) =>
                  setCurrentUser((u) => (u ? { ...u, name: e.target.value } : u))
                }
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-lastName" className="text-right">Prénom</Label>
              <Input
                id="edit-lastName"
                value={currentUser?.lastName ?? ""}
                onChange={(e) =>
                  setCurrentUser((u) => (u ? { ...u, lastName: e.target.value } : u))
                }
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-email" className="text-right">Email</Label>
              <Input
                id="edit-email"
                type="email"
                value={currentUser?.email ?? ""}
                onChange={(e) =>
                  setCurrentUser((u) => (u ? { ...u, email: e.target.value } : u))
                }
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-role" className="text-right">Rôle</Label>
              <select
                id="edit-role"
                value={currentUser?.role ?? "viewer"}
                onChange={(e) =>
                  setCurrentUser((u) =>
                    u ? { ...u, role: e.target.value as User["role"] } : u,
                  )
                }
                className="col-span-3 border border-gray-300 rounded-md p-2"
              >
                <option value="viewer">Visualiseur</option>
                <option value="reception">Réception</option>
                <option value="admin">Admin</option>
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button
              onClick={handleUpdateUser}
              disabled={saving}
              className="bg-red-500 text-white hover:bg-red-500/90"
            >
              {saving ? "Mise à jour..." : "Mettre à jour"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Reset-password dialog ─────────────────────────────────────────── */}
      <Dialog
        open={isResetDialogOpen}
        onOpenChange={(open) => {
          setIsResetDialogOpen(open);
          if (!open) {
            setResetTarget(null);
            setNewPassword("");
          }
        }}
      >
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Réinitialiser le mot de passe</DialogTitle>
            <DialogDescription>
              Nouveau mot de passe pour <strong>{resetTarget?.email}</strong>.
              La modification s'applique immédiatement dans Supabase Auth.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-2 py-4">
            <Label htmlFor="reset-password">Nouveau mot de passe</Label>
            <Input
              id="reset-password"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Min. 6 caractères"
            />
          </div>
          <DialogFooter>
            <Button
              onClick={handleResetPassword}
              disabled={saving}
              className="bg-red-500 text-white hover:bg-red-500/90"
            >
              {saving ? "Mise à jour..." : "Mettre à jour"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
