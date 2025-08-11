import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 160 },
    price: { type: Number, required: true, min: 0 },
    category: { type: String, trim: true, default: "general" },
    imageUrl: { type: String, default: "" },
    description: { type: String, default: "" },
    restaurantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Restaurant",
      required: true,
      index: true,
    },
    isAvailable: { type: Boolean, default: true },
  },
  { timestamps: true, versionKey: false }
);

// Arama için opsiyonel index
productSchema.index({ name: "text", category: "text" });

// IMPORTANT: _id'yi sakla, ayrıca 'id' sanal alanını da göster
productSchema.set("toJSON", { virtuals: true }); // _id kalır, id de gelir

export const Product = mongoose.model("Product", productSchema);
