const { randomBytes } = require('node:crypto');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
let mongo;
let server;
(async () => {
  process.env.NODE_ENV = 'development';
  process.env.JWT_SECRET = randomBytes(48).toString('hex');
  mongo = await MongoMemoryServer.create({ instance: { dbName: 'nesta_demo' } });
  process.env.MONGO_URI = mongo.getUri();
  const { start } = require('../server');
  server = await start();
  await require('./seed-data')({ adminPassword: 'NestaAdmin!2026', userPassword: 'NestaUser!2026' });
  console.log('DEMO ONLY: temporary MongoDB; data resets after stopping. First run downloads MongoDB.');
  console.log('Admin: admin@nesta.example / NestaAdmin!2026');
  console.log('User: alice@nesta.example or bob@nesta.example / NestaUser!2026');
})().catch(async (error) => {
  console.error(error.message);
  if (server) server.close();
  await mongoose.disconnect();
  if (mongo) await mongo.stop();
  process.exitCode = 1;
});
async function stop() {
  if (server) await new Promise((resolve) => server.close(resolve));
  await mongoose.disconnect();
  if (mongo) await mongo.stop();
  process.exit(0);
}
process.on('SIGINT', stop);
process.on('SIGTERM', stop);
