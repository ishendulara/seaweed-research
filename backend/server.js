const express    = require('express');
const http       = require('http');
const mongoose   = require('mongoose');
const cors       = require('cors');
const dotenv     = require('dotenv');
const { Server: SocketIOServer } = require('socket.io');
const connectDB  = require('./config/db');
const createSensorDataRouter = require('./routes/environment-suitability/sensorData');

// Load environment variables
dotenv.config();

// Connect to MongoDB
connectDB();

// Initialize Express app
const app = express();
const server = http.createServer(app);

// Socket.IO for real-time sensor data
const io = new SocketIOServer(server, {
  cors: { origin: '*', credentials: true }
});

io.on('connection', (socket) => {
  socket.emit('hello', { ok: true });
});

// ========== MIDDLEWARE ==========

// Enable CORS (Cross-Origin Resource Sharing) - Allow all origins
app.use(cors());

// Body parser middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logger middleware (optional - for development)
if (process.env.NODE_ENV === 'development') {
  app.use((req, res, next) => {
    console.log(`${req.method} ${req.path}`);
    next();
  });
}

// ========== ROUTES ==========

// Test route
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Seaweed Packaging System API',
    version: '1.0.0'
  });
});

// API routes
app.use('/api/plants',  require('./routes/growth-monitoring/plants'));
app.use('/api/auth',    require('./routes/auth'));
app.use('/api/seaweed', require('./routes/seaweed'));
app.use('/api/recipes', require('./routes/recipes'));
app.use('/api/predictions', require('./routes/species-identification/predictions'));
app.use('/api/sensor-data', createSensorDataRouter(io));

// ========== ERROR HANDLING ==========

// 404 handler - Route not found
app.use((req, res, next) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);

  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// ========== START SERVER ==========

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`
  ========================================
  🚀 Server running on port ${PORT}
  📝 Environment: ${process.env.NODE_ENV}
  🌐 URL: http://localhost:${PORT}
  🔌 Socket.IO: Enabled
  ========================================
  `);
});