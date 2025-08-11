import { Router } from "express";
import { auth } from "../middlewares/auth.js";
import { Product } from "../models/Product.js";
import { Restaurant } from "../models/Restaurant.js";

const router = Router();

/** ---- helpers: token opsiyonel ---- **/
function authOptional(req, res, next) {
  const hdr = req.headers.authorization || "";
  if (!hdr.toLowerCase().startsWith("bearer ")) return next();
  return auth(req, res, next);
}

function toBool(v, def = undefined) {
  if (v === undefined) return def;
  const s = String(v).toLowerCase();
  if (["1", "true", "yes"].includes(s)) return true;
  if (["0", "false", "no"].includes(s)) return false;
  return def;
}
function toNum(v, def = undefined) {
  if (v === undefined || v === null || v === "") return def;
  const n = Number(v);
  return Number.isFinite(n) ? n : def;
}

/**
 * GET /api/products
 * Query:
 *  - search
 *  - category (single)  OR  categories=cat1,cat2
 *  - restaurantId
 *  - mine=true (merchant)
 *  - priceMin, priceMax
 *  - isAvailable=true/false
 *  - page, limit, sort (field:dir)
 */
router.get("/", authOptional, async (req, res) => {
  try {
    const {
      search = "",
      category,
      categories,
      restaurantId,
      mine,
      page = 1,
      limit = 20,
      sort = "createdAt:desc",
      priceMin,
      priceMax,
      isAvailable,
    } = req.query;

    const q = {};
    if (search) q.name = { $regex: String(search), $options: "i" };

    // category / categories
    if (categories) {
      const arr = String(categories)
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      if (arr.length) q.category = { $in: arr };
    } else if (category) {
      q.category = String(category);
    }

    // restaurant scope
    if (mine && req.user) {
      const rest = await Restaurant.findOne({ owner: req.user.id });
      if (rest) q.restaurantId = rest._id;
      else q.restaurantId = null; // empty
    } else if (restaurantId) {
      q.restaurantId = restaurantId;
    }

    // price range
    const min = toNum(priceMin);
    const max = toNum(priceMax);
    if (min != null || max != null) {
      q.price = {};
      if (min != null) q.price.$gte = min;
      if (max != null) q.price.$lte = max;
    }

    // availability
    const av = toBool(isAvailable);
    if (av !== undefined) q.isAvailable = av;

    const [sortField, sortDir = "asc"] = String(sort).split(":");
    const sortObj = { [sortField]: sortDir.toLowerCase() === "desc" ? -1 : 1 };

    const docs = await Product.find(q)
      .sort(sortObj)
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit));

    const total = await Product.countDocuments(q);
    res.json({ items: docs, total, page: Number(page), limit: Number(limit) });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

/**
 * GET /api/products/meta
 * (filtre seçeneklerini doldurmak için)
 * Query (opsiyonel): restaurantId, search
 * Dönüş: { categories: string[], price: { min, max } }
 */
router.get("/meta", async (req, res) => {
  try {
    const { restaurantId, search = "" } = req.query;
    const q = {};
    if (restaurantId) q.restaurantId = restaurantId;
    if (search) q.name = { $regex: String(search), $options: "i" };

    const categories = await Product.distinct("category", q);

    const agg = await Product.aggregate([
      { $match: q },
      {
        $group: {
          _id: null,
          min: { $min: "$price" },
          max: { $max: "$price" },
        },
      },
    ]);

    const price =
      agg && agg.length
        ? { min: agg[0].min ?? 0, max: agg[0].max ?? 0 }
        : { min: 0, max: 0 };

    res.json({ categories, price });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

/**
 * GET /api/products/:id
 */
router.get("/:id", async (req, res) => {
  try {
    const doc = await Product.findById(req.params.id);
    if (!doc) return res.status(404).json({ error: "Product not found" });
    res.json(doc);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

/**
 * POST /api/products
 * Admin: herhangi bir restorana (body.restaurantId zorunlu)
 * Merchant: kendi restoranına (onaylı olmalı) → restaurantId otomatik set edilir
 */
router.post("/", auth, async (req, res) => {
  try {
    const { name, price, category, imageUrl, description, restaurantId: bodyRestaurantId } = req.body;
    if (!name || price == null) return res.status(400).json({ error: "name and price are required" });

    let restId = bodyRestaurantId;

    if (req.user.role === "merchant") {
      const rest = await Restaurant.findOne({ owner: req.user.id });
      if (!rest) return res.status(400).json({ error: "Restaurant not found for this owner" });
      if (!rest.isApproved) return res.status(403).json({ error: "Restaurant not approved yet" });
      restId = rest._id;
    } else if (req.user.role === "admin") {
      if (!restId) return res.status(400).json({ error: "restaurantId is required for admin create" });
    } else {
      return res.status(403).json({ error: "Forbidden" });
    }

    const doc = await Product.create({
      name,
      price,
      category,
      imageUrl,
      description,
      restaurantId: restId,
      isAvailable: true,
    });
    res.status(201).json(doc);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

/**
 * PUT /api/products/:id
 * Admin: herhangi bir ürünü günceller
 * Merchant: SADECE kendi restoranındaki ürünü günceller
 */
router.put("/:id", auth, async (req, res) => {
  try {
    const { id } = req.params;

    const allowed = ["name", "price", "category", "imageUrl", "description", "isAvailable"];
    const payload = {};
    for (const k of allowed) if (k in req.body) payload[k] = req.body[k];

    const current = await Product.findById(id);
    if (!current) return res.status(404).json({ error: "Product not found" });

    if (req.user.role === "admin") {
      const updated = await Product.findByIdAndUpdate(id, payload, { new: true });
      return res.json(updated);
    }

    if (req.user.role === "merchant") {
      const rest = await Restaurant.findOne({ owner: req.user.id });
      if (!rest) return res.status(400).json({ error: "Restaurant not found for this owner" });
      if (String(current.restaurantId) !== String(rest._id)) {
        return res.status(403).json({ error: "Forbidden" });
      }
      const updated = await Product.findByIdAndUpdate(id, payload, { new: true });
      return res.json(updated);
    }

    return res.status(403).json({ error: "Forbidden" });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

/**
 * DELETE /api/products/:id
 * Admin: siler; Merchant: sadece kendi restoranındaki ürünü siler
 */
router.delete("/:id", auth, async (req, res) => {
  try {
    const { id } = req.params;

    if (req.user.role === "admin") {
      const del = await Product.findByIdAndDelete(id);
      if (!del) return res.status(404).json({ error: "Product not found" });
      return res.json({ ok: true });
    }

    if (req.user.role === "merchant") {
      const rest = await Restaurant.findOne({ owner: req.user.id });
      if (!rest) return res.status(400).json({ error: "Restaurant not found for this owner" });
      const del = await Product.findOneAndDelete({ _id: id, restaurantId: rest._id });
      if (!del) return res.status(404).json({ error: "Product not found" });
      return res.json({ ok: true });
    }

    return res.status(403).json({ error: "Forbidden" });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

export default router;
