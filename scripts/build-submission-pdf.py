from pathlib import Path
import json,sys
from reportlab.pdfgen import canvas
from pypdf import PdfReader
import pypdfium2 as pdfium
ROOT=Path(__file__).resolve().parents[1]
SOURCE=Path(sys.argv[1])
OUT=ROOT/'delivery/Nesta-Project3-Presentation.pdf'
repo='https://github.com/Nesta1223/Nesta-JobFair'
c=canvas.Canvas(str(OUT),pagesize=(1280,720),pageCompression=1)
c.setTitle('nesta - Online Job Fair Registration - Project 3')
c.setAuthor('Nontakorn Krairaveeroj; Passatorn Jindawong')
for i in range(1,14):
    image=SOURCE/f'slide-{i}.png'
    if not image.exists():raise RuntimeError(f'Missing {image}')
    c.drawImage(str(image),0,0,width=1280,height=720)
    if i==12:c.linkURL('https://drive.google.com/file/d/1LfInw0Y76NuZ38VSE3UzfToCQbgnHwMb/view',(80,74,1200,114),relative=0)
    if i==13:
        c.linkURL(repo+'/tree/main',(75,105,1215,158),relative=0)
        c.linkURL(repo+'/graphs/contributors',(75,59,1215,104),relative=0)
    if i in [3,7,8,9,10]:c.linkURL(repo+'/tree/main/docs/diagrams',(0,0,300,45),relative=0)
    c.showPage()
c.save()
reader=PdfReader(OUT)
assert len(reader.pages)==13
assert OUT.stat().st_size<20*1024*1024
qa=ROOT/'artifacts/private/pdf-review';qa.mkdir(parents=True,exist_ok=True)
doc=pdfium.PdfDocument(str(OUT))
for i,page in enumerate(doc):page.render(scale=1).to_pil().save(qa/f'page-{i+1:02d}.png')
print(f'PDF: 13 pages, {OUT.stat().st_size/1024/1024:.2f} MiB; links included')
