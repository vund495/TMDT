import { apiFetch } from "./client";
import type { Comment, Page, Product, ProductDetail, Review, Workshop } from "../../types";

export interface ProductQuery {
  q?: string;
  theme?: string;
  workshop_id?: string;
  min_price?: number;
  max_price?: number;
  sort?: "newest" | "price_asc" | "price_desc" | "best_seller";
  page?: number;
  page_size?: number;
}

export function listProducts(params: ProductQuery = {}): Promise<Page<Product>> {
  const sp = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== "") sp.set(k, String(v));
  });
  const q = sp.toString();
  return apiFetch<Page<Product>>(`/api/v1/products${q ? `?${q}` : ""}`);
}

export function getProduct(id: string): Promise<ProductDetail> {
  return apiFetch<ProductDetail>(`/api/v1/products/${id}`);
}

export function listWorkshops(q?: string): Promise<Workshop[]> {
  const sp = new URLSearchParams();
  if (q) sp.set("q", q);
  const s = sp.toString();
  return apiFetch<Workshop[]>(`/api/v1/workshops${s ? `?${s}` : ""}`);
}

export function getWorkshop(id: string): Promise<Workshop> {
  return apiFetch<Workshop>(`/api/v1/workshops/${id}`);
}

export function listReviews(productId: string): Promise<Review[]> {
  return apiFetch<Review[]>(`/api/v1/products/${productId}/reviews`);
}

export function createReview(
  productId: string,
  body: { rating: number; content?: string }
): Promise<Review> {
  return apiFetch<Review>(`/api/v1/products/${productId}/reviews`, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export function listComments(productId: string): Promise<Comment[]> {
  return apiFetch<Comment[]>(`/api/v1/products/${productId}/comments`);
}

export function createComment(
  productId: string,
  body: { content: string; parent_id?: string | null }
): Promise<Comment> {
  return apiFetch<Comment>(`/api/v1/products/${productId}/comments`, {
    method: "POST",
    body: JSON.stringify(body),
  });
}
