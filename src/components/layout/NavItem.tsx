
import React from 'react';
import { Button } from "@/components/ui/button";
import { SheetClose } from "@/components/ui/sheet";

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
          className={`w-full justify-start ${isActive ? 'font-semibold' : 'text-muted-foreground'}`}
          onClick={onClick}
          asChild
        >
          <a href={href} className="flex items-center w-full">
            {icon}
            {text}
          </a>
        </Button>
      </SheetClose>
    </li>
  );
};

export default NavItem;
