
import React from 'react';

interface AppLogoProps {
  size?: number;
  className?: string;
}

const AppLogo: React.FC<AppLogoProps> = ({ size = 40, className = "" }) => {
  return (
    <div 
      className={`bg-primary rounded-lg p-1 flex items-center justify-center text-primary-foreground font-bold ${className}`}
      style={{ width: size, height: size }}
    >
      <div className="flex flex-col items-center leading-none">
        <span style={{ fontSize: size * 0.4 }}>सन्</span>
        <span style={{ fontSize: size * 0.25 }}>समान</span>
      </div>
    </div>
  );
};

export default AppLogo;
