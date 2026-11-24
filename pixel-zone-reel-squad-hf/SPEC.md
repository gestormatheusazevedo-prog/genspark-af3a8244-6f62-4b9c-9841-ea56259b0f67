# SPEC · Pixel Zone · "Qual é o seu squad?" (HyperFrames remake)

GOAL:    the viewer recognises their own friends in the four archetypes and tags their squad.
OUTPUT:  HyperFrames, 1080 x 1920, 30 fps, Instagram Reels (safe zone: reels, y 269-1248, x 65-1015).
TIME:    24.0 s x 30 = 720 frames. Narration is the clock. Music: "Circuit Synthwave" (CC0) at 124.1 BPM
         (14.5 frames/beat), entered at 17.595 s so bar 16 lands on the unlock at 13.40 s.
LOOK:    the brand's own neon-arcade medium (from the Pixel Zone keyframes):
         ground #05060f flat, a 140 px cyan (#28e6ff) light wall on the left edge and a magenta (#ff2dc8) one on the right,
         nothing else on the ground; ink #ffffff; per-player accent: P1 cyan, P2 magenta, P3 #a05aff, P4 gold #ffc428,
         Lagzilla #a05aff; one accent per frame region.
         Display: Barlow Condensed ExtraBold Italic, hook 200 px / -1% tracking, card names 76 px, header 84 px;
         body: Barlow Condensed Bold Italic 40 px. Neon = 6 px stroke + one 18 px glow of the same hue (brand use only).
OBJECTS: the select screen: 5 chamfered slots (168 x 175), a card (900 x 510, 40 px chamfer) per player with a neon
         line avatar, a prop that reads without a label (controller with "!", crown with "#1", clock with "+1",
         snack bag), two stat bars with numbers; Lagzilla (real cut-out) for the secret; the real lounge photos.
MOTION:  enter = expo.out 0.40 s (cards morph out of the clicked slot, blur 12 -> 0);
         exit = power3.in 0.18 s whip left, blur 10; camera/world = power2.inOut 0.65 s;
         words land per word, blur 6 -> 0 in 0.13 s, 0.08 s apart; bars fill power2.out 0.6 s, stagger 0.25 s;
         slot click = squash to 0.92 and back, back.out(2) 0.25 s; chips pop back.out(1.8) 0.3 s, 0.08 s apart.
SHOTS:   0-3.05    hook: "4 AMIGOS" on frame 0, "1 CONSOLA" and "QUAL É O SEU SQUAD?" land on their words;
                   slots pop in at 2.3; text blurs out 2.85 -> header lands. Sound: music bed (filtered), one pop.
         3.05-5.95 P1: cursor clicks slot 1, the slot morphs into the card; DESCULPAS 99 / HABILIDADE 12. Click + whoosh A.
         5.95-7.95 P2: same mechanic, whip out of P1; EGO 99 / PACIÊNCIA 3. Whoosh B.
         7.95-10.5 P3: timer "JOGANDO HÁ 3:00:00" runs; PARTIDAS 99 / HORA DE IR 0. Whoosh C.
         10.5-13.4 P4: badge LENDÁRIO; GENEROSIDADE 99 / RARIDADE 100. Whoosh A (new take).
                   12.9 cursor clicks "?", glitch; 12.95-13.40 the frame dips 40% while a riser climbs and the music
                   filter closes (the one held breath of the film).
         13.4-17.1 SECRET: impact on bar 16, purple colour flood 0.4 s, Lagzilla card lands (back.out), stamp
                   "DESBLOQUEADO!"; music opens fully (the one music change).
         17.1-20.85 SQUAD: the card becomes the world (clip opens onto the lounge photos, 0.65 s);
                   "SQUAD / COMPLETO" per word; four PRONTO chips pop; "6 € / hora por consola · até 4 jogadores".
         20.85-24  CTA: vertical whip; Pixel Zone logo, "MARCA O / SEU SQUAD", "Reserva no link da bio"; holds 2.9 s.
         Captions (narration P1-secret only; hook, squad and CTA already show their words): 2-3 words, y 1140-1240.
BANNED:  floating particles; breathing/pulsing camera; click rings; synthesized tones/chimes/dings; logo docked in a
         corner; text moving while read; everything fading-and-sliding-up; same whoosh on every cut;
         a scrolling grid floor; dark void with small floating elements (the card fills 83% of the width).
QA:      t=0.0 hook readable as a thumbnail; t=4.5 P1 card fully landed with both numbers; t=13.2 dipped frame before
         the unlock; t=13.8 Lagzilla card + stamp; t=18.6 squad chips; t=23.5 CTA; captions never under platform UI.
