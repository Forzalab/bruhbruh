from PIL import Image
import pytesseract, sys
D='/tmp/claude-0/-home-user-gates-of-babylon/d9b3b872-48f2-5080-885a-6332ae6a3579/scratchpad/review/r1/'
def ink_bbox(im, box, thr=100):
    c=im.crop(box).convert('L'); w,h=c.size; px=c.load()
    xs=[x for x in range(w) for y in range(h) if px[x,y]<thr]; ys=[y for x in range(w) for y in range(h) if px[x,y]<thr]
    return (min(xs)+box[0],min(ys)+box[1],max(xs)+box[0],max(ys)+box[1]) if xs else None
def ocr(im, box, scale=3):
    c=im.crop(box).convert('L'); c=c.resize((c.width*scale,c.height*scale))
    return pytesseract.image_to_string(c, config='--psm 6').strip().replace('\n',' / ')
for w in (1280,1440,1920):
    im=Image.open(f'{D}{w}-08b-grid-toast2.png').convert('RGB')
    W,H=im.size
    # find cream toast pixels
    cr=[(x,y) for x in range(0,W,1) for y in range(int(H*.6),H) if im.getpixel((x,y))==(251,245,210)]
    if cr:
        xs=[p[0] for p in cr]; ys=[p[1] for p in cr]; box=(min(xs)-3,min(ys)-3,max(xs)+3,max(ys)+3)
        print(w,'toast region',box, 'OCR:',ocr(im,box))
    # balloon from reject shot
    im2=Image.open(f'{D}{w}-07-reject-balloon.png').convert('RGB')
    print(w,'grid rule px row: ', [im2.getpixel((5,y)) for y in range(0,4)])
for w,box in ((1440,(440,330,622,420)),(1440,(800,655,942,730))):
    im=Image.open(f'{D}{w}-07-reject-balloon.png' if box[1]<500 else f'{D}{w}-08b-grid-toast2.png')
    print('OCR',box,ocr(im,box,4))
    # cap height: ink rows of text interior
    c=im.convert('L').crop(box)
    print('ink bbox', ink_bbox(im.convert('RGB'),box))
