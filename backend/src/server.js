import "dotenv/config";
import mongoose from "mongoose";
import app from "./app.js";

const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI;

async function start() {
  if (!MONGO_URI) {
    console.error("❌ MONGO_URI missing in .env");
    process.exit(1);
  }

  try {
    // Mongoose 8+: genelde ekstra options gerekmiyor
    await mongoose.connect(MONGO_URI, { serverSelectionTimeoutMS: 10000 });
    console.log("✅ MongoDB connected");

    const server = app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
    });

    // Graceful shutdown + extra guards
    const shutdown = async (signal) => {
      try {
        console.log(`\n${signal} received. Closing...`);
        await new Promise((resolve) => server.close(resolve));
        console.log("HTTP server closed");
        await mongoose.disconnect();
        console.log("✅ Mongo disconnected");
      } catch (e) {
        console.error("Shutdown error:", e);
      } finally {
        process.exit(0);
      }
    };

    process.on("SIGINT", () => shutdown("SIGINT"));
    process.on("SIGTERM", () => shutdown("SIGTERM"));
    process.on("unhandledRejection", (e) => {
      console.error("unhandledRejection:", e);
      shutdown("unhandledRejection");
    });
    process.on("uncaughtException", (e) => {
      console.error("uncaughtException:", e);
      shutdown("uncaughtException");
    });
  } catch (err) {
    console.error("❌ MongoDB connection error:", err.message);
    process.exit(1);
  }
}

start();
