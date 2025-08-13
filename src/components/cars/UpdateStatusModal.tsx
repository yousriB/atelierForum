import React, { useState } from "react";
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
import { Badge } from "@/components/ui/badge";
import { Car as CarIcon, Save, X } from "lucide-react";
import { repairStatuses } from "@/data/mockData";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/lib/supabaseClient";

interface UpdateStatusModalProps {
  car: Car | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (carId: string, newStatus: RepairStatus, notes?: string) => void;
}

export const UpdateStatusModal: React.FC<UpdateStatusModalProps> = ({
  car,
  isOpen,
  onClose,
  onUpdate,
}) => {
  const [selectedStatus, setSelectedStatus] = useState<RepairStatus | "">("");
  const [notes, setNotes] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  React.useEffect(() => {
    if (car && isOpen) {
      setSelectedStatus("");
      setNotes("");
    }
  }, [car, isOpen]);

  const handleUpdate = async () => {
    if (!car || !selectedStatus) return;

    setIsLoading(true);
    try {
      const payload = {
        etat_devis: selectedStatus,
        etat_updated_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from("cars")
        .update(payload)
        .eq("id", car.id);
      if (error) throw error;

      onUpdate(car.id, selectedStatus, notes || undefined);

      toast({
        title: "Statut mis à jour",
        description: `${car.marque} ${car.model} (${car.matricule}) → ${selectedStatus}`,
      });

      onClose();
    } catch (error) {
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
            Mettre à jour le statut
          </DialogTitle>
          <DialogDescription>
            Modifier le statut de réparation pour {car.marque} {car.model} (
            {car.matricule})
          </DialogDescription>
        </DialogHeader>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6 py-4"
        >
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">Statut actuel:</Label>
              <Badge variant="secondary">{car.currentStatus}</Badge>
            </div>

            <div className="p-3 rounded-lg bg-automotive-light/50 border">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-muted-foreground">Client:</span>
                  <p className="font-medium">
                    {car.clientName} {car.clientLastName}
                  </p>
                </div>
                <div>
                  <span className="text-muted-foreground">Type:</span>
                  <p className="font-medium">{car.typeReparation}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">Nouveau statut *</Label>
            <Select
              value={selectedStatus}
              onValueChange={(value: RepairStatus) => setSelectedStatus(value)}
            >
              <SelectTrigger className="w-full">
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
          {/* 
          <div className="space-y-2">
            <Label htmlFor="notes">Notes (optionnel)</Label>
            <Textarea
              id="notes"
              placeholder="Ajouter des commentaires sur ce changement de statut..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div> */}

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
        </motion.div>

        <DialogFooter className="flex flex-col sm:flex-row gap-3 pt-4">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isLoading}
            className="flex-1 order-2 sm:order-1"
          >
            <X className="h-4 w-4 mr-2" />
            Annuler
          </Button>
          <Button
            onClick={handleUpdate}
            disabled={!selectedStatus || isLoading}
            className="flex-1 order-1 sm:order-2 bg-gradient-to-r from-automotive-blue to-status-info hover:from-automotive-blue/90 hover:to-status-info/90"
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
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
