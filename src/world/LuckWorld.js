// Kisten, Boni und Lagerfeuer in einer Welt (Regeln und Daten siehe world/luck.js; die Datei heißt anders, weil Windows Luck.js und luck.js nicht unterscheidet). Die Szene ruft update(dt) auf und
// fragt nearChest (Aktionstaste öffnet die Kiste), markerTargets() (Pfeile am Bildschirmrand) und bannerLines().
import Phaser from 'phaser';
import { ownsMount } from './mounts.js';
import { game } from '../state.js';
import { tr } from '../i18n.js';
import { tileToWorld, worldToTile } from './iso.js';
import { LEVEL, LEVEL_ID, MAP_H, MAP_W, biomeOf, buildingAt, charAt, exitAt, isBlocked } from './map.js';
import { SEASON_LEVELS, skipSeason } from './season.js';
import { formatTime } from './events.js';
import { rareSkinHere, skinInfo } from '../animals/Animal.js';
import { animalIcon, animalIconFit } from '../ui/icons.js';
import { openLuckPicker } from '../ui/luckPicker.js';
import { EVENT_GROUPS, groupsLoaded } from '../scenes/BootScene.js';
import { GHOST_ALPHA, GHOST_DEPTH, isCovered, outlineTexture } from './Boat.js';
import {
  BONI, CHARMS, CHARM_SCOPE, CHEST_COUNT, CHEST_LEVELS, HEART_RAIN, LEVEL_EVENT, TIERS,
  activeBoni, bonusActive, campfireLeft, cardCount, chestOpened, chestState, dropBoniElsewhere, giveCharm, hasCharm, iconImg,
  inExpedition, luckState, ownsCharm, rerollCost, rollCards, startBonus,
} from './luck.js';
import { RUN_BONI, addUnit, moreUnitsNow, runBonusTag } from './expedition.js';
import { coveredAt } from './expeditionMaps.js';
import { sideRecord } from './sideMaps.js';
import { countChestPick } from '../sessions.js';
import { LEVELS } from './levels.js';
import { DECOR, chestDecor, learnBlueprint, boothBlueprints } from './decor.js';
import { shopDef } from './shops.js';

const NEAR = 40; // so nah muss man an der Kiste stehen (wie an der Werkzeug-Kiste)
const CROWN_MARK = 96; // Fernglas: so hoch über dem Stammfuß steht das Bild eines Tiers in der Baumkrone
const RADAR_DIST = 700; // Kisten-Kompass: Pfeil zu Kisten, die näher sind (Kachel-Abstand, y doppelt)
const CHEST_GAP = 10; // mehrere Kisten (CHEST_COUNT) stehen mindestens so viele Kacheln auseinander
const RARE_LIFE = 600; // so lange (Sekunden) bleibt das seltene Tier aus der Kiste mindestens im Gebiet
const RIDE_LEVELS = ['meadow', 'forest', 'savanna', 'asia', 'jungle', 'reef']; // dort gibt es ein Reittier (RIDES in GardenScene)
const STAND_ORIGIN_Y = 158 / 176;
const CAMPFIRE_FADE = 1400;
const CHEST_SCALE = 0.5; // die Truhe ist doppelt so groß gezeichnet
const CHEST_ORIGIN_Y = 0.93;
const GHOST_CHECK = 0.2; // so oft (Sekunden) wird geprüft, ob ein Baum o. Ä. die Truhe verdeckt (dann scheint ihre Kontur durch, wie beim Kanu)
const CARD_COLOR = { bonus: '#9a6ad8', charm: '#d0485a', deco: '#3f9a4a' };
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
  'iguana2', 'panther', 'macaw2', 'snake2', 'ray2', 'gibbon', 'octopus2', 'sheep2', 'heron2', 'fox2',
  'squirrel2', 'beaver2', 'macaque2', 'anteater2', 'meerkat2', 'vulture2', 'gorilla2', 'hyena2', 'hippo2', 'panda2',
  'penguin2', 'seal2', 'seahorse2', 'toucan2', 'turtle2', 'warthog2', 'tapir2', 'okapi2', 'tanuki2', 'yak2',
]);
const BINO_MAX = 8; // Fernglas: so viele Pfeile höchstens (in den großen Welten sonst zu viele)
let binoId = 0;
const SHEET_OK = (species) => { try { animalIcon(species); return true; } catch { return false; } };
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
    // Expedition: Kiste nur, wenn man vor dieser Map die Kistenkarte genommen hat (keine neuen nach dem Öffnen)
    if (game.expedition?.chestMap === LEVEL_ID) this.drawChest(this.freeSpot([]));
    // hinter einem Durchgang: Kiste nur, wenn sie für diesen Durchgang gewürfelt wurde (bis zum Wetterwechsel einmal)
    if (sideRecord(LEVEL_ID)?.chest) this.drawChest(this.freeSpot([]));
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
      if (LEVEL.expedition && i < 35 && coveredAt(charAt, t.tx, t.ty)) continue; // Expedition: keine Kiste hinter Bäumen
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
    this.lastChestSpot = (this.nearChest ?? this.chests[0])?.spot ?? null; // dort kommt ein Hochstand hin (Bonus)
    chestOpened();
    if (game.expedition?.chestMap === LEVEL_ID) game.expedition.chestMap = null;
    const side = sideRecord(LEVEL_ID);
    if (side) side.chest = false;
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
    const weights = LEVEL.expedition && LEVEL.home
      ? Object.fromEntries(Object.keys(LEVEL.home).map((sp) => [sp, 1])) // Expedition: nur Arten dieser Map
      : Object.assign({}, ...[LEVEL.spawn, LEVEL.weatherSpawn].filter(Boolean).map((p) => p.weights));
    const total = Object.values(weights).reduce((a, b) => a + b, 0) || 1;
    const rare = Object.entries(weights)
      .filter(([, w]) => w > 0)
      .map(([species, w]) => ({ species, skin: rareSkinHere(species)?.id, share: w / total }))
      .concat(Object.entries(CALLED).filter(([sp, c]) => (LEVEL.expedition && LEVEL.home ? !weights[sp] && LEVEL.home[sp] : c.when(LEVEL))).map(([species]) => ({ species, skin: rareSkinHere(species)?.id, share: CALLED_SHARE })))
      .filter((c) => c.skin);
    const boni = Object.entries(BONI)
      .filter(([id, b]) => (!b.available || b.available(LEVEL_ID)) && (id !== 'ride' || (RIDE_LEVELS.includes(biomeOf()) && !ownsMount(biomeOf()))))  // (gekauftes Reittier: hier reitet man schon)
      .filter(([id]) => !inExpedition() || (RUN_BONI.includes(id) && !game.expedition.boni.includes(id))) // Expedition: Boni bis zum Ende (kein Event-Ruf)
      .map(([id]) => id);
    const charms = Object.keys(CHARMS).filter((id) => !ownsCharm(id));
    // Baupläne für Deko im Tierpark (nicht auf Expeditionen): besondere Deko, in Welten ohne Expedition auch ihre eigene
    const world = biomeOf();
    // (dazu die Baupläne der Buden, die es erst aus Kisten gibt)
    const deco = inExpedition() ? [] : [...chestDecor(world, !Object.values(LEVELS).some((l) => l.expedition === world)), ...boothBlueprints()];
    return rollCards({ rare, boni, charms, deco }, cardCount());
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
      // Expedition: "Mehr Tiere" bringt ein Tier mehr je Map (in den Welten mehr Tiere im Gebiet, siehe MORE_ANIMALS)
      const text = inExpedition() && c.id === 'moreAnimals' ? tr('Auf jeder Map ein Tier mehr – und ein Platz mehr in jedem Käfig.', 'One more animal on every map – and one more spot in every cage.') : b.text;
      return { icon: b.icon, title: b.name, text, color: CARD_COLOR.bonus, tag: b.instant ? tr('sofort', 'right now') : inExpedition() ? runBonusTag() : tr(`${minutes} Minuten`, `${minutes} minutes`) };
    }
    if (c.kind === 'deco' && c.id.startsWith('stand:')) {
      const b = shopDef(c.id.slice(6));
      return { icon: iconImg(b.stand), title: b.name, text: tr('Bauplan für eine Bude: ab jetzt bestellbar.', 'Blueprint for a stand: you can order it now.'), color: CARD_COLOR.deco, tag: tr('Bauplan', 'Blueprint') };
    }
    if (c.kind === 'deco') {
      const d = DECOR[c.id];
      return { icon: iconImg(d.key), title: d.name, text: tr('Bauplan: ab jetzt bestellbar.', 'Blueprint: you can order it now.'), color: CARD_COLOR.deco, tag: tr('Bauplan', 'Blueprint') };
    }
    const ch = CHARMS[c.id];
    return { icon: ch.icon, title: ch.name, text: ch.scope ? `${ch.text}<br><i>${CHARM_SCOPE[ch.scope]}</i>` : ch.text, color: CARD_COLOR.charm, tag: tr('Glücksbringer', 'Lucky charm') };
  }

  take(card) {
    const s = this.scene;
    countChestPick(card.kind === 'rare' || card.kind === 'deco' ? card.kind : card.id); // für die Statistik
    if (card.kind === 'rare') this.spawnRare(card.species, card.skin);
    else if (card.kind === 'bonus') this.applyBonus(card.id);
    else if (card.kind === 'deco') {
      learnBlueprint(card.id);
      const name = card.id.startsWith('stand:') ? shopDef(card.id.slice(6)).name : DECOR[card.id].name;
      s.showToast(tr(`Bauplan: <b>${name}</b>. Jetzt unter „Bauen“ bestellbar.`, `Blueprint: <b>${name}</b>. Now available under “Build”.`));
    } else {
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
    if (s.expMap) {
      // eine Einheit mehr auf der Map; das nächste Tier dieser Art, das erscheint, ist die seltene Variante – es erscheint
      // so, wie diese Art eben auftaucht (Leguan versteckt im Farn, Schlange im Dickicht, Brüllaffe im Baum ...)
      game.rarePromise = { level: LEVEL_ID, species, skin };
      addUnit(species);
      s.expTopUp(worldToTile(p.x, p.y), true);
      s.expUpdateCounter();
      if (game.rarePromise) s.showToast(`✨ <b>${capital(info?.name ?? species)}</b> ${tr('ist irgendwo hier – halte die Augen offen!', 'is somewhere around here – keep your eyes open!')}`);
      return;
    }
    if (CALLED[species]) {
      // ist gerade eins da, wird es selten; sonst das nächste, das kommt
      // (keinen Vogel, der nur über die Karte fliegt oder schon wieder abfliegt: der wäre gleich weg)
      const wild = s.animals.find((a) => a.species === species && a.state === 'wild' && !a.skin && a.land !== false && a.phase !== 'leaving');
      if (wild) {
        wild.skin = skin;
        wild.life = Math.max(wild.life ?? 0, RARE_LIFE);
        this.rareTarget = wild;
        s.showToast(tr(`✨ ${capital(info?.name ?? species)} ist irgendwo im Gebiet${follow(s)}!`, `✨ A ${info?.name ?? species} is somewhere in this area${followEn(s)}!`));
        return;
      }
      game.rarePromise = { level: LEVEL_ID, species, skin };
      if (s.expMap) addUnit(species); // Expedition: es kommt eins dazu
      s.showToast(`✨ <b>${capital(info?.name ?? species)}</b>: ${CALLED[species].hint}`);
      return;
    }
    const pool = { population: 99, weights: { [species]: 1 } };
    let group = [];
    for (let i = 0; i < 5 && !group.length; i++) group = s.spawnOne([worldToTile(p.x, p.y)], true, pool);
    if (group.length && s.expMap) {
      addUnit(species); // Expedition: eine Einheit mehr auf der Map (bleibt, bis man sie fängt)
      for (const a of group) a.life = Infinity;
      s.expUpdateCounter();
    }
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
    s.showToast(tr(`✨ ${capital(info?.name ?? species)} ist irgendwo im Gebiet aufgetaucht${follow(s)}!`, `✨ A ${info?.name ?? species} has appeared somewhere in this area${followEn(s)}!`));
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
    // Expedition: "Mehr Tiere" wirkt gleich auf dieser Map (nicht erst auf der nächsten)
    if (id === 'moreAnimals' && s.expMap) {
      moreUnitsNow();
      s.expTopUp(worldToTile(s.player.x, s.player.y), true);
      s.expUpdateCounter();
    }
    const minutes = hasCharm('hourglass') ? 8 : 5;
    const how = inExpedition() ? runBonusTag() : tr(`${minutes} Minuten, nur in diesem Gebiet`, `${minutes} minutes, only in this area`);
    s.showToast(`${b.icon} <b>${b.name}!</b> ${b.text} <small>(${how})</small>`);
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

  // Bonus "Hochstand": wie der im Wald, einer bei der Kiste (gemerkt, damit er einen Wetterwechsel übersteht)
  placeStands() {
    const s = this.scene;
    // Expedition: Hochstand nur auf dieser Map; sonst gilt der Bonus in der ganzen Gegend (große Map und Maps hinter den
    // Durchgängen), jede Map hat ihren eigenen Hochstand (gemerkt je Map)
    const lb = inExpedition() ? (this.runStands ??= {}) : game.levelBonus ? ((game.levelBonus.standsAt ??= {})[LEVEL_ID] ??= {}) : null;
    if (!lb) return;
    this.removeStands();
    if (!lb.stands) {
      // ein Hochstand bei der Kiste: in der Expedition die Werkzeugkiste in der Mitte der Map, sonst die geöffnete Schatzkiste
      const c = (inExpedition() && LEVEL.chests?.[0]) || this.lastChestSpot || { tx: Math.floor(MAP_W / 2), ty: Math.floor(MAP_H / 2) };
      const spot = this.standSpotNear(c);
      lb.stands = spot ? [spot] : [];
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

  // freie Kachel 2 bis 6 Kacheln von t entfernt, möglichst nah (nicht in Hütten, nicht an einem Übergang)
  standSpotNear(t) {
    let best = null;
    for (let ty = t.ty - 6; ty <= t.ty + 6; ty++) {
      for (let tx = t.tx - 6; tx <= t.tx + 6; tx++) {
        const d = Math.max(Math.abs(tx - t.tx), Math.abs(ty - t.ty));
        if (d < 2 || isBlocked(tx, ty) || buildingAt(tx, ty, 1) || exitAt(tx, ty) || charAt(tx, ty) === '#') continue;
        const dd = Math.hypot(tx - t.tx, ty - t.ty);
        if (!best || dd < best.dd) best = { tx, ty, dd };
      }
    }
    return best && { tx: best.tx, ty: best.ty };
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
    if (game.levelBonus && !bonusActive('stands')) delete game.levelBonus.standsAt;
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
    if (hasCharm('chestRadar') && !inExpedition()) { // (nur in der Erkundung)
      this.chests.forEach((c, i) => {
        if (Math.hypot(c.x - p.x, (c.y - p.y) * 2) < RADAR_DIST) list.push({ id: `luck-chest-${i}`, x: c.x, y: c.y - 10, icon: '🎁' });
      });
    }
    // Expedition: die Maps sind klein, dort braucht es keinen Pfeil zum seltenen Tier
    const r = this.scene.expMap ? null : this.rareTarget;
    if (r) list.push({ id: 'luck-rare', x: r.x, y: r.y - 10, icon: '✨' });
    list.push(...(this.scene.expMarkers?.() ?? [])); // Expedition: Pfeil zum Ausgang, wenn die Map leer ist
    if (bonusActive('binoculars')) list.push(...this.binocularTargets());
    // versprochenes seltenes Tier: Pfeil zu dem Ort, an dem es auftauchen wird (solange es dort vorkommen kann)
    const promise = rarePromiseHere();
    const called = promise && CALLED[promise.species];
    if (!r && !this.scene.expMap && called?.at && called.when(LEVEL)) {
      const t = called.at(LEVEL);
      const w = tileToWorld(t.tx, t.ty);
      list.push({ id: 'luck-promise', x: w.x, y: w.y - 10, icon: '✨' });
    }
    return list;
  }

  // Bonus "Fernglas": Pfeile am Rand zu den wilden Tieren (je Herde, Kolonie oder Rudel einer; höchstens BINO_MAX, die nächsten)
  binocularTargets() {
    const s = this.scene;
    const p = s.player;
    const units = new Map();
    for (const a of s.animals) {
      if (a.state !== 'wild' || a.gone || !SHEET_OK(a.species)) continue;
      const u = a.herd ?? a.colony ?? a.troop ?? a.school ?? a;
      if (!units.has(u)) units.set(u, a);
    }
    // dazu versteckte Schlangen und Vogelspinnen (Expedition): Pfeil zum raschelnden Dickicht
    const hidden = (s.expHiddenTargets?.() ?? []).map((h) => ({ a: { x: h.x, y: h.y, species: h.species, binoId: `t${h.key}`, hidden: true }, d: Math.hypot(h.x - p.x, (h.y - p.y) * 2) }));
    return [...[...units.values()].map((a) => ({ a, d: Math.hypot(a.x - p.x, (a.y - p.y) * 2) })), ...hidden]
      .sort((u, v) => u.d - v.d)
      .slice(0, BINO_MAX)
      .map(({ a }) => {
        // versteckt (oben in der Krone bzw. im Dickicht): das Bild steht auch im Bild über der Stelle (here)
        const up = a.inTree?.() ? CROWN_MARK : 10;
        return { id: `bino-${(a.binoId ??= ++binoId)}`, x: a.x, y: a.y - up, icon: animalIconFit(a.species, 1.5), bino: true, here: !!(a.hidden || a.inTree?.()) };
      });
  }

  // das versprochene seltene Tier ist aufgetaucht (Animal.rollSkin): Pfeil darauf
  promiseKept(animal) {
    this.rareTarget = animal;
    animal.life = Math.max(animal.life ?? 0, RARE_LIFE);
    const info = skinInfo(animal.species, animal.skin);
    this.scene.showToast(tr(`✨ Da ist es: ${info?.name ?? animal.species}${follow(this.scene)}!`, `✨ Here it is: ${info?.name ?? animal.species}${followEn(this.scene)}!`));
  }

  // Zeilen für die Event-Anzeige oben links
  bannerLines() {
    const lines = activeBoni().map(({ id, left }) => `${BONI[id].icon} ${BONI[id].name} · ${left === Infinity ? runBonusTag() : tr(`noch ${formatTime(left)}`, `${formatTime(left)} left`)}`);
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
// Zusatz "folge dem Pfeil" – nicht auf den kleinen Expeditions-Maps (dort gibt es keinen Pfeil zum seltenen Tier)
const follow = (s) => (s.expMap ? '' : ' – folge dem Pfeil');
const followEn = (s) => (s.expMap ? '' : ' – follow the arrow');

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
  // (das gemalte Lagerfeuer public/assets/campfire.png wird beim Start geladen; dieser Platzhalter nur, falls es fehlt)
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
