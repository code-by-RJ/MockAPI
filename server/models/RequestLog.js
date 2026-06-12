import mongoose from 'mongoose'

const requestLogSchema = new mongoose.Schema({
  projectId:    { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
  resourceName: { type: String, required: true },
  method:       { type: String, enum: ['GET', 'POST', 'PUT', 'DELETE'], required: true },
  path:         { type: String, required: true },
  statusCode:   { type: Number, required: true },
  duration:     { type: Number, required: true }, // ms
  timestamp:    { type: Date, default: Date.now }
})

// Fast lookup — sorted by newest first per project
requestLogSchema.index({ projectId: 1, timestamp: -1 })

export default mongoose.model('RequestLog', requestLogSchema)