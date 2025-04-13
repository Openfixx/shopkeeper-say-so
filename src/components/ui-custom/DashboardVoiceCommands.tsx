
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Mic,
  MicOff, 
  Loader2,
  ChevronDown,
  ChevronUp,
  Lightbulb
} from 'lucide-react';
import { toast } from 'sonner';
import VoiceInput from './VoiceInput';

interface DashboardVoiceCommandsProps {
  onAddProduct: () => void;
  onCreateBill: () => void;
  onSearchProduct: (searchTerm: string) => void;
}

const DashboardVoiceCommands: React.FC<DashboardVoiceCommandsProps> = ({
  onAddProduct,
  onCreateBill,
  onSearchProduct,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [suggestedCommands] = useState([
    'Add new product',
    'Create bill',
    'Show low stock items',
    'Search for rice',
    'Show sales report'
  ]);
  
  const handleVoiceCommand = (command: string) => {
    const lowerCommand = command.toLowerCase();
    
    if (lowerCommand.includes('add') && (lowerCommand.includes('product') || lowerCommand.includes('item'))) {
      onAddProduct();
      return;
    }
    
    if (lowerCommand.includes('create') && lowerCommand.includes('bill')) {
      onCreateBill();
      return;
    }
    
    if (lowerCommand.includes('search') || lowerCommand.includes('find')) {
      const searchTerms = lowerCommand.replace(/search|find|for/g, '').trim();
      if (searchTerms) {
        onSearchProduct(searchTerms);
      } else {
        toast.error('Please specify what to search for');
      }
      return;
    }
    
    toast.info('Processing command: ' + command);
  };
  
  return (
    <div className="relative">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.2 }}
      >
        <Card className={`overflow-hidden transition-all duration-300 voice-card ${isExpanded ? 'mb-4' : ''}`}>
          <CardContent className={`p-0 ${isExpanded ? 'pb-4' : 'py-0'}`}>
            <div className="flex items-center justify-between p-4">
              <div className="flex items-center">
                <div className="w-8 h-8 rounded-full bg-violet-500/20 flex items-center justify-center mr-3">
                  <Mic className="h-4 w-4 text-violet-500" />
                </div>
                <div>
                  <p className="text-sm font-semibold">Voice Commands</p>
                  <p className="text-xs text-muted-foreground">Control the dashboard with your voice</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 rounded-full p-0"
                onClick={() => setIsExpanded(!isExpanded)}
              >
                {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </Button>
            </div>
            
            {isExpanded && (
              <div className="px-4 space-y-4">
                <VoiceInput
                  onCommand={handleVoiceCommand}
                  placeholder="Try saying 'Show low stock items'"
                />
                
                <div className="space-y-2">
                  <p className="text-xs font-medium flex items-center">
                    <Lightbulb className="h-3 w-3 mr-1 text-amber-500" />
                    Suggested commands:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {suggestedCommands.map((command, index) => (
                      <Button
                        key={index}
                        variant="outline"
                        size="sm"
                        className="text-xs h-7 bg-background/60"
                        onClick={() => {
                          handleVoiceCommand(command);
                        }}
                      >
                        {command}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default DashboardVoiceCommands;
