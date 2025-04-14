
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Card } from '@/components/ui/card';
import { Loader2, CheckCircle2, XCircle, Search } from 'lucide-react';
import { toast } from 'sonner';
import { fetchProductImage } from '../lib/fetchImage';

export interface ProductImagePickerProps {
  productName: string;
  initialImage: string;
  onConfirm?: (confirmedImageUrl: string) => void;
  onCancel?: () => void;
}

export default function ProductImagePicker({
  productName,
  initialImage,
  onConfirm,
  onCancel
}: ProductImagePickerProps) {
  const [image, setImage] = useState(initialImage || '');
  const [isLoading, setIsLoading] = useState(false);
  const [alternativeImages, setAlternativeImages] = useState<string[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    // If no initial image is provided, try to fetch one
    if (!initialImage && productName) {
      findProductImage();
    } else {
      setImage(initialImage);
    }
  }, [initialImage, productName]);

  const findProductImage = async () => {
    if (!productName) {
      toast.error('Please enter a product name first');
      return;
    }
    
    setIsLoading(true);
    try {
      const imageUrl = await fetchProductImage(productName);
      
      if (imageUrl && !imageUrl.includes('placehold.co')) {
        console.log(`Found image for ${productName}:`, imageUrl);
        setImage(imageUrl);
        toast.success('Product image found');
      } else {
        console.log(`No real image found for ${productName}, using placeholder`);
        setImage(`https://placehold.co/300x300?text=${encodeURIComponent(productName)}`);
        toast.error('Could not find product image');
      }
    } catch (error) {
      console.error('Error fetching product image:', error);
      toast.error('Failed to fetch product image');
      setImage(`https://placehold.co/300x300?text=${encodeURIComponent(productName)}`);
    } finally {
      setIsLoading(false);
    }
  };

  const loadAlternativeImages = async () => {
    if (!productName) return;
    
    setIsSearching(true);
    try {
      // Try to get a few alternative images with different queries
      const variations = [
        `${productName} product`,
        `${productName} package`,
        `${productName} grocery item`
      ];
      
      const altImages: string[] = [];
      
      for (const query of variations) {
        try {
          const imageUrl = await fetchProductImage(query);
          
          if (imageUrl && 
              !imageUrl.includes('placehold.co') && 
              imageUrl !== image && 
              !altImages.includes(imageUrl)) {
            altImages.push(imageUrl);
          }
        } catch (e) {
          console.error(`Error loading alternative for "${query}":`, e);
        }
      }
      
      setAlternativeImages(altImages);
      
      if (altImages.length === 0) {
        toast.info('No alternative images found');
      }
    } catch (error) {
      console.error('Error loading alternative images:', error);
      toast.error('Failed to load alternative images');
    } finally {
      setIsSearching(false);
    }
  };

  useEffect(() => {
    // Load alternative images when the component mounts
    if (productName && !isSearching) {
      loadAlternativeImages();
    }
  }, [productName]);

  const handleConfirm = async () => {
    try {
      toast.success(`Image selected for ${productName}`);
      if (onConfirm) onConfirm(image);  // Pass the selected image URL
    } catch (error) {
      console.error('Error selecting image:', error);
      toast.error('Failed to select image');
    }
  };

  const selectAlternative = (url: string) => {
    setImage(url);
    toast.info('Alternative image selected');
  };

  return (
    <Dialog open={true} onOpenChange={() => onCancel && onCancel()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center">Product Image for {productName}</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col items-center space-y-4">
          {isLoading ? (
            <div className="w-full h-64 flex items-center justify-center bg-muted rounded-md">
              <Loader2 className="h-12 w-12 animate-spin text-primary/60" />
            </div>
          ) : (
            <Card className="relative w-full h-64 bg-muted overflow-hidden rounded-md">
              <img 
                src={image || `https://placehold.co/300x300?text=${encodeURIComponent(productName)}`} 
                alt={productName}
                className="w-full h-full object-contain"
                onError={() => {
                  // If image fails to load, set a placeholder
                  setImage(`https://placehold.co/300x300?text=${encodeURIComponent(productName)}`);
                }}
              />
            </Card>
          )}

          <div className="w-full">
            <h3 className="text-sm font-medium mb-2">Alternative Images</h3>
            <div className="flex overflow-x-auto space-x-2 pb-2">
              {isSearching ? (
                <div className="w-16 h-16 bg-muted rounded-md flex items-center justify-center">
                  <Loader2 className="h-4 w-4 animate-spin" />
                </div>
              ) : alternativeImages.length > 0 ? (
                alternativeImages.map((url, index) => (
                  <div 
                    key={index} 
                    className="relative flex-shrink-0 cursor-pointer border-2 rounded-md overflow-hidden hover:border-primary transition-colors"
                    onClick={() => selectAlternative(url)}
                  >
                    <img 
                      src={url} 
                      alt={`Alternative ${index + 1}`}
                      className="w-16 h-16 object-cover" 
                      onError={(e) => {
                        // Remove this alternative if it fails to load
                        setAlternativeImages(prevAlt => prevAlt.filter(item => item !== url));
                      }}
                    />
                  </div>
                ))
              ) : (
                <div className="w-full p-2 text-center text-sm text-muted-foreground">
                  No alternatives found
                </div>
              )}
            </div>
          </div>
        </div>

        <DialogFooter className="sm:justify-between">
          <Button
            variant="outline"
            onClick={() => onCancel && onCancel()}
            disabled={isLoading}
          >
            <XCircle className="mr-2 h-4 w-4" />
            Cancel
          </Button>
          <div className="flex space-x-2">
            <Button
              variant="outline"
              onClick={findProductImage}
              disabled={isLoading}
            >
              <Search className="mr-2 h-4 w-4" />
              Find Another
            </Button>
            <Button
              onClick={handleConfirm}
              disabled={isLoading || !image}
            >
              {isLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <CheckCircle2 className="mr-2 h-4 w-4" />
              )}
              Confirm Image
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
