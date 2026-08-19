export interface Product {
  id: number;
  name: string;
  type: string;
  price: number;
  description: string;
  image: string;
  category: "single" | "box";
  contents: string | null;
}

export interface CartItem extends Product {
  cartItemId: number;
  quantity: number;
  notes: string | null;
}
