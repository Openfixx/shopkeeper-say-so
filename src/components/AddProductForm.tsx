
import React, { useState } from 'react';
import { useInventory } from '@/context/InventoryContext';

export const AddProductForm: React.FC = () => {
  const { addProduct } = useInventory();

  // local form state
  const [name, setName]       = useState('');
  const [quantity, setQuantity] = useState(0);
  const [unit, setUnit]       = useState<string>('kg');
  const [position, setPosition] = useState('');
  const [price, setPrice]     = useState(0);
  const [expiry, setExpiry]   = useState('');
  const [imageUrl, setImageUrl] = useState('');

  // on form submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return alert('Product name is required');
    await addProduct({
      name,
      quantity,
      unit,
      position,
      price,
      expiry,
    });
    // reset everything
    setName('');
    setQuantity(0);
    setUnit('kg');
    setPosition('');
    setPrice(0);
    setExpiry('');
    setImageUrl('');
  };

  return (
    <form onSubmit={handleSubmit} style={{ maxWidth: 400, margin: '0 auto' }}>
      <h2>Add New Product</h2>

      <label>Product Name</label>
      <div style={{ display: 'flex' }}>
        <input
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="e.g. rice"
          style={{ flex: 1 }}
        />
      </div>

      <label>Quantity</label>
      <div style={{ display: 'flex' }}>
        <input
          type="number"
          value={quantity}
          min={0}
          onChange={e => setQuantity(Number(e.target.value))}
          style={{ flex: 1 }}
        />
        <input
          type="text"
          value={unit}
          onChange={e => setUnit(e.target.value)}
          style={{ width: 60, marginLeft: 8 }}
        />
      </div>

      <label>Position</label>
      <input
        type="text"
        value={position}
        onChange={e => setPosition(e.target.value)}
        placeholder="e.g. rack 7"
      />

      <label>Price</label>
      <input
        type="number"
        value={price}
        min={0}
        onChange={e => setPrice(Number(e.target.value))}
        placeholder="₹"
      />

      <label>Expiry</label>
      <input
        type="text"
        value={expiry}
        onChange={e => setExpiry(e.target.value)}
        placeholder="e.g. next year / 2026‑04"
      />

      <label>Image URL</label>
      <input
        type="text"
        value={imageUrl}
        onChange={e => setImageUrl(e.target.value)}
        placeholder="https://..."
      />

      {imageUrl && (
        <div style={{ margin: '12px 0' }}>
          <img
            src={imageUrl}
            alt={name}
            style={{ width: 200, height: 200, objectFit: 'cover' }}
          />
        </div>
      )}

      <button type="submit" style={{ marginTop: 16 }}>
        Add Product
      </button>
    </form>
  );
};
