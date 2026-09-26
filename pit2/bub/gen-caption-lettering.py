# Caption (toast) phrases in Anime Ace 3 BB Italic, outlined with fontTools -> src/captionLettering.js. Units u, cap 12u.
# usage: capgen.py left|center PAD_X PAD_Y   (pads in caps; measured from Blambot grammar_caps.jpg)
import sys, json
from fontTools.ttLib import TTFont
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
F = '/tmp/claude-0/-home-user-gates-of-babylon/d9b3b872-48f2-5080-885a-6332ae6a3579/scratchpad/font/animeace3bb_ot/AnimeAce3BB_'
IT = TTFont(F + 'Italic.otf'); GS = IT.getGlyphSet(); CM = IT.getBestCmap()
CAP = 12.0; K = CAP / IT['OS/2'].sCapHeight; LEAD = 1.33 * CAP  # ref caption leading 16px / 12px cap
align, PX, PY = sys.argv[1], float(sys.argv[2]) * CAP, float(sys.argv[3]) * CAP
def r(v): return f'{v:.1f}'.rstrip('0').rstrip('.') if v != int(v) else str(int(v))
ONE = {'wiped': ['CANVAS WIPED.'], 'gridOn': ['GRID SHOWN.'], 'gridOff': ['GRID HIDDEN.']}
TWO = {'wiped': ['CANVAS', 'WIPED.'], 'gridOn': ['GRID', 'SHOWN.'], 'gridOff': ['GRID', 'HIDDEN.']}
PH = ONE if align == 'left' else TWO
out = ['// Toast captions (no speaker): Anime Ace 3 BB Italic outlined with fontTools (font never shipped). Units u, cap 12u.',
       f'// Box = text + padding {PX/CAP:.2f} x {PY/CAP:.2f} caps (Blambot grammar_caps.jpg caption), text {align}-aligned.', 'export const CAPTION = {']
for key, lines in PH.items():
    widths = [sum(IT['hmtx'][CM[ord(c)]][0] for c in ln) * K for ln in lines]
    tw = max(widths); th = CAP + LEAD * (len(lines) - 1)
    W, H = tw + 2 * PX, th + 2 * PY
    pen = SVGPathPen(None, ntos=r)
    for i, ln in enumerate(lines):
        x = PX + (0 if align == 'left' else (tw - widths[i]) / 2); base = PY + CAP + i * LEAD
        for c in ln:
            g = CM[ord(c)]
            GS[g].draw(TransformPen(pen, (K, 0, 0, -K, x, base))); x += IT['hmtx'][g][0] * K
    out.append(f"  {key}: {{ text: {json.dumps(' '.join(lines))}, w: {r(W)}, h: {r(H)},\n    d: '{pen.getCommands()}' }},")
out.append('};')
print('\n'.join(out))
