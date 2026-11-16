// Kisten, Boni und Lagerfeuer in einer Welt (Regeln und Daten siehe world/luck.js; die Datei heißt anders, weil Windows Luck.js und luck.js nicht unterscheidet). Die Szene ruft update(dt) auf und
// fragt nearChest (Aktionstaste öffnet die Kiste), markerTargets() (Pfeile am Bildschirmrand) und bannerLines().
import Phaser from 'phaser';
import { game } from '../state.js';
import { tr } from '../i18n.js';
import { tileToWorld, worldToTile } from './iso.js';
import { LEVEL, LEVEL_ID, buildingAt, isBlocked } from './map.js';
import { SEASON_LEVELS, skipSeason } from './season.js';
import { formatTime } from './events.js';
import { rareSkinHere, skinInfo } from '../animals/Animal.js';
import { animalIcon } from '../ui/icons.js';
import { openLuckPicker } from '../ui/luckPicker.js';
import { EVENT_GROUPS, groupsLoaded } from '../scenes/BootScene.js';
import { GHOST_ALPHA, GHOST_DEPTH, isCovered, outlineTexture } from './Boat.js';
import {
  BONI, CHARMS, CHEST_COUNT, CHEST_LEVELS, HEART_RAIN, LEVEL_EVENT, TIERS,
  activeBoni, bonusActive, campfireLeft, cardCount, chestOpened, chestState, dropBoniElsewhere, giveCharm, hasCharm, iconImg,
  luckState, ownsCharm, rerollCost, rollCards, startBonus,
} from './luck.js';

const NEAR = 40; // so nah muss man an der Kiste stehen (wie an der Werkzeug-Kiste)
const RADAR_DIST = 700; // Kisten-Kompass: Pfeil zu Kisten, die näher sind (Kachel-Abstand, y doppelt)
const CHEST_GAP = 10; // mehrere Kisten (CHEST_COUNT) stehen mindestens so viele Kacheln auseinander
const RARE_LIFE = 600; // so lange (Sekunden) bleibt das seltene Tier aus der Kiste mindestens im Gebiet
const RIDE_LEVELS = ['meadow', 'forest', 'savanna', 'asia', 'jungle', 'reef']; // dort gibt es ein Reittier (RIDES in GardenScene)
const STAND_ORIGIN_Y = 158 / 176;
const CAMPFIRE_FADE = 1400;
const CHEST_SCALE = 0.5; // die Truhe ist doppelt so groß gezeichnet
const CHEST_ORIGIN_Y = 0.93;
const GHOST_CHECK = 0.2; // so oft (Sekunden) wird geprüft, ob ein Baum o. Ä. die Truhe verdeckt (dann scheint ihre Kontur durch, wie beim Kanu)
const CARD_COLOR = { bonus: '#9a6ad8', charm: '#d0485a' };
// Tiere, die nicht im normalen Spawn-Pool stehen, sondern auf eigene Weise kommen (rufen, heranfliegen, nur bei Sonne
// oder Nebel). Ihre Karte gibt es nur, wenn sie hier und jetzt vorkommen können (when). Ist gerade keins da, wird das
// nächste, das auftaucht, die seltene Variante (Versprechen, game.rarePromise; eingelöst in Animal.rollSkin).
// at: Ort, zu dem bis dahin ein Pfeil zeigt; hint: Hinweis, wie man es bekommt
const box = (z) => ({ tx: (z.tx0 + z.tx1) / 2, ty: (z.ty0 + z.ty1) / 2 });
const CALLED = {
  hyena: { when: (l) => l.hyenas, at: (l) => l.hyenas.near, hint: tr('Kommt mit dem nächsten Hyänenrudel – streu am Elefantenfriedhof Knochen aus!', 'Comes with the next hyena pack – scatter bones at the elephant graveyard!') },
  vulture: { when: (l) => l.vultures, hint: tr('Der nächste Geier, der heranfliegt, ist es!', 'The next vulture to fly in is the one!') },
  heron: { when: (l) => l.herons, hint: tr('Der nächste Vogel, der hier landet, ist es!', 'The next bird to land here is the one!') },
  iguana: { when: (l) => l.waterfallSun, at: (l) => box(l.waterfallSun), hint: tr('Sonnt sich bald am Wasserfall!', 'Will soon be sunbathing at the waterfall!') },
  gorilla: { when: (l) => l.gorillas, at: (l) => box(l.gorillas), hint: tr('Kommt bald auf die Lichtung!', 'Will soon come to the clearing!') },
};
// seltene Varianten mit großem Kartenbild public/assets/card_<skin>.png (tools/card-images.py): auf der Karte so scharf
// wie die Glücksbringer-Bilder (die Spiel-Sprites wären dort 3- bis 4-fach vergrößert)
const CARD_SKINS = new Set([
  'cat2', 'stag', 'antelope2', 'croc_albino', 'tiger2', 'peacock2', 'orangutan2', 'frog2', 'jellyfish2', 'wolf2', 'lion2',
  'iguana2', 'panther', 'macaw2', 'snake2', 'tarantula2', 'ray2', 'gibbon', 'octopus2', 'sheep2', 'heron2', 'fox2',
  'squirrel2', 'beaver2', 'macaque2', 'anteater2', 'meerkat2', 'vulture2', 'gorilla2', 'hyena2', 'hippo2', 'panda2',
  'penguin2', 'seal2', 'seahorse2', 'toucan2', 'turtle2', 'warthog2',
]);
const CALLED_SHARE = 0.1; // so oft kommt ihre Karte (wie eine seltene Art im Spawn-Pool)

// Versprechen für dieses Gebiet (seltenes Tier aus der Kiste, das erst noch kommen muss), oder null
export function rarePromiseHere() {
  const p = game.rarePromise;
  return p && p.level === LEVEL_ID ? p : null;
}

export default class Luck {
  constructor(scene) {
    this.scene = scene;
    this.chests = []; // { spot, x, y, img, glint }
    this.standImgs = [];
    // seltenes Tier aus der Kiste (Pfeil am Rand, bis man es hat); auch ein versprochenes, das schon beim Betreten kam
    this.rareTarget = scene.animals?.find((a) => a.promised && a.state === 'wild') ?? null;
    this.timer = 0;
    this.nearChest = null;
    luckState();
    dropBoniElsewhere(); // Boni gelten nur im Gebiet ihrer Kiste
    makeTextures(scene);
    this.enabled = CHEST_LEVELS.includes(LEVEL_ID);
    if (this.enabled) this.placeChests();
    if (bonusActive('stands')) this.placeStands();
    this.known = new Set(activeBoni().map((b) => b.id));
    this.updateCampfireButton();
  }

  // --- Kisten ---

  placeChests() {
    const s = chestState();
    if (Date.now() < s.readyAt) return;
    // gemerkte Stellen behalten (dieselben Kisten nach einem Gebietswechsel); nach einem Wetterwechsel kann eine im
    // Wasser stehen, dann kommt sie woanders hin
    s.spots = s.spots.filter((p) => !isBlocked(p.tx, p.ty)).slice(0, CHEST_COUNT); // (ältere Spielstände: früher 2 Kisten)
    while (s.spots.length < CHEST_COUNT) s.spots.push(this.freeSpot(s.spots));
    for (const spot of s.spots) this.drawChest(spot);
  }

  // freie Kachel weit weg von den anderen Kisten (und nicht direkt beim Spieler, nicht in Hütten)
  freeSpot(avoid) {
    const p = this.scene.player;
    const taken = [worldToTile(p.x, p.y)];
    let t = null;
    for (let i = 0; i < 40; i++) {
      t = this.scene.randomFreeTile(taken);
      if (buildingAt(t.tx, t.ty, 1)) continue;
      if (avoid.every((a) => Math.max(Math.abs(a.tx - t.tx), Math.abs(a.ty - t.ty)) >= CHEST_GAP)) return t;
    }
    return t;
  }

  drawChest(spot) {
    const s = this.scene;
    const p = tileToWorld(spot.tx, spot.ty);
    // eine der beiden Ansichten (Schloss nach links bzw. rechts vorn); ohne Bild der gezeichnete Platzhalter
    const key = ['treasure_chest0', 'treasure_chest1'][Math.abs(spot.tx * 7 + spot.ty * 3) % 2];
    const real = s.textures.exists(key);
    const shadow = s.add.ellipse(p.x, p.y - 1, 40, 12, 0x14320a, 0.3).setDepth(p.y - 1);
    const img = s.add.image(p.x, p.y, real ? key : 'luck_chest').setOrigin(0.5, real ? CHEST_ORIGIN_Y : 0.94).setScale(real ? CHEST_SCALE : 0.85).setDepth(p.y);
    // Kontur über allem: scheint durch, wenn ein Baum die Truhe verdeckt (wie beim Kanu, siehe Boat.js)
    const ghost = s.add.image(p.x, p.y, outlineTexture(s, img.texture.key)).setOrigin(img.originX, img.originY).setScale(img.scaleX).setDepth(GHOST_DEPTH).setAlpha(0);
    const glint = s.add.image(p.x + 10, p.y - 34, 'luck_sparkle').setScale(0.5).setDepth(p.y + 1).setAlpha(0);
    s.tweens.add({ targets: glint, alpha: { from: 0, to: 1 }, scale: { from: 0.2, to: 0.6 }, duration: 600, yoyo: true, repeat: -1, repeatDelay: 900, delay: Math.random() * 1000 });
    this.chests.push({ spot, x: p.x, y: p.y, img, glint, ghost, shadow, hidden: false });
  }

  removeChests() {
    for (const c of this.chests) {
      this.scene.tweens.killTweensOf(c.glint);
      c.glint.destroy();
      c.ghost.destroy();
      c.shadow.destroy();
      this.scene.tweens.add({ targets: c.img, alpha: 0, scale: 0.7, duration: 300, onComplete: () => c.img.destroy() });
    }
    this.chests = [];
    this.nearChest = null;
  }

  // Aktionstaste an der Kiste: sie verschwindet, die Karten kommen
  openChest() {
    const s = this.scene;
    chestOpened();
    this.removeChests();
    s.updateToolbar();
    if (s.cache.audio.exists('trap')) s.sound.play('trap', { volume: 0.5 });
    this.rerolls = 0;
    this.cards = this.roll();
    s.scene.pause();
    openLuckPicker(
      () => ({ cards: this.cards.map((c) => this.view(c)), cost: rerollCost(this.rerolls), hearts: game.hearts }),
      (i) => {
        s.scene.resume();
        this.take(this.cards[i]);
      },
      () => {
        game.hearts -= rerollCost(this.rerolls);
        this.rerolls++;
        this.cards = this.roll();
        s.updateHud();
      },
    );
  }

  roll() {
    // seltene Tiere: Arten dieses Gebiets (und dieser Wetterphase) mit seltenem Skin, je häufiger, desto öfter
    const weights = Object.assign({}, ...[LEVEL.spawn, LEVEL.weatherSpawn].filter(Boolean).map((p) => p.weights));
    const total = Object.values(weights).reduce((a, b) => a + b, 0) || 1;
    const rare = Object.entries(weights)
      .filter(([, w]) => w > 0)
      .map(([species, w]) => ({ species, skin: rareSkinHere(species)?.id, share: w / total }))
      .concat(Object.entries(CALLED).filter(([, c]) => c.when(LEVEL)).map(([species]) => ({ species, skin: rareSkinHere(species)?.id, share: CALLED_SHARE })))
      .filter((c) => c.skin);
    const boni = Object.entries(BONI)
      .filter(([id, b]) => (!b.available || b.available(LEVEL_ID)) && (id !== 'ride' || RIDE_LEVELS.includes(LEVEL_ID)))
      .map(([id]) => id);
    const charms = Object.keys(CHARMS).filter((id) => !ownsCharm(id));
    return rollCards({ rare, boni, charms }, cardCount());
  }

  view(c) {
    if (c.kind === 'rare') {
      const info = skinInfo(c.species, c.skin);
      const tier = TIERS[c.tier];
      // großes Kartenbild der seltenen Variante (tools/card-images.py); sonst das Spielbild (z. B. Schoko-Giraffe),
      // Platzhalter: das Bild der Art, eingefärbt wie im Spiel
      const pic = CARD_SKINS.has(c.skin)
        ? iconImg(`card_${c.skin}`).replace('class="luck-img"', 'class="luck-img luck-animal"')
        : info?.css ? `<span style="filter:${info.css}">${safeIcon(c.species)}</span>` : safeIcon(c.skin, c.species);
      return { icon: `${pic}<span class="luck-spark">✨</span>`, title: capital(info?.name ?? c.species), text: tr('Taucht garantiert hier im Gebiet auf!', 'Guaranteed to show up in this area!'), color: tier.color, tag: tier.name };
    }
    if (c.kind === 'bonus') {
      const b = BONI[c.id];
      const minutes = hasCharm('hourglass') ? 8 : 5;
      return { icon: b.icon, title: b.name, text: b.text, color: CARD_COLOR.bonus, tag: b.instant ? tr('sofort', 'right now') : tr(`${minutes} Minuten`, `${minutes} minutes`) };
    }
    const ch = CHARMS[c.id];
    return { icon: ch.icon, title: ch.name, text: ch.text, color: CARD_COLOR.charm, tag: tr('Glücksbringer', 'Lucky charm') };
  }

  take(card) {
    const s = this.scene;
    if (card.kind === 'rare') this.spawnRare(card.species, card.skin);
    else if (card.kind === 'bonus') this.applyBonus(card.id);
    else {
      giveCharm(card.id);
      this.updateCampfireButton(); // vor der Meldung: sie richtet sich nach den sichtbaren Knöpfen oben rechts
      const ch = CHARMS[card.id];
      const worn = game.charms.equipped.includes(card.id);
      s.showToast(`${ch.icon} ${tr(`Neuer Glücksbringer: <b>${ch.name}</b>!`, `New lucky charm: <b>${ch.name}</b>!`)} ${ch.text}<br><small>${worn
        ? tr('Du trägst ihn schon.', 'You are already wearing it.')
        : tr('Anlegen kannst du ihn im Tierpark (Knopf „Glücksbringer“).', 'Put it on in the zoo (“Lucky Charms” button).')}</small>`);
    }
    s.updateHud();
  }

  // --- seltenes Tier ---

  spawnRare(species, skin) {
    const s = this.scene;
    const info = skinInfo(species, skin);
    const p = s.player;
    if (CALLED[species]) {
      // ist gerade eins da, wird es selten; sonst das nächste, das kommt
      // (keinen Vogel, der nur über die Karte fliegt oder schon wieder abfliegt: der wäre gleich weg)
      const wild = s.animals.find((a) => a.species === species && a.state === 'wild' && !a.skin && a.land !== false && a.phase !== 'leaving');
      if (wild) {
        wild.skin = skin;
        wild.life = Math.max(wild.life ?? 0, RARE_LIFE);
        this.rareTarget = wild;
        s.showToast(tr(`✨ ${capital(info?.name ?? species)} ist irgendwo im Gebiet – folge dem Pfeil!`, `✨ A ${info?.name ?? species} is somewhere in this area – follow the arrow!`));
        return;
      }
      game.rarePromise = { level: LEVEL_ID, species, skin };
      s.showToast(`✨ <b>${capital(info?.name ?? species)}</b>: ${CALLED[species].hint}`);
      return;
    }
    const pool = { population: 99, weights: { [species]: 1 } };
    let group = [];
    for (let i = 0; i < 5 && !group.length; i++) group = s.spawnOne([worldToTile(p.x, p.y)], true, pool);
    // keine Stelle frei (z. B. schon so viele Jaguare, wie in die Bäume passen): ein wildes Tier dieser Art wird selten
    if (!group.length) {
      const wild = s.animals.find((a) => a.species === species && a.state === 'wild');
      const unit = wild && (wild.herd ?? wild.colony ?? wild.troop ?? wild.school);
      if (wild) group = unit ? s.animals.filter((a) => (a.herd ?? a.colony ?? a.troop ?? a.school) === unit) : [wild];
    }
    if (!group.length) {
      s.addHearts(20);
      s.showToast(tr('Das seltene Tier hat sich versteckt – dafür gibt es <span class="heart">♥</span> 20.', 'The rare animal is hiding – you get <span class="heart">♥</span> 20 instead.'));
      return;
    }
    for (const a of group) {
      a.skin = skin;
      a.life = Math.max(a.life ?? 0, RARE_LIFE);
    }
    this.rareTarget = group[0];
    s.showToast(tr(`✨ ${capital(info?.name ?? species)} ist irgendwo im Gebiet aufgetaucht – folge dem Pfeil!`, `✨ A ${info?.name ?? species} has appeared somewhere in this area – follow the arrow!`));
  }

  // --- Boni ---

  applyBonus(id) {
    const s = this.scene;
    const b = BONI[id];
    if (id === 'eventCall') {
      const ev = LEVEL_EVENT[LEVEL_ID];
      const go = () => s.beginEvent(ev, true);
      const groups = EVENT_GROUPS[ev] ?? [];
      if (!groupsLoaded(groups)) s.afterGroupsLoaded(groups, go);
      else go();
      return;
    }
    if (id === 'heartRain') {
      s.addHearts(HEART_RAIN);
      s.showToast(`${b.icon} <b>${b.name}!</b> ${tr(`<span class="heart">♥</span> ${HEART_RAIN} für dich.`, `<span class="heart">♥</span> ${HEART_RAIN} for you.`)}`);
      s.updateHud();
      return;
    }
    startBonus(id);
    this.known.add(id);
    const minutes = hasCharm('hourglass') ? 8 : 5;
    s.showToast(`${b.icon} <b>${b.name}!</b> ${b.text} <small>(${tr(`${minutes} Minuten, nur in diesem Gebiet`, `${minutes} minutes, only in this area`)})</small>`);
    if (id === 'ride' && !groupsLoaded(EVENT_GROUPS.ride)) s.afterGroupsLoaded(EVENT_GROUPS.ride, () => s.updateMount());
    else if (id === 'ride' || id === 'toolsEverywhere') s.updateMount();
    if (id === 'stands') this.placeStands();
    s.updateEventBanner();
  }

  bonusEnded(id) {
    const s = this.scene;
    const b = BONI[id];
    if (id === 'stands') this.removeStands();
    if (id === 'ride' || id === 'toolsEverywhere') s.updateMount();
    s.showToast(`${b.icon} ${tr(`${b.name} ist vorbei.`, `${b.name} is over.`)}`);
  }

  // Bonus "2 Hochstände": wie der im Wald, an zwei freien Stellen (gemerkt, damit sie einen Wetterwechsel überstehen)
  placeStands() {
    const s = this.scene;
    const lb = game.levelBonus;
    if (!lb) return;
    this.removeStands();
    if (!lb.stands) {
      lb.stands = [];
      while (lb.stands.length < 2) lb.stands.push(this.freeSpot([...lb.stands, ...this.chests.map((c) => c.spot)]));
    }
    for (const t of lb.stands) {
      const p = tileToWorld(t.tx, t.ty);
      const img = s.add.image(p.x, p.y, 'forest_stand').setOrigin(0.5, STAND_ORIGIN_Y).setDepth(p.y).setAlpha(0);
      s.tweens.add({ targets: img, alpha: 1, duration: 500 });
      const stand = { tx: t.tx, ty: t.ty, x: p.x, y: p.y, luck: true };
      s.stands.push(stand);
      this.standImgs.push({ img, stand });
    }
  }

  removeStands() {
    const s = this.scene;
    for (const { img, stand } of this.standImgs) {
      if (s.onStand === stand) s.climbDown();
      s.stands.splice(s.stands.indexOf(stand), 1);
      if (s.nearStand === stand) s.nearStand = null;
      img.destroy();
    }
    this.standImgs = [];
    if (game.levelBonus && !bonusActive('stands')) delete game.levelBonus.stands;
    s.updateToolbar();
  }

  // --- Lagerfeuer (Glücksbringer) ---

  updateCampfireButton() {
    const btn = document.getElementById('btn-campfire');
    if (!btn) return;
    const show = hasCharm('campfire') && CHEST_LEVELS.includes(LEVEL_ID);
    btn.classList.toggle('show', show);
    if (!show) return;
    const left = campfireLeft();
    btn.disabled = left > 0;
    // Handy: nur das Feuer und die Restzeit (der Name ist dort ausgeblendet, siehe .btn-label in index.html)
    const html = `<span class="charms-icon">${CHARMS.campfire.icon}</span><span class="btn-label">${tr('Lagerfeuer', 'Campfire')}</span>${left > 0 ? `<span>${formatTime(left)}</span>` : ''}`;
    if (btn.innerHTML !== html) btn.innerHTML = html;
    btn.setAttribute('aria-label', tr('Lagerfeuer', 'Campfire'));
  }

  campfire() {
    const s = this.scene;
    if (!hasCharm('campfire') || !CHEST_LEVELS.includes(LEVEL_ID) || campfireLeft() > 0 || s.leaving || s.player.boat || s.onStand) return;
    const p = s.player;
    const here = worldToTile(p.x, p.y);
    if (buildingAt(here.tx, here.ty)) return s.showToast(tr('🔥 Drinnen geht kein Lagerfeuer – geh nach draußen.', '🔥 No campfire indoors – go outside.'));
    game.campfireAt = Date.now();
    this.updateCampfireButton();
    // ein kleines Feuer vor Henrik; dann wird es dunkel, und danach ist alles neu
    const fire = s.add.image(p.x + p.faceX * 16, p.y + 6, 'campfire').setOrigin(0.5, 0.9).setScale(0.5).setDepth(p.y + 6);
    const glow = s.add.image(fire.x, fire.y - 8, 'luck_sparkle').setBlendMode(Phaser.BlendModes.ADD).setTint(0xffa040).setScale(2.2).setDepth(fire.depth + 1).setAlpha(0.5);
    s.tweens.add({ targets: [fire], scaleY: 0.54, duration: 180, yoyo: true, repeat: -1 });
    s.tweens.add({ targets: glow, alpha: 0.25, duration: 260, yoyo: true, repeat: -1 });
    s.showToast(tr('🔥 Du setzt dich ans Lagerfeuer …', '🔥 You sit down by the campfire …'));
    s.leaving = true; // solange steht alles still
    const cam = s.cameras.main;
    cam.fadeOut(CAMPFIRE_FADE, 20, 10, 0);
    cam.once('camerafadeoutcomplete', () => {
      s.leaving = false;
      if (SEASON_LEVELS.includes(LEVEL_ID) && LEVEL_ID !== 'ice') {
        // Savanne und Dschungel: die nächste Wetterphase (das Gebiet baut sich neu auf, die wilden Tiere sind neu)
        skipSeason(LEVEL_ID);
        s.seasonTimer = 0;
        return;
      }
      // sonst: alle wilden Tiere sind weg, neue kommen
      for (const a of [...s.animals]) if (a.state === 'wild') {
        s.animals.splice(s.animals.indexOf(a), 1);
        a.destroy();
      }
      this.rareTarget = null;
      s.spawnAnimals(worldToTile(p.x, p.y));
      for (const o of [fire, glow]) s.tweens.killTweensOf(o);
      cam.fadeIn(800);
      s.tweens.add({ targets: [fire, glow], alpha: 0, delay: 4000, duration: 1500, onComplete: () => { fire.destroy(); glow.destroy(); } });
      s.showToast(tr('🔥 Ausgeruht! Ringsum sind neue Tiere unterwegs.', '🔥 Well rested! New animals are roaming around.'));
    });
  }

  // --- jeden Frame ---

  update(dt) {
    const s = this.scene;
    const p = s.player;
    const near = this.chests.find((c) => Math.hypot(c.x - p.x, (c.y - p.y) * 2) < NEAR) ?? null;
    if (near !== this.nearChest) {
      this.nearChest = near;
      s.updateToolbar();
    }
    // verdeckte Truhen: Kontur einblenden
    this.ghostTimer = (this.ghostTimer ?? 0) - dt;
    const check = this.ghostTimer <= 0;
    if (check) this.ghostTimer = GHOST_CHECK;
    for (const c of this.chests) {
      if (check) c.hidden = isCovered(s, c.img);
      const target = c.hidden ? GHOST_ALPHA : 0;
      c.ghost.setAlpha(c.ghost.alpha + (target - c.ghost.alpha) * Math.min(1, dt * 8));
    }
    this.timer -= dt;
    if (this.timer > 0) return;
    this.timer = 0.5;
    // neue Kisten, sobald die Zeit um ist
    if (this.enabled && !this.chests.length && Date.now() >= chestState().readyAt) {
      this.placeChests();
      if (this.chests.length) s.showToast(tr('🎁 Eine neue Kiste ist im Gebiet aufgetaucht!', '🎁 A new chest has appeared in this area!'));
    }
    // abgelaufene Boni
    const now = new Set(activeBoni().map((b) => b.id));
    for (const id of this.known) if (!now.has(id)) this.bonusEnded(id);
    this.known = now;
    // das seltene Tier ist gefangen oder weg
    if (this.rareTarget && (this.rareTarget.state !== 'wild' || !s.animals.includes(this.rareTarget))) this.rareTarget = null;
    this.updateCampfireButton();
  }

  // Pfeile am Bildschirmrand: [{ id, x, y, icon }]
  markerTargets() {
    const p = this.scene.player;
    const list = [];
    if (hasCharm('chestRadar')) {
      this.chests.forEach((c, i) => {
        if (Math.hypot(c.x - p.x, (c.y - p.y) * 2) < RADAR_DIST) list.push({ id: `luck-chest-${i}`, x: c.x, y: c.y - 10, icon: '🎁' });
      });
    }
    const r = this.rareTarget;
    if (r) list.push({ id: 'luck-rare', x: r.x, y: r.y - 10, icon: '✨' });
    // versprochenes seltenes Tier: Pfeil zu dem Ort, an dem es auftauchen wird (solange es dort vorkommen kann)
    const promise = rarePromiseHere();
    const called = promise && CALLED[promise.species];
    if (!r && called?.at && called.when(LEVEL)) {
      const t = called.at(LEVEL);
      const w = tileToWorld(t.tx, t.ty);
      list.push({ id: 'luck-promise', x: w.x, y: w.y - 10, icon: '✨' });
    }
    return list;
  }

  // das versprochene seltene Tier ist aufgetaucht (Animal.rollSkin): Pfeil darauf
  promiseKept(animal) {
    this.rareTarget = animal;
    animal.life = Math.max(animal.life ?? 0, RARE_LIFE);
    const info = skinInfo(animal.species, animal.skin);
    this.scene.showToast(tr(`✨ Da ist es: ${info?.name ?? animal.species} – folge dem Pfeil!`, `✨ Here it is: ${info?.name ?? animal.species} – follow the arrow!`));
  }

  // Zeilen für die Event-Anzeige oben links
  bannerLines() {
    const lines = activeBoni().map(({ id, left }) => `${BONI[id].icon} ${BONI[id].name} · ${tr(`noch ${formatTime(left)}`, `${formatTime(left)} left`)}`);
    const promise = rarePromiseHere();
    if (promise) lines.push(`✨ ${capital(skinInfo(promise.species, promise.skin)?.name ?? promise.species)} · ${tr('kommt noch', 'still to come')}`);
    return lines;
  }

  // Bild der Kiste für die Werkzeugleiste
  chestImage() {
    const key = this.nearChest?.img.texture.key;
    if (key?.startsWith('treasure_chest')) return `assets/${key}.png`;
    return this.scene.textures.get('luck_chest').getSourceImage().toDataURL?.() ?? '';
  }

  destroy() {
    for (const c of this.chests) this.scene.tweens.killTweensOf(c.glint);
  }
}

const capital = (t) => t.charAt(0).toUpperCase() + t.slice(1);

// Tierbild für die Karte; gibt es keins (z. B. kein eigenes Bild der Variante), das der Ersatz-Art
function safeIcon(species, fallback = null) {
  try {
    return animalIcon(species, 3);
  } catch {
    return fallback ? safeIcon(fallback) : '🐾';
  }
}

// Platzhalter-Bilder (bis es echte gibt): Schatzkiste, Funkeln, Lagerfeuer – doppelt so groß gezeichnet (Anzeige halb so groß)
function makeTextures(scene) {
  if (!scene.textures.exists('luck_chest')) {
    const tex = scene.textures.createCanvas('luck_chest', 64, 60);
    const c = tex.getContext();
    c.fillStyle = 'rgba(20, 50, 10, 0.3)';
    c.beginPath();
    c.ellipse(32, 54, 28, 6, 0, 0, Math.PI * 2);
    c.fill();
    // Kasten
    c.fillStyle = '#8a5124';
    c.fillRect(8, 28, 48, 26);
    c.fillStyle = '#a8662e';
    c.fillRect(8, 28, 48, 8);
    // Deckel (gewölbt)
    c.fillStyle = '#b8743a';
    c.beginPath();
    c.moveTo(6, 30);
    c.quadraticCurveTo(32, 2, 58, 30);
    c.closePath();
    c.fill();
    // goldene Bänder und Schloss
    c.fillStyle = '#f4c43a';
    c.fillRect(14, 12, 6, 42);
    c.fillRect(44, 12, 6, 42);
    c.fillRect(6, 28, 52, 4);
    c.fillRect(27, 30, 10, 12);
    c.fillStyle = '#6b4a10';
    c.fillRect(31, 34, 2, 5);
    c.strokeStyle = '#3a2210';
    c.lineWidth = 2;
    c.strokeRect(8, 30, 48, 24);
    c.beginPath();
    c.moveTo(6, 30);
    c.quadraticCurveTo(32, 2, 58, 30);
    c.stroke();
    tex.refresh();
  }
  if (!scene.textures.exists('luck_sparkle')) {
    const tex = scene.textures.createCanvas('luck_sparkle', 32, 32);
    const c = tex.getContext();
    const g = c.createRadialGradient(16, 16, 0, 16, 16, 16);
    g.addColorStop(0, 'rgba(255, 255, 230, 1)');
    g.addColorStop(0.3, 'rgba(255, 230, 120, 0.8)');
    g.addColorStop(1, 'rgba(255, 210, 80, 0)');
    c.fillStyle = g;
    c.beginPath();
    for (let i = 0; i < 8; i++) {
      const a = (i * Math.PI) / 4;
      const r = i % 2 ? 6 : 16;
      c.lineTo(16 + Math.cos(a) * r, 16 + Math.sin(a) * r);
    }
    c.closePath();
    c.fill();
    tex.refresh();
  }
  if (!scene.textures.exists('campfire')) {
    const tex = scene.textures.createCanvas('campfire', 56, 60);
    const c = tex.getContext();
    // Holzscheite über Kreuz
    c.strokeStyle = '#6b4224';
    c.lineWidth = 7;
    c.lineCap = 'round';
    c.beginPath();
    c.moveTo(10, 52);
    c.lineTo(46, 40);
    c.moveTo(10, 40);
    c.lineTo(46, 52);
    c.stroke();
    // Flammen
    const flame = (x, w, h, col) => {
      c.fillStyle = col;
      c.beginPath();
      c.moveTo(x - w, 46);
      c.quadraticCurveTo(x - w, 46 - h * 0.6, x, 46 - h);
      c.quadraticCurveTo(x + w, 46 - h * 0.6, x + w, 46);
      c.closePath();
      c.fill();
    };
    flame(28, 14, 40, '#e8483f');
    flame(28, 10, 30, '#ff9a2a');
    flame(28, 6, 18, '#ffe27a');
    tex.refresh();
  }
}
