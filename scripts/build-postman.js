const fs = require('node:fs');
const path = require('node:path');
const out = path.join(__dirname, '../postman');
fs.mkdirSync(out, { recursive: true });
const items = [];
function add(name, method, route, body, token, status, checks = [], pre = []) {
  const exec = [
    `pm.test('HTTP ${status}', () => pm.response.to.have.status(${status}));`,
    "pm.test('Response under 3 seconds', () => pm.expect(pm.response.responseTime).to.be.below(3000));",
    ...(route.endsWith('/export') ? [] : ["const json = pm.response.json();", `pm.test('Success flag', () => pm.expect(json.success).to.eql(${status < 400}));`]),
    ...checks,
  ];
  items.push({ name, protocolProfileBehavior: { disableCookies: true }, request: {
    method, header: [{ key: 'Content-Type', value: 'application/json' }],
    auth: token ? { type: 'bearer', bearer: [{ key: 'token', value: `{{${token}}}`, type: 'string' }] } : { type: 'noauth' },
    url: `{{URL}}/api/v1${route}`,
    ...(body ? { body: { mode: 'raw', raw: JSON.stringify(body, null, 2), options: { raw: { language: 'json' } } } } : {}),
    description: name,
  }, event: [...(pre.length ? [{ listen: 'prerequest', script: { type: 'text/javascript', exec: pre } }] : []),
    { listen: 'test', script: { type: 'text/javascript', exec } }] });
}
add('01 Registration validation: missing telephone', 'POST', '/auth/register', { name: 'Demo Student', email: '{{RUN_EMAIL}}', password: '{{USER_PASSWORD}}' }, null, 400, [], [
  "pm.collectionVariables.set('RUN_EMAIL', 'demo.' + Date.now() + '@nesta.example');",
]);
add('02 Register student', 'POST', '/auth/register', { name: 'Nesta Demo Student', tel: '0812345678', email: '{{RUN_EMAIL}}', password: '{{USER_PASSWORD}}', role: 'admin' }, null, 201, [
  "pm.collectionVariables.set('USER_ID', json.data._id);",
  "pm.test('Cannot self-assign admin', () => pm.expect(json.data.role).to.eql('user'));",
  "pm.test('Telephone stored', () => pm.expect(json.data.tel).to.eql('0812345678'));",
]);
add('03 User login', 'POST', '/auth/login', { email: '{{RUN_EMAIL}}', password: '{{USER_PASSWORD}}' }, null, 200, ["pm.collectionVariables.set('USER_TOKEN', json.token);"]);
add('04 Browse companies', 'GET', '/companies', null, 'USER_TOKEN', 200, [
  "pm.test('Company catalogue present', () => pm.expect(json.count).to.be.at.least(2));",
  "pm.collectionVariables.set('COMPANY_ID', json.data[0]._id); pm.collectionVariables.set('COMPANY_2_ID', json.data[1]._id);",
  "pm.test('All required fields', () => json.data.forEach(c => ['name','address','website','description','tel'].forEach(k => pm.expect(c[k]).to.be.a('string'))));",
  "pm.test('No booking disclosure', () => json.data.forEach(c => pm.expect(c).not.to.have.property('bookings')));",
]);
add('05 Reject date outside the fair', 'POST', '/companies/{{COMPANY_ID}}/bookings', { interviewDate: '2022-05-14' }, 'USER_TOKEN', 400);
for (let i = 1; i <= 3; i++) add(`06.${i} Book interview ${i} of 3`, 'POST', '/companies/{{COMPANY_ID}}/bookings', { interviewDate: `2022-05-${9 + i}` }, 'USER_TOKEN', 201, [
  `pm.collectionVariables.set('BOOKING_${i}_ID', json.data._id);`,
  "pm.test('Booking belongs to current user', () => pm.expect(json.data.user).to.eql(pm.collectionVariables.get('USER_ID')));",
]);
add('07 Reject fourth interview', 'POST', '/companies/{{COMPANY_ID}}/bookings', { interviewDate: '2022-05-13' }, 'USER_TOKEN', 400);
add('08 View own interviews', 'GET', '/bookings', null, 'USER_TOKEN', 200, [
  "pm.test('Exactly three', () => pm.expect(json.count).to.eql(3));",
  "pm.test('Only own records', () => json.data.forEach(b => pm.expect(b.user).to.eql(pm.collectionVariables.get('USER_ID'))));",
]);
add('09 Edit own interview', 'PUT', '/bookings/{{BOOKING_1_ID}}', { interviewDate: '2022-05-13', company: '{{COMPANY_2_ID}}' }, 'USER_TOKEN', 200, [
  "pm.test('Changed date', () => pm.expect(json.data.interviewDate.slice(0,10)).to.eql('2022-05-13'));",
  "pm.test('Changed company', () => pm.expect(json.data.company._id).to.eql(pm.collectionVariables.get('COMPANY_2_ID')));",
]);
add('10 Delete own interview', 'DELETE', '/bookings/{{BOOKING_1_ID}}', null, 'USER_TOKEN', 200);
add('11 Logout', 'GET', '/auth/logout', null, 'USER_TOKEN', 200, [
  "pm.collectionVariables.unset('USER_TOKEN');",
  "pm.test('Cookie replaced', () => pm.expect(pm.response.headers.get('Set-Cookie')).to.include('token=none'));",
]);
add('12 After logout: no credentials', 'GET', '/bookings', null, null, 401);
add('13 Admin login', 'POST', '/auth/login', { email: '{{ADMIN_EMAIL}}', password: '{{ADMIN_PASSWORD}}' }, null, 200, [
  "pm.collectionVariables.set('ADMIN_TOKEN', json.token); pm.test('Admin role', () => pm.expect(json.data.role).to.eql('admin'));",
]);
add('14 Admin sees all users', 'GET', '/bookings', null, 'ADMIN_TOKEN', 200, [
  "pm.test('Includes current student', () => pm.expect(json.data.some(b => b.user === pm.collectionVariables.get('USER_ID'))).to.eql(true));",
  "pm.test('Includes another student', () => pm.expect(json.data.some(b => b.user !== pm.collectionVariables.get('USER_ID'))).to.eql(true));",
]);
add('15 Admin edits student booking', 'PUT', '/bookings/{{BOOKING_2_ID}}', { interviewDate: '2022-05-13' }, 'ADMIN_TOKEN', 200, [
  "pm.test('Owner unchanged', () => pm.expect(json.data.user).to.eql(pm.collectionVariables.get('USER_ID')));",
]);
add('16 Admin deletes student booking', 'DELETE', '/bookings/{{BOOKING_2_ID}}', null, 'ADMIN_TOKEN', 200);
add('17 User login for CSV extra', 'POST', '/auth/login', { email: '{{RUN_EMAIL}}', password: '{{USER_PASSWORD}}' }, null, 200, ["pm.collectionVariables.set('USER_TOKEN', json.token);"]);
add('18 EXTRA: download own schedule as CSV', 'GET', '/bookings/export', null, 'USER_TOKEN', 200, [
  "pm.test('CSV content type', () => pm.expect(pm.response.headers.get('Content-Type')).to.include('text/csv'));",
  "pm.test('One remaining personal booking', () => pm.expect(pm.response.text().trim().split('\\r\\n').length).to.eql(2));",
]);
const demoItems = structuredClone(items);
add('19 Other user login for ownership tests', 'POST', '/auth/login', { email: 'bob@nesta.example', password: '{{USER_PASSWORD}}' }, null, 200, ["pm.collectionVariables.set('OTHER_TOKEN', json.token);"]);
for (const [i, method] of ['GET', 'PUT', 'DELETE'].entries()) add(`20.${i+1} Other user cannot ${method} student booking`, method, '/bookings/{{BOOKING_3_ID}}', method === 'PUT' ? { interviewDate: '2022-05-13' } : null, 'OTHER_TOKEN', 403);
add('21 Reject owner reassignment', 'PUT', '/bookings/{{BOOKING_3_ID}}', { user: '000000000000000000000001' }, 'USER_TOKEN', 400);
add('22 Invalid update date', 'PUT', '/bookings/{{BOOKING_3_ID}}', { interviewDate: '2022-05-09' }, 'USER_TOKEN', 400);
add('23 Read back unchanged booking', 'GET', '/bookings/{{BOOKING_3_ID}}', null, 'USER_TOKEN', 200, ["pm.test('Original date preserved', () => pm.expect(json.data.interviewDate.slice(0,10)).to.eql('2022-05-12'));"]);
add('24 CSV without login rejected', 'GET', '/bookings/export', null, null, 401);
add('25 Invalid identifier', 'GET', '/bookings/not-an-id', null, 'USER_TOKEN', 400);
add('26 Verify admin deletion', 'GET', '/bookings/{{BOOKING_2_ID}}', null, 'USER_TOKEN', 404);
add('27 Cleanup student booking', 'DELETE', '/bookings/{{BOOKING_3_ID}}', null, 'USER_TOKEN', 200);
const collection = (name, item) => ({ info: { name, schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json', description: 'Nesta Project 3. Start npm run demo. Requests disable cookies so token isolation and logout tests are deterministic. Fictional demo credentials only.' }, item, variable: [] });
fs.writeFileSync(path.join(out, 'Nesta-demo.postman_collection.json'), JSON.stringify(collection('Nesta | 7-minute demonstration', demoItems), null, 2));
fs.writeFileSync(path.join(out, 'Nesta-regression.postman_collection.json'), JSON.stringify(collection('Nesta | Regression', items), null, 2));
fs.writeFileSync(path.join(out, 'Nesta-local.postman_environment.json'), JSON.stringify({ name: 'Nesta local - DEMO credentials only', values: Object.entries({ URL: 'http://127.0.0.1:5000', USER_PASSWORD: 'NestaUser!2026', ADMIN_EMAIL: 'admin@nesta.example', ADMIN_PASSWORD: 'NestaAdmin!2026' }).map(([key,value]) => ({ key,value,type:key.includes('PASSWORD')?'secret':'default',enabled:true })), _postman_variable_scope: 'environment' }, null, 2));
console.log(`Generated demo (${demoItems.length} requests) and regression (${items.length} requests).`);
