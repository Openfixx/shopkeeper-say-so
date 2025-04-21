
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

interface ProductImagePickerProps {
  productName: string;
  initialImage?: string;
  onConfirm: (imageUrl: string) => void;
  onCancel: () => void;
}

const ProductImagePicker: React.FC<ProductImagePickerProps> = ({
  productName,
  initialImage = '',
  onConfirm,
  onCancel
}) => {
  const [selectedImage, setSelectedImage] = useState(initialImage);
  const [suggestedImages, setSuggestedImages] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Function to fetch images from Unsplash
  const fetchImages = async () => {
    setIsLoading(true);
    try {
      // Generate multiple images for selection
      const images = [];
      for (let i = 0; i < 4; i++) {
        // Add a random parameter to avoid caching
        const randomParam = Math.random().toString(36).substring(7);
        images.push(`https://source.unsplash.com/300x300/?${encodeURIComponent(productName)}&random=${randomParam}`);
      }
      setSuggestedImages(images);
      
      // If no image is selected yet, select the first one
      if (!selectedImage) {
        setSelectedImage(images[0]);
      }
    } catch (error) {
      console.error('Error fetching images:', error);
      toast.error('Failed to fetch product images');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Initial load of images
  useEffect(() => {
    fetchImages();
  }, [productName]);
  
  const handleSelectImage = (imageUrl: string) => {
    setSelectedImage(imageUrl);
  };
  
  const handleRefresh = () => {
    fetchImages();
  };
  
  const handleConfirm = () => {
    if (selectedImage) {
      onConfirm(selectedImage);
    } else {
      toast.error('Please select an image first');
    }
  };
  
  return (
    <Card className="overflow-hidden border">
      <CardContent className="p-4 space-y-4">
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-lg font-medium">Select Image for {productName}</h3>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleRefresh}
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            <span className="ml-1">Refresh</span>
          </Button>
        </div>
        
        {isLoading ? (
          <div className="h-60 flex items-center justify-center">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {suggestedImages.map((image, index) => (
              <div 
                key={index}
                className={`aspect-square rounded-md overflow-hidden cursor-pointer border-2 transition-all ${
                  selectedImage === image ? 'border-primary scale-105 shadow-lg' : 'border-transparent hover:border-muted-foreground'
                }`}
                onClick={() => handleSelectImage(image)}
              >
                <img 
                  src={image} 
                  alt={`${productName} option ${index + 1}`} 
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = `https://placehold.co/300x300?text=${encodeURIComponent(productName)}`;
                  }}
                />
              </div>
            ))}
          </div>
        )}
        
        <div className="flex justify-end gap-3 pt-2">
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button onClick={handleConfirm} disabled={!selectedImage || isLoading}>
            Confirm Image
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProductImagePicker;
