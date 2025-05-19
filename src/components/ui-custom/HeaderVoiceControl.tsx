
import React from 'react';
import VoiceCommandButton from './VoiceCommandButton';
import { useLocation } from 'react-router-dom';

const HeaderVoiceControl: React.FC = () => {
  const location = useLocation();
  
  // Don't show voice button on login/register pages
  const hideOnPaths = ['/login', '/register', '/enhanced-login', '/modern-register'];
  if (hideOnPaths.includes(location.pathname)) {
    return null;
  }
  
  return (
    <div className="fixed z-40 bottom-6 right-6 md:top-20 md:right-8 md:bottom-auto">
      <VoiceCommandButton className="bg-primary hover:bg-primary/90 text-primary-foreground" />
    </div>
  );
};

export default HeaderVoiceControl;
