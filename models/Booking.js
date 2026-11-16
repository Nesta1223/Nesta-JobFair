const mongoose = require('mongoose');
const { interval } = require('../utils/interview-time');
const BookingSchema = new mongoose.Schema({
  interviewDate: { type: Date, required: true, validate: {
    validator(value) {
      return value >= new Date('2022-05-10T00:00:00Z') && value <= new Date('2022-05-13T00:00:00Z') &&
        value.getUTCHours() === 0 && value.getUTCMinutes() === 0 && value.getUTCSeconds() === 0 && value.getUTCMilliseconds() === 0;
    }, message: 'Interview date must be a date from 10 to 13 May 2022',
  } },
  startTime: { type: String, default: '00:00', required: true },
  endTime: { type: String, default: '24:00', required: true },
  occupiedMinutes: { type: [Number], select: false },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, immutable: true },
  company: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
  slot: { type: Number, required: true, min: 1, max: 3, immutable: true, select: false },
  createdAt: { type: Date, default: Date.now, immutable: true },
}, { optimisticConcurrency: true });
BookingSchema.pre('validate', function () {
  this.occupiedMinutes = interval(this.startTime, this.endTime).occupiedMinutes;
});
BookingSchema.index({ user: 1, slot: 1 }, { unique: true });
// Each minute is reserved atomically, including concurrent creates and edits.
BookingSchema.index({ user: 1, interviewDate: 1, occupiedMinutes: 1 }, { unique: true, name: 'unique_user_interview_minute' });
BookingSchema.index({ company: 1, interviewDate: 1 });
module.exports = mongoose.model('Booking', BookingSchema);
