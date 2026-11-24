// Screenshots vom laufenden Spiel, ohne sich durch Vorschau, Startbildschirm und Mavis Begrüßung zu klicken.
//
//   node tools/screenshot.cjs [Optionen]
//
//   --level park        Startgebiet (wie ?level=…, z. B. forest, savanna, ice, aquarium)
//   --size pc           pc (1400×800), phone (844×390, Touch), tablet (1280×800, Touch) oder z. B. 1024x768
//   --click "#btn-events"   nach dem Start anklicken (mehrfach möglich, in dieser Reihenfolge)
//   --key e             Taste drücken (mehrfach möglich; läuft nach den Klicks); --key w:800 hält sie 800 ms;
//                       --key move@700,300 bewegt die Maus dorthin, --key click@700,300 klickt dort;
//                       --key drag@600,350-500,200 zieht einen Finger von dort nach dort (Touch), hold@… ebenso,
//                       lässt aber nicht los (Bild mitten im Ziehen)
//   --wait 1500         Millisekunden nach den Klicks/Tasten bis zum Bild
//   --out shot.png      Zieldatei (Standard: tools/shots/<level>-<size>.png, der Ordner ist in .gitignore)
//   --port 5181         Test-Port; läuft dort kein Server, startet das Skript selbst einen (vite) und beendet ihn danach
//   --keep-mavi         Mavis Sprechblasen nicht wegklicken
//   --eval "js"         nach Mavi im Spiel ausführen (window.__game, window.__state), z. B. Möbel setzen und die Szene
//                       neu starten; danach 3 s warten
//
// Ablauf: Vorschau gilt als gesehen (localStorage), Startbildschirm → Test-Spiel (speichert nie), warten bis die
// Herzen oben links stehen, Mavis Sprechblasen wegdrücken, Klicks/Tasten, Bild. Fehler der Seite landen in der Konsole.
// Playwright: aus node_modules oder aus dem npx-Cache (npx playwright …); der Tablet-Server (5173) bleibt unberührt.
const fs = require('fs');
const path = require('path');
const http = require('http');
const { spawn } = require('child_process');

function loadPlaywright() {
  try {
    return require('playwright');
  } catch {}
  const cache = path.join(process.env.LOCALAPPDATA ?? '', 'npm-cache', '_npx');
  for (const d of fs.existsSync(cache) ? fs.readdirSync(cache) : []) {
    const p = path.join(cache, d, 'node_modules', 'playwright');
    if (fs.existsSync(p)) return require(p);
  }
  console.error('Playwright fehlt: einmal "npx playwright install chromium" ausführen.');
  process.exit(1);
}

const args = { level: 'park', size: 'pc', click: [], key: [], wait: 1200, port: 5181, out: null, keepMavi: false, eval: null };
const argv = process.argv.slice(2);
for (let i = 0; i < argv.length; i++) {
  const k = argv[i].replace(/^--/, '');
  if (k === 'keep-mavi') args.keepMavi = true;
  else if (k === 'click' || k === 'key') args[k].push(argv[++i]);
  else args[k] = argv[++i];
}
const SIZES = { pc: [1400, 800, false], phone: [844, 390, true], tablet: [1280, 800, true] };
const [w, h, touch] = SIZES[args.size] ?? [...args.size.split('x').map(Number), false];
const root = path.join(__dirname, '..');
const out = path.resolve(args.out ?? path.join(__dirname, 'shots', `${args.level}-${args.size}.png`));
fs.mkdirSync(path.dirname(out), { recursive: true });
const url = `http://localhost:${args.port}/`;

const up = () => new Promise((res) => http.get(url, (r) => (r.resume(), res(true))).on('error', () => res(false)));

(async () => {
  let server = null;
  if (!(await up())) {
    server = spawn('npx', ['vite', '--port', String(args.port), '--strictPort'], { cwd: root, shell: true, stdio: 'ignore' });
    for (let i = 0; i < 60 && !(await up()); i++) await new Promise((r) => setTimeout(r, 500));
  }
  const { chromium } = loadPlaywright();
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage({ viewport: { width: w, height: h }, hasTouch: touch, isMobile: touch });
    page.on('pageerror', (e) => console.log('Seitenfehler:', e.message));
    await page.addInitScript(() => localStorage.setItem('my-little-zoo-tour', '1')); // Vorschau überspringen
    await page.goto(`${url}?test&level=${args.level}${touch ? '&touch' : ''}`);
    await (await page.waitForSelector('[data-act=test]', { timeout: 60000 })).click();
    await page.waitForFunction(() => document.querySelector('#hud .hearts'), null, { timeout: 120000 });
    // Mavis Sprechblasen (sie fängt erst kurz nach dem Start an): Taste drücken, bis 2,5 s lang keine mehr offen war
    let quiet = 0;
    for (let i = 0; i < 120 && !args.keepMavi && quiet < 2500; i++) {
      const talking = await page.evaluate(() => document.getElementById('speech-catch')?.classList.contains('show'));
      if (talking) {
        quiet = 0;
        await page.keyboard.press('Enter');
      } else quiet += 250;
      await page.waitForTimeout(250);
    }
    if (args.eval) {
      await page.evaluate(args.eval);
      await page.waitForTimeout(3000);
    }
    for (const sel of args.click) {
      await page.click(sel, { timeout: 10000 });
      await page.waitForTimeout(400);
    }
    for (const k of args.key) {
      // „w:800“: Taste so viele Millisekunden halten (z. B. Henrik laufen lassen)
      const [key, ms] = k.split(/:(?=\d+$)/);
      const mouse = k.match(/^(move|click)@(\d+),(\d+)$/); // „move@700,300“ bzw. „click@700,300“: Maus im Spielbild
      const finger = k.match(/^(drag|hold)@(\d+),(\d+)-(\d+),(\d+)$/); // Finger ziehen (Touch-Ereignisse über CDP)
      if (finger) {
        const [x1, y1, x2, y2] = finger.slice(2).map(Number);
        const cdp = await page.context().newCDPSession(page);
        const at = (type, x, y) => cdp.send('Input.dispatchTouchEvent', { type, touchPoints: type === 'touchEnd' ? [] : [{ x, y }] });
        await at('touchStart', x1, y1);
        for (let s = 1; s <= 12; s++) {
          await page.waitForTimeout(30);
          await at('touchMove', x1 + ((x2 - x1) * s) / 12, y1 + ((y2 - y1) * s) / 12);
        }
        if (finger[1] === 'drag') await at('touchEnd');
      } else if (mouse) {
        await page.mouse.move(Number(mouse[2]), Number(mouse[3]), { steps: 5 });
        if (mouse[1] === 'click') await page.mouse.click(Number(mouse[2]), Number(mouse[3]));
      } else if (ms) {
        await page.keyboard.down(key);
        await page.waitForTimeout(Number(ms));
        await page.keyboard.up(key);
      } else await page.keyboard.press(k);
      await page.waitForTimeout(300);
    }
    await page.waitForTimeout(Number(args.wait));
    await page.screenshot({ path: out });
    console.log(out);
  } finally {
    await browser.close();
    if (server) spawn('taskkill', ['/pid', String(server.pid), '/T', '/F'], { shell: true, stdio: 'ignore' });
  }
})();
