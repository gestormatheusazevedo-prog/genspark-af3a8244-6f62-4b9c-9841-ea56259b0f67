---
name: openverse
description: Find and download real, openly licensed sound effects, music and recordings from Openverse (Freesound, Jamendo, Wikimedia Commons) for the Pixel Zone videos, with the licence and credit line of every file recorded. Use when a video needs a real recording (whoosh, crowd, arcade, room tone, music) rather than a synthesized or earshot-made sound, or when asked to search Openverse.
---

# openverse

Script: `.claude/skills/openverse/openverse.py` (Python standard library only; needs `api.openverse.org`,
`cdn.freesound.org` and `upload.wikimedia.org` allowed in the environment's network).

```bash
S=.claude/skills/openverse/openverse.py
python3 $S search "whoosh" --n 10 --max-dur 3           # commercial-use licences only by default
python3 $S search "arcade crowd" --source freesound
python3 $S get <id> <id> --out <project>/sfx             # writes the files + CREDITS.json + CREDITS.txt
```

Rules:
- Default to licences that allow commercial use (these are ads for a business). Never use `--any-license` results
  (NC / ND) in a published video.
- CC BY and CC BY-SA need credit: copy `CREDITS.txt` into the post caption or the project README. CC0 / PDM need none,
  but keep the manifest anyway.
- Listen before choosing: run `earshot` (its listening extra) or at least check duration and loudness with ffmpeg;
  titles on Openverse are often wrong.
- Commit `CREDITS.json` next to the video that uses the sounds.
