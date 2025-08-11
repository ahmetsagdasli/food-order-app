import { Router } from "express";
import jwt from "jsonwebtoken";
import { Restaurant } from "../models/Restaurant.js";
import { Order } from "../models/Order.js";
import { orderEvents } from "../utils/orderEvents.js";
import { auth } from "../middlewares/auth.js";

const router = Router();

async function getMerchantRestaurant(ownerId) {
  return Restaurant.findOne({ owner: ownerId });
}

/** GET /api/merchant/orders  (merchant) */
router.get("/orders", auth, async (req, res) => {
  try {
    if (req.user.role !== "merchant") return res.status(403).json({ error: "Forbidden" });
    const rest = await getMerchantRestaurant(req.user.id);
    if (!rest) return res.status(400).json({ error: "Restaurant not found for this owner" });

    const { status } = req.query;
    const q = { "items.restaurantId": rest._id };
    if (status) q.status = String(status);

    const list = await Order.find(q).sort({ createdAt: -1 });
    res.json(list);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

/** POST /api/merchant/orders/:id/status   (accepted|preparing|delivered|cancelled) */
router.post("/orders/:id/status", auth, async (req, res) => {
  try {
    if (req.user.role !== "merchant") return res.status(403).json({ error: "Forbidden" });
    const rest = await getMerchantRestaurant(req.user.id);
    if (!rest) return res.status(400).json({ error: "Restaurant not found for this owner" });

    const { id } = req.params;
    const { status } = req.body;
    const allowed = ["accepted", "preparing", "delivered", "cancelled"];
    if (!allowed.includes(status)) return res.status(400).json({ error: "Invalid status" });

    const order = await Order.findOne({ _id: id, "items.restaurantId": rest._id });
    if (!order) return res.status(404).json({ error: "Order not found" });

    order.status = status;
    await order.save();

    orderEvents.emit("order.updated", order.toJSON());
    res.json(order);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

/** GET /api/merchant/orders/stream?token=...   (SSE) */
router.get("/orders/stream", async (req, res) => {
  const token = String(req.query.token || "");
  if (!token) return res.status(401).end();

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.role !== "merchant") return res.status(403).end();

    const rest = await getMerchantRestaurant(decoded.id);
    if (!rest) return res.status(400).end();

    // SSE headers
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.flushHeaders?.();

    const send = (event, data) => {
      res.write(`event: ${event}\n`);
      res.write(`data: ${JSON.stringify(data)}\n\n`);
    };

    send("ping", { t: Date.now() });

    const onCreated = (ord) => {
      if (ord.items?.some((it) => String(it.restaurantId) === String(rest._id))) {
        send("order", { type: "created", order: ord });
      }
    };
    const onUpdated = (ord) => {
      if (ord.items?.some((it) => String(it.restaurantId) === String(rest._id))) {
        send("order", { type: "updated", order: ord });
      }
    };

    orderEvents.on("order.created", onCreated);
    orderEvents.on("order.updated", onUpdated);

    req.on("close", () => {
      orderEvents.off("order.created", onCreated);
      orderEvents.off("order.updated", onUpdated);
      res.end();
    });
  } catch {
    return res.status(401).end();
  }
});

export default router;
