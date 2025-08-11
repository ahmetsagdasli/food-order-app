import { useEffect, useState } from "react";
import { count as cartCount } from "../utils/cart";

export default function useCartCount() {
  const [c, setC] = useState<number>(() => cartCount());
  useEffect(() => {
    const update = () => setC(cartCount());
    window.addEventListener("cart:change", update as any);
    return () => window.removeEventListener("cart:change", update as any);
  }, []);
  return c;
}
