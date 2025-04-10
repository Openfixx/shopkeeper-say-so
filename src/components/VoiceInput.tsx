import { useState } from 'react';
import ProductImagePicker from './ProductImagePicker';

export default function VoiceInput({ onCommand }: { onCommand: (text: string) => void }) {
  const [imagePickerVisible, setImagePickerVisible] = useState(false);
  const [currentProduct, setCurrentProduct] = useState('');

  const handleProcessCommand = async (text: string) => {
    const productMatch = text.match(/Add \d+ (\w+)/i);
    if (productMatch) {
      setCurrentProduct(productMatch[1]);
      setImagePickerVisible(true);
    }
    onCommand(text);
  };

  return (
    <div>
      {/* ... existing voice input code ... */}
      {imagePickerVisible && (
        <ProductImagePicker
          productName={currentProduct}
          initialImage={`https://source.unsplash.com/100x100/?${currentProduct}`}
          onImageConfirmed={() => setImagePickerVisible(false)}
        />
      )}
    </div>
  );
}
