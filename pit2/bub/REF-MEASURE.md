# Blambot balloon reference measurements (Pillow)

Source: https://blambot.com/pages/comic-book-grammar-tradition. There are 37 images in ref/, all downloaded with curl.

**Method** (scratchpad meas.py):
- **Balloon:** the largest enclosed white region (L>225).
- **Text:** ink (L<90) inside the balloon.
- **Cap height:** the median ink line height.
- **Outline:** the ink run just outside the balloon on the centre row/column. It reads 0 where anti-aliasing defeats the threshold, and those rows are excluded from the median.
- **Tail:** balloon rows below the body (rows narrower than 40% of the max width).

**Medians:** aspect 1.34 (range 0.89-4.38); outline/cap 0.157 (about 2px at cap 12-13px); leading/cap 1.28; pad-x/cap 1.12; pad-y/cap 0.96; text ink density in the text bbox 0.166; tail length (when present) 13px, i.e. about 1 cap, and long tails reach 37-46px (about 3 caps).

**Not measured:** tail width and curve, and bold-italic stress weight. The run-length probe could not separate these reliably, so no numbers are given.

**Font:** Anime Ace 3 BB, supplied by Tony. Its phrases are outlined by gen-say-lettering.py and the .otf is not in the repo.

| image | balloon WxH | aspect | outline px | cap px | outline/cap | leading/cap | pad x/cap | pad y/cap | text ink density | tail len px |
|---|---|---|---|---|---|---|---|---|---|---|
| grammar_asterisk.jpg | 194x59 | 3.29 | 2.0 | 12 | 0.167 | 1.38 | 0.92 | 0.67 | 0.163 | 0 |
| grammar_bigbsmallt.jpg | 133x86 | 1.55 | 1.0 | 9 | 0.111 | 1.44 | 3.56 | 2.33 | 0.147 | 11 |
| grammar_bold.jpg | 140x122 | 1.15 | 0.0 | 12 | 0.000 | 1.42 | 3.92 | 0.92 | 0.088 | 40 |
| grammar_breath.jpg | 119x109 | 1.09 | 1.0 | 13 | 0.077 | 1.27 | 1.15 | 1.00 | 0.170 | 44 |
| grammar_butt.jpg | 139x115 | 1.21 | 2.0 | 13 | 0.154 | 1.31 | 0.85 | 0.54 | 0.178 | 37 |
| grammar_caps.jpg | 137x61 | 2.25 | 2.0 | 12 | 0.167 | 1.38 | 0.50 | 0.67 | 0.205 | 0 |
| grammar_connector.jpg | 214x114 | 1.88 | 2.0 | 15 | 0.133 | 1.10 | 0.80 | 0.67 | 0.109 | 28 |
| grammar_doubledash.jpg | 157x101 | 1.55 | 1.0 | 13 | 0.077 | 1.23 | 1.23 | 2.00 | 0.129 | 4 |
| grammar_doubleoutline.jpg | 140x123 | 1.14 | 2.0 | 12 | 0.160 | 1.28 | 1.04 | 0.96 | 0.187 | 41 |
| grammar_doublespace.jpg | 161x156 | 1.03 | 2.0 | 12 | 0.167 | 1.38 | 1.25 | 1.33 | 0.173 | 15 |
| grammar_dropcaps.jpg | 171x39 | 4.38 | 6.0 | 12 | 0.480 | 1.36 | 1.12 | 0.40 | 0.212 | 0 |
| grammar_ellipses.jpg | 198x182 | 1.09 | 0.0 | 13 | 0.000 | 1.23 | 1.00 | 0.85 | 0.102 | 9 |
| grammar_foreign.jpg | 142x122 | 1.16 | 2.0 | 13 | 0.154 | 1.23 | 1.00 | 1.00 | 0.149 | 36 |
| grammar_hyphen.jpg | 138x119 | 1.16 | 1.0 | 13 | 0.077 | 1.23 | 1.00 | 0.85 | 0.155 | 20 |
| grammar_i.jpg | 132x145 | 0.91 | 0.0 | 14 | 0.000 | 1.24 | 0.83 | 0.48 | 0.123 | 45 |
| grammar_italic.jpg | 146x73 | 2.00 | 0.0 | 14 | 0.000 | 1.25 | 0.86 | 0.79 | 0.175 | 4 |
| grammar_joined.jpg | 146x109 | 1.34 | 2.0 | 12 | 0.167 | 1.42 | 3.42 | 2.17 | 0.144 | 8 |
| grammar_music.jpg | 132x93 | 1.42 | 1.0 | 18 | 0.056 | 1.08 | 0.83 | 1.56 | 0.135 | 3 |
| grammar_numbers.jpg | 157x106 | 1.48 | 0.0 | 14 | 0.000 | 1.33 | 4.00 | 0.81 | 0.146 | 5 |
| grammar_offpanel.jpg | 228x104 | 2.19 | 0.0 | 13 | 0.000 | 1.23 | 1.46 | 0.77 | 0.164 | 13 |
| grammar_overlapping.jpg | 139x121 | 1.15 | 2.0 | 12 | 0.160 | 1.28 | 0.96 | 0.96 | 0.186 | 39 |
| grammar_quesexc.jpg | 164x118 | 1.39 | 3.5 | 14 | 0.250 | 1.14 | 1.43 | 1.29 | 0.180 | 46 |
| grammar_quotes.jpg | 152x60 | 2.53 | 2.0 | 12 | 0.167 | 1.38 | 2.83 | 0.67 | 0.182 | 0 |
| grammar_radio.jpg | 120x96 | 1.25 | 4.0 | 14 | 0.286 | 1.25 | 0.93 | 1.79 | 0.146 | 13 |
| grammar_rough.jpg | 157x102 | 1.54 | 0.0 | 15 | 0.000 | 1.17 | 0.73 | 2.73 | 0.214 | 5 |
| grammar_shout.jpg | 176x137 | 1.28 | 0.0 | 13 | 0.000 | 1.23 | 2.23 | 4.15 | 0.182 | 13 |
| grammar_squink.jpg | 144x162 | 0.89 | 0.0 | 13 | 0.000 | 1.31 | 1.23 | 0.85 | 0.181 | 80 |
| grammar_tails.jpg | 139x83 | 1.67 | 0.0 | 13 | 0.000 | 1.31 | 0.92 | 0.85 | 0.166 | 10 |
| grammar_tangents.jpg | 140x116 | 1.21 | 0.0 | 12 | 0.000 | 1.28 | 1.04 | 1.04 | 0.173 | 37 |
| grammar_telepathic.jpg | 130x98 | 1.33 | 2.0 | 13 | 0.154 | 1.23 | 1.38 | 1.54 | 0.175 | 4 |
| grammar_thought.jpg | 177x95 | 1.86 | 0.0 | 13 | 0.000 | 1.23 | 1.62 | 1.31 | 0.144 | 5 |
| grammar_wavy.jpg | 199x147 | 1.35 | 0.0 | 12 | 0.000 | 1.39 | 1.30 | 1.48 | 0.167 | 62 |
| grammar_whisper.jpg | 123x99 | 1.24 | 1.0 | 10 | 0.100 | 1.30 | 2.50 | 4.20 | 0.147 | 3 |

## bub-d balloons vs ref (Pillow, 3x crops, same probe)

| image | balloon WxH | aspect | outline px | cap px | outline/cap | leading/cap | pad x/cap | pad y/cap | text ink density | tail len px |
|---|---|---|---|---|---|---|---|---|---|---|
| d1-hint@3x.png | 535x298 | 1.80 | 8.0 | 51 | 0.157 | 1.55 | 1.47 | 1.12 | 0.253 | 63 |
| d1-logo@3x.png | 450x199 | 2.26 | 9.0 | 39 | 0.231 | 1.17 | 3.49 | 0.90 | 0.318 | 9 |
| d1-part@3x.png | 533x316 | 1.69 | 4.0 | 40 | 0.100 | 1.14 | 1.73 | 1.65 | 0.259 | 61 |

**Deltas vs ref medians (part / logo):**

| Measure | Ref | Part | Logo | Note |
|---|---|---|---|---|
| Aspect | 1.34 | 1.69 | 2.26 | By design: Tony's rule is a 2:1 ellipse, as in the hint |
| Outline / cap | 0.157 | 0.100 | 0.231 | The probe is noisy here too. The drawn value is 3u at a 12u cap = 0.25, the hint's ratio. |
| Leading / cap | 1.28 | 1.14 | 1.17 | Set to 1.28; the probe measures ink line height including the italic swash, so it reads short |
| Pad x / cap | 1.12 | 1.73 | 3.49 | The 2:1 ellipse adds side room, most on the narrow 3-line logo phrase |
| Pad y / cap | 0.96 | 1.65 | 0.90 | Same cause as pad x |
| Ink density | 0.166 | 0.259 | 0.318 | The hint (Tony-approved) measures 0.253 on the same probe. The ref JPEGs are low-res and anti-aliased, which lowers density. |
| Tail length | 13px, about 1 cap | about 1.5 caps | short (sideways) | |
