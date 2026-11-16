const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const { MongoMemoryServer } = require('mongodb-memory-server');
process.env.JWT_SECRET = 'test-only-secret-with-more-than-thirty-two-characters';
process.env.NODE_ENV = 'test';
const { app } = require('../server');
const User = require('../models/User');
const Company = require('../models/Company');
const Booking = require('../models/Booking');
let mongo, server, url, seeded, a, b, admin, aToken, bToken, adminToken, bookingId;
const measurements = [];
async function request(method, path, body, token, expected, extraHeaders = {}) {
  const start = performance.now();
  const response = await fetch(url + '/api/v1' + path, {
    method, headers: { ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}), ...extraHeaders },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });
  const text = await response.text();
  const duration = performance.now() - start;
  measurements.push({ method, path, status: response.status, durationMs: Math.round(duration * 100) / 100 });
  if (expected != null) assert.equal(response.status, expected, `${method} ${path}: ${text}`);
  return { response, text, data: response.headers.get('content-type')?.includes('application/json') ? JSON.parse(text) : null };
}
const register = (email, overrides = {}) => ({ name: 'Test Student', tel: '0812345678', email, password: 'Student!2026', ...overrides });
const create = (date, token = aToken, expected = 201, company = seeded.companies[0].id, extras = {}) =>
  request('POST', `/companies/${company}/bookings`, { interviewDate: date, ...extras }, token, expected);

before(async () => {
  mongo = await MongoMemoryServer.create({ instance: { dbName: 'nesta_tests' } });
  await mongoose.connect(mongo.getUri());
  seeded = await require('../scripts/seed-data')({ adminPassword: 'Admin!2026', userPassword: 'Student!2026' });
  a = seeded.alice; b = seeded.bob; admin = seeded.admin;
  aToken = a.getSignedJwtToken(); bToken = b.getSignedJwtToken(); adminToken = admin.getSignedJwtToken();
  server = app.listen(0, '127.0.0.1');
  await new Promise((resolve) => server.once('listening', resolve));
  url = `http://127.0.0.1:${server.address().port}`;
});
after(async () => {
  fs.mkdirSync('artifacts', { recursive: true });
  fs.writeFileSync('artifacts/http-measurements.json', JSON.stringify({ recordedAt: new Date().toISOString(), environment: 'Local temporary MongoDB; not an Atlas/load benchmark', count: measurements.length, maxMs: Math.max(...measurements.map(x => x.durationMs)), requests: measurements }, null, 2));
  if (server) await new Promise((resolve) => server.close(resolve));
  await mongoose.disconnect();
  if (mongo) await mongo.stop();
});

test('FR1: register all required fields; hash password; ignore role escalation', async () => {
  const { data } = await request('POST', '/auth/register', register('new@nesta.example', { role: 'admin' }), null, 201);
  assert.equal(data.data.role, 'user'); assert.equal(data.data.tel, '0812345678'); assert.ok(data.token);
  assert.equal(data.data.password, undefined);
  const stored = await User.findById(data.data._id).select('+password');
  assert.notEqual(stored.password, 'Student!2026'); assert.ok(await stored.matchPassword('Student!2026'));
});
for (const field of ['name', 'tel', 'email', 'password']) test(`FR1: reject missing ${field}`, async () => {
  const body = register(`missing-${field}@nesta.example`); delete body[field];
  await request('POST', '/auth/register', body, null, 400);
});
for (const [field, value] of [['email', 'not-email'], ['tel', 'abc'], ['password', '123'], ['name', {}], ['tel', 812345678]]) {
  test(`FR1: reject invalid ${field} (${typeof value})`, () => request('POST', '/auth/register', register('bad@nesta.example', { [field]: value }), null, 400));
}
test('FR1: reject duplicate normalized email', () => request('POST', '/auth/register', register(' NEW@NESTA.EXAMPLE '), null, 400));
test('FR2: login normalized email and HTTP-only cookie', async () => {
  const { response, data } = await request('POST', '/auth/login', { email: ' ALICE@NESTA.EXAMPLE ', password: 'Student!2026' }, null, 200);
  assert.equal(data.data._id, a.id); assert.ok(response.headers.get('set-cookie').includes('HttpOnly'));
  const cookie = response.headers.get('set-cookie').split(';')[0];
  const me = await request('GET', '/auth/me', undefined, null, 200, { Cookie: cookie });
  assert.equal(me.data.data.password, undefined); assert.equal(me.data.data._id, a.id);
});
test('FR2: wrong password', () => request('POST', '/auth/login', { email: a.email, password: 'wrong' }, null, 401));
test('FR2: unknown account', () => request('POST', '/auth/login', { email: 'absent@nesta.example', password: 'wrong' }, null, 401));
test('FR2: missing credentials', () => request('POST', '/auth/login', {}, null, 400));
test('FR2: object injection in email rejected', () => request('POST', '/auth/login', { email: { $ne: null }, password: 'Student!2026' }, null, 400));
test('AUTH: no token', () => request('GET', '/bookings', undefined, null, 401));
test('AUTH: invalid token', () => request('GET', '/bookings', undefined, 'invalid', 401));
test('AUTH: expired token', () => request('GET', '/bookings', undefined, jwt.sign({ id: a.id }, process.env.JWT_SECRET, { expiresIn: -1 }), 401));
test('AUTH: deleted account token', () => request('GET', '/bookings', undefined, jwt.sign({ id: new mongoose.Types.ObjectId().toString() }, process.env.JWT_SECRET), 401));
test('FR3: company catalogue requires login', () => request('GET', '/companies', undefined, null, 401));
test('FR3: all company fields, no reverse-populated bookings', async () => {
  const { data } = await request('GET', '/companies', undefined, aToken, 200);
  assert.equal(data.count, 4);
  for (const company of data.data) {
    for (const field of ['name', 'address', 'website', 'description', 'tel']) assert.ok(company[field]);
    assert.equal(company.bookings, undefined); assert.equal(company.appointments, undefined);
  }
  await request('GET', `/companies/${seeded.companies[0].id}`, undefined, aToken, 200);
});
test('FR3: invalid company id', () => create('2022-05-10', aToken, 400, 'broken'));
test('FR3: absent company', () => create('2022-05-10', aToken, 404, new mongoose.Types.ObjectId().toString()));
for (const date of ['2022-05-09', '2022-05-14', '2026-05-10', '2022-05-10T00:00:00Z', '2022-02-30', null, { $gt: '' }]) {
  test(`FR3: reject date ${JSON.stringify(date)}`, () => create(date, aToken, 400));
}
test('FR3: first boundary date; owner comes from JWT, slot hidden', async () => {
  const { data } = await create('2022-05-10', aToken, 201, seeded.companies[0].id, { user: b.id, slot: 99 });
  bookingId = data.data._id;
  assert.equal(data.data.user, a.id); assert.equal(data.data.slot, undefined);
  assert.equal(data.data.interviewDate, '2022-05-10T00:00:00.000Z');
});
test('FR3: last boundary date accepted', () => create('2022-05-13'));
test('FR3: third booking accepted', () => create('2022-05-11'));
test('FR3: fourth booking rejected and count remains 3', async () => {
  await create('2022-05-12', aToken, 400);
  assert.equal(await Booking.countDocuments({ user: a.id }), 3);
});
test('FR4: list only owned bookings, ignore forged query scope', async () => {
  const { data } = await request('GET', `/bookings?user=${b.id}`, undefined, aToken, 200);
  assert.equal(data.count, 3); assert.ok(data.data.every(x => x.user === a.id));
  const nested = await request('GET', `/companies/${seeded.companies[0].id}/bookings`, undefined, bToken, 200);
  assert.equal(nested.data.count, 0);
});
test('FR4: own single booking visible', () => request('GET', `/bookings/${bookingId}`, undefined, aToken, 200));
for (const method of ['GET', 'PUT', 'DELETE']) test(`OWNERSHIP: other user cannot ${method} booking`, async () => {
  await request(method, `/bookings/${bookingId}`, method === 'PUT' ? { interviewDate: '2022-05-12' } : undefined, bToken, 403);
  assert.ok(await Booking.findById(bookingId));
});
test('FR5: update company and date with read-back', async () => {
  await request('PUT', `/bookings/${bookingId}`, { interviewDate: '2022-05-12', company: seeded.companies[2].id }, aToken, 200);
  const { data } = await request('GET', `/bookings/${bookingId}`, undefined, aToken, 200);
  assert.equal(data.data.company._id, seeded.companies[2].id); assert.equal(data.data.interviewDate.slice(0, 10), '2022-05-12');
});
test('FR5: ownership cannot be reassigned', () => request('PUT', `/bookings/${bookingId}`, { user: b.id }, aToken, 400));
test('FR5: invalid update preserves existing data', async () => {
  await request('PUT', `/bookings/${bookingId}`, { interviewDate: '2022-05-14' }, aToken, 400);
  await request('PUT', `/bookings/${bookingId}`, { company: new mongoose.Types.ObjectId().toString() }, aToken, 404);
  const stored = await Booking.findById(bookingId);
  assert.equal(stored.user.toString(), a.id); assert.equal(stored.interviewDate.toISOString().slice(0, 10), '2022-05-12');
});
test('FR5: empty update rejected', () => request('PUT', `/bookings/${bookingId}`, {}, aToken, 400));
test('EXTRA: CSV contains only own schedule and correct headers', async () => {
  const { response, text } = await request('GET', '/bookings/export', undefined, aToken, 200);
  assert.match(response.headers.get('content-type'), /text\/csv/);
  assert.match(response.headers.get('content-disposition'), /my-interviews.csv/);
  assert.match(text, /Cedar Cloud/); assert.ok(!text.includes('Blue River Data')); assert.equal(text.trim().split('\r\n').length, 4);
});
test('EXTRA: CSV quotes and formula neutralization', async () => {
  const company = seeded.companies[2];
  await Company.findByIdAndUpdate(company.id, { name: '=DANGEROUS,"name"' });
  const { text } = await request('GET', '/bookings/export', undefined, aToken, 200);
  assert.ok(text.includes('"\'=DANGEROUS,""name"""'));
  await Company.findByIdAndUpdate(company.id, { name: company.name });
});
test('EXTRA: export requires login', () => request('GET', '/bookings/export', undefined, null, 401));
test('FR6: delete and confirm absence', async () => {
  await request('DELETE', `/bookings/${bookingId}`, undefined, aToken, 200);
  await request('GET', `/bookings/${bookingId}`, undefined, aToken, 404);
});
test('FR3/6: deleted booking frees quota', () => create('2022-05-10'));
test('FR7: administrator lists both users', async () => {
  const { data } = await request('GET', '/bookings', undefined, adminToken, 200);
  assert.ok(data.data.some(x => x.user === a.id)); assert.ok(data.data.some(x => x.user === b.id));
});
test('FR8: admin edits someone else and preserves owner', async () => {
  await request('PUT', `/bookings/${seeded.bobBooking.id}`, { interviewDate: '2022-05-13' }, adminToken, 200);
  const stored = await Booking.findById(seeded.bobBooking.id);
  assert.equal(stored.user.toString(), b.id); assert.equal(stored.interviewDate.toISOString().slice(0, 10), '2022-05-13');
});
test('FR9: admin deletes someone else', async () => {
  await request('DELETE', `/bookings/${seeded.bobBooking.id}`, undefined, adminToken, 200);
  assert.equal(await Booking.findById(seeded.bobBooking.id), null);
});
test('ROBUSTNESS: malformed id and missing record', async () => {
  await request('GET', '/bookings/not-an-id', undefined, aToken, 400);
  await request('GET', `/bookings/${new mongoose.Types.ObjectId()}`, undefined, aToken, 404);
});
test('FR3: concurrent creation cannot exceed quota', async () => {
  const outcomes = await Promise.all(Array.from({ length: 8 }, (_, i) => request('POST', `/companies/${seeded.companies[0].id}/bookings`, { interviewDate: '2022-05-10', startTime: `${String(9 + i).padStart(2, '0')}:00`, endTime: `${String(10 + i).padStart(2, '0')}:00` }, bToken)));
  assert.equal(outcomes.filter(x => x.response.status === 201).length, 3);
  assert.equal(outcomes.filter(x => x.response.status === 400).length, 5);
  assert.equal(await Booking.countDocuments({ user: b.id }), 3);
});
test('FR2: logout clears cookie; discarded credentials fail; copied JWT remains valid as taught', async () => {
  const { response } = await request('GET', '/auth/logout', undefined, aToken, 200);
  assert.match(response.headers.get('set-cookie'), /token=none/);
  await request('GET', '/auth/me', undefined, null, 401, { Cookie: 'token=none' });
  await request('GET', '/auth/me', undefined, aToken, 200);
});
test('NFR: observed local requests finish within 3000 ms', () => {
  assert.ok(measurements.every(x => x.durationMs < 3000), JSON.stringify(measurements.filter(x => x.durationMs >= 3000)));
});

async function freshUser() {
  const user = await User.create(register('overlap-' + new mongoose.Types.ObjectId() + '@nesta.example'));
  return { user, token: user.getSignedJwtToken() };
}
const timed = (token, startTime, endTime, expected = 201, company = seeded.companies[0].id, date = '2022-05-10') =>
  create(date, token, expected, company, { startTime, endTime });
test('ADDITIONAL: partial, contained, enclosing and identical overlaps across companies are rejected', async () => {
  const { token } = await freshUser();
  await timed(token, '10:00', '11:00');
  for (const [start, end] of [['09:30', '10:30'], ['10:30', '11:30'], ['10:15', '10:45'], ['09:00', '12:00'], ['10:00', '11:00']]) {
    const result = await timed(token, start, end, 409, seeded.companies[1].id);
    assert.match(result.data.message, /overlaps/);
  }
});
test('ADDITIONAL: adjacent sessions, another date and another user are allowed', async () => {
  const { token } = await freshUser(), other = await freshUser();
  await timed(token, '10:00', '11:00');
  await timed(token, '11:00', '12:00');
  await timed(token, '10:00', '11:00', 201, seeded.companies[0].id, '2022-05-11');
  await timed(other.token, '10:00', '11:00');
});
test('ADDITIONAL: invalid times and reversed ranges rejected', async () => {
  const { token } = await freshUser();
  for (const [start, end] of [['9:00', '10:00'], ['24:00', '24:00'], ['10:60', '12:00'], ['11:00', '10:00'], ['10:00', '10:00'], [null, '11:00'], ['10:00', null]]) {
    await timed(token, start, end, 400);
  }
});
test('ADDITIONAL: edits exclude self and admin checks booking owner; failed edits preserve data', async () => {
  const { token } = await freshUser();
  const first = (await timed(token, '10:00', '11:00')).data.data;
  const second = (await timed(token, '12:00', '13:00')).data.data;
  await request('PUT', '/bookings/' + first._id, { startTime: '10:00', endTime: '11:00' }, token, 200);
  for (const actor of [token, adminToken]) {
    await request('PUT', '/bookings/' + second._id, { startTime: '10:30', endTime: '11:30' }, actor, 409);
  }
  assert.equal((await Booking.findById(second._id)).startTime, '12:00');
  await request('DELETE', '/bookings/' + first._id, undefined, token, 200);
  await request('PUT', '/bookings/' + second._id, { startTime: '10:30', endTime: '11:30' }, token, 200);
});
test('ADDITIONAL: legacy date-only booking blocks the day', async () => {
  const { token } = await freshUser();
  await create('2022-05-10', token);
  await timed(token, '15:00', '16:00', 409);
});
test('ADDITIONAL: simultaneous overlapping creates allow exactly one', async () => {
  const { token, user } = await freshUser();
  const outcomes = await Promise.all(Array.from({ length: 8 }, (_, i) => timed(token, i % 2 ? '10:30' : '10:00', '11:00', null)));
  assert.equal(outcomes.filter(x => x.response.status === 201).length, 1);
  assert.equal(outcomes.filter(x => x.response.status === 409).length, 7);
  assert.equal(await Booking.countDocuments({ user: user.id }), 1);
});
test('ADDITIONAL: simultaneous edits to an overlapping interval allow exactly one', async () => {
  const { token } = await freshUser();
  const first = (await timed(token, '09:00', '10:00')).data.data;
  const second = (await timed(token, '12:00', '13:00')).data.data;
  const outcomes = await Promise.all([first, second].map(item => request('PUT', '/bookings/' + item._id, { startTime: '10:30', endTime: '11:30' }, token)));
  assert.deepEqual(outcomes.map(x => x.response.status).sort(), [200, 409]);
});

test('ADDITIONAL: moving a booking to another date checks that date for conflicts', async () => {
  const { token } = await freshUser();
  await timed(token, '10:00', '11:00');
  const nextDay = (await timed(token, '10:30', '11:30', 201, seeded.companies[0].id, '2022-05-11')).data.data;
  await request('PUT', '/bookings/' + nextDay._id, { interviewDate: '2022-05-10' }, token, 409);
  assert.equal((await Booking.findById(nextDay._id)).interviewDate.toISOString().slice(0, 10), '2022-05-11');
});
test('ADDITIONAL: migration reserves legacy dates and is repeatable', async () => {
  const { user, token } = await freshUser();
  const legacy = await Booking.collection.insertOne({ user: user._id, company: seeded.companies[0]._id, interviewDate: new Date('2022-05-12'), slot: 1 });
  const migrate = require('../scripts/migrate-booking-times');
  await migrate();
  await migrate();
  const stored = await Booking.findById(legacy.insertedId).select('+occupiedMinutes');
  assert.equal(stored.startTime, '00:00'); assert.equal(stored.endTime, '24:00');
  assert.equal(stored.occupiedMinutes.length, 1440);
  await timed(token, '10:00', '11:00', 409, seeded.companies[0].id, '2022-05-12');
});
