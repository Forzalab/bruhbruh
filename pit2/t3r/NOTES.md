# t3r-c: remove #, three equal columns
- Truth.jsx: dropped the `#` header th (hN) and per-row number td (+ unused `digits`) -- task; NYCTA: one message per sign, nothing redundant.
- theme.css: dropped `.hN` stretch and the `:first-child` left-set + 8u indent -- both existed only for the # column (subtract only).
- theme.css: dropped the classic per-column widths; `table-layout: fixed` now splits A / B / OUT into equal thirds -- Muller-Brockmann modular grid: equal fields, no hand-tuned widths left; the 1/3 module also echoes the page's column grid.
- Header glyph spans (hA / hB / hO / hU / hT) and figure spans (f1 / f2 / f4) untouched -- the Roboto Flex per-glyph fit is width-independent (NYCTA: one grotesk, one weight system).
- n13 stress (13 switches, 8,192 rows): header pinned (delta 0), 11 rows rendered, add 11 switches ~0.95 s, jump to mid ~0.4 s; orig's 4-digit # overlap is gone; OUT still clips at 14 columns, same as orig.
