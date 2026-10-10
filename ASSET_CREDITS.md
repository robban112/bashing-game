# Sprite pack credits

Character animations and environmental props are from the **GameArt2D Freebies**
collection by **Zuhria Alfitra (pzUH)**, released under **CC0 1.0 / Public Domain**.

- Artist and original collection: https://www.gameart2d.com/freebies.html
- Knight pack: https://www.gameart2d.com/the-knight-free-sprites.html
- Distribution mirror: https://github.com/rudy-digipen/gameart2d
- Imported mirror commit: `9616490045bb9f35918ec1fd154b9847a4531716`
- CC0: https://creativecommons.org/publicdomain/zero/1.0/

The mirror's source license statement is preserved in
`public/assets/gameart2d/SOURCE-LICENSE.md`. Each imported original file,
its source path and SHA-256 are recorded in `public/assets/gameart2d/manifest.json`.
The selected PNG files are unchanged originals.

Imported packs: **The Knight** (idle, walking, attack and defeated animations),
**Adventure Girl** and **Red Hat Boy** (villagers), **Santa Claus** (the wizard's
face/body), and the **Free Platformer Tileset** (tree, bush and crate).

`lib/renderer.js` adapts palettes at runtime: dark armor for the player, brown
clothes for the worker, and purple for the wizard. The wizard's pointed hat,
robe and staff, village buildings, cart, barrels, shadows and comic impact
lettering are drawn by the game. The PNG sources remain unmodified.

No sprites or other artwork were extracted from The Black Knight.

The player now uses ten separate **The Knight / DragonBones library** parts
(body, helmet/head, hair, limbs, gauntlet and shield), from the same recorded
mirror commit and CC0 license. These original PNGs are also listed in the manifest.
The renderer assembles and animates the parts so the hand can hold a separate
weapon rather than an embedded sword. Guards still use the original frame sprites.

`public/assets/weapons/` contains six original comic SVG weapon sprites made for
this game: training sword, iron sword, royal sword, axe, spiked mace and hammer.
They are dedicated to the public domain under CC0 1.0. Shop cards and the knight's
hand use the same files, with the grip point at (50, 135) in a 100 × 160 viewBox.
