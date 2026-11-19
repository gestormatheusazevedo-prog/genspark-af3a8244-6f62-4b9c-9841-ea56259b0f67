const { chromium, devices } = require('playwright');
const OUT = process.argv[2]; const fs = require('fs');
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ ...devices['iPhone 13'], deviceScaleFactor: 3, locale: 'pt-PT' });
  const p = await ctx.newPage(); const meta = {};
  const box = async (loc) => { const l = loc.first(); await l.scrollIntoViewIfNeeded({ timeout: 4000 }).catch(() => {}); const bb = await l.boundingBox({ timeout: 4000 }).catch(() => null); const sy = await p.evaluate(() => scrollY); return bb ? { x: bb.x, y: bb.y + sy, w: bb.width, h: bb.height } : null; };
  const shot = async (name, taps = {}) => { await p.waitForTimeout(900); const r = {}; for (const [k, loc] of Object.entries(taps)) r[k] = await box(loc); await p.evaluate(() => scrollTo(0, 0)); await p.waitForTimeout(300);
    await p.screenshot({ path: `${OUT}/${name}.png`, fullPage: true }); const H = await p.evaluate(() => document.documentElement.scrollHeight); meta[name] = { taps: r, h: H, w: 390 }; console.log('shot', name, H, JSON.stringify(r)); };
  await p.goto('https://pixelzone.pt/', { waitUntil: 'domcontentloaded', timeout: 60000 }); await p.waitForTimeout(4000);
  await shot('home', { reservar: p.getByRole('link', { name: 'RESERVAR SESSÃO' }) });
  // the hamburger menu
  await p.getByRole('button', { name: 'Abrir menu' }).first().click().catch(() => {}); await p.waitForTimeout(1200);
  await p.screenshot({ path: `${OUT}/menu.png` }); console.log('menu');
  await p.goto('https://pixelzone.pt/reservar', { waitUntil: 'domcontentloaded', timeout: 60000 }); await p.waitForTimeout(4000);
  await shot('s1a', { ps5: p.getByRole('button', { name: /PS5/ }), j2: p.getByRole('button', { name: '2', exact: true }), amanha: p.getByRole('button', { name: 'Amanhã' }) });
  await p.getByRole('button', { name: /PS5/ }).first().click(); await p.getByRole('button', { name: '2', exact: true }).first().click();
  await p.getByRole('button', { name: 'Amanhã' }).click(); await p.waitForTimeout(2500);
  const slots = await p.$$eval('button', bs => bs.map(b => b.innerText.trim().replace(/\s+/g, ' ')).filter(t => /^\d+h/.test(t)));
  const free = slots.filter(s => !/Indispon/i.test(s)); const pick = free.includes('12h') ? '12h' : free[0];
  await shot('s1b', { slot: p.getByRole('button', { name: pick, exact: true }) });
  await p.getByRole('button', { name: pick, exact: true }).first().click(); await p.waitForTimeout(800);
  await shot('s1c', { cont: p.getByRole('button', { name: 'Continuar' }) });
  await p.getByRole('button', { name: 'Continuar' }).last().click(); await p.waitForTimeout(3000);
  await shot('s2a', { d2: p.getByRole('button', { name: /^2h/ }), d3: p.getByRole('button', { name: /^3h/ }), brinde: p.getByRole('button', { name: 'Quero 3h + brinde' }) });
  // add one combo (only on screen; nothing is sent)
  const comboCard = p.locator('text=Combo Copo Gamer').first(); const plus = comboCard.locator('xpath=ancestor::*[.//button][1]').locator('button').last();
  const plusBox = await box(plus); await plus.click().catch(e => console.log('plus', e.message)); await p.waitForTimeout(1200);
  await shot('s2b', { cont: p.getByRole('button', { name: 'Continuar' }) }); meta.s2b.taps.plus = plusBox;
  await p.getByRole('button', { name: 'Continuar' }).last().click(); await p.waitForTimeout(3000);
  await shot('s3', { nome: p.locator('input[type=text]'), tel: p.locator('input[type=tel]'), priv: p.locator('input[type=checkbox]'), enviar: p.getByRole('button', { name: 'Enviar pedido de reserva' }) });
  await p.goto('https://pixelzone.pt/conta', { waitUntil: 'domcontentloaded', timeout: 60000 }); await p.waitForTimeout(4000);
  await shot('conta', { criar: p.getByRole('button', { name: 'Criar conta gratuita' }), semconta: p.getByText('Reservar sem criar conta'), tabs: p.getByText('Torneios').last() });
  await p.screenshot({ path: `${OUT}/conta_view.png` });   // viewport only, shows the bottom tab bar
  fs.writeFileSync(`${OUT}/meta.json`, JSON.stringify(meta, null, 1)); console.log('slots', JSON.stringify(slots), 'pick', pick);
  await b.close();
})();
