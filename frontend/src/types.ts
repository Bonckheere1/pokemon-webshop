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

export interface GradedCard {
  id: number;
  seller_id: number;
  card_name: string;
  set_name: string;
  grading_company: string;
  grade: string;
  cert_number: string;
  price: number;
  image: string;
  status: string;
  created_at: string;
}

export interface NewGradedCardListing {
  cardName: string;
  setName?: string;
  gradingCompany: string;
  grade: string;
  certNumber: string;
  price: number;
  image?: string;
}
