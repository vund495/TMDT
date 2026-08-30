import { apiFetch } from "./api";
import type { AuthResponse, Role, UserProfile } from "../types";

export interface RegisterPayload {
  email: string;
  password: string;
  full_name?: string;
  phone?: string;
  role: Role;
}

export function login(email: string, password: string): Promise<AuthResponse> {
  return apiFetch<AuthResponse>("/api/v1/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export function register(payload: RegisterPayload): Promise<AuthResponse> {
  return apiFetch<AuthResponse>("/api/v1/auth/register", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function fetchMe(): Promise<UserProfile> {
  return apiFetch<UserProfile>("/api/v1/auth/me");
}
