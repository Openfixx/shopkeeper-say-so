
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  SquareStack, 
  Package, 
  ShoppingBasket,
  BarChart, 
  Receipt, 
  Tag,
  MapPin
} from 'lucide-react';

type Tab = {
  icon: React.ReactNode;
  text: string;
  href: string;
};

export const useNavigateTabs = () => {
  const navigate = useNavigate();
  
  const [userTabs, setUserTabs] = useState<Tab[]>([]);
  
  const allTabs: Tab[] = [
    {
      icon: <MapPin className="h-4 w-4 mr-3" />,
      text: "Shop Finder",
      href: "/shop-finder"
    }
  ];
  
  const switchTab = (path: string) => {
    navigate(path);
  };
  
  return { switchTab, userTabs, setUserTabs, allTabs };
};
