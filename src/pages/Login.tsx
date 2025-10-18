import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Car, Mail, Lock, AlertCircle } from "lucide-react";
import { motion } from "framer-motion";
import showroomBg from "@/assets/showroom-bg.jpg";
import icon from "@/assets/icon.png";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabaseClient";
// import bcrypt from "bcryptjs";
import { User } from "@/types";

export const Login: React.FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { setUser } = useAuth(); // Destructure setUser from useAuth

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { data, error } = await supabase
        .from("users_atelier")
        .select("*")
        .eq("email", email)
        .single();

      if (error || !data) {
        toast({
          title: "Erreur de connexion",
          description: "Email ou mot de passe incorrect",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      // Plain-text password check
      if (data.password !== password) {
        toast({
          title: "Erreur de connexion",
          description: "Email ou mot de passe incorrect",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      const authenticatedUser = {
        id: String(data.id ?? data.uuid ?? data.email),
        email: data.email,
        name: data.name ?? data.firstName ?? "",
        lastName: data.lastName ?? "",
        role: (data.role === "admin"
          ? "admin"
          : data.role === "reception"
          ? "reception"
          : "viewer") as User["role"],
        password: data.password, // Keep the password for context if needed elsewhere, though not usually recommended
      };

      setUser(authenticatedUser);
      try {
        window.localStorage.setItem(
          "auth:user",
          JSON.stringify(authenticatedUser)
        );
      } catch (err) {
        console.error("Error saving to local storage:", err);
      }

      if (authenticatedUser.role === "reception") {
        navigate("/dashboard", { replace: true });
      } else {
        navigate("/cars", { replace: true });
      }

      toast({
        title: "Connexion réussie",
        description: `Bienvenue ${
          authenticatedUser.role === "reception"
            ? "Réception"
            : authenticatedUser.role === "admin"
            ? "Admin"
            : "Visualiseur"
        }`,
      });
    } catch (err) {
      console.error(err);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la connexion",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center bg-cover bg-center bg-no-repeat relative p-4"
      style={{ backgroundImage: `url(${showroomBg})` }}
    >
      <div className="absolute inset-0 bg-automotive-dark/60 backdrop-blur-sm" />

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="relative z-10 w-full max-w-md mx-auto"
      >
        <Card className="shadow-elegant border-0 bg-card/95 backdrop-blur-md">
          <CardHeader className="space-y-4 text-center p-4 sm:p-6">
            <div className="flex justify-center">
              <img src={icon} className="w-20 h-20" alt="" />
            </div>
            <div>
              <CardTitle className="text-xl sm:text-2xl font-bold text-automotive-dark">
                AutoRepair Pro
              </CardTitle>
              <CardDescription className="text-sm sm:text-base text-automotive-silver">
                Système de suivi des réparations automobiles
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent className="p-4 sm:p-6">
            <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label
                    htmlFor="email"
                    className="text-automotive-dark font-medium"
                  >
                    Email
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="votre@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="password"
                    className="text-automotive-dark font-medium"
                  >
                    Mot de passe
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="password"
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-red-500 to-red-600 hover:from-red-500/90 hover:to-red-600/90 text-white font-medium py-2.5"
                disabled={isLoading}
              >
                {isLoading ? "Connexion..." : "Se connecter"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};
