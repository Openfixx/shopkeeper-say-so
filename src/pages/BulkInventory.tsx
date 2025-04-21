import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useInventory } from '@/context/InventoryContext';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';
import { parseMultiProductCommand, MultiProduct } from '@/utils/multiVoiceParse';
import { FileUp, Mic, Info, X } from 'lucide-react';
import { useVoiceRecognition } from '@/lib/voice';
import { Badge } from '@/components/ui/badge';
import MultiProductAddToast from '@/components/ui-custom/MultiProductAddToast';

const BulkInventory: React.FC = () => {
  const [bulkText, setBulkText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [parsedProducts, setParsedProducts] = useState<MultiProduct[]>([]);
  const [showVoiceUI, setShowVoiceUI] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [bulkProducts, setBulkProducts] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const { products, addProduct } = useInventory();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { listen, isListening } = useVoiceRecognition();
  const [showMultiProductToast, setShowMultiProductToast] = useState(false);

  const handleTextParse = () => {
    if (!bulkText.trim()) {
      toast.error('Please enter some text to parse');
      return;
    }
    
    setIsProcessing(true);
    
    try {
      // Get existing product names for better matching
      const productNames = products.map(p => ({ name: p.name }));
      
      // Parse the bulk text
      const parsed = parseMultiProductCommand(bulkText, productNames);
      setParsedProducts(parsed);
      
      if (parsed.length === 0) {
        toast.error('No products could be identified in the text');
      } else {
        toast.success(`Identified ${parsed.length} products`);
      }
    } catch (error) {
      console.error('Error parsing bulk text:', error);
      toast.error('Failed to parse text. Please check format and try again.');
    } finally {
      setIsProcessing(false);
    }
  };
  
  const handleVoiceCommand = async () => {
    try {
      setShowVoiceUI(true);
      const result = await listen();
      setTranscript(result.rawText);
      
      // Parse the voice command for products
      const productNames = products.map(p => ({ name: p.name }));
      const parsed = parseMultiProductCommand(result.rawText, productNames);
      setParsedProducts(parsed);
      
      if (parsed.length === 0) {
        toast.error('No products could be identified in the voice command');
      } else {
        toast.success(`Identified ${parsed.length} products from voice command`);
      }
    } catch (error) {
      console.error('Voice recognition error:', error);
      toast.error('Voice recognition failed. Please try again.');
    }
  };

  const handleAddToInventory = () => {
    if (parsedProducts.length === 0) {
      toast.error('No products to add');
      return;
    }
    
    setShowMultiProductToast(true);
    
    // Add each product to inventory with delay
    parsedProducts.forEach((product, index) => {
      setTimeout(() => {
        const userId = user?.id || 'demo-user';
        addProduct({
          name: product.name,
          quantity: product.quantity || 1,
          unit: product.unit || 'unit',
          price: product.price || 0,
          position: 'Default',
          image_url: '',
          userId,
          barcode: undefined,
          stockAlert: undefined,
          shopId: undefined
        });
        
        // If last product, show success and navigate
        if (index === parsedProducts.length - 1) {
          setTimeout(() => {
            toast.success(`Successfully added ${parsedProducts.length} products to inventory`);
            // Reset everything
            setBulkText('');
            setParsedProducts([]);
            setShowVoiceUI(false);
            setTranscript('');
          }, 1000);
        }
      }, index * 800);
    });
  };

  const handleCancelParsed = () => {
    setParsedProducts([]);
    setShowVoiceUI(false);
  };

  const handleBulkUpload = async () => {
    setIsUploading(true);
    try {
      // Process and filter valid products
      const validProducts = bulkProducts
        .filter(p => p.name && p.price)
        .map(p => ({
          name: p.name,
          description: p.description || '',
          price: Number(p.price) || 0,
          stock: Number(p.stock) || 0,
          barcode: p.barcode || '',
          category: p.category || '',
          imageUrl: p.imageUrl || '',
          costPrice: Number(p.costPrice) || 0,
          sellingPrice: Number(p.sellingPrice) || 0,
          taxRate: Number(p.taxRate) || 0,
          sku: p.sku || '',
          supplier: p.supplier || '',
          reorderPoint: Number(p.reorderPoint) || 0,
          expiryDate: p.expiryDate || null
        }));

      if (validProducts.length === 0) {
        toast.error('No valid products to upload');
        return;
      }

      // Upload products
      const { data, error } = await supabase.from('products').insert(validProducts);

      if (error) throw error;
      
      toast.success(`Successfully uploaded ${validProducts.length} products`);
      setBulkProducts([]);
      setShowUploadModal(false);
    } catch (error: any) {
      console.error('Error uploading products:', error);
      toast.error(error.message || 'Error uploading products');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent">
          Bulk Inventory
        </h1>
        <p className="text-muted-foreground mt-1">Add multiple products at once using text or voice commands</p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card className="border shadow-md">
          <CardHeader>
            <CardTitle>Text Input</CardTitle>
            <CardDescription>
              Enter multiple products separated by commas. Format: "quantity unit product for price"
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label htmlFor="bulk-text">Product List</Label>
                <Textarea
                  id="bulk-text"
                  placeholder="Example: 5 kg rice for ₹200, 2 litre milk for ₹60, 3 packs biscuits for ₹45"
                  className="h-32"
                  value={bulkText}
                  onChange={(e) => setBulkText(e.target.value)}
                />
              </div>
              <div className="text-xs text-muted-foreground space-y-1">
                <p className="flex items-center"><Info className="h-3 w-3 mr-1" /> Supported format examples:</p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>5 kg rice for ₹200</li>
                  <li>2 litre milk</li>
                  <li>3 packs biscuits for Rs 45</li>
                </ul>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between border-t pt-4">
            <div className="space-x-2">
              <Button 
                variant="outline"
                onClick={() => setBulkText('')}
                disabled={!bulkText || isProcessing}
              >
                Clear
              </Button>
              <Button
                onClick={handleTextParse}
                disabled={!bulkText || isProcessing}
              >
                Parse Products
              </Button>
            </div>
            <Button
              variant="default"
              className="bg-gradient-to-r from-violet-600 to-indigo-600"
              onClick={handleVoiceCommand}
              disabled={isListening}
            >
              <Mic className="h-4 w-4 mr-2" />
              Voice Command
            </Button>
          </CardFooter>
        </Card>

        <Card className="border shadow-md">
          <CardHeader>
            <CardTitle>Parsed Products</CardTitle>
            <CardDescription>
              {parsedProducts.length 
                ? `${parsedProducts.length} products identified` 
                : "Products will appear here after parsing"}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {showVoiceUI && transcript && (
              <div className="px-6 py-3 bg-muted/30 border-b">
                <p className="text-sm font-medium">Voice Command:</p>
                <p className="text-sm mt-1">{transcript}</p>
              </div>
            )}
            
            {parsedProducts.length > 0 ? (
              <div className="max-h-[320px] overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product</TableHead>
                      <TableHead className="w-[100px]">Quantity</TableHead>
                      <TableHead className="w-[100px]">Unit</TableHead>
                      <TableHead className="w-[100px]">Price</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {parsedProducts.map((product, idx) => (
                      <TableRow key={idx}>
                        <TableCell className="font-medium">{product.name}</TableCell>
                        <TableCell>{product.quantity || 1}</TableCell>
                        <TableCell>{product.unit || 'unit'}</TableCell>
                        <TableCell>{product.price ? `₹${product.price}` : '-'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center px-6">
                <FileUp className="h-10 w-10 text-muted-foreground/40 mb-3" />
                <p className="text-muted-foreground">
                  No products parsed yet. Enter text or use voice command.
                </p>
              </div>
            )}
          </CardContent>
          <CardFooter className="flex justify-end border-t pt-4 gap-2">
            {parsedProducts.length > 0 && (
              <>
                <Button variant="ghost" onClick={handleCancelParsed}>
                  <X className="h-4 w-4 mr-1" /> Cancel
                </Button>
                <Button 
                  onClick={handleAddToInventory} 
                  disabled={parsedProducts.length === 0}
                  className="bg-gradient-to-r from-violet-600 to-indigo-600"
                >
                  Add {parsedProducts.length} Products to Inventory
                </Button>
              </>
            )}
          </CardFooter>
        </Card>
      </div>
      
      {showMultiProductToast && (
        <MultiProductAddToast 
          products={parsedProducts} 
          onClose={() => setShowMultiProductToast(false)}
          onComplete={() => {
            navigate('/products');
          }}
        />
      )}
    </div>
  );
};

export default BulkInventory;
