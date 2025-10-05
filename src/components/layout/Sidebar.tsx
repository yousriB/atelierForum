import React from "react";
import { NavLink } from "react-router-dom";
import { LayoutDashboard, Plus, List, LogOut, Car, X } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useSidebar } from "@/context/SidebarContext";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

export const Sidebar: React.FC = () => {
  const { user, logout } = useAuth();
  const { isOpen, close } = useSidebar();

  if (!user) return null;

  const menuItems = [
    {
      title: "Dashboard",
      icon: LayoutDashboard,
      href: "/dashboard",
      roles: ["reception", "viewer"],
    },
    {
      title: "Ajouter Voiture",
      icon: Plus,
      href: "/add-car",
      roles: ["reception"],
    },
    {
      title: "Liste des Voitures",
      icon: List,
      href: "/cars",
      roles: ["reception", "viewer"],
    },
  ];

  const filteredItems = menuItems.filter((item) =>
    item.roles.includes(user.role)
  );

  return (
    <>
      <motion.aside
        initial={false}
        animate={{
          x: isOpen ? 0 : "-100%",
        }}
        transition={{
          type: "tween",
          duration: 0.3,
          ease: "easeInOut",
        }}
        className={cn(
          "fixed lg:relative lg:translate-x-0 inset-y-0 left-0 z-50",
          "w-64 border-r bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60",
          "flex flex-col h-full lg:h-[calc(100vh-4rem)]"
        )}
      >
        <div className="flex h-16 items-center justify-between border-b px-4 sm:px-6">
          <div className="flex items-center gap-2">
            {/* <Car className="h-6 w-6 text-automotive-blue" /> */}
            <span className="text-lg font-semibold text-automotive-dark">
              Menu
            </span>
          </div>

          {/* Close button for mobile */}
          <Button
            variant="ghost"
            size="sm"
            className="lg:hidden"
            onClick={close}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        <nav className="flex-1 space-y-2 p-4">
          {filteredItems.map((item, index) => (
            <motion.div
              key={item.href}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <NavLink
                to={item.href}
                onClick={() => {
                  // Close sidebar on mobile when navigating
                  if (window.innerWidth < 1024) {
                    close();
                  }
                }}
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 transition-all hover:bg-accent",
                    isActive
                      ? "bg-red-500 text-white hover:bg-red-500/90"
                      : "text-muted-foreground hover:text-foreground"
                  )
                }
              >
                <item.icon className="h-4 w-4" />
                {item.title}
              </NavLink>
            </motion.div>
          ))}
        </nav>

        <div className="border-t p-4">
          <Button
            variant="ghost"
            className="w-full justify-start text-muted-foreground hover:text-destructive"
            onClick={() => {
              logout();
              close();
            }}
          >
            <LogOut className="mr-2 h-4 w-4" />
            Se déconnecter
          </Button>
        </div>
      </motion.aside>

    </>
  );
};
