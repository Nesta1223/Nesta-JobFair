const mongoose = require('mongoose');
const BookingSchema = new mongoose.Schema({
  interviewDate: { type: Date, required: true, validate: {
    validator(value) {
      return value >= new Date('2022-05-10T00:00:00Z') && value <= new Date('2022-05-13T00:00:00Z') &&
        value.getUTCHours() === 0 && value.getUTCMinutes() === 0 && value.getUTCSeconds() === 0 && value.getUTCMilliseconds() === 0;
    }, message: 'Interview date must be a date from 10 to 13 May 2022',
  } },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, immutable: true },
  company: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
  // Unique slots enforce the quota across concurrent requests and server processes.
  slot: { type: Number, required: true, min: 1, max: 3, immutable: true, select: false },
  createdAt: { type: Date, default: Date.now, immutable: true },
});
BookingSchema.index({ user: 1, slot: 1 }, { unique: true });
BookingSchema.index({ company: 1, interviewDate: 1 });
module.exports = mongoose.model('Booking', BookingSchema);
