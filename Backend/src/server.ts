import { createServer } from 'http';
import { parse } from 'url';
import next from 'next';
import { socketService } from './lib/socket';
import { Bonjour } from 'bonjour-service';

const dev = process.env.NODE_ENV !== 'production';
const hostname = '0.0.0.0';
const port = parseInt(process.env.PORT || '3000', 10);

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const httpServer = createServer((req, res) => {
    try {
      // Manual CORS handling for custom server
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

      if (req.method === 'OPTIONS') {
        res.statusCode = 204;
        res.end();
        return;
      }

      const parsedUrl = parse(req.url!, true);
      handle(req, res, parsedUrl);
    } catch (err) {
      console.error('Error occurred handling', req.url, err);
      res.statusCode = 500;
      res.end('Internal Server Error');
    }
  });

  // Initialize Socket.io
  socketService.init(httpServer);

  httpServer.once('error', (err) => {
    console.error(err);
    process.exit(1);
  });

  httpServer.listen(port, () => {
    console.log(`> Ready on http://${hostname}:${port}`);

    // Publish a stable mDNS hostname for local clients (phone + ESP32).
    try {
      const bonjour = new Bonjour();
      bonjour.publish({
        name: 'imara-backend',
        type: 'http',
        port,
        host: 'imara-backend.local',
      });
      console.log('> mDNS published: http://imara-backend.local:' + port);
    } catch (mdnsError) {
      console.error('> mDNS publish failed:', mdnsError);
    }
  });
});
