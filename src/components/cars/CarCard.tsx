import React from "react";
import { Car } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import {
  Car as CarIcon,
  Calendar,
  Gauge,
  Shield,
  Settings,
  User,
} from "lucide-react";
import { motion } from "framer-motion";
import { calculateDaysInStatus, formatDate } from "@/utils/carHelpers";
import { useAuth } from "@/context/AuthContext";

interface CarCardProps {
  car: Car;
  onUpdateStatus?: (car: Car) => void;
}

export const CarCard: React.FC<CarCardProps> = ({ car, onUpdateStatus }) => {
  const { user } = useAuth();
  const daysInStatus = calculateDaysInStatus(car);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.2 }}
      whileHover={{ y: -2 }}
    >
      <Card className="shadow-card hover:shadow-automotive transition-all duration-300 border-l-4 border-l-automotive-blue">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-automotive-blue/10">
                <CarIcon className="h-5 w-5 text-automotive-blue" />
              </div>
              <div>
                <CardTitle className="text-lg font-bold text-automotive-dark">
                  {car.marque} {car.model}
                </CardTitle>
                <p className="text-sm text-muted-foreground font-mono">
                  {car.matricule}
                </p>
              </div>
            </div>
            <StatusBadge
              status={car.currentStatus}
              daysInStatus={daysInStatus}
            />
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium text-automotive-dark">
                  {car.clientName} {car.clientLastName}
                </p>
                <p className="text-xs text-muted-foreground">Client</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium text-automotive-dark">
                  {car.assuranceCompany}
                </p>
                <p className="text-xs text-muted-foreground">Assurance</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Settings className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium text-automotive-dark">
                  {car.typeReparation}
                </p>
                <p className="text-xs text-muted-foreground">Type réparation</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Gauge className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium text-automotive-dark">
                  {car.kilometrage.toLocaleString()} km
                </p>
                <p className="text-xs text-muted-foreground">Kilométrage</p>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-3 border-t">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                Arrivée: {formatDate(car.dateArrivee)}
              </span>
            </div>

            {user?.role === "reception" && onUpdateStatus && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => onUpdateStatus(car)}
                className="hover:bg-automotive-blue hover:text-white transition-colors"
              >
                <Settings className="h-4 w-4 mr-1" />
                Modifier Statut
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};
