// src/database/test.js
const { getDb } = require('./db')
const redis = require('./redis')

async function main() {
  // Probar SQLite
  const db = await getDb()
  const result = db.exec('SELECT sqlite_version() as version')
  console.log('SQLite versión:', result[0].values[0][0])

  // Probar Redis
  await redis.set('test_key', 'hola mundo')
  const val = await redis.get('test_key')
  console.log('Redis test:', val)
  await redis.del('test_key')

  console.log('✅ Todo listo')
  process.exit(0)
}

main().catch(err => {
  console.error('❌ Error:', err.message)
  process.exit(1)
})