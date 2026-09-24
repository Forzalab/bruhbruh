# DESIGN-SPEC-D (Vignelli/Noorda NYCTA 1970 persona)
Sources: ref1 (refs/ref1-swiss-layout.png), RUBRIC.md, NYCTA Graphics Standards Manual 1970 (standardsmanual.com/products/nyctacompactedition; moma.org/collection/works/89300: "highly legible sans-serif ... simple palette"), GOV.UK button (design-system.service.gov.uk/components/button/), Müller-Brockmann *Grid Systems*, WCAG 2.2 SC 2.4.7, IBM Carbon interaction states.
| Decision | Citation |
|---|---|
| Row 01 = 38.9% (rule y=314/810) | ref1 rule y=327/840 |
| Right column 29.8% | ref1 x=1022/1456 |
| Wordmark L 256px (ref scaled 269), i-dot top 25px >=20 | ref1 L 279/840; arbitrator seed 4 |
| Truth table black block fills whole r2 side cell, no inset | ref1 x~1040-1436; Müller-Brockmann; seed 1 |
| Live row = orange digits only; lamp orange; nothing else accent | NYCTA manual single-accent palette; hand D |
| logic-1 wire black 3.5px, logic-0 grey 2px | hand D; NYCTA line weight hierarchy |
| IEEE AND outline 3px, bold label inside | IEEE Std 91 distinctive shape; hand D |
| SHOW GRID = sole filled black button, 30px/800 | GOV.UK "one primary button per page"; NYCTA white-on-black sign panel; seed 2 |
| Button kept compact (232x132) so black mass < wordmark | seed 3 |
| Warm paper #f1ece1 | hand D |
| Hover/active/focus/drag-target/reject states, zero transitions | WCAG 2.4.7; Carbon interaction states; prefers-reduced-motion media query |
| Rejected connection: status row inverts to black + orange marker | Carbon inline notification (error) |
