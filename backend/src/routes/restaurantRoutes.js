import { Router } from "express";
import { auth, requireRole } from "../middlewares/auth.js";
import { Restaurant } from "../models/Restaurant.js";
import { User } from "../models/User.js";

const router = Router();

/**
 * ADMIN FLOW
 */

// Admin: restoran oluştur (owner: merchant)
router.post("/", auth, requireRole("admin"), async (req, res) => {
  try {
    const { name, ownerId, isApproved = false, address = {}, phone, logoUrl } = req.body;
    if (!name || !ownerId) return res.status(400).json({ error: "name and ownerId are required" });

    const owner = await User.findById(ownerId);
    if (!owner) return res.status(404).json({ error: "Owner user not found" });
    if (owner.role !== "merchant") return res.status(400).json({ error: "Owner must have role=merchant" });

    const doc = await Restaurant.create({ name, owner: ownerId, isApproved, address, phone, logoUrl });
    res.status(201).json(doc);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Admin: tüm restoranlar
router.get("/", auth, requireRole("admin"), async (_req, res) => {
  const list = await Restaurant.find().populate("owner", "name email role");
  res.json(list);
});

// Admin: onayla/geri al
router.patch("/:id/approve", auth, requireRole("admin"), async (req, res) => {
  const { id } = req.params;
  const { isApproved = true } = req.body;
  const doc = await Restaurant.findByIdAndUpdate(id, { isApproved }, { new: true });
  if (!doc) return res.status(404).json({ error: "Restaurant not found" });
  res.json(doc);
});

/**
 * MERCHANT SELF-SERVICE
 */

// Merchant: kendi restoranını getir
router.get("/me", auth, requireRole("merchant"), async (req, res) => {
  const doc = await Restaurant.findOne({ owner: req.user.id });
  if (!doc) return res.status(404).json({ error: "Restaurant not found for this owner" });
  res.json(doc);
});

// Merchant: kendi restoranını oluştur (tek seferlik)
router.post("/me", auth, requireRole("merchant"), async (req, res) => {
  try {
    const exists = await Restaurant.findOne({ owner: req.user.id });
    if (exists) return res.status(400).json({ error: "Restaurant already exists for this owner" });

    const { name, address = {}, phone, logoUrl } = req.body;
    if (!name) return res.status(400).json({ error: "name is required" });

    const doc = await Restaurant.create({
      name,
      owner: req.user.id,
      isApproved: false, // admin onayı bekler
      address,
      phone,
      logoUrl,
    });
    res.status(201).json(doc);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Merchant: kendi restoranını güncelle (onay beklerken de edebilir)
router.put("/me", auth, requireRole("merchant"), async (req, res) => {
  try {
    const payload = {};
    const allowed = ["name", "address", "phone", "logoUrl"];
    for (const k of allowed) if (k in req.body) payload[k] = req.body[k];

    const updated = await Restaurant.findOneAndUpdate(
      { owner: req.user.id },
      payload,
      { new: true }
    );
    if (!updated) return res.status(404).json({ error: "Restaurant not found for this owner" });
    res.json(updated);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

export default router;
