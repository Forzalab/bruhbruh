# T3-D consistency audit: truth table vs the rest of the page

Page reference: wordmark / lockup / field numerals = Roboto Flex 800, wdth 106-118%, ink #111; lines = --rule (2u) ink grid + --hair; palette = ink, paper, --one.

| # | Inconsistency (pit2/t3-c) | Fix (pit2/t3-d) |
|---|---|---|
| 1 | `#` row-number column: extra grey data that nothing else on the page has | Removed; the live row is found by --one and by clicking |
| 2 | TRUTH TABLE label used a condensed 760 / wdth 88% cut and its own fallback face; the lockup is 800 / 112% | Label set in the lockup's cut: 800, wdth 112%, same line-height ratio |
| 3 | Headers 700 / wdth 100% / +0.06em tracking, a cut used nowhere else | Headers = field-numeral style: 800, wdth 118%, 18.3u, 0 tracking |
| 4 | Figures in three weights (500 / 600 / 760 / 900) and two sizes (20u gate, 24u rest) | One figure style: 800, wdth 112%, 28.3u (the step between 18.3 numerals and 43.7 label) |
| 5 | 0s and row numbers in --ink-2 grey | All figures ink; 0 and 1 are told apart by glyph, not colour |
| 6 | Row lines in --grid #e2e2e2 grey | --hair ink, like the page grid's thin lines |
| 7 | Hover fill #f4f4f4, a fourth grey not in the tokens | Hover = inset --rule ink underline (no fill) |
| 8 | Group separators --hair; header rule --rule: two weights for one job | Group separators and header rule both --rule ink, the grid's one rule weight |
| 9 | Header glyphs: 3u stroke, 14u, lamp filled solid black (canvas lamp is an outline, only orange when on) | Glyphs 18u with --rule ink outline; lamp is an outline like the unlit canvas lamp |
| 10 | Gate figures smaller and lighter, lamp figures heavier: three type treatments in one row | Removed; column kind is shown only by header glyph + group rule |

Greys in the table: before 4 (--ink-2, --grid, #f4f4f4, #767676 row nums); after 0. Colours used: ink, paper, --one.
