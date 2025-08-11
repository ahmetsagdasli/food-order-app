import { create } from "zustand";
import type { Product } from "../types";

type CartItem = { product: Product; qty: number };
type CartState = {
  items: CartItem[];
  add: (p: Product, qty?: number) => void;
  inc: (id: string) => void;
  dec: (id: string) => void;
  remove: (id: string) => void;
  clear: () => void;
  total: () => number;
};

const KEY = "cart_v1";

const load = (): CartItem[] => {
  try { return JSON.parse(localStorage.getItem(KEY) || "[]"); } catch { return []; }
};
const save = (items: CartItem[]) => {
  try { localStorage.setItem(KEY, JSON.stringify(items)); } catch {}
};

export const useCart = create<CartState>((set, get) => ({
  items: load(),
  add: (p, qty = 1) => {
    const items = [...get().items];
    const i = items.findIndex(it => it.product._id === p._id);
    if (i >= 0) items[i] = { ...items[i], qty: items[i].qty + qty };
    else items.push({ product: p, qty });
    save(items); set({ items });
  },
  inc: (id) => {
    const items = get().items.map(it => it.product._id === id ? { ...it, qty: it.qty + 1 } : it);
    save(items); set({ items });
  },
  dec: (id) => {
    const items = get().items.map(it => it.product._id === id ? { ...it, qty: Math.max(1, it.qty - 1) } : it);
    save(items); set({ items });
  },
  remove: (id) => {
    const items = get().items.filter(it => it.product._id !== id);
    save(items); set({ items });
  },
  clear: () => { save([]); set({ items: [] }); },
  total: () => get().items.reduce((a, it) => a + it.product.price * it.qty, 0),
}));
