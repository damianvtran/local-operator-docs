| page@viewport | prose | code block | table | callout | tabs | header row |
| --- | --- | --- | --- | --- | --- | --- |
| **BEFORE** |||||||
| install@1440 | 384..1064 | 288..1160 | 288..1160 | 288..1160 | 288..1160 | 288..1160 |
| choose-your-surface@1440 | 384..1064 | — | 288..1160 | — | — | 288..1160 |
| desktop@1440 | 384..1064 | 288..1160 | — | — | — | 288..1160 |
| python-sdk@1440 | 384..1064 | 288..1160 | 288..1160 | — | — | 288..1160 |
| install@1024 | 288..1008 | 288..1008 | 288..1008 | 288..1008 | 288..1008 | 288..1008 |
| choose-your-surface@1024 | 288..1008 | — | 288..1008 | — | — | 288..1008 |
| install@640 | 16..624 | 16..624 | 16..624 | 16..624 | 16..624 | 16..624 |
| **AFTER** |||||||
| install@1440 | 356..1092 | 356..1092 | 356..1092 | 356..1092 | 356..1092 | 356..1092 |
| choose-your-surface@1440 | 356..1092 | — | 356..1092 | — | — | 356..1092 |
| desktop@1440 | 356..1092 | 356..1092 | — | — | — | 356..1092 |
| python-sdk@1440 | 356..1092 | 356..1092 | 356..1092 | — | — | 356..1092 |
| install@1280 | 288..1000 | 288..1000 | 288..1000 | 288..1000 | 288..1000 | 288..1000 |
| choose-your-surface@1280 | 288..1000 | — | 288..1000 | — | — | 288..1000 |
| desktop@1280 | 288..1000 | 288..1000 | — | — | — | 288..1000 |
| python-sdk@1280 | 288..1000 | 288..1000 | 288..1000 | — | — | 288..1000 |
| install@1024 | 288..1008 | 288..1008 | 288..1008 | 288..1008 | 288..1008 | 288..1008 |
| choose-your-surface@1024 | 288..1008 | — | 288..1008 | — | — | 288..1008 |
| install@640 | 16..624 | 16..624 | 16..624 | 16..624 | 16..624 | 16..624 |

Notes: at 1024 and below the pre-fix layout collapsed to ONE track, so before and after are
geometry-identical there (the frames at 1024 are byte-identical by design — the defect
existed only above the 1025 collapse; the operator's '~1024' crop is this same 96px
overhang at a scaled/cropped capture of a wider window). 1280 is the narrowest width where
the old five-track grid and the TOC both rendered; AFTER rows at 1280 show the same
alignment as 1440 (all edges 288..1000).
