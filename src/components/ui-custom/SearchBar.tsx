
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Search, X } from 'lucide-react';

interface SearchBarProps {
  placeholder?: string;
  onSearch: (query: string) => void;
  className?: string;
}

const SearchBar: React.FC<SearchBarProps> = ({
  placeholder = 'Search...',
  onSearch,
  className,
}) => {
  const [query, setQuery] = useState('');
  
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(query);
  };
  
  const handleClear = () => {
    setQuery('');
    onSearch('');
  };
  
  return (
    <form 
      className={cn('relative', className)}
      onSubmit={handleSearch}
    >
      <div className="relative">
        <input
          type="text"
          className={cn(
            "w-full h-10 pl-10 pr-12 rounded-xl bg-background border-input",
            "focus:outline-none focus:ring-2 focus:ring-ring focus:border-input",
            "transition-all duration-200 ease-in-out placeholder:text-muted-foreground",
            "input-shadow"
          )}
          placeholder={placeholder}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-4 w-4 text-muted-foreground" />
        </div>
        {query && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
            <Button 
              type="button"
              variant="ghost" 
              size="icon" 
              className="h-6 w-6"
              onClick={handleClear}
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>
        )}
      </div>
    </form>
  );
};

export default SearchBar;
