export interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  category: string;
  isAvailable: boolean;
  isFeatured: boolean;
  material: string;
  stockQuantity: number;
}

export interface Category {
  id: number;
  name: string;
  slug: string;
  description: string;
  imageUrl: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
}
