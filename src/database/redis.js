// src/database/redis.js
// Conexión a Redis para estado volátil (cooldowns, timers en memoria)

const Redis = require('ioredis')

const redis = new Redis({
  host: process.env.REDIS_HOST || '127.0.0.1',
  port: process.env.REDIS_PORT || 6379,
  // Si tienes contraseña en Redis, agrégala al .env como REDIS_PASSWORD
  password: process.env.REDIS_PASSWORD || undefined,
  // Reintentar conexión automáticamente
  retryStrategy: (times) => {
    if (times > 10) {
      console.error('❌ Redis: no se pudo conectar después de 10 intentos')
      return null // dejar de reintentar
    }
    return Math.min(times * 200, 2000) // esperar entre intentos
  }
})

redis.on('connect', () => console.log('✅ Redis conectado'))
redis.on('error', (err) => console.error('❌ Redis error:', err.message))

module.exports = redis