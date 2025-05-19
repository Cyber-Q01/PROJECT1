
// src/lib/mongodb.ts
import { MongoClient, ServerApiVersion } from 'mongodb';

if (!process.env.MONGODB_URI) {
  throw new Error('Invalid/Missing environment variable: "MONGODB_URI"');
}

const uri = process.env.MONGODB_URI;
console.log(`[MongoDB] Attempting to connect with MONGODB_URI: ${uri}`); // Added log

const options = {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
  // Optional: Add server selection timeout to potentially get more specific errors
  // serverSelectionTimeoutMS: 5000, // 5 seconds
};

let client: MongoClient;
let clientPromise: Promise<MongoClient>;

if (process.env.NODE_ENV === 'development') {
  let globalWithMongo = global as typeof globalThis & {
    _mongoClientPromise?: Promise<MongoClient>
  }

  if (!globalWithMongo._mongoClientPromise) {
    client = new MongoClient(uri, options);
    console.log('[MongoDB] Creating new client and connection promise in development.');
    globalWithMongo._mongoClientPromise = client.connect()
      .then(client => {
        console.log('[MongoDB] Successfully connected to MongoDB in development (global promise).');
        return client;
      })
      .catch(err => {
        console.error('[MongoDB] Failed to connect to MongoDB in development (global promise):', err);
        throw err; // Re-throw to ensure promise rejects
      });
  }
  clientPromise = globalWithMongo._mongoClientPromise;
} else {
  client = new MongoClient(uri, options);
  console.log('[MongoDB] Creating new client and connection promise in production.');
  clientPromise = client.connect()
    .then(client => {
      console.log('[MongoDB] Successfully connected to MongoDB in production.');
      return client;
    })
    .catch(err => {
      console.error('[MongoDB] Failed to connect to MongoDB in production:', err);
      throw err; // Re-throw to ensure promise rejects
    });
}

export default clientPromise;
