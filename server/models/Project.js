import mongoose from 'mongoose'

const projectSchema = new mongoose.Schema(
  {
    name:     { type: String, required: true, trim: true },
    slug:     { type: String, required: true, unique: true, lowercase: true },
    owner:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    isPublic: { type: Boolean, default: false },
  },
  { timestamps: true }
)

// ⚠ Blueprint Day 1 indexes
projectSchema.index({ slug: 1 }, { unique: true })
projectSchema.index({ owner: 1 })

export default mongoose.model('Project', projectSchema)