import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useToast } from "@/hooks/use-toast";
// import bcrypt from "bcryptjs";
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
import { PlusCircle, Edit, Trash2, User as UserIcon } from "lucide-react";
import { User } from "@/types";

export const UsersPage: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddUserDialogOpen, setIsAddUserDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<Partial<User> | null>(null);
  const [newUser, setNewUser] = useState<Partial<User>>({
    email: "",
    password: "", // Assuming password will be handled for new users, though not explicitly in current User type
    name: "",
    lastName: "",
    role: "viewer",
  });
  const { toast } = useToast();

  const fetchUsers = async () => {
    setLoading(true);
    const { data, error } = await supabase.from("users_atelier").select("*");
    if (error) {
      toast({
        title: "Erreur",
        description: "Erreur lors du chargement des utilisateurs.",
        variant: "destructive",
      });
      console.error(error);
    } else {
      setUsers(data as User[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleAddUser = async () => {
    if (
      !newUser.email ||
      !newUser.password ||
      !newUser.name ||
      !newUser.lastName
    ) {
      toast({
        title: "Erreur",
        description: "Veuillez remplir tous les champs obligatoires.",
        variant: "destructive",
      });
      return;
    }
    setLoading(true);
    // const hashedPassword = await bcrypt.hash(newUser.password, 10);
    const { data, error } = await supabase
      .from("users_atelier")
      .insert([newUser])
      .select();

    if (error) {
      toast({
        title: "Erreur",
        description: "Erreur lors de l'ajout de l'utilisateur.",
        variant: "destructive",
      });
      console.error(error);
    } else {
      setUsers((prev) => [...prev, data[0] as User]);
      toast({
        title: "Succès",
        description: "Utilisateur ajouté avec succès.",
      });
      setIsAddUserDialogOpen(false);
      setNewUser({
        email: "",
        password: "",
        name: "",
        lastName: "",
        role: "viewer",
      });
    }
    setLoading(false);
  };

  const handleUpdateUser = async () => {
    if (
      !currentUser?.id ||
      !currentUser.email ||
      !currentUser.name ||
      !currentUser.lastName
    ) {
      toast({
        title: "Erreur",
        description: "Veuillez remplir tous les champs obligatoires.",
        variant: "destructive",
      });
      return;
    }
    setLoading(true);
    const { data, error } = await supabase
      .from("users_atelier")
      .update({
        email: currentUser.email,
        name: currentUser.name,
        lastName: currentUser.lastName,
        role: currentUser.role,
        // Password is not updated here, assumes a separate flow for password reset
      })
      .eq("id", currentUser.id)
      .select();

    if (error) {
      toast({
        title: "Erreur",
        description: "Erreur lors de la mise à jour de l'utilisateur.",
        variant: "destructive",
      });
      console.error(error);
    } else {
      setUsers((prev) =>
        prev.map((user) => (user.id === data[0].id ? (data[0] as User) : user))
      );
      toast({
        title: "Succès",
        description: "Utilisateur mis à jour avec succès.",
      });
      setIsEditDialogOpen(false);
      setCurrentUser(null);
    }
    setLoading(false);
  };

  const handleDeleteUser = async (userId: string) => {
    setLoading(true);
    const { error } = await supabase
      .from("users_atelier")
      .delete()
      .eq("id", userId);

    if (error) {
      toast({
        title: "Erreur",
        description: "Erreur lors de la suppression de l'utilisateur.",
        variant: "destructive",
      });
      console.error(error);
    } else {
      setUsers((prev) => prev.filter((user) => user.id !== userId));
      toast({
        title: "Succès",
        description: "Utilisateur supprimé avec succès.",
      });
    }
    setLoading(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-automotive-dark flex items-center gap-2">
          <UserIcon className="h-7 w-7" /> Gestion des Utilisateurs
        </h1>
        <Dialog
          open={isAddUserDialogOpen}
          onOpenChange={setIsAddUserDialogOpen}
        >
          <DialogTrigger asChild>
            <Button className="bg-automotive-blue hover:bg-automotive-blue/90">
              <PlusCircle className="mr-2 h-4 w-4" /> Ajouter Utilisateur
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Ajouter un nouvel utilisateur</DialogTitle>
              <DialogDescription>
                Remplissez les informations ci-dessous pour ajouter un nouvel
                utilisateur.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="new-name" className="text-right">
                  Nom
                </Label>
                <Input
                  id="new-name"
                  value={newUser.name}
                  onChange={(e) =>
                    setNewUser({ ...newUser, name: e.target.value })
                  }
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="new-lastName" className="text-right">
                  Prénom
                </Label>
                <Input
                  id="new-lastName"
                  value={newUser.lastName}
                  onChange={(e) =>
                    setNewUser({ ...newUser, lastName: e.target.value })
                  }
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="new-email" className="text-right">
                  Email
                </Label>
                <Input
                  id="new-email"
                  type="email"
                  value={newUser.email}
                  onChange={(e) =>
                    setNewUser({ ...newUser, email: e.target.value })
                  }
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="new-password" className="text-right">
                  Mot de passe
                </Label>
                <Input
                  id="new-password"
                  type="password"
                  value={newUser.password}
                  onChange={(e) =>
                    setNewUser({ ...newUser, password: e.target.value })
                  }
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="new-role" className="text-right">
                  Rôle
                </Label>
                <select
                  id="new-role"
                  value={newUser.role}
                  onChange={(e) =>
                    setNewUser({
                      ...newUser,
                      role: e.target.value as User["role"],
                    })
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
              <Button onClick={handleAddUser} disabled={loading}>
                {loading ? "Ajout en cours..." : "Ajouter"}
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
                      <Dialog
                        open={isEditDialogOpen && currentUser?.id === user.id}
                        onOpenChange={setIsEditDialogOpen}
                      >
                        <DialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setCurrentUser(user);
                              setIsEditDialogOpen(true);
                            }}
                            className="mr-2"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[425px]">
                          <DialogHeader>
                            <DialogTitle>Modifier l'utilisateur</DialogTitle>
                            <DialogDescription>
                              Modifiez les informations de l'utilisateur.
                            </DialogDescription>
                          </DialogHeader>
                          <div className="grid gap-4 py-4">
                            <div className="grid grid-cols-4 items-center gap-4">
                              <Label htmlFor="edit-name" className="text-right">
                                Nom
                              </Label>
                              <Input
                                id="edit-name"
                                value={currentUser?.name || ""}
                                onChange={(e) =>
                                  setCurrentUser({
                                    ...currentUser,
                                    name: e.target.value,
                                  })
                                }
                                className="col-span-3"
                              />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                              <Label
                                htmlFor="edit-lastName"
                                className="text-right"
                              >
                                Prénom
                              </Label>
                              <Input
                                id="edit-lastName"
                                value={currentUser?.lastName || ""}
                                onChange={(e) =>
                                  setCurrentUser({
                                    ...currentUser,
                                    lastName: e.target.value,
                                  })
                                }
                                className="col-span-3"
                              />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                              <Label
                                htmlFor="edit-email"
                                className="text-right"
                              >
                                Email
                              </Label>
                              <Input
                                id="edit-email"
                                type="email"
                                value={currentUser?.email || ""}
                                onChange={(e) =>
                                  setCurrentUser({
                                    ...currentUser,
                                    email: e.target.value,
                                  })
                                }
                                className="col-span-3"
                              />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                              <Label htmlFor="edit-role" className="text-right">
                                Rôle
                              </Label>
                              <select
                                id="edit-role"
                                value={currentUser?.role || "viewer"}
                                onChange={(e) =>
                                  setCurrentUser({
                                    ...currentUser,
                                    role: e.target.value as User["role"],
                                  })
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
                              disabled={loading}
                            >
                              {loading ? "Mise à jour..." : "Mettre à jour"}
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>

                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="destructive" size="sm">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>
                              Êtes-vous absolument sûr ?
                            </AlertDialogTitle>
                            <AlertDialogDescription>
                              Cette action ne peut pas être annulée. Cela
                              supprimera définitivement cet utilisateur de nos
                              serveurs.
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
    </div>
  );
};
