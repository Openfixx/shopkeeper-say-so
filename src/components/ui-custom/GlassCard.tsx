
import React from 'react';
import { cn } from '@/lib/utils';

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  withHoverEffect?: boolean;
  withOverlayEffect?: boolean;
}

const GlassCard: React.FC<GlassCardProps> = ({
  children,
  className,
  withHoverEffect = false,
  withOverlayEffect = false,
  ...props
}) => {
  return (
    <div
      className={cn(
        'glass-card p-5 rounded-2xl overflow-hidden transition-all duration-300',
        withHoverEffect && 'hover:shadow-xl hover:-translate-y-1',
        withOverlayEffect && 'with-overlay-effect',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};

export default GlassCard;
