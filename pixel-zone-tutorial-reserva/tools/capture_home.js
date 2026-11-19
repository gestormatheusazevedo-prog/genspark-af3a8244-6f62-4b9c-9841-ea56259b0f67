const { chromium, devices } = require('playwright');
(async () => {
  const b = await chromium.launch(); const ctx = await b.newContext({ ...devices['iPhone 13'], deviceScaleFactor: 3, locale: 'pt-PT' }); const p = await ctx.newPage();
  await p.goto('https://pixelzone.pt/', { waitUntil: 'domcontentloaded', timeout: 60000 }); await p.waitForTimeout(4500);
  const info = await p.evaluate(() => { const out = []; for (const e of document.querySelectorAll('nav, [role=navigation], footer *, div')) { const t = (e.innerText || '').replace(/\s+/g, ' ').trim(); const r = e.getBoundingClientRect();
      if (/Jogar Loja Eventos A minha conta/.test(t) && t.length < 60 && r.top > 400 && r.height < 140) { out.push(e.tagName + ' ' + getComputedStyle(e).position + ' ' + r.top); e.style.setProperty('display', 'none', 'important'); } } return out; });
  console.log(JSON.stringify(info)); await p.screenshot({ path: process.argv[2] + '/home.png', fullPage: true }); await b.close();
})();
