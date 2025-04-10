import { addProduct } from '../lib/inventory';

export default function ImageUploader({ productName }: { productName: string }) {
  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    await addProduct(productName, file);
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
