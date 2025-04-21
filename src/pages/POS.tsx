import React, { useState } from 'react';
import { supabase } from '@/lib/supabase';
import VoiceInput from '@/components/VoiceInput';
import ProductImagePicker from '@/components/ProductImagePicker';
import { getCachedImage } from '@/utils/fetchImage';
import { DbInventoryItem } from '@/lib/supabase';

const PosPage = () => {
  const [activeProduct, setActiveProduct] = useState<{
    name: string;
    imageUrl: string | null;
  } | null>(null);

  const [inventoryItems, setInventoryItems] = useState<DbInventoryItem[]>([]);

  const handleVoiceCommand = async (transcript: string) => {
    try {
      const match = transcript.match(/Add (\d+) (\w+).*₹(\d+)/i);
      if (!match) return;

      const [_, quantity, productName, price] = match;
      const productNameLower = productName.toLowerCase();

      const { data: existingProduct } = await supabase
        .from('products')
        .select()
        .eq('name', productNameLower)
        .maybeSingle();

      let imageUrl = existingProduct?.image_url || null;

      if (!existingProduct) {
        imageUrl = await getCachedImage(productName);
        
        await supabase.from('products').insert([{
          name: productNameLower,
          image_url: imageUrl
        }]);
      }

      const { data: newItem } = await supabase
        .from('inventory')
        .insert([{
          product_name: productNameLower,
          quantity: Number(quantity),
          price: Number(price) * 100,
          image_url: imageUrl
        }])
        .select()
        .single();

      setInventoryItems([...inventoryItems, newItem]);
      setActiveProduct({
        name: productNameLower,
        imageUrl
      });
    } catch (error) {
      console.error("Error processing voice command:", error);
    }
  };

  const handleImageConfirm = async (confirmedImageUrl: string) => {
    if (!activeProduct) return;

    try {
      await supabase
        .from('products')
        .update({ image_url: confirmedImageUrl })
        .eq('name', activeProduct.name);

      await supabase
        .from('inventory')
        .update({ image_url: confirmedImageUrl })
        .eq('product_name', activeProduct.name);

      const { data: items } = await supabase
        .from('inventory')
        .select();
      
      setInventoryItems(items || []);
      setActiveProduct(null);
    } catch (error) {
      console.error("Error updating product image:", error);
    }
  };

  return (
    <div className="pos-container">
      <VoiceInput onCommand={handleVoiceCommand} />
      
      <div className="inventory-list">
        {inventoryItems.map(item => (
          <div key={item.id} className="inventory-item">
            <img 
              src={item.image_url || '/placeholder.png'} 
              alt={item.product_name}
              onClick={() => setActiveProduct({
                name: item.product_name,
                imageUrl: item.image_url
              })}
            />
            <span>{item.product_name} (x{item.quantity})</span>
          </div>
        ))}
      </div>

      {activeProduct && (
        <div className="image-editor-modal">
          <h3>Editing: {activeProduct.name}</h3>
          <ProductImagePicker
            productName={activeProduct.name}
            initialImage={activeProduct.imageUrl || ''}
            onConfirm={handleImageConfirm}
            onCancel={() => setActiveProduct(null)}
          />
        </div>
      )}
    </div>
  );
};

export default PosPage;
