const cache = new Map();

function get(key, ttl) {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.time > ttl) {
    cache.delete(key);
    return null;
  }
  return entry.data;
}

function set(key, data) {
  cache.set(key, { data, time: Date.now() });
}

function clear() {
  cache.clear();
}

module.exports = { get, set, clear };
