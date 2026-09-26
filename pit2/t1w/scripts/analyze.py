#!/usr/bin/env python3
"""Pillow pixel-scan + tesseract OCR evidence for pit2/t1w-d.

Usage: analyze.py <shots_dir> <out_md_path>
"""
import sys, os, glob, json, statistics
from collections import Counter
from PIL import Image
import pytesseract

shots_dir, out_md = sys.argv[1], sys.argv[2]

PAPER = (255, 255, 255)
INK = (17, 17, 17)      # --ink #111111
ONE = (255, 90, 31)     # --one #ff5a1f
TOL = 30

def near(px, target):
    return all(abs(px[i] - target[i]) <= TOL for i in range(3))

def runs_along(img, fixed, lo, hi, target, vertical):
    px = img.load()
    runs, in_run, start = [], False, 0
    for v in range(lo, hi):
        p = px[fixed, v] if vertical else px[v, fixed]
        hit = near(p, target)
        if hit and not in_run:
            in_run, start = True, v
        elif not hit and in_run:
            in_run = False
            runs.append(v - start)
    if in_run:
        runs.append(hi - start)
    return runs

def frame_rule_px(img):
    # Outer frame border: .frame { border: var(--rule) solid var(--ink) } — scan down the left edge.
    w, h = img.size
    runs = runs_along(img, 1, 0, min(40, h), INK, vertical=True)
    return runs[0] if runs else None

def stroke_mode(img, rows_or_cols, vertical, target, lo, hi):
    lens = []
    for fixed in rows_or_cols:
        lens.extend(runs_along(img, fixed, lo, hi, target, vertical))
    lens = [n for n in lens if 1 <= n <= 12]  # plausible stroke widths only, drop long fills/borders
    if not lens:
        return {'n': 0}
    c = Counter(lens)
    mode, count = c.most_common(1)[0]
    return {'n': len(lens), 'mode_px': mode, 'mean_px': round(statistics.mean(lens), 2),
            'histogram': dict(sorted(c.items()))}

def measure(path):
    img = Image.open(path).convert('RGB')
    w, h = img.size
    cy0, cy1 = int(h * 0.34), int(h * 0.86)  # the canvas band (row 02), avoids header/table text
    cx0, cx1 = 0, int(w * 0.66)
    out = {}
    out['frame_rule_px'] = frame_rule_px(img)
    # Ink outline/wire stroke: sample several vertical scanlines across the canvas band for INK runs.
    xs = [cx0 + int((cx1 - cx0) * f) for f in (0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9)]
    out['ink_stroke_vertical'] = stroke_mode(img, xs, True, INK, cy0, cy1)
    ys = [cy0 + int((cy1 - cy0) * f) for f in (0.15, 0.3, 0.45, 0.6, 0.75, 0.9)]
    out['ink_stroke_horizontal'] = stroke_mode(img, ys, False, INK, cx0, cx1)
    # Orange wire/inset stroke where it runs as a thin line (not a filled body) — same scanlines.
    out['orange_stroke_vertical'] = stroke_mode(img, xs, True, ONE, cy0, cy1)
    img.close()
    return out

def ocr(path):
    img = Image.open(path)
    data = pytesseract.image_to_data(img, output_type=pytesseract.Output.DICT)
    words = [(t, float(c)) for t, c in zip(data['text'], data['conf']) if t.strip() and float(c) >= 0]
    mean_conf = round(sum(c for _, c in words) / len(words), 1) if words else 0
    text = ' '.join(t for t, _ in words)
    key_terms = ['Figur', 'CIRCUIT', 'EDITOR', 'TRUTH', 'TABLE']
    found = {k: (k in text or k.upper() in text.upper()) for k in key_terms}
    img.close()
    return {'n_words': len(words), 'mean_conf': mean_conf, 'found': found, 'sample': text[:160]}

files = sorted(glob.glob(os.path.join(shots_dir, 'd-*.png'))) + sorted(glob.glob(os.path.join(shots_dir, 'orig-*.png')))
rows = []
for path in files:
    name = os.path.basename(path)
    try:
        m = measure(path)
    except Exception as e:
        m = {'error': str(e)}
    try:
        o = ocr(path)
    except Exception as e:
        o = {'error': str(e)}
    rows.append({'file': name, 'measure': m, 'ocr': o})
    print(name, 'rule=', m.get('frame_rule_px'), 'ink_v_mode=', m.get('ink_stroke_vertical', {}).get('mode_px'),
          'ocr_words=', o.get('n_words'), 'ocr_conf=', o.get('mean_conf'))

with open(out_md, 'w') as f:
    f.write('# pit2/t1w-d — Kerney matrix evidence (Pillow + tesseract)\n\n')
    f.write('Method: every screenshot below is from a scripted **dogfood** run (real palette drags, real\n')
    f.write('keyboard wiring via focused-port Enter, real switch clicks, real wheel-zoom — see\n')
    f.write('`dogfood.mjs`, not an injected circuit). The scene: AND (default) + OR + XOR + NOT + NAND +\n')
    f.write('NOR + 6 lamps + 3 switches, wired with several crossings. `d-*` = pit2/t1w-d (STROKE 3,\n')
    f.write('screen px = 3 * userZoom^0.3); `orig-*` = the same scripted scene on the base branch\n')
    f.write('(STROKE 6, constant screen px) for comparison.\n\n')
    f.write('**Pillow method**: for each PNG, `frame_rule_px` scans the page\'s outer `.frame` border\n')
    f.write('(page grid, independent of canvas zoom) top-to-bottom for its ink run length. The ink/orange\n')
    f.write('stroke numbers scan 9 vertical + 6 horizontal lines through the canvas band and take the\n')
    f.write('**mode** of every 1-12px ink (or orange) run found — this is the on-screen line weight of\n')
    f.write('outlines and wires as actually painted, antialiasing included (so the true CSS value is\n')
    f.write('usually mode-1 to mode; Chromium blurs a sub-pixel stroke edge over an extra ~1px).\n\n')
    f.write('**OCR method**: tesseract 5.3.4 via pytesseract on the full frame; `found` checks the 5\n')
    f.write('landmark strings (wordmark, lockup, table heading) are recognized at all, `n_words`/`mean_conf`\n')
    f.write('flag wholesale clipping or overlap (a badly clipped/overlapped page reads far fewer words at\n')
    f.write('much lower confidence than an intact one).\n\n')
    f.write('| file | frame rule px | ink stroke mode (v/h) | orange stroke mode (v) | OCR words | OCR mean conf | landmarks found |\n')
    f.write('|---|---|---|---|---|---|---|\n')
    for r in rows:
        m, o = r['measure'], r['ocr']
        iv = m.get('ink_stroke_vertical', {}).get('mode_px', '-')
        ih = m.get('ink_stroke_horizontal', {}).get('mode_px', '-')
        ov = m.get('orange_stroke_vertical', {}).get('mode_px', '-')
        found = o.get('found', {})
        landmarks = ', '.join(k for k, v in found.items() if v) or 'NONE FOUND'
        missing = [k for k, v in found.items() if not v]
        if missing:
            landmarks += f" (MISSING: {', '.join(missing)})"
        f.write(f"| {r['file']} | {m.get('frame_rule_px','-')} | {iv} / {ih} | {ov} | "
                f"{o.get('n_words','-')} | {o.get('mean_conf','-')} | {landmarks} |\n")
    f.write('\n## Raw histograms (sample rows, for spot-checking anti-aliasing spread)\n\n')
    for r in rows:
        f.write(f"### {r['file']}\n\n")
        f.write(f"- ink vertical: `{json.dumps(r['measure'].get('ink_stroke_vertical', {}))}`\n")
        f.write(f"- ink horizontal: `{json.dumps(r['measure'].get('ink_stroke_horizontal', {}))}`\n")
        f.write(f"- orange vertical: `{json.dumps(r['measure'].get('orange_stroke_vertical', {}))}`\n")
        f.write(f"- OCR sample text: {r['ocr'].get('sample','')!r}\n\n")

print('wrote', out_md, 'rows', len(rows))
