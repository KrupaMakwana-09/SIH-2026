const mongoose = require('mongoose');

let cached = global.mongoose;
if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

let currentUri = process.env.MONGODB_URI || '';

const connectDB = async (customUri = null) => {
  const uriToUse = customUri || process.env.MONGODB_URI;
  
  if (!uriToUse) {
    console.log('ℹ️  No MongoDB URI provided. Running with dynamic memory/fallback storage mode.');
    return { success: true, mode: 'memory', message: 'Running in live in-memory mode' };
  }

  // If already connected, reuse existing connection immediately
  if (mongoose.connection.readyState === 1) {
    return { success: true, mode: 'atlas', message: 'Already connected to MongoDB Atlas' };
  }

  if (!cached.promise) {
    const opts = {
      serverSelectionTimeoutMS: 5000,
      bufferCommands: false, // Prevents 10s hang if connection issues occur
    };
    
    console.log(`⏳ Connecting to MongoDB Atlas: ${uriToUse.replace(/\/\/[^:]+:[^@]+@/, '//***:***@')}`);
    cached.promise = mongoose.connect(uriToUse, opts).then((m) => {
      console.log('✅ Connected to MongoDB Atlas successfully!');
      currentUri = uriToUse;
      return m;
    }).catch((err) => {
      cached.promise = null;
      throw err;
    });
  }

  try {
    cached.conn = await cached.promise;
    return { success: true, mode: 'atlas', message: 'Connected to MongoDB Atlas' };
  } catch (error) {
    cached.promise = null;
    console.error('❌ MongoDB Atlas connection error:', error.message);
    return { success: false, mode: 'memory', error: error.message };
  }
};

const getDBStatus = () => {
  return {
    isConnected: mongoose.connection.readyState === 1,
    readyState: mongoose.connection.readyState,
    mode: mongoose.connection.readyState === 1 ? 'atlas' : 'memory',
    uriMasked: currentUri ? currentUri.replace(/\/\/[^:]+:[^@]+@/, '//***:***@') : 'Not Configured (Memory Mode)',
    database: mongoose.connection.name || 'gramin_arogya_db'
  };
};

module.exports = { connectDB, getDBStatus };

