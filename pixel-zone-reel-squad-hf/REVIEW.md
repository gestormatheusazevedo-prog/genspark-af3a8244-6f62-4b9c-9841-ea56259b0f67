# REVIEW · "Qual é o seu squad?" (HyperFrames)

## Creative calls
- Remake of `../pixel-zone-reel-squad` (same approved script and story), so no new storylines were proposed.
- Layout rebuilt for the Instagram Reels safe zone (y 269-1248, x 65-1015): card 900 x 510, slots under it, captions at y 1145.
  The band under the platform UI shows the real lounge (dimmed) instead of empty ground; Lagzilla rises into it on the CTA.
- Cards morph out of the clicked slot (the click causes the card); exits whip left; one held breath before the unlock
  (frame dips 40%, riser, music filter closes) and the one music change on bar 16 (filter opens, impact).
- The squad scene is the card becoming the world (clip opens onto the lounge photos).
- Captions only where the narration says something the screen does not (P1 to the secret); "DESBLOQUEADO:" dropped
  because the stamp already shows it.
- Two narration lines re-recorded after Whisper misheard them: "Player 1 perdeu?" (heard as "o player não perdeu") ->
  "O 1 perdeu?", and the Lagzilla line (heard as "laxila que cumpola") -> "Desbloqueado: o Lagzilla. Que culpa o lag."

## Measured / looked at / not checked
- `check --safe-zone reels`: ok. Kept warnings: `line_unread` on the hook question (it carries on screen as the header,
  so the line stays readable; only the element changes), `gsap_repeated_fromto_without_baseline` on the number
  counters (plain objects, not DOM), `timeline_track_too_dense` (17 audio clips on the root).
- `snapshot --review` and a second snapshot after fixes: every beat, seam and the phone sheet looked at.
- Rendered audio (`hyperframes audio`): -15.7 LUFS integrated, true peak -1.4 dBTP, no clipping. Unlock: -19.7 dB RMS in
  the riser, -13.1 dB on the impact. Whisper on the final mix reads every narration line correctly.
- **Not heard by anyone**: the sound was measured, not listened to. The music choice was made on tempo and loudness only.

## Weakest shot and next steps
- P3/P4 cards share the same mechanic as P1/P2; with more time each would get its own small act (the clock spinning,
  the snack bag dropping in).
- The line-avatars are still drawn silhouettes; illustrated friends would carry the jokes better.
