import React, { useState } from 'react';
import { supabase } from '@/lib/supabase';
import VoiceInput from '@/components/VoiceInput';
import ProductImagePicker from '@/components/ProductImagePicker';
import { translateHindi } from '@/lib/translationCache';
import { getCachedImage } from '@/utils/fetchImage';
import { DbInventoryItem } from '@/lib/supabase';

export default function PosPage() {
  // ======================
  // State Management
  // ======================
  const [activeProduct, setActiveProduct] = useState<{
    name: string;
    imageUrl: string | null;
  } | null>(null);

  const [inventoryItems, setInventoryItems] = useState<DbInventoryItem[]>([]);

  // ======================
  // Voice Command Handler
  // ======================
  const handleVoiceCommand = async (transcript: string) => {
    try {
      // 1. Process and translate command
      const isHindi = /[\u0900-\u097F]/.test(transcript);
      const processedText = isHindi 
        ? await translateHindi(transcript) 
        : transcript;

      // 2. Parse command (format: "Add 5 Nescafe ₹100")
      const match = processedText.match(/Add (\d+) (\w+).*₹(\d+)/i);
      if (!match) return;

      const [_, quantity, productName, price] = match;
      const productNameLower = productName.toLowerCase();

      // 3. Check for existing product
      const { data: existingProduct } = await supabase
        .from('products')
        .select()
        .eq('name', productNameLower)
        .maybeSingle();

      let imageUrl = existingProduct?.image_url || null;

      // 4. Fetch image if new product
      if (!existingProduct) {
        imageUrl = await getCachedImage(productName);
        
        // Save new product
        await supabase.from('products').insert([{
          name: productNameLower,
          image_url: imageUrl
        }]);
      }

      // 5. Add to inventory
      const { data: newItem } = await supabase
        .from('inventory')
        .insert([{
          product_name: productNameLower,
          hindi_name: isHindi ? transcript : null,
          quantity: Number(quantity),
          price: Number(price) * 100, // Convert to paise
          image_url: imageUrl
        }])
        .select()
        .single();

      // 6. Update UI
      setInventoryItems([...inventoryItems, newItem]);
      setActiveProduct({
        name: productNameLower,
        imageUrl
      });
      
    } catch (error) {
      console.error("Error processing voice command:", error);
    }
  };

  // ======================
  // Image Confirmation Handler
  // ======================
  const handleImageConfirm = async (confirmedImageUrl: string) => {
    if (!activeProduct) return;

    try {
      // 1. Update product image
      await supabase
        .from('products')
        .update({ image_url: confirmedImageUrl })
        .eq('name', activeProduct.name);

      // 2. Update related inventory items
      await supabase
        .from('inventory')
        .update({ image_url: confirmedImageUrl })
        .eq('product_name', activeProduct.name);

      // 3. Refresh data
      const { data: items } = await supabase
        .from('inventory')
        .select();
      
      setInventoryItems(items || []);
      setActiveProduct(null);
      
    } catch (error) {
      console.error("Error updating product image:", error);
    }
  };

  // ======================
  // Render
  // ======================
  return (
    <div className="pos-container">
      {/* Existing voice input UI */}
      <VoiceInput onCommand={handleVoiceCommand} />
      
      {/* Inventory list */}
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

      {/* Image editor modal */}
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
}
