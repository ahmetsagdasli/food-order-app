import jwt from "jsonwebtoken";
import { User } from "../models/User.js";

// Auth middleware — Authorization: Bearer <token> (B/k harf duyarsız) + cookie fallback
export const auth = async (req, res, next) => {
  try {
    const hdr = req.headers.authorization || "";
    const m = hdr.match(/^Bearer\s+(.+)$/i); // case-insensitive
    const token = m?.[1] || req.cookies?.token;

    if (!token) return res.status(401).json({ error: "Unauthorized" });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);
    if (!user) return res.status(401).json({ error: "User not found" });

    req.user = { id: String(user._id), role: user.role, email: user.email, name: user.name };
    next();
  } catch (e) {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
};

// Role guard — ör: requireRole("admin")
export const requireRole = (...roles) => (req, _res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    return _res.status(403).json({ error: "Forbidden" });
  }
  next();
};
