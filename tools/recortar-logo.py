from PIL import Image; import numpy as np, sys
from scipy import ndimage as nd
src, out = sys.argv[1], sys.argv[2]
im = np.asarray(Image.open(src).convert('RGB')).astype(np.float32)
r,g,b = im[...,0],im[...,1],im[...,2]
L = .299*r+.587*g+.114*b
blue = (b - r)
# 1) fundo estimado por convolução normalizada excluindo candidatos a logo
cand = (L > nd.gaussian_filter(L, 60) + 18) | (blue > 35)
cand = nd.binary_dilation(cand, iterations=10)
w = (~cand).astype(np.float32)
sig = 35
den = nd.gaussian_filter(w, sig) + 1e-4
B = np.stack([nd.gaussian_filter(im[...,c]*w, sig)/den for c in range(3)], -1)
BL = .299*B[...,0]+.587*B[...,1]+.114*B[...,2]
# 2) alfa pela diferença de luminância + azul
d = L - BL
a_l = np.clip((d - 26) / 30, 0, 1)
a_b = np.clip((blue - 25) / 40, 0, 1) * np.clip((b - BL - 15)/40, 0, 1)
a = np.maximum(a_l, a_b)
solid = nd.binary_opening(a > .5, iterations=2)
a = a * nd.binary_dilation(solid | ((a > .5) & (np.arange(a.shape[0])[:,None] > 640)), iterations=2)
# 3) remove ruído de textura: só componentes grandes
m = a > .35
lab, n = nd.label(m)
sizes = nd.sum(m, lab, range(1, n+1))
keep = np.isin(lab, 1 + np.where(sizes > 12)[0])
keep[:150, :] = False  # reflexo de luz na parede
keep[:, :120] = False
keepd = nd.binary_dilation(keep, iterations=3)
a = a * keepd
# 4) buracos pequenos (sulcos escuros da fresa, chanfros) viram sólidos
m = a > .35
filled = nd.binary_fill_holes(m)
holes = filled & ~m
hl, hn = nd.label(holes)
hs = nd.sum(holes, hl, range(1, hn+1))
small = np.isin(hl, 1 + np.where(hs < 900)[0])
small[:, 560:] = False  # só preenche sulcos na engrenagem/fresa, nunca miolo de letra
a = np.where(small, 1.0, a)
a = nd.gaussian_filter(a, .6)
a = np.clip(a, 0, 1)
# fresa: metal escuro com sombras fundas -> máscara mais permissiva + preenchimento total
y0,y1,x0,x1 = 180,610,370,615
al = np.maximum(np.clip((d - 10) / 38, 0, 1), a_b)[y0:y1, x0:x1]
ml = al > .35
lb, nb = nd.label(ml); sz = nd.sum(ml, lb, range(1, nb+1))
ml = np.isin(lb, 1 + np.where(sz > 400)[0])
ml = nd.binary_fill_holes(nd.binary_closing(ml, iterations=2))
# corpo da fresa: preenche cada linha entre as bordas (sulcos helicoidais escuros)
for yy in range(0, y1 - y0):
    row = ml[yy, 15:122]  # x 385..492 = haste/canais
    xs_ = np.where(row)[0]
    if len(xs_) > 1 and xs_[-1] - xs_[0] < 100: ml[yy, 15+xs_[0]:15+xs_[-1]+1] = True
al = np.where(ml, 1.0, al * nd.binary_dilation(ml, iterations=2))
mill_fill = np.zeros_like(small); mill_fill[y0:y1, x0:x1] = ml & ~(al < 1)
a[y0:y1, x0:x1] = np.maximum(a[y0:y1, x0:x1], nd.gaussian_filter(al, .6))
small = small | mill_fill
# 5) descontaminação de cor nas bordas
aa = np.maximum(a, 1e-3)[...,None]
C = np.where(a[...,None] > .02, (im - (1-aa)*B) / aa, im)
C = np.clip(C, 0, 255)
# para buracos preenchidos mantém cor original
C = np.where(small[...,None], im, C)
rgba = np.dstack([C, a*255]).astype(np.uint8)
Image.fromarray(rgba, 'RGBA').save(out)
ys, xs = np.where(a > .1)
print('bbox', xs.min(), ys.min(), xs.max(), ys.max())
