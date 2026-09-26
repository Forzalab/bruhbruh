# t3r3 evidence: dogfood, Pillow, OCR

## Dogfood (real app, Playwright mouse/keyboard only, no injected circuit): `dog-*.png`

1. Default page; wired S1->AND.in0, S2->AND.in1, AND->lamp by mouse drag between handles (3 wires). Clicked both switches: lamp "on", live row 1 1 1. `dog-1-wired-11.png`
2. Opened the palette; dragged a Lamp and 3 Switches onto the canvas (HTML5 drag), clicked 8 more Switches: 13 switches, 2 lamps (Q1, Q2). Closed palette. `dog-2-n13-q2-top.png`
3. Wheel x5 over the table (rows scroll, header stays). `dog-3-wheel-down.png`
4. Shift+wheel once: exactly one column (109px). `dog-4-shift-wheel-1.png`; six more: `dog-5-shift-wheel-end.png`
5. Shift+wheel up over the LEFT cue: scrolls back one column. `dog-6-cue-wheel-back.png`
6. Toggled switch B on the canvas while scrolled: table jumps so the live row sits under the header. `dog-7-toggle-scrolled.png`
7. Right-click deleted switch A: 12 switches, table rebuilt, horizontal position kept. `dog-8-deleted-s1.png`
Page errors during the run: none.

## Pillow measurements (1440x810, dogfooded circuit)

- header rule under A: dark run 1px at y=419
- header rule under B: dark run 1px at y=419
- header rule under OUT: dark run 2px at y=418
- vertical switch|lamp rule at x=1285..1286 (2px) in a body row
- column widths (th px): A 133, B 173, OUT 132

- 2-n13-q2-top: scroll (x,y) = [0, 278804], header y = 356 vs box y 356 (pinned: True), scrollLeft/109 = 0.00 columns, cues = up@(1420,330), down@(1420,702), right@(1424,512), live row y 600 in box 356..716
- 4-shift-wheel-1: scroll (x,y) = [109, 280300], header y = 356 vs box y 356 (pinned: True), scrollLeft/109 = 1.00 columns, cues = up@(1420,330), down@(1420,702), left@(967,512), right@(1424,512), live row off-screen (user scrolled away)
- 5-shift-wheel-end: scroll (x,y) = [765, 280300], header y = 356 vs box y 356 (pinned: True), scrollLeft/109 = 7.02 columns, cues = up@(1420,330), down@(1420,702), left@(967,512), right@(1424,512), live row off-screen (user scrolled away)
- 7-toggle-scrolled: scroll (x,y) = [656, 278464], header y = 356 vs box y 356 (pinned: True), scrollLeft/109 = 6.02 columns, cues = up@(1420,330), down@(1420,702), left@(967,512), right@(1424,512), live row y 396 in box 356..716
- 8-deleted-s1: scroll (x,y) = [656, 0], header y = 356 vs box y 356 (pinned: True), scrollLeft/109 = 6.02 columns, cues = down@(1420,702), left@(967,512), right@(1424,512), live row y 396 in box 356..716

## OCR (tesseract 5.3.4, header strip and first body row of every table screenshot)

| shot | header OCR | expected | first row OCR |
|---|---|---|---|
| dog-1-wired-11.png | A B ¦ OUT | A B OUT | 0 0 ¦ 0 |
| dog-2-n13-q2-top.png | A B C D | A B C D | 1 0 0 0 |
| dog-3-wheel-down.png | A B C D | A B C D | 1 0 0 0 |
| dog-4-shift-wheel-1.png | B C D E | B C D E | 0 0 0 0 |
| dog-5-shift-wheel-end.png | H l J K | H I J K | 0 1 1 0 |
| dog-6-cue-wheel-back.png | G H l J | G H I J | 0 0 1 1 |
| dog-7-toggle-scrolled.png | G H l J | G H I J | 0 0 0 0 |
| dog-8-deleted-s1.png | G H l J | G H I J | 0 0 0 0 |
| t3r3-1280.png | A B ¦ OUT |  | 0 0 0 |
| t3r3-1440.png | A B ¦ OUT |  | 0 0 0 |
| t3r3-1920.png | A B ¦ OUT |  | 0 0 0 |
| t3r3-chain.png | A B C ¦ OUT |  | 0 0 0 0 |
| t3r3-delete.png | A B C ¦ OUT |  | Ut “¦ |
| t3r3-direct.png | A ¦ OUT |  | 0 0 |
| t3r3-fanout.png | A B ¦ Qi Q2 |  | 0 0 0 0 |
| t3r3-freein.png | A B ¦ OUT |  | 0 0 1 |
| t3r3-freelamp.png | A B ¦ Qi Q2 |  | 0 0 0 0 |
| t3r3-l0.png | A B |  | 0 0 |
| t3r3-n13l4-h-left.png | A B C D |  | 1 0 0 0 |
| t3r3-n13l4-h-mid.png | G H l J |  | 0 0 0 0 |
| t3r3-n13l4-h-right.png | ¦ Qi Q2 Q3 Q4 |  | 0 oOo 1 O |
| t3r3-s0.png | OUT |  | 0 |
| t3r3-s13l4.png | A B C D |  | 0 0 0 0 |
| t3r3-s1l5.png | A ¦ Ql Q2 Q3 |  | 0 0 1 0 |
| t3r3-toggle13.png | A B C D |  | 1 0 0 0 |

## Reading the OCR
- `¦` = the 2px switch|lamp rule read as a bar (it sits exactly between the switch and lamp heads, as intended).
- `l` for I and `Qi`/`Ql` for Q1 are tesseract confusions of Roboto Flex I/1 at this size; every glyph is whole in the crops (no partial glyphs: no "MOU"-type reads anywhere). Headers match the DOM heads in view in every dogfood shot.
- 5+ columns show only the 4 heads in view (sideways scroll, snapped: scrollLeft = whole multiples of 109px, e.g. 1.00 / 6.02 / 7.02 columns; the .02 is the 2px rule).
- `delete` first row is the white-on-orange live row; tesseract misreads it (low contrast for OCR only, unchanged from orig).
- Header rule: 1px (--hair) under switch heads, 2px (--rule) under lamp heads; vertical rule 2px. Header y = box y in every scrolled shot (sticky holds).
