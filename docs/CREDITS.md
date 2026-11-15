# Credits & asset provenance

> This is a good-faith provenance note, not legal advice. Re-check each source before a commercial release
> or a competition submission whose rules cover third-party assets.

## Planet textures (`src/assets/textures/`)

Converted to WebP (and, for `earth_roughness.webp`, derived from the ocean/land specular mask) from:

| Files | Where they were downloaded from |
| --- | --- |
| `earth_day`, `earth_normal`, `earth_roughness`, `earth_lights`, `earth_clouds`, `moon` | [`mrdoob/three.js` → `examples/textures/planets`](https://github.com/mrdoob/three.js/tree/dev/examples/textures/planets) |
| `mars`, `mars_bump` | [`jeromeetienne/threex.planets` → `images`](https://github.com/jeromeetienne/threex.planets/tree/master/images) |

What is known:

- Planet Pixel Emporium states that its maps are copyright James Hastings-Trew and are free to use as source
  material in artwork or rendering for any project, personal or commercial
  (<https://planetpixelemporium.com/planets.html>). Credit him.
- Third-party notes say the three.js planet textures originate from that site and are derived from NASA satellite
  imagery. We could not confirm this file by file, especially for the Moon and Mars maps.
- Re-publishing the raw files inside a public repository is a grey area under that wording. Prefer linking to the
  source, asking the author, or replacing the files with a set whose licence explicitly allows redistribution
  (for example Solar System Scope textures, which are published under CC BY 4.0: verify on their site).

Replacement files only need the same names and a 2:1 equirectangular layout.

## NASA names, logos and imagery

NASA content is generally not copyrighted in the United States, but the NASA insignia ("meatball"), logotype
("worm") and seal are not public domain and may not be used without explicit permission, and NASA material must not
imply endorsement. Review every generated or edited image (for example `persona_astronaut_*.webp`) and remove any
NASA logo or lettering before publishing. See <https://www.nasa.gov/nasa-brand-center/images-and-media/>.

## Generated imagery

If any images under `src/assets/images/` were produced with an AI image tool, disclose that wherever the
competition or publication rules require it, and keep a record of the tool and licence terms used.

## Code and fonts

Application code: MIT (see `LICENSE`). The MIT licence does **not** cover the textures or images above.
Fonts: IBM Plex Sans Arabic, JetBrains Mono, Manrope and Space Grotesk via Google Fonts (SIL Open Font License).
