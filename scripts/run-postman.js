const fs = require('node:fs');
const path = require('node:path');
const { randomBytes } = require('node:crypto');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const newman = require('newman');
let mongo, server;
(async () => {
  process.env.JWT_SECRET = randomBytes(48).toString('hex');
  process.env.NODE_ENV = 'test';
  mongo = await MongoMemoryServer.create({ instance: { dbName: 'nesta_postman' } });
  await mongoose.connect(mongo.getUri());
  await require('./seed-data')({ adminPassword: 'NestaAdmin!2026', userPassword: 'NestaUser!2026' });
  server = require('../server').app.listen(0, '127.0.0.1');
  await new Promise(resolve => server.once('listening', resolve));
  const environment = require('../postman/Nesta-local.postman_environment.json');
  environment.values.find(x => x.key === 'URL').value = `http://127.0.0.1:${server.address().port}`;
  const collection = require('../postman/Nesta-regression.postman_collection.json');
  const summary = await new Promise((resolve, reject) => newman.run({ collection, environment, reporters: 'cli' }, (error, result) => error ? reject(error) : resolve(result)));
  // Save counts and failure descriptions only: full Newman reports contain live JWTs.
  const report = { recordedAt: new Date().toISOString(), stats: summary.run.stats,
    timings: summary.run.timings, failures: summary.run.failures.map(f => ({ source: f.source.name, message: f.error.message })) };
  fs.mkdirSync(path.join(__dirname, '../artifacts'), { recursive: true });
  fs.writeFileSync(path.join(__dirname, '../artifacts/newman-summary.json'), JSON.stringify(report, null, 2));
  if (summary.run.failures.length) process.exitCode = 1;
})().catch(error => { console.error(error); process.exitCode = 1; }).finally(async () => {
  if (server) await new Promise(resolve => server.close(resolve));
  await mongoose.disconnect();
  if (mongo) await mongo.stop();
});
