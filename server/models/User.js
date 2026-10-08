import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+(\.[A-Za-z0-9-]+)*\.[A-Za-z]{2,}$/,
        "Enter a valid email address",
      ],
    },
    password: { type: String, required: true, minlength: 8 },
    role: { type: String, enum: ["customer", "admin"], default: "customer" },

    // password reset (the token is stored as a hash; both fields are hidden by default)
    resetPasswordToken: { type: String, select: false },
    resetPasswordExpires: { type: Date, select: false },
  },
  { timestamps: true }
);

// only ONE admin can ever exist (MongoDB enforces this)
userSchema.index(
  { role: 1 },
  { unique: true, partialFilterExpression: { role: "admin" } }
);

// hash the password before saving
userSchema.pre("save", async function () {
  if (!this.isModified("password")) return;
  this.password = await bcrypt.hash(this.password, 10);
});

userSchema.methods.matchPassword = function (plain) {
  return bcrypt.compare(plain, this.password);
};

export default mongoose.model("User", userSchema);