const path = require('node:path');
const mongoose = require('mongoose');
require('dotenv').config({ path: path.join(__dirname, '../config/config.env'), quiet: true });
const Booking = require('../models/Booking');
const { interval } = require('../utils/interview-time');
async function migrate() {
  // Stop API writers before running. Validate all existing schedules before changing data.
  const bookings = await Booking.find().lean();
  const reserved = new Set();
  const updates = bookings.map(booking => {
    const times = interval(booking.startTime, booking.endTime);
    for (const minute of times.occupiedMinutes) {
      const key = `${booking.user}:${booking.interviewDate.toISOString()}:${minute}`;
      if (reserved.has(key)) throw new Error(`Existing overlapping bookings for user ${booking.user}; resolve their schedule before migrating`);
      reserved.add(key);
    }
    return { updateOne: { filter: { _id: booking._id }, update: { $set: times } } };
  });
  if (updates.length) await Booking.bulkWrite(updates);
  await Booking.createIndexes();
  return updates.length;
}
if (require.main === module) {
  mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/nesta_job_fair', { autoIndex: false })
    .then(migrate).then(count => console.log(`Migrated ${count} booking schedules`))
    .catch(error => { console.error(error.message); process.exitCode = 1; })
    .finally(() => mongoose.disconnect());
}
module.exports = migrate;
