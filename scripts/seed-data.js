const User = require('../models/User');
const Company = require('../models/Company');
const Booking = require('../models/Booking');

module.exports = async function seedData({ adminPassword, userPassword }) {
  if (!adminPassword || !userPassword) throw new Error('Provide demo passwords explicitly');
  if (await User.exists({}) || await Company.exists({}) || await Booking.exists({})) {
    throw new Error('Seed requires an empty dedicated database; no existing records were changed');
  }
  await Promise.all([User.init(), Company.init(), Booking.init()]);
  const [admin, alice, bob] = await User.create([
    { name: 'Nesta Admin', tel: '020000001', email: 'admin@nesta.example', password: adminPassword, role: 'admin' },
    { name: 'Demo User A', tel: '0800000001', email: 'alice@nesta.example', password: userPassword },
    { name: 'Demo User B', tel: '0800000002', email: 'bob@nesta.example', password: userPassword },
  ]);
  const companies = await Company.create([
    { name: 'Atlas Software', address: '100 Phaya Thai Road, Bangkok', website: 'https://atlas.example', description: 'Demo company: web and backend engineering', tel: '020000101' },
    { name: 'Blue River Data', address: '200 Silom Road, Bangkok', website: 'https://blueriver.example', description: 'Demo company: data platforms and analytics', tel: '020000102' },
    { name: 'Cedar Cloud', address: '300 Rama IV Road, Bangkok', website: 'https://cedar.example', description: 'Demo company: cloud infrastructure', tel: '020000103' },
    { name: 'Delta Design', address: '400 Sathorn Road, Bangkok', website: 'https://delta.example', description: 'Demo company: product design and frontend engineering', tel: '020000104' },
  ]);
  const bobBooking = await Booking.create({ user: bob.id, company: companies[1].id, interviewDate: '2022-05-11', slot: 1 });
  return { admin, alice, bob, companies, bobBooking };
};
