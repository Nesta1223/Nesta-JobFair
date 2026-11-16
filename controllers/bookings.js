const Booking = require('../models/Booking');
const { interval } = require('../utils/interview-time');
const Company = require('../models/Company');
const { fail, objectBody, objectId, interviewDate } = require('../utils/validation');
const companyFields = 'name address website description tel';
const scope = (req) => req.user.role === 'admin' ? {} : { user: req.user.id };
async function requireCompany(id) {
  const company = await Company.findById(objectId(id, 'company'));
  if (!company) fail('Company not found', 404);
  return company;
}
async function ownedBooking(req) {
  const booking = await Booking.findById(objectId(req.params.id));
  if (!booking) fail('Booking not found', 404);
  if (req.user.role !== 'admin' && booking.user.toString() !== req.user.id) fail('Not your booking', 403);
  return booking;
}
function publicBooking(booking) { const data = booking.toObject(); delete data.slot; delete data.occupiedMinutes; return data; }
exports.getBookings = async (req, res) => {
  const filter = scope(req);
  if (req.params.companyId) { await requireCompany(req.params.companyId); filter.company = req.params.companyId; }
  const data = await Booking.find(filter).populate('company', companyFields).sort({ interviewDate: 1, _id: 1 });
  return res.json({ success: true, count: data.length, data });
};
exports.getBooking = async (req, res) => {
  const booking = await ownedBooking(req);
  await booking.populate('company', companyFields);
  return res.json({ success: true, data: publicBooking(booking) });
};
async function checkOverlap(user, date, times, exclude) {
  const filter = { user, interviewDate: date, ...(exclude ? { _id: { $ne: exclude } } : {}) };
  const existing = await Booking.find(filter);
  if (existing.some(item => item.startTime < times.endTime && item.endTime > times.startTime)) {
    fail('Interview session overlaps with an existing booking', 409);
  }
}
function overlapError(error) {
  return error.code === 11000 && (error.keyPattern?.occupiedMinutes || error.message.includes('unique_user_interview_minute'));
}
exports.addBooking = async (req, res) => {
  objectBody(req.body);
  const date = interviewDate(req.body.interviewDate);
  const company = await requireCompany(req.params.companyId);
  const times = interval(req.body.startTime, req.body.endTime);
  // Chapter09 count check, strengthened by the unique (user, slot) index.
  for (let attempt = 0; attempt < 10; attempt += 1) {
    await checkOverlap(req.user.id, date, times);
    const current = await Booking.find({ user: req.user.id }).select('+slot');
    const used = new Set(current.map((item) => item.slot));
    const slot = [1, 2, 3].find((value) => !used.has(value));
    if (!slot) fail('You may have at most 3 interview bookings');
    try {
      const booking = await Booking.create({ interviewDate: date, ...times, user: req.user.id, company: company.id, slot });
      await booking.populate('company', companyFields);
      return res.status(201).json({ success: true, data: publicBooking(booking) });
    } catch (error) { if (overlapError(error)) fail('Interview session overlaps with an existing booking', 409); if (error.code !== 11000) throw error; }
  }
  fail('Booking changed concurrently; please retry', 409);
};
exports.updateBooking = async (req, res) => {
  const booking = await ownedBooking(req);
  const body = objectBody(req.body);
  const keys = Object.keys(body);
  if (!keys.length || keys.some((key) => !['interviewDate', 'company', 'startTime', 'endTime'].includes(key))) fail('Only interviewDate, company, startTime and endTime may be updated');
  if (body.interviewDate !== undefined) booking.interviewDate = interviewDate(body.interviewDate);
  if (body.company !== undefined) booking.company = (await requireCompany(body.company)).id;
  const times = interval(body.startTime === undefined ? booking.startTime : body.startTime, body.endTime === undefined ? booking.endTime : body.endTime);
  Object.assign(booking, times);
  await checkOverlap(booking.user, booking.interviewDate, times, booking.id);
  try { await booking.save(); } catch (error) {
    if (overlapError(error)) fail('Interview session overlaps with an existing booking', 409);
    if (error.name === 'VersionError') fail('Booking changed concurrently; please retry', 409);
    throw error;
  }
  await booking.populate('company', companyFields);
  return res.json({ success: true, data: publicBooking(booking) });
};
exports.deleteBooking = async (req, res) => {
  const booking = await ownedBooking(req);
  await booking.deleteOne();
  return res.json({ success: true, data: {} });
};
function csvCell(value) {
  let text = String(value ?? '');
  if (/^[=+\-@\t\r\n]/.test(text)) text = `'${text}`;
  return `"${text.replace(/"/g, '""')}"`;
}
exports.exportBookings = async (req, res) => {
  // Export is always personal, including for an administrator.
  const bookings = await Booking.find({ user: req.user.id }).populate('company', companyFields).sort({ interviewDate: 1, _id: 1 });
  const rows = [['Interview date', 'Start time', 'End time', 'Company', 'Address', 'Website', 'Telephone']];
  for (const booking of bookings) rows.push([booking.interviewDate.toISOString().slice(0, 10), booking.startTime, booking.endTime, booking.company?.name,
    booking.company?.address, booking.company?.website, booking.company?.tel]);
  const csv = '\ufeff' + rows.map((row) => row.map(csvCell).join(',')).join('\r\n') + '\r\n';
  return res.type('text/csv').attachment('my-interviews.csv').send(csv);
};
