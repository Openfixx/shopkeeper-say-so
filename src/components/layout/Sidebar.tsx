
import React from 'react';
import { NavLink } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { 
  BarChart3, 
  BoxIcon, 
  CreditCard, 
  Home, 
  LogOut, 
  PackageIcon, 
  Settings, 
  Store, 
  UserCircle 
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface SidebarProps {
  className?: string;
}

interface SidebarIconProps {
  icon: React.ElementType;
  to: string;
  tooltip: string;
  className?: string;
}

const SidebarIcon: React.FC<SidebarIconProps> = ({ icon: Icon, to, tooltip, className }) => (
  <NavLink to={to} className={({ isActive }) => "group"}>
    {({ isActive }) => (
      <div className={cn(
        "sidebar-icon", 
        isActive && "bg-primary text-primary-foreground", 
        className
      )}>
        <Icon className="h-5 w-5" />
        <span className="sidebar-tooltip group-hover:scale-100">
          {tooltip}
        </span>
      </div>
    )}
  </NavLink>
);

const Sidebar: React.FC<SidebarProps> = ({ className }) => {
  const { user, logout } = useAuth();
  
  return (
    <div className={cn("fixed top-0 left-0 h-screen w-16 m-0 flex flex-col items-center bg-sidebar py-4", className)}>
      <div className="flex flex-col items-center justify-center mb-6">
        <div className="sidebar-icon mb-0">
          <Store className="h-6 w-6 text-primary" />
        </div>
        <span className="text-xs font-medium text-sidebar-foreground">Inventory</span>
      </div>
      
      <div className="flex flex-col justify-center items-center flex-grow space-y-3">
        <SidebarIcon icon={Home} to="/" tooltip="Dashboard" />
        <SidebarIcon icon={PackageIcon} to="/products" tooltip="Products" />
        <SidebarIcon icon={BoxIcon} to="/inventory" tooltip="Inventory" />
        <SidebarIcon icon={CreditCard} to="/billing" tooltip="Billing" />
        <SidebarIcon icon={BarChart3} to="/reports" tooltip="Reports" />
        <SidebarIcon icon={Settings} to="/settings" tooltip="Settings" />
      </div>
      
      <div className="mt-auto pt-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-12 w-12 rounded-full p-0">
              <Avatar className="h-10 w-10 border-2 border-muted">
                <AvatarImage src={undefined} />
                <AvatarFallback className="bg-primary text-primary-foreground">
                  {user?.name.charAt(0) || 'U'}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <UserCircle className="mr-2 h-4 w-4" />
              Profile
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Settings className="mr-2 h-4 w-4" />
              Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={logout}>
              <LogOut className="mr-2 h-4 w-4" />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
};

export default Sidebar;
