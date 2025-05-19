
import React from 'react';
import { useInventory } from '@/context/InventoryContext';

export default function ImageUploader({ productName }: { productName: string }) {
  const { addProduct } = useInventory();
  
  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Create a placeholder product with the file as image
    await addProduct({
      name: productName,
      price: 0,
      quantity: 0,
      unit: 'unit',
      image: URL.createObjectURL(file)
    });
  };

  return (
    <div>
      <input 
        type="file" 
        accept="image/*"
        onChange={handleUpload}
      />
      <p>Upload image for {productName}</p>
    </div>
  );
}
