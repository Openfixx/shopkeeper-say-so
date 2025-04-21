
import { useNavigate } from 'react-router-dom';
import React from 'react';

export const useNavigateTabs = () => {
  const navigate = useNavigate();
  
  const switchTab = (path: string) => {
    navigate(path);
  };
  
  return { switchTab };
};
