import React, { createContext, useContext, useState, ReactNode } from "react";
import { User } from "@/types";
import { supabase } from "@/lib/supabaseClient";

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<User | null>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const STORAGE_KEY = "auth:user";

  const [user, setUser] = useState<User | null>(() => {
    if (typeof window === "undefined") return null;
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      return raw ? (JSON.parse(raw) as User) : null;
    } catch {
      return null;
    }
  });

  const login = async (
    email: string,
    password: string
  ): Promise<User | null> => {
    // Fetch user by email from Supabase and validate password
    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("email", email)
      .single();

    if (error || !data) {
      return null;
    }

    // Plain-text password check for now
    if (data.password !== password) {
      return null;
    }

    const authenticatedUser: User = {
      id: String(data.id ?? data.uuid ?? data.email),
      email: data.email,
      name: data.name ?? data.firstName ?? "",
      lastName: data.lastName ?? "",
      role: data.role === "reception" ? "reception" : "viewer",
    };

    setUser(authenticatedUser);
    try {
      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(authenticatedUser)
      );
    } catch {}
    return authenticatedUser;
  };

  const logout = () => {
    setUser(null);
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch {}
  };

  const isAuthenticated = !!user;

  return (
    <AuthContext.Provider value={{ user, login, logout, isAuthenticated }}>
      {children}
    </AuthContext.Provider>
  );
};
