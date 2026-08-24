import axios from "axios";
import type { CartItem, GradedCard, NewGradedCardListing, Product } from "./types";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:4000/api";

const client = axios.create({
  baseURL: API_URL,
  withCredentials: true,
});

const SELLER_TOKEN_KEY = "sellerToken";

function sellerAuthHeader(): Record<string, string> {
  const token = localStorage.getItem(SELLER_TOKEN_KEY);
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function fetchProducts(): Promise<Product[]> {
  const { data } = await client.get<Product[]>("/products");
  return data;
}

export async function fetchProduct(id: string): Promise<Product> {
  const { data } = await client.get<Product>(`/products/${id}`);
  return data;
}

export async function fetchCart(): Promise<CartItem[]> {
  const { data } = await client.get<CartItem[]>("/cart");
  return data;
}

export async function addToCart(productId: number, quantity: number): Promise<void> {
  await client.post("/cart", { productId, quantity });
}

export async function removeFromCart(cartItemId: number): Promise<void> {
  await client.delete(`/cart/${cartItemId}`);
}

export async function checkout(): Promise<{ orderId: number; total: number }> {
  const { data } = await client.post("/cart/checkout");
  return data;
}

export async function fetchGradedCards(): Promise<GradedCard[]> {
  const { data } = await client.get<GradedCard[]>("/graded-cards");
  return data;
}

export async function searchGradedCards(params: { company?: string; grade?: string }): Promise<GradedCard[]> {
  const { data } = await client.get<GradedCard[]>("/graded-cards/search", { params });
  return data;
}

export async function fetchGradedCard(id: string): Promise<GradedCard> {
  const { data } = await client.get<GradedCard>(`/graded-cards/${id}`);
  return data;
}

export async function purchaseGradedCard(
  id: number,
  tradeInValue: number
): Promise<{ orderId: number; finalPrice: number }> {
  const { data } = await client.post(`/graded-cards/${id}/purchase`, { tradeInValue });
  return data;
}

export async function sellerRegister(username: string, password: string): Promise<void> {
  const { data } = await client.post<{ token: string }>("/seller/register", { username, password });
  localStorage.setItem(SELLER_TOKEN_KEY, data.token);
}

export async function sellerLogin(username: string, password: string): Promise<void> {
  const { data } = await client.post<{ token: string }>("/seller/login", { username, password });
  localStorage.setItem(SELLER_TOKEN_KEY, data.token);
}

export function sellerLogout(): void {
  localStorage.removeItem(SELLER_TOKEN_KEY);
}

export function isSellerLoggedIn(): boolean {
  return Boolean(localStorage.getItem(SELLER_TOKEN_KEY));
}

export async function createGradedCardListing(listing: NewGradedCardListing): Promise<{ id: number }> {
  const { data } = await client.post("/graded-cards", listing, { headers: sellerAuthHeader() });
  return data;
}

export async function updateGradedCardListing(id: number, fields: { price?: number; status?: string }): Promise<void> {
  await client.patch(`/graded-cards/${id}`, fields, { headers: sellerAuthHeader() });
}

export async function deleteGradedCardListing(id: number): Promise<void> {
  await client.delete(`/graded-cards/${id}`, { headers: sellerAuthHeader() });
}
