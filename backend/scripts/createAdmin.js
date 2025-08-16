// node backend/scripts/createAdmin.js email=admin@foodorder.dev password=Admin123 name=SuperAdmin
import mongoose from "mongoose";
import dotenv from "dotenv";
// Hem default hem named export'lara uyumlu olsun:
import * as UserModel from "../src/models/User.js";

// .env yolunu sağlam bağla (scripts klasöründen bağımsız)
dotenv.config({ path: new URL("../.env", import.meta.url) });

// Parametreleri al
const args = Object.fromEntries(process.argv.slice(2).map(kv => {
  const [k, ...rest] = kv.split("=");
  return [k, rest.join("=")];
}));

const email = args.email || "admin@example.com";
const password = args.password || "Admin123!";
const name = args.name || "Admin";

// Model'i tespit et (default veya named)
const User = UserModel.default || UserModel.User;
if (!User) {
  console.error("❌ Could not find User model export. Make sure models/User.js exports either `export default` or `export const User`.");
  process.exit(1);
}

const MONGO_URI = process.env.MONGO_URI;
if (!MONGO_URI) {
  console.error("❌ MONGO_URI missing in .env");
  process.exit(1);
}

(async () => {
  try {
    await mongoose.connect(MONGO_URI);

    let user = await User.findOne({ email });
    if (user) {
      user.name = name;
      user.role = "admin";
      if (password) user.password = password; // pre('save') hash'ler (modelde varsa)
      await user.save();
      console.log("✅ Existing user promoted to admin:", email);
    } else {
      user = await User.create({ name, email, password, role: "admin" });
      console.log("✅ Admin created:", email);
    }
  } catch (e) {
    console.error("❌ Failed:", e?.stack || e);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
})();
