
import React, { useState } from 'react';
import { Mic } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLocation } from 'react-router-dom';
import VoiceProductTable from './VoiceProductTable';

const HeaderVoiceControl: React.FC = () => {
  const location = useLocation();
  const [showVoiceTable, setShowVoiceTable] = useState(false);
  
  // Don't show voice button on login/register pages
  const hideOnPaths = ['/login', '/register', '/enhanced-login', '/modern-register'];
  if (hideOnPaths.includes(location.pathname)) {
    return null;
  }
  
  return (
    <>
      <div className="fixed z-40 bottom-6 right-6 md:top-20 md:right-8 md:bottom-auto">
        <Button 
          onClick={() => setShowVoiceTable(true)}
          variant="outline"
          size="icon"
          className="rounded-full shadow-md hover:shadow-lg transition-all bg-primary hover:bg-primary/90 text-primary-foreground"
          aria-label="Voice command"
        >
          <Mic className="h-5 w-5" />
        </Button>
      </div>
      
      <VoiceProductTable 
        open={showVoiceTable} 
        onOpenChange={setShowVoiceTable} 
      />
    </>
  );
};

export default HeaderVoiceControl;
