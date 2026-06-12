import mongoose from 'mongoose'

const dynamicDataSchema = new mongoose.Schema(
  {
    projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
    resourceName: { type: String, required: true },
    data: { type: mongoose.Schema.Types.Mixed, required: true }, // flexible user-defined fields
  },
  { timestamps: true }
)

dynamicDataSchema.index({ projectId: 1, resourceName: 1 })

export default mongoose.model('DynamicData', dynamicDataSchema)