import { create } from "zustand";
import * as authApi from "../lib/auth";
import { clearToken, setToken } from "../lib/api";
import type { Role, UserProfile } from "../types";

interface RegisterPayload {
  email: string;
  password: string;
  full_name?: string;
  phone?: string;
  role: Role;
}

interface AuthState {
  profile: UserProfile | null;
  loading: boolean;
  init: () => Promise<void>;
  login: (email: string, password: string) => Promise<UserProfile>;
  register: (
    email: string,
    password: string,
    role: Role,
    fullName?: string,
    phone?: string
  ) => Promise<UserProfile>;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()((set) => ({
  profile: null,
  loading: true,

  async init() {
    try {
      const profile = await authApi.fetchMe();
      set({ profile });
    } catch {
      clearToken();
      set({ profile: null });
    } finally {
      set({ loading: false });
    }
  },

  async login(email, password) {
    const data = await authApi.login(email, password);
    setToken(data.access_token);
    set({ profile: data.user });
    return data.user;
  },

  async register(email, password, role, fullName, phone) {
    const payload: RegisterPayload = {
      email,
      password,
      role,
      full_name: fullName || undefined,
      phone: phone || undefined,
    };
    const data = await authApi.register(payload);
    setToken(data.access_token);
    set({ profile: data.user });
    return data.user;
  },

  logout() {
    clearToken();
    set({ profile: null });
  },
}));
