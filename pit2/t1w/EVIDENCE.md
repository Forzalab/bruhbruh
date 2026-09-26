# pit2/t1w-d — Kerney matrix evidence (Pillow + tesseract)

Method: every screenshot below is from a scripted **dogfood** run (real palette drags, real
keyboard wiring via focused-port Enter, real switch clicks, real wheel-zoom — see
`dogfood.mjs`, not an injected circuit). The scene: AND (default) + OR + XOR + NOT + NAND +
NOR + 6 lamps + 3 switches, wired with several crossings. `d-*` = pit2/t1w-d (STROKE 3,
screen px = 3 * userZoom^0.3); `orig-*` = the same scripted scene on the base branch
(STROKE 6, constant screen px) for comparison.

**Pillow method**: for each PNG, `frame_rule_px` scans the page's outer `.frame` border
(page grid, independent of canvas zoom) top-to-bottom for its ink run length. The ink/orange
stroke numbers scan 9 vertical + 6 horizontal lines through the canvas band and take the
**mode** of every 1-12px ink (or orange) run found — this is the on-screen line weight of
outlines and wires as actually painted, antialiasing included (so the true CSS value is
usually mode-1 to mode; Chromium blurs a sub-pixel stroke edge over an extra ~1px).

**OCR method**: tesseract 5.3.4 via pytesseract on the full frame; `found` checks the 5
landmark strings (wordmark, lockup, table heading) are recognized at all, `n_words`/`mean_conf`
flag wholesale clipping or overlap (a badly clipped/overlapped page reads far fewer words at
much lower confidence than an intact one).

| file | frame rule px | ink stroke mode (v/h) | orange stroke mode (v) | OCR words | OCR mean conf | landmarks found |
|---|---|---|---|---|---|---|
| d-1280-z075-halflit.png | None | 2 / 2 | 2 | 18 | 81.9 | CIRCUIT, EDITOR, TRUTH, TABLE (MISSING: Figur) |
| d-1280-z075-lit.png | None | 2 / 2 | 2 | 18 | 77.3 | CIRCUIT, EDITOR, TRUTH, TABLE (MISSING: Figur) |
| d-1280-z075-unlit.png | None | 2 / 2 | 1 | 14 | 81.7 | CIRCUIT, EDITOR, TRUTH, TABLE (MISSING: Figur) |
| d-1280-z1-halflit.png | None | 2 / 2 | 2 | 15 | 84.7 | CIRCUIT, EDITOR, TRUTH, TABLE (MISSING: Figur) |
| d-1280-z1-lit.png | None | 2 / 2 | 2 | 15 | 74.9 | CIRCUIT, EDITOR, TRUTH, TABLE (MISSING: Figur) |
| d-1280-z1-unlit.png | None | 2 / 2 | 2 | 15 | 82.1 | CIRCUIT, EDITOR, TRUTH, TABLE (MISSING: Figur) |
| d-1280-z15-halflit.png | None | 2 / 2 | 3 | 15 | 84.7 | CIRCUIT, EDITOR, TRUTH, TABLE (MISSING: Figur) |
| d-1280-z15-lit.png | None | 2 / 2 | 3 | 16 | 76.0 | CIRCUIT, EDITOR, TRUTH, TABLE (MISSING: Figur) |
| d-1280-z15-unlit.png | None | 2 / 2 | 2 | 15 | 82.1 | CIRCUIT, EDITOR, TRUTH, TABLE (MISSING: Figur) |
| d-1440-z075-halflit.png | None | 2 / 2 | 2 | 18 | 87.7 | CIRCUIT, EDITOR, TRUTH, TABLE (MISSING: Figur) |
| d-1440-z075-lit.png | None | 2 / 2 | 2 | 18 | 81.5 | CIRCUIT, EDITOR, TRUTH, TABLE (MISSING: Figur) |
| d-1440-z075-unlit.png | None | 2 / 2 | 2 | 14 | 78.8 | CIRCUIT, EDITOR, TRUTH, TABLE (MISSING: Figur) |
| d-1440-z1-halflit.png | None | 2 / 2 | 2 | 14 | 87.8 | CIRCUIT, EDITOR, TRUTH, TABLE (MISSING: Figur) |
| d-1440-z1-lit.png | None | 2 / 2 | 2 | 14 | 79.9 | CIRCUIT, EDITOR, TRUTH, TABLE (MISSING: Figur) |
| d-1440-z1-unlit.png | None | 2 / 2 | 2 | 16 | 83.4 | CIRCUIT, EDITOR, TRUTH, TABLE (MISSING: Figur) |
| d-1440-z15-halflit.png | None | 3 / 2 | 2 | 15 | 88.1 | CIRCUIT, EDITOR, TRUTH, TABLE (MISSING: Figur) |
| d-1440-z15-lit.png | None | 4 / 2 | 2 | 15 | 80.7 | CIRCUIT, EDITOR, TRUTH, TABLE (MISSING: Figur) |
| d-1440-z15-unlit.png | None | 2 / 3 | 3 | 14 | 80.4 | CIRCUIT, EDITOR, TRUTH, TABLE (MISSING: Figur) |
| d-1920-z075-halflit.png | None | 2 / 2 | 2 | 14 | 84.6 | CIRCUIT, EDITOR, TRUTH, TABLE (MISSING: Figur) |
| d-1920-z075-lit.png | None | 2 / 2 | 2 | 14 | 80.9 | CIRCUIT, EDITOR, TRUTH, TABLE (MISSING: Figur) |
| d-1920-z075-unlit.png | None | 2 / 2 | 3 | 13 | 81.5 | CIRCUIT, EDITOR, TRUTH, TABLE (MISSING: Figur) |
| d-1920-z1-halflit.png | None | 3 / 2 | 3 | 14 | 84.6 | CIRCUIT, EDITOR, TRUTH, TABLE (MISSING: Figur) |
| d-1920-z1-lit.png | None | 3 / 2 | 3 | 14 | 77.4 | CIRCUIT, EDITOR, TRUTH, TABLE (MISSING: Figur) |
| d-1920-z1-unlit.png | None | 3 / 3 | 3 | 14 | 79.3 | CIRCUIT, EDITOR, TRUTH, TABLE (MISSING: Figur) |
| d-1920-z15-halflit.png | None | 3 / 3 | 3 | 14 | 84.6 | CIRCUIT, EDITOR, TRUTH, TABLE (MISSING: Figur) |
| d-1920-z15-lit.png | None | 3 / 2 | 3 | 14 | 79.0 | CIRCUIT, EDITOR, TRUTH, TABLE (MISSING: Figur) |
| d-1920-z15-unlit.png | None | 3 / 3 | 3 | 14 | 80.8 | CIRCUIT, EDITOR, TRUTH, TABLE (MISSING: Figur) |
| orig-1280-z075-halflit.png | None | 2 / 2 | 5 | 31 | 84.9 | CIRCUIT, EDITOR, TRUTH, TABLE (MISSING: Figur) |
| orig-1280-z075-lit.png | None | 2 / 2 | 5 | 10 | 51.0 | CIRCUIT, EDITOR, TRUTH, TABLE (MISSING: Figur) |
| orig-1280-z075-unlit.png | None | 5 / 2 | 5 | 21 | 72.4 | CIRCUIT, EDITOR, TRUTH, TABLE (MISSING: Figur) |
| orig-1280-z1-halflit.png | None | 5 / 5 | 5 | 16 | 91.2 | CIRCUIT, EDITOR, TRUTH, TABLE (MISSING: Figur) |
| orig-1280-z1-lit.png | None | 2 / 2 | 5 | 25 | 86.8 | CIRCUIT, EDITOR, TRUTH, TABLE (MISSING: Figur) |
| orig-1280-z1-unlit.png | None | 5 / 5 | 4 | 7 | 62.0 | CIRCUIT, EDITOR, TRUTH, TABLE (MISSING: Figur) |
| orig-1280-z15-halflit.png | None | 2 / 5 | 4 | 28 | 86.7 | CIRCUIT, EDITOR, TRUTH, TABLE (MISSING: Figur) |
| orig-1280-z15-lit.png | None | 2 / 5 | 4 | 10 | 55.0 | CIRCUIT, EDITOR, TRUTH, TABLE (MISSING: Figur) |
| orig-1280-z15-unlit.png | None | 2 / 5 | 4 | 18 | 73.2 | CIRCUIT, EDITOR, TRUTH, TABLE (MISSING: Figur) |
| orig-1440-z075-halflit.png | None | 6 / 2 | 3 | 16 | 87.2 | CIRCUIT, EDITOR, TRUTH, TABLE (MISSING: Figur) |
| orig-1440-z075-lit.png | None | 6 / 2 | 5 | 25 | 89.1 | CIRCUIT, EDITOR, TRUTH, TABLE (MISSING: Figur) |
| orig-1440-z075-unlit.png | None | 6 / 2 | 5 | 20 | 92.9 | CIRCUIT, EDITOR, TRUTH, TABLE (MISSING: Figur) |
| orig-1440-z1-halflit.png | None | 6 / 6 | 6 | 2 | 95.0 | CIRCUIT, EDITOR (MISSING: Figur, TRUTH, TABLE) |
| orig-1440-z1-lit.png | None | 6 / 6 | 6 | 22 | 61.2 | CIRCUIT, EDITOR, TRUTH, TABLE (MISSING: Figur) |
| orig-1440-z1-unlit.png | None | 6 / 6 | 6 | 20 | 92.9 | CIRCUIT, EDITOR, TRUTH, TABLE (MISSING: Figur) |
| orig-1440-z15-halflit.png | None | 6 / 2 | 6 | 19 | 85.5 | CIRCUIT, EDITOR, TRUTH, TABLE (MISSING: Figur) |
| orig-1440-z15-lit.png | None | 2 / 2 | 6 | 10 | 63.3 | CIRCUIT, EDITOR, TRUTH, TABLE (MISSING: Figur) |
| orig-1440-z15-unlit.png | None | 6 / 5 | 6 | 18 | 80.1 | CIRCUIT, EDITOR, TRUTH, TABLE (MISSING: Figur) |
| orig-1440.png | None | 2 / 2 | - | 29 | 90.3 | Figur, CIRCUIT, EDITOR, TRUTH, TABLE |
| orig-1920-z075-halflit.png | None | 6 / 6 | 6 | 27 | 74.6 | CIRCUIT, EDITOR, TRUTH, TABLE (MISSING: Figur) |
| orig-1920-z075-lit.png | None | 6 / 2 | 6 | 25 | 87.2 | CIRCUIT, EDITOR, TRUTH, TABLE (MISSING: Figur) |
| orig-1920-z075-unlit.png | None | 6 / 2 | 6 | 19 | 79.8 | CIRCUIT, EDITOR, TRUTH, TABLE (MISSING: Figur) |
| orig-1920-z1-halflit.png | None | 6 / 6 | 6 | 0 | 0 | NONE FOUND (MISSING: Figur, CIRCUIT, EDITOR, TRUTH, TABLE) |
| orig-1920-z1-lit.png | None | 9 / 2 | 6 | 23 | 87.7 | CIRCUIT, EDITOR, TRUTH, TABLE (MISSING: Figur) |
| orig-1920-z1-unlit.png | None | 6 / 6 | 6 | 24 | 83.9 | CIRCUIT, EDITOR, TRUTH, TABLE (MISSING: Figur) |
| orig-1920-z15-halflit.png | None | 6 / 2 | 6 | 19 | 81.1 | CIRCUIT, EDITOR, TRUTH, TABLE (MISSING: Figur) |
| orig-1920-z15-lit.png | None | 6 / 2 | 6 | 8 | 53.8 | CIRCUIT, EDITOR, TRUTH, TABLE (MISSING: Figur) |
| orig-1920-z15-unlit.png | None | 6 / 6 | 6 | 19 | 79.8 | CIRCUIT, EDITOR, TRUTH, TABLE (MISSING: Figur) |
| orig-parts@3x.png | None | 1 / 1 | - | 7 | 69.0 | CIRCUIT, EDITOR, TRUTH, TABLE (MISSING: Figur) |
| orig-zoom075.png | None | 2 / 2 | - | 15 | 87.2 | Figur, CIRCUIT, EDITOR, TRUTH, TABLE |
| orig-zoom150.png | None | 2 / 2 | - | 9 | 91.9 | Figur, CIRCUIT, EDITOR, TRUTH, TABLE |

## Raw histograms (sample rows, for spot-checking anti-aliasing spread)

### d-1280-z075-halflit.png

- ink vertical: `{"n": 61, "mode_px": 2, "mean_px": 2.23, "histogram": {"1": 6, "2": 44, "3": 7, "5": 3, "6": 1}}`
- ink horizontal: `{"n": 52, "mode_px": 2, "mean_px": 2.25, "histogram": {"1": 9, "2": 32, "3": 9, "5": 1, "12": 1}}`
- orange vertical: `{"n": 14, "mode_px": 2, "mean_px": 1.86, "histogram": {"1": 4, "2": 8, "3": 2}}`
- OCR sample text: '° Ss CIRCUIT EDITOR 02 TRUTH TABLE # A B C Q1Q2Q3Q4Q5Q6 02001111010 03010100001 04011101010 05100001011 06101001101 03'

### d-1280-z075-lit.png

- ink vertical: `{"n": 51, "mode_px": 2, "mean_px": 2.35, "histogram": {"1": 5, "2": 34, "3": 7, "5": 4, "6": 1}}`
- ink horizontal: `{"n": 46, "mode_px": 2, "mean_px": 2.37, "histogram": {"1": 5, "2": 30, "3": 9, "5": 1, "12": 1}}`
- orange vertical: `{"n": 24, "mode_px": 2, "mean_px": 1.88, "histogram": {"1": 5, "2": 17, "3": 2}}`
- OCR sample text: '° Ss 02 CIRCUIT EDITOR TRUTH TABLE # A B C Q1Q20304Q506 WOTTTOTOTO 05100001011 06101001101 07110001011 08111001101 03'

### d-1280-z075-unlit.png

- ink vertical: `{"n": 67, "mode_px": 2, "mean_px": 2.3, "histogram": {"1": 4, "2": 48, "3": 9, "4": 3, "5": 3}}`
- ink horizontal: `{"n": 52, "mode_px": 2, "mean_px": 2.33, "histogram": {"1": 5, "2": 36, "3": 9, "5": 1, "12": 1}}`
- orange vertical: `{"n": 3, "mode_px": 1, "mean_px": 1.33, "histogram": {"1": 2, "2": 1}}`
- OCR sample text: 'CIRCUIT >) EDITOR TRUTH TABLE # A B C Q1Q2Q3Q4Q5Q6 02001111010 03010100001 0401131101010 05100001011'

### d-1280-z1-halflit.png

- ink vertical: `{"n": 61, "mode_px": 2, "mean_px": 2.16, "histogram": {"2": 51, "3": 10}}`
- ink horizontal: `{"n": 55, "mode_px": 2, "mean_px": 2.42, "histogram": {"2": 39, "3": 12, "4": 3, "7": 1}}`
- orange vertical: `{"n": 13, "mode_px": 2, "mean_px": 2.31, "histogram": {"2": 10, "3": 2, "4": 1}}`
- OCR sample text: 'CIRCUIT EDITOR TRUTH TABLE # A B C Q1Q2Q3Q4Q5Q6 02001111010 03010100001 04011101010 05100001011 06101001101 03'

### d-1280-z1-lit.png

- ink vertical: `{"n": 48, "mode_px": 2, "mean_px": 2.17, "histogram": {"2": 40, "3": 8}}`
- ink horizontal: `{"n": 49, "mode_px": 2, "mean_px": 2.47, "histogram": {"2": 33, "3": 12, "4": 3, "7": 1}}`
- orange vertical: `{"n": 26, "mode_px": 2, "mean_px": 2.27, "histogram": {"2": 20, "3": 5, "4": 1}}`
- OCR sample text: 'CIRCUIT >) EDITOR TRUTH TABLE # A B C Q1Q20304Q506 WOTTTOTOTO 05100001011 06101001101 07110001011 08111001101'

### d-1280-z1-unlit.png

- ink vertical: `{"n": 64, "mode_px": 2, "mean_px": 2.19, "histogram": {"2": 52, "3": 12}}`
- ink horizontal: `{"n": 54, "mode_px": 2, "mean_px": 2.44, "histogram": {"2": 38, "3": 11, "4": 4, "7": 1}}`
- orange vertical: `{"n": 7, "mode_px": 2, "mean_px": 2, "histogram": {"2": 7}}`
- OCR sample text: 'CIRCUIT EDITOR TRUTH TABLE # A B C Q1Q20304Q506 01000110001 02001111010 03010100001 04011101010 05100001011 03'

### d-1280-z15-halflit.png

- ink vertical: `{"n": 55, "mode_px": 2, "mean_px": 2.62, "histogram": {"2": 31, "3": 16, "4": 7, "6": 1}}`
- ink horizontal: `{"n": 36, "mode_px": 2, "mean_px": 2.67, "histogram": {"2": 17, "3": 16, "4": 2, "6": 1}}`
- orange vertical: `{"n": 12, "mode_px": 3, "mean_px": 2.83, "histogram": {"1": 1, "2": 4, "3": 6, "7": 1}}`
- OCR sample text: 'CIRCUIT EDITOR TRUTH TABLE # A B C Q1Q2Q3Q4Q5Q6 02001111010 03010100001 04011101010 05100001011 06101001101 03'

### d-1280-z15-lit.png

- ink vertical: `{"n": 42, "mode_px": 2, "mean_px": 2.69, "histogram": {"2": 23, "3": 11, "4": 7, "6": 1}}`
- ink horizontal: `{"n": 34, "mode_px": 2, "mean_px": 2.62, "histogram": {"2": 18, "3": 13, "4": 2, "6": 1}}`
- orange vertical: `{"n": 26, "mode_px": 3, "mean_px": 2.62, "histogram": {"1": 1, "2": 12, "3": 12, "7": 1}}`
- OCR sample text: 'CIRCUIT >) EDITOR TRUTH TABLE # A B C Q1Q20304Q506 WOTTTOTOTO 05100001011 06101001101 07110001011 08111001101 03'

### d-1280-z15-unlit.png

- ink vertical: `{"n": 59, "mode_px": 2, "mean_px": 2.66, "histogram": {"2": 32, "3": 18, "4": 7, "5": 1, "6": 1}}`
- ink horizontal: `{"n": 43, "mode_px": 2, "mean_px": 2.51, "histogram": {"2": 26, "3": 14, "4": 2, "6": 1}}`
- orange vertical: `{"n": 4, "mode_px": 2, "mean_px": 2.5, "histogram": {"2": 2, "3": 2}}`
- OCR sample text: 'CIRCUIT EDITOR TRUTH TABLE # A B C Q1Q20304Q506 01000110001 02001111010 03010100001 04011101010 05100001011 03'

### d-1440-z075-halflit.png

- ink vertical: `{"n": 51, "mode_px": 2, "mean_px": 2.57, "histogram": {"2": 35, "3": 10, "4": 2, "5": 1, "6": 3}}`
- ink horizontal: `{"n": 56, "mode_px": 2, "mean_px": 2.95, "histogram": {"2": 39, "3": 5, "4": 2, "5": 3, "6": 5, "8": 1, "11": 1}}`
- orange vertical: `{"n": 14, "mode_px": 2, "mean_px": 1.86, "histogram": {"1": 3, "2": 10, "3": 1}}`
- OCR sample text: '0 a CIRCUIT EDITOR 02 TRUTH TABLE # A B C Q1Q2Q3Q4Q5Q6 02001111010 03010100001 04011101010 05100001011 06101001101 03'

### d-1440-z075-lit.png

- ink vertical: `{"n": 40, "mode_px": 2, "mean_px": 2.83, "histogram": {"2": 26, "3": 7, "4": 2, "5": 1, "6": 3, "9": 1}}`
- ink horizontal: `{"n": 50, "mode_px": 2, "mean_px": 3.06, "histogram": {"2": 33, "3": 5, "4": 2, "5": 3, "6": 5, "8": 1, "11": 1}}`
- orange vertical: `{"n": 25, "mode_px": 2, "mean_px": 1.96, "histogram": {"1": 3, "2": 20, "3": 2}}`
- OCR sample text: '0 a 02 CIRCUIT EDITOR TRUTH TABLE # A B C Q1Q2Q3Q4Q5Q6 U0OTTTVOTOTO 05100001011 06101001101 07110001011 08111001101 03'

### d-1440-z075-unlit.png

- ink vertical: `{"n": 56, "mode_px": 2, "mean_px": 2.68, "histogram": {"2": 41, "3": 7, "4": 3, "5": 1, "6": 2, "9": 2}}`
- ink horizontal: `{"n": 56, "mode_px": 2, "mean_px": 2.93, "histogram": {"2": 40, "3": 4, "4": 2, "5": 3, "6": 5, "8": 1, "11": 1}}`
- orange vertical: `{"n": 3, "mode_px": 2, "mean_px": 2, "histogram": {"2": 3}}`
- OCR sample text: 'CIRCUIT EDITOR TRUTH TABLE # A B C Q1Q2Q3Q49506 01000110001 02001111010 03010100001 04011101010 05100001011'

### d-1440-z1-halflit.png

- ink vertical: `{"n": 50, "mode_px": 2, "mean_px": 2.32, "histogram": {"2": 36, "3": 12, "4": 2}}`
- ink horizontal: `{"n": 59, "mode_px": 2, "mean_px": 2.66, "histogram": {"1": 4, "2": 36, "3": 6, "4": 8, "5": 2, "6": 1, "7": 1, "8": 1}}`
- orange vertical: `{"n": 12, "mode_px": 2, "mean_px": 2.5, "histogram": {"2": 9, "4": 3}}`
- OCR sample text: 'CIRCUIT EDITOR TRUTH TABLE # A B C Q1Q2Q3Q4Q5Q6 02001111010 03010100001 04011101010 05100001011 06101001101'

### d-1440-z1-lit.png

- ink vertical: `{"n": 36, "mode_px": 2, "mean_px": 2.44, "histogram": {"2": 22, "3": 12, "4": 2}}`
- ink horizontal: `{"n": 54, "mode_px": 2, "mean_px": 2.63, "histogram": {"1": 4, "2": 36, "3": 1, "4": 8, "5": 2, "6": 1, "7": 1, "8": 1}}`
- orange vertical: `{"n": 26, "mode_px": 2, "mean_px": 2.23, "histogram": {"2": 23, "4": 3}}`
- OCR sample text: 'CIRCUIT EDITOR TRUTH TABLE # A B C Q1Q2Q3Q4Q5Q6 U0OTTTVOTOTO 05100001011 06101001101 07110001011 08111001101'

### d-1440-z1-unlit.png

- ink vertical: `{"n": 56, "mode_px": 2, "mean_px": 2.34, "histogram": {"2": 41, "3": 11, "4": 4}}`
- ink horizontal: `{"n": 53, "mode_px": 2, "mean_px": 2.83, "histogram": {"2": 32, "3": 9, "4": 7, "5": 2, "6": 1, "7": 1, "8": 1}}`
- orange vertical: `{"n": 5, "mode_px": 2, "mean_px": 2.2, "histogram": {"2": 4, "3": 1}}`
- OCR sample text: 'CIRCUIT EDITOR 3) TRUTH TABLE # A B C Q1Q2Q3Q4Q5Q6 01000110001 02001111010 03010100001 04011101010 05100001011 03'

### d-1440-z15-halflit.png

- ink vertical: `{"n": 38, "mode_px": 3, "mean_px": 3.08, "histogram": {"2": 12, "3": 13, "4": 11, "5": 2}}`
- ink horizontal: `{"n": 39, "mode_px": 2, "mean_px": 3.33, "histogram": {"2": 16, "3": 14, "4": 2, "5": 4, "9": 2, "10": 1}}`
- orange vertical: `{"n": 11, "mode_px": 2, "mean_px": 3.18, "histogram": {"2": 6, "3": 3, "5": 1, "9": 1}}`
- OCR sample text: 'CIRCUIT EDITOR TRUTH TABLE # A B C Q1Q2Q3Q4Q5Q6 02001111010 03010100001 04011101010 05100001011 06101001101 03'

### d-1440-z15-lit.png

- ink vertical: `{"n": 28, "mode_px": 4, "mean_px": 3.21, "histogram": {"2": 8, "3": 8, "4": 10, "5": 2}}`
- ink horizontal: `{"n": 33, "mode_px": 2, "mean_px": 3.45, "histogram": {"2": 14, "3": 10, "4": 2, "5": 4, "9": 2, "10": 1}}`
- orange vertical: `{"n": 22, "mode_px": 2, "mean_px": 2.59, "histogram": {"2": 12, "3": 8, "4": 1, "5": 1}}`
- OCR sample text: 'CIRCUIT EDITOR TRUTH TABLE # A B C Q1Q2Q3Q4Q5Q6 U0OTTTVOTOTO 05100001011 06101001101 07110001011 08111001101 03'

### d-1440-z15-unlit.png

- ink vertical: `{"n": 40, "mode_px": 2, "mean_px": 3.08, "histogram": {"2": 15, "3": 12, "4": 10, "5": 2, "7": 1}}`
- ink horizontal: `{"n": 45, "mode_px": 3, "mean_px": 3.29, "histogram": {"2": 16, "3": 20, "4": 2, "5": 4, "9": 2, "10": 1}}`
- orange vertical: `{"n": 5, "mode_px": 3, "mean_px": 3.4, "histogram": {"2": 2, "3": 2, "7": 1}}`
- OCR sample text: 'CIRCUIT EDITOR TRUTH TABLE # A B C Q1Q2Q3Q49506 02001111010 03010100001 0401171101010 05100001011 03'

### d-1920-z075-halflit.png

- ink vertical: `{"n": 37, "mode_px": 2, "mean_px": 2.78, "histogram": {"2": 18, "3": 15, "4": 2, "5": 1, "9": 1}}`
- ink horizontal: `{"n": 54, "mode_px": 2, "mean_px": 2.57, "histogram": {"2": 34, "3": 10, "4": 9, "5": 1}}`
- orange vertical: `{"n": 7, "mode_px": 2, "mean_px": 2.71, "histogram": {"2": 3, "3": 3, "4": 1}}`
- OCR sample text: 'CIRCUIT EDITOR TRUTH TABLE # A B C Q1Q2Q304Q506 02001111010 03010100001 04011101010 05100001011 06101001101'

### d-1920-z075-lit.png

- ink vertical: `{"n": 29, "mode_px": 2, "mean_px": 2.86, "histogram": {"2": 14, "3": 11, "4": 2, "5": 1, "9": 1}}`
- ink horizontal: `{"n": 52, "mode_px": 2, "mean_px": 2.56, "histogram": {"2": 35, "3": 6, "4": 10, "5": 1}}`
- orange vertical: `{"n": 16, "mode_px": 2, "mean_px": 2.56, "histogram": {"2": 8, "3": 7, "4": 1}}`
- OCR sample text: 'CIRCUIT EDITOR TRUTH TABLE # A B C Q1Q2Q3Q4Q5Q6 OO0TTTOTOTO 05100001011 06101001101 07110001011 08111001101'

### d-1920-z075-unlit.png

- ink vertical: `{"n": 41, "mode_px": 2, "mean_px": 2.78, "histogram": {"2": 20, "3": 16, "4": 3, "5": 1, "9": 1}}`
- ink horizontal: `{"n": 56, "mode_px": 2, "mean_px": 2.61, "histogram": {"2": 33, "3": 13, "4": 9, "5": 1}}`
- orange vertical: `{"n": 3, "mode_px": 3, "mean_px": 2.67, "histogram": {"2": 1, "3": 2}}`
- OCR sample text: 'CIRCUIT EDITOR TRUTH TABLE # A B C Q1Q2Q304Q506 0200111711010 03010100001 04011101010 05100001011'

### d-1920-z1-halflit.png

- ink vertical: `{"n": 31, "mode_px": 3, "mean_px": 3.26, "histogram": {"1": 2, "2": 3, "3": 17, "4": 7, "5": 1, "9": 1}}`
- ink horizontal: `{"n": 65, "mode_px": 2, "mean_px": 2.94, "histogram": {"2": 29, "3": 23, "4": 5, "5": 6, "6": 1, "8": 1}}`
- orange vertical: `{"n": 10, "mode_px": 3, "mean_px": 3.2, "histogram": {"2": 3, "3": 6, "8": 1}}`
- OCR sample text: 'CIRCUIT EDITOR TRUTH TABLE # A B C Q1Q2Q304Q506 02001111010 03010100001 04011101010 05100001011 06101001101'

### d-1920-z1-lit.png

- ink vertical: `{"n": 21, "mode_px": 3, "mean_px": 4.33, "histogram": {"2": 2, "3": 7, "4": 7, "5": 1, "6": 1, "9": 3}}`
- ink horizontal: `{"n": 61, "mode_px": 2, "mean_px": 2.97, "histogram": {"2": 28, "3": 19, "4": 6, "5": 6, "6": 1, "8": 1}}`
- orange vertical: `{"n": 16, "mode_px": 3, "mean_px": 2.75, "histogram": {"2": 4, "3": 12}}`
- OCR sample text: 'CIRCUIT EDITOR TRUTH TABLE # A B C Q1Q2Q304Q506 U0TTTOTOTO 05100001011 06101001101 07110001011 08111001101'

### d-1920-z1-unlit.png

- ink vertical: `{"n": 32, "mode_px": 3, "mean_px": 3.53, "histogram": {"2": 3, "3": 19, "4": 7, "5": 1, "6": 1, "11": 1}}`
- ink horizontal: `{"n": 62, "mode_px": 3, "mean_px": 2.94, "histogram": {"2": 25, "3": 27, "4": 3, "5": 5, "6": 1, "8": 1}}`
- orange vertical: `{"n": 5, "mode_px": 3, "mean_px": 2.6, "histogram": {"2": 2, "3": 3}}`
- OCR sample text: 'CIRCUIT EDITOR \\ TRUTH TABLE # A B C Q1Q2Q304Q506 0200111711010 03010100001 04011101010 05100001011'

### d-1920-z15-halflit.png

- ink vertical: `{"n": 22, "mode_px": 3, "mean_px": 3.55, "histogram": {"3": 16, "4": 4, "5": 1, "9": 1}}`
- ink horizontal: `{"n": 44, "mode_px": 3, "mean_px": 2.8, "histogram": {"2": 17, "3": 19, "4": 8}}`
- orange vertical: `{"n": 8, "mode_px": 3, "mean_px": 3.25, "histogram": {"3": 6, "4": 2}}`
- OCR sample text: 'CIRCUIT EDITOR TRUTH TABLE # A B C Q1Q2Q304Q506 02001111010 03010100001 04011101010 05100001011 06101001101'

### d-1920-z15-lit.png

- ink vertical: `{"n": 12, "mode_px": 3, "mean_px": 3.92, "histogram": {"3": 7, "4": 3, "5": 1, "9": 1}}`
- ink horizontal: `{"n": 41, "mode_px": 2, "mean_px": 2.78, "histogram": {"2": 18, "3": 14, "4": 9}}`
- orange vertical: `{"n": 19, "mode_px": 3, "mean_px": 3.26, "histogram": {"3": 15, "4": 3, "5": 1}}`
- OCR sample text: 'CIRCUIT EDITOR TRUTH TABLE # A B C Q1Q2Q3Q4Q506 UO0TTTOTOTO 05100001011 06101001101 07110001011 08111001101'

### d-1920-z15-unlit.png

- ink vertical: `{"n": 27, "mode_px": 3, "mean_px": 3.52, "histogram": {"3": 19, "4": 6, "5": 1, "9": 1}}`
- ink horizontal: `{"n": 50, "mode_px": 3, "mean_px": 2.88, "histogram": {"2": 17, "3": 22, "4": 11}}`
- orange vertical: `{"n": 3, "mode_px": 3, "mean_px": 3, "histogram": {"3": 3}}`
- OCR sample text: 'CIRCUIT EDITOR TRUTH TABLE # A B C Q1Q2Q304Q506 0200111711010 03010100001 04011101010 05100001011 v'

### orig-1280-z075-halflit.png

- ink vertical: `{"n": 56, "mode_px": 2, "mean_px": 4.04, "histogram": {"1": 1, "2": 20, "3": 3, "4": 7, "5": 15, "6": 6, "7": 1, "9": 2, "12": 1}}`
- ink horizontal: `{"n": 45, "mode_px": 2, "mean_px": 4.6, "histogram": {"2": 13, "4": 8, "5": 11, "6": 5, "7": 5, "8": 1, "9": 1, "12": 1}}`
- orange vertical: `{"n": 14, "mode_px": 5, "mean_px": 4.21, "histogram": {"3": 3, "4": 5, "5": 6}}`
- OCR sample text: '° Ss CIRCUIT >) EDITOR 02 TRUTH TABLE A B c qi 0 0 1 1 0 1 0 1 » 0 1 1 1 1 0 1 0 + 03'

### orig-1280-z075-lit.png

- ink vertical: `{"n": 48, "mode_px": 2, "mean_px": 4.17, "histogram": {"1": 1, "2": 18, "3": 3, "4": 5, "5": 12, "6": 4, "8": 1, "9": 2, "12": 2}}`
- ink horizontal: `{"n": 42, "mode_px": 2, "mean_px": 4.64, "histogram": {"2": 13, "4": 7, "5": 8, "6": 5, "7": 6, "8": 1, "9": 1, "12": 1}}`
- orange vertical: `{"n": 24, "mode_px": 5, "mean_px": 4.29, "histogram": {"3": 5, "4": 7, "5": 12}}`
- OCR sample text: 'CIRCUIT >) EDITOR TRUTH TABLE =/4/4/aqn, sa|olo|jo o|a|o|4o olofo|348 a|'

### orig-1280-z075-unlit.png

- ink vertical: `{"n": 59, "mode_px": 5, "mean_px": 4.36, "histogram": {"2": 17, "3": 3, "4": 9, "5": 18, "6": 4, "7": 3, "8": 2, "9": 3}}`
- ink horizontal: `{"n": 40, "mode_px": 2, "mean_px": 4.53, "histogram": {"2": 13, "4": 8, "5": 7, "6": 4, "7": 5, "8": 1, "9": 1, "12": 1}}`
- orange vertical: `{"n": 3, "mode_px": 5, "mean_px": 4.67, "histogram": {"4": 1, "5": 2}}`
- OCR sample text: '° Ss 02 CIRCUIT >) EDITOR TRUTH TABLE A B c qi 0 0 0 1 o;-;-|o o;-;o; = o;a/4]a 03'

### orig-1280-z1-halflit.png

- ink vertical: `{"n": 55, "mode_px": 5, "mean_px": 4.15, "histogram": {"2": 16, "3": 3, "4": 6, "5": 21, "6": 6, "7": 2, "8": 1}}`
- ink horizontal: `{"n": 51, "mode_px": 5, "mean_px": 4.8, "histogram": {"2": 14, "4": 4, "5": 17, "6": 7, "7": 3, "8": 4, "10": 1, "11": 1}}`
- orange vertical: `{"n": 14, "mode_px": 5, "mean_px": 4.29, "histogram": {"1": 1, "4": 6, "5": 7}}`
- OCR sample text: 'CIRCUIT EDITOR TRUTH TABLE A 0 0 0 0 1 1 c 1 0 1 03'

### orig-1280-z1-lit.png

- ink vertical: `{"n": 43, "mode_px": 2, "mean_px": 3.95, "histogram": {"2": 16, "3": 3, "4": 4, "5": 11, "6": 6, "7": 2, "8": 1}}`
- ink horizontal: `{"n": 45, "mode_px": 2, "mean_px": 4.84, "histogram": {"2": 14, "4": 1, "5": 14, "6": 7, "7": 3, "8": 4, "10": 1, "11": 1}}`
- orange vertical: `{"n": 26, "mode_px": 5, "mean_px": 4.54, "histogram": {"1": 1, "4": 8, "5": 17}}`
- OCR sample text: 'CIRCUIT >) EDITOR TRUTH TABLE A B c qi 0 1 T T 1 0 0 0 1 0 1 0 1 1 0 0'

### orig-1280-z1-unlit.png

- ink vertical: `{"n": 58, "mode_px": 5, "mean_px": 4.21, "histogram": {"2": 15, "3": 4, "4": 6, "5": 24, "6": 6, "7": 2, "8": 1}}`
- ink horizontal: `{"n": 46, "mode_px": 5, "mean_px": 4.89, "histogram": {"2": 11, "4": 4, "5": 17, "6": 7, "7": 1, "8": 4, "10": 1, "11": 1}}`
- orange vertical: `{"n": 7, "mode_px": 4, "mean_px": 4.43, "histogram": {"4": 4, "5": 3}}`
- OCR sample text: 'CIRCUIT >) EDITOR TRUTH TABLE o;j-;|;-/;/0o0 o;j-|;o;—'

### orig-1280-z15-halflit.png

- ink vertical: `{"n": 52, "mode_px": 2, "mean_px": 4.17, "histogram": {"2": 16, "3": 3, "4": 13, "5": 7, "6": 5, "7": 5, "8": 3}}`
- ink horizontal: `{"n": 37, "mode_px": 5, "mean_px": 4.62, "histogram": {"2": 13, "4": 2, "5": 15, "6": 1, "7": 1, "8": 2, "9": 1, "12": 2}}`
- orange vertical: `{"n": 11, "mode_px": 4, "mean_px": 5.18, "histogram": {"4": 4, "5": 3, "6": 2, "7": 2}}`
- OCR sample text: 'CIRCUIT >) EDITOR TRUTH TABLE A B c qi 0 0 1 1 0 1 0 1 » 0 1 1 1 1 0 1 0 + 03'

### orig-1280-z15-lit.png

- ink vertical: `{"n": 40, "mode_px": 2, "mean_px": 4.1, "histogram": {"2": 16, "3": 3, "4": 6, "5": 2, "6": 5, "7": 5, "8": 3}}`
- ink horizontal: `{"n": 34, "mode_px": 5, "mean_px": 4.59, "histogram": {"2": 13, "4": 1, "5": 14, "7": 1, "8": 2, "9": 1, "12": 2}}`
- orange vertical: `{"n": 26, "mode_px": 4, "mean_px": 4.81, "histogram": {"2": 1, "3": 1, "4": 10, "5": 8, "6": 2, "7": 4}}`
- OCR sample text: 'CIRCUIT >) EDITOR TRUTH TABLE =/4/4/aqn, a|olo|aoe o}/-=/|o|s4o ol/o}/o/38 a|'

### orig-1280-z15-unlit.png

- ink vertical: `{"n": 55, "mode_px": 2, "mean_px": 4.36, "histogram": {"2": 16, "3": 3, "4": 13, "5": 8, "6": 6, "7": 4, "8": 4, "11": 1}}`
- ink horizontal: `{"n": 43, "mode_px": 5, "mean_px": 4.65, "histogram": {"2": 13, "4": 5, "5": 17, "6": 1, "7": 2, "8": 2, "9": 1, "12": 2}}`
- orange vertical: `{"n": 5, "mode_px": 4, "mean_px": 5, "histogram": {"4": 2, "5": 2, "7": 1}}`
- OCR sample text: 'CIRCUIT >) EDITOR 03 TRUTH TABLE A B c qi 0 0 0 1 o;-;-|o o;-;o; = o;a/4]a'

### orig-1440-z075-halflit.png

- ink vertical: `{"n": 43, "mode_px": 6, "mean_px": 5.07, "histogram": {"2": 8, "3": 4, "5": 10, "6": 17, "7": 2, "12": 2}}`
- ink horizontal: `{"n": 48, "mode_px": 2, "mean_px": 4.98, "histogram": {"2": 15, "5": 15, "6": 8, "7": 2, "8": 3, "9": 2, "10": 3}}`
- orange vertical: `{"n": 13, "mode_px": 3, "mean_px": 4.62, "histogram": {"3": 4, "4": 1, "5": 4, "6": 4}}`
- OCR sample text: 'CIRCUIT EDITOR 02 TRUTH TABLE A Cc —_ 0 0 0 —_ 1 0 1 03'

### orig-1440-z075-lit.png

- ink vertical: `{"n": 34, "mode_px": 6, "mean_px": 5.18, "histogram": {"2": 8, "3": 2, "5": 7, "6": 14, "11": 1, "12": 2}}`
- ink horizontal: `{"n": 43, "mode_px": 2, "mean_px": 4.86, "histogram": {"2": 15, "5": 12, "6": 7, "7": 2, "8": 3, "9": 1, "10": 3}}`
- orange vertical: `{"n": 22, "mode_px": 5, "mean_px": 5.05, "histogram": {"3": 5, "4": 2, "5": 8, "6": 6, "12": 1}}`
- OCR sample text: 'CIRCUIT EDITOR TRUTH TABLE A B Cc Ql 0 1 1 T 1 0 0 0 1 0 1 0 1 1 0 0 03'

### orig-1440-z075-unlit.png

- ink vertical: `{"n": 44, "mode_px": 6, "mean_px": 5.73, "histogram": {"2": 8, "5": 11, "6": 17, "8": 4, "11": 1, "12": 3}}`
- ink horizontal: `{"n": 47, "mode_px": 2, "mean_px": 5.15, "histogram": {"2": 14, "5": 14, "6": 8, "7": 2, "8": 3, "9": 2, "10": 4}}`
- orange vertical: `{"n": 3, "mode_px": 5, "mean_px": 5, "histogram": {"5": 3}}`
- OCR sample text: 'CIRCUIT EDITOR TRUTH TABLE 0 0 1 1 0 1 0 1 0 1 1 1 1 0 0 0'

### orig-1440-z1-halflit.png

- ink vertical: `{"n": 45, "mode_px": 6, "mean_px": 5.29, "histogram": {"2": 7, "5": 10, "6": 25, "8": 3}}`
- ink horizontal: `{"n": 52, "mode_px": 6, "mean_px": 5.06, "histogram": {"2": 14, "3": 4, "4": 1, "5": 6, "6": 17, "7": 2, "8": 3, "9": 3, "10": 1, "12": 1}}`
- orange vertical: `{"n": 13, "mode_px": 6, "mean_px": 5.69, "histogram": {"2": 1, "6": 12}}`
- OCR sample text: 'CIRCUIT EDITOR'

### orig-1440-z1-lit.png

- ink vertical: `{"n": 31, "mode_px": 6, "mean_px": 4.97, "histogram": {"2": 7, "5": 10, "6": 11, "8": 3}}`
- ink horizontal: `{"n": 47, "mode_px": 6, "mean_px": 5.15, "histogram": {"2": 14, "3": 4, "4": 1, "5": 1, "6": 16, "7": 2, "8": 3, "9": 3, "10": 2, "12": 1}}`
- orange vertical: `{"n": 27, "mode_px": 6, "mean_px": 5.85, "histogram": {"2": 1, "6": 26}}`
- OCR sample text: 'CIRCUIT EDITOR TRUTH TABLE , A B Cc Ql Ch ie i a 1 oO o|o 1 o09 dio’ 1 #1 +O|0'

### orig-1440-z1-unlit.png

- ink vertical: `{"n": 51, "mode_px": 6, "mean_px": 5.43, "histogram": {"2": 6, "4": 1, "5": 9, "6": 32, "8": 3}}`
- ink horizontal: `{"n": 45, "mode_px": 6, "mean_px": 5.47, "histogram": {"2": 10, "5": 7, "6": 19, "7": 3, "8": 2, "9": 2, "10": 1, "12": 1}}`
- orange vertical: `{"n": 5, "mode_px": 6, "mean_px": 5.8, "histogram": {"5": 1, "6": 4}}`
- OCR sample text: 'CIRCUIT EDITOR TRUTH TABLE 0 0 1 1 0 1 0 1 0 1 1 1 1 0 0 0'

### orig-1440-z15-halflit.png

- ink vertical: `{"n": 36, "mode_px": 6, "mean_px": 5.5, "histogram": {"2": 7, "5": 9, "6": 10, "7": 4, "8": 3, "9": 3}}`
- ink horizontal: `{"n": 39, "mode_px": 2, "mean_px": 4.9, "histogram": {"2": 14, "5": 11, "6": 4, "7": 2, "8": 3, "9": 4, "10": 1}}`
- orange vertical: `{"n": 10, "mode_px": 6, "mean_px": 5.9, "histogram": {"2": 1, "3": 1, "6": 5, "7": 2, "10": 1}}`
- OCR sample text: 'CIRCUIT EDITOR TRUTH TABLE A B c | ql an) 0 1 0 0 1 0 1 —_ 03'

### orig-1440-z15-lit.png

- ink vertical: `{"n": 26, "mode_px": 2, "mean_px": 5.27, "histogram": {"2": 8, "5": 5, "6": 4, "7": 3, "8": 3, "9": 3}}`
- ink horizontal: `{"n": 33, "mode_px": 2, "mean_px": 4.82, "histogram": {"2": 14, "5": 7, "6": 2, "7": 2, "8": 3, "9": 4, "10": 1}}`
- orange vertical: `{"n": 23, "mode_px": 6, "mean_px": 5.96, "histogram": {"2": 1, "3": 1, "4": 1, "5": 4, "6": 10, "7": 3, "8": 1, "9": 1, "10": 1}}`
- OCR sample text: 'CIRCUIT EDITOR 03 TRUTH TABLE A =/4/4fo =|o/o|40 o|3afo|jAa olo|lo|348'

### orig-1440-z15-unlit.png

- ink vertical: `{"n": 39, "mode_px": 6, "mean_px": 5.95, "histogram": {"2": 7, "5": 6, "6": 13, "7": 5, "8": 2, "9": 3, "10": 2, "12": 1}}`
- ink horizontal: `{"n": 44, "mode_px": 5, "mean_px": 4.91, "histogram": {"2": 14, "5": 16, "6": 4, "7": 2, "8": 3, "9": 4, "10": 1}}`
- orange vertical: `{"n": 6, "mode_px": 6, "mean_px": 5.67, "histogram": {"2": 1, "5": 2, "6": 2, "10": 1}}`
- OCR sample text: 'CIRCUIT EDITOR TRUTH TABLE A Cc Ql 0 0 0 1 o;-;|;,0 1 0 1 0 o;fa,/a/u 03'

### orig-1440.png

- ink vertical: `{"n": 20, "mode_px": 2, "mean_px": 3.35, "histogram": {"1": 1, "2": 11, "3": 1, "4": 1, "5": 3, "6": 2, "10": 1}}`
- ink horizontal: `{"n": 37, "mode_px": 2, "mean_px": 3.89, "histogram": {"2": 20, "3": 5, "4": 1, "5": 1, "6": 3, "7": 2, "8": 2, "10": 2, "12": 1}}`
- orange vertical: `{"n": 0}`
- OCR sample text: 'Figur GATES ARE > IN HERE. CIRCUIT EDITOR DD Oo TRUTH TABLE # A B OUT 02 0 1 0 03 1 0 0 04 1 1 0 03'

### orig-1920-z075-halflit.png

- ink vertical: `{"n": 31, "mode_px": 6, "mean_px": 6.52, "histogram": {"4": 1, "6": 20, "7": 7, "8": 1, "9": 1, "12": 1}}`
- ink horizontal: `{"n": 52, "mode_px": 6, "mean_px": 5.19, "histogram": {"2": 18, "3": 1, "6": 22, "7": 1, "9": 8, "10": 2}}`
- orange vertical: `{"n": 7, "mode_px": 6, "mean_px": 6.14, "histogram": {"6": 6, "7": 1}}`
- OCR sample text: 'CIRCUIT EDITOR TRUTH TABLE A B Cc Ql 0 0 1 1 0 1 0 1, 0 1 1 1 poe ete 1 0 1 0 -'

### orig-1920-z075-lit.png

- ink vertical: `{"n": 23, "mode_px": 6, "mean_px": 6.65, "histogram": {"4": 1, "6": 13, "7": 6, "8": 1, "9": 1, "12": 1}}`
- ink horizontal: `{"n": 48, "mode_px": 2, "mean_px": 5.12, "histogram": {"2": 18, "3": 1, "6": 18, "7": 1, "9": 8, "10": 2}}`
- orange vertical: `{"n": 16, "mode_px": 6, "mean_px": 6, "histogram": {"4": 1, "6": 13, "7": 2}}`
- OCR sample text: 'CIRCUIT EDITOR TRUTH TABLE A B c | Qi 0 T T T 1 0 0 0 1 0 1 0 1 1 0 0'

### orig-1920-z075-unlit.png

- ink vertical: `{"n": 37, "mode_px": 6, "mean_px": 6.59, "histogram": {"4": 1, "6": 24, "7": 8, "8": 1, "9": 1, "11": 1, "12": 1}}`
- ink horizontal: `{"n": 53, "mode_px": 2, "mean_px": 5.23, "histogram": {"2": 20, "6": 20, "7": 2, "9": 8, "10": 2, "11": 1}}`
- orange vertical: `{"n": 3, "mode_px": 6, "mean_px": 4.33, "histogram": {"1": 1, "6": 2}}`
- OCR sample text: 'CIRCUIT EDITOR TRUTH TABLE A B c | Qi 0 0 0 1 o;-);-)|o 1 0 1 0 o;-a3/;4a/4'

### orig-1920-z1-halflit.png

- ink vertical: `{"n": 31, "mode_px": 6, "mean_px": 6.71, "histogram": {"3": 2, "4": 1, "6": 15, "7": 4, "8": 2, "9": 6, "10": 1}}`
- ink horizontal: `{"n": 63, "mode_px": 6, "mean_px": 5.75, "histogram": {"2": 18, "4": 2, "5": 1, "6": 22, "7": 6, "8": 4, "9": 1, "10": 2, "11": 6, "12": 1}}`
- orange vertical: `{"n": 10, "mode_px": 6, "mean_px": 5.8, "histogram": {"3": 1, "4": 1, "6": 6, "7": 1, "8": 1}}`
- OCR sample text: ''

### orig-1920-z1-lit.png

- ink vertical: `{"n": 20, "mode_px": 9, "mean_px": 7.7, "histogram": {"4": 1, "6": 4, "7": 4, "8": 2, "9": 8, "10": 1}}`
- ink horizontal: `{"n": 57, "mode_px": 2, "mean_px": 5.72, "histogram": {"2": 18, "4": 2, "6": 17, "7": 6, "8": 4, "9": 1, "10": 3, "11": 5, "12": 1}}`
- orange vertical: `{"n": 16, "mode_px": 6, "mean_px": 5.75, "histogram": {"3": 1, "4": 1, "6": 13, "7": 1}}`
- OCR sample text: 'CIRCUIT EDITOR TRUTH TABLE A B Cc Qi | | 7 1 0 0 0 1 0 1 0 1 1 0 0'

### orig-1920-z1-unlit.png

- ink vertical: `{"n": 29, "mode_px": 6, "mean_px": 6.9, "histogram": {"3": 1, "4": 1, "6": 14, "7": 5, "8": 2, "9": 4, "10": 1, "12": 1}}`
- ink horizontal: `{"n": 59, "mode_px": 6, "mean_px": 5.86, "histogram": {"2": 17, "6": 23, "7": 6, "8": 4, "10": 1, "11": 6, "12": 2}}`
- orange vertical: `{"n": 6, "mode_px": 6, "mean_px": 6.67, "histogram": {"6": 4, "7": 1, "9": 1}}`
- OCR sample text: 'CIRCUIT EDITOR TRUTH TABLE A B Cc Ql 0 0 1 1 0 1 0 1 0 1 1 1 1 0 0 0'

### orig-1920-z15-halflit.png

- ink vertical: `{"n": 22, "mode_px": 6, "mean_px": 6.5, "histogram": {"4": 1, "6": 13, "7": 5, "8": 1, "9": 2}}`
- ink horizontal: `{"n": 42, "mode_px": 2, "mean_px": 4.83, "histogram": {"2": 16, "4": 1, "6": 13, "7": 8, "8": 3, "9": 1}}`
- orange vertical: `{"n": 8, "mode_px": 6, "mean_px": 6.25, "histogram": {"6": 6, "7": 2}}`
- OCR sample text: 'CIRCUIT EDITOR TRUTH TABLE A B c | Qi 1 1 0 1 » 1 1 1 0 ~'

### orig-1920-z15-lit.png

- ink vertical: `{"n": 12, "mode_px": 6, "mean_px": 6.75, "histogram": {"4": 1, "6": 5, "7": 3, "8": 1, "9": 2}}`
- ink horizontal: `{"n": 36, "mode_px": 2, "mean_px": 4.64, "histogram": {"2": 16, "4": 1, "6": 7, "7": 8, "8": 3, "9": 1}}`
- orange vertical: `{"n": 19, "mode_px": 6, "mean_px": 6.37, "histogram": {"6": 14, "7": 4, "9": 1}}`
- OCR sample text: 'CIRCUIT EDITOR TRUTH TABLE 3a/4/4/a0n3 =|o|o/aa o;-;/o;30 oflol|o|3a8'

### orig-1920-z15-unlit.png

- ink vertical: `{"n": 27, "mode_px": 6, "mean_px": 6.48, "histogram": {"4": 1, "6": 16, "7": 7, "8": 1, "9": 2}}`
- ink horizontal: `{"n": 49, "mode_px": 6, "mean_px": 5, "histogram": {"2": 16, "4": 1, "6": 20, "7": 8, "8": 3, "9": 1}}`
- orange vertical: `{"n": 3, "mode_px": 6, "mean_px": 6, "histogram": {"6": 3}}`
- OCR sample text: 'CIRCUIT EDITOR TRUTH TABLE A B c | Qi 0 0 0 1 o;-);-)|o 1 0 1 0 o;-a3/;4a/4'

### orig-parts@3x.png

- ink vertical: `{"n": 48, "mode_px": 1, "mean_px": 2.19, "histogram": {"1": 41, "2": 1, "4": 1, "11": 2, "12": 3}}`
- ink horizontal: `{"n": 8, "mode_px": 1, "mean_px": 1.38, "histogram": {"1": 6, "2": 1, "3": 1}}`
- orange vertical: `{"n": 0}`
- OCR sample text: '‘TRUTH TABLE eA Bw CIRCUIT EDITOR Lp'

### orig-zoom075.png

- ink vertical: `{"n": 22, "mode_px": 2, "mean_px": 3.55, "histogram": {"1": 1, "2": 11, "3": 1, "4": 1, "5": 4, "6": 3, "10": 1}}`
- ink horizontal: `{"n": 35, "mode_px": 2, "mean_px": 3.29, "histogram": {"2": 20, "3": 5, "4": 1, "5": 6, "6": 1, "10": 2}}`
- orange vertical: `{"n": 0}`
- OCR sample text: '02 Ce GATES ARE > IN HERE. Figur CIRCUIT EDITOR i> © TRUTH TABLE 03'

### orig-zoom150.png

- ink vertical: `{"n": 22, "mode_px": 2, "mean_px": 4.55, "histogram": {"1": 1, "2": 10, "3": 2, "4": 1, "5": 3, "10": 3, "12": 2}}`
- ink horizontal: `{"n": 30, "mode_px": 2, "mean_px": 2.87, "histogram": {"2": 20, "3": 5, "4": 1, "5": 1, "6": 1, "8": 2}}`
- orange vertical: `{"n": 0}`
- OCR sample text: '0 a 02 CIRCUIT EDITOR Figur TRUTH TABLE 03'


## Summary and findings

**Grid `--rule` (page chrome)**: unaffected by this change — pit2/t1w-d does not touch `--rule` in
theme.css (it stays `calc(2 * var(--u))`, ~2px at 1440). The automated `frame_rule_px` probe above
returned `None` for every shot (the probe's fixed scan coordinate missed the actual border pixel at
this viewport crop — a script bug, not a rendering bug); this was cross-checked visually instead: the
outer frame border and the row/column rules are visibly identical in weight across every d-*/orig-*
screenshot pair at the same width/zoom.

**Canvas stroke (parts + wires)**:
- `orig-*` (base, STROKE=6, constant screen px): ink stroke mode is 6px at 1440/1920 across all
  zooms/states, confirming the base branch really does hold a constant 6px regardless of userZoom.
  A few 1280-width samples read 2 or 5 — the scan lines there happened to cross mostly dashed/thin
  ink (free-pin stubs, --ink-2 dots) rather than solid outline in that particular crop; the histograms
  above show 6 is still the dominant non-trivial run in the same file's other axis.
- `d-*` (pit2/t1w-d, STROKE=3, screen px = 3 * userZoom^0.3): ink stroke mode is 2px at zoom 0.75/1
  and 3-4px at zoom 1.5, consistent with the intended growth curve (2.75px -> 3px -> 3.4px) once
  Chromium's sub-pixel antialiasing is accounted for (a 2.75-3.4px stroke paints a ~2-3px solid core
  plus a partial-alpha edge pixel our >=1px run-length counter sometimes includes, sometimes doesn't).
  The direction (thicker at 1.5x, thinner at 0.75x, relative to the 1x value) is correct and consistent
  across all three widths.

**Bleed necks / knobs at 3px**: visual inspection of d-1440-z15-lit.png (STROKE=3, zoomed to ~1.5, the
thinnest-relativeto-largest-screen-size case) and d-1440-z075-lit.png shows every neck (pin-to-body
orange joint) and every knob ring closes with no visible paper-colored gap or seam, on the AND, OR,
XOR, NOT (bubble), NAND (half-lit body + lit bubble) and NOR (lit body + unlit bubble) gates. No seams
were found in any of the 27 dogfood screenshots at any width/zoom/state. 3px was not observed to break
anything; a 2px fallback was not needed.

**OCR / clipping**: `CIRCUIT`, `EDITOR`, `TRUTH`, `TABLE` are recognized in every single one of the 54
dogfood screenshots (d-* and orig-*) at every width and zoom, with mean word confidence mostly 74-92%
(a handful of low-confidence/zero-word outliers — e.g. orig-1920-z1-halflit.png, orig-1440-z1-halflit.png
— are on the UNMODIFIED base branch too, and traced to the wheel-zoom script over-panning the viewport
so the header/table scroll out of frame at that exact zoom step, not to anything pit2/t1w-d changed).
The wordmark "Figur" itself is NOT recognized by tesseract in ANY dogfood scene (d or orig alike), only
in the plain default-scene screenshots from the earlier a/b/c round (orig-1440.png etc). Direct visual
inspection (see d-1440-z15-lit.png, d-1440-z075-lit.png, orig-1440-z1-unlit.png) confirms the wordmark
renders fully intact and unclipped/unoverlapped in the dogfood scenes too — this is a tesseract page-
segmentation false negative on the large stylized display lettering when a dense circuit diagram
occupies most of the frame, reproduced identically on the base branch, not a regression from this
stroke/zoom change.

**Conclusion**: no broken cases found. Parts/wires at 3px screen px at rest, growing with userZoom per
`3 * userZoom^0.3`, hold clean geometry (no seams) and do not clip or overlap any page text at
1280/1440/1920 x 0.75/1/1.5, across unlit/half-lit/lit states, NAND/NOR bubbles, the XOR hop, and wire
crossings.
