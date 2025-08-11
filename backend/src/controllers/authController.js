import { User } from "../models/User.js";
import { signToken } from "../utils/jwt.js";

export const register = async (req, res) => {
  const { name, email, password, role } = req.body;

  if (!name || !email || !password)
    return res.status(400).json({ error: "name, email, password are required" });

  const exists = await User.findOne({ email });
  if (exists) return res.status(409).json({ error: "Email already in use" });

  const user = await User.create({ name, email, password, role }); // role göndermesen de default user
  const token = signToken({ id: user._id, role: user.role });

  return res.status(201).json({
    user: { id: user._id, name: user.name, email: user.email, role: user.role },
    token,
  });
};

export const login = async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password)
    return res.status(400).json({ error: "email and password are required" });

  const user = await User.findOne({ email }).select("+password");
  if (!user) return res.status(401).json({ error: "Invalid credentials" });

  const ok = await user.comparePassword(password);
  if (!ok) return res.status(401).json({ error: "Invalid credentials" });

  const token = signToken({ id: user._id, role: user.role });

  // İstersen cookie’de de set edebiliriz:
  res.cookie("token", token, {
    httpOnly: true,
    sameSite: "lax",
    secure: false, // prod’da true (HTTPS)
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  return res.json({
    user: { id: user._id, name: user.name, email: user.email, role: user.role },
    token,
  });
};

export const me = async (req, res) => {
  // req.user middleware’den geliyor
  return res.json({ user: req.user });
};
