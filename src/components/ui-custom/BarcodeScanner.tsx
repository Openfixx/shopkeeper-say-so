
import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Barcode, X, Camera, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { useInventory } from '@/context/InventoryContext';

type BarcodeScannerProps = {
  open: boolean;
  onClose: () => void;
  onScan: (product: any) => void;
};

const BarcodeScanner: React.FC<BarcodeScannerProps> = ({ open, onClose, onScan }) => {
  const { scanBarcode } = useInventory();
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [barcode, setBarcode] = useState('');
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // Start camera when component mounts and dialog is open
  useEffect(() => {
    if (open && !isCameraActive) {
      startCamera();
    }
    
    return () => {
      stopCamera();
    };
  }, [open]);
  
  const startCamera = async () => {
    try {
      const constraints = {
        video: { facingMode: 'environment' }
      };
      
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setIsCameraActive(true);
        toast.success('Camera started');
      }
    } catch (error) {
      console.error('Error starting camera:', error);
      toast.error('Failed to start camera. Please check camera permissions.');
    }
  };
  
  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
      tracks.forEach(track => track.stop());
      videoRef.current.srcObject = null;
      setIsCameraActive(false);
    }
  };
  
  const captureFrame = () => {
    if (!videoRef.current || !canvasRef.current) return;
    
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    
    if (!context) return;
    
    // Set canvas dimensions to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    // Draw current video frame to canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    // In a real app, you would now process this image for barcode detection
    // For this demo, we'll simulate finding a barcode
    
    // Simulate processing delay
    setIsLoading(true);
    setTimeout(() => {
      const mockBarcodes = ['8901234567890', '8901234567891'];
      const randomBarcode = mockBarcodes[Math.floor(Math.random() * mockBarcodes.length)];
      
      // Set the detected barcode
      setBarcode(randomBarcode);
      
      // Look up product by barcode
      processBarcode(randomBarcode);
      
      setIsLoading(false);
    }, 1500);
  };
  
  const handleManualBarcode = async () => {
    if (!barcode || barcode.length < 5) {
      toast.error('Please enter a valid barcode');
      return;
    }
    
    processBarcode(barcode);
  };
  
  const processBarcode = async (code: string) => {
    setIsLoading(true);
    
    try {
      const product = await scanBarcode(code);
      
      if (product) {
        toast.success(`Found product: ${product.name}`);
        onScan(product);
        onClose();
      } else {
        toast.error('No product found with this barcode');
      }
    } catch (error) {
      console.error('Error scanning barcode:', error);
      toast.error('Failed to process barcode');
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogTitle className="flex items-center">
          <Barcode className="w-5 h-5 mr-2" />
          Scan Barcode
        </DialogTitle>
        <DialogDescription>
          Scan a product barcode to quickly add it to your inventory
        </DialogDescription>
        
        <div className="space-y-4">
          <div className="relative rounded-md overflow-hidden bg-black aspect-video">
            <video 
              ref={videoRef}
              autoPlay 
              playsInline 
              muted 
              className="w-full h-full object-cover"
            />
            <canvas ref={canvasRef} className="hidden" />
            
            {!isCameraActive && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                <Button onClick={startCamera} variant="outline">
                  <Camera className="w-4 h-4 mr-2" />
                  Start Camera
                </Button>
              </div>
            )}
            
            {isLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                <RefreshCw className="w-8 h-8 text-white animate-spin" />
              </div>
            )}
          </div>
          
          <div className="flex space-x-2">
            <Button 
              onClick={captureFrame} 
              disabled={!isCameraActive || isLoading} 
              className="flex-1"
            >
              <Camera className="w-4 h-4 mr-2" />
              Capture & Scan
            </Button>
          </div>
          
          <div className="flex items-center space-x-2">
            <div className="h-px flex-1 bg-border"></div>
            <span className="text-xs text-muted-foreground">OR</span>
            <div className="h-px flex-1 bg-border"></div>
          </div>
          
          <div className="flex space-x-2">
            <input
              type="text"
              value={barcode}
              onChange={(e) => setBarcode(e.target.value)}
              placeholder="Enter barcode manually"
              className="flex-1 px-3 py-2 border rounded-md"
            />
            <Button 
              onClick={handleManualBarcode} 
              disabled={isLoading}
              variant="outline"
            >
              <Barcode className="w-4 h-4 mr-2" />
              Lookup
            </Button>
          </div>
        </div>
        
        <DialogFooter className="sm:justify-between">
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            <X className="w-4 h-4 mr-2" />
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default BarcodeScanner;
