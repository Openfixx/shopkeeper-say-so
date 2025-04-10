import { useState } from 'react';
import { cacheProductImage } from '../lib/imageCache';

export default function ProductImagePicker({ 
  productName,
  initialImage,
  onImageConfirmed 
}: {
  productName: string;
  initialImage: string;
  onImageConfirmed: (url: string) => void;
}) {
  const [image, setImage] = useState(initialImage);
  const [isLoading, setIsLoading] = useState(false);

  const handleConfirm = async () => {
    setIsLoading(true);
    const cachedUrl = await cacheProductImage(productName, image);
    onImageConfirmed(cachedUrl);
    setIsLoading(false);
  };

  return (
    <div className="image-picker">
      <img src={image} alt={productName} width={100} />
      <button onClick={handleConfirm} disabled={isLoading}>
        {isLoading ? 'Saving...' : 'Confirm Image'}
      </button>
    </div>
  );
}
