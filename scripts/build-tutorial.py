from pathlib import Path
import json, textwrap
from reportlab.pdfgen import canvas
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
import pypdfium2 as pdfium

ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'artifacts/private/tutorial'
OUT.mkdir(parents=True,exist_ok=True)
pdfmetrics.registerFont(TTFont('Tahoma','C:/Windows/Fonts/tahoma.ttf'))
pdfmetrics.registerFont(TTFont('TahomaBold','C:/Windows/Fonts/tahomabd.ttf'))
actual=json.loads((ROOT/'artifacts/tutorial-example.json').read_text())
code=(ROOT/'controllers/bookings.js').read_text()
export_code=code[code.index('exports.exportBookings'):]
csv_code=code[code.index('function csvCell'):code.index('exports.exportBookings')]
scenes=[
('Personal interview schedule as CSV','ส่วนเพิ่ม: ดาวน์โหลดตารางสัมภาษณ์ของตัวเอง',
 'GET /api/v1/bookings/export\n\nInput: authenticated user (Bearer JWT)\nOutput: my-interviews.csv\n\nDate | Company | Address | Website | Telephone\n\nCode walkthrough with real local API evidence.\nSynthetic English narration; Thai chapter captions.',
 'This tutorial explains the extra feature in Nesta, our online job fair registration project. A signed-in student can download their own interview schedule as a CSV file. We will build the protected route, query only that student\'s bookings, format the file, and verify the result. The examples use our actual source code and recorded local API responses. This walkthrough uses synthetic narration.'),
('1. Start the existing backend','เริ่มจาก backend เดิม ไม่ต้องเพิ่ม framework',
 'npm ci\nnpm run demo\n\nBase URL: http://127.0.0.1:5000/api/v1\n\nPOST /auth/login\n{\n  "email": "alice@nesta.example",\n  "password": "NestaUser!2026"\n}\n\nUse the response token as Bearer authentication.',
 'First install the locked dependencies, then start the demo server. This command starts a temporary local MongoDB and creates fictional companies and demo accounts. Log in as Alice and retain the returned token. These published credentials are for disposable rehearsal data only. For the persistent project environment, configure your authorized MongoDB Atlas connection and use your own credentials. Never place a real secret in the repository.'),
('2. Register the export route','ประกาศ /export ก่อน /:id และใช้ protect',
 (ROOT/'routes/bookings.js').read_text().split("router.post('/'")[0].rstrip()+"\n\n// Place the fixed path above the parameter path:\nrouter.route('/:id')\n  .get(c.getBooking)\n  .put(c.updateBooking)\n  .delete(c.deleteBooking);",
 'In routes slash bookings, the router first applies protect. The export handler is registered before the colon id route. This order matters: otherwise Express could interpret the word export as a booking identifier. We keep the same route, middleware, controller structure taught in the course. No separate frontend or new authentication system is necessary. An unauthenticated export request must be rejected before querying any schedule data.'),
('3. Filter by the authenticated user','กรองเจ้าของจาก JWT ไม่รับ user ID จาก client',
 "const bookings = await Booking.find({\n  user: req.user.id\n})\n  .populate('company', companyFields)\n  .sort({ interviewDate: 1, _id: 1 });\n\n// Personal export, even for an administrator.\n// Never use req.query.user or req.body.user here.\n\n// populate resolves the Company ObjectId reference.",
 'Next, query bookings using request dot user dot id. Protect has already verified the token and loaded this user. Do not accept an owner identifier from the query string or request body, because a client could replace it with somebody else\'s identifier. Populate retrieves the company contact fields from the reference. Sort by interview date and identifier so the exported schedule has a stable order.'),
('4. Build the CSV rows','สร้างหัวตารางและแปลงวันเป็น YYYY-MM-DD',
 "const rows = [[\n  'Interview date', 'Company', 'Address',\n  'Website', 'Telephone'\n]];\n\nfor (const booking of bookings) {\n  rows.push([\n    booking.interviewDate.toISOString().slice(0, 10),\n    booking.company?.name, booking.company?.address,\n    booking.company?.website, booking.company?.tel\n  ]);\n}",
 'Start with a header row containing the interview date and the four company contact columns. For every booking, convert the stored date to the first ten characters of its ISO representation. Our API stores these date-only values at UTC midnight, so this does not shift the day according to the presenter\'s computer. A user with no interviews still receives a valid file containing only the headers.'),
('5. Escape cells and prevent formulas','จัดการ comma, quote และค่าที่อาจเป็นสูตร',
 csv_code,
 'Every value passes through CSV cell escaping. Convert null values to an empty string, and surround each cell with double quotes. Embedded double quotes are doubled, which preserves commas and quotation marks inside company names or addresses. Also prefix suspicious formula-leading characters with an apostrophe. This reduces the risk of a spreadsheet interpreting external data as a formula when the downloaded file is opened.'),
('6. Return a downloadable file','กำหนด content type และชื่อไฟล์ดาวน์โหลด',
 "const csv = '\\ufeff' + rows\n  .map(row => row.map(csvCell).join(','))\n  .join('\\r\\n') + '\\r\\n';\n\nreturn res\n  .type('text/csv')\n  .attachment('my-interviews.csv')\n  .send(csv);\n\nUTF-8 BOM: helps spreadsheet programs recognize text\nCRLF: one CSV record per line",
 'Join escaped cells with commas and records with carriage return and line feed. The UTF eight byte order mark helps spreadsheet software recognize the encoding. Express sets the content type to text slash CSV and the content disposition to an attachment with the filename my interviews dot CSV. The response is the file itself, not JSON containing a file. Postman can save it with Send and Download.'),
('7. Check the actual response','ตัวอย่างนี้มาจากการเรียก API จริงบนเครื่อง',
 f"GET {actual['path']}\nHTTP {actual['status']}\nContent-Type: {actual['contentType']}\nContent-Disposition: {actual['contentDisposition']}\n\n"+actual['csv'].lstrip('\ufeff'),
 'Here is a real response captured from our local server. Alice has two interviews, and the CSV contains the header plus those two records. The content type and attachment filename are both checked. The saved evidence is in the artifacts directory, and the sample CSV is in delivery. Tokens were deliberately omitted from the evidence files. This is a local functional demonstration, not a cloud performance benchmark.'),
('8. Verify privacy and edge cases','ทดสอบสิทธิ์ การ escape และข้อมูลของคนอื่น',
 "npm test\nnpm run test:postman\n\nCSV checks:\n  correct Content-Type and attachment name\n  contains only the authenticated user's bookings\n  quotes and formula-leading text escaped\n  no credentials -> HTTP 401\n\nRecorded unauthenticated response:\n"+json.dumps(actual['unauthenticated'],indent=2),
 'Verification needs more than seeing a successful download. Our tests check the content type, filename, row count, and ownership. Alice\'s file must not contain Bob\'s interview. A separate test checks quotation marks and a formula-like company name. Another request omits authentication and must return four oh one. The complete regression collection also verifies booking ownership, date validation, administrator actions, and logout behavior.'),
('9. Reproduce and explain the feature','สรุปวิธีทำและไฟล์ที่ต้องเปิดตอนตอบคำถาม',
 "Files to review:\n  routes/bookings.js\n  controllers/bookings.js -> exportBookings / csvCell\n  tests/integration.test.js -> EXTRA cases\n  postman/Nesta-demo.postman_collection.json\n\nRun demo requests 17 and 18.\nUse Send and Download, then inspect the CSV.\n\n56 integration tests passed\n31 Newman requests / 111 assertions / 0 failures\nEvidence: artifacts/newman-summary.json",
 'To reproduce the feature, start the backend and run demo requests seventeen and eighteen. Log in as the student, download the file, and compare it with that student\'s bookings. The implementation stays within Express, Mongoose, JWT, and the Postman workflow taught in class. The additional work is the personal export and safe CSV serialization. Both team members should review these files and be able to explain the owner filter themselves.'),
]
pdf=OUT/'tutorial-frames.pdf'
c=canvas.Canvas(str(pdf),pagesize=(1280,720))
for i,(title,thai,body,narration) in enumerate(scenes):
    c.setFillColorRGB(.965,.961,.937);c.rect(0,0,1280,720,fill=1,stroke=0)
    c.setFillColorRGB(.09,.20,.18);c.setFont('TahomaBold',34);c.drawString(50,654,title)
    c.setFont('Tahoma',23);c.setFillColorRGB(.07,.39,.35);c.drawString(50,610,thai)
    c.setFillColorRGB(.09,.12,.13);c.rect(50,106,1180,469,fill=1,stroke=0)
    wrapped=[]
    for ln in body.splitlines():
        wrapped.extend(textwrap.wrap(ln,width=90,replace_whitespace=False,drop_whitespace=False) or [''])
    size=min(20,420/max(len(wrapped),1)/1.25)
    c.setFont('Courier',size);c.setFillColorRGB(.90,.95,.92)
    y=550
    for ln in wrapped:
        c.drawString(72,y,ln);y-=size*1.25
    c.setFont('Tahoma',18);c.setFillColorRGB(.31,.39,.36)
    c.drawString(50,61,'nesta | Extra credit implementation tutorial | Synthetic narration')
    c.drawRightString(1225,61,f'{i+1:02d} / 10')
    c.showPage()
    (OUT/f'voice-{i:02d}.txt').write_text(narration,encoding='utf-8')
c.save()
doc=pdfium.PdfDocument(str(pdf))
for i,page in enumerate(doc):page.render(scale=1.5).to_pil().save(OUT/f'frame-{i:02d}.png')
transcript='\n\n'.join(f'{i//2:02d}:{(i%2)*30:02d} — {s[0]}\n{s[1]}\n\n{s[3]}' for i,s in enumerate(scenes))
(ROOT/'delivery/extra-credit-transcript.txt').write_text(transcript,encoding='utf-8')
subs=[]
def stamp(t):return f'{t//3600:02d}:{t//60%60:02d}:{t%60:02d},000'
for i,s in enumerate(scenes):
    words=s[3].split(); chunks=[words[j:j+14] for j in range(0,len(words),14)]
    for j,chunk in enumerate(chunks):
        start=i*30+round(j*30/len(chunks));end=i*30+round((j+1)*30/len(chunks))
        subs.append(f'{len(subs)+1}\n{stamp(start)} --> {stamp(end)}\n'+ ' '.join(chunk))
(ROOT/'delivery/extra-credit-tutorial.en.srt').write_text('\n\n'.join(subs)+'\n',encoding='utf-8')
print('Rendered 10 tutorial frames and saved narration/transcript/subtitles.')
