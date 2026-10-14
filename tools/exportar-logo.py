from PIL import Image; import numpy as np, sys, os
src, outdir = sys.argv[1], sys.argv[2]
im = Image.open(src)
def dark(img):
    a = np.asarray(img).astype(np.float32)
    r,g,b,al = a[...,0],a[...,1],a[...,2],a[...,3]
    L = .299*r+.587*g+.114*b
    bl = np.clip(((b - r) - 25) / 40, 0, 1)[...,None]
    gm = np.stack([L*.36, L*.38, L*.42], -1)  # metal grafite
    rgb = gm*(1-bl) + a[...,:3]*bl
    return Image.fromarray(np.dstack([np.clip(rgb,0,255), al]).astype(np.uint8), 'RGBA')
def save(img, name):
    img.save(os.path.join(outdir, name + '.png'), optimize=True)
    img.save(os.path.join(outdir, name + '.webp'), quality=90, method=6)
    d = dark(img)
    d.save(os.path.join(outdir, name + '-grafite.png'), optimize=True)
    d.save(os.path.join(outdir, name + '-grafite.webp'), quality=90, method=6)
P = 6
full = im.crop((139-P, 184-P, 1407+P, 778+P)); save(full, 'erg-logo')
nav  = im.crop((139-P, 184-P, 1407+P, 700)); save(nav, 'erg-logo-horizontal')
# só símbolo + ERG (sem o subtítulo) para o menu
a = np.asarray(im).copy(); a[615:, 530:, 3] = 0
brand = Image.fromarray(a, 'RGBA').crop((139-P, 184-P, 1407+P, 700)); save(brand, 'erg-logo-menu')
mark = im.crop((139-P, 184-P, 615, 700))
w,h = mark.size; s = max(w,h); sq = Image.new('RGBA', (s,s)); sq.paste(mark, ((s-w)//2, (s-h)//2)); save(sq, 'erg-simbolo')
sq.resize((64,64), Image.LANCZOS).save(os.path.join(outdir,'favicon-64.png'))
sq.resize((180,180), Image.LANCZOS).save(os.path.join(outdir,'apple-touch-icon.png'))
for n in sorted(os.listdir(outdir)): print(n, os.path.getsize(os.path.join(outdir,n))//1024, 'KB')
