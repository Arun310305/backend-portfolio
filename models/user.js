import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      default: "admin",
    },
  },
  { timestamps: true }
);

/**
 * IMPORTANT:
 * Model name "User" → collection "users"
 * Matches your MongoDB collection
 */
export default mongoose.models.User || mongoose.model("User", userSchema);
