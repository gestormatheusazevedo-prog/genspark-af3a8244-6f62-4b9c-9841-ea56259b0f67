# SPEC · Pixel Zone · Como reservar em pixelzone.pt (HyperFrames)

GOAL:    the viewer knows the 3 booking steps and that payment is at the venue, then books via the bio link.
OUTPUT:  HyperFrames 1080 x 1920, 30 fps, Instagram Reels (safe zone reels: y 269-1248, x 65-1015). 29.4 s = 882 frames.
SOURCE:  live captures of pixelzone.pt on 24/11/2026 (iPhone 13 viewport 390x664 CSS, 3x), tools/capture.cjs. Nothing sent:
         the flow stops before "Enviar pedido de reserva"; the form shows placeholder data ("Jogador Um", +351 900 000 000).
LOOK:    plain ground #05060f (no cyan/magenta edge walls: the owner disliked them); Barlow Condensed ExtraBold Italic headers 82 px; real screens at 2x
         in a 780 x 710 phone window (12 px bezel); dimmed lounge photo in the band under the platform UI.
MOTION:  camera pans the page power2.inOut 0.7 s; each tap = finger arrives power2.inOut 0.2-0.32 s, presses 0.78 for 0.07 s,
         the next real screen settles 1.02 -> 1 expo.out 0.25 s; headers blur-swap 0.15 s; detail circles draw in 0.35 s.
SHOTS:   0-3.6 hook: "RESERVA NO PIXEL ZONE / EM 3 PASSOS" whole on frame 0 (178 px, punch 1.08 -> 1); 0.3-1.9 the phone flicks
         through the real step screens (time, duration, filled form, Enviar) as a preview, then back home · 3.6-7.5 home, tap RESERVAR SESSÃO ·
         7.5-11.8 step 1: PS5, 2 players, Amanhã, 15h, one tap per spoken word · 11.8-16.3 step 2: duration, 6,00 € circled ·
         16.3-19.8 step 3: name, phone, Enviar (not sent) · 19.8-22.9 "A equipa confirma o horário. Pagamento no espaço." circled ·
         22.9-29.4 CTA: logo, SEG–SÁB 11H–20H, RESERVA PELO LINK NA BIO, Lagzilla (no repeated "3 passos" line: owner's call).
BANNED:  coloured edge light walls; repeating the hook at the end; click rings; fake confirmation screens; invented prices or hours; particles; logo in a corner; synthesized tones.
