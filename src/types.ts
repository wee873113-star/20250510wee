export interface Product {
  id: string;
  name: string;
  category: string;
  price_m: number;
  price_l: number;
  available: boolean;
  description?: string;
  order?: number;
}

export interface Category {
  id: string;
  name: string;
  order: number;
}

export interface OrderItem {
  productId: string;
  name: string;
  size: 'M' | 'L';
  price: number;
  quantity: number;
  sugar: string;
  ice: string;
  additions: string[];
}

export type OrderStatus = 'pending' | 'preparing' | 'completed' | 'cancelled';

export interface Order {
  id: string;
  items: OrderItem[];
  totalAmount: number;
  status: OrderStatus;
  customerName?: string;
  customerPhone?: string;
  createdAt: any; // Firestore Timestamp
  updatedAt: any; // Firestore Timestamp
  userId?: string;
}

export const SUGAR_LEVELS = ['正常', '九分', '少糖', '半糖', '微糖', '二分', '無糖'];
export const ICE_LEVELS = ['正常', '少冰', '微冰', '去冰', '完全去冰', '常溫', '熱'];
export const ADDITIONS = [
  { name: '珍珠', price: 5 },
  { name: '波霸', price: 5 },
  { name: '椰果', price: 5 },
  { name: '燕麥', price: 5 },
  { name: '冰淇淋', price: 10 },
];
