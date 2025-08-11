// app.js
import express from "express";
import cors from "cors";
import morgan from "morgan";

// routes
import authRoutes from "./routes/authRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import productsRoutes from "./routes/productsRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";
import paymentRoutes from "./routes/paymentRoutes.js";
import restaurantRoutes from "./routes/restaurantRoutes.js";
import merchantOrdersRoutes from "./routes/merchantOrdersRoutes.js";
import publicRoutes from "./routes/publicRoutes.js"; // <-- NEW

const app = express();

app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, service: "FoodOrder API", time: new Date().toISOString() });
});

app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/products", productsRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/restaurants", restaurantRoutes);
app.use("/api/merchant", merchantOrdersRoutes);
app.use("/api/public", publicRoutes); // <-- NEW

export default app;
