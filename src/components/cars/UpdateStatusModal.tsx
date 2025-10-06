import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Car, RepairStatus } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/context/AuthContext";
import { repairStatuses, repairTypes } from "@/data/mockData";
import { cn } from "@/lib/utils";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon, Save } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

const carSchema = z.object({
  clientName: z.string().min(2, "Le prénom doit contenir au moins 2 caractères"),
  clientLastName: z.string().min(2, "Le nom doit contenir au moins 2 caractères"),
  matricule: z.string().min(5, "La matricule doit contenir au moins 5 caractères"),
  model: z.string().min(2, "Le modèle est requis"),
  marque: z.string().min(1, "La marque est requise"),
  assuranceCompany: z.string().min(1, "La compagnie d'assurance est requise"),
  typeReparation: z.array(z.string()),
  kilometrage: z.number().min(0, "Le kilométrage doit être positif"),
  dateArrivee: z.date({ required_error: "La date d'arrivée est requise" }),
  chargeeDeDossier: z.enum(["Cyrine", "Marwa", "Passager", "Groscomptes"], {
    errorMap: () => ({
      message: "Veuillez sélectionner la chargée de dossier",
    }),
  }),
  currentStatus: z.string().min(1, "Le statut est requis"),
  note: z.string().optional().default(""),
});

type CarFormData = z.infer<typeof carSchema>;

interface UpdateStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  car: Car | null;
  onUpdate: (carId: string, updatedData: Partial<Car>, newStatus?: string, notes?: string) => void;
  onDelete?: (car: Car) => void;
}

export const UpdateStatusModal: React.FC<UpdateStatusModalProps> = ({
  isOpen,
  onClose,
  car,
  onUpdate,
  onDelete,
}) => {
  const { user } = useAuth();
  const { toast } = useToast();

  const form = useForm<CarFormData>({
    resolver: zodResolver(carSchema),
    defaultValues: {
      dateArrivee: new Date(),
      typeReparation: [],
      chargeeDeDossier: "Passager",
      note: "",
    },
  });

  // Initialize form when car changes
  useEffect(() => {
    if (car) {
      form.reset({
        clientName: car.clientName,
        clientLastName: car.clientLastName,
        matricule: car.matricule,
        model: car.model,
        marque: car.marque,
        assuranceCompany: car.assuranceCompany,
        typeReparation: Array.isArray(car.typeReparation) ? car.typeReparation : [],
        kilometrage: car.kilometrage,
        dateArrivee: car.dateArrivee ? new Date(car.dateArrivee) : new Date(),
        currentStatus: car.currentStatus,
        chargeeDeDossier: car.chargee_de_dossier as any,
        note: car.note || "",
      });
    }
  }, [car, form]);

  const onSubmit = async (data: CarFormData) => {
    if (!car || !user) return;

    try {
      // Prepare the update data according to the database schema
      const updateData = {
        client_name: data.clientName,
        client_lastname: data.clientLastName,
        matricule: data.matricule,
        model: data.model,
        marque: data.marque,
        assurance_company: data.assuranceCompany,
        type_reparation: data.typeReparation,
        kilometrage: data.kilometrage,
        date_arrivee: data.dateArrivee,
        etat_devis: data.currentStatus,
        chargee_de_dossier: data.chargeeDeDossier || null,
        note: data.note || null,
      };

      // Only update etat_updated_at if the status has changed
      if (car.etat_devis !== data.currentStatus) {
        updateData.etat_updated_at = new Date().toISOString();
      }

      // Update the car in the database
      const { data: updatedData, error } = await supabase
        .from("cars")
        .update(updateData)
        .eq("id", car.id)
        .select()
        .single();

      if (error) throw error;

      onUpdate(car.id, updatedData, data.currentStatus);
      toast({
        title: "Succès",
        description: "Les informations du véhicule ont été mises à jour avec succès",
      });
      onClose();
    } catch (error) {
      console.error("Error updating car:", error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la mise à jour du véhicule",
        variant: "destructive",
      });
    }
  };

  if (!car) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl overflow-y-auto max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Mettre à jour le véhicule</DialogTitle>
          <DialogDescription>
            Mettez à jour les détails pour {car.marque} {car.model} ({car.matricule})
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid gap-4 sm:gap-6 grid-cols-1 md:grid-cols-2">
              {/* Client Information */}
              <div className="space-y-4">
                <h3 className="font-medium">Informations Client</h3>
                
                <FormField
                  control={form.control}
                  name="clientName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Prénom du Client</FormLabel>
                      <FormControl>
                        <Input placeholder="Jean" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="clientLastName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nom du Client</FormLabel>
                      <FormControl>
                        <Input placeholder="Dupont" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Car Information */}
              <div className="space-y-4">
                <h3 className="font-medium">Informations Véhicule</h3>
                
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="marque"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Marque</FormLabel>
                        <FormControl>
                          <Input placeholder="BMW, Audi, ..." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="model"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Modèle</FormLabel>
                        <FormControl>
                          <Input placeholder="Serie 3" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="matricule"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Matricule</FormLabel>
                      <FormControl>
                        <Input placeholder="AB-123-CD" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="kilometrage"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Kilométrage</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="85000"
                          {...field}
                          onChange={(e) => field.onChange(Number(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Repair Information */}
              <div className="space-y-4">
                <h3 className="font-medium">Informations Réparation</h3>
                
                <FormField
                  control={form.control}
                  name="typeReparation"
                  render={() => (
                    <FormItem>
                      <FormLabel>Type de Réparation</FormLabel>
                      <div className="space-y-2">
                        {repairTypes.map((type) => (
                          <FormField
                            key={type}
                            control={form.control}
                            name="typeReparation"
                            render={({ field }) => {
                              const checked = field.value?.includes(type);
                              return (
                                <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                                  <FormControl>
                                    <Checkbox
                                      checked={checked}
                                      onCheckedChange={(isChecked) => {
                                        const next = new Set<string>(field.value || []);
                                        if (isChecked) next.add(type);
                                        else next.delete(type);
                                        field.onChange(Array.from(next));
                                      }}
                                    />
                                  </FormControl>
                                  <FormLabel className="font-normal">
                                    {type}
                                  </FormLabel>
                                </FormItem>
                              );
                            }}
                          />
                        ))}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="assuranceCompany"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Compagnie d'Assurance</FormLabel>
                      <FormControl>
                        <Input placeholder="AXA, Allianz, ..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="dateArrivee"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Date d'Arrivée</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              className={cn(
                                "pl-3 text-left font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value ? (
                                format(field.value, "PPP", { locale: fr })
                              ) : (
                                <span>Sélectionner une date</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            disabled={(date) => date > new Date()}
                            initialFocus
                            className="pointer-events-auto"
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="chargeeDeDossier"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Chargée de Dossier</FormLabel>
                      <FormControl>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Sélectionner" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Passager">Passager</SelectItem>
                            <SelectItem value="Cyrine">Cyrine</SelectItem>
                            <SelectItem value="Marwa">Marwa</SelectItem>
                            <SelectItem value="Groscomptes">Gros comptes</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Status Information */}
              <div className="space-y-4">
                <h3 className="font-medium">Statut</h3>
                
                <FormField
                  control={form.control}
                  name="currentStatus"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Statut Actuel</FormLabel>
                      <FormControl>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Sélectionner un statut" />
                          </SelectTrigger>
                          <SelectContent>
                            {repairStatuses.map((status) => (
                              <SelectItem key={status} value={status}>
                                {status}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* {form.watch("currentStatus") !== car.currentStatus && (
                  <FormField
                    control={form.control}
                    name="statusChangeNotes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Notes de changement de statut</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Ajoutez des détails sur le changement de statut..."
                            rows={3}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )} */}

                <FormField
                  control={form.control}
                  name="note"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Notes générales</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Ajoutez des notes supplémentaires..."
                          rows={3}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={form.formState.isSubmitting}
              >
                Annuler
              </Button>
              <Button 
                type="submit" 
                disabled={form.formState.isSubmitting}
                className="bg-gradient-to-r from-automotive-blue to-status-info hover:from-automotive-blue/90 hover:to-status-info/90"
              >
                {form.formState.isSubmitting ? (
                  "Enregistrement..."
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Enregistrer
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default UpdateStatusModal;