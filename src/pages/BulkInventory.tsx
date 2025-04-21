
import React, { useState, useEffect } from 'react';
import { useInventory } from '@/context/InventoryContext';
import ImageAssignModal from '@/components/ui-custom/ImageAssignModal';
import { parseMultiProductCommand } from '@/utils/multiVoiceParse';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Product } from '@/context/InventoryContext';
import { supabase } from '@/lib/supabase';
import { Upload } from 'lucide-react';

export default function BulkInventory() {
  const { products, addProduct, updateProduct } = useInventory();
  const [uploadFiles, setUploadFiles] = useState<FileList | null>(null);
  const [uploadedImageUrls, setUploadedImageUrls] = useState<string[]>([]);
  const [selectedImageUrl, setSelectedImageUrl] = useState<string | null>(null);
  const [imageAssignOpen, setImageAssignOpen] = useState(false);
  const [voiceCommand, setVoiceCommand] = useState('');
  const [addedProducts, setAddedProducts] = useState<Product[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  // Upload files to Supabase storage bucket 'product-images'
  const handleUpload = async () => {
    if (!uploadFiles || uploadFiles.length === 0) {
      toast.error('Please select one or more images to upload.');
      return;
    }

    setIsUploading(true);
    try {
      const newUrls: string[] = [];

      for (let i = 0; i < uploadFiles.length; i++) {
        const file = uploadFiles[i];
        
        // Validate file type
        if (!file.type.startsWith('image/')) {
          toast.error(`${file.name} is not an image file.`);
          continue;
        }
        
        // Generate unique filename
        const fileName = `${file.name.replace(/\s+/g,'-').toLowerCase()}-${Date.now()}-${i}`;
        
        console.log(`Uploading ${fileName} to product-images bucket...`);
        
        const { data, error } = await supabase.storage
          .from('product-images')
          .upload(fileName, file, {
            cacheControl: '3600',
            upsert: false
          });

        if (error) {
          console.error('Upload error:', error);
          toast.error(`Failed to upload ${file.name}: ${error.message}`);
          continue;
        }

        console.log('Upload successful, getting public URL:', data.path);
        
        const { data: publicUrlData } = supabase.storage
          .from('product-images')
          .getPublicUrl(data.path);
          
        console.log('Public URL:', publicUrlData.publicUrl);
        newUrls.push(publicUrlData.publicUrl);
      }

      setUploadedImageUrls(prev => [...prev, ...newUrls]);
      if (newUrls.length > 0) {
        toast.success(`${newUrls.length} image(s) uploaded successfully!`);
      }
      setUploadFiles(null);
    } catch (err) {
      console.error('Upload error:', err);
      toast.error('Upload failed due to an unexpected error.');
    } finally {
      setIsUploading(false);
    }
  };

  // Open image assign modal for clicked image
  const onImageClick = (url: string) => {
    setSelectedImageUrl(url);
    setImageAssignOpen(true);
  };

  // Callback after assigning image to product; refresh local state
  const onImageAssigned = () => {
    setUploadedImageUrls(prev => prev.filter(url => url !== selectedImageUrl));
    setSelectedImageUrl(null);
    setImageAssignOpen(false);
  };

  // Parse voice command to add multiple products
  const onVoiceCommand = async (command: string) => {
    setVoiceCommand(command);
    if (!command) return;

    // Use fuzzy search product list for matching
    const productNames = products.map(p => ({ name: p.name }));
    
    console.log("Processing voice command:", command);
    console.log("Available product names for matching:", productNames);

    const multiProducts = parseMultiProductCommand(command, productNames);
    console.log("Parsed products:", multiProducts);
    
    if (multiProducts.length === 0) {
      toast.error('Could not parse any products from voice command.');
      return;
    }

    // For each product from voice command, add to inventory (if doesn't exist, add as new)
    const newlyAdded: Product[] = [];
    for (const item of multiProducts) {
      try {
        const existing = products.find(p => p.name.toLowerCase() === item.name.toLowerCase());
        if (existing) {
          // Update quantity and price
          await updateProduct(existing.id, {
            ...existing,
            quantity: existing.quantity + (item.quantity || 0),
            price: item.price ?? existing.price,
            updatedAt: new Date().toISOString()
          });
          newlyAdded.push({
            ...existing,
            quantity: existing.quantity + (item.quantity || 0),
            price: item.price ?? existing.price,
          });
        } else {
          // Add new product
          const newProduct = {
            name: item.name,
            quantity: item.quantity || 0,
            unit: item.unit || 'unit',
            position: '',
            price: item.price || 0,
            image_url: '', // Will auto-assign later if has image
            barcode: undefined,
            stockAlert: undefined,
            shopId: undefined,
          };
          
          await addProduct(newProduct);
          newlyAdded.push({
            ...newProduct,
            id: Date.now().toString(), // Temporary ID for display purposes
            updatedAt: new Date().toISOString(),
            createdAt: new Date().toISOString(),
          });
        }
      } catch (err) {
        console.error('Error adding product:', err);
        toast.error(`Failed to add/update product: ${item.name}`);
      }
    }

    setAddedProducts(prev => [...prev, ...newlyAdded]);
    toast.success(`${multiProducts.length} product(s) processed from voice.`);
  };

  // Undo last added product from voice command
  const undoLastAddition = () => {
    if (addedProducts.length === 0) return;
    const last = addedProducts[addedProducts.length - 1];

    // We simply reduce quantity from inventory or delete if quantity zero
    const currentProduct = products.find(p => p.id === last.id);
    if (!currentProduct) return;

    const newQuantity = currentProduct.quantity - last.quantity;
    if (newQuantity > 0) {
      updateProduct(currentProduct.id, {
        ...currentProduct,
        quantity: newQuantity,
        updatedAt: new Date().toISOString()
      });
    } else {
      // In real implementation, we would call deleteProduct, but skipping here to keep minimal
      toast.info(`Quantity for ${currentProduct.name} reduced to zero (not deleting).`);
    }

    setAddedProducts(prev => prev.slice(0, -1));
    toast.success('Last addition undone');
  };

  return (
    <div className="max-w-5xl mx-auto p-4 space-y-6">
      <h1 className="text-3xl font-bold">Bulk Inventory & Image Assignment</h1>

      <section className="bg-card border rounded-lg shadow-sm p-6">
        <h2 className="text-xl font-semibold mb-4">Upload Product Images</h2>
        <div className="flex flex-col space-y-4">
          <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-input rounded-lg cursor-pointer bg-background hover:bg-muted/50 transition-colors">
            <div className="flex flex-col items-center justify-center pt-5 pb-6">
              <Upload className="w-10 h-10 mb-3 text-muted-foreground" />
              <p className="mb-2 text-sm text-muted-foreground">
                <span className="font-semibold">Click to upload</span> or drag and drop
              </p>
              <p className="text-xs text-muted-foreground">
                PNG, JPG, GIF up to 10MB
              </p>
            </div>
            <input 
              type="file"
              multiple
              accept="image/*"
              onChange={e => setUploadFiles(e.target.files)}
              className="hidden"
              data-testid="bulk-upload-input"
            />
          </label>
          
          {uploadFiles && uploadFiles.length > 0 && (
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm text-muted-foreground">
                {uploadFiles.length} file(s) selected
              </span>
              <Button 
                onClick={handleUpload} 
                disabled={isUploading}
                className="ml-auto"
              >
                {isUploading ? 'Uploading...' : 'Upload Selected Images'}
              </Button>
            </div>
          )}
        </div>
      </section>

      <section>
        <h2 className="text-xl font-semibold mb-4">Image Gallery</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 max-h-96 overflow-y-auto border rounded p-4 bg-background">
          {uploadedImageUrls.length === 0 && (
            <p className="text-muted-foreground col-span-full text-center py-12">No uploaded images to assign.</p>
          )}
          {uploadedImageUrls.map((url, idx) => (
            <div key={idx} className="relative group">
              <img
                src={url}
                alt="Uploaded Product"
                className="cursor-pointer rounded-md border border-muted hover:border-primary object-cover w-full h-32"
                onClick={() => onImageClick(url)}
                loading="lazy"
              />
              <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 rounded-md transition-opacity">
                <Button size="sm" variant="secondary" onClick={() => onImageClick(url)}>
                  Assign
                </Button>
              </div>
            </div>
          ))}
        </div>

        <ImageAssignModal
          open={imageAssignOpen}
          onOpenChange={setImageAssignOpen}
          imageUrl={selectedImageUrl || ''}
          onAssigned={onImageAssigned}
        />
      </section>

      <section className="bg-card border rounded-lg shadow-sm p-6">
        <h2 className="text-xl font-semibold mb-4">Voice Command - Add Multiple Products</h2>
        <div className="space-y-4">
          <textarea
            placeholder="Speak your command here or paste text like: 'Add 2 kg rice for ₹100, 3 litre milk for ₹90, 5 packs of biscuits for ₹50'"
            value={voiceCommand}
            onChange={e => setVoiceCommand(e.target.value)}
            className="w-full p-3 border rounded-md min-h-[100px]"
            rows={3}
          />
          <div className="flex gap-2">
            <Button onClick={() => onVoiceCommand(voiceCommand)}>Process Command</Button>
            <VoiceInput onCommand={onVoiceCommand} />
          </div>
        </div>
      </section>

      <section>
        <h2 className="text-xl font-semibold mb-4">Products Added from Voice (Real-Time)</h2>
        {addedProducts.length === 0 && <p className="text-muted-foreground">No products added from voice commands yet.</p>}
        <ul className="space-y-2 max-h-60 overflow-y-auto border rounded p-2">
          {addedProducts.map((p, idx) => (
            <li key={idx} className="flex justify-between items-center p-2 border rounded bg-white shadow-sm">
              <div>
                <strong>{p.name}</strong> &mdash; {p.quantity} {p.unit} @ {p.price.toFixed(2)}
              </div>
              {idx === addedProducts.length - 1 && (
                <Button size="sm" variant="outline" onClick={undoLastAddition}>Undo Last</Button>
              )}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

// Helper component for voice input
const VoiceInput = ({ onCommand }: { onCommand: (command: string) => void }) => {
  const [isListening, setIsListening] = useState(false);
  
  const startListening = () => {
    setIsListening(true);
    
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      toast.error("Speech recognition not supported in this browser");
      setIsListening(false);
      return;
    }
    
    const SpeechRecognition = window.webkitSpeechRecognition || window.SpeechRecognition;
    const recognition = new SpeechRecognition();
    
    recognition.lang = 'en-US';
    recognition.continuous = false;
    recognition.interimResults = false;
    
    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      console.log("Voice transcript:", transcript);
      onCommand(transcript);
    };
    
    recognition.onend = () => {
      setIsListening(false);
    };
    
    recognition.onerror = (event) => {
      console.error("Speech recognition error", event.error);
      setIsListening(false);
      toast.error("Failed to recognize speech");
    };
    
    recognition.start();
  };
  
  return (
    <Button 
      variant="outline" 
      onClick={startListening} 
      disabled={isListening}
    >
      {isListening ? 'Listening...' : 'Speak Command'}
    </Button>
  );
};
