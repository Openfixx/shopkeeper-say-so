
import React from 'react';
import { Button } from "@/components/ui/button";
import { SheetClose } from "@/components/ui/sheet";
import { Link } from 'react-router-dom';

interface NavItemProps {
  icon: React.ReactNode;
  href: string;
  text: string;
  isActive: boolean;
  onClick?: () => void;
}

export const NavItem: React.FC<NavItemProps> = ({ icon, href, text, isActive, onClick }) => {
  return (
    <li>
      <SheetClose asChild>
        <Button
          variant="ghost"
          className={`w-full justify-start ${isActive 
            ? 'bg-gradient-to-r from-purple-500/20 to-indigo-500/20 font-semibold text-purple-500 dark:text-indigo-300' 
            : 'text-muted-foreground hover:bg-purple-500/10'}`}
          onClick={onClick}
          asChild
        >
          <Link to={href} className="flex items-center w-full">
            {icon}
            <span>{text}</span>
          </Link>
        </Button>
      </SheetClose>
    </li>
  );
};

export default NavItem;
