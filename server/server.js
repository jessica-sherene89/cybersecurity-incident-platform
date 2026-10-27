const express = require('express');
const path = require('path');
const cors = require('cors');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

const connectDB = require('./config/db');
const { notFound, errorHandler } = require('./middleware/errorMiddleware');

// Route imports
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const incidentRoutes = require('./routes/incidentRoutes');
const evidenceRoutes = require('./routes/evidenceRoutes');
const actionRoutes = require('./routes/actionRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const activityLogRoutes = require('./routes/activityLogRoutes');

// Initialize database connection
connectDB();

const app = express();

// Enable CORS
app.use(
  cors({
    origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
    credentials: true,
  })
);

// Body parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded forensic evidence files statically
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    timestamp: new Date().toISOString(),
    service: 'Cybersecurity Incident Platform API',
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/incidents', incidentRoutes);
app.use('/api/evidence', evidenceRoutes);
app.use('/api/actions', actionRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/activity-logs', activityLogRoutes);

// Error Handling Middleware
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

process.on('uncaughtException', (err) => {
  console.error('[Uncaught Exception]:', err);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('[Unhandled Rejection]:', reason);
});

const server = app.listen(PORT, () => {
  console.log(
    `[Server] Cybersecurity Incident Platform API running on http://localhost:${PORT} in ${
      process.env.NODE_ENV || 'development'
    } mode`
  );
});

module.exports = app;
