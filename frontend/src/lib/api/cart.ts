import { apiFetch } from "./client";
import type { Cart, CartItem } from "../../types";

export function getCart(): Promise<Cart> {
  return apiFetch<Cart>("/api/v1/cart");
}

export function addToCart(productId: string, quantity = 1): Promise<Cart> {
  return apiFetch<Cart>("/api/v1/cart/items", {
    method: "POST",
    body: JSON.stringify({ product_id: productId, quantity }),
  });
}

export function updateCartItem(itemId: string, quantity: number): Promise<Cart> {
  return apiFetch<Cart>(`/api/v1/cart/items/${itemId}`, {
    method: "PATCH",
    body: JSON.stringify({ quantity }),
  });
}

export function removeCartItem(itemId: string): Promise<Cart> {
  return apiFetch<Cart>(`/api/v1/cart/items/${itemId}`, { method: "DELETE" });
}
