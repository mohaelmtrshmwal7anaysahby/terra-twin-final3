# TerraTwin data audit

_Snapshot of `src/data/planetaryData.ts` taken during the data audit. The source of truth is the data file; `npm test` enforces the rules below._

## What the tiers mean

| Tier | Meaning | Counts toward the reliable score? |
| --- | --- | --- |
| **measured** | Traceable to a **confirmed** source that reports this quantity | Yes |
| **modeled** | Regional/derived estimate with a confirmed source or documented method | Yes |
| **illustrative** | Representative placeholder, **no confirmed source** | No (provisional score only) |
| **incomplete** | No value; stored as `null` | No |

A similarity score is **reliable** only when at least 4 axes are measured/modeled on **both** the Earth site and the planetary target. Otherwise the UI shows a clearly labelled **provisional** score (or none). Numeric mineral percentages are stored as `null` until a source is added; mineral *names* remain as qualitative context.

## Current status per record

| Record | Axis | Value | Tier |
| --- | --- | --- | --- |
| atacama | Mean temperature (°C) | 16.4 | illustrative |
| atacama | Elevation (m) | 980 | illustrative |
| atacama | Mean slope (°) | 2.1 | illustrative |
| atacama | RMS roughness (°) | 5.8 | illustrative |
| atacama | Water / ice (wt%) | 0.4 | illustrative |
| atacama | Mineralogy (names only) | 4 groups | illustrative |
| antarctica | Mean temperature (°C) | -20.4 | illustrative |
| antarctica | Elevation (m) | 1250 | illustrative |
| antarctica | Mean slope (°) | 4.8 | illustrative |
| antarctica | RMS roughness (°) | 8.1 | illustrative |
| antarctica | Water / ice (wt%) | 4.2 | illustrative |
| antarctica | Mineralogy (names only) | 4 groups | illustrative |
| haughton | Mean temperature (°C) | -15.6 | illustrative |
| haughton | Elevation (m) | 240 | illustrative |
| haughton | Mean slope (°) | 7.4 | illustrative |
| haughton | RMS roughness (°) | 10.2 | illustrative |
| haughton | Water / ice (wt%) | 3.1 | illustrative |
| haughton | Mineralogy (names only) | 4 groups | illustrative |
| death-valley | Mean temperature (°C) | 25.2 | illustrative |
| death-valley | Elevation (m) | -86 | illustrative |
| death-valley | Mean slope (°) | 1.8 | illustrative |
| death-valley | RMS roughness (°) | 4.9 | illustrative |
| death-valley | Water / ice (wt%) | 0.7 | illustrative |
| death-valley | Mineralogy (names only) | 4 groups | illustrative |
| iceland | Mean temperature (°C) | 0.8 | illustrative |
| iceland | Elevation (m) | 760 | illustrative |
| iceland | Mean slope (°) | 3.6 | illustrative |
| iceland | RMS roughness (°) | 6.9 | illustrative |
| iceland | Water / ice (wt%) | 2.4 | illustrative |
| iceland | Mineralogy (names only) | 4 groups | illustrative |
| hawaii | Mean temperature (°C) | 6.1 | illustrative |
| hawaii | Elevation (m) | 3650 | illustrative |
| hawaii | Mean slope (°) | 5.2 | illustrative |
| hawaii | RMS roughness (°) | 7.5 | illustrative |
| hawaii | Water / ice (wt%) | 0.9 | illustrative |
| hawaii | Mineralogy (names only) | 4 groups | illustrative |
| canadian-arctic | Mean temperature (°C) | -15.5 | measured |
| canadian-arctic | Elevation (m) | 185 | illustrative |
| canadian-arctic | Mean slope (°) | 6.1 | illustrative |
| canadian-arctic | RMS roughness (°) | `null` | incomplete |
| canadian-arctic | Water / ice (wt%) | 5.1 | illustrative |
| canadian-arctic | Mineralogy (names only) | 4 groups | illustrative |
| moon-mare | Mean temperature (°C) | -23 | illustrative |
| moon-mare | Elevation (m) | -1900 | illustrative |
| moon-mare | Mean slope (°) | 2.4 | illustrative |
| moon-mare | RMS roughness (°) | 4.8 | illustrative |
| moon-mare | Water / ice (wt%) | 0.01 | illustrative |
| moon-mare | Mineralogy (names only) | 4 groups | illustrative |
| moon-south-pole | Mean temperature (°C) | -148 | illustrative |
| moon-south-pole | Elevation (m) | 1240 | illustrative |
| moon-south-pole | Mean slope (°) | 9.8 | illustrative |
| moon-south-pole | RMS roughness (°) | 11.4 | illustrative |
| moon-south-pole | Water / ice (wt%) | 5.6 | modeled |
| moon-south-pole | Mineralogy (names only) | 4 groups | illustrative |
| mars-jezero | Mean temperature (°C) | -63 | illustrative |
| mars-jezero | Elevation (m) | -2500 | illustrative |
| mars-jezero | Mean slope (°) | 3.9 | illustrative |
| mars-jezero | RMS roughness (°) | 7.2 | illustrative |
| mars-jezero | Water / ice (wt%) | 2.1 | illustrative |
| mars-jezero | Mineralogy (names only) | 4 groups | modeled |
| mars-gale | Mean temperature (°C) | -55 | illustrative |
| mars-gale | Elevation (m) | -4500 | illustrative |
| mars-gale | Mean slope (°) | 4.5 | illustrative |
| mars-gale | RMS roughness (°) | 6.4 | illustrative |
| mars-gale | Water / ice (wt%) | 1.8 | illustrative |
| mars-gale | Mineralogy (names only) | 4 groups | illustrative |

## Confirmed and unconfirmed sources

| Record | Source | Identifier | Status | What it supports |
| --- | --- | --- | --- | --- |
| atacama | Mars-like soils in the Atacama Desert, Chile, and the dry limit of microbial life (2003) | DOI:10.1126/science.1089143 | confirmed | Mars-like hyper-arid soils with trace organics; study area at roughly 3,000 ft (about 914 m) per the NASA release. |
| antarctica | _none yet_ | | | |
| haughton | _none yet_ | | | |
| death-valley | _none yet_ | | | |
| iceland | _none yet_ | | | |
| hawaii | _none yet_ | | | |
| canadian-arctic | Perennial springs in the Canadian High Arctic (2004) | McGill University thesis, 2004 | confirmed | Mean annual air temperature of -15.5 C at Expedition Fiord, Axel Heiberg Island. |
| canadian-arctic | Mineralogy of saline perennial cold springs on Axel Heiberg Island, Nunavut, Canada and implications for spring deposits on Mars (2013) | Icarus (2013) | confirmed | Gypsum/anhydrite diapir-associated cold-spring mineral precipitates (qualitative). |
| canadian-arctic | The identification of sulfide oxidation as a potential metabolism driving primary production on late Noachian Mars (2020) | DOI:10.1038/s41598-020-67815-8 | confirmed | Average air temperature near -15 C with winter minima near -40 C on Axel Heiberg Island. |
| moon-mare | The global surface temperatures of the Moon as measured by the Diviner Lunar Radiometer Experiment (2017) | DOI:10.1016/j.icarus.2016.08.012 | confirmed | Equatorial daytime maximum of about 387-397 K and pre-dawn minimum of about 95 K (zonal values, not site-specific). |
| moon-south-pole | Detection of Water in the LCROSS Ejecta Plume (2010) | DOI:10.1126/science.1186986 | confirmed | Water ice estimated at 5.6 +/- 2.9 % by mass at the Cabeus LCROSS impact site (not at the listed coordinates). |
| mars-jezero | Aqueously altered igneous rocks sampled on the floor of Jezero crater, Mars (2022) | DOI:10.1126/science.abo2196 | confirmed | Crater floor is two igneous units altered by liquid water; voids contain sulfates and perchlorates. |
| mars-gale | Deposition, exhumation, and paleoclimate of an ancient lake deposit, Gale crater, Mars (2015) | DOI:10.1126/science.aac7575 | unconfirmed | Citation not independently re-checked in the data audit. |

## What was corrected in this audit

- **LCROSS DOI** was wrong (`science.1196986`); the correct DOI is `10.1126/science.1186986`.
- **LCROSS water-ice value** (5.6 ± 2.9 wt%) was measured at the Cabeus impact site, not at the listed south-pole coordinates; it is now flagged as an indicative, *modeled* polar value.
- **Jezero source title** was inaccurate; it now matches the published title (Farley et al., 2022).
- **Moon mare temperature extremes** now follow Diviner zonal values (≈387–397 K max, ≈95 K pre-dawn): 124 °C / −178 °C.
- **Canadian Arctic mean temperature** changed from −18.2 °C to −15.5 °C (mean annual air temperature at Expedition Fiord, Andersen 2004).
- **Removed citations** whose identifiers could not be matched to any real record (e.g. `PDS-LRO-LOLA-V1`, `LPI-10084-BASALT`, `HMP-DEVON-2019`, `USGS-OFR-2021-DV`, `NASA-PSTAR-SANDE-2022`, `JSC-BASALT-HI-2018`, `PDS-MRO-CRISM-JEZERO`) and DOIs that could not be confirmed (`10.1130/B30789.1`, `10.1089/ast.2015.1370`). Superseded by the sources above, or left empty.
- **Numeric mineral percentages** (44 values) set to `null`: none had a confirmed source.
- **Gale (Grotzinger et al., 2015)** is kept but marked `unconfirmed` because its citation was not re-checked.

## How to upgrade a value

1. Find a primary source (peer-reviewed paper, NASA PDS/USGS dataset, official climate normals) that reports the quantity **for that site**.
2. Add it to the record's `sources` with `verification: 'confirmed'` once you have checked the title, venue and identifier against an independent record, and a narrow `supports` sentence.
3. Update the value to match the source, set the axis in `metricQuality` to `measured` or `modeled`.
4. Run `npm test`: the guards refuse sourced tiers on records without a confirmed source.
