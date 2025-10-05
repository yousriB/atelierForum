import React from 'react';
import { User, LogOut, Car, Menu } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useSidebar } from '@/context/SidebarContext';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import icon from "@/assets/icon.png";


export const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const { toggle } = useSidebar();

  if (!user) return null;

  return (
    <nav className="fixed top-0 left-0 right-0 z-40 border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60">
      <div className="flex h-16 items-center justify-between px-3 sm:px-4 md:px-6 max-w-[100vw]">
        <div className="flex items-center gap-3">
          {/* Mobile hamburger menu */}
          <Button
            variant="ghost"
            size="sm"
            className="lg:hidden"
            onClick={toggle}
          >
            <Menu className="h-5 w-5" />
          </Button>
          <img src={icon} alt="" className='lg:h-10 lg:w-10 hidden lg:block' />
          {/* <Car className="h-6 w-6 sm:h-8 sm:w-8 text-automotive-blue" /> */}
          <div className="hidden sm:block">
            <h1 className="text-lg sm:text-xl font-bold text-automotive-dark">
              Forum Auto
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Système de suivi des réparations
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3">
                <User className="h-4 w-4" />
                <div className="hidden sm:flex flex-col items-start">
                  <span className="text-sm font-medium">
                    {user.name} {user.lastName}
                  </span>
                  <Badge variant="secondary" className="text-xs">
                    {user.role === 'reception' ? 'Réception' : 'Visualiseur'}
                  </Badge>
                </div>
                <div className="sm:hidden">
                  <Badge variant="secondary" className="text-xs">
                    {user.role === 'reception' ? 'R' : 'V'}
                  </Badge>
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem disabled>
                <User className="mr-2 h-4 w-4" />
                {user.email}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={logout} className="text-destructive">
                <LogOut className="mr-2 h-4 w-4" />
                Se déconnecter
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </nav>
  );
};