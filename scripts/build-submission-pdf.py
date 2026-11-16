from pathlib import Path
import json,sys
from reportlab.pdfgen import canvas
from pypdf import PdfReader
import pypdfium2 as pdfium
ROOT=Path(__file__).resolve().parents[1]
SOURCE=Path(sys.argv[1])
OUT=ROOT/'delivery/Nesta-Project3-Presentation.pdf'
repo='https://github.com/2110503-69CP/503cp69-a7-2-yyyongfu'
c=canvas.Canvas(str(OUT),pagesize=(1280,720),pageCompression=1)
c.setTitle('nesta - Online Job Fair Registration - Project 3')
c.setAuthor('Nontakorn Krairaveeroj; Passatorn Jindawong')
for i in range(1,12):
    image=SOURCE/f'slide-{i}.png'
    if not image.exists():raise RuntimeError(f'Missing {image}')
    c.drawImage(str(image),0,0,width=1280,height=720)
    if i==10:c.linkURL(repo+'/raw/refs/heads/nesta-final-project/delivery/extra-credit-tutorial.mp4',(80,74,1200,114),relative=0)
    if i==11:
        c.linkURL(repo+'/tree/nesta-final-project',(75,105,1215,158),relative=0)
        c.linkURL(repo+'/graphs/contributors',(75,59,1215,104),relative=0)
    if i in [2,5,6,7,8]:c.linkURL(repo+'/tree/nesta-final-project/docs/diagrams',(0,0,300,45),relative=0)
    c.showPage()
c.save()
reader=PdfReader(OUT)
assert len(reader.pages)==11
assert OUT.stat().st_size<20*1024*1024
qa=ROOT/'artifacts/private/pdf-review';qa.mkdir(parents=True,exist_ok=True)
doc=pdfium.PdfDocument(str(OUT))
for i,page in enumerate(doc):page.render(scale=1).to_pil().save(qa/f'page-{i+1:02d}.png')
print(f'PDF: 11 pages, {OUT.stat().st_size/1024/1024:.2f} MiB; links included')
