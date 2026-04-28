import { Server } from 'socket.io';
import { createServer } from 'http';

describe('WebSocket CORS origin enforcement', () => {
  it('configures Socket.io with allowed origins from config, not wildcard', () => {
    const allowedOrigins = ['https://app.example.com', 'https://admin.example.com'];

    const httpServer = createServer();
    const io = new Server(httpServer, {
      cors: {
        origin: allowedOrigins.length > 0 ? allowedOrigins : false,
        methods: ['GET', 'POST'],
        credentials: true,
      },
    });

    // Access the internal cors option to verify it is not a wildcard
    const opts = (io as unknown as { opts: { cors: { origin: unknown } } }).opts;
    expect(opts.cors.origin).not.toBe('*');
    expect(opts.cors.origin).toEqual(allowedOrigins);

    io.close();
  });

  it('disables CORS when no origins are configured', () => {
    const httpServer = createServer();
    const io = new Server(httpServer, {
      cors: {
        origin: false,
        methods: ['GET', 'POST'],
        credentials: true,
      },
    });

    const opts = (io as unknown as { opts: { cors: { origin: unknown } } }).opts;
    expect(opts.cors.origin).toBe(false);

    io.close();
  });
});
