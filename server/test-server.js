import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

// Basic middleware
app.use(express.json());

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Test server running',
    timestamp: new Date().toISOString()
  });
});

// Test static file serving
app.use(express.static(path.join(__dirname, '../dist')));

// Catch all
app.get('*', (req, res) => {
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ error: 'API route not found' });
  }
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
        <title>Test Server</title>
    </head>
    <body>
        <h1>Blood Bank Management System</h1>
        <p>Test server is running!</p>
        <p>Environment: ${process.env.NODE_ENV || 'development'}</p>
        <p>Timestamp: ${new Date().toISOString()}</p>
        <a href="/api/health">Health Check</a>
    </body>
    </html>
  `);
});

app.listen(PORT, () => {
  console.log(`Test server running on port ${PORT}`);
});
