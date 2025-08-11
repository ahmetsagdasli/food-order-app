import { Router } from "express";
import { Restaurant } from "../models/Restaurant.js";

const router = Router();

/**
 * GET /api/public/restaurants
 * Query:
 *  - approved=true (default)
 *  - withCoords=true (sadece lat/lng dolu olanlar)
 */
router.get("/restaurants", async (req, res) => {
  try {
    const approved = (req.query.approved ?? "true") === "true";
    const withCoords = (req.query.withCoords ?? "true") === "true";

    const q = {};
    if (approved) q.isApproved = true;
    if (withCoords) q.lat = { $ne: null }, q.lng = { $ne: null };

    const docs = await Restaurant.find(q)
      .select("_id name lat lng isApproved")
      .sort({ createdAt: -1 });

    res.json(docs);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

export default router;
