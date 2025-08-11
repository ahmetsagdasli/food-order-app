import { Router } from "express";
import { auth, requireRole } from "../middlewares/auth.js";

const router = Router();

router.get("/stats", auth, requireRole("admin"), async (req, res) => {
  // admin istatistikleri vs.
  res.json({ ok: true, message: `Hello admin ${req.user.name}` });
});

export default router;
