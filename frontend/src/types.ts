export interface Product {
  id: number;
  name: string;
  type: string;
  price: number;
  description: string;
  image: string;
}

export interface CartItem extends Product {
  cartItemId: number;
  quantity: number;
  notes: string | null;
}

export interface OrderItem {
  name: string;
  quantity: number;
  price: number;
}

export interface Order {
  id: number;
  session_id: string;
  customer_name: string | null;
  customer_email: string | null;
  gift_message: string | null;
  total: number;
  created_at: string;
  items: OrderItem[];
}

export interface CheckoutPayload {
  customerName?: string;
  customerEmail?: string;
  giftMessage?: string;
  discountAmount?: number;
}
