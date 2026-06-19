import mongoose from 'mongoose'

const userSchema = new mongoose.Schema(
  {
    name:       { type: String,  required: true },
    email:      { type: String,  required: true, unique: true },
    password:   { type: String,  required: true },
    isVerified: { type: Boolean, default: false },
    // OTP fields — shared for both verify + reset flows
    otp:        { type: String,  default: null },
    otpExpiry:  { type: Date,    default: null },
    otpType:    { type: String,  default: null },  // 'verify' | 'reset' | null
  },
  { timestamps: true }
)

export default mongoose.model('User', userSchema)