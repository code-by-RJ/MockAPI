import { MongoMemoryServer } from 'mongodb-memory-server'
import mongoose from 'mongoose'

let mongod

// Starts a fresh in-memory MongoDB instance and connects mongoose to it.
// Call once per test file in beforeAll(). First run downloads a MongoDB
// binary (needs internet) — cached locally after that, subsequent runs are fast.
export async function connectTestDB() {
  mongod = await MongoMemoryServer.create()
  await mongoose.connect(mongod.getUri())
}

// Wipes all collections — call between independent test groups if a file
// needs a clean slate partway through (not needed for sequential flow tests).
export async function clearTestDB() {
  const collections = mongoose.connection.collections
  for (const key in collections) {
    await collections[key].deleteMany({})
  }
}

// Call once per test file in afterAll(). Defensive against connectTestDB()
// having failed partway (e.g. mongod started but mongoose.connect() didn't) —
// cleanup shouldn't throw a confusing secondary error that masks the real one.
export async function closeTestDB() {
  try {
    if (mongoose.connection.readyState === 1) {  // 1 = connected
      await mongoose.connection.dropDatabase()
      await mongoose.connection.close()
    }
  } catch (err) {
    console.error('[testDB] cleanup warning:', err.message)
  }
  if (mongod) await mongod.stop()
}