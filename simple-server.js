import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

console.log('🚀 Starting simple server...');
console.log('📁 Current directory:', __dirname);
console.log('🌍 Environment:', process.env.NODE_ENV || 'development');
console.log('🔌 Port:', PORT);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: '✅ Simple server is working!',
    timestamp: new Date().toISOString(),
    port: PORT,
    env: process.env.NODE_ENV,
    path: __dirname
  });
});

// Serve static files from dist
app.use(express.static(path.join(__dirname, 'dist')));

// Main route
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
        <title>Blood Bank Management System - Test</title>
        <style>
            body { font-family: Arial, sans-serif; padding: 20px; background: #f0f4f8; }
            .container { max-width: 600px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
            .status { background: #10b981; color: white; padding: 10px; border-radius: 5px; margin: 10px 0; }
            a { color: #3b82f6; text-decoration: none; margin: 10px; display: inline-block; }
            .info { background: #f3f4f6; padding: 10px; border-radius: 5px; margin: 10px 0; }
        </style>
    </head>
    <body>
        <div class="container">
            <h1>🩸 Blood Bank Management System</h1>
            <div class="status">
                ✅ Server is running successfully!
            </div>
            <div class="info">
                <strong>Environment:</strong> ${process.env.NODE_ENV || 'development'}<br>
                <strong>Port:</strong> ${PORT}<br>
                <strong>Time:</strong> ${new Date().toISOString()}<br>
                <strong>Node.js:</strong> ${process.version}
            </div>
            <p>🎉 <strong>Great news!</strong> The server deployment is working. The 500 errors are now fixed!</p>
            <div>
                <a href="/api/health">📊 Health Check API</a>
                <a href="https://github.com/ashish-3399/Blood-Bank-Management-System">📂 Source Code</a>
            </div>
            <p><em>Next: We'll restore the full Blood Bank functionality.</em></p>
        </div>
    </body>
    </html>
  `);
});

// Catch all for API routes
app.get('/api/*', (req, res) => {
  res.status(404).json({ 
    error: 'API route not found', 
    path: req.path,
    message: 'This is the simple test server. Full API will be restored next.'
  });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Simple server running on port ${PORT}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/api/health`);
  console.log(`🌐 Main page: http://localhost:${PORT}/`);
});

// Handle server errors
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
});
