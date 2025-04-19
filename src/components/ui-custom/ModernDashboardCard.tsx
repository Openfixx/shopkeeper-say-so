
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface ModernDashboardCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon?: React.ReactNode;
  className?: string;
  gradientFrom?: string;
  gradientTo?: string;
  delay?: number;
}

export default function ModernDashboardCard({
  title,
  value,
  description,
  icon,
  className,
  gradientFrom = 'from-purple-500',
  gradientTo = 'to-pink-500',
  delay = 0
}: ModernDashboardCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: delay * 0.1 }}
      className={className}
    >
      <Card className={cn(
        "overflow-hidden border-0 shadow-lg backdrop-blur-md h-full",
        `bg-gradient-to-br ${gradientFrom}/10 ${gradientTo}/10`
      )}>
        <CardHeader className="pb-2">
          <div className="flex justify-between items-start">
            <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
            {icon && (
              <div className={cn(
                "p-2 rounded-full",
                `bg-gradient-to-br ${gradientFrom} ${gradientTo}`
              )}>
                {icon}
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            <span className={cn(
              "bg-clip-text text-transparent",
              `bg-gradient-to-r ${gradientFrom} ${gradientTo}`
            )}>
              {value}
            </span>
          </div>
          {description && (
            <p className="text-xs text-muted-foreground mt-1">
              {description}
            </p>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
