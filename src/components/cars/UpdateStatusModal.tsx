import React, { useState, useEffect } from "react";
import { Car, RepairStatus } from "@/types";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Car as CarIcon, Save, X, User, Car as CarIcon2, FileText, Calendar, Gauge } from "lucide-react";
import { repairStatuses } from "@/data/mockData";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/lib/supabaseClient";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface UpdateStatusModalProps {
  car: Car | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (carId: string, updatedData: Partial<Car>, newStatus?: RepairStatus, notes?: string) => void;
  onDelete?: (car: Car) => Promise<void>;
}

export const UpdateStatusModal: React.FC<UpdateStatusModalProps> = ({
  car,
  isOpen,
  onClose,
  onUpdate,
  onDelete,
}) => {
  const [formData, setFormData] = useState<Partial<Car>>({});
  const [selectedStatus, setSelectedStatus] = useState<RepairStatus | "">("");
  const [notes, setNotes] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (car && isOpen) {
      setFormData({
        clientName: car.clientName,
        clientLastName: car.clientLastName,
        matricule: car.matricule,
        marque: car.marque,
        model: car.model,
        assuranceCompany: car.assuranceCompany,
        typeReparation: car.typeReparation,
        kilometrage: car.kilometrage,
        dateArrivee: car.dateArrivee,
        chargee_de_dossier: car.chargee_de_dossier,
      });
      setSelectedStatus("");
      setNotes("");
    }
  }, [car, isOpen]);

  const handleInputChange = (field: keyof Car, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleUpdate = async () => {
    if (!car) return;
    if (selectedStatus && !formData) return;

    setIsLoading(true);
    try {
      const payload = {
        ...formData,
        ...(selectedStatus && {
          etat_devis: selectedStatus,
          etat_updated_at: new Date().toISOString(),
        }),
        ...(notes && { note: notes }),
        updatedAt: new Date().toISOString(),
      };

      const { error } = await supabase
        .from("cars")
        .update(payload)
        .eq("id", car.id);
      
      if (error) throw error;

      onUpdate(car.id, payload, selectedStatus || undefined, notes || undefined);

      toast({
        title: "Informations mises à jour",
        description: `Les informations de ${formData.marque} ${formData.model} (${formData.matricule}) ont été mises à jour`,
      });

      onClose();
    } catch (error) {
      console.error('Update error:', error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la mise à jour",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!car) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] mx-4 sm:mx-auto max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-automotive-blue/10">
              <CarIcon className="h-5 w-5 text-automotive-blue" />
            </div>
            Éditer les informations du véhicule
          </DialogTitle>
          <DialogDescription>
            Modifier les informations et le statut pour {car.marque} {car.model} ({car.matricule})
          </DialogDescription>
        </DialogHeader>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6 py-4 max-h-[60vh] overflow-y-auto pr-2"
        >
          {/* Client Information Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-automotive-blue">
              <User className="h-4 w-4" />
              <h3 className="font-medium">Informations client</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="clientName">Prénom du client *</Label>
                <Input
                  id="clientName"
                  value={formData.clientName || ''}
                  onChange={(e) => handleInputChange('clientName', e.target.value)}
                  placeholder="Prénom"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="clientLastName">Nom du client *</Label>
                <Input
                  id="clientLastName"
                  value={formData.clientLastName || ''}
                  onChange={(e) => handleInputChange('clientLastName', e.target.value)}
                  placeholder="Nom"
                />
              </div>
            </div>
          </div>

          {/* Vehicle Information Section */}
          <div className="space-y-4 pt-2">
            <div className="flex items-center gap-2 text-automotive-blue">
              <CarIcon2 className="h-4 w-4" />
              <h3 className="font-medium">Informations du véhicule</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="marque">Marque *</Label>
                <Input
                  id="marque"
                  value={formData.marque || ''}
                  onChange={(e) => handleInputChange('marque', e.target.value)}
                  placeholder="Marque"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="model">Modèle *</Label>
                <Input
                  id="model"
                  value={formData.model || ''}
                  onChange={(e) => handleInputChange('model', e.target.value)}
                  placeholder="Modèle"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="matricule">Immatriculation *</Label>
                <Input
                  id="matricule"
                  value={formData.matricule || ''}
                  onChange={(e) => handleInputChange('matricule', e.target.value)}
                  placeholder="Immatriculation"
                  className="uppercase"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="kilometrage">Kilométrage</Label>
                <div className="relative">
                  <Input
                    id="kilometrage"
                    type="number"
                    value={formData.kilometrage || ''}
                    onChange={(e) => handleInputChange('kilometrage', parseInt(e.target.value) || 0)}
                    placeholder="0"
                    className="pr-10"
                  />
                  <span className="absolute right-3 top-2.5 text-sm text-muted-foreground">km</span>
                </div>
              </div>
            </div>
          </div>

          {/* Repair Information Section */}
          <div className="space-y-4 pt-2">
            <div className="flex items-center gap-2 text-automotive-blue">
              <FileText className="h-4 w-4" />
              <h3 className="font-medium">Dossier de réparation</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="typeReparation">Type de réparation *</Label>
                <Input
                  id="typeReparation"
                  value={formData.typeReparation || ''}
                  onChange={(e) => handleInputChange('typeReparation', e.target.value)}
                  placeholder="Type de réparation"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="assuranceCompany">Compagnie d'assurance</Label>
                <Input
                  id="assuranceCompany"
                  value={formData.assuranceCompany || ''}
                  onChange={(e) => handleInputChange('assuranceCompany', e.target.value)}
                  placeholder="Assurance"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="chargee_de_dossier">Chargé(e) de dossier</Label>
                <Input
                  id="chargee_de_dossier"
                  value={formData.chargee_de_dossier || ''}
                  onChange={(e) => handleInputChange('chargee_de_dossier', e.target.value)}
                  placeholder="Nom du chargé de dossier"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dateArrivee">Date d'arrivée</Label>
                <div className="relative">
                  <Input
                    id="dateArrivee"
                    type="date"
                    value={formData.dateArrivee ? format(new Date(formData.dateArrivee), 'yyyy-MM-dd') : ''}
                    onChange={(e) => handleInputChange('dateArrivee', e.target.value)}
                    className="pr-10"
                  />
                  <Calendar className="absolute right-3 top-2.5 h-4 w-4 text-muted-foreground" />
                </div>
              </div>
            </div>
          </div>

          {/* Status Update Section */}
          <div className="space-y-4 pt-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-automotive-blue">
                <Gauge className="h-4 w-4" />
                <h3 className="font-medium">Statut de réparation</h3>
              </div>
              <Badge variant="secondary">{car.currentStatus}</Badge>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="status">Mettre à jour le statut</Label>
                <Select
                  value={selectedStatus}
                  onValueChange={(value: RepairStatus) => setSelectedStatus(value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un nouveau statut" />
                  </SelectTrigger>
                  <SelectContent>
                    {repairStatuses
                      .filter((status) => status !== car.currentStatus)
                      .map((status) => (
                        <SelectItem key={status} value={status}>
                          {status}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes (optionnel)</Label>
                <Textarea
                  id="notes"
                  placeholder="Ajouter des notes ou commentaires..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                />
              </div>

              <AnimatePresence>
                {selectedStatus && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="p-3 rounded-lg bg-status-info/10 border border-status-info/20"
                  >
                    <p className="text-sm text-status-info font-medium">
                      ✓ Nouveau statut: {selectedStatus}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </motion.div>
        <DialogFooter className="flex flex-col sm:flex-row gap-3 pt-4">
          <div className="flex flex-col sm:flex-row w-full gap-3">
            {onDelete && (
              <Button
                type="button"
                onClick={handleUpdate}
                disabled={isLoading || !formData.clientName || !formData.clientLastName || !formData.marque || !formData.model || !formData.matricule || !formData.typeReparation}
                className="flex-1 order-1 sm:order-2 bg-automotive-blue hover:bg-automotive-blue/90"
              >
                <Save className="h-4 w-4 mr-2" />
                {isLoading ? 'Enregistrement...' : 'Enregistrer les modifications'}
              </Button>
            )}
            {onDelete && (
              <Button
                type="button"
                variant="destructive"
                onClick={async () => {
                  if (car && onDelete) {
                    await onDelete(car);
                    onClose();
                  }
                }}
                disabled={isLoading}
                className="flex-1 order-2"
              >
                <X className="h-4 w-4 mr-2" />
                Supprimer le véhicule
              </Button>
            )}
            <Button
              variant="outline"
              onClick={onClose}
              disabled={isLoading}
              className="flex-1 order-2"
            >
              <X className="h-4 w-4 mr-2" />
              Annuler
            </Button>
            <Button
              onClick={handleUpdate}
              disabled={!selectedStatus || isLoading}
              className="flex-1 order-1 bg-gradient-to-r from-automotive-blue to-status-info hover:from-automotive-blue/90 hover:to-status-info/90"
            >
              {isLoading ? (
                "Mise à jour..."
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Mettre à jour
                </>
              )}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
