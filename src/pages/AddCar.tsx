import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { supabase } from "../lib/supabaseClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CalendarIcon, Car, Save } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { motion } from "framer-motion";
import { repairTypes } from "@/data/mockData";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { Checkbox } from "@/components/ui/checkbox";
import { useAuth } from "@/context/AuthContext";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const carSchema = z.object({
  clientName: z
    .string()
    .min(2, "Le prénom doit contenir au moins 2 caractères"),
  clientLastName: z
    .string()
    .min(2, "Le nom doit contenir au moins 2 caractères"),
  matricule: z
    .string()
    .min(5, "La matricule doit contenir au moins 5 caractères"),
  model: z.string().min(2, "Le modèle est requis"),
  marque: z.string().min(1, "La marque est requise"),
  assuranceCompany: z.string().min(1, "La compagnie d'assurance est requise"),
  typeReparation: z
    .array(z.string())
    .min(1, "Sélectionnez au moins un type de réparation"),
  kilometrage: z.number().min(0, "Le kilométrage doit être positif"),
  dateArrivee: z.date({ required_error: "La date d'arrivée est requise" }),
  chargeeDeDossier: z.enum(["Cyrine", "Marwa", "Passager", "Groscomptes"], {
    errorMap: () => ({
      message: "Veuillez sélectionner la chargée de dossier",
    }),
  }),
  note: z.string().optional().default(""),
});

type CarFormData = z.infer<typeof carSchema>;

export const AddCar: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();

  const form = useForm<CarFormData>({
    resolver: zodResolver(carSchema),
    defaultValues: {
      dateArrivee: new Date(),
      typeReparation: [],
      chargeeDeDossier: "Passager",
      note: "",
    },
  });

  const onSubmit = async (data: CarFormData) => {
    setIsLoading(true);

    try {
      const { error } = await supabase.from("cars").insert({
        client_name: data.clientName,
        client_lastname: data.clientLastName,
        matricule: data.matricule,
        model: data.model,
        marque: data.marque,
        assurance_company: data.assuranceCompany,
        type_reparation: data.typeReparation,
        kilometrage: data.kilometrage,
        date_arrivee: data.dateArrivee.toISOString(),
        chargee_de_dossier: data.chargeeDeDossier,
        etat_devis: "En Attente de devis",
        etat_updated_at: new Date().toISOString(),
        note: data.note || null,
      });

      if (error) throw error;

      toast({
        title: "Véhicule ajouté avec succès",
        description: `${data.marque} ${data.model} - ${data.matricule}`,
      });

      navigate("/cars");
    } catch (error) {
      console.error(error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de l'ajout du véhicule",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="mx-auto space-y-4 sm:space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 rounded-lg bg-automotive-blue/10">
            <Car className="h-6 w-6 text-automotive-blue" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-automotive-dark">
              Ajouter un Véhicule
            </h1>
            <p className="text-muted-foreground">
              Enregistrer un nouveau véhicule pour réparation
            </p>
          </div>
        </div>

        <Card className="shadow-card">
          <CardHeader>
            <CardTitle>Informations du Véhicule</CardTitle>
            <CardDescription>
              Remplissez tous les champs obligatoires pour enregistrer le
              véhicule
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-6"
              >
                <div className="grid gap-4 sm:gap-6 grid-cols-1 md:grid-cols-2">
                  {/* Client Name */}
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

                  {/* Client Last Name */}
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

                  {/* Matricule */}
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

                  {/* Model */}
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

                  {/* Marque */}
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

                  {/* Compagnie d'Assurance */}
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

                  {/* Kilometrage */}
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
                            onChange={(e) =>
                              field.onChange(Number(e.target.value))
                            }
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Date Arrivee */}
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

                  {/* Type de Réparation */}
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
                                        checked={!!checked}
                                        onCheckedChange={(isChecked) => {
                                          const next = new Set<string>(
                                            field.value ?? []
                                          );
                                          if (isChecked === true)
                                            next.add(type);
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

                  {/* Note (optionnel) */}
                  <FormField
                    control={form.control}
                    name="note"
                    render={({ field }) => (
                      <FormItem className="md:col-span-2">
                        <FormLabel>Note (optionnel)</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Ajouter des informations complémentaires..."
                            rows={3}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Chargée de Dossier */}
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
                              <SelectItem value="Groscomptes">
                                Gros comptes
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Buttons */}
                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 pt-4 sm:pt-6 border-t">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => navigate("/cars")}
                    className="flex-1 order-2 sm:order-1"
                  >
                    Annuler
                  </Button>
                  <Button
                    type="submit"
                    disabled={
                      isLoading ||
                      (user?.role !== "admin" && user?.role !== "reception")
                    }
                    className="flex-1 order-1 sm:order-2 bg-gradient-to-r from-automotive-blue to-status-info hover:from-automotive-blue/90 hover:to-status-info/90"
                  >
                    {isLoading ? (
                      "Enregistrement..."
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        Enregistrer
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};
