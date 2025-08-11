import mongoose from "mongoose";

const restaurantSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 160 },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    isApproved: { type: Boolean, default: false, index: true },

    // Harita için konum
    lat: { type: Number, default: null }, // +90 to -90
    lng: { type: Number, default: null }, // +180 to -180

    address: { type: String, default: "" },
  },
  { timestamps: true, versionKey: false }
);

restaurantSchema.set("toJSON", { virtuals: true });

export const Restaurant = mongoose.model("Restaurant", restaurantSchema);
