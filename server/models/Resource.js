import mongoose from 'mongoose'

const fieldSchema = new mongoose.Schema({
  fieldName: { type: String, required: true },
  type:      { type: String, required: true, enum: ['string','number','boolean','email','uuid','date','avatar','enum'] },
  required:  { type: Boolean, default: false },
  min:       { type: Number },
  max:       { type: Number },
  values:    [String],   // for enum type only
  faker:     { type: String } // e.g. "person.fullName" — Phase 4
}, { _id: false })

const resourceSchema = new mongoose.Schema({
  name:      { type: String, required: true },
  projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
  schema:    [fieldSchema],
  errorRate: { type: Number, default: 0, min: 0, max: 1 },   // Phase 4
  delay:     { type: Number, default: 0, min: 0, max: 5000 }, // Phase 4
}, { timestamps: true })

// ⚠ Unique: one resource name per project
resourceSchema.index({ projectId: 1, name: 1 }, { unique: true })

export default mongoose.model('Resource', resourceSchema)