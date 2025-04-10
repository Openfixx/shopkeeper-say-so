import { supabase } from './supabase';

export const addItem = async (item: { name: string; price: number }) => {
  const { error } = await supabase.from('inventory').insert([item]);
  if (error) console.error('Error adding item:', error);
};

export const generateBill = (items: { name: string; price: number }[]) => {
  const total = items.reduce((sum, item) => sum + item.price, 0);
  return { items, total };
};
