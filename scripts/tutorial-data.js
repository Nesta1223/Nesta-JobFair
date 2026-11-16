const fs = require('node:fs');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
let mongo, server;
(async () => {
  process.env.JWT_SECRET = require('node:crypto').randomBytes(48).toString('hex');
  mongo = await MongoMemoryServer.create();
  await mongoose.connect(mongo.getUri());
  await require('./seed-data')({ adminPassword: 'NestaAdmin!2026', userPassword: 'NestaUser!2026' });
  server = require('../server').app.listen(0, '127.0.0.1');
  await new Promise(resolve => server.once('listening', resolve));
  const base = `http://127.0.0.1:${server.address().port}/api/v1`;
  const auth = await fetch(base+'/auth/login', { method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email:'alice@nesta.example',password:'NestaUser!2026'}) });
  const { token } = await auth.json();
  const headers = { Authorization:`Bearer ${token}`,'Content-Type':'application/json' };
  const companies = (await (await fetch(base+'/companies',{headers})).json()).data;
  for(let i=0;i<2;i++) await fetch(base+`/companies/${companies[i]._id}/bookings`,{method:'POST',headers,body:JSON.stringify({interviewDate:`2022-05-${10+i}`})});
  const exported = await fetch(base+'/bookings/export',{headers});
  const csv = await exported.text();
  const denied = await fetch(base+'/bookings/export');
  fs.mkdirSync('delivery',{recursive:true});
  fs.writeFileSync('delivery/my-interviews-example.csv',csv);
  fs.writeFileSync('artifacts/tutorial-example.json',JSON.stringify({recordedAt:new Date().toISOString(),method:'GET',path:'/api/v1/bookings/export',status:exported.status,contentType:exported.headers.get('content-type'),contentDisposition:exported.headers.get('content-disposition'),csv,unauthenticated:{status:denied.status,body:await denied.json()}},null,2));
  console.log('Captured actual CSV and unauthenticated response; no tokens saved.');
})().catch(error=>{console.error(error);process.exitCode=1;}).finally(async()=>{
  if(server)await new Promise(resolve=>server.close(resolve));
  await mongoose.disconnect();if(mongo)await mongo.stop();
});
