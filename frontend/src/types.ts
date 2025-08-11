export type User = { id: string; name: string; email: string; role: "user"|"admin" };
export type Product = {
  _id: string; name: string; description?: string; price: number;
  imageUrl?: string; category?: string; isAvailable?: boolean;
};
export type Pagination = { total: number; page: number; pages: number; limit: number };
export type OrderItem = { product: string; name: string; price: number; qty: number };
export type Order = {
  _id: string; user: string; items: OrderItem[]; totalAmount: number;
  status: "pending"|"preparing"|"on_the_way"|"delivered"|"cancelled";
  payment?: { provider: string; status: "pending"|"paid"|"failed"|"refunded"; transactionId?: string };
  createdAt: string;
};
