import { Product } from "../models/Product.js";
import { Restaurant } from "../models/Restaurant.js";
import mongoose from "mongoose";

const isId = (id) => mongoose.isValidObjectId(id);
const getMyRestaurant = async (userId) => Restaurant.findOne({ owner: userId });

/**
 * GET /api/products
 * Public liste; ?search=&category=&restaurantId=&mine=true
 * - merchant + mine=true => sadece kendi restoran ürünleri
 */
export const listProducts = async (req, res) => {
  try {
    const {
      search = "",
      category,
      isAvailable,
      sort = "createdAt:desc",
      page = 1,
      limit = 12,
      restaurantId,
      mine,
    } = req.query;

    const q = {};
    if (search) q.name = { $regex: search, $options: "i" };
    if (category) q.category = category;
    if (typeof isAvailable !== "undefined") q.isAvailable = isAvailable === "true";

    if (restaurantId) {
      if (!isId(restaurantId)) return res.status(400).json({ error: "Invalid restaurantId" });
      q.restaurantId = restaurantId;
    }

    if (mine === "true" && req.user?.role === "merchant") {
      const myRest = await getMyRestaurant(req.user.id);
      if (!myRest) return res.status(400).json({ error: "Restaurant not found for this owner" });
      q.restaurantId = myRest._id;
    }

    const [field, dir = "asc"] = String(sort).split(":");
    const sortObj = { [field]: dir === "desc" ? -1 : 1 };

    const pageNum = Math.max(parseInt(page) || 1, 1);
    const limitNum = Math.min(Math.max(parseInt(limit) || 12, 1), 100);
    const skip = (pageNum - 1) * limitNum;

    const [items, total] = await Promise.all([
      Product.find(q).sort(sortObj).skip(skip).limit(limitNum),
      Product.countDocuments(q),
    ]);

    res.json({
      items,
      pagination: { total, page: pageNum, pages: Math.ceil(total / limitNum), limit: limitNum },
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

/**
 * GET /api/products/:id
 */
export const getProduct = async (req, res) => {
  try {
    const { id } = req.params;
    if (!isId(id)) return res.status(400).json({ error: "Invalid id" });

    const doc = await Product.findById(id);
    if (!doc) return res.status(404).json({ error: "Product not found" });

    res.json(doc);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

/**
 * POST /api/products  (admin/merchant)
 * - admin: body.restaurantId verirse o restorana ekler. Yoksa 400.
 * - merchant: kendi restoranına ekler; restoran onaylı olmalı.
 */
export const createProduct = async (req, res) => {
  try {
    const { name, price, description = "", imageUrl = "", category = "general", isAvailable = true, restaurantId } =
      req.body;

    if (!name || typeof price !== "number")
      return res.status(400).json({ error: "name (string) and price (number) are required" });

    let restIdToUse;

    if (req.user?.role === "admin") {
      if (!restaurantId || !isId(restaurantId))
        return res.status(400).json({ error: "restaurantId is required for admin" });
      restIdToUse = restaurantId;
    } else if (req.user?.role === "merchant") {
      const myRest = await getMyRestaurant(req.user.id);
      if (!myRest) return res.status(400).json({ error: "Restaurant not found for this owner" });
      if (!myRest.isApproved) return res.status(403).json({ error: "Restaurant not approved yet" });
      restIdToUse = myRest._id;
    } else {
      return res.status(403).json({ error: "Forbidden" });
    }

    const doc = await Product.create({
      name: String(name).trim(),
      price,
      description,
      imageUrl,
      category,
      isAvailable,
      restaurantId: restIdToUse,
    });

    res.status(201).json(doc);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

/**
 * PUT /api/products/:id  (admin/merchant)
 * - admin: serbest
 * - merchant: sadece kendi restoranına ait ürünü güncelleyebilir
 */
export const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    if (!isId(id)) return res.status(400).json({ error: "Invalid id" });

    const payload = {};
    const allowed = ["name", "price", "description", "imageUrl", "category", "isAvailable"];
    for (const k of allowed) if (k in req.body) payload[k] = req.body[k];
    if ("name" in payload) payload["name"] = String(payload["name"]).trim();

    let filter = { _id: id };

    if (req.user?.role === "merchant") {
      const myRest = await getMyRestaurant(req.user.id);
      if (!myRest) return res.status(400).json({ error: "Restaurant not found for this owner" });
      filter = { _id: id, restaurantId: myRest._id };
    }

    const updated = await Product.findOneAndUpdate(filter, payload, { new: true });
    if (!updated) return res.status(404).json({ error: "Product not found" });
    res.json(updated);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

/**
 * DELETE /api/products/:id  (admin/merchant)
 * - admin: serbest
 * - merchant: sadece kendi ürününü silebilir
 */
export const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    if (!isId(id)) return res.status(400).json({ error: "Invalid id" });

    let filter = { _id: id };
    if (req.user?.role === "merchant") {
      const myRest = await getMyRestaurant(req.user.id);
      if (!myRest) return res.status(400).json({ error: "Restaurant not found for this owner" });
      filter = { _id: id, restaurantId: myRest._id };
    }

    const ok = await Product.findOneAndDelete(filter);
    if (!ok) return res.status(404).json({ error: "Product not found" });
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};
