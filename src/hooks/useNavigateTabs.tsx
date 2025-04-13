
import { useNavigate } from 'react-router-dom';

export const useNavigateTabs = () => {
  const navigate = useNavigate();
  
  const switchTab = (path: string) => {
    navigate(path);
  };
  
  return { switchTab };
};
