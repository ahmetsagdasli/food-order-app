import mongoose from "mongoose";

const orderItemSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
    name: { type: String, required: true },          // snapshot
    price: { type: Number, required: true },         // snapshot
    qty: { type: Number, required: true, min: 1 },
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    items: { type: [orderItemSchema], required: true },
    status: {
      type: String,
      enum: ["pending", "preparing", "on_the_way", "delivered", "cancelled"],
      default: "pending",
    },
    totalAmount: { type: Number, required: true, min: 0 },
    payment: {
      provider: { type: String, enum: ["stripe", "iyzico", "paytr", "cod"], default: "stripe" },
      status: { type: String, enum: ["pending", "paid", "failed", "refunded"], default: "pending" },
      transactionId: { type: String },
    },
    // Teslimat anındaki adres snapshot
    shippingAddress: {
      line1: String,
      line2: String,
      city: String,
      district: String,
      country: { type: String, default: "TR" },
      postalCode: String,
    },
  },
  { timestamps: true }
);

export const Order = mongoose.model("Order", orderSchema);
