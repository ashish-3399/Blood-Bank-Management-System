// Ultra-minimal server - should never crash
import { createServer } from 'http';

const PORT = process.env.PORT || 5000;

console.log('🚀 Starting ultra-minimal server on port', PORT);

const server = createServer((req, res) => {
  console.log('📥 Request:', req.method, req.url);
  
  // Set headers to prevent any CORS issues
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Content-Type', 'application/json');

  if (req.url === '/api/health') {
    res.writeHead(200);
    res.end(JSON.stringify({
      status: 'OK',
      message: 'Ultra-minimal server working!',
      timestamp: new Date().toISOString(),
      port: PORT
    }));
    return;
  }

  // All other routes
  res.writeHead(200, { 'Content-Type': 'text/html' });
  res.end(`
    <!DOCTYPE html>
    <html>
    <head>
        <title>Blood Bank System - Minimal Server</title>
        <style>
            body { 
                font-family: Arial, sans-serif; 
                padding: 20px; 
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                min-height: 100vh;
                margin: 0;
            }
            .container { 
                max-width: 600px; 
                margin: 50px auto; 
                background: rgba(255,255,255,0.1);
                padding: 30px; 
                border-radius: 15px; 
                backdrop-filter: blur(10px);
                box-shadow: 0 8px 32px rgba(0,0,0,0.3);
            }
            .status { 
                background: #10b981; 
                padding: 15px; 
                border-radius: 8px; 
                margin: 20px 0; 
                text-align: center;
                font-weight: bold;
            }
            .info { 
                background: rgba(255,255,255,0.1); 
                padding: 15px; 
                border-radius: 8px; 
                margin: 20px 0; 
            }
            a { 
                color: #60a5fa; 
                text-decoration: none; 
                margin: 10px; 
                display: inline-block;
                background: rgba(255,255,255,0.1);
                padding: 8px 16px;
                border-radius: 5px;
                border: 1px solid rgba(255,255,255,0.2);
            }
            a:hover {
                background: rgba(255,255,255,0.2);
            }
        </style>
    </head>
    <body>
        <div class="container">
            <h1>🩸 Blood Bank Management System</h1>
            <div class="status">
                ✅ SUCCESS! Server is now running properly!
            </div>
            <div class="info">
                <strong>🎉 Railway Deployment Fixed!</strong><br><br>
                <strong>Environment:</strong> ${process.env.NODE_ENV || 'development'}<br>
                <strong>Port:</strong> ${PORT}<br>
                <strong>Time:</strong> ${new Date().toISOString()}<br>
                <strong>Node.js:</strong> ${process.version}
            </div>
            <p><strong>✅ The 500 errors and crashes are now resolved!</strong></p>
            <p>This ultra-minimal server proves the Railway deployment is working correctly.</p>
            <div>
                <a href="/api/health">📊 API Health Check</a>
                <a href="https://github.com/ashish-3399/Blood-Bank-Management-System">📂 GitHub</a>
            </div>
            <p><em>🚀 Next step: We'll gradually add back the full Blood Bank functionality.</em></p>
        </div>
    </body>
    </html>
  `);
});

server.on('error', (error) => {
  console.error('❌ Server error:', error);
});

server.listen(PORT, '0.0.0.0', () => {
  console.log('✅ Ultra-minimal server running on port', PORT);
  console.log('🌐 Server started successfully at', new Date().toISOString());
});

// Prevent crashes
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  // Don't exit - keep server running
});

process.on('unhandledRejection', (reason) => {
  console.error('❌ Unhandled Rejection:', reason);
  // Don't exit - keep server running
});
