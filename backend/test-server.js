const http = require('http');

console.log('🧪 Test serveur minimal...');

const server = http.createServer((req, res) => {
  console.log(`📥 ${req.method} ${req.url}`);
  
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }
  
  if (req.url === '/demo/status') {
    res.writeHead(200);
    res.end(JSON.stringify({
      success: true,
      data: { currentMode: 'TEST_MODE' }
    }));
  } else if (req.url === '/api/genai/process' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk.toString());
    req.on('end', () => {
      try {
        const data = JSON.parse(body);
        console.log('📦 Data reçue:', data);
        res.writeHead(200);
        res.end(JSON.stringify({
          success: true,
          result: `✅ TEST RÉUSSI! Action: ${data.action}, Texte: "${data.text?.substring(0, 50)}..."`
        }));
      } catch (error) {
        console.error('❌ Erreur:', error);
        res.writeHead(400);
        res.end(JSON.stringify({ error: 'Invalid JSON' }));
      }
    });
  } else {
    res.writeHead(404);
    res.end(JSON.stringify({ error: 'Not found' }));
  }
});

server.on('error', (err) => {
  console.error('❌ Erreur serveur:', err);
});

server.listen(8080, '127.0.0.1', () => {
  console.log('✅ Serveur test démarré sur http://127.0.0.1:8080');
});