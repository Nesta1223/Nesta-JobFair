export async function update({presentation}) {
 const set=(id,t,size)=>{const s=presentation.resolve(id);s.text=t;if(size)s.text.style={fontFamily:'Arial',fontSize:size,color:'#17332F'};};
 set('sh/bap03i9o','Book interview*');set('sh/xc7i5sru','Edit own booking*');set('sh/ydgjexsf','Edit* / delete any booking');
 set('sh/utk361cn','* Create / update include an overlap check for the same user and date',19);
 set('sh/t8b610jm','«Representation»\nBooking\ninterviewDate: Date\nstartTime: HH:mm\nendTime: HH:mm\nuser: ObjectId\ncompany: Company\ncreatedAt: Date',22);
 set('sh/wzy5kbit','Internal quota slot, occupiedMinutes and password hash are not returned.',21);
 set('sh/qh8nex8j','Validate date + times',18);set('sh/2t8nad87','company + user schedule',18);set('sh/25kj65sv','no overlap + free slot',18);set('sh/3mpg3mpw','unique slot + minutes',17);
 set('sh/fqhcve58','Reject: 400 date/time/quota · 401 token · 404 company · 409 overlap',19);
 set('sh/dk7i5szy','PUT: check overlap, save',17);set('sh/tkjy94fu','PUT checks the owner’s schedule, excludes itself, and returns 409 on overlap.',21);
 set('sh/yh0vmd4b','65 / 65');set('sh/jedw7ml0','Latest recorded Newman response maximum: 157 ms (local test)',21);set('sh/id4vyh4f','Includes overlaps, adjacent sessions, admin edits and concurrent requests.',24);
 set('sh/hwf2lsra','Watch the implementation video');presentation.resolve('sh/hwf2lsra').hyperlink={uri:'https://drive.google.com/file/d/1LfInw0Y76NuZ38VSE3UzfToCQbgnHwMb/view',isExternal:true};
 presentation.slides.getItem(10).speakerNotes.text='Recorded history in Nesta1223/Nesta-JobFair: Nesta1223 commits cover setup, User/auth, validation, Company and server; YYYongFu commits cover Booking, tests, materials, restoration and overlap requirement. See docs/teamwork.md. Commit counts do not establish equal workload.';
 const make=(title)=>{const s=presentation.slides.add({width:1280,height:720});s.background.fill='#F7F5EF';const t=(v,x,y,w,h,z=28,c='#17332F')=>{let q=s.shapes.add({geometry:'textbox',position:{left:x,top:y,width:w,height:h},fill:'none',line:{fill:'none',width:0}});q.text=v;q.text.style={fontFamily:'Arial',fontSize:z,color:c};return q;};t(title,65,46,1160,75,42);return {s,t};};
 let {s,t}=make('Project #3 · Online Job Fair Registration');
 t('Register with name, telephone, email and password.\nSign in with email/password and sign out.',75,170,1130,100,30);
 t('Browse companies and book up to 3 interviews\nduring 10–13 May 2022.',75,300,1130,100,30);
 t('User: view, edit and delete own bookings.\nAdmin: view, edit and delete any user’s bookings.',75,430,1130,100,30);
 t('REST API · authenticated access · responses within 3 seconds',75,590,1130,50,25,'#12645A');
 s.speakerNotes.text='Source: Project PDF p7 FR1–9, p2–3 NFR. MongoDB Atlas or PostgreSQL; live Postman demo. No frontend required.';s.moveTo(1);
 ({s,t}=make('Additional requirement · no overlapping interviews'));
 t('One user cannot have overlapping interviews\non the same date — even at different companies.',75,160,1130,100,32);
 t('Existing: 09:00–09:30',75,290,1100,45,29);
 t('09:15–09:45  →  409 Conflict\n09:30–10:00  →  Allowed (adjacent)',75,355,1130,100,30,'#12645A');
 t('Check POST and PUT, including admin edits.\nDifferent users may book the same time.',75,495,1130,95,27);
 t('Overlap: newStart < oldEnd AND newEnd > oldStart',75,612,1130,38,24,'#AE582B');
 s.speakerNotes.text='Source: docs/requirements.md, controllers/bookings.js, utils/interview-time.js, models/Booking.js. HH:mm Asia/Bangkok; end exclusive. Unique(user,interviewDate,occupiedMinutes) prevents concurrent conflicts. Max3 unchanged. PUT excludes own ID and checks booking.user. Omitted create times default to all day; omitted update times retain existing values.';s.moveTo(5);
 await presentation.render();
 return {slides:presentation.slides.items.length};
}
