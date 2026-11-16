const { fail } = require('./validation');
function minute(value, end = false) {
  if (typeof value !== 'string' || !/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(value)) {
    if (end && value === '24:00') return 1440;
    fail('Interview times must be HH:mm (24:00 is allowed only for endTime)');
  }
  const [hours, minutes] = value.split(':').map(Number);
  return hours * 60 + minutes;
}
function interval(startTime = '00:00', endTime = '24:00') {
  const start = minute(startTime), end = minute(endTime, true);
  if (start >= end) fail('endTime must be after startTime on the same interview date');
  return { startTime, endTime, occupiedMinutes: Array.from({ length: end - start }, (_, i) => start + i) };
}
module.exports = { interval };
