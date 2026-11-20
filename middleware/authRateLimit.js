// In-memory protection for one server process. Use a shared store at deployment.
export function createAuthRateLimit({ limit = 10, windowMs = 15 * 60 * 1000, now = Date.now } = {}) {
  const clients = new Map();
  return (req, res, next) => {
    const time = now();
    for (const [key, entry] of clients) {
      if (entry.until <= time) clients.delete(key);
    }
    // req.ip uses the socket address unless trusted proxies are explicitly configured.
    const key = req.ip;
    let entry = clients.get(key);
    if (!entry) {
      if (clients.size >= 10000) {
        return res.status(503).json({ status: 'error', message: 'Layanan autentikasi sibuk. Coba lagi nanti.' });
      }
      entry = { count: 0, until: time + windowMs };
      clients.set(key, entry);
    }
    entry.count += 1;
    if (entry.count > limit) {
      res.set('Retry-After', String(Math.ceil((entry.until - time) / 1000)));
      return res.status(429).json({ status: 'error', message: 'Terlalu banyak percobaan. Silakan coba lagi dalam 15 menit.' });
    }
    next();
  };
}

export const authRateLimit = createAuthRateLimit();
