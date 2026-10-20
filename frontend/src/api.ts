import axios from "axios";
import type { CartItem, CheckoutPayload, Order, Product } from "./types";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:4000/api";

const client = axios.create({
  baseURL: API_URL,
  withCredentials: true,
});

export async function fetchProducts(sort?: string): Promise<Product[]> {
  const { data } = await client.get<Product[]>("/products", { params: sort ? { sort } : undefined });
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

export async function checkout(payload: CheckoutPayload): Promise<{ orderId: number; total: number }> {
  const { data } = await client.post("/cart/checkout", payload);
  return data;
}

export async function fetchOrder(id: string): Promise<Order> {
  const { data } = await client.get<Order>(`/orders/${id}`);
  return data;
}

export async function adminLogin(password: string): Promise<void> {
  await client.post("/admin/login", { password });
}

export async function fetchAdminOrders(): Promise<Order[]> {
  const { data } = await client.get<Order[]>("/admin/orders");
  return data;
}
