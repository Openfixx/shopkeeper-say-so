import { generateBill } from '../lib/inventory';

interface BillGeneratorProps {
  items: { name: string; price: number }[];
}

export default function BillGenerator({ items }: BillGeneratorProps) {
  const { items: billItems, total } = generateBill(items);

  const printBill = () => {
    const billContent = `
      <h1>Shopkeeper Say So</h1>
      ${billItems.map(item => `<p>${item.name} - ₹${item.price}</p>`).join('')}
      <p><strong>Total: ₹${total}</strong></p>
    `;
    const printWindow = window.open('', '', 'width=600,height=600');
    printWindow?.document.write(billContent);
    printWindow?.document.close();
    printWindow?.focus();
    printWindow?.print();
  };

  return (
    <div className="bill">
      <h2>Your Bill</h2>
      {billItems.map((item, i) => (
        <p key={i}>{item.name} - ₹{item.price}</p>
      ))}
      <p>Total: ₹{total}</p>
      <button onClick={printBill}>Print Bill</button>
    </div>
  );
}
