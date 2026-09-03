import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface LocalCartItem {
  product_id: string;
  quantity: number;
  product_name: string;
  product_image?: string | null;
  unit_price: number;
}

interface LocalCartState {
  items: LocalCartItem[];
  add: (item: Omit<LocalCartItem, "quantity">, quantity?: number) => void;
  setQty: (productId: string, quantity: number) => void;
  remove: (productId: string) => void;
  clear: () => void;
}

export const useLocalCart = create<LocalCartState>()(
  persist(
    (set, get) => ({
      items: [],
      add: (item, quantity = 1) => {
        const items = [...get().items];
        const idx = items.findIndex((i) => i.product_id === item.product_id);
        if (idx >= 0) items[idx].quantity += quantity;
        else items.push({ ...item, quantity });
        set({ items });
      },
      setQty: (productId, quantity) =>
        set({
          items: get().items.map((i) =>
            i.product_id === productId ? { ...i, quantity: Math.max(1, quantity) } : i
          ),
        }),
      remove: (productId) =>
        set({ items: get().items.filter((i) => i.product_id !== productId) }),
      clear: () => set({ items: [] }),
    }),
    { name: "tmdt_local_cart" }
  )
);

export const selectLocalTotal = (items: LocalCartItem[]) =>
  items.reduce((sum, i) => sum + i.unit_price * i.quantity, 0);