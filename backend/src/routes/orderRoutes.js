import { Router } from "express";
import { auth } from "../middlewares/auth.js";
import { Order } from "../models/Order.js";
import { Product } from "../models/Product.js";
import Stripe from "stripe";
import { orderEvents } from "../utils/orderEvents.js";

const router = Router();
const stripe = process.env.STRIPE_SECRET_KEY ? new Stripe(process.env.STRIPE_SECRET_KEY) : null;

/**
 * POST /api/orders
 * body: { items: [{ productId, qty }] }
 */
router.post("/", auth, async (req, res) => {
  try {
    if (!["user", "admin"].includes(req.user.role)) {
      return res.status(403).json({ error: "Only customers can create orders" });
    }
    const { items = [] } = req.body;
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: "items required" });
    }

    const ids = items.map((i) => i.productId);
    const prods = await Product.find({ _id: { $in: ids } });
    const map = new Map(prods.map((p) => [String(p._id), p]));

    const lineItems = items.map((it) => {
      const p = map.get(String(it.productId));
      if (!p) throw new Error("Product not found: " + it.productId);
      return {
        productId: p._id,
        name: p.name,
        price: p.price,
        qty: Number(it.qty || 1),
        restaurantId: p.restaurantId,
      };
    });

    const total = lineItems.reduce((s, x) => s + x.price * x.qty, 0);

    const order = await Order.create({
      user: req.user.id,
      items: lineItems,
      total,
      status: "pending",
      payment: { status: "unpaid", provider: "stripe" },
    });

    orderEvents.emit("order.created", order.toJSON());
    res.status(201).json(order);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

/** GET /api/orders (my orders or all for admin) */
router.get("/", auth, async (req, res) => {
  try {
    if (req.user.role === "admin") {
      const list = await Order.find().sort({ createdAt: -1 });
      return res.json(list);
    }
    const list = await Order.find({ user: req.user.id }).sort({ createdAt: -1 });
    res.json(list);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

/** GET /api/orders/:id (detail) */
router.get("/:id", auth, async (req, res) => {
  try {
    const q = req.user.role === "admin" ? { _id: req.params.id } : { _id: req.params.id, user: req.user.id };
    const doc = await Order.findOne(q);
    if (!doc) return res.status(404).json({ error: "Order not found" });
    res.json(doc);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

/** POST /api/orders/:id/pay  (fallback pay) */
router.post("/:id/pay", auth, async (req, res) => {
  try {
    const q = req.user.role === "admin" ? { _id: req.params.id } : { _id: req.params.id, user: req.user.id };
    const order = await Order.findOne(q);
    if (!order) return res.status(404).json({ error: "Order not found" });
    if (order.payment?.status === "paid") return res.json(order);

    const tx = String(req.body.transactionId || "");
    if (!tx) return res.status(400).json({ error: "transactionId required" });

    order.payment = { ...(order.payment || {}), status: "paid", transactionId: tx, provider: "stripe" };
    order.status = "paid";
    await order.save();

    orderEvents.emit("order.updated", order.toJSON());
    res.json(order);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

/** POST /api/orders/:id/cancel  (refund if paid) */
router.post("/:id/cancel", auth, async (req, res) => {
  try {
    const q = req.user.role === "admin" ? { _id: req.params.id } : { _id: req.params.id, user: req.user.id };
    const order = await Order.findOne(q);
    if (!order) return res.status(404).json({ error: "Order not found" });

    if (order.status === "cancelled") return res.status(400).json({ error: "Already cancelled" });
    if (["delivered"].includes(order.status)) {
      return res.status(400).json({ error: "Cannot cancel delivered order" });
    }

    if (order.payment?.status === "paid") {
      if (!stripe) return res.status(500).json({ error: "Stripe not configured" });
      const pi = order.payment.transactionId;
      if (!pi) return res.status(400).json({ error: "Missing payment intent id" });
      await stripe.refunds.create({ payment_intent: pi });
      order.payment.status = "refunded";
    } else {
      order.payment = { ...(order.payment || {}), status: "cancelled" };
    }

    order.status = "cancelled";
    order.cancelledAt = new Date();
    await order.save();

    orderEvents.emit("order.updated", order.toJSON());
    res.json(order);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

export default router;
