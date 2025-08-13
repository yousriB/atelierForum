import React, { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Car,
  Users,
  Clock,
  CheckCircle2,
  AlertTriangle,
  TrendingUp,
} from "lucide-react";
import { motion } from "framer-motion";
import { supabase } from "@/lib/supabaseClient";
import { useToast } from "@/hooks/use-toast";

export const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();

  const [totalCars, setTotalCars] = useState<number>(0);
  const [readyCars, setReadyCars] = useState<number>(0);
  const [inProgressCars, setInProgressCars] = useState<number>(0);
  const [pendingCars, setPendingCars] = useState<number>(0);
  const [isLoadingStats, setIsLoadingStats] = useState<boolean>(false);

  type RecentItem = {
    id: string;
    matricule: string;
    marque: string;
    model: string;
    clientName: string;
    clientLastName: string;
    currentStatus: string;
    updatedAt: string;
  };
  const [recentActivity, setRecentActivity] = useState<RecentItem[]>([]);
  const [isLoadingRecent, setIsLoadingRecent] = useState<boolean>(false);

  useEffect(() => {
    const fetchStats = async () => {
      setIsLoadingStats(true);
      try {
        const { data, error } = await supabase.rpc("get_dashboard_stats");
        if (error) throw error;
        const row = Array.isArray(data) ? data[0] : data;
        if (row) {
          setTotalCars(Number(row?.total_cars ?? 0));
          setReadyCars(Number(row?.ready_cars ?? 0));
          setInProgressCars(Number(row?.in_progress_cars ?? 0));
          setPendingCars(Number(row?.pending_cars ?? 0));
        } else {
          throw new Error("Empty stats result");
        }
      } catch (err) {
        // Fallback: compute stats client-side with flexible column names
        try {
          const { data: carsData, error: carsError } = await supabase
            .from("cars")
            .select("*");
          if (carsError) throw carsError;
          const list = carsData || [];
          const getStatus = (row: any): string =>
            row.etat_devis ||
            row.etat ||
            row.status ||
            row.current_status ||
            "";

          const total = list.length;
          const ready = list.filter((r: any) => getStatus(r) === "Prêt").length;
          const inProgressSet = new Set([
            "Au cours de réparation mécanique",
            "Au cours de réparation tôlerie",
            "Au cours de réparation électrique",
          ]);
          const inProgress = list.filter((r: any) =>
            inProgressSet.has(getStatus(r))
          ).length;
          const pending = list.filter((r: any) => {
            const s = getStatus(r);
            return s !== "Prêt" && !inProgressSet.has(s);
          }).length;

          setTotalCars(total);
          setReadyCars(ready);
          setPendingCars(pending);
          setInProgressCars(inProgress);
        } catch (fallbackErr) {
          console.error(fallbackErr);
          toast({
            title: "Erreur",
            description: "Impossible de charger les statistiques",
            variant: "destructive",
          });
        }
      } finally {
        setIsLoadingStats(false);
      }
    };

    const fetchRecent = async () => {
      setIsLoadingRecent(true);
      try {
        const { data, error } = await supabase.from("cars").select("*");
        if (error) throw error;

        const rows = (data || [])
          .slice()
          .sort((a: any, b: any) => {
            const getTime = (r: any) =>
              new Date(
                r.etat_updated_at || r.updated_at || r.date_arrivee || 0
              ).getTime();
            return getTime(b) - getTime(a);
          })
          .slice(0, 3);

        const mapped: RecentItem[] = rows.map((row: any) => ({
          id: String(row.id ?? row.uuid ?? row.matricule),
          matricule: row.matricule,
          marque: row.marque,
          model: row.model,
          clientName: row.client_name || row.clientName,
          clientLastName: row.client_lastname || row.clientLastName,
          currentStatus:
            row.etat_devis ||
            row.etat ||
            row.status ||
            row.current_status ||
            "",
          updatedAt: row.etat_updated_at || row.updated_at || row.date_arrivee,
        }));
        setRecentActivity(mapped);
      } catch (err) {
        console.error(err);
        toast({
          title: "Erreur",
          description: "Impossible de charger l'activité récente",
          variant: "destructive",
        });
      } finally {
        setIsLoadingRecent(false);
      }
    };

    fetchStats();
    fetchRecent();
  }, [toast]);

  const stats = [
    {
      title: "Total Véhicules",
      value: isLoadingStats ? "…" : totalCars,
      description: "Véhicules en atelier",
      icon: Car,
      color: "text-automotive-blue",
      bgColor: "bg-automotive-blue/10",
    },
    {
      title: "Véhicules Prêts",
      value: isLoadingStats ? "…" : readyCars,
      description: "Prêts pour récupération",
      icon: CheckCircle2,
      color: "text-status-ready",
      bgColor: "bg-status-ready/10",
    },
    {
      title: "En Réparation",
      value: isLoadingStats ? "…" : inProgressCars,
      description: "Actuellement en cours",
      icon: Clock,
      color: "text-status-warning",
      bgColor: "bg-status-warning/10",
    },
    {
      title: "En Attente",
      value: isLoadingStats ? "…" : pendingCars,
      description: "En Attente",
      icon: AlertTriangle,
      color: "text-status-danger",
      bgColor: "bg-status-danger/10",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-automotive-dark">
          Tableau de Bord
        </h1>
        <p className="text-muted-foreground">
          Bienvenue, {user?.name} {user?.lastName}
        </p>
      </div>

      <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className="shadow-card hover:shadow-automotive transition-shadow duration-300">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </CardTitle>
                <div className={`${stat.bgColor} p-2 rounded-lg`}>
                  <stat.icon className={`h-4 w-4 ${stat.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-automotive-dark">
                  {stat.value}
                </div>
                <p className="text-xs text-muted-foreground">
                  {stat.description}
                </p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid gap-4 sm:gap-6 grid-cols-1 lg:grid-cols-2">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-automotive-blue" />
                Activité Récente
              </CardTitle>
              <CardDescription>
                Dernières mises à jour des véhicules
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {isLoadingRecent ? (
                  <div className="text-center text-muted-foreground py-4">
                    Chargement…
                  </div>
                ) : (
                  recentActivity.map((car) => (
                    <div
                      key={car.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-automotive-light/50"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-automotive-blue" />
                        <div>
                          <p className="font-medium text-automotive-dark">
                            {car.matricule} - {car.marque} {car.model}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {car.clientName} {car.clientLastName}
                          </p>
                        </div>
                      </div>
                      <Badge variant="secondary" className="text-xs">
                        {car.currentStatus}
                      </Badge>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-automotive-blue" />
                Informations Utilisateur
              </CardTitle>
              <CardDescription>Votre profil et permissions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Nom complet:</span>
                  <span className="text-sm text-muted-foreground">
                    {user?.name} {user?.lastName}
                  </span>
                </div> */}
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Email:</span>
                  <span className="text-sm text-muted-foreground">
                    {user?.email}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Rôle:</span>
                  <Badge
                    variant={
                      user?.role === "reception" ? "default" : "secondary"
                    }
                  >
                    {user?.role === "reception" ? "Réception" : "Visualiseur"}
                  </Badge>
                </div>
                <div className="pt-2 border-t">
                  <p className="text-xs text-muted-foreground">
                    {user?.role === "reception"
                      ? "Vous pouvez ajouter des véhicules et modifier les statuts"
                      : "Vous pouvez consulter les véhicules et leurs statuts"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};
