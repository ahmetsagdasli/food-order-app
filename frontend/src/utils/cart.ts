// basit localStorage tabanlı sepet yardımcıları

export type CartItem = {
  productId: string;
  qty: number;
  name: string;
  price: number;
  imageUrl?: string;
  category?: string;
};

export type ProductMini = {
  _id?: string; id?: string;
  name: string;
  price: number;
  imageUrl?: string;
  category?: string;
};

const KEY = "cart";

function read(): CartItem[] {
  try { return JSON.parse(localStorage.getItem(KEY) || "[]"); }
  catch { return []; }
}
function write(items: CartItem[]) {
  localStorage.setItem(KEY, JSON.stringify(items));
  window.dispatchEvent(new CustomEvent("cart:change"));
}

export function getCart(): CartItem[] {
  return read();
}

export function clearCart() {
  write([]);
}

export function addToCart(p: ProductMini, qty = 1) {
  const id = String((p as any)._id ?? (p as any).id);
  if (!id) throw new Error("product id not found");
  const items = read();
  const i = items.findIndex(x => x.productId === id);
  if (i >= 0) {
    items[i].qty += qty;
  } else {
    items.push({
      productId: id,
      qty,
      name: p.name,
      price: p.price,
      imageUrl: p.imageUrl,
      category: p.category,
    });
  }
  write(items);
}

export function updateQty(productId: string, qty: number) {
  const items = read();
  const i = items.findIndex(x => x.productId === productId);
  if (i < 0) return;
  if (qty <= 0) {
    items.splice(i, 1);
  } else {
    items[i].qty = qty;
  }
  write(items);
}

export function removeItem(productId: string) {
  const items = read().filter(x => x.productId !== productId);
  write(items);
}

export function count(): number {
  return read().reduce((s, x) => s + x.qty, 0);
}

export function totalSnapshot(): number {
  return read().reduce((s, x) => s + x.price * x.qty, 0);
}
