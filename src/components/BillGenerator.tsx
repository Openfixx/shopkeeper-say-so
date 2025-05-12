
import React from 'react';
import { generateBill } from '../lib/inventory';
import { Button } from '@/components/ui/button';
import { Printer } from 'lucide-react';
import UnifiedVoiceCommand from './ui-custom/UnifiedVoiceCommand';

interface BillGeneratorProps {
  items: { name: string; price: number }[];
}

export default function BillGenerator({ items }: BillGeneratorProps) {
  const { items: billItems, total } = generateBill(items);

  const printBill = () => {
    const billContent = `
      <html>
      <head>
        <title>Bill Receipt</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; }
          h1 { text-align: center; }
          .bill-item { margin-bottom: 6px; }
          .total { font-weight: bold; margin-top: 20px; border-top: 1px solid #ccc; padding-top: 10px; }
          .footer { margin-top: 30px; text-align: center; font-size: 12px; }
        </style>
      </head>
      <body>
        <h1>Shopkeeper Say So</h1>
        <div>
          ${billItems.map(item => `<p class="bill-item">${item.name} - ₹${item.price.toFixed(2)}</p>`).join('')}
          <p class="total">Total: ₹${total.toFixed(2)}</p>
        </div>
        <div class="footer">
          Thank you for your purchase!<br>
          Date: ${new Date().toLocaleDateString()}
        </div>
      </body>
      </html>
    `;
    const printWindow = window.open('', '', 'width=600,height=600');
    printWindow?.document.write(billContent);
    printWindow?.document.close();
    printWindow?.focus();
    printWindow?.print();
  };

  return (
    <div className="space-y-4 p-4 border rounded-lg shadow-sm bg-background">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Your Bill</h2>
        <UnifiedVoiceCommand compact={true} />
      </div>
      
      <div className="space-y-2 divide-y">
        {billItems.map((item, i) => (
          <div key={i} className="py-2 flex justify-between">
            <span>{item.name}</span>
            <span>₹{item.price.toFixed(2)}</span>
          </div>
        ))}
        <div className="py-2 flex justify-between font-semibold">
          <span>Total</span>
          <span>₹{total.toFixed(2)}</span>
        </div>
      </div>
      
      <Button onClick={printBill} className="w-full">
        <Printer className="mr-2 h-4 w-4" />
        Print Bill
      </Button>
    </div>
  );
}
