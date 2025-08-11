import mongoose from "mongoose";
import { Order } from "../models/Order.js";
import { Product } from "../models/Product.js";

// Helpers
const isObjectId = (id) => mongoose.isValidObjectId(id);
const ALLOWED_STATUS = ["pending", "preparing", "on_the_way", "delivered", "cancelled"];

export const createOrder = async (req, res) => {
  try {
    const { items = [], shippingAddress = {} } = req.body;
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: "items is required (non-empty array)" });
    }

    // unique product ids
    const productIds = [...new Set(items.map((it) => it.productId))];
    if (productIds.some((id) => !isObjectId(id))) {
      return res.status(400).json({ error: "Invalid productId in items" });
    }

    // fetch products
    const products = await Product.find({ _id: { $in: productIds }, isAvailable: true });
    const productMap = new Map(products.map((p) => [String(p._id), p]));

    // build snapshot items + total
    const orderItems = [];
    let totalAmount = 0;

    for (const it of items) {
      const qty = Number(it.qty) || 0;
      if (qty < 1) return res.status(400).json({ error: "qty must be >= 1" });
      const p = productMap.get(String(it.productId));
      if (!p) return res.status(400).json({ error: `Product not found or unavailable: ${it.productId}` });

      orderItems.push({
        product: p._id,
        name: p.name,
        price: p.price,
        qty,
      });
      totalAmount += p.price * qty;
    }

    const doc = await Order.create({
      user: req.user.id,
      items: orderItems,
      totalAmount,
      payment: { provider: "stripe", status: "pending" }, // Stripe ekleyince güncelleriz
      shippingAddress,
      status: "pending",
    });

    return res.status(201).json(doc);
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
};

export const listMyOrders = async (req, res) => {
  try {
    const list = await Order.find({ user: req.user.id }).sort({ createdAt: -1 });
    return res.json(list);
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
};

export const getOrder = async (req, res) => {
  try {
    const { id } = req.params;
    if (!isObjectId(id)) return res.status(400).json({ error: "Invalid id" });
    const doc = await Order.findById(id).populate("items.product", "name price imageUrl");
    if (!doc) return res.status(404).json({ error: "Order not found" });

    const isOwner = String(doc.user) === req.user.id;
    const isAdmin = req.user.role === "admin";
    if (!isOwner && !isAdmin) return res.status(403).json({ error: "Forbidden" });

    return res.json(doc);
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
};

export const cancelMyOrder = async (req, res) => {
  try {
    const { id } = req.params;
    if (!isObjectId(id)) return res.status(400).json({ error: "Invalid id" });
    const doc = await Order.findById(id);
    if (!doc) return res.status(404).json({ error: "Order not found" });

    const isOwner = String(doc.user) === req.user.id;
    if (!isOwner) return res.status(403).json({ error: "Forbidden" });

    if (doc.status !== "pending") {
      return res.status(400).json({ error: "Only pending orders can be cancelled" });
    }

    doc.status = "cancelled";
    await doc.save();
    return res.json(doc);
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
};

export const markOrderPaid = async (req, res) => {
  try {
    const { id } = req.params;
    const { transactionId = `SIM-${Date.now()}` } = req.body || {};
    if (!isObjectId(id)) return res.status(400).json({ error: "Invalid id" });

    const doc = await Order.findById(id);
    if (!doc) return res.status(404).json({ error: "Order not found" });

    const isOwner = String(doc.user) === req.user.id;
    const isAdmin = req.user.role === "admin";
    if (!isOwner && !isAdmin) return res.status(403).json({ error: "Forbidden" });

    // basit kontrol
    if (doc.payment.status === "paid") {
      return res.status(400).json({ error: "Order already paid" });
    }

    doc.payment.status = "paid";
    doc.payment.transactionId = transactionId;
    await doc.save();

    return res.json(doc);
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
};

export const listAllOrders = async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const q = {};
    if (status) q.status = status;

    const pageNum = Math.max(parseInt(page) || 1, 1);
    const limitNum = Math.min(Math.max(parseInt(limit) || 20, 1), 100);
    const skip = (pageNum - 1) * limitNum;

    const [items, total] = await Promise.all([
      Order.find(q).sort({ createdAt: -1 }).skip(skip).limit(limitNum),
      Order.countDocuments(q),
    ]);

    return res.json({
      items,
      pagination: { total, page: pageNum, pages: Math.ceil(total / limitNum), limit: limitNum },
    });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
};

export const updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    if (!isObjectId(id)) return res.status(400).json({ error: "Invalid id" });
    if (!ALLOWED_STATUS.includes(status)) {
      return res.status(400).json({ error: `status must be one of: ${ALLOWED_STATUS.join(", ")}` });
    }

    const doc = await Order.findById(id);
    if (!doc) return res.status(404).json({ error: "Order not found" });

    doc.status = status;
    await doc.save();
    return res.json(doc);
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
};
