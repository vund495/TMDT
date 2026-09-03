import { apiFetch } from "./client";
import type { TokenResponse, UserProfile } from "../../types";

export interface LoginInput {
  email: string;
  password: string;
}

export interface RegisterInput {
  email: string;
  password: string;
  full_name?: string;
  phone?: string;
  role?: "customer" | "workshop_owner";
}

export function login(body: LoginInput): Promise<TokenResponse> {
  return apiFetch<TokenResponse>("/api/v1/auth/login", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export function register(body: RegisterInput): Promise<TokenResponse> {
  return apiFetch<TokenResponse>("/api/v1/auth/register", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export function getMe(): Promise<UserProfile> {
  return apiFetch<UserProfile>("/api/v1/auth/me");
}
