const path = require('path');
const dotenv = require('dotenv');

// Resolve backend/.env from this file so startup works from any working directory.
dotenv.config({ path: path.resolve(__dirname, '.env') });
dotenv.config();
const express = require('express');
const cors = require('cors');
const { connectDB } = require('./config/db');
const apiRoutes = require('./routes/api');

const app = express();
const PORT = process.env.PORT || 5001;

// Middleware
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE']
}));
app.use((req, res, next) => {
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin-allow-popups');
  next();
});
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request Logger
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Ensure DB connection for serverless invocations
app.use(async (req, res, next) => {
  try {
    await connectDB();
  } catch (err) {
    console.warn('DB middleware warning:', err.message);
  }
  next();
});

// API Routes
app.use('/api', apiRoutes);

// Health Check
app.get('/health', (req, res) => {
  res.json({
    status: 'online',
    timestamp: new Date().toISOString(),
    service: 'GraminArogya Rural Healthcare Intelligence Platform',
    version: '1.0.0'
  });
});

// Root route
app.get('/', (req, res) => {
  res.send('GraminArogya Backend API is live. Access /api for endpoints.');
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ success: false, error: err.message || 'Internal Server Error' });
});

const { initializeDatabaseDefaults } = require('./config/initDatabase');

// Initialize DB and start server if run directly
const startServer = async () => {
  try {
    await connectDB();
    await initializeDatabaseDefaults();
    if (require.main === module) {
      app.listen(PORT, () => {
        console.log(`\n======================================================`);
        console.log(`🚀 GraminArogya Backend API running on port ${PORT}`);
        console.log(`🌐 Base URL: http://localhost:${PORT}`);
        console.log(`🏥 Triage & Routing Endpoints: http://localhost:${PORT}/api`);
        console.log(`======================================================\n`);
      });
    }
  } catch (err) {
    console.error('Failed to initialize server:', err);
  }
};

startServer();

module.exports = app;

