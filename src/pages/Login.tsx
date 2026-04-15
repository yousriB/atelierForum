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
import { Mail, Lock } from "lucide-react";
import { motion } from "framer-motion";
import showroomBg from "@/assets/showroom-bg.jpg";
import icon from "@/assets/icon.png";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabaseClient";
import { logSecurityEvent } from "@/lib/security-logger";
import { User } from "@/types";

export const Login: React.FC = () => {
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const navigate    = useNavigate();
  const { toast }   = useToast();
  const { setUser } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // ── 1. Authenticate via Supabase Auth ──────────────────────────────────
      const { data: authData, error: authError } =
        await supabase.auth.signInWithPassword({ email, password });

      if (authError || !authData.user) {
        await logSecurityEvent({
          event_type:  "login_attempt",
          severity:    "medium",
          status_code: 401,
          endpoint:    "/auth/login",
          method:      "POST",
          metadata:    { email, error: authError?.message ?? "Unknown error" },
        });
        toast({
          title:       "Erreur de connexion",
          description: "Email ou mot de passe incorrect",
          variant:     "destructive",
        });
        return;
      }

      // ── 2. Fetch role, name, lastName from the profile table ───────────────
      const { data: profile, error: profileError } = await supabase
        .from("users_atelier")
        .select(`id, email, name, "lastName", role`)
        .eq("email", email)
        .maybeSingle();

      if (profileError) {
        console.error("[Login] Profile fetch error:", profileError.message);
      }

      if (!profile?.role) {
        await supabase.auth.signOut();
        toast({
          title:       "Erreur",
          description: "Profil introuvable. Contactez l'administrateur.",
          variant:     "destructive",
        });
        return;
      }

      // ── 3. Build user object ───────────────────────────────────────────────
      const authenticatedUser: User = {
        id:       authData.user.id,
        email:    authData.user.email ?? email,
        name:     profile.name ?? "",
        lastName: profile.lastName ?? "",
        role:     (profile.role === "admin"
          ? "admin"
          : profile.role === "reception"
          ? "reception"
          : "viewer") as User["role"],
      };

      // ── 4. Log success ─────────────────────────────────────────────────────
      await logSecurityEvent({
        event_type:  "login_attempt",
        severity:    "low",
        status_code: 200,
        user_id:     authenticatedUser.id,
        endpoint:    "/auth/login",
        method:      "POST",
        metadata:    { email },
      });

      // ── 5. Set user immediately (context's onAuthStateChange will also fire,
      //       but this gives instant navigation with no flicker) ───────────────
      setUser(authenticatedUser);

      // ── 6. Redirect by role ────────────────────────────────────────────────
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
      console.error("[Login] Unexpected error:", err);
      toast({
        title:       "Erreur",
        description: "Une erreur est survenue lors de la connexion",
        variant:     "destructive",
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
                  <Label htmlFor="email" className="text-automotive-dark font-medium">
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
                  <Label htmlFor="password" className="text-automotive-dark font-medium">
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
