export async function build({ presentation, input }) {
  const C = { bg:'#F7F5EF', ink:'#17332F', muted:'#52645E', green:'#12645A', light:'#E4EDE6', orange:'#AE582B' };
  const repo='https://github.com/2110503-69CP/503cp69-a7-2-yyyongfu';
  function text(s,str,x,y,w,h,size=26,color=C.ink,bold=false) {
    const sh=s.shapes.add({geometry:'textbox',position:{left:x,top:y,width:w,height:h},fill:'none',line:{fill:'none',width:0}});
    sh.text=str;sh.text.style={fontFamily:'Arial',fontSize:size,color,bold};return sh;
  }
  function box(s,str,x,y,w,h,size=23,fill=C.bg,geometry='rect') {
    const sh=s.shapes.add({geometry,position:{left:x,top:y,width:w,height:h},fill,line:{fill:C.green,width:1.5}});
    sh.text=str;sh.text.style={fontFamily:'Arial',fontSize:size,color:C.ink,alignment:'center',verticalAlignment:'middle'};return sh;
  }
  function line(s,x1,y1,x2,y2,color=C.green,dashed=false) {
    const w=Math.max(Math.abs(x2-x1),1),h=Math.max(Math.abs(y2-y1),1);
    return s.shapes.add({geometry:'custom',position:{left:Math.min(x1,x2),top:Math.min(y1,y2),width:w,height:h},fill:'none',line:{fill:color,width:1.5,style:dashed?'dashed':'solid'},customPaths:[{width:w,height:h,commands:[{moveTo:{x:x1>x2?w:0,y:y1>y2?h:0}},{lineTo:{x:x1>x2?0:w,y:y1>y2?0:h}}]}]});
  }
  function arrow(s,x1,y1,x2,y2,label,yoff=-27) {
    line(s,x1,y1,x2,y2);
    const angle=Math.atan2(y2-y1,x2-x1);
    line(s,x2-10*Math.cos(angle-0.5),y2-10*Math.sin(angle-0.5),x2,y2);
    line(s,x2-10*Math.cos(angle+0.5),y2-10*Math.sin(angle+0.5),x2,y2);
    if(label)text(s,label,Math.min(x1,x2)+8,y1+yoff,Math.abs(x2-x1)-12,35,18,C.ink);
  }
  function slide(title,number,note='') {
    const s=presentation.slides.add({width:1280,height:720});s.background.fill=C.bg;
    text(s,title,65,46,1160,70,42,C.ink,true);
    text(s,'nesta',67,665,300,30,17,C.green,true);text(s,String(number).padStart(2,'0'),1160,665,60,30,17,C.muted);
    s.speakerNotes.text=note;return s;
  }
  if(input.batch===1) {
    const s=slide('Use cases',2,'FR1–9. User authentication precedes booking operations. Public registration/login; user own records; admin all records. Full diagram: docs/diagrams/use-case.puml. Source: Project3 PDF p7.');
    const boundary=box(s,'',205,142,870,478,22,'none');
    text(s,'Online Job Fair Registration',435,145,520,32,21,C.green,true);
    box(s,'«actor»\nVisitor',40,192,125,65,20,C.light);
    box(s,'«actor»\nUser',40,420,125,65,20,C.light);
    box(s,'«actor»\nAdmin',1110,420,125,65,20,C.light);
    const cases=[['Register',250,190],['Login',250,270],['Logout',250,350],['Browse companies',250,430],['Book interview',250,510],['View own bookings',690,190],['Edit own booking',690,270],['Delete own booking',690,350],['View all bookings',690,430],['Edit / delete any booking',690,510]];
    for(const [label,x,y] of cases)box(s,label,x,y,330,56,22,C.bg,'ellipse');
    line(s,165,222,215,222);line(s,215,218,215,298);line(s,215,218,250,218);line(s,215,298,250,298);
    line(s,165,452,225,452);line(s,225,378,225,538);for(const y of [378,458,538])line(s,225,y,250,y);
    line(s,165,475,185,475);line(s,185,475,185,604);line(s,185,604,640,604);line(s,640,218,640,604);for(const y of [218,298,378])line(s,640,y,690,y);
    line(s,1110,452,1050,452);line(s,1050,458,1050,538);line(s,1020,458,1050,458);line(s,1020,538,1050,538);
    text(s,'Up to 3 interviews · 10–13 May 2022 · Login/logout apply to both roles',210,625,1000,30,20,C.orange);
    const d=slide('Live API demonstration',3,'Switch to Postman. Run requests01–16 in order. User stage3min; Admin1min. Return to diagrams afterward.');
    text(d,'USER',75,190,220,40,24,C.green,true);
    text(d,'Register → Login → Companies\nBook 3 → Reject the 4th\nView → Edit → Delete → Logout',75,265,1100,190,35);
    text(d,'ADMIN',75,490,220,40,24,C.orange,true);
    text(d,'Login → View all → Edit another user → Delete',75,550,1110,55,31);
    const a=slide('Changes from Assignment 7',4,'Baseline e957b39. Explain domain conversion and repaired authorization, not just renamed files. Chapter08/09/12 patterns retained.');
    const rows=[['Hospital / Appointment','Company / Booking'],['Registration','Required telephone + validation'],['Missing logout','Cookie logout + discard client token'],['Admin-only list; unguarded single GET','Scoped list + owner/admin checks'],['Any date; unrestricted update body','10–13 May 2022 + editable-field allowlist']];
    text(a,'ASSIGNMENT 7',75,160,450,40,20,C.muted,true);text(a,'PROJECT 3',620,160,570,40,20,C.green,true);
    rows.forEach(([left,right],i)=>{const y=222+i*74;text(a,left,75,y,485,64,24);text(a,right,620,y,585,64,24,C.ink,i===3);});
  }
  if(input.batch===2) {
    const s=slide('Class diagram · REST resources',5,'UML Profile as in Chapter06 final slides: Application, Resource, Path and HTTP stereotypes. Full source docs/diagrams/api-profile.puml. Base prefix /api/v1.');
    box(s,'«Application»\nNesta API',475,143,330,73,25,C.light);
    const auth=box(s,'«Resource» Auth\n«POST» register / login\n«GET» me / logout',60,295,300,130,23);
    const comp=box(s,'«Resource» Companies\n«GET» list / detail',490,295,300,130,23);
    const bookings=box(s,'«Resource» Bookings\n«GET» own / all',920,295,300,130,23);
    line(s,640,216,640,246);line(s,210,246,1070,246);for(const x of[210,640,1070])arrow(s,x,246,x,295,'');
    text(s,'«Path» /auth',230,253,240,30,19,C.green);text(s,'«Path» /companies',659,253,260,30,19,C.green);text(s,'«Path» /bookings',1078,253,190,30,18,C.green);
    box(s,'«Resource» CompanyBookings\nGET scoped list\nPOST create',460,515,360,124,22);
    box(s,'«Resource» Booking\nGET / PUT / DELETE\nowner or admin',900,515,340,124,22);
    arrow(s,640,425,640,515,'');text(s,'«Path»\n/{companyId}/bookings',655,445,240,60,18,C.green);
    arrow(s,1070,425,1070,515,'');text(s,'«Path» /{id}',1085,461,180,32,18,C.green);
    text(s,'Base path: /api/v1',70,523,330,40,23,C.muted);
    const r=slide('Class diagram · representations',6,'Representations are consumed by REST resources («use»). Internal slot and passwordHash are not returned. Source models/User.js, Company.js, Booking.js.');
    box(r,'«Representation»\nUser\n\nname: String\ntel: String\nemail: String\nrole: user | admin',65,180,330,340,25);
    box(r,'«Representation»\nBooking\n\ninterviewDate: Date\nuser: ObjectId\ncompany: Company\ncreatedAt: Date',475,180,330,340,25,C.light);
    box(r,'«Representation»\nCompany\n\nname: String\naddress: String\nwebsite: String\ndescription: String\ntel: String',885,180,330,340,25);
    line(r,395,352,475,352);text(r,'1',405,315,30,30,21);text(r,'0..3',434,365,60,30,20);
    line(r,805,352,885,352);text(r,'*',820,315,30,30,21);text(r,'1',858,365,30,30,21);
    text(r,'«Resource» Booking  — «use» →  «Representation» Booking',80,559,1110,50,25,C.green);
    text(r,'Internal quota slot and password hash are excluded from API responses.',80,615,1100,35,22,C.muted);
    const q=slide('Sequence · create an interview',7,'Explain request flow and alternative rejection paths. Detailed complete PlantUML source in docs/diagrams/create-booking.puml. Unique(user,slot) handles concurrent creates.');
    const xs=[110,355,635,940,1160];const names=['Postman','Router / protect','Controller','Models','MongoDB'];
    xs.forEach((x,i)=>{box(q,names[i],x-95,150,190,60,21,C.light);line(q,x,210,x,600,C.muted,true);});
    arrow(q,110,245,355,245,'POST + JWT');arrow(q,355,290,635,290,'verified user');
    text(q,'Validate date',650,296,240,30,19,C.orange);
    arrow(q,635,350,940,350,'company + used slots');arrow(q,940,390,1160,390,'query');
    arrow(q,1160,430,940,430,'results');arrow(q,940,470,635,470,'company + free slot');
    arrow(q,635,510,940,510,'create booking');arrow(q,940,545,1160,545,'unique insert');
    arrow(q,1160,580,635,580,'saved result via Model');
    arrow(q,635,615,110,615,'201 · booking + company');
    text(q,'Reject: 401 invalid token · 404 no company · 400 invalid date / quota full',70,640,1150,30,20,C.orange);
  }
  if(input.batch===3) {
    const a=slide('Sequence · ownership and admin access',8,'Source controllers/bookings.js ownedBooking. All single reads/updates/deletes share the check. Full sequence docs/diagrams/authorization.puml.');
    const xs=[130,470,850,1135];const ns=['Client','protect / router','Controller','MongoDB'];
    xs.forEach((x,i)=>{box(a,ns[i],x-105,150,210,60,22,C.light);line(a,x,210,x,590,C.muted,true);});
    arrow(a,130,255,470,255,'GET / PUT / DELETE + JWT');arrow(a,470,310,850,310,'req.user');
    arrow(a,850,365,1135,365,'find booking');arrow(a,1135,410,850,410,'booking + owner');
    box(a,'owner OR admin?',685,445,325,57,25,C.light);
    arrow(a,850,540,1135,540,'yes: read / save / delete');
    arrow(a,850,590,130,590,'no: 403 · data unchanged');
    text(a,'The request cannot change the owner. Only date and company are editable.',70,625,1150,35,22,C.orange);
    const t=slide('Verification',9,'Evidence recorded in artifacts. Local temporary MongoDB on16Nov2026. These are measured functional-test times, not an Atlas benchmark or load SLA. Newman31requests111assertions; integration56cases.');
    text(t,'56 / 56',75,180,650,110,76,C.green,true);text(t,'backend integration tests passed',80,300,1000,50,30);
    text(t,'31 requests · 111 assertions · 0 failures',80,410,1120,65,34,C.ink,true);
    text(t,'Postman Collection Runner / Newman',80,480,1000,45,25,C.muted);
    text(t,'Covers date boundaries, quota, cross-user access, admin access and CSV.',80,560,1100,65,25);
    text(t,'Observed local response maximum: 208 ms (< 3,000 ms requirement)',80,622,1120,30,21,C.muted);
    const e=slide('Extra · download your interview schedule',10,'Extra-credit request: personal CSV export. Run Postman17–18; Send and Download. Implementation and tests in controllers/bookings.js / tests/integration.test.js. Tutorial in delivery linked from repository. Synthetic narration is disclosed in tutorial.');
    text(e,'GET /api/v1/bookings/export',75,170,1100,60,34,C.green,true);
    text(e,'One CSV file with your dates, companies\nand contact details.',75,275,1110,115,36);
    text(e,'Same JWT protection\nOwner filter before export\nQuoted cells + formula neutralization',80,440,1100,145,28);
    text(e,'Watch the 5-minute implementation tutorial',80,611,1120,35,22,C.orange).hyperlink={uri:repo+'/raw/refs/heads/nesta-final-project/delivery/extra-credit-tutorial.mp4',isExternal:true};
    const f=slide('nesta',11,'Show actual GitHub Contributors. Do not invent separate authorship. Both members should rehearse and describe their actual contribution. Links point to project branch.');
    text(f,'Nontakorn Krairaveeroj',75,175,1100,55,34,C.ink,true);text(f,'6732019121  ·  github.com/YYYongFu',75,240,1100,45,25,C.muted);
    text(f,'Passatorn Jindawong',75,340,1100,55,34,C.ink,true);text(f,'6732026521  ·  github.com/Nesta1223',75,405,1100,45,25,C.muted);
    text(f,'Code + diagrams + tutorial',75,515,1100,40,25,C.green,true);
    text(f,repo+'/tree/nesta-final-project',75,563,1140,45,21,C.ink).hyperlink={uri:repo+'/tree/nesta-final-project',isExternal:true};
    text(f,'Teamwork: '+repo+'/graphs/contributors',75,615,1140,40,19,C.muted).hyperlink={uri:repo+'/graphs/contributors',isExternal:true};
  }
  await presentation.render({slide: input.batch===1?[1,2,3]:input.batch===2?[4,5,6]:[7,8,9,10]});
  return {count:presentation.slides.items.length};
}
