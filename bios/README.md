# BIOS files

Put the BIOS files here. `emulator.html` checks for them (HEAD request) and
loads them automatically, so visitors don't need to upload anything.

| System       | Expected file         | Required? |
|--------------|-----------------------|-----------|
| Neo Geo      | `bios/neogeo.zip`     | yes       |
| PlayStation  | `bios/scph1001.bin`   | optional (core has HLE BIOS) |

Sega CD, Saturn, PC-FX, 3DO and Amiga have no site default yet. To add one, drop
the file here and set its path in `DEFAULT_BIOS` inside `emulator.html`.

Priority when a game starts: `bios` in games.json > BIOS the visitor saved in
their browser > file in this folder.
