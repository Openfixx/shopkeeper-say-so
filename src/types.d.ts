
declare module '@/types' {
  export interface Product {
    id: string;
    name: string;
    description: string;
    quantity: number;
    unit: string;
    price: number;
    position: string;
    image: string;
    image_url: string;
    created_at: string;
    expiry?: string;
    barcode?: string;
  }
}
