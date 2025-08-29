import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

// ES Module __dirname equivalent
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Basic middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS - Allow all origins for now
app.use(cors({
  origin: true,
  credentials: true
}));

// Health check endpoint (must be first)
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Blood Bank Management System API is running',
    timestamp: new Date().toISOString(),
    port: PORT,
    env: process.env.NODE_ENV
  });
});

// Try to import routes with error handling
let authRoutes, userRoutes, bloodRoutes, requestRoutes, inventoryRoutes, adminRoutes;

try {
  const modules = await Promise.allSettled([
    import('./routes/auth.js'),
    import('./routes/users.js'),
    import('./routes/blood.js'),
    import('./routes/requests.js'),
    import('./routes/inventory.js'),
    import('./routes/admin.js')
  ]);

  [authRoutes, userRoutes, bloodRoutes, requestRoutes, inventoryRoutes, adminRoutes] = modules.map(m => 
    m.status === 'fulfilled' ? m.value.default : null
  );
} catch (error) {
  console.error('Error importing routes:', error);
}

// API Routes with error handling
if (authRoutes) app.use('/api/auth', authRoutes);
if (userRoutes) app.use('/api/users', userRoutes);
if (bloodRoutes) app.use('/api/blood', bloodRoutes);
if (requestRoutes) app.use('/api/requests', requestRoutes);
if (inventoryRoutes) app.use('/api/inventory', inventoryRoutes);
if (adminRoutes) app.use('/api/admin', adminRoutes);

// Static file serving for production
if (process.env.NODE_ENV === 'production') {
  const buildPath = path.join(__dirname, '../dist');
  
  console.log('Production mode - serving static files');
  console.log('Build path:', buildPath);
  console.log('Build directory exists:', fs.existsSync(buildPath));
  
  if (fs.existsSync(buildPath)) {
    // Serve static files
    app.use(express.static(buildPath));
    
    // Handle React Router
    app.get('*', (req, res) => {
      if (req.path.startsWith('/api/')) {
        return res.status(404).json({ success: false, message: 'API route not found' });
      }
      
      const indexPath = path.join(buildPath, 'index.html');
      if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath);
      } else {
        res.status(404).send('Application not found');
      }
    });
  } else {
    console.error('Build directory not found:', buildPath);
    app.get('*', (req, res) => {
      if (req.path.startsWith('/api/')) {
        return res.status(404).json({ success: false, message: 'API route not found' });
      }
      res.status(503).send('Application build not available');
    });
  }
}

// Error handler
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// Connect to MongoDB
if (process.env.MONGODB_URI) {
  mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('✅ Connected to MongoDB Atlas'))
    .catch((err) => console.error('❌ MongoDB connection error:', err));
} else {
  console.error('❌ MONGODB_URI not provided');
}

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/api/health`);
});
