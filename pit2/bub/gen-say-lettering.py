# Outline fixed UI phrases in Anime Ace 3 BB into src/sayLettering.js (paths only; the .otf never enters the repo).
# Units: u (1u = 1px at 1440 wide). Cap = 12u (type scale). Balloon = 2:1 ellipse + curved tail, tip at (0,0).
import math, sys, json
from fontTools.ttLib import TTFont
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
from fontTools.pens.boundsPen import BoundsPen

F = '/tmp/claude-0/-home-user-gates-of-babylon/d9b3b872-48f2-5080-885a-6332ae6a3579/scratchpad/font/animeace3bb_ot/AnimeAce3BB_'
REG, BI = TTFont(F + 'Regular.otf'), TTFont(F + 'BoldItalic.otf')
CAP = 12.0
K = CAP / 666            # font units -> u (Regular cap 666)
LEAD = 1.28 * CAP        # REF-MEASURE: leading / cap = 1.28
INK = 0.248 * CAP        # the hint's outline / cap (3.79u / 15.3u)
REST_STROKE = 22 * K     # the hint's thickening of Regular (+0.022em)
PAD = 0.5 * CAP

def adv(font, ch):
    cmap = font.getBestCmap(); g = cmap[ord(ch)]
    return font['hmtx'][g][0], g

def kern(font, a, b):
    return 0  # GPOS kerning skipped: caps comic face, spacing is built in

def line_runs(line):
    # '*' toggles bold italic
    out, bold = [], False
    for part in line.split('*'):
        if part: out.append((part, bold))
        bold = not bold
    return out

def layout(lines):
    # returns per-line list of (x, glyph, font, bold) in font units, and line widths
    res = []
    for ln in lines:
        x, items = 0, []
        for text, bold in line_runs(ln):
            f = BI if bold else REG
            for ch in text:
                a, g = adv(f, ch)
                items.append((x, g, f, bold)); x += a
        res.append((items, x))
    return res

def draw(lines):
    lay = layout(lines)
    wmax = max(w for _, w in lay) * K
    h = CAP + LEAD * (len(lines) - 1)
    emph, rest = SVGPathPen(None, ntos=lambda v: r(v)), SVGPathPen(None, ntos=lambda v: r(v))
    for i, (items, w) in enumerate(lay):
        x0 = -w * K / 2; base = -h / 2 + CAP + i * LEAD
        for x, g, f, bold in items:
            pen = emph if bold else rest
            gs = f.getGlyphSet()
            tp = TransformPen(pen, (K, 0, 0, -K, x0 + x * K, base))
            gs[g].draw(tp)
    return wmax, h, emph.getCommands(), rest.getCommands()

def r(v): return f'{v:.1f}'.replace('.0', '') if abs(v - round(v)) < 0.05 else f'{v:.1f}'

def balloon(w, h, tail):
    rx = math.hypot(w / 2 + PAD, 2 * (h / 2 + PAD)); ry = rx / 2
    pt = lambda deg: (rx * math.cos(math.radians(deg)), ry * math.sin(math.radians(deg)))
    if tail == 'down':   # speaker below; tip 1.6 caps under the ellipse, a little left, curved
        a, b = pt(100), pt(122); tip = (-0.28 * rx, ry + 1.6 * CAP)
        c1 = (a[0] - 0.05 * rx, ry + 0.55 * CAP); c2 = (b[0] + 0.12 * rx, ry + 0.9 * CAP)
    elif tail == 'lowleft':  # palette hint: speaker (the tab) below-left; balloon sits high, long curved tail
        a, b = pt(138), pt(158); tip = (-1.2 * rx, ry + 2.0 * CAP)
        c1 = (a[0] - 0.12 * rx, ry + 0.8 * CAP); c2 = (b[0] - 0.10 * rx, ry + 0.4 * CAP)
    else:                # 'left': speaker to the lower left
        a, b = pt(152), pt(172); tip = (-rx - 1.4 * CAP, ry * 0.95)
        c1 = (a[0] - 0.25 * CAP, ry * 0.75); c2 = (b[0] - 0.5 * CAP, ry * 0.55)
    # ellipse from a, long way round to b, then tail b -> tip -> a
    d = (f'M{r(a[0])} {r(a[1])}A{r(rx)} {r(ry)} 0 1 0 {r(b[0])} {r(b[1])}'
         f'Q{r(c2[0])} {r(c2[1])} {r(tip[0])} {r(tip[1])}Q{r(c1[0])} {r(c1[1])} {r(a[0])} {r(a[1])}Z')
    # shift so the tip is the origin
    return d, rx, ry, tip

PHRASES = {
    'pinTaken': (['THAT INPUT', '*ALREADY* HAS', 'A WIRE!'], 'down'),
    'cantConnect': (["*CAN'T*", 'CONNECT!'], 'down'),
    'pickOutput': (['PICK AN', '*OUTPUT*', 'FIRST!'], 'left'),
    'pickInput': (['NOW PICK', 'AN *INPUT!*'], 'left'),
    'hint': (['*GATES* ARE', 'IN HERE.'], 'lowleft'),
}
only = sys.argv[1:] or list(PHRASES)
out = ['// Fixed UI phrases lettered in Anime Ace 3 BB (Blambot, Nate Piekos), outlined to SVG paths with fontTools like',
       '// hintLettering.js. The font file is never shipped or loaded as a webfont. Units = u; cap 12u; leading 1.28 cap.',
       '// Balloon: 2:1 ellipse around the text + curved tail; the TAIL TIP is at (0, 0), so the balloon is placed by its tip.',
       f'export const SAY_INK = {r(INK)}; export const SAY_REST_STROKE = {REST_STROKE:.2f};',
       'export const SAY = {']
for key in only:
    lines, tail = PHRASES[key]
    w, h, e, rs = draw(lines)
    d, rx, ry, tip = balloon(w, h, tail)
    box = [-rx - 3 * CAP, -ry - INK, 2 * rx + 4.5 * CAP, 2 * ry + 2 * CAP + 2 * INK]
    out.append(f"  {key}: {{ text: {json.dumps(' '.join(lines).replace('*', ''))}, tip: [{r(tip[0])}, {r(tip[1])}], view: [{', '.join(r(v) for v in box)}],")
    out.append(f"    balloon: '{d}',")
    out.append(f"    emph: '{e}',")
    out.append(f"    rest: '{rs}' }},")
out.append('};')
print('\n'.join(out))
