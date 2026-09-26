# t3r-a: remove # only, re-balance
- Truth.jsx: dropped the `#` header th (hN) and the per-row number td (+ now-unused `digits`) -- task; NYCTA: one message per sign, nothing redundant.
- theme.css: dropped `.hN` stretch and the `:first-child` left-align/8u indent -- both existed only for the # column (subtract only).
- theme.css: classic widths A/B/OUT = ref3's 23.62/30.73/23.40 rescaled to 100% (30.38/39.52/30.10) -- Muller-Brockmann: keep the fitted proportions of the grid, only rescale the module; table keeps its old width and rules.
- Header/figure glyph spans untouched -- NYCTA: one grotesk, one fitted weight system.
- Same default circuit (2 switches, AND, 1 lamp) for orig and variant; Playwright full page at 1440/1280/1920.
- n13 stress (13 switches, 8,192 rows): header pinned (delta 0), 11 rows rendered, add 11 switches ~0.95 s, jump to mid ~0.4 s; orig's 4-digit # overlap is gone; OUT still clips at 14 columns, same as orig.
