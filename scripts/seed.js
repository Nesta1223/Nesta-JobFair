require('dotenv').config({ path: require('node:path').join(__dirname, '../config/config.env'), quiet: true });
const mongoose = require('mongoose');
(async () => {
  await require('../config/db')();
  await require('./seed-data')({ adminPassword: process.env.DEMO_ADMIN_PASSWORD, userPassword: process.env.DEMO_USER_PASSWORD });
  console.log('Seed complete: four fictional companies, admin, Alice, Bob and Bob\'s booking.');
})().catch((error) => { console.error(error.message); process.exitCode = 1; }).finally(() => mongoose.disconnect());
