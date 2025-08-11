import { Router } from "express";
import { createPaymentIntent } from "../controllers/paymentController.js";
import { auth } from "../middlewares/auth.js";

const router = Router();

// PaymentIntent üret
router.post("/create-intent", auth, createPaymentIntent);

export default router;
