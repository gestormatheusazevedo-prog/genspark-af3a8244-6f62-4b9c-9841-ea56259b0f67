// Captures pixelzone.pt on an iPhone 13 viewport, step by step, up to (never including) "Enviar pedido de reserva".
// Writes assets/shots/<name>.png (viewport, 3x) + assets/shots/meta.json (tap boxes in CSS px of the 390x844 viewport, page text).
const { chromium, devices } = require('playwright'); const fs = require('fs');
const OUT = process.argv[2];
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ ...devices['iPhone 13'], deviceScaleFactor: 3, locale: 'pt-PT' });
  const p = await ctx.newPage(); const meta = {};
  const vbox = async (loc) => { const l = loc.first(); await l.scrollIntoViewIfNeeded({ timeout: 5000 }).catch(() => {});
    const bb = await l.boundingBox({ timeout: 5000 }).catch(() => null); return bb ? { x: bb.x, y: bb.y, w: bb.width, h: bb.height } : null; };
  const noSmooth = () => p.addStyleTag({ content: 'html,body,*{scroll-behavior:auto!important}' }).catch(() => {});
  const rect = async (loc) => { const bb = await loc.first().boundingBox({ timeout: 5000 }).catch(() => null); return bb ? { x: bb.x, y: bb.y, w: bb.width, h: bb.height } : null; };
  const shot = async (name, target, extra = {}) => {
    await noSmooth(); await p.waitForTimeout(900); let tap = null;
    if (target) {
      await target.first().scrollIntoViewIfNeeded({ timeout: 5000 }).catch(() => {}); await p.waitForTimeout(700);
      tap = await rect(target);
      if (tap && (tap.y < 150 || tap.y + tap.h > 700)) { await p.evaluate(dy => window.scrollBy({ top: dy, behavior: 'instant' }), tap.y - 400); await p.waitForTimeout(900); }
      tap = await rect(target);
    }
    const marks = {}; for (const [k, loc] of Object.entries(extra.marks || {})) marks[k] = await rect(loc); delete extra.marks;
    await p.screenshot({ path: `${OUT}/${name}.png` }); extra.marks = marks;
    const text = (await p.evaluate(() => document.body.innerText)).replace(/\s+/g, ' ').slice(0, 1500);
    meta[name] = { tap, text, ...extra }; console.log('shot', name, JSON.stringify(tap));
  };
  await p.goto('https://pixelzone.pt/', { waitUntil: 'domcontentloaded', timeout: 60000 }); await p.waitForTimeout(4500);
  await shot('home', p.getByRole('link', { name: /RESERVAR SESSÃO/i }));
  await p.goto('https://pixelzone.pt/reservar', { waitUntil: 'domcontentloaded', timeout: 60000 }); await p.waitForTimeout(4500);
  await shot('s1_console', p.getByRole('button', { name: /PS5/ }));
  await p.getByRole('button', { name: /PS5/ }).first().click(); await p.waitForTimeout(600);
  await shot('s1_players', p.getByRole('button', { name: '2', exact: true }));
  await p.getByRole('button', { name: '2', exact: true }).first().click(); await p.waitForTimeout(600);
  await shot('s1_day', p.getByRole('button', { name: 'Amanhã' }));
  await p.getByRole('button', { name: 'Amanhã' }).click(); await p.waitForTimeout(2500);
  const slots = await p.$$eval('button', bs => bs.map(b => b.innerText.trim().replace(/\s+/g, ' ')).filter(t => /^\d+h/.test(t)));
  const free = slots.filter(s => !/Indispon/i.test(s)); const pick = free.includes('15h') ? '15h' : free[0];
  await shot('s1_time', p.getByRole('button', { name: pick, exact: true }), { slots, pick });
  await p.getByRole('button', { name: pick, exact: true }).first().click(); await p.waitForTimeout(800);
  await shot('s1_continue', p.getByRole('button', { name: 'Continuar' }).last());
  await p.getByRole('button', { name: 'Continuar' }).last().click(); await p.waitForTimeout(3000);
  await shot('s2_duration', p.getByRole('button', { name: /^2h/ }), { marks: { h1: p.getByRole('button', { name: /^1h/ }) } });
  await p.getByRole('button', { name: /^2h/ }).first().click().catch(() => {}); await p.waitForTimeout(800);
  await shot('s2_continue', p.getByRole('button', { name: 'Continuar' }).last());
  await p.getByRole('button', { name: 'Continuar' }).last().click(); await p.waitForTimeout(3000);
  await shot('s3_form', p.getByText('Telefone', { exact: true }), { marks: { nome: p.locator('input').nth(0), tel: p.locator('input[type=tel]') } });
  // placeholder data typed on screen only; the request is never sent
  await p.locator('input').nth(0).fill('Jogador Um'); await p.waitForTimeout(400);
  await shot('s3_name', p.getByText('Telefone', { exact: true }), { marks: { nome: p.locator('input').nth(0), tel: p.locator('input[type=tel]') } });
  await p.locator('input[type=tel]').fill('+351 900 000 000'); await p.waitForTimeout(400);
  await shot('s3_filled', p.getByText('Telefone', { exact: true }), { marks: { nome: p.locator('input').nth(0), tel: p.locator('input[type=tel]') } });
  await p.locator('input[type=checkbox]').first().check({ force: true }).catch(e => console.log('privacy', e.message)); await p.waitForTimeout(500);
  await shot('s3_send', p.getByRole('button', { name: 'Enviar pedido de reserva' }), { marks: { aviso: p.getByText('A equipa confirma o horário', { exact: false }).last() } });   // shown, never clicked
  fs.writeFileSync(`${OUT}/meta.json`, JSON.stringify(meta, null, 1)); await b.close();
})();
