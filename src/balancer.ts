import http from 'node:http';

export function createRoundRobinBalancer(
  listenPort: number,
  targetPorts: number[],
): http.Server {
  if (targetPorts.length === 0) {
    throw new Error('At least one worker port is required for the load balancer');
  }

  let next = 0;
  const server = http.createServer((req, res) => {
    const targetPort = targetPorts[next++ % targetPorts.length];
    const headers = { ...req.headers, host: `127.0.0.1:${targetPort}` };

    const proxyReq = http.request(
      {
        hostname: '127.0.0.1',
        port: targetPort,
        path: req.url ?? '/',
        method: req.method,
        headers,
      },
      (proxyRes) => {
        res.writeHead(proxyRes.statusCode ?? 502, proxyRes.headers);
        proxyRes.pipe(res);
      },
    );

    proxyReq.on('error', () => {
      if (!res.headersSent) {
        res.statusCode = 502;
      }
      res.end('Bad gateway');
    });

    req.pipe(proxyReq);
  });

  server.listen(listenPort, '0.0.0.0');
  return server;
}
