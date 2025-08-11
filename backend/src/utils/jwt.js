import jwt from "jsonwebtoken";

export const signToken = (payload, options = {}) => {
  const secret = process.env.JWT_SECRET;
  const expiresIn = process.env.JWT_EXPIRES || "7d";
  return jwt.sign(payload, secret, { expiresIn, ...options });
};
