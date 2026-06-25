import mongoose from 'mongoose'

const userSchema = new mongoose.Schema(
  {
    name:       { type: String,  required: true, maxlength: 50, trim: true },
    email:      { type: String,  required: true, unique: true, maxlength: 100 },
    password:   { type: String,  required: true },
    isVerified:    { type: Boolean, default: false },
    // OTP fields — shared for both verify + reset flows
    otp:           { type: String,  default: null },
    otpExpiry:     { type: Date,    default: null },
    otpType:       { type: String,  default: null },  // 'verify' | 'reset' | 'email-change' | null
    // Email change — stores the new email while OTP is pending
    pendingEmail:  { type: String,  default: null, maxlength: 100 },
    // Login security
    loginAttempts: { type: Number,  default: 0 },
    lockUntil:     { type: Date,    default: null },
  },
  { timestamps: true }
)

export default mongoose.model('User', userSchema)