// Add this new state
const [activeProduct, setActiveProduct] = useState('');

// Modify handleVoiceCommand
const handleVoiceCommand = async (transcript: string) => {
  const processedText = /* ... translation logic ... */;
  
  const match = processedText.match(/Add (\d+) (\w+).*₹(\d+)/i);
  if (match) {
    const [_, quantity, product, price] = match;
    setActiveProduct(product); // Highlight product in UI
    
    const imageUrl = await fetchProductImage(product);
    
    await supabase.from('inventory').insert([{
      product,
      quantity: Number(quantity),
      price: Number(price),
      image_url: imageUrl
    }]);
  }
};

// In your return statement
return (
  <div>
    {/* ... existing code ... */}
    {activeProduct && (
      <div className="active-product">
        Editing: {activeProduct}
        <ProductImagePicker 
          productName={activeProduct}
          initialImage={items.find(i => i.product === activeProduct)?.image_url || ''}
          onImageConfirmed={() => setActiveProduct('')}
        />
      </div>
    )}
  </div>
);
