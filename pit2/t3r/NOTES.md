# t3r-b: remove #, A takes its slot flush-left, B/OUT stay put
- Truth.jsx: dropped the `#` header th (hN) and per-row number td (+ unused `digits`) -- task; NYCTA: say only what is needed, one message per sign.
- theme.css: dropped `.hN` stretch -- it fitted only the removed glyph (subtract only).
- theme.css: kept the existing `:first-child` left-set + 8u indent, now on A -- Muller-Brockmann flush-left axis: A hangs on the same edge as TRUTH TABLE and the table rules.
- theme.css: classic widths 45.87 / 30.73 / 23.40 -- B and OUT keep ref3's original centres (1248 / 1366 at 1440), so nothing already fitted moves; A absorbs the freed 22.25%.
- n13 stress (13 switches, 8,192 rows): header stays pinned (delta 0), 11 rows rendered, add 11 switches ~0.95 s, jump to mid ~0.4 s; # overlap of orig (4-digit numbers over A) is gone; OUT still clips at 14 columns, same as orig.
