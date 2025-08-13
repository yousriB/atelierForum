import React, { useState, useMemo, useEffect } from "react";
import { Car, RepairStatus, ViewMode, CarFilters } from "@/types";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CarCard } from "@/components/cars/CarCard";
import { UpdateStatusModal } from "@/components/cars/UpdateStatusModal";
import {
  Search,
  Filter,
  LayoutGrid,
  List as ListIcon,
  Car as CarIcon,
  RefreshCw,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { carMarques, repairStatuses } from "@/data/mockData";
import { calculateDaysInStatus, formatDate } from "@/utils/carHelpers";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabaseClient";
import { useToast } from "@/hooks/use-toast";

export const CarsList: React.FC = () => {
  const { user } = useAuth();
  const [cars, setCars] = useState<Car[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const { toast } = useToast();
  const [viewMode, setViewMode] = useState<ViewMode>("card");
  const [selectedCar, setSelectedCar] = useState<Car | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [filters, setFilters] = useState<CarFilters>({
    search: "",
    marque: "",
    status: "",
  });

  const filteredCars = useMemo(() => {
    return cars.filter((car) => {
      const matchesSearch =
        filters.search === "" ||
        car.matricule.toLowerCase().includes(filters.search.toLowerCase()) ||
        car.clientName.toLowerCase().includes(filters.search.toLowerCase()) ||
        car.clientLastName
          .toLowerCase()
          .includes(filters.search.toLowerCase()) ||
        car.model.toLowerCase().includes(filters.search.toLowerCase());

      const matchesMarque =
        filters.marque === "" || car.marque === filters.marque;
      const matchesStatus =
        filters.status === "" || car.currentStatus === filters.status;

      return matchesSearch && matchesMarque && matchesStatus;
    });
  }, [cars, filters]);

  const handleUpdateStatus = (car: Car) => {
    setSelectedCar(car);
    setIsModalOpen(true);
  };

  const handleStatusUpdate = (
    carId: string,
    newStatus: RepairStatus,
    notes?: string
  ) => {
    setCars((prevCars) =>
      prevCars.map((car) =>
        car.id === carId
          ? {
              ...car,
              currentStatus: newStatus,
              updatedAt: new Date().toISOString(),
              statusHistory: [
                ...car.statusHistory,
                {
                  id: Date.now().toString(),
                  status: newStatus,
                  changedAt: new Date().toISOString(),
                  changedBy: `${user?.name} ${user?.lastName}`,
                  notes,
                },
              ],
            }
          : car
      )
    );
  };

  const clearFilters = () => {
    setFilters({ search: "", marque: "", status: "" });
  };

  useEffect(() => {
    const fetchCars = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from("cars")
          .select("*")
          .order("date_arrivee", { ascending: false });
        if (error) throw error;

        const mapped: Car[] = (data || []).map((row: any) => {
          const currentStatus =
            (row.etat_devis as RepairStatus) || "En Attente de devis";
          const statusChangedAt: string =
            row.etat_updated_at || row.date_arrivee || new Date().toISOString();
          const statusHistory = [
            {
              id: String(row.id ?? row.uuid ?? `${row.matricule}-0`),
              status: currentStatus,
              changedAt: statusChangedAt,
              changedBy: "Système",
              notes: undefined,
            },
          ];

          const car: Car = {
            id: String(row.id ?? row.uuid ?? row.matricule),
            clientName: row.client_name,
            clientLastName: row.client_lastname,
            matricule: row.matricule,
            model: row.model,
            marque: row.marque,
            assuranceCompany: row.assurance_company,
            // typeReparation is text[] in DB; our type expects string for display
            typeReparation: Array.isArray(row.type_reparation)
              ? (row.type_reparation as string[]).join(", ")
              : String(row.type_reparation ?? ""),
            kilometrage: Number(row.kilometrage ?? 0),
            dateArrivee: row.date_arrivee,
            currentStatus,
            statusHistory,
            createdAt: row.date_arrivee,
            updatedAt: statusChangedAt,
          };
          return car;
        });

        setCars(mapped);
      } catch (err: any) {
        console.error(err);
        toast({
          title: "Erreur",
          description: "Impossible de récupérer la liste des véhicules",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchCars();
  }, [toast]);

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-lg bg-automotive-blue/10">
            <CarIcon className="h-6 w-6 text-automotive-blue" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-automotive-dark">
              Liste des Véhicules
            </h1>
            <p className="text-muted-foreground">
              {filteredCars.length} véhicule
              {filteredCars.length !== 1 ? "s" : ""}
              {filters.search || filters.marque || filters.status
                ? " (filtré)"
                : ""}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant={viewMode === "card" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("card")}
          >
            <LayoutGrid className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === "table" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("table")}
          >
            <ListIcon className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtres de Recherche
          </CardTitle>
          <CardDescription>
            Filtrer les véhicules par matricule, client, marque ou statut
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4 sm:p-6">
          <div className="flex flex-col gap-4">
            <div className="w-full">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher par matricule, client, marque..."
                  value={filters.search}
                  onChange={(e) =>
                    setFilters((prev) => ({ ...prev, search: e.target.value }))
                  }
                  className="pl-10"
                />
              </div>
            </div>

            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
              <Select
                value={filters.marque || "all"}
                onValueChange={(value) =>
                  setFilters((prev) => ({
                    ...prev,
                    marque: value === "all" ? "" : value,
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Toutes les marques" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes les marques</SelectItem>
                  {carMarques.map((marque) => (
                    <SelectItem key={marque} value={marque}>
                      {marque}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={filters.status || "all"}
                onValueChange={(value) =>
                  setFilters((prev) => ({
                    ...prev,
                    status: value === "all" ? "" : (value as RepairStatus),
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Tous les statuts" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les statuts</SelectItem>
                  {repairStatuses.map((status) => (
                    <SelectItem key={status} value={status}>
                      {status}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <div className="sm:col-span-2 lg:col-span-2 flex justify-end">
                <Button
                  variant="outline"
                  onClick={clearFilters}
                  className="flex items-center gap-2 w-full sm:w-auto"
                >
                  <RefreshCw className="h-4 w-4" />
                  Réinitialiser
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      <AnimatePresence mode="wait">
        {viewMode === "card" ? (
          <motion.div
            key="card-view"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="grid gap-4 sm:gap-6 grid-cols-1 md:grid-cols-2"
          >
            {isLoading && filteredCars.length === 0 ? (
              <div className="col-span-full text-center text-muted-foreground py-8">
                Chargement...
              </div>
            ) : (
              filteredCars.map((car, index) => (
                <motion.div
                  key={car.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <CarCard
                    car={car}
                    onUpdateStatus={
                      user?.role === "reception"
                        ? handleUpdateStatus
                        : undefined
                    }
                  />
                </motion.div>
              ))
            )}
          </motion.div>
        ) : (
          <motion.div
            key="table-view"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <Card className="shadow-card">
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[800px]">
                    <thead className="border-b bg-automotive-light/30">
                      <tr>
                        <th className="text-left p-3 sm:p-4 font-medium text-sm sm:text-base">
                          Véhicule
                        </th>
                        <th className="text-left p-3 sm:p-4 font-medium text-sm sm:text-base">
                          Client
                        </th>
                        <th className="text-left p-3 sm:p-4 font-medium text-sm sm:text-base">
                          Matricule
                        </th>
                        <th className="text-left p-3 sm:p-4 font-medium text-sm sm:text-base">
                          Type
                        </th>
                        <th className="text-left p-3 sm:p-4 font-medium text-sm sm:text-base">
                          Statut
                        </th>
                        <th className="text-left p-3 sm:p-4 font-medium text-sm sm:text-base">
                          Arrivée
                        </th>
                        {user?.role === "reception" && (
                          <th className="text-left p-3 sm:p-4 font-medium text-sm sm:text-base">
                            Actions
                          </th>
                        )}
                      </tr>
                    </thead>
                    <tbody>
                      {isLoading && filteredCars.length === 0 ? (
                        <tr>
                          <td
                            colSpan={user?.role === "reception" ? 7 : 6}
                            className="p-6 text-center text-muted-foreground"
                          >
                            Chargement...
                          </td>
                        </tr>
                      ) : (
                        filteredCars.map((car, index) => (
                          <motion.tr
                            key={car.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className="border-b hover:bg-automotive-light/20 transition-colors"
                          >
                            <td className="p-3 sm:p-4">
                              <div>
                                <p className="font-medium text-automotive-dark text-sm sm:text-base">
                                  {car.marque} {car.model}
                                </p>
                                <p className="text-xs sm:text-sm text-muted-foreground">
                                  {car.kilometrage.toLocaleString()} km
                                </p>
                              </div>
                            </td>
                            <td className="p-3 sm:p-4">
                              <div>
                                <p className="font-medium text-sm sm:text-base">
                                  {car.clientName} {car.clientLastName}
                                </p>
                                <p className="text-xs sm:text-sm text-muted-foreground">
                                  {car.assuranceCompany}
                                </p>
                              </div>
                            </td>
                            <td className="p-3 sm:p-4">
                              <code className="bg-automotive-light/50 px-2 py-1 rounded text-xs sm:text-sm font-mono">
                                {car.matricule}
                              </code>
                            </td>
                            <td className="p-3 sm:p-4">
                              <span className="text-xs sm:text-sm">
                                {car.typeReparation}
                              </span>
                            </td>
                            <td className="p-3 sm:p-4">
                              <div className="flex flex-col gap-1">
                                <Badge variant="secondary" className="text-xs">
                                  {car.currentStatus}
                                </Badge>
                                <span className="text-xs text-muted-foreground">
                                  {calculateDaysInStatus(car)} jour
                                  {calculateDaysInStatus(car) !== 1 ? "s" : ""}
                                </span>
                              </div>
                            </td>
                            <td className="p-3 sm:p-4">
                              <span className="text-xs sm:text-sm">
                                {formatDate(car.dateArrivee)}
                              </span>
                            </td>
                            {user?.role === "reception" && (
                              <td className="p-3 sm:p-4">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleUpdateStatus(car)}
                                  className="text-xs"
                                >
                                  Modifier
                                </Button>
                              </td>
                            )}
                          </motion.tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {!isLoading && filteredCars.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-12"
        >
          <CarIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium text-automotive-dark">
            Aucun véhicule trouvé
          </h3>
          <p className="text-muted-foreground">
            Essayez de modifier vos critères de recherche
          </p>
        </motion.div>
      )}

      <UpdateStatusModal
        car={selectedCar}
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedCar(null);
        }}
        onUpdate={handleStatusUpdate}
      />
    </div>
  );
};
