import { create } from "zustand";
import { type UserProfile, type Role } from "../types";
import {
  login as apiLogin,
  register as apiRegister,
  getMe,
  type LoginInput,
  type RegisterInput,
} from "../lib/api";
import { getToken, setToken, clearToken } from "../lib/api/client";
import { addToCart } from "../lib/api";
import { useLocalCart } from "./localCartStore";

// Đồng bộ giỏ hàng local (chưa đăng nhập) lên server sau khi login.
async function mergeLocalCart() {
  const local = useLocalCart.getState().items;
  if (local.length === 0) return;
  try {
    for (const item of local) {
      await addToCart(item.product_id, item.quantity);
    }
    useLocalCart.getState().clear();
  } catch {
    // giữ giỏ local lại nếu đồng bộ lỗi
  }
}

interface AuthState {
  token: string | null;
  profile: UserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (input: LoginInput) => Promise<UserProfile>;
  register: (input: RegisterInput) => Promise<UserProfile>;
  logout: () => void;
  initFromStorage: () => Promise<void>;
  setRole: (role: Role) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  token: getToken(),
  profile: null,
  isAuthenticated: Boolean(getToken()),
  isLoading: true,

  login: async (input) => {
    const res = await apiLogin(input);
    setToken(res.access_token);
    set({ token: res.access_token, profile: res.user, isAuthenticated: true });
    await mergeLocalCart();
    return res.user;
  },

  register: async (input) => {
    const res = await apiRegister(input);
    setToken(res.access_token);
    set({ token: res.access_token, profile: res.user, isAuthenticated: true });
    await mergeLocalCart();
    return res.user;
  },

  logout: () => {
    clearToken();
    set({ token: null, profile: null, isAuthenticated: false });
  },

  initFromStorage: async () => {
    const token = getToken();
    if (!token) {
      set({ isLoading: false, isAuthenticated: false, profile: null });
      return;
    }
    try {
      const user = await getMe();
      set({ profile: user, isAuthenticated: true, isLoading: false });
    } catch {
      clearToken();
      set({ token: null, profile: null, isAuthenticated: false, isLoading: false });
      return;
    }
    mergeLocalCart();
  },

  setRole: (role) => {
    set((s) => (s.profile ? { ...s, profile: { ...s.profile, role } } : s));
  },
}));
