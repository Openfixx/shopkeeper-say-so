
import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { CheckCircle, AlertCircle, Upload, FileText, FileSpreadsheet, Trash2 } from 'lucide-react';
import { useInventory } from '@/context/InventoryContext';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';

interface ImportRow {
  name: string;
  quantity: number;
  unit: string;
  price: number;
  position: string;
  status?: 'pending' | 'success' | 'error';
  message?: string;
}

const BulkInventory = () => {
  const { addProduct } = useInventory();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [importData, setImportData] = useState<ImportRow[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processedCount, setProcessedCount] = useState(0);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [fileName, setFileName] = useState('');
  
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setFileName(file.name);
    
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const csvData = event.target?.result as string;
        const rows = parseCSV(csvData);
        setImportData(rows);
        setShowUploadModal(true);
      } catch (error) {
        console.error('Error parsing file:', error);
        toast.error('Failed to parse file. Please check the format.');
      }
    };
    
    reader.readAsText(file);
  };
  
  const parseCSV = (csvText: string): ImportRow[] => {
    const lines = csvText.split('\n');
    
    // Check header row
    const header = lines[0].toLowerCase().split(',');
    const requiredColumns = ['name', 'quantity', 'unit', 'price'];
    const missingColumns = requiredColumns.filter(col => !header.includes(col));
    
    if (missingColumns.length > 0) {
      throw new Error(`Missing required columns: ${missingColumns.join(', ')}`);
    }
    
    const nameIndex = header.indexOf('name');
    const quantityIndex = header.indexOf('quantity');
    const unitIndex = header.indexOf('unit');
    const priceIndex = header.indexOf('price');
    const positionIndex = header.indexOf('position');
    
    return lines.slice(1)
      .filter(line => line.trim() !== '')
      .map(line => {
        const values = line.split(',');
        return {
          name: values[nameIndex]?.trim() || '',
          quantity: parseFloat(values[quantityIndex]) || 0,
          unit: values[unitIndex]?.trim() || 'unit',
          price: parseFloat(values[priceIndex]) || 0,
          position: positionIndex >= 0 ? values[positionIndex]?.trim() || '' : '',
          status: 'pending'
        };
      });
  };
  
  const handleImport = async () => {
    setIsProcessing(true);
    setProcessedCount(0);
    
    const updatedData = [...importData];
    
    for (let i = 0; i < updatedData.length; i++) {
      const item = updatedData[i];
      
      try {
        await addProduct({
          name: item.name,
          quantity: item.quantity,
          unit: item.unit,
          price: item.price,
          position: item.position,
          image_url: ''
        });
        
        updatedData[i] = {
          ...item,
          status: 'success',
          message: 'Added successfully'
        };
      } catch (error) {
        console.error(`Error adding product ${item.name}:`, error);
        
        updatedData[i] = {
          ...item,
          status: 'error',
          message: error instanceof Error ? error.message : 'Failed to add product'
        };
      }
      
      setProcessedCount(i + 1);
      setImportData([...updatedData]);
    }
    
    setIsProcessing(false);
    toast.success(`Processed ${updatedData.filter(item => item.status === 'success').length} items successfully`);
  };
  
  const handleDownloadTemplate = () => {
    const template = 'name,quantity,unit,price,position\nRice,10,kg,100,Shelf A\nSugar,5,kg,50,Shelf B';
    const blob = new Blob([template], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'inventory_template.csv';
    a.click();
    URL.revokeObjectURL(url);
    
    toast.success('Template downloaded');
  };
  
  const handleClearData = () => {
    setImportData([]);
    setProcessedCount(0);
    setFileName('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    setShowUploadModal(false);
  };
  
  return (
    <div className="container mx-auto p-4 space-y-6">
      <h1 className="text-2xl font-bold mb-4">Bulk Inventory Management</h1>
      
      <Tabs defaultValue="import" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="import">Import Products</TabsTrigger>
          <TabsTrigger value="export">Export Products</TabsTrigger>
        </TabsList>
        
        <TabsContent value="import" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Import Products</CardTitle>
              <CardDescription>
                Upload a CSV file to add multiple products at once.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-md p-6 text-center">
                <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">
                    Upload a CSV file with product details
                  </p>
                  <Label htmlFor="file-upload" className="cursor-pointer">
                    <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
                      Select File
                    </Button>
                    <Input
                      ref={fileInputRef}
                      id="file-upload"
                      type="file"
                      accept=".csv"
                      className="hidden"
                      onChange={handleFileSelect}
                    />
                  </Label>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  Need a template? Download our format.
                </p>
                <Button variant="link" size="sm" onClick={handleDownloadTemplate}>
                  <FileText className="mr-2 h-4 w-4" />
                  Download Template
                </Button>
              </div>
              
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Important</AlertTitle>
                <AlertDescription>
                  CSV file must include name, quantity, unit, and price columns.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="export" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Export Products</CardTitle>
              <CardDescription>
                Download your inventory as CSV or Excel file.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Button className="flex items-center justify-center h-24">
                  <div className="text-center">
                    <FileText className="h-8 w-8 mx-auto mb-2" />
                    <span>Export as CSV</span>
                  </div>
                </Button>
                
                <Button variant="outline" className="flex items-center justify-center h-24">
                  <div className="text-center">
                    <FileSpreadsheet className="h-8 w-8 mx-auto mb-2" />
                    <span>Export as Excel</span>
                  </div>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      <Dialog open={showUploadModal} onOpenChange={setShowUploadModal}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Review and Import Products</DialogTitle>
            <DialogDescription>
              File: {fileName} ({importData.length} products)
            </DialogDescription>
          </DialogHeader>
          
          <div className="max-h-96 overflow-y-auto">
            <Table>
              <TableCaption>
                {isProcessing 
                  ? `Processing... (${processedCount}/${importData.length})` 
                  : 'Review products before importing'}
              </TableCaption>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead className="text-right">Quantity</TableHead>
                  <TableHead>Unit</TableHead>
                  <TableHead className="text-right">Price</TableHead>
                  <TableHead>Position</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {importData.map((item, index) => (
                  <TableRow key={index} className={item.status === 'error' ? 'bg-red-50 dark:bg-red-900/10' : ''}>
                    <TableCell>{item.name}</TableCell>
                    <TableCell className="text-right">{item.quantity}</TableCell>
                    <TableCell>{item.unit}</TableCell>
                    <TableCell className="text-right">{item.price}</TableCell>
                    <TableCell>{item.position}</TableCell>
                    <TableCell>
                      {item.status === 'success' && <CheckCircle className="h-4 w-4 text-green-500" />}
                      {item.status === 'error' && <AlertCircle className="h-4 w-4 text-red-500" title={item.message} />}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          
          <DialogFooter className="flex flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={handleClearData} className="sm:order-1">
              <Trash2 className="h-4 w-4 mr-2" />
              Clear
            </Button>
            <Button onClick={handleImport} disabled={isProcessing || importData.length === 0} className="sm:order-2">
              {isProcessing ? (
                <>Processing...</>
              ) : (
                <>Import {importData.length} Products</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BulkInventory;
