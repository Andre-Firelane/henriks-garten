import Phaser from 'phaser';
import { TILE_W, TILE_H, tileToWorld, worldToTile } from '../world/iso.js';
import { raiseAt, raisedEdgeFloor,
  LEVEL,
  LEVEL_ID,
  MAP_W,
  MAP_H,
  START,
  ENCLOSURES,
  TOOL_SPOTS,
  EXITS,
  FISHPOND_TILES,
  NEAR_WATER,
  NEAR_TREES,
  NEAR_BAMBOO,
  TIGER_ZONE,
  NEAR_PATH,
  NEAR_PATH_TILES,
  inFreeArea,
  freeAreaTiles,
  inJungleHall,
  JUNGLE_TREES,
  HOT_SPRING_TILES,
  setLevel,
  groundAt,
  grassAt,
  outerWaterCorners,
  pathOuterCorners,
  grassPathCorners,
  outerLandCorners,
  isShoreWater,
  cornerGroundAt,
  objectAt,
  charAt,
  fenceAxisAt,
  isGate,
  isBlocked,
  isBlockedPoint,
  isFishpond,
  exitAt,
  nearEnclosure,
  accepts,
  BRIDGES,
  KOI_WATER,
  buildings,
  buildingAt,
  CAR_BODY,
  CAR_BODIES,
  nearSegment,
  GATE_TILES,
  enclosureAt,
  penCapacity,
  penQuotas,
  hasSlots,
  quotaKey,
  isUpgraded,
  PEN_UPGRADES,
  upgradeCost,
  bridgeArch,
  slotsShown,
  biomeOf,
  DECOR_RETURNED,
} from '../world/map.js';
import DecorMode from '../world/DecorMode.js';
import { DECOR, ensureDecor, giveDecor, placedIn, shopDecor, finalChestDecor } from '../world/decor.js';
import { LEVELS, PARK_LEVELS, isPark } from '../world/levels.js';
import { game } from '../state.js';
import { tr, locale } from '../i18n.js';
import { FARM_SPECIES, save, saveHandlers, writeSave } from '../save.js';
import Player from '../player/Player.js';
import Animal, { SPECIES, CATCH_DIST, FOLLOW_GAP, isCatchable, skinInfo, SKINS } from '../animals/Animal.js';
import Fish from '../animals/Fish.js';
import Squirrel from '../animals/Squirrel.js';
import Frog from '../animals/Frog.js';
import Heron from '../animals/Heron.js';
import Antelope from '../animals/Antelope.js';
import Zebra from '../animals/Zebra.js';
import Anteater from '../animals/Anteater.js';
import Penguin from '../animals/Penguin.js';
import Seal from '../animals/Seal.js';
import Meerkat from '../animals/Meerkat.js';
import Lion from '../animals/Lion.js';
import Giraffe from '../animals/Giraffe.js';
import Panda from '../animals/Panda.js';
import Tiger from '../animals/Tiger.js';
import Peacock from '../animals/Peacock.js';
import Butterfly, { flowerTiles } from '../animals/Butterfly.js';
import { stockTank } from '../aquarium/TankFish.js';
import Orangutan, { WAVE_DIST } from '../animals/Orangutan.js';
import Macaque from '../animals/Macaque.js';
import Cat from '../animals/Cat.js';
import Fox from '../animals/Fox.js';
import Sheep from '../animals/Sheep.js';
import Koi from '../animals/Koi.js';
import { afterPaint, hideLoading, setLoadingBackground, setLoadingProgress, showLoading } from '../ui/loading.js';
import { EVENT_GROUPS, groupOfKey, groupsLoaded, levelGroups, whenGroupsLoaded } from './BootScene.js';
import ReefFish from '../animals/ReefFish.js';
import Piranha from '../animals/Piranha.js';
import Iguana from '../animals/Iguana.js';
import Beaver from '../animals/Beaver.js';
import Jaguar from '../animals/Jaguar.js';
import Gorilla from '../animals/Gorilla.js';
import WaterfallSun from '../world/WaterfallSun.js';
import { shoreTexture, removeShoreTextures } from '../world/shore.js';
import { blendTexture, mudTexture, clearBlendCache } from '../world/groundBlend.js';
import Seahorse from '../animals/Seahorse.js';
import Octopus from '../animals/Octopus.js';
import Turtle, { CUTS_NEEDED, CUT_DIST } from '../animals/Turtle.js';
import Jellyfish, { DARK_DEPTH } from '../animals/Jellyfish.js';
import Ray from '../animals/Ray.js';
import Wolf, { NIGHT_DEPTH, WolfNight } from '../animals/Wolf.js';
import Gnu, { Migration } from '../animals/Gnu.js';
import Hippo from '../animals/Hippo.js';
import Tapir from '../animals/Tapir.js';
import Okapi from '../animals/Okapi.js';
import Elk from '../animals/Elk.js';
import Hedgehog, { leafPiles } from '../animals/Hedgehog.js';
import Boar from '../animals/Boar.js';
import Tanuki from '../animals/Tanuki.js';
import Yak, { BRUSHES_NEEDED } from '../animals/Yak.js';
import SnowLeopard from '../animals/SnowLeopard.js';
import Vulture from '../animals/Vulture.js';
import Hyena, { HyenaPack } from '../animals/Hyena.js';
import Warthog from '../animals/Warthog.js';
import RedPanda from '../animals/RedPanda.js';
import Howler, { LURE_DIST } from '../animals/Howler.js';
import Critter, { randomCritter } from '../animals/Critter.js';
import Macaw from '../animals/Macaw.js';
import BananaTool from '../tools/BananaTool.js';
import FireflyEvening, { glowTexture } from '../world/Fireflies.js';
import JungleHall from '../world/JungleHall.js';
import RopeBridge from '../world/RopeBridge.js';
import Weather from '../world/Weather.js';
import { SEASON_INFO, SEASON_LEVELS, firstSeason, seasonState, skipSeason } from '../world/season.js';
import Thicket from '../world/Thicket.js';
import Boat, { GHOST_ALPHA, GHOST_DEPTH, isCovered, outlineTexture } from '../world/Boat.js';
import Floes from '../world/Floes.js';
import Sway from '../world/Sway.js';
import MeadowLife from '../world/MeadowLife.js';
import PrayerFlags from '../world/PrayerFlags.js';
import SnowCover from '../world/SnowCover.js';
import ForestLife from '../world/ForestLife.js';
import MoorFog from '../world/MoorFog.js';
import BeaverDam from '../world/BeaverDam.js';
import YakHerd from '../world/YakHerd.js';
import LeafBushes from '../world/LeafBushes.js';
import { coveredAt } from '../world/expeditionMaps.js';
import SavannaLife from '../world/SavannaLife.js';
import SafariCars from '../world/SafariCars.js';
import Jar from '../tools/Jar.js';
import ScissorsTool from '../tools/ScissorsTool.js';
import RodTool from '../tools/RodTool.js';
import DrumTool from '../tools/DrumTool.js';
import KoiFoodTool from '../tools/KoiFoodTool.js';
import ParkFoodTool from '../tools/ParkFoodTool.js';
import { VisitorCrowd } from '../visitors/Visitor.js';
import { parkCap, AWAY_ICE_PER_VISITOR_MINUTE, AWAY_HEARTS_PER_VISITOR_MINUTE, BABY_APPEAL, BABY_BONUS, FULL_BONUS, HOUSE_VISITORS, appeal, maxVisitors, parkScore, penScore, splitHearts, penCount, isFull, releaseHearts } from '../world/visitors.js';
import { EVENTS, babyFamily, babyPlan, eventState, eventsIn, formatTime, isActive, startEvent } from '../world/events.js';
import { isEventsOpen, openEvents } from '../ui/eventsPanel.js';
import LuckWorld, { rarePromiseHere } from '../world/LuckWorld.js';
import { CHARMS, HEART_RAIN, MORE_ANIMALS, bonusActive, cardCount, chestState, hasCharm, iconImg, ownsCharm, price, rerollCost, rollCards } from '../world/luck.js';
import { enterPassage } from '../world/sideMaps.js';
import { CALLED_UNITS, RUN_LENGTH, planMap, wagonCageCount, cageSize, fitsWagon, wagonCages, isWaterAnimal, campLevel, caughtUnit, endRun, isFinalCamp, mapName, rollRunCards, run as expRun, sortWagon, startRun, takeRunCard, unitsLeft } from '../world/expedition.js';
import { isWagonOpen, openChoice, openConfirm, openWagon } from '../ui/wagon.js';
import { isCharmsOpen, openCharms } from '../ui/charms.js';
import { isLuckPickerOpen, openLuckPicker } from '../ui/luckPicker.js';
import { MAX_BOOTHS, boothCount, boothKnown, orderBooth, storedBooths } from '../world/shops.js';
import { activeId as storyActiveId } from '../story/story.js';
import { AWAY_BUYS_PER_VISITOR_MINUTE, AWAY_RIDES_PER_VISITOR_MINUTE, SHOPS, SHOP_CHANCE, TEA, TEA_CHANCE, WHEEL, allSlots, builtOn, hasIceShop, hasShop, hasWheel, shopDef, shopsIn, slotsIn, sourceDef, wheelSlot } from '../world/shops.js';
import FerrisWheel from '../world/FerrisWheel.js';
import { PEN_TOYS, toysText } from '../world/toys.js';
import Crocodile from '../animals/Crocodile.js';
import { blockedAt } from '../world/collision.js';
import Pickup from '../world/Pickup.js';
import { roundedTexture } from '../world/roundedTiles.js';
import { HD, HD_DIR, hdScale } from '../world/hd.js';
import Net from '../tools/Net.js';
import Lasso from '../tools/Lasso.js';
import TrapTool from '../tools/TrapTool.js';
import FoodTool from '../tools/FoodTool.js';
import BoneTool from '../tools/BoneTool.js';
import StickTool from '../tools/StickTool.js';
import SaltTool from '../tools/SaltTool.js';
import BrushTool from '../tools/BrushTool.js';
import LeafTool from '../tools/LeafTool.js';
import FireflyJar, { GlowJar, JAR_FULL } from '../tools/FireflyJar.js';
import LanternTool, { LANTERN_GLOW, GLOW_DEPTH } from '../tools/LanternTool.js';
import AcornTool from '../tools/AcornTool.js';
import { lanternLight } from '../world/MoorFog.js';
import BallTool from '../tools/BallTool.js';
import TreatTool from '../tools/TreatTool.js';
import Trap from '../world/Trap.js';
import { animalIcon, animalIconFit, animalIconSquare, animalIcons, hasAnimalIcon } from '../ui/icons.js';
import { touchHandlers, setTouchTool, IS_PHONE, isTouch } from '../ui/touch.js';
import { ensureFriendState, animalUid, bondOf, isFriend, friendKey, friendLevel, canPet, randomName, levelHearts, levelText, levelProgress, FRIEND_LEVELS, PET_POINTS, FEED_SORTS, SPECIES_FOOD, FEED_POINTS, FAVORITE_POINTS, canFeed, favoriteOf, ensureFeedState, unlockFeedFor, wantedSorts, nameCost } from '../world/friends.js';
import HandFoodTool from '../tools/HandFoodTool.js';
import { closeWalkHint } from '../ui/walkHint.js';
import { openBook, openJournal, isJournalOpen } from '../ui/journal.js';
import { openMenu, isMenuOpen } from '../ui/gameMenu.js';
import { openTravelMap, isTravelMapOpen } from '../ui/travelMap.js';
import { openToolChest, isToolChestOpen } from '../ui/toolChest.js';
import { countCatch, countChestPick, countEvent, countExpCard, countExpStep, countPark, countPromo, sessionLoaded } from '../sessions.js';
import { isShowcaseOpen } from '../ui/featureTour.js';
import { isGiftOpen, openGiftEvent } from '../ui/giftEvent.js';
import { STEPS, seaReady } from '../story/steps.js';
import { activeId, activeStep, countStoryCatch, isUnlocked, skipStory, storyAt } from '../story/story.js';
import { RARE_WISH_CHANCE, THANK_DIST, canWish, canWishSkin, ensureWishes, openWishes, wishHearts, wishIcon, wishKey, wishName } from '../world/wishes.js';
import Mavi from '../npc/Mavi.js';
import { isSpeaking, speechNext } from '../ui/speech.js';

// Torbogen über dem Tor des Wildparks (Bild 128 x 176, siehe drawArches): Fußpunkt, Mitte der Tafel über dem Fußpunkt,
// nutzbare Breite der Tafel und ihre Steigung (1 Pixel höher je 2 Pixel nach rechts)
const ARCH_H = 176;
const ARCH_FOOT = 156;
const ARCH_BOARD = 112;
const ARCH_BOARD_W = 70;
const ARCH_SLOPE = -0.5;

// Ganzzahliger Zoom hält die Pixel-Art scharf: etwa 360 Welt-Pixel Bildhöhe
const VIEW_H = 360;
// auf dem Handy näher heran (der Bildschirm ist klein): etwa 310 Welt-Pixel, in Viertelschritten (die meisten Bilder
// sind ohnehin hochaufgelöst, ein krummer Zoom fällt kaum auf)
const PHONE_VIEW_H = 310;
// Reihenfolge der Tierarten in der Anzeige
// Tierarten, die es nur in einer Wetterphase der Savanne gibt (für die Übersicht: "Savanne (☀️ Trockenzeit)")
const SEASON_SPECIES = { hippo: 'rain', hyena: 'dry', warthog: 'dry', vulture: 'dry' };
// Plätze für wilde Tiere: spawn gilt bei jedem Wetter, weatherSpawn (Dschungel) ist der eigene Pool der Wetterlage.
// Jeder Pool wird für sich aufgefüllt, so nehmen sich die Tiere der beiden nicht gegenseitig die Plätze weg
const HALF_SLOT = ['fish', 'koi']; // belegen nur einen halben Platz beim Spawnen (siehe wildUnits)
const spawnPools = (l) => [l.spawn, l.weatherSpawn].filter(Boolean);
const spawnWeights = (l) => Object.assign({}, ...spawnPools(l).map((p) => p.weights));
const ALL_SPECIES = ['seal', 'penguin', 'macaw', 'toucan', 'iguana', 'jaguar', 'gorilla', 'snake', 'tarantula', 'piranha', 'howler', 'anteater', 'tapir', 'okapi', 'redpanda', 'tanuki', 'yak', 'snowleopard', 'gnu', 'hippo', 'hyena', 'warthog', 'vulture', 'wolf', 'peacock', 'butterfly', 'orangutan', 'tiger', 'sheep', 'cow', 'goat', 'pig', 'cat', 'deer', 'elk', 'hedgehog', 'boar', 'fish', 'koi', 'reeffish', 'seahorse', 'octopus', 'turtle', 'ray', 'jellyfish', 'frog', 'heron', 'flamingo', 'squirrel', 'fox', 'beaver', 'antelope', 'zebra', 'meerkat', 'lion', 'crocodile', 'giraffe', 'panda', 'macaque'];
const GATE_OPEN_DIST = 44; // so nah muss man ans Tor, damit es aufgeht
const GATE_CLOSE_DELAY = 0.5; // Sekunden, bis es nach dem Durchgehen wieder erscheint
const SIGN_DIST = 50; // so nah muss man an den Wegweiser, damit er etwas anzeigt
const FRIEND_PET_DIST = 80; // so nah muss man am Tierfreund sein, um ihn (über den Zaun) zu streicheln
const FRIEND_CALL_DIST = 260; // ab Stufe 2: so nah, dann kommt der Tierfreund zum Zaun
const FRIEND_STAY_DIST = 340; // ... und so lange bleibt er dort
const FRIEND_TAG_DEPTH = 90000; // Namensschilder der Tierfreunde über allem in der Welt (die Herzen der Besucher liegen bei 100000)
// Bedürfnisse der Tiere (Blasen mit Hand oder Futter, siehe updateNeeds): höchstens so viele gleichzeitig, so lange
// bleibt eine stehen (Sekunden), so oft schaut das Spiel nach einer neuen (Sekunden)
const NEED_MAX = 3;
const NEED_TIME = 45;
const NEED_EVERY = [5, 10];
const FRIEND_BAR_DIST = 180; // so nah, dann zeigt ein Balken über dem Tierfreund, wie weit es bis zur nächsten Stufe ist
const NAME_MAX = 14; // so lang darf der Name eines Tierfreunds sein
const TOAST_MS = 6000; // so lange steht eine Meldung (Animation toast in index.html)
const TOAST_MIN_W = 260; // so breit (CSS-Pixel) muss der Platz neben dem Abzeichen oben links sein, sonst kommen Meldungen darunter
const WRONG_HOME_HINT = 6; // Sekunden zwischen zwei Hinweisen "falsches Gehege"
const SIGN_INNER_W = 38; // helle Tafel des Torschilds (Welt-Pixel), darauf die Tierbilder
const SIGN_ICON_H = 22;

// Für die Übersicht: womit man fängt (Bild, Name) und besondere Tipps je Tierart
const CATCH_TOOLS = {
  touch: ['hand', tr('Berühren', 'Touch')],
  net: ['net', tr('Kescher', 'Net')],
  lasso: ['lasso', 'Lasso'],
  trap: ['trap', tr('Falle', 'Trap')],
  food: ['food', tr('Grünfutter', 'Leafy greens')],
  scissors: ['scissors', tr('Schere', 'Scissors')],
  jar: ['jar', tr('Quallenglas', 'Jellyfish jar')],
  swim: ['hand', tr('Mitschwimmen', 'Swim along')],
  rod: ['rod', tr('Angel', 'Fishing rod')],
  herring: ['herring', tr('Fisch', 'Fish')],
  sealball: ['ball', 'Ball'],
  drum: ['drum', tr('Trommel-Duell', 'Drum duel')],
  dam: ['forest_stick', tr('Damm reparieren', 'Repair the dam')],
  leaves: ['leaf_branch', tr('Blätterzweig', 'Leafy branch')],
};
const CATCH_TIPS = {
  fish: tr('Nur wenn er nach den Luftblasen auftaucht.', 'Only when it comes up after the air bubbles.'),
  koi: tr('Streu am Ufer Fischfutter ins Wasser – dann kommen sie hoch und schnappen. Schnell keschern!', 'Scatter fish food into the water from the shore – they come up and snap at it. Net them quickly!'),
  reeffish: tr('Im Riff. Kommst du zu nah, flüchten sie – schwimm hinterher, du bist schneller. Im Aquarium ziehen sie in die Becken.', 'In the reef. If you get too close, they flee – swim after them, you are faster. At the aquarium they move into the tanks.'),
  seahorse: tr('Versteckt sich in den Korallen. Steigen Bläschen auf, schaut es gleich heraus – dann schnell keschern!', 'Hides in the corals. When bubbles rise, it peeks out – then net it quickly!'),
  butterfly: tr('Auf der Wiese bei den Blumen. Im Flug sind sie scheu – sitzt einer auf einer Blüte, schleich dich an und nimm den Kescher! Im Tierpark flattern sie frei herum.', 'On the meadow near the flowers. In flight they are shy – when one sits on a blossom, sneak up and use the net! In your zoo they flutter around freely.'),
  hippo: tr('Nur bei Starkregen in der Savanne. Im Wasser siehst du nur Augen und Ohren – warte, bis es zum Grasen ans Ufer kommt, und fang es mit dem Lasso, bevor es zurück ins Wasser trottet.', 'Only during heavy rain in the savanna. In the water you only see eyes and ears – wait until it comes ashore to graze and catch it with the lasso before it trots back into the water.'),
  tapir: tr('Im Dschungel am Fluss. Meist grast er lange am Ufer – kommst du mit leeren Händen, trottet er zurück ins Wasser. Brich am Futterstrauch einen Blätterzweig ab: Mit dem Zweig in der Hand bleibt er stehen, und du kannst ihn füttern.', 'In the jungle by the river. It usually grazes on the bank for a long time – if you come empty-handed, it trots back into the water. Break a leafy branch off a fodder bush: with the branch in your hand it stays put and you can feed it.'),
  hedgehog: tr('Im Wald, vor allem im Eichenhain. Er versteckt sich in einem Laubhaufen – raschelt einer, sitzt ein Igel darin. Schüttel Eicheln aus einer großen Eiche und leg sie direkt daneben: Dann kommt er heraus und frisst. Jetzt mit dem Kescher fangen oder einfach berühren!', 'In the forest, mostly in the oak grove. It hides in a leaf pile – if one rustles, a hedgehog is inside. Shake acorns from a big oak and put them right next to it: it comes out and eats. Now catch it with the net or just touch it!'),
  boar: tr('Im Eichenhain. Es ist scheu und rennt weg, wenn du zu nah kommst. Schüttel Eicheln aus einer großen Eiche und leg sie hin: Das Wildschwein trottet herbei und wühlt danach – jetzt das Lasso! Mit Glück ist es eine Bache, dann laufen ihr die Frischlinge hinterher.', 'In the oak grove. It is shy and runs away if you get too close. Shake acorns from a big oak and put them down: the wild boar trots over and roots for them – now the lasso! With luck it is a sow, and her piglets trot along behind her.'),
  elk: tr('Im Moor im Wald. Im Nebel siehst du nur seinen Schatten im Wasser. Hol die Moorlaterne aus der Hütte und stell sie ans Ufer – dann watet er neugierig ins Licht. Jetzt siehst du ihn: schnell das Lasso!', 'In the moor in the forest. In the fog you only see its shadow in the water. Get the moor lantern from the hut and put it down at the shore – it wades curiously into the light. Now you can see it: quick, the lasso!'),
  okapi: tr('Im Dschungel. Es ist scheu und rennt erst ein Stück weg – aber es ist auch neugierig: Lauf ihm nach, mit jedem Mal wird es mutiger und bleibt irgendwann stehen. Dann füttere es mit einem Blätterzweig vom Futterstrauch.', 'In the jungle. It is shy and first runs off a little way – but it is curious too: follow it, every time it gets braver until it stays put. Then feed it a leafy branch from a fodder bush.'),
  hyena: tr('Nur in der Trockenzeit in der Savanne, am Elefantenfriedhof oben rechts. Hörst du sie dort kichern, streu Knochen aus der Hütte – dann kommen sie. Solange sie fressen, fängst du sie mit dem Lasso.', 'Only in the dry season in the savanna, at the elephant graveyard in the top right. When you hear them giggle there, scatter bones from the hut – then they come. While they eat, catch them with the lasso.'),
  warthog: tr('Nur in der Trockenzeit in der Savanne. Kommst du näher, flitzt es in sein Erdloch. Warte mit dem Lasso in etwas Abstand davor – irgendwann schaut es kurz heraus.', 'Only in the dry season in the savanna. If you get closer, it dashes into its burrow. Wait with the lasso a little way off – sooner or later it pops out for a moment.'),
  vulture: tr('Nur in der Trockenzeit in der Savanne. Sein Schatten kreist über einer kahlen Akazie, dann landet er oben im Baum – dort erwischst du ihn mit dem Kescher.', 'Only in the dry season in the savanna. Its shadow circles over a bare acacia, then it lands up in the tree – there you can get it with the net.'),
  snowleopard: tr('Selten, auf der Hochebene im Bambuswald. Du siehst ihn erst aus der Nähe – aber er hinterlässt Pfotenspuren im Schnee. Folge ihnen: Sie führen an Felsen vorbei zu einem großen Felsen, auf dem er schläft. Fang ihn dort mit dem Lasso.', 'Rare, on the high plateau of the bamboo forest. You only see it up close – but it leaves paw prints in the snow. Follow them: they lead past rocks to a big rock where it sleeps. Catch it there with the lasso.'),
  yak: tr('Auf der Hochebene im Bambuswald. Die Herde grast am Steinhaufen. Such den Salzstein, der irgendwo im Schnee liegt, und leg ihn auf den Steinhaufen – dann kommt ein Yak zum Lecken. Bürste es dreimal, dann kommt es mit.', 'On the high plateau of the bamboo forest. The herd grazes by the cairn. Find the salt lick lying somewhere in the snow and put it on the cairn – a yak will come to lick it. Brush it three times and it comes along.'),
  tanuki: tr('Im Bambuswald bei den Steinlaternen. Er verkleidet sich als Laterne, Busch oder Grasbüschel – nur sein buschiger Schwanz schaut heraus, und manchmal wackelt die Verkleidung. Berühre sie: Puff! Dann sitzt er verdutzt da – berühre ihn schnell noch einmal.', 'In the bamboo forest by the stone lanterns. It disguises itself as a lantern, a bush or a tuft of grass – only its bushy tail peeks out, and sometimes the disguise wobbles. Touch it: poof! Then it sits there, baffled – touch it again quickly.'),
  redpanda: tr('Nur beim Glühwürmchen-Abend im Bambuswald. Er sitzt oben im Kirschbaum: fang 3 Glühwürmchen mit dem Glas, stell das leuchtende Glas vor den Baum – dann kommt er herunter und du kannst ihn berühren.', 'Only during the Firefly Evening in the bamboo forest. It sits up in a cherry tree: catch 3 fireflies with the jar, put the glowing jar in front of the tree – then it comes down and you can touch it.'),
  gnu: tr('Nur bei der Großen Wanderung in der Savanne. Ab und zu läuft ein Gnu aus der Staubwolke heraus – fang es mit dem Lasso, bevor es wieder hineinläuft!', 'Only during the Great Migration in the savanna. Now and then a wildebeest runs out of the dust cloud – catch it with the lasso before it runs back in!'),
  wolf: tr('Nur in der Wolfsnacht im Wald. Folge den leuchtenden Spuren. Heulen die Wölfe, darfst du laufen – hören sie auf und schauen sich um (👀), bleib sofort stehen! Erreichst du einen, berühre ihn.', 'Only during the Wolf Night in the forest. Follow the glowing tracks. While the wolves howl, you may walk – when they stop and look around (👀), stand still at once! When you reach one, touch it.'),
  jellyfish: tr('Nur beim Quallen-Schwarm im Riff. Mit dem Quallenglas – aber nur, wenn sie langsam sinkt! Beim Aufsteigen flutscht sie davon. Nicht anfassen, sie brennt!', 'Only during the Jellyfish Swarm in the reef. Use the jellyfish jar – but only while it slowly sinks! When it rises, it slips away. Don’t touch it, it stings!'),
  ray: tr('Schwimm neben ihm her – nicht zu nah, sonst erschrickt er, und nicht zu weit weg. Ist die Herzchen-Leiste voll, schwimmt er dir hinterher.', 'Swim alongside it – not too close or it gets scared, and not too far away. When the heart bar is full, it swims after you.'),
  turtle: tr('Selten. Hat sich in einem alten Fischernetz verheddert – hol die Schere aus dem Sack, schwimm hin und schneide sie frei: dreimal, dann ist sie frei!', 'Rare. It is tangled in an old fishing net – get the scissors from the bag, swim over and cut it free: three cuts and it is free!'),
  octopus: tr('Getarnt fast unsichtbar am Meeresboden. Kommst du näher, schwimmt sie weg – keschere sie schnell, sonst verschwindet sie in einer Tintenwolke!', 'Camouflaged and almost invisible on the sea floor. When you come closer, it swims away – net it quickly, or it vanishes in a cloud of ink!'),
  squirrel: tr('Nur wenn es vom Baum herunterkommt – halte etwas Abstand.', 'Only when it comes down from the tree – keep a little distance.'),
  heron: tr('Nur wenn er am Wasser gelandet ist.', 'Only when it has landed by the water.'),
  flamingo: tr('Nur beim Flamingo-Flug – und nur, wenn er gelandet ist.', 'Only during the Flamingo Flight – and only when it has landed.'),
  deer: tr('Scheu: aus der Ferne mit dem Lasso. Mit etwas Glück ist es ein seltener Hirsch.', 'Shy: use the lasso from a distance. With a bit of luck it is a rare stag.'),
  fox: tr('Nur mit der Falle.', 'Only with the trap.'),
  beaver: tr('Die Biber sitzen am Fluss und nagen an den Bäumen. Fangen lassen sie sich nicht – aber ihr Damm hat ein Loch! Heb im Wald einen großen Stock auf (Aktionstaste) und steck ihn am Damm ins Loch. Dann kommt ein Biber freiwillig mit.', 'The beavers sit by the river gnawing on the trees. They won’t let you catch them – but their dam has a hole! Pick up a big stick in the forest (action key) and put it into the hole in the dam. Then a beaver will come along on its own.'),
  antelope: tr('Lebt in Herden – fängst du eine, rennen die anderen weg.', 'Lives in herds – catch one and the others run away.'),
  zebra: tr('Beim Trinken am Wasserloch flieht es nicht, dann kannst du es auch berühren.', 'While drinking at the water hole it doesn’t run away – then you can even touch it.'),
  meerkat: tr('Schleich dich von hinten an – der Wächter sieht nur, was vor ihm ist.', 'Sneak up from behind – the lookout only sees what is in front of it.'),
  lion: tr('Kraulen, solange er schnarcht (Zzz). Hören die Zzz auf, bleib stehen und warte weit weg!', 'Pet it while it snores (Zzz). When the Zzz stop, stand still and wait far away!'),
  crocodile: tr('Wie beim Fisch: warte auf die Luftblasen im Wasserloch und wirf das Lasso, wenn der Kopf auftaucht.', 'Like the fish: wait for the air bubbles in the water hole and throw the lasso when its head comes up.'),
  giraffe: tr('Füttere sie mit Grünfutter, dann folgt sie dir vielleicht.', 'Feed it leafy greens and maybe it will follow you.'),
  panda: tr('Mit Grünfutter folgt er dir – aber mach einen Bogen um Bambus und hohes Gras!', 'With leafy greens it follows you – but stay away from bamboo and tall grass!'),
  peacock: tr('Scheu – kommst du zu nah, rennt er weg oder fliegt sogar davon. Warte, bis er ein Rad schlägt: dann kannst du ihn berühren oder keschern.', 'Shy – if you get too close, it runs or even flies away. Wait until it fans out its tail: then you can touch it or net it.'),
  orangutan: tr('Sitzt oben im Urwaldbaum. Stell dich ohne Werkzeug darunter und warte, bis er winkt – dann schnell zurückwinken! Dreimal geschafft, kommt er herunter.', 'Sits high up in a jungle tree. Stand underneath without a tool and wait until it waves – then quickly wave back! Do it three times and it climbs down.'),
  tiger: tr('Streift als dunkler Schatten durch den Bambus. Roll den Ball hin, geh ein Stück weg und halt Abstand, wenn er neugierig schaut. Er spielt nur kurz und flitzt dann los – schnell das Lasso!', 'Prowls through the bamboo as a dark shadow. Roll the ball over, walk away a bit and keep your distance while it looks curious. It only plays for a moment and then dashes off – quick, the lasso!'),
  gorilla: tr('Nur bei Nebel auf der Lichtung im Dschungel (unten rechts hinter dem Dickicht). Hol die Trommel aus dem Regal und trommle bei den Gorillas: einer stellt sich vor dich und trommelt auf seine Brust. Trommle genauso oft nach – drei Runden lang!', 'Only in fog, on the clearing in the jungle (bottom right, behind the thicket). Get the drum from the shelf and drum near the gorillas: one stands in front of you and beats its chest. Drum the same number of times – for three rounds!'),
  jaguar: tr('Bei jedem Wetter im Dschungel. Er schläft oben in einem Urwaldbaum – nur sein Schwanz hängt heraus und pendelt. Ab und zu springt er herunter und rennt zu einem anderen Baum, immer auf derselben Route. Merk sie dir und lauer ihm mit dem Lasso auf!', 'In the jungle in any weather. It sleeps high up in a jungle tree – only its tail hangs down and swings. Now and then it jumps down and runs to another tree, always on the same route. Remember it and lie in wait with the lasso!'),
  iguana: tr('Nur bei normalem Wetter am Wasserfall im Dschungel (hinter dem Dickicht oben links). Warte, bis die Sonne auf den Wasserfall scheint: dann sonnen sich die Leguane auf den Steinen. Fang sie mit dem Kescher aus etwas Abstand – kommst du dem Stein zu nah, plumpsen sie ins Wasser!', 'Only in normal weather at the waterfall in the jungle (behind the thicket, top left). Wait until the sun shines on the waterfall: then the iguanas bask on the rocks. Catch them with the net from a little distance – get too close to the rock and they plop into the water!'),
  toucan: tr('Nur bei Starkregen im Dschungel. Der Tukan sitzt allein in den Bäumen am Fluss. Fliegt er ans andere Ufer, geht er über dem Wasser in den Tiefflug – dann erwischst du ihn mit dem Kescher, am besten vom Kanu aus!', 'Only in heavy rain in the jungle. The toucan sits alone in the trees by the river. When it flies to the other bank, it swoops low over the water – then you can catch it with the net, best from the canoe!'),
  macaw: tr('Aras sitzen paarweise in den Bäumen am Fluss. Fliegen sie ans andere Ufer, gehen sie über dem Wasser in den Tiefflug – dann erwischst du sie mit dem Kescher, am besten vom Kanu aus!', 'Macaws sit in pairs in the trees by the river. When they fly to the other bank, they swoop low over the water – then you can catch them with the net, best from the canoe!'),
  snake: tr('Sie versteckt sich im Dickicht. Schlag Dickicht mit der Machete weg – manchmal schreckt eine auf und flieht ins nächste Gebüsch: schnell mit dem Kescher fangen!', 'It hides in the thicket. Cut thicket with the machete – sometimes one gets startled and flees into the next bush: quick, catch it with the net!'),
  piranha: tr('Nur bei Starkregen im Dschungel: im Fluss wirbeln Piranha-Schwärme als dunkle Schatten. Hol die Angel aus dem Regal, paddle mit dem Kanu hin und wirf aus. Zuckt die Pose und erscheint ein „!“, schnell noch einmal drücken!', 'Only during heavy rain in the jungle: piranha schools swirl as dark shadows in the river. Get the fishing rod from the shelf, paddle there in the canoe and cast. When the float jerks and a “!” appears, press again quickly!'),
  tarantula: tr('Sie versteckt sich im Dickicht. Schlag Dickicht mit der Machete weg – manchmal schreckt eine auf und flieht ins nächste Gebüsch: schnell mit dem Kescher fangen!', 'It hides in the thicket. Cut thicket with the machete – sometimes one gets startled and flees into the next bush: quick, catch it with the net!'),
  seal: tr('Schwimmt in der Eiswelt am Ufer (nachts auch in den Eislöchern). Kommst du näher, taucht sie auf und wünscht sich einen Fisch oder einen Ball – hol das Richtige aus dem Regal und wirf es ihr zu, wie das Lasso. Daneben? Nach 2 Sekunden kannst du noch einmal werfen. Zu nah, und sie taucht ab!', 'Swims along the shore in the ice world (at night also in the ice holes). If you get closer, it pops up and wishes for a fish or a ball – get the right one from the shelf and throw it, like the lasso. Missed? After 2 seconds you can throw again. Too close, and it dives away!'),
  penguin: tr('In der Eiswelt, immer nah am Wasser. Kommst du zu nah, hüpft er ins Wasser und ist weg – wirf das Lasso aus etwas Abstand!', 'In the ice world, always close to the water. If you get too close, it hops into the water and is gone – throw the lasso from a little distance!'),
  anteater: tr('Er ist scheu und rennt weg – fang ihn mit dem Lasso. Ab und zu stellt er sich an einen Urwaldbaum und schleckt Ameisen: dann kannst du ihn sogar berühren. Durchs Dickicht läuft er einfach hindurch!', 'It is shy and runs away – catch it with the lasso. Now and then it stands up against a jungle tree and licks up ants: then you can even touch it. It simply walks straight through the thicket!'),
  howler: tr('Er sitzt unsichtbar oben im Urwaldbaum – nur wenn er springt, raschelt es und er brüllt. Merk dir den Baum, leg eine Banane unten hin, und wenn er herunterkommt und frisst: schnell das Lasso! Mit etwas Glück ist es ein seltener Gibbon.', 'It sits unseen high up in a jungle tree – only when it jumps do the leaves rustle and it howls. Remember the tree, put a banana at its foot, and when it comes down to eat: quick, the lasso! With a bit of luck it is a rare gibbon.'),
  macaque: tr('Aus der heißen Quelle kriegst du ihn nicht. Warte, bis er herausspringt – dann schnell das Lasso!', 'You can’t get it out of the hot spring. Wait until it jumps out – then quick, the lasso!'),
};

// Kurzfassung der Fang-Tipps für die Meldung draußen (Handy: lange Texte verdecken das Bild und sind zu schnell weg).
// Nur der Kern, was zu tun ist – die ausführliche Fassung steht im Tierbuch
const CATCH_TIPS_SHORT = {
  fish: tr('Keschern, wenn er nach den Luftblasen auftaucht.', 'Net it when it comes up after the bubbles.'),
  koi: tr('Fischfutter ins Wasser streuen, dann keschern.', 'Scatter fish food, then net them.'),
  reeffish: tr('Hinterherschwimmen – du bist schneller!', 'Swim after them – you are faster!'),
  seahorse: tr('Steigen Bläschen auf, schnell keschern!', 'When bubbles rise, net it quickly!'),
  butterfly: tr('Sitzt er auf einer Blüte: anschleichen, keschern!', 'When it sits on a flower: sneak up, net it!'),
  hippo: tr('Grast es am Ufer: schnell das Lasso!', 'When it grazes ashore: quick, the lasso!'),
  tapir: tr('Mit einem Blätterzweig füttern.', 'Feed it a leafy branch.'),
  hedgehog: tr('Eicheln neben den raschelnden Laubhaufen legen.', 'Put acorns next to the rustling leaf pile.'),
  boar: tr('Eicheln hinlegen, dann das Lasso!', 'Put down acorns, then the lasso!'),
  elk: tr('Moorlaterne ans Ufer stellen, dann das Lasso!', 'Put the moor lantern at the shore, then the lasso!'),
  okapi: tr('Nachlaufen, bis es stehen bleibt, dann füttern.', 'Follow it until it stops, then feed it.'),
  hyena: tr('Knochen streuen, beim Fressen das Lasso!', 'Scatter bones, lasso them while they eat!'),
  warthog: tr('Mit Abstand am Erdloch warten, dann das Lasso!', 'Wait a bit away from the burrow, then the lasso!'),
  vulture: tr('Sitzt er in der Akazie: keschern!', 'When it sits in the acacia: net it!'),
  snowleopard: tr('Folge den Pfotenspuren zum Felsen.', 'Follow the paw prints to the rock.'),
  yak: tr('Salzstein auf den Steinhaufen, dann 3× bürsten.', 'Salt lick on the cairn, then brush it 3×.'),
  tanuki: tr('Wackelnde Verkleidung berühren, dann ihn!', 'Touch the wobbling disguise, then touch it!'),
  redpanda: tr('Leuchtendes Glas vor den Kirschbaum stellen.', 'Put the glowing jar by the cherry tree.'),
  gnu: tr('Lasso, wenn eins aus der Staubwolke läuft!', 'Lasso one that runs out of the dust!'),
  wolf: tr('Laufen beim Heulen, stehen bei 👀!', 'Walk while they howl, freeze at 👀!'),
  jellyfish: tr('Mit dem Quallenglas, wenn sie sinkt!', 'Use the jar while it sinks!'),
  ray: tr('Neben ihm herschwimmen, nicht zu nah.', 'Swim alongside, not too close.'),
  turtle: tr('Mit der Schere 3× das Netz schneiden.', 'Cut the net 3× with the scissors.'),
  octopus: tr('Schnell keschern, bevor die Tinte kommt!', 'Net it fast, before the ink!'),
  squirrel: tr('Wenn es unten ist – mit Abstand.', 'When it is down – keep your distance.'),
  heron: tr('Nur wenn er am Wasser gelandet ist.', 'Only when it has landed by the water.'),
  flamingo: tr('Nur wenn er gelandet ist.', 'Only when it has landed.'),
  deer: tr('Aus der Ferne mit dem Lasso.', 'Lasso it from a distance.'),
  fox: tr('Nur mit der Falle.', 'Only with the trap.'),
  beaver: tr('Stock ins Loch im Damm stecken.', 'Put a stick into the hole in the dam.'),
  antelope: tr('Lasso – die Herde rennt dann weg.', 'Lasso – then the herd runs off.'),
  zebra: tr('Beim Trinken flieht es nicht.', 'While drinking it doesn’t flee.'),
  meerkat: tr('Von hinten anschleichen!', 'Sneak up from behind!'),
  lion: tr('Kraulen bei Zzz, sonst stehen bleiben!', 'Pet it at Zzz, otherwise stand still!'),
  crocodile: tr('Lasso, wenn der Kopf auftaucht.', 'Lasso it when its head comes up.'),
  giraffe: tr('Mit Grünfutter füttern.', 'Feed it leafy greens.'),
  panda: tr('Grünfutter – und weg vom Bambus!', 'Leafy greens – and away from bamboo!'),
  peacock: tr('Warte, bis er ein Rad schlägt.', 'Wait until it fans its tail.'),
  orangutan: tr('Ohne Werkzeug 3× zurückwinken.', 'Wave back 3× without a tool.'),
  tiger: tr('Ball hinrollen, weggehen, dann das Lasso!', 'Roll the ball, walk away, then the lasso!'),
  gorilla: tr('Mit der Trommel genauso oft nachtrommeln.', 'Drum back as often as it does.'),
  jaguar: tr('Seine Route merken und mit dem Lasso lauern.', 'Learn its route, wait with the lasso.'),
  iguana: tr('Bei Sonne mit Abstand keschern.', 'In the sun, net them from a distance.'),
  toucan: tr('Im Tiefflug überm Fluss keschern.', 'Net it as it swoops over the river.'),
  macaw: tr('Im Tiefflug überm Fluss keschern.', 'Net them as they swoop over the river.'),
  snake: tr('Dickicht weghacken, dann keschern!', 'Cut the thicket, then net it!'),
  piranha: tr('Angeln – bei „!“ schnell drücken!', 'Fish – press quickly at “!”!'),
  tarantula: tr('Dickicht weghacken, dann keschern!', 'Cut the thicket, then net it!'),
  seal: tr('Zuwerfen, was sie sich wünscht.', 'Throw it what it wishes for.'),
  penguin: tr('Lasso aus etwas Abstand!', 'Lasso it from a little distance!'),
  anteater: tr('Lasso – beim Ameisenschlecken berühren.', 'Lasso – touch it while it licks ants.'),
  howler: tr('Banane unter seinen Baum, dann das Lasso!', 'Banana under its tree, then the lasso!'),
  macaque: tr('Warte, bis er herausspringt – Lasso!', 'Wait until it jumps out – lasso!'),
};

// Steuerung aus dem Menü, getrennt für PC und Tablet/Handy
const controlRows = (rows) => rows.map(([keys, what]) => `<div class="ctl-row"><span class="ctl-keys">${keys}</span><span>${what}</span></div>`).join('');
const CONTROLS = `<h3>${tr('Steuerung', 'Controls')}</h3>
  <div class="controls">
    <div class="ctl-box"><b>💻 PC</b>${controlRows([
      [tr('<kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd> oder Pfeiltasten', '<kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd> or arrow keys'), tr('laufen', 'walk')],
      ['<kbd>E</kbd> / <kbd>Enter</kbd>', tr('Werkzeug benutzen, Regal, Auto, Computer oder Gehegeschild benutzen', 'use your tool, the shelf, car, computer or enclosure sign')],
      ['<kbd>I</kbd>', tr('Tierbuch', 'Animal Book')],
      ['<kbd>Q</kbd>', tr('Werkzeug wechseln (beim Reiten)', 'switch tool (while riding)')],
      ['<kbd>Esc</kbd>', tr('Menü', 'menu')],
      [tr('Linksklick', 'Left click'), tr('wie <kbd>E</kbd>: Werkzeug benutzen; Regal, Auto, Computer oder Schild anklicken, wenn du direkt daneben stehst', 'like <kbd>E</kbd>: use your tool; click the shelf, car, computer or a sign when you stand right next to it')],
    ])}</div>
    <div class="ctl-box"><b>📱 ${tr('Tablet und Handy', 'Tablet and phone')}</b>${controlRows([
      [tr('linke Hälfte', 'left half'), tr('Finger aufsetzen und ziehen: laufen', 'put your finger down and drag: walk')],
      [tr('Knopf unten rechts', 'button bottom right'), tr('Werkzeug benutzen, Regal, Auto, Computer oder Gehegeschild benutzen', 'use your tool, the shelf, car, computer or enclosure sign')],
      ['📖', tr('Tierbuch (oben links)', 'Animal Book (top left)')],
      ['☰', tr('Menü', 'menu')],
      ['⛶', tr('Vollbild an oder aus', 'full screen on or off')],
      ['🧰', tr('Werkzeug wechseln (beim Reiten)', 'switch tool (while riding)')],
      [tr('Antippen', 'Tap'), tr('Regal, Auto, Computer oder Schild, wenn du direkt daneben stehst', 'the shelf, car, computer or a sign when you stand right next to it')],
    ])}</div>
  </div>`;

// Plätze für diese Art im Tierpark (für das Tierbuch, "1 / 4"): alle gebauten Gehege, die sie aufnehmen (mit Ausbau; in
// gemeinsamen Gehegen mit Kontingent nur ihre Plätze), auch freilaufend (Pfauen) und in den Becken der Häuser; ohne Platz null
const penCapFor = (species) => {
  let cap = 0;
  for (const e of parkPens()) {
    if (!e.species?.includes(species)) continue;
    const key = e.quota ? quotaKey(species) : null;
    cap += penQuotas(e).find((q) => q.key === key)?.cap ?? 0;
  }
  const house = houseOf(species);
  if (house && isUnlocked(house)) for (const t of houseTanks(house)) if (t.e.species?.includes(species)) cap += t.capFor(species);
  return cap || null;
};
// alle Gehege des Tierparks (aus allen Abschnitten, wie in levels.js beschrieben), samt Abschnitt (level); noch nicht
// gebaute fehlen
const parkPens = () => PARK_LEVELS.flatMap((level) => LEVELS[level].enclosures.filter((e) => !e.unlock || game.unlocked.includes(e.unlock)).map((e) => ({ ...e, level })));
// Plätze für diese Art in einem Gehege (in gemeinsamen Gehegen mit Kontingent nur ihre)
const capFor = (e, species) => penQuotas(e).find((q) => q.key === (e.quota ? quotaKey(species) : null))?.cap ?? Infinity;
// das Gehege im Tierpark, in das ein Tier dieser Art zieht: bevorzugt das seiner Herkunftswelt. Gibt es mehrere (z. B.
// Brüllaffen auf der Affeninsel und in der Tropenhalle, Schmetterlinge im Zentrum und in der Halle), zuerst eins mit
// freiem Platz. count(level): so viele Tiere dieser Art leben schon in diesem Abschnitt (ohne count: Platz egal)
const parkPenFor = (species, origin, count = null) => {
  const pens = parkPens().filter((e) => accepts(e, species));
  const room = (e) => !count || pens.length < 2 || count(e.level) < pens.filter((p) => p.level === e.level).reduce((n, p) => n + capFor(p, species), 0);
  return pens.find((e) => room(e) && e.world === origin) ?? pens.find(room) ?? pens.find((e) => e.world === origin) ?? pens[0] ?? null;
};
// Gibt es im Tierpark (samt Aquarium und Reptilienhaus) gar kein Gehege für diese Art? (z. B. Pinguine, solange es dort
// keine Eiswelt gibt): dann wird sie beim Ankommen gleich im Naturreservat ausgewildert. Gehege, die erst beim ersten
// Fang entstehen (Flamingo, Wolf, Geier ...), zählen mit, auch wenn sie noch nicht gebaut sind
const noParkHome = (species) => !houseOf(species) && !PARK_LEVELS.some((level) => LEVELS[level].enclosures.some((e) => accepts(e, species)));

// Für die Schilder an den Gehegetoren: Name und was man an der Fußspur erkennt (zum Lernen)
const ANIMAL_INFO = {
  sheep: tr(['Schaf', 'Paarhufer: Jeder Fuß hat zwei Hufhälften.'], ['Sheep', 'Even-toed hoofs: each foot has two hoof halves.']),
  cow: tr(['Kuh', 'Paarhufer mit großen, runden Hufhälften. Eine Kuh frisst am Tag einen ganzen Berg Gras.'], ['Cow', 'Even-toed with big, round hoof halves. A cow eats a whole mountain of grass every day.']),
  pig: tr(['Schwein', 'Paarhufer: Es läuft auf zwei Zehen, zwei kleine Afterklauen sitzen weiter hinten.'], ['Pig', 'Even-toed: it walks on two toes, with two small dewclaws further back.']),
  goat: tr(['Ziege', 'Paarhufer mit harten, kantigen Hufen – damit klettert sie sicher über Felsen.'], ['Goat', 'Even-toed with hard, edged hoofs – they help it climb safely over rocks.']),
  cat: tr(['Katze', 'Vier Zehen und ein großer Ballen. Die Krallen bleiben beim Laufen eingezogen.'], ['Cat', 'Four toes and a big pad. The claws stay pulled in while walking.']),
  frog: tr(['Frosch', 'Lange, dünne Finger mit runden Haftscheiben an den Spitzen.'], ['Frog', 'Long, thin fingers with round sticky pads at the tips.']),
  fish: tr(['Fisch', 'Hat keine Füße – Fische schwimmen mit ihren Flossen.'], ['Fish', 'No feet – fish swim with their fins.']),
  koi: tr(['Koi', 'Hat keine Füße – Koi schwimmen mit ihren Flossen. Am Maul haben sie zwei Barteln.'], ['Koi', 'No feet – koi swim with their fins. They have two whiskers by their mouth.']),
  reeffish: tr(['Riff-Fische', 'Hat keine Füße – Riff-Fische leben zwischen den Korallen und sind so bunt wie sie.'], ['Reef fish', 'No feet – reef fish live among the corals and are just as colorful.']),
  seahorse: tr(['Seepferdchen', 'Hat keine Füße – mit seinem Ringelschwanz hält es sich an Korallen und Seegras fest.'], ['Seahorse', 'No feet – it holds on to corals and seagrass with its curly tail.']),
  octopus: tr(['Krake', 'Hat acht Arme mit Saugnäpfen – damit kriecht sie über den Boden und hält sich fest.'], ['Octopus', 'Eight arms with suckers – it crawls over the sea floor and holds on with them.']),
  butterfly: tr(['Schmetterling', 'Keine Spuren – ein Schmetterling flattert und landet nur auf Blüten.'], ['Butterfly', 'No tracks – a butterfly flutters and only lands on blossoms.']),
  hippo: tr(['Nilpferd', 'Vier dicke Zehen an jedem Fuß – im Schlamm am Wasserloch sieht man die runden Abdrücke.'], ['Hippo', 'Four thick toes on each foot – you can see the round prints in the mud at the waterhole.']),
  tapir: tr(['Flachlandtapir', 'Seine kurze Nase ist ein kleiner Rüssel: damit pflückt er Blätter und Früchte. Bei Gefahr taucht er unter und läuft sogar über den Grund des Flusses.'], ['Lowland tapir', 'Its short nose is a little trunk: it uses it to pick leaves and fruit. When in danger, it dives and even walks along the bottom of the river.']),
  boar: tr(['Wildschwein', 'Paarhufer mit zwei Afterklauen hinten, die man im weichen Boden mit abgedrückt sieht. Wo Wildschweine nach Eicheln gewühlt haben, sieht der Waldboden umgepflügt aus.'], ['Wild boar', 'Even-toed hoofs with two dewclaws behind them that show up in soft ground. Where wild boars have rooted for acorns, the forest floor looks ploughed.']),
  hedgehog: tr(['Igel', 'Fünf Zehen mit kleinen Krallen, die Spur sieht aus wie winzige Hände. Nachts trippelt er weit herum und schnüffelt nach Käfern und Würmern.'], ['Hedgehog', 'Five toes with small claws – the tracks look like tiny hands. At night it trots far and wide, sniffing for beetles and worms.']),
  elk: tr(['Elch', 'Paarhufer mit breiten, spreizbaren Hufen – wie Schneeschuhe tragen sie ihn über Moor und Schlamm, ohne einzusinken.'], ['Moose', 'Even-toed hoofs that spread wide – like snowshoes they carry it over bog and mud without sinking in.']),
  okapi: tr(['Okapi', 'Es sieht aus wie ein Zebra, ist aber der einzige Verwandte der Giraffe – mit seiner langen blauen Zunge kann es sich sogar die Ohren putzen.'], ['Okapi', 'It looks like a zebra, but it is the only relative of the giraffe – with its long blue tongue it can even clean its own ears.']),
  hyena: tr(['Hyäne', 'Vier Zehen mit stumpfen Krallen, die Vorderpfoten größer als die hinteren.'], ['Hyena', 'Four toes with blunt claws, the front paws larger than the back ones.']),
  warthog: tr(['Warzenschwein', 'Zweigeteilte Hufe wie beim Schwein – die Spur führt meist zu einem Erdloch.'], ['Warthog', 'Split hooves like a pig – the trail usually leads to a burrow.']),
  vulture: tr(['Geier', 'Kräftige Krallen zum Festhalten – auf dem Boden sieht man ihn selten, er sitzt lieber hoch oben.'], ['Vulture', 'Strong talons for gripping – you rarely see it on the ground, it prefers to sit high up.']),
  snowleopard: tr(['Schneeleopard', 'Runde Katzenpfoten ohne Krallenspuren – riesig und dicht behaart, wie Schneeschuhe. Sein langer Schwanz dient als Schal.'], ['Snow leopard', 'Round cat paws with no claw marks – huge and furry, like snowshoes. Its long tail doubles as a scarf.']),
  yak: tr(['Yak', 'Zweigeteilte Hufe wie beim Rind, mit harten Rändern – damit steht es sicher auf Fels und Eis.'], ['Yak', 'Split hooves like cattle, with hard edges – perfect for standing safely on rock and ice.']),
  tanuki: tr(['Tanuki', 'Vier Zehen mit Krallen wie beim Fuchs – er gehört zu den Hundeartigen, auch wenn er wie ein Waschbär aussieht.'], ['Tanuki', 'Four clawed toes like a fox – it belongs to the dog family, even though it looks like a raccoon.']),
  redpanda: tr(['Roter Panda', 'Fünf Zehen mit Krallen und behaarten Sohlen – damit klettert er sicher durch die Bäume.'], ['Red panda', 'Five clawed toes with furry soles – perfect for climbing safely through the trees.']),
  gnu: tr(['Gnu', 'Paarhufer wie die Antilope, aber mit breiteren Hufhälften – Tausende davon hinterlassen eine riesige Staubspur.'], ['Wildebeest', 'Cloven hooves like an antelope, but wider – thousands of them leave a huge trail of dust.']),
  wolf: tr(['Wolf', 'Vier Zehen mit Krallen und ein großer Ballen – wie beim Hund, nur größer. Wölfe laufen oft genau in der Spur des Vordermanns.'], ['Wolf', 'Four toes with claws and a big pad – like a dog, only bigger. Wolves often step right into the tracks of the wolf in front.']),
  jellyfish: tr(['Qualle', 'Hat weder Füße noch Flossen – sie schwimmt, indem sie ihren Schirm zusammenzieht und wieder entspannt.'], ['Jellyfish', 'No feet and no fins – it swims by squeezing its bell together and letting it go again.']),
  ray: tr(['Rochen', 'Hat keine Füße – er „fliegt“ mit seinen großen, flachen Brustflossen durchs Wasser.'], ['Ray', 'No feet – it “flies” through the water with its big, flat fins.']),
  turtle: tr(['Meeresschildkröte', 'Hat Flossen statt Füße – damit „fliegt“ sie durchs Wasser. Zum Luftholen schwimmt sie an die Oberfläche.'], ['Sea turtle', 'Flippers instead of feet – it “flies” through the water with them. To breathe, it swims up to the surface.']),
  deer: tr(['Reh', 'Paarhufer: zwei schmale Hufhälften, vorne spitz.'], ['Deer', 'Even-toed hoofs: two narrow hoof halves, pointed at the front.']),

  beaver: tr(['Biber', 'Fünf Zehen, und an den Hinterfüßen Schwimmhäute – dazwischen schleift oft der breite, flache Schwanz.'], ['Beaver', 'Five toes, with webbed hind feet – and often the drag mark of the broad, flat tail in between.']),
  fox: tr(['Fuchs', 'Vier Zehen mit Krallen und ein kleiner Ballen – fast wie beim Hund, nur schmaler.'], ['Fox', 'Four toes with claws and a small pad – almost like a dog, only narrower.']),
  squirrel: tr(['Eichhörnchen', 'Lange, dünne Finger mit spitzen Krallen – perfekt zum Klettern.'], ['Squirrel', 'Long, thin fingers with sharp claws – perfect for climbing.']),
  antelope: tr(['Antilope', 'Paarhufer: zwei schmale, spitze Hufhälften – gut zum schnellen Rennen.'], ['Antelope', 'Even-toed hoofs: two narrow, pointed hoof halves – good for running fast.']),
  zebra: tr(['Zebra', 'Unpaarhufer wie das Pferd: ein einziger runder Huf statt zwei Hälften.'], ['Zebra', 'Like a horse: one single round hoof instead of two halves.']),
  meerkat: tr(['Erdmännchen', 'Vier Zehen mit langen Grabkrallen – damit buddeln sie ihre Höhlen.'], ['Meerkat', 'Four toes with long digging claws – for digging their burrows.']),
  lion: tr(['Löwe', 'Wie eine riesige Katzenpfote: großer Ballen, vier Zehen, keine Krallenspuren.'], ['Lion', 'Like a giant cat paw: a big pad, four toes, no claw marks.']),
  crocodile: tr(['Krokodil', 'Fünf gespreizte Zehen mit Krallen – und dazwischen die Schleifspur vom Schwanz.'], ['Crocodile', 'Five spread-out toes with claws – and the drag mark of the tail in between.']),
  giraffe: tr(['Giraffe', 'Riesige Paarhufe, fast so groß wie ein Teller, mit zwei runden Hälften.'], ['Giraffe', 'Huge hoofs, almost as big as a plate, with two round halves.']),
  gorilla: tr(['Gorilla', 'Gorillas trommeln mit den flachen Händen auf die Brust – das hört man bis zu einen Kilometer weit.'], ['Gorilla', 'Gorillas beat their chests with flat hands – you can hear it up to a kilometre away.']),
  jaguar: tr(['Jaguar', 'Er ist die größte Katze Amerikas und schwimmt sehr gern – anders als die meisten Katzen.'], ['Jaguar', 'It is the biggest cat in the Americas and loves to swim – unlike most cats.']),
  iguana: tr(['Grüner Leguan', 'Fällt er bei Gefahr vom Ast ins Wasser, kann er bis zu 30 Minuten lang tauchen.'], ['Green iguana', 'When it drops from a branch into the water to escape danger, it can stay under for up to 30 minutes.']),
  toucan: tr(['Tukan', 'Sein riesiger Schnabel ist ganz leicht – innen hohl wie ein Schwamm. Damit pflückt er Früchte, an die er sonst nicht herankäme.'], ['Toucan', 'Its huge beak is very light – hollow inside like a sponge. With it, it picks fruit it could not reach otherwise.']),
  macaw: tr(['Ara', 'Mit seinem kräftigen Schnabel knackt er sogar harte Nüsse – und er kann bis zu 60 Jahre alt werden.'], ['Macaw', 'Its powerful beak can crack even hard nuts – and it can live up to 60 years.']),
  snake: tr(['Schlange', 'Sie riecht mit der Zunge: Beim Züngeln fängt sie Duftteilchen aus der Luft ein.'], ['Snake', 'It smells with its tongue: flicking it catches scent particles from the air.']),
  piranha: tr(['Piranha', 'Mit seinen messerscharfen Zähnen kann er sogar Nüsse knacken – meist frisst er aber Insekten, Fische und Früchte.'], ['Piranha', 'Its razor-sharp teeth can even crack nuts – but mostly it eats insects, fish and fruit.']),
  tarantula: tr(['Spinne', 'Sie hat acht Beine und meist acht Augen – sieht aber trotzdem nicht besonders gut.'], ['Spider', 'It has eight legs and usually eight eyes – but still doesn’t see very well.']),
  seal: tr(['Seehund', 'Er kann bis zu 30 Minuten tauchen – und schläft sogar im Wasser, nur die Nase schaut zum Atmen heraus.'], ['Harbour seal', 'It can dive for up to 30 minutes – and even sleeps in the water with just its nose poking out to breathe.']),
  penguin: tr(['Kaiserpinguin', 'An Land watschelt er gemütlich – im Wasser aber schwimmt er schneller als ein Mensch rennen kann und taucht über 500 Meter tief.'], ['Emperor penguin', 'On land it waddles along slowly – but in the water it swims faster than a person can run and dives more than 500 metres deep.']),
  anteater: tr(['Großer Ameisenbär', 'Seine Zunge ist bis zu 60 Zentimeter lang – damit schleckt er an einem Tag bis zu 30.000 Ameisen und Termiten.'], ['Giant anteater', 'Its tongue is up to 60 centimetres long – with it, it licks up to 30,000 ants and termites in a single day.']),
  howler: tr(['Brüllaffe', 'Sein Brüllen hört man kilometerweit – er ist eines der lautesten Tiere der Welt.'], ['Howler monkey', 'Its howl can be heard for miles – it is one of the loudest animals in the world.']),
  macaque: tr(['Japanmakak', 'Kleine Hände und Füße mit fünf langen Fingern – fast wie bei uns.'], ['Japanese macaque', 'Small hands and feet with five long fingers – almost like ours.']),
  panda: tr(['Panda', 'Breite Tatzen mit fünf Zehen und einem sechsten „Daumen“ zum Bambushalten.'], ['Panda', 'Wide paws with five toes and a sixth “thumb” for holding bamboo.']),
  peacock: tr(['Pfau', 'Drei lange Zehen nach vorne und eine nach hinten – wie beim Huhn, nur größer.'], ['Peacock', 'Three long toes in front and one behind – like a chicken, only bigger.']),
  orangutan: tr(['Orang-Utan', 'Lange Hände und Füße mit einem Daumen auch am Fuß – damit hält er sich an Ästen fest.'], ['Orangutan', 'Long hands and feet with a thumb on the foot, too – for holding on to branches.']),
  tiger: tr(['Tiger', 'Riesige Katzenpfote: vier Zehen und ein breiter Ballen. Die Krallen bleiben eingezogen.'], ['Tiger', 'Giant cat paw: four toes and a wide pad. The claws stay pulled in.']),
  heron: tr(['Fischreiher', 'Drei lange Zehen nach vorne und eine nach hinten.'], ['Heron', 'Three long toes in front and one behind.']),
  flamingo: tr(['Flamingo', 'Drei Zehen nach vorne mit Schwimmhäuten dazwischen.'], ['Flamingo', 'Three toes in front with webbing in between.']),
};

// Falle: wie lange es dauert, bis ein Tier hineingeht, und aus welcher Umgebung Tiere kommen
const TRAP_TIME = [10, 90]; // Sekunden (zufällig)
const TRAP_RETRY = [10, 30]; // war kein Tier in der Nähe, nach so vielen Sekunden erneut versuchen
const TRAP_TIME_SMALL = [6, 18]; // ... auf den kleinen Maps (Expedition, hinter Durchgängen) schnappt sie schneller zu
const TRAP_RETRY_SMALL = [4, 8];
const smallMap = () => !!LEVEL.expedition && !LEVEL.camp;
const TRAP_RADIUS = 360; // etwa 8 Kacheln
const TRAP_PICKUP_DIST = 24;
const HAND_DIST = 18; // so nah muss man an den "Hände frei"-Platz (wie bei Werkzeugen)
// Betten in den Hütten (je Hüttenstil): Verschiebung des Bilds von der Bett-Kachel aus (es liegt über zwei Kacheln:
// das Himmelbett längs an der Wand gegenüber der Tür, die Hängematte quer nach links), origin: Ankerpunkt im Bild
// (Kachelmitte, aus tools/beds.py), depth: Tiefe vor der Kachel, head: wo über dem Kopfkissen die Zs aufsteigen
const BED_LOOK = {
  savanna: { dx: 0, dy: 0, origin: [0.6239, 0.6726], depth: 14, head: [4, -24] },
  jungle: { dx: -32, dy: 16, head: [-26, -34] },
  ice: { dx: 0, dy: 0, origin: [0.623, 0.6745], depth: 14, head: [7, -18] }, // Stockbett der Forschungsstation (Henrik schläft unten)
};
const SLEEP_FADE = 3000; // so lange wird es beim Einschlafen dunkel (Millisekunden)
const COLD_WARN = 0.75; // Kälte (Eiswelt bei Nacht): ab hier die Warnung, bei 1 ist Henrik zu kalt zum Fangen
const COLD_TINT = 0x9fd0ff; // so bläulich wird er dabei
const COLD_HINT_GAP = 4; // so viele Sekunden mindestens zwischen zwei Hinweisen, wenn er es trotzdem versucht
const BREATH_EVERY = 2.2; // nachts atmet Henrik alle so viele Sekunden eine Wolke aus (durchgefroren öfter) ...
const BREATH_SIZE = 0.85; // ... so groß wird sie (Maßstab des weichen Lichtpunkts, 64 Pixel) ...
const BREATH_DEPTH = 99935; // über dem Nachtschleier (siehe Weather.js), sonst ist sie im Dunkeln kaum zu sehen
const BREATH_UP = 40; // ... und so hoch über den Füßen ist sein Mund
const CHEST_DIST = 40; // so nah muss man an der Werkzeug-Kiste stehen (auch am Futterautomaten)
const STAND_UP = 64; // Hochstand (Wald): so hoch steht Henrik auf der Plattform über dem Fuß des Hochstands
const STAND_ZOOM_MS = 900; // so lange zoomt die Kamera beim Hinauf- und Hinuntersteigen
const STAND_LOCK = 0.5; // so lange nach dem Hinaufsteigen bringt Laufen einen noch nicht wieder herunter
const PEN_FEED_DIST = 80; // so nah vor dem Spieler muss ein Gehege sein, um Futter hineinzuwerfen
const FEED_TIME = [8, 12]; // so lange fressen die Tiere
const FEED_GAP = 22; // so viel Abstand halten die Tiere beim Fressen voneinander
// Diese Tiere kommen nicht zum Futter (Wasser- und Flugtiere)
const NO_PEN_FEED = ['anteater', 'butterfly', 'fish', 'koi', 'reeffish', 'piranha', 'seahorse', 'octopus', 'turtle', 'ray', 'jellyfish', 'crocodile', 'heron', 'flamingo', 'frog'];
const HUT_ROOF_ALPHA = 0.12; // so durchsichtig wird das Dach, wenn man in der Hütte ist
const HUT_FRONT_ALPHA = 0.3; // ... und die vorderen Wände
const ROOF_ALPHA = { cathouse: 0.55 };
// vordere Wände auch von außen halb durchsichtig (Katzenhaus aus Glas: sonst verschwinden die Katzen vorne hinter dem Sockel)
const FRONT_ALPHA = { cathouse: 0.5, tank: 0.45 }; // Wassertanks: vorne Glas, durch das man die Fische sieht
const TANK_FISH = [12, 18]; // so viele Zierfische schwimmen in jedem Wassertank (nur solange noch keine Riff-Fische drin sind)
const TANK_FISH_SCALE = 0.5; // so klein sind sie dort
const TANK_TOP = 120; // Oberkante der Glaswände (Bild "hutwall_tank")
const TANK_WATER_UP = 112; // Höhe der Wasseroberfläche (knapp unter der Oberkante der 120 Pixel hohen Glaswände)
// obere Ecke der Grundfläche im Dachbild, falls nicht wie bei den Hütten (siehe officeRoofAnchor in tools/make-sprites.js)
const ROOF_ANCHOR = { office: [283, 90] }; // Glasdach: auch von außen halb durchsichtig, damit man die Katzen sieht
const BOAT_BOB = 3; // so weit schaukelt das U-Boot in der Unterwasserwelt auf und ab (Pixel)
const SEA_TINT = [0x1a7ad0, 0.24]; // blaue Tönung über allem unter Wasser
const SEA_BUBBLES = 260; // alle so viele Millisekunden steigt irgendwo im Bild ein Bläschen auf
const CAR_DIST = 30; // so nah (über die Hitbox hinaus) muss man am Auto stehen, um mit der Aktionstaste die Weltkarte zu öffnen – von jeder Seite
const SEA_TINT_DEPTH = 99990; // blaue Tönung der Unterwasserwelt (darüber nur Lichtstrahlen, das Boot und die Beschriftungen)
const SHADOW_PAD = 8; // so viel höher ist das Schattenbild eines Autos als das Auto (siehe carShadow)
// so viele Boden-Flächen (je 1024 x 1024, 4 MB) darf der Boden in doppelter Auflösung höchstens haben (Wald und Wiese: 13,
// Tierpark: 37). Handys und Geräte mit wenig Speicher: nur die kleinen Gebiete, der Tierpark bleibt einfach aufgelöst
const SMALL_DEVICE = Math.min(screen.width, screen.height) < 600 || (navigator.deviceMemory ?? 8) <= 4;
const GROUND_HD_CHUNKS = SMALL_DEVICE ? 16 : 40;
const TOOL_SWITCH_LOCK = 2500; // Millisekunden nach dem Aufheben, in denen man nicht gleich wieder tauscht oder ablegt
const TRAP_REARM_DIST = 90; // so weit muss man sich von einer ausgelegten Falle entfernen, bevor man sie wieder aufheben kann
const TUT_POINTER = '<span class="chest-pointer tut-pointer">▼</span>'; // roter Pfeil in Tafeln (Tutorial, wie im Regal)
const MARKER_MARGIN = 34; // Abstand der Fallen-Hinweise vom Bildschirmrand (CSS-Pixel)

// Spawner: wilde Tiere leben eine Weile, dann verschwinden sie, und neue kommen nach (siehe spawn in levels.js)
const LIFETIME = [90, 240]; // Sekunden, die ein wildes Tier bleibt (zufällig)
const SPAWN_INTERVAL = [5, 12]; // so oft schaut der Spawner, ob Tiere fehlen
const FROG_NEAR_WATER = 0.75; // Anteil der Frösche, die am Wasser erscheinen
const PENGUIN_AT_HOLES = 0.75; // Eiswelt bei Nacht: Anteil der Pinguin-Gruppen, die an einem Eisloch erscheinen
const GIRAFFE_NEAR_TREES = 0.85; // Anteil der Giraffen, die in der Nähe eines Baums erscheinen
const HERD_SIZE = [2, 4]; // so viele Antilopen erscheinen zusammen
const SIDE_WOLF_PACKS = 2; // Wolfsnacht hinter einem Durchgang des Walds: so viele Rudel (die große Map hat 3)
const EXP_GROUP = [2, 3]; // Expedition: kleinere Gruppen (Herden, Trupps, Schwärme, Rudel)
const FEED_DIST = 60; // so nah muss man an einer Giraffe stehen, um sie zu füttern
// Dinge, die Henrik in der Welt aufhebt (nicht aus dem Regal): das getragene Werkzeug steckt er so lange ein
const CARRIED = ['stick', 'leaves', 'salt', 'brush'];
const LEAF_BUSHES = 3; // so viele Futtersträucher stehen dort, wo Tapire oder Okapis leben
const LEAF_BUSH_GAP = 7; // so weit (Kacheln) stehen sie mindestens auseinander
const FEED_CHANCE = 1 / 3; // so wahrscheinlich läuft sie einem nach dem Füttern hinterher
const KOI_FEED_DIST = 50; // so nah muss Wasser vor dem Spieler sein, um Fischfutter zu streuen
const KOI_CALLED = 3; // höchstens so viele wilde Koi kommen zum Futter (die nächsten)
const KOI_CALL_DIST = 170; // nur Koi in diesem Umkreis (Welt-Pixel, etwa 5 Kacheln) riechen das Futter
const KOI_FEED_PAUSE = 1500; // Millisekunden bis zum nächsten Streuen
const KOI_FOOD_FLOAT = 15000; // Millisekunden, die das Futter auf dem Wasser treibt
const DESPAWN_DIST = 300;
const ANIMAL_VOLUME = 0.45; // Lautstärke der Tierrufe beim Fangen
// Atmosphäre: ab und zu ruft ein Tier in der Nähe – im Tierpark aus dem Gehege, an dem man gerade steht, in der Wildnis
// ein wildes Tier (leiser als beim Fangen)
const PEN_CALL_EVERY = [4, 8]; // Sekunden zwischen zwei Rufen
const PEN_CALL_DIST = 190; // so nah muss man am Gehege sein (in Kachel-Proportionen, etwa 6 Kacheln)
const PEN_CALL_VOLUME = 0.16; // ganz nah; weiter weg leiser
// welcher Ruf zu welcher Tierart gehört (sonst animal_<Art>, falls es den gibt)
const PEN_CALLS = { lion: 'lion_roar', deer: null, peacock: null }; // Pfauen rufen im Park nur selten über alles hinweg (siehe updatePeacockCall)
// In der Wildnis rufen diese nicht von selbst: sie verstecken sich (Großkatzen, Krokodil, Warzenschwein), leben im Wasser,
// ihr Laut gehört zum Fangen (Gorilla trommelt, Erdmännchen pfeifen, Hyänen kichern, Wölfe heulen), sie sind ruhig
// (Panda, Orang-Utan) oder rufen schon selbst (Affen und Vögel beim Springen bzw. Losfliegen, Pfau, Nilpferd, Gnu, Pinguin)
const WILD_SILENT = [
  'lion', 'tiger', 'jaguar', 'crocodile', 'warthog',
  'fish', 'koi', 'reeffish', 'piranha', 'seahorse', 'octopus', 'turtle', 'ray', 'jellyfish',
  'gorilla', 'meerkat', 'hyena', 'wolf', 'panda', 'orangutan',
  'howler', 'macaw', 'toucan', 'peacock', 'hippo', 'gnu', 'penguin',
];
// Tierarten ohne eigenen Ton nehmen diesen (beim Fangen und als Ruf aus dem Gehege)
const CALL_FALLBACK = { tiger: 'lion_roar', jaguar: 'lion_roar', snowleopard: 'lion_roar', okapi: 'animal_zebra', gorilla: 'gorilla_beat', warthog: 'animal_pig', boar: 'animal_pig' }; // Warzenschweine grunzen wie die Schweine vom Bauernhof
const WHOOSH_VOLUME = 0.35; // Lautstärke des Schwungs beim Einsetzen eines Werkzeugs
const TRAP_VOLUME = 0.5; // Lautstärke, wenn die Falle zuschnappt
const CAR_VOLUME = 0.6; // Lautstärke des Autos bei der Schnellreise
const AMBIENT_VOLUME = 0.55; // Lautstärke der Hintergrundgeräusche (z. B. Wald)
const AMBIENT_VOLUMES = { ambient_forest_night: 0.3 }; // einzelne Geräusche leiser (Wald bei Nacht: Wolfsnacht und Glühwürmchen-Abend)
const AMBIENT_FADE = 1500; // Millisekunden zum Einblenden
const MACAW_VOLUME = 0.45; // Ruf der Aras beim Losfliegen, ganz nah ...
const MACAW_HEAR = 320; // ... und so weit hört man ihn
const RUSTLE_VOLUME = 0.5; // Rascheln einer Baumkrone (Brüllaffen), ganz nah ...
const RUSTLE_HEAR = 300; // ... und so weit (Welt-Pixel) hört man es noch
const SPRAY_EVERY = 70; // so oft (ms) steigt am Fuß des Wasserfalls ein Wölkchen Sprühnebel auf
const WATERFALL_VOLUME = 0.6; // Rauschen des Wasserfalls (Dschungel), ganz nah ...
const WATERFALL_HEAR = 520; // ... und so weit (Welt-Pixel) hört man es noch
const ZONE_VOLUME = 0.55; // Geräusch einer Zone (Moor, Hochebene), mittendrin
const ZONE_KEEP = 0.2; // ... so viel bleibt dort vom normalen Hintergrundgeräusch
const ZONE_SNOW = 'ambient_ice'; // auf der Hochebene (snowline): die Geräusche der Eiswelt

// Das laufende Hintergrundgeräusch überdauert Levelwechsel (die Szene startet dabei neu)
let ambient = null; // nur so weit weg vom Spieler verschwinden Tiere (nicht vor seinen Augen)

// Reihenfolge der Tierarten im Zähler: alle fangbaren, die in irgendeinem Level vorkommen
const SPECIES_ORDER = ALL_SPECIES.filter(
  (s) =>
    isCatchable(SPECIES[s]) &&
    s === 'flamingo' || s === 'jellyfish' || s === 'wolf' || s === 'gnu' || s === 'hyena' || s === 'vulture' || s === 'redpanda' || s === 'snake' || s === 'tarantula' || s === 'iguana' || s === 'gorilla' || s === 'beaver' || s === 'yak' || Object.values(LEVELS).some((level) => [level, ...Object.values(level.seasons ?? {})].some((l) => spawnWeights(l)[s] || (s === 'heron' && l.herons))),
);

// Werkzeuge: wie sie erzeugt werden und was die Anzeige dazu sagt. Man trägt immer nur eins.
const ACTION_KEY = 'E';
// Reittier-Event: Henrik reitet in jeder Welt ein anderes Tier (nicht im Tierpark)
// Flamingo-Flug (Event): in diesen Welten fliegen Flamingos ein, etwa neunmal so oft wie Reiher
const FLAMINGO_WORLDS = ['meadow', 'forest', 'savanna'];
const PEACOCK_CALL_EVERY = [20, 40]; // so oft schallt der Ruf eines wilden Pfaus durchs ganze Gebiet (Sekunden)
const PEACOCK_CALL_EVERY_PARK = [60, 120]; // ... im Tierpark seltener (dort laufen viele Pfauen frei herum)
const ENCOUNTER_DIST = 200; // so nah muss ein Tier einer noch nie gefangenen Art sein, dann zeigt eine Blase das Werkzeug dafür
const SOIL_UP = 6; // der Erdfleck unter der Biberburg liegt so viel über der Kachelmitte (die Äste sind hinten höher)
const SOIL_DEPTH = -99996; // flach auf dem Boden, unter allem, was steht (wie der Friedhofsboden der Savanne)
const BEAVER_HINT_DIST = 240; // so nah muss ein großer Stock sein, dann schwebt über ihm die Biber-Blase
const ENCOUNTER_FLEES = 2; // so oft darf es fliehen, dann kommt der Fang-Tipp einmal von selbst
const OFFICE_DOOR_H = 62; // so hoch über der Türkachel steht Mavis Pfeil am Haupthaus (oberer Rand der Glastür)
const SHEEP_QUEST = 3; // so viele Schafe verlangt Mavis erste Aufgabe
const TUT_SHEEP = 2; // bei Mavis Schaf-Aufgabe grasen auf der Wiese immer so viele Schafe ...
const TUT_SHEEP_R = 360; // ... so nah am Auto ...
const TUT_SHEEP_CHECK = 2; // ... nachgeschaut wird alle paar Sekunden
const PROMO_DELAY = 1200; // so lange nach der Ankunft im Tierpark, bis eine Tafel aufgeht (maybeShowPromo)
let lastBookTab = 'animals'; // zuletzt offener Reiter im Tierbuch
const visitorPics = {}; // Bilder der Besucher für den Aktionsknopf (siehe visitorPortrait)
const QUEST_FOLD_KEY = 'my-little-zoo-quest-folded'; // Aufgaben-Karte eingeklappt (nur in diesem Browser)
const AQUARIUM_TOUR = { tx: 3, ty: 16 }; // Ankunft vor der Aquariumtür (park2), wenn Mavi das Aquarium zeigt
const PEACOCK_CALL_VOLUME = 0.18; // leise im Hintergrund (beim Fangen klingt der Ruf so laut wie die anderen Tierrufe)
const MAX_ORANGUTANS = 2; // so viele Orang-Utans sitzen höchstens gleichzeitig in den Urwaldbäumen
const BABY_LEVELS = [...PARK_LEVELS, 'aquarium'];// dort gibt es beim Tierbaby-Event Nachwuchs
const AQUA = ['reeffish', 'seahorse', 'octopus', 'turtle', 'ray', 'jellyfish'];
// Häuser mit eigener Halle (eigenes Level): welche Tierarten dort in die Becken ziehen (Schlangen, Vogelspinnen, Leguane
// und Piranhas wohnen seit der Tropenhalle in park3, siehe docs/plan-dschungel.md)
const HOUSES = { aquarium: AQUA };
const houseOf = (species) => Object.keys(HOUSES).find((h) => HOUSES[h].includes(species)) ?? null;
const STARTLE_CHANCE = 0.1; // so wahrscheinlich schreckt beim Wegschlagen eines Dickichts eine Schlange oder Vogelspinne auf
const MAX_RAYS = 2; // so viele Rochen gleiten höchstens gleichzeitig durchs Riff
// Quallen-Schwarm (Event): so viele Quallen treiben höchstens gleichzeitig im Riff, so oft kommt eine neue (Sekunden),
// beim Ankommen sind schon so viele da; so nah (in Kachel-Proportionen) darf man ihnen nicht kommen, sonst brennt es
const JELLY_MAX = 14;
const JELLY_EVERY = [1.5, 3];
const JELLY_START = 8;
const STING_DIST = 16;
const STING_HINT_EVERY = 20000; // Millisekunden zwischen zwei Hinweisen zum Brennen
const AQUA_FISH = ['reeffish', 'seahorse', 'octopus']; // nur diese verdrängen die Zierfische aus ihrem Becken (Schildkröten nicht) // Meerestiere: ziehen ins Aquarium (in dessen Becken)
const REEF_SOLO = 0.35; // so viele Riff-Fische schwimmen allein ...
const REEF_GROUP = [2, 5]; // ... die anderen in Gruppen dieser Größe (eine Art)
const MAX_TANUKIS = 2; // so viele Tanukis sind höchstens gleichzeitig verkleidet
const MAX_ELKS = 2; // so viele Elche stehen höchstens gleichzeitig im Moor
const MAX_HEDGEHOGS = 3; // so viele Igel sitzen höchstens gleichzeitig in den Laubhaufen
const NUT_PLACE = 60; // so nah an einem Laubhaufen muss man die Eicheln ablegen, damit sie für den Igel sind
const MAX_BOARS = 2; // so viele Wildschweine (bzw. Bachen) streifen höchstens gleichzeitig durch den Eichenhain
const OAK_SHAKE_DIST = 72; // so nah (Höhe doppelt gezählt) an einer Eiche kann man sie schütteln (auch wenn daneben ein Busch oder Laubhaufen steht)
const OAK_HINT_DIST = 260; // so nah muss Henrik an einer Eiche sein, damit über ihr die Eichel-Blase erscheint ...
const OAK_HINT_UP = 118; // ... so hoch über ihrem Fuß (über der Krone)
const LANTERN_TAKE = 34; // so nah (Höhe doppelt gezählt) muss Henrik an die abgestellte Laterne, um sie aufzuheben ...
const LANTERN_ARM = 70; // ... nachdem er sich einmal so weit entfernt hat ...
const LANTERN_COOLDOWN = 2000; // ... und frühestens so lange (ms) nach dem Abstellen
const MAX_TIGERS = 2; // so viele Tiger streifen höchstens gleichzeitig durch den Bambus
const MAX_JAGUARS = 1; // so viele Jaguare schlafen höchstens gleichzeitig in den Urwaldbäumen
const TIGER_LURE_DIST = 150; // so nah muss man mit dem Ball an einem Tiger-Schemen stehen (aber nicht zu nah, siehe Tiger.js)
const BALL_ROLL = [56, 44, 32]; // so weit rollt der Ball auf den Tiger zu (der erste freie Platz)
const BALL_KEEP = 20000; // so lange bleibt der Ball liegen, wenn der Tiger nicht mehr spielt (Millisekunden)
const MAX_MACAQUES = 6; // so viele Japanmakaken baden höchstens in den wilden Quellen (sie verteilen sich)
const FLAMINGO_EVERY = [6, 12]; // Sekunden zwischen zwei Flamingos (Reiher: 50–110)
const PROMISE_WAIT = 6; // so lange (höchstens) bis der versprochene Storch bzw. Ohrengeier aus der Kiste heranfliegt
const FLAMINGO_LAND = 0.6; // so oft landen sie (am Wasser)
const RIDES = { meadow: 'ride_meadow', forest: 'ride_forest', savanna: 'ride_savanna', asia: 'ride_asia', jungle: 'ride_jungle', reef: 'ride_reef' }; // Dschungel: Maultier, Riff: Seabob
// Die Welten draußen (für das Tierbuch und das Regal: wo es welche Tiere gibt)
const WILD_WORLDS = ['meadow', 'forest', 'savanna', 'asia', 'jungle', 'reef', 'ice'];
// Tiere, die nur während eines Events kommen: Event und Welten
const EVENT_SPECIES = { flamingo: ['flamingo', FLAMINGO_WORLDS], jellyfish: ['jellyfish', ['reef']], wolf: ['wolves', ['forest']], gnu: ['migration', ['savanna']], redpanda: ['fireflies', ['asia']] };
const EVENT_ICONS = { babies: '🍼', ride: '🐴', flamingo: '🦩', farm: '🐄', icecream: '🍦', rare: '✨', jellyfish: '🪼', wolves: '🐺', migration: '🦬', weather: '🌦️', fireflies: '✨', lanterns: '🏮' };
// lebt diese Art in diesem Level (bzw. dieser Wetterphase eines Levels)?
const livesIn = (l, s) => !!spawnWeights(l)[s] || (s === 'heron' && !!l.herons) || (s === 'vulture' && !!l.vultures) || (s === 'hyena' && !!l.hyenas) || (s === 'iguana' && !!l.waterfallSun) || (s === 'gorilla' && !!l.gorillas) || (s === 'beaver' && !!l.beavers) || (s === 'yak' && !!l.yaks) || ((s === 'snake' || s === 'tarantula') && l.name === LEVELS.jungle.name); // im Dickicht des Dschungels
// Welten, in denen es eine Tierart gibt: [{ level, extra }]; extra = { icon, name }, wenn nur bei einem Wetter oder Event
function worldsOf(s) {
  if (EVENT_SPECIES[s]) {
    const [id, worlds] = EVENT_SPECIES[s];
    const ev = EVENTS.find((e) => e.id === id);
    return worlds.map((level) => ({ level, extra: { icon: EVENT_ICONS[id], name: ev.name } }));
  }
  return WILD_WORLDS.flatMap((level) => {
    const base = LEVELS[level];
    const first = firstSeason(level); // die Angaben des Gebiets selbst gelten für die erste Phase (Normal bzw. Tag)
    const phases = [[first, base], ...Object.entries(base.seasons ?? {}).filter(([k]) => k !== first).map(([k, v]) => [k, { ...base, ...v }])];
    const found = phases.filter(([, l]) => livesIn(l, s)).map(([k]) => k);
    if (!found.length) return [];
    if (found.length === phases.length) return [{ level, extra: null }];
    return [{ level, extra: { icon: found.map((k) => SEASON_INFO[k].icon).join(''), name: found.map((k) => SEASON_INFO[k].name).join(tr(' oder ', ' or ')) } }];
  });
}
const caughtBefore = (s) => game.caughtSpecies.includes(s);
const FINAL_HEARTS = 100; // Expedition: Schatz in der Abschlusskiste, wenn es keine neuen Glücksbringer (mehr) gibt
const BOARD_PLANK_H = 70; // Expeditions-Tafel (exp_board): so hoch ist das Brett oben im Bild (tools/expedition-sprites.py)
// Fang-Einheit eines wilden Tiers (Expedition): Herde, Kolonie, Trupp, Schwarm oder das Tier selbst
const unitOf = (a) => a.herd ?? a.colony ?? a.troop ?? a.school ?? a;
// Bild eines Tiers im Wagen (seltene Variante mit eigenem Bild bzw. eingefärbt)
function wagonIcon(a) {
  const info = a.skin ? skinInfo(a.species, a.skin) : null;
  if (a.skin) {
    try {
      return animalIcon(a.skin, 2.6);
    } catch {}
  }
  const icon = animalIcon(a.species, 2.6);
  return info?.css ? `<span style="filter:${info.css}">${icon}</span>` : icon;
}

const TOOLS = {
  net: {
    create: (scene, player) => new Net(scene, player),
    name: tr('Kescher', 'Net'),
    catches: ['cat', 'fish', 'koi', 'reeffish', 'seahorse', 'octopus', 'frog', 'squirrel', 'heron', 'meerkat', 'peacock', 'butterfly', 'vulture', 'snake', 'tarantula', 'macaw', 'toucan', 'iguana'],
    hint: (list) => tr(`Damit fängst du ${animalIcons(list)}`, `Catches ${animalIcons(list)}`),
  },
  lasso: {
    create: (scene, player) => new Lasso(scene, player),
    name: 'Lasso',
    catches: ['deer', 'antelope', 'zebra', 'gnu', 'hippo', 'hyena', 'warthog', 'crocodile', 'sheep', 'cow', 'goat', 'pig', 'heron', 'tiger', 'howler', 'anteater', 'jaguar', 'penguin'],
    hint: (list) => tr(`Damit fängst du ${animalIcons(list)} aus der Ferne`, `Catches ${animalIcons(list)} from a distance`),
  },
  trap: {
    create: (scene, player) => new TrapTool(scene, player),
    name: tr('Falle', 'Trap'),
    hint: tr('Leg sie aus und warte, bis ein Tier hineingeht', 'Set it down and wait until an animal walks in'),
  },
  parkfood: {
    create: (scene, player) => new ParkFoodTool(scene, player),
    name: tr('Futter', 'Food'),
    hint: tr('Wirf es am Zaun ins Gehege – dann kommen die Tiere zum Fressen', 'Throw it over the fence into an enclosure – the animals will come to eat'),
  },
  drum: {
    create: (scene, player) => new DrumTool(scene, player),
    name: tr('Trommel', 'Drum'),
    catches: ['gorilla'],
    hint: (list) => tr(`Trommle bei den ${animalIcons(list)} – und dann genauso oft wie sie auf ihre Brust!`, `Drum near the ${animalIcons(list)} – then exactly as often as they beat their chests!`),
  },
  rod: {
    create: (scene, player) => new RodTool(scene, player),
    name: tr('Angel', 'Fishing rod'),
    catches: ['piranha'],
    hint: (list) => tr(`Damit angelst du ${animalIcons(list)} vom Kanu aus – beißt einer an, schnell drücken!`, `Fish for ${animalIcons(list)} from the canoe – when one bites, press quickly!`),
  },
  scissors: {
    create: (scene, player) => new ScissorsTool(scene, player),
    name: tr('Schere', 'Scissors'),
    catches: ['turtle'],
    hint: (list) => tr(`Damit schneidest du ${animalIcons(list)} aus dem Fischernetz frei – dreimal schneiden!`, `Cut ${animalIcons(list)} free from the fishing net – three cuts!`),
  },
  jar: {
    create: (scene, player) => new Jar(scene, player),
    name: tr('Quallenglas', 'Jellyfish jar'),
    catches: ['jellyfish'],
    hint: (list) => tr(`Damit fängst du ${animalIcons(list)} – aber nur, wenn sie langsam sinken!`, `Catches ${animalIcons(list)} – but only while they slowly sink!`),
  },
  koifood: {
    create: (scene, player) => new KoiFoodTool(scene, player),
    name: tr('Fischfutter', 'Fish food'),
    hint: tr(`Streu es am Ufer ins Wasser – dann kommen die ${animalIcon('koi')} hoch`, `Scatter it into the water from the shore – the ${animalIcon('koi')} will come up`),
  },
  herring: {
    create: (scene, player) => new TreatTool(scene, player, 'herring'),
    name: tr('Fisch', 'Fish'),
    hint: tr(`Wirf ihn einer ${animalIcon('seal')} zu, die sich einen Fisch wünscht`, `Throw it to a ${animalIcon('seal')} that wishes for a fish`),
  },
  sealball: {
    create: (scene, player) => new TreatTool(scene, player, 'sealball'),
    name: 'Ball',
    image: 'ball',
    hint: tr(`Wirf ihn einer ${animalIcon('seal')} zu, die sich einen Ball wünscht – sie balanciert ihn auf der Nase`, `Throw it to a ${animalIcon('seal')} that wishes for a ball – it balances it on its nose`),
  },
  ball: {
    create: (scene, player) => new BallTool(scene, player),
    name: 'Ball',
    hint: tr(
      `Stell dich damit still vor einen Schatten im Bambus – dann wird der ${animalIcon('tiger')} neugierig. Danach hast du gleich das Lasso`,
      `Stand still with it in front of a shadow in the bamboo – the ${animalIcon('tiger')} gets curious. Then you have the lasso right away`,
    ),
  },
  fireflyjar: {
    create: (scene, player) => new FireflyJar(scene, player),
    name: tr('Glas', 'Jar'),
    image: 'jar', // Bild (sonst wie das Werkzeug)
    hint: tr(`Schwing es durch die Glühwürmchen – mit ${JAR_FULL} im Glas leuchtet es`, `Swing it through the fireflies – with ${JAR_FULL} inside it glows`),
  },
  glowjar: {
    create: (scene, player) => new GlowJar(scene, player),
    name: tr('Leuchtendes Glas', 'Glowing jar'),
    image: 'jar_glow',
    hint: tr(`Stell es vor einen Kirschbaum – dann klettert der ${animalIcon('redpanda')} herunter`, `Put it in front of a cherry tree – the ${animalIcon('redpanda')} will climb down`),
  },
  banana: {
    create: (scene, player) => new BananaTool(scene, player),
    name: tr('Banane', 'Banana'),
    hint: tr(`Leg sie unten an den Baum, in dem ein ${animalIcon('howler')} sitzt – dann kommt er herunter`, `Put it at the foot of the tree a ${animalIcon('howler')} is sitting in – it will come down`),
  },
  bone: {
    create: (scene, player) => new BoneTool(scene, player),
    name: tr('Knochen', 'Bones'),
    hint: tr(`Hörst du die Hyänen kichern, streu die Knochen aus – dann kommen die ${animalIcon('hyena')} zum Fressen`, `When you hear the hyenas giggle, scatter the bones – the ${animalIcon('hyena')} will come to eat`),
  },
  stick: {
    create: (scene, player) => new StickTool(scene, player),
    name: tr('Großer Stock', 'Big stick'),
    image: 'forest_stick',
    hint: tr('Steck ihn ins Loch im Biberdamm am Fluss', 'Put it into the hole in the beaver dam by the river'),
  },
  // Salzstein und Bürste (Bambuswald, Hochebene): kommen nicht ins Regal (siehe world/YakHerd.js)
  salt: {
    create: (scene, player) => new SaltTool(scene, player),
    name: tr('Salzstein', 'Salt lick'),
    image: 'salttool',
    hint: tr('Leg ihn auf den Steinhaufen bei den Yaks', 'Put it on the cairn near the yaks'),
  },
  brush: {
    create: (scene, player) => new BrushTool(scene, player),
    name: tr('Bürste', 'Brush'),
    image: 'brush',
    catches: ['yak'],
    hint: tr(`Bürste den ${animalIcon('yak')} dreimal, während er am Salzstein leckt`, `Brush the ${animalIcon('yak')} three times while it licks the salt`),
  },
  // Eicheln (Wald): aus einer großen Eiche geschüttelt; neben einen Laubhaufen gelegt locken sie den Igel heraus, sonst die
  // Wildschweine (siehe AcornTool.js). Kommen nicht ins Regal
  acorns: {
    create: (scene, player) => new AcornTool(scene, player),
    name: tr('Eicheln', 'Acorns'),
    hint: tr(`Schüttel sie aus einer großen Eiche. Neben einen raschelnden Laubhaufen gelegt kommt der ${animalIcon('hedgehog')} heraus, sonst trottet ein ${animalIcon('boar')} herbei`, `Shake them from a big oak. Put next to a rustling leaf pile, the ${animalIcon('hedgehog')} comes out – otherwise a ${animalIcon('boar')} trots over`),
  },
  // Moorlaterne (Wald): leuchtet den Moornebel weg; abgestellt lockt sie die Elche ins Licht (siehe LanternTool.js)
  lantern: {
    create: (scene, player) => new LanternTool(scene, player),
    name: tr('Moorlaterne', 'Moor lantern'),
    hint: tr(`Stell sie am Moor ab – dann watet der ${animalIcon('elk')} ins Licht, und du siehst ihn`, `Put it down by the moor – the ${animalIcon('elk')} wades into the light, and you can see it`),
  },
  // Blätterzweig vom Futterstrauch (Dschungel): kommt nicht ins Regal, man bricht ihn am Strauch ab (siehe LeafBushes.js)
  leaves: {
    create: (scene, player) => new LeafTool(scene, player),
    name: tr('Blätterzweig', 'Leafy branch'),
    image: 'leaf_branch',
    hint: (list) => tr(`Brich ihn am Futterstrauch ab und füttere damit ${list.map((s) => animalIcon(s)).join(' oder ')}`, `Break it off a fodder bush and feed it to ${list.map((s) => animalIcon(s)).join(' or ')}`),
  },
  food: {
    create: (scene, player) => new FoodTool(scene, player),
    name: tr('Grünfutter', 'Leafy greens'),
    catches: ['giraffe', 'panda'],
    hint: (list) => tr(`Geh nah an ${list.map((s) => animalIcon(s)).join(' oder ')} heran und füttere sie`, `Get close to ${list.map((s) => animalIcon(s)).join(' or ')} and feed them`),
  },
};

// Futter aus dem Futterhaus (je Sorte ein Werkzeug, siehe FEED_SORTS in src/world/friends.js): kommt nicht ins Regal
for (const [k, f] of Object.entries(FEED_SORTS)) {
  TOOLS[`treat_${k}`] = {
    create: (scene, player) => new HandFoodTool(scene, player, k, f.image),
    name: f.name,
    image: f.image,
    hint: tr('Füttere damit deinen Tierfreund am Zaun aus der Hand', 'Feed your animal friend at the fence from your hand'),
  };
}
const isTreat = (id) => !!id?.startsWith('treat_');

// Köder: locken diese Tiere an (gefangen werden sie dann mit dem Lasso oder sie folgen von selbst)
const TOOL_LURES = { acorns: ['hedgehog', 'boar'], lantern: ['elk'], ball: ['tiger'], banana: ['howler'], bone: ['hyena'], koifood: ['koi'], fireflyjar: ['redpanda'], glowjar: ['redpanda'] };
// alle Tierarten, die man mit diesem Werkzeug fängt oder lockt (null: mit leeren Händen, also durch Berühren)
// (aus den Tierarten selbst, catchWith in Animal.js – dazu, was das Werkzeug selbst aufzählt)
const toolAnimals = (id) => {
  if (!id) return SPECIES_ORDER.filter((s) => SPECIES[s].catchWith.some((t) => t === 'touch' || t === 'swim'));
  if (TOOL_LURES[id]) return TOOL_LURES[id];
  const own = TOOLS[id].catches ?? [];
  return SPECIES_ORDER.filter((s) => SPECIES[s].catchWith.includes(id) || own.includes(s));
};
// Regal: die Tiere dieser Welt zum Werkzeug als kleine Bilder; noch nie gefangene als Schatten, Wetter- und Event-Tiere
// mit ihrem Zeichen
function toolAnimalsHtml(id) {
  const list = toolAnimals(id)
    .map((s) => ({ s, w: worldsOf(s).find((w) => w.level === LEVEL_ID) }))
    .filter(({ w }) => w);
  return list
    .map(({ s, w }) => `<span class="chest-animal${caughtBefore(s) ? '' : ' unknown'}" title="${w.extra ? `${w.extra.icon} ${w.extra.name}` : ''}">${animalIconSquare(s, 2.2)}${w.extra ? `<i>${w.extra.icon}</i>` : ''}</span>`)
    .join('');
}

// Becken im Aquarium bzw. Terrarien im Reptilienhaus (auch von einem anderen Level aus): Innenfläche des Tanks, in dem
// der Startpunkt des Beckens liegt
function houseTanks(level) {
  const aq = LEVELS[level];
  return aq.enclosures.map((e) => {
    const b = aq.buildings.find((h) => (h.style === 'tank' || h.style.startsWith('terrarium')) && e.seed.tx >= h.tx0 && e.seed.tx <= h.tx1 && e.seed.ty >= h.ty0 && e.seed.ty <= h.ty1);
    // cap: alle Plätze; capFor(Art): Plätze dieser Art (Becken mit quota haben je Art eigene, z. B. Schildkröten und Rochen)
    const capFor = (species) => (e.quota ? e.quota[species]?.[0] ?? 0 : e.slots[0]);
    const cap = e.quota ? Object.values(e.quota).reduce((s, q) => s + q[0], 0) : e.slots[0];
    return { e, cap, capFor, tx0: b.tx0 + 1, tx1: b.tx1 - 1, ty0: b.ty0 + 1, ty1: b.ty1 - 1 };
  });
}
const aquariumTanks = () => houseTanks('aquarium');
// in welchem Becken ein gespeichertes Tier schwimmt (nach seiner Position)
function tankOf(tanks, s) {
  const { tx, ty } = worldToTile(s.x, s.y);
  return tanks.find((t) => tx >= t.tx0 && tx <= t.tx1 && ty >= t.ty0 && ty <= t.ty1);
}

export default class GardenScene extends Phaser.Scene {
  constructor() {
    super('Garden');
  }

  // data.level: welches Level; data.arrive: Ankunftskachel nach einem Übergang
  create(data = {}) {
    // Startlevel lässt sich zum Ausprobieren auch über die Adresse wählen, z. B. ?level=forest (sonst geht es im Tierpark vor dem Haupthaus los)
    const urlLevel = new URLSearchParams(location.search).get('level');
    setLevel(data.level ?? (LEVELS[urlLevel] ? urlLevel : 'park'));
    this.leaving = false;
    // Expedition (siehe world/expedition.js): Camp bzw. Map eines Runs; beides beginnt immer frisch (nichts gespeichert)
    if (LEVEL.expedition && !expRun() && !LEVEL.side) {
      const r = startRun(LEVEL.expedition); // z. B. über die Adresse (?level=) gestartet
      if (!LEVEL.camp) {
        const plan = planMap(LEVEL_ID, LEVEL.expedition); // Tiere und Wetter würfeln, dann die Map damit neu einstellen
        Object.assign(r, { map: LEVEL_ID, home: { ...plan.home }, season: plan.season, left: { ...plan.home }, step: 1, visited: [LEVEL_ID] });
        setLevel(LEVEL_ID);
      }
    }
    this.expCamp = !!(LEVEL.camp && expRun());
    this.expMap = !!(LEVEL.expedition && !LEVEL.camp && expRun() && !LEVEL.side);
    this.canoeExitArmed = false; // (siehe Ausgänge auf dem Fluss in update) // (hinter einem Durchgang: keine Expedition, siehe sideMaps.js)
    this.expCaught = new Set(); // Einheiten (Herde, Rudel …), aus denen man auf dieser Map schon ein Tier gefangen hat
    this.nearCages = false; // (die Szene wird beim Levelwechsel wiederverwendet: alte Werte nicht in die Werkzeugleiste mitnehmen)
    this.nearCanoe = false;
    this.expHidden = [];
    this.expDoneShown = false;
    if (LEVEL.expedition) delete game.levels[LEVEL_ID];
    this.beds = []; // Betten in den Hütten (Kacheln): dort kann man sich ausruhen
    this.stands = []; // Hochstände (Wald): mit der Aktionstaste hinauf, von oben sieht man weit
    this.onStand = null;
    this.resting = false;
    this.chestSprites = new Map(); // Bilder der Regale und Kisten je Kachel ("tx,ty")
    this.houseFront = new Map(); // je Gebäude die vorderen Wände (werden durchsichtig, wenn man drin ist)

    const ground = []; // Bodenkacheln [x, y, Bild]: werden unten in wenige große Flächen gemalt (schneller auf dem Tablet)
    const thicketImages = new Map();
    const swayPlants = new Map(); // Pflanzen, die sich wiegen, wenn man hindurchläuft (siehe Sway.js)
    this.decorImages = new Map(); // selbst gesetzte Deko: "tx,ty" → Bild (siehe DecorMode.js)
    this.crownImages = new Map();
    this.waterfalls = [];
    // fließender Fluss (LEVEL.flow): seine Wasserkacheln sind eigene Bilder, deren Bild reihum wechselt (siehe animateFlow)
    const river = LEVEL.flow ? riverTiles() : null;
    this.flowTiles = [];
    // Uferstreifen (Sand, Kies, heller Schlamm) zwischen Gras und Wasser, siehe shore.js: wird mit dem Boden gemalt
    const shoreKeys = [];
    const shore = (x, y, tx, ty, key) => {
      const k = shoreTexture(this, tx, ty, key);
      if (k) {
        ground.push([x, y, k]);
        shoreKeys.push(k);
      }
    };
    // weicher Übergang zwischen Bodenarten (siehe groundBlend.js): vor dem Ufer gemalt, damit das Ufer obenauf liegt
    const blend = (x, y, tx, ty) => {
      for (const k of [blendTexture(this, tx, ty), mudTexture(this, tx, ty)]) {
        if (!k) continue;
        ground.push([x, y, k]);
        shoreKeys.push(k);
      }
    };
    const firstStatic = this.children.list.length; // ab hier: feste Dinge der Karte (werden außerhalb des Bildes ausgeblendet)
    for (let ty = 0; ty < MAP_H; ty++) {
      for (let tx = 0; tx < MAP_W; tx++) {
        if (charAt(tx, ty) === ' ') continue; // außerhalb der Karte: nichts (die Karte muss nicht rechteckig sein)
        const { x, y } = tileToWorld(tx, ty);
        // Boden liegt immer ganz unten. Wasserecken, die ins Land ragen, werden abgerundet; darunter Gras.
        const corners = outerWaterCorners(tx, ty);
        if (river?.has(tx + ',' + ty)) {
          if (corners) ground.push([x, y, cornerGroundAt(tx, ty)]);
          if (corners) blend(x, y, tx, ty);
          if (corners) shore(x, y, tx, ty, cornerGroundAt(tx, ty));
          const key = LEVEL.flow.frames[0];
          const img = this.add.image(x, y, corners ? roundedTexture(this, key, corners) : key).setDepth(-99998);
          this.flowTiles.push({ img, corners });
        } else if (corners) {
          ground.push([x, y, cornerGroundAt(tx, ty)]); // Gras, im Schlammloch Schlamm
          blend(x, y, tx, ty);
          shore(x, y, tx, ty, cornerGroundAt(tx, ty)); // Ufer unter der Rundung
          ground.push([x, y, roundedTexture(this, groundAt(tx, ty), corners)]);
        } else if (outerLandCorners(tx, ty)) {
          // Rasenecke, die ins Wasser ragt: abgerundet, darunter das Wasser des Nachbarn (am Fluss fließend)
          const land = outerLandCorners(tx, ty);
          const [wx, wy] = [[tx - 1, ty], [tx, ty - 1], [tx + 1, ty], [tx, ty + 1]].find(([a, b]) => isShoreWater(charAt(tx, ty), charAt(a, b)));
          const round = roundedTexture(this, groundAt(tx, ty), land);
          if (river?.has(wx + ',' + wy)) {
            this.flowTiles.push({ img: this.add.image(x, y, LEVEL.flow.frames[0]).setDepth(-99998), corners: 0 });
            this.add.image(x, y, round).setDepth(-99997.9);
            const sh = shoreTexture(this, tx, ty, groundAt(tx, ty));
            if (sh) {
              this.add.image(x, y, sh).setDepth(-99997.85); // Ufer über dem fließenden Wasser
              this.events.once('shutdown', () => removeShoreTextures(this, [sh]));
            }
          } else {
            ground.push([x, y, groundAt(wx, wy)]);
            ground.push([x, y, round]);
            blend(x, y, tx, ty);
            shore(x, y, tx, ty, groundAt(tx, ty));
          }
        } else {
          // unbefestigte Wege: Ecken zum Gras hin abgerundet (darunter Gras), Grasecken im Weg ebenso (darunter Weg)
          const pathRound = raiseAt(tx, ty) ? 0 : pathOuterCorners(tx, ty);
          const grassRound = raiseAt(tx, ty) || pathRound ? null : grassPathCorners(tx, ty);
          if (pathRound) {
            ground.push([x, y, grassAt(tx, ty)]);
            ground.push([x, y, roundedTexture(this, groundAt(tx, ty), pathRound)]);
          } else if (grassRound) {
            ground.push([x, y, grassRound.under]);
            ground.push([x, y, roundedTexture(this, groundAt(tx, ty), grassRound.mask)]);
          } else {
            ground.push([x, y - raiseAt(tx, ty), groundAt(tx, ty)]); // Terrarium auf einem Sockel: der Boden liegt höher
            if (!raiseAt(tx, ty) && groundAt(tx, ty) === grassAt(tx, ty)) blend(x, y, tx, ty);
          }
          if (!raiseAt(tx, ty)) shore(x, y, tx, ty, groundAt(tx, ty));
        }
        const edge = raisedEdgeFloor(tx, ty); // Terrarium auf einem Sockel: Boden auch zwischen erhöhtem Boden und Vorderwand
        if (edge) ground.push([x, y - edge.raise, edge.key]);

        // Biberburg: ein weicher dunkler Erdfleck flach auf dem Gras darunter
        if (charAt(tx, ty) === 'Ƅ') this.add.image(x, y - SOIL_UP, 'forest_dark_soil').setDepth(SOIL_DEPTH);
        const obj = objectAt(tx, ty);
        if (obj?.bridge) continue; // Brücken werden unten am Stück gezeichnet
        if (obj?.bed) this.beds.push({ tx, ty });
        if (obj?.stand) this.stands.push({ tx, ty, x, y });
        if (obj?.fence) {
          const imgs = this.addFence(tx, ty, obj);
          // vordere Hüttenwände (zur Kamera hin) werden durchsichtig, wenn man drin ist
          const h = obj.fence.kind === 'hut' ? buildingAt(tx, ty) : null;
          // hintere Glasscheiben der Wassertanks: dort ist die dunkelblaue Rückwand (siehe drawTanks), die Pfosten bleiben
          if (h?.style === 'tank' && (ty === h.ty0 || tx === h.tx0) && !(ty === h.ty1 || tx === h.tx1)) {
            for (const img of imgs) if (img.texture.key.startsWith('hutwall_')) img.setVisible(false).noCull = true;
          }
          if (h && (ty === h.ty1 || tx === h.tx1)) {
            if (!this.houseFront.has(h)) this.houseFront.set(h, []);
            this.houseFront.get(h).push(...imgs);
          }
        }
        else if (obj?.invisible) {
          // nur fest, nichts zu sehen (z. B. die Seiten des großen Schreibtischs)
        } else if (obj?.key === 'signpost_post') {
          this.drawSignBoards(x, y, tx, ty);
        } else if (obj?.invisible) {
          // nur fest, ohne Bild (z. B. die zweite Kachel unter einem Bett)
        } else if (obj) {
          // Einrichtung passend zur Hütte (auch außen an der Wand); variants: eines von mehreren Bildern, fest pro Kachel
          const variant = obj.variants && obj.variants[(((tx * 73856093) ^ (ty * 19349663)) >>> 0) % obj.variants.length];
          const key = obj.styled ? `${obj.key}_${buildingAt(tx, ty, 1)?.style}` : LEVEL.objectKeys?.[charAt(tx, ty)] ?? variant ?? obj.key;
          // depthShift nur in Hütten (z. B. die Kiste vor der Rückwand); draußen gilt die normale Tiefe, sonst steht sie vor der Spielfigur
          const shift = obj.depthAlways ?? (buildingAt(tx, ty) || obj.styled ? obj.depthShift ?? 0 : 0);
          const img = this.add.image(x, y - raiseAt(tx, ty), key).setOrigin(obj.originX ?? 0.5, obj.originY).setDepth(obj.depthFixed ?? (obj.floor ? -99990 : y + shift));
          if (obj.thicket) thicketImages.set(`${tx},${ty}`, img);
          if (obj.decor || obj.toy) this.decorImages.set(`${tx},${ty}`, img); // (Spielzeug lässt sich in Gehegen umstellen)
          if (obj.sway) swayPlants.set(`${tx},${ty}`, { img, deg: obj.sway, obj });
          if (charAt(tx, ty) === 'J') this.crownImages.set(`${tx},${ty}`, img); // Urwaldbäume: die Krone raschelt (Brüllaffen) // Dickicht: das Bild wechselt, wenn es geschlagen wird und nachwächst
          if (obj.waterfall) {
            this.waterfalls.push({ x, y, img });
            this.time.addEvent({ delay: 110, loop: true, callback: () => img.setFrame((Number(img.frame.name) + 1) % (img.texture.frameTotal - 1)) }); // das Wasser fällt (tools/waterfall-flow.py)
            this.time.addEvent({ delay: SPRAY_EVERY, loop: true, callback: () => this.waterfallSpray(x, y) }); // unten steigt Gischt auf
          }
          if (obj.bed) {
            // Bett: über zwei Kacheln (siehe BED_LOOK); beim Schlafen wechselt das Bild (mit Henrik darin)
            const style = buildingAt(tx, ty, 1)?.style;
            const look = BED_LOOK[style] ?? { dx: 0, dy: 0, head: [0, -30] };
            img.setPosition(x + look.dx, y + look.dy).setDepth(y + (look.depth ?? look.dy));
            if (look.origin) img.setOrigin(...look.origin);
            const bed = this.beds.find((b) => b.tx === tx && b.ty === ty);
            Object.assign(bed, { img, key, head: { x: x + look.dx + look.head[0], y: y + look.dy + look.head[1] } });
          }
          if (obj.noCull) img.noCull = true; // große Bilder (Aquarium-Fassade) nicht ausblenden, nur weil ihr Ankerpunkt außerhalb ist
          if (obj.chest && obj.styled && !buildingAt(tx, ty)) {
            // Regal außen vor der Hütte: ein Stück vor die Wand gerückt, damit der Dachüberstand Kescher und Lasso nicht verdeckt
            img.setPosition(x - 19, y + 10).setDepth(y - 4);
          }
          if (obj.corner) {
            // in die Ecke rücken: ein Stück zu den Wänden hin, die neben der Kachel stehen
            const wall = (dx, dy) => objectAt(tx + dx, ty + dy)?.fence?.kind === 'hut';
            const du = wall(1, 0) ? 1 : wall(-1, 0) ? -1 : 0;
            const dv = wall(0, 1) ? 1 : wall(0, -1) ? -1 : 0;
            img.setPosition(x + (du - dv) * 32 * 0.35, y + (du + dv) * 16 * 0.35);
          }
          // Antippen geht nur, wenn man direkt daneben steht (wie mit der Aktionstaste); aus der Ferne passiert nichts (auf dem
          // Handy streift der Finger beim Laufen sonst ständig Dinge)
          if (obj.chest) {
            this.chestSprites.set(`${tx},${ty}`, img);
            img.setInteractive({ useHandCursor: true }).on('pointerdown', () => {
              const chest = this.chestAt(tx, ty);
              if (chest && this.nearChest === chest) this.openChest(chest);
            });
          }
          if (obj.computer) this.computerSprite = img; // für Mavis Pfeil
          if (obj.computer) img.setInteractive({ useHandCursor: true }).on('pointerdown', () => this.nearComputer && this.openEventsPanel());
        }
      }
    }

    this.cullables = this.children.list.slice(firstStatic).filter((o) => (o.type === 'Image' || o.type === 'Text') && !o.noCull);
    if (this.flowTiles.length) {
      let frame = 0;
      this.time.addEvent({
        delay: LEVEL.flow.ms,
        loop: true,
        callback: () => {
          frame = (frame + 1) % LEVEL.flow.frames.length;
          const key = LEVEL.flow.frames[frame];
          for (const { img, corners } of this.flowTiles) if (img.visible) img.setTexture(corners ? roundedTexture(this, key, corners) : key);
        },
      });
    }
    // große Bilder jenseits des Kartenrands, ganz hinten (z. B. der dunkle Wald hinter dem Wolfswald); nicht ausgeblendet
    for (const b of LEVEL.backdrops ?? []) {
      const { x, y } = tileToWorld(b.tx, b.ty);
      const img = this.add.image(x, y, b.key);
      img.setOrigin(b.ox / img.width, b.oy / img.height).setDepth(-99000);
    }
    // Zeichen im Pflaster (z. B. Fische, die zum Aquarium zeigen): flach auf dem Weg, über dem Boden
    for (const m of LEVEL.pathMarks ?? []) {
      const { x, y } = tileToWorld(m.tx, m.ty);
      this.add.image(x, y, pathFishTexture(this, m.dir)).setDepth(-99990);
    }
    this.cullView = null;
    this.bakeGround(ground);
    removeShoreTextures(this, shoreKeys); // sind jetzt im Boden gemalt (auch die Übergänge zwischen Bodenarten)
    clearBlendCache();

    // Tore der Gehege: jedes verschwindet kurz, solange jemand hindurchgeht
    this.gateGroups = ENCLOSURES.filter((e) => e.gates.length).map((e) => ({
      sprites: e.gates.map(({ tx, ty, vertical }, i) => {
        const { x, y } = tileToWorld(tx, ty);
        let style = e.gate && e.gate !== 'wood' ? `gate_${e.gate}_` : 'gate_';
        if (e.gate === 'glass' && e.petting && i === Math.floor(e.gates.length / 2)) style = 'gate_glassflap_'; // Katzenklappe in der Mitte (Katzenhaus)
        const img = this.add.image(x, y, style + (vertical ? 'y' : 'x'));
        // Kachelmitte liegt 20 Pixel über dem unteren Bildrand (bei hohen Toren wie dem Wildzaun-Tor ebenso)
        return img.setOrigin(0.5, (img.height - 20) / img.height).setDepth(y);
      }),
      enclosure: e,
      open: false,
      closeTimer: 0,
    }));
    // Gebäude (Hütte, Katzenhäuschen ...): Tür (geht auf wie ein Gehegetor) und Dach über dem ganzen Raum.
    // Ist das Gebäude zugleich ein Gehege, gehört die Tür zum Gehege (z. B. die Glastür des Katzenhäuschens).
    this.houses = [];
    for (const h of buildings()) {
      const front = this.houseFront.get(h) ?? [];
      const penGates = ENCLOSURES.flatMap((e) => e.gates);
      const doors = GATE_TILES.filter(({ tx, ty }) => tx >= h.tx0 && tx <= h.tx1 && ty >= h.ty0 && ty <= h.ty1 && !penGates.some((g) => g.tx === tx && g.ty === ty));
      const group = {
        sprites: doors.map(({ tx, ty, vertical }) => {
          const { x, y } = tileToWorld(tx, ty);
          const img = this.add.image(x, y, `gate_door_${h.style}_${vertical ? 'y' : 'x'}`);
          return img.setOrigin(0.5, (img.height - 20) / img.height).setDepth(y);
        }),
        open: false,
        closeTimer: 0,
      };
      this.gateGroups.push(group);
      front.push(...group.sprites);
      // Eingang des Haupthauses: dorthin zeigt Mavis Pfeil, bevor man drin ist (dann zum Computer)
      const door = group.sprites[0];
      if (h.style === 'office' && door) this.officeDoor = { x: door.x, y: door.y - OFFICE_DOOR_H };
      // obere Ecke der Grundfläche liegt im Dachbild bei ROOF_ANCHOR (Hütten: 184, 100)
      const top = tileToWorld(h.tx0, h.ty0);
      const bottom = tileToWorld(h.tx1, h.ty1);
      const [ax, ay] = ROOF_ANCHOR[h.style] ?? [184, 100];
      // noRoof: Gebäude ohne Dach (Aquarium-Halle, Wassertanks)
      const roof = h.noRoof ? null : this.add.image(top.x, top.y - TILE_H / 2, `hutroof_${h.style}`);
      roof?.setOrigin(ax / roof.width, ay / roof.height).setDepth(bottom.y + TILE_H / 2 + 1);
      roof?.setAlpha(ROOF_ALPHA[h.style] ?? 1);
      for (const img of front) img.setAlpha(FRONT_ALPHA[h.style] ?? 1);
      this.houses.push({ h, roof, front, inside: false });
    }

    this.drawTanks();
    this.drawSea();
    this.drawDarkRooms();

    // Je Tierart ein Schild mit ihrem Bild, am Zaun neben dem Tor (gemeinsame Gehege: mehrere Schilder nebeneinander, siehe
    // signSpots). Dazu weitere Tafeln eines Bereichs (signs, z. B. an den Haltebuchten der Safari) auf einem eigenen Platz
    const signDefs = ENCLOSURES.flatMap((e) => {
      const list = e.species ?? [];
      const own = !e.sign ? [] : list.length > 1
        ? this.signSpots(e, list.length).map((s, i) => ({ e, at: s.at, shift: s.shift, fence: s.fence, only: [list[i]], name: null }))
        : [{ e, at: e.sign, shift: 0, only: list.length ? list : null, name: null }];
      return [...own, ...(e.signs ?? []).map((s) => ({ e, at: s.spot, shift: 0, only: s.species, name: s.name, extra: true }))];
    });
    this.enclosureSigns = signDefs.map(({ e, at, shift, fence, only, name, extra }) => {
      const at0 = tileToWorld(at.tx, at.ty);
      const x = at0.x + shift; // (Schilder nebeneinander auf einem Platz: seitlich verschoben)
      const y = at0.y;
      // immer vor dem Tor (und dem Zaun) zeichnen, damit nichts das Schild verdeckt (nur Tore in der Nähe: die Safari hat
      // Tore weit weg, vor denen das Schild sonst über allem läge)
      // ohne Zaun (Teich ohne Zaun) oder mit eigenem Platz abseits vom Zaun (signAt, z. B. im Wildpark an der Weggabelung):
      // das Schild steht auf einem eigenen Holzpfosten (an den Wassertanks hängt es an der Scheibe)
      const onFence = fence ?? (only && extra ? !!fenceAxisAt(at.tx, at.ty) : e.gates.length && !(e.signAt && !fenceAxisAt(e.signAt.tx, e.signAt.ty)));
      // ein Schild auf eigenem Pfosten steht für sich: Tiefe nach seinem Fuß, damit die Spielfigur davor über ihm liegt
      const nearGates = onFence || e.signOnGlass ? e.gates.filter((g) => Math.abs(g.tx - at.tx) + Math.abs(g.ty - at.ty) <= 6) : [];
      let front = Math.max(y, ...nearGates.map((g) => tileToWorld(g.tx, g.ty).y)) + 2;
      if (e.dark) front = DARK_DEPTH + 20; // im dunklen Raum über der Abdunklung, damit man es lesen kann
      // signOnRoof: das Schild sitzt oben auf dem Dach des Gebäudes (z. B. Katzenhaus), damit man es von weitem sieht
      const house = e.signOnRoof && !extra ? buildingAt(e.tiles[0].tx, e.tiles[0].ty) : null;
      let sx = x, sy = y;
      // Tor in einer Hauswand (Katzenhaus): das Schild hängt an der Wand neben der Tür, vor dem (durchsichtigen) Dach
      const wall = !house && e.gates[0] && buildingAt(e.gates[0].tx, e.gates[0].ty);
      if (wall) front = tileToWorld(wall.tx1, wall.ty1).y + TILE_H + 2;
      if (house) {
        const c = tileToWorld((house.tx0 + house.tx1) / 2, (house.ty0 + house.ty1) / 2);
        sx = c.x + shift;
        sy = c.y - 78; // über dem First
        front = tileToWorld(house.tx1, house.ty1).y + TILE_H + 2; // vor dem Dach
      }
      // mitten an einem Zaun (nicht neben einem Tor, z. B. die Schilder am Fußweg der Safari oder das zweite Schild eines
      // gemeinsamen Geheges): vor dem nächsten Zaunpfosten zeichnen, sonst verdeckt er die Zahl darunter
      if (onFence && (extra || fence || e.signAt)) front = Math.max(front, y + TILE_H / 2 + 2);
      // eigene Tiefe ohne das Tor davor: gilt, solange das Tor offen (unsichtbar) ist – dann liegt die Spielfigur in der
      // Toröffnung vor dem Schild statt dahinter (geschlossen muss das Schild vor dem Tor liegen, das es sonst anschneidet)
      const own = onFence ? y + TILE_H / 2 + 2 : y + 2;
      const parts = [];
      if (!onFence && !house && !e.signOnGlass) {
        parts.push(this.add.rectangle(sx, sy - 6, 3, 18, 0x8a5a30).setStrokeStyle(1, 0x3c2814).setDepth(front - 0.1));
      }
      parts.push(this.add.image(sx, sy - 20, 'esign_board').setScale(0.5).setDepth(front));
      // das Bild der Tierart auf der hellen Tafel (38×22 Pixel, Mitte etwas unter der Bildmitte)
      const list = only ?? e.species ?? [];
      const step = SIGN_INNER_W / list.length;
      list.forEach((s, i) => {
        const icon = this.add.image(sx - SIGN_INNER_W / 2 + step * (i + 0.5), sy - 18, SPECIES[s].texture, s === 'fish' ? 1 : 0);
        icon.setScale(Math.min(SIGN_ICON_H / icon.height, (step - 2) / icon.width)).setDepth(front + 0.1);
        parts.push(icon);
      });
      // Plätze dieser Tierart: "4 / 6", voll mit Stern (teilen sich mehrere Arten die Plätze, steht auf jedem Schild die Summe)
      const quotas = penQuotas(e);
      const quota = (list.length && quotas.find(({ key }) => key === quotaKey(list[0]))) || quotas.find(({ key }) => key === null);
      const counts = quota
        ? [{ key: quota.key, text: this.add.text(sx, sy + 2, '', { fontFamily: 'Trebuchet MS, Arial', fontSize: '8px', fontStyle: 'bold', color: '#fff8e6', backgroundColor: '#3c2814cc', padding: { x: 3, y: 1 }, resolution: 4 }).setOrigin(0.5, 0).setDepth(front + 0.2) }]
        : [];
      parts.push(...counts.map((c) => c.text));
      // nur Schilder, die wegen eines Tors nach vorn gerückt sind (nicht im Dunkeln, an der Hauswand oder auf dem Dach)
      const lift = !e.dark && !wall && !house && own < front ? { parts: parts.map((p) => [p, p.depth]), drop: own - front } : null;
      return { x, y, enclosure: e, counts, only, name, lift };
    });
    this.updatePenSigns();
    this.wrongHomeTimer = 0;
    // Netzdach über Gehegen wie der Voliere
    for (const e of ENCLOSURES) if (e.netRoof) this.drawNetRoof(e);
    this.shownSign = null; // welches Schild die Tafel gerade zeigt
    // Tierfreunde (src/world/friends.js): Namensschilder über den benannten Tieren
    ensureFriendState();
    ensureFeedState(game.caughtSpecies);
    this.friendTags = new Map(); // Tier → Namensschild
    this.friendBars = new Map(); // Tier → Fortschrittsbalken (bis zur nächsten Stufe)
    this.friendVisitTimer = 0;
    this.nearFriend = null;
    this.needs = new Map(); // Tier → Bedürfnis { kind: 'pet' | 'feed', el, left } (Blase über dem Tier)
    this.needTimer = 3;
    this.nearNeed = null; // Tier ohne Namen mit Bedürfnis, nah genug zum Erfüllen
    this.events.once('shutdown', () => this.clearNeeds());


    // Auto für die Schnellreise: antippen oder daneben die Aktionstaste drücken öffnet die Weltkarte
    this.car = null;
    this.wolfNight = null; // Wolfsnacht im Wald (siehe updateWolfNight)
    this.migration = null; // Große Wanderung in der Savanne (siehe updateMigration)
    this.fireflies = null; // Glühwürmchen-Abend im Bambuswald (siehe updateFireflies)
    this.iceStand = null; // Eiswagen (siehe updateIceStand): nach einem Gebietswechsel neu aufbauen, die alten Bilder sind weg
    this.drawShops(); // feste Buden und leere Bauplätze (Tierpark)
    this.drawScooter(); // E-Roller neben dem Auto (Tierpark)
    this.jarFlies = 0; // so viele Glühwürmchen sind im Glas
    this.lantern = null; // abgestellte Moorlaterne (siehe placeLantern)
    this.hyenaPack = LEVEL.hyenas ? new HyenaPack(this, LEVEL.hyenas) : null; // Trockenzeit: das versteckte Hyänenrudel
    this.waterfallSun = LEVEL.waterfallSun && this.waterfalls.length ? new WaterfallSun(this, this.waterfalls[0]) : null; // Dschungel: ab und zu Sonne am Wasserfall (Leguane)
    this.seasonTimer = 1;
    // weitere Autos (extraCars): öffnen dieselbe Weltkarte
    this.cars = [];
    for (const [i, car] of (LEVEL.car ? [LEVEL.car, ...(LEVEL.extraCars ?? [])] : []).entries()) {
      const { x, y } = tileToWorld(car.tx, car.ty);
      const k = car.scale ?? 1; // alle Autos etwa gleich groß (siehe car.scale in levels.js)
      // das Boot (float) schwimmt oben auf dem Wasser: über der blauen Tönung und den Lichtstrahlen der Unterwasserwelt
      const img = this.add.sprite(x, y + 4 - (car.float ?? 0), car.texture, car.frame).setOrigin(0.5, 136 / 140).setScale(0.5 * k).setDepth(car.float ? SEA_TINT_DEPTH + 2 : y);
      if (car.texture.startsWith('car_')) this.add.image(img.x, img.y, this.carShadow(car.texture, car.frame)).setOrigin(0.5, 136 / (140 + SHADOW_PAD)).setScale(0.5 * k).setDepth(y - 1).setAlpha(0.43);
      img.setInteractive({ useHandCursor: true }).on('pointerdown', () => this.nearCar && this.openCarMap());
      const label = this.add
        .text(x, y - 76 * k, LEVEL.camp ? tr('Expedition beenden ▸', 'End expedition ▸') : tr('Schnellreise ▸', 'Fast travel ▸'), { fontFamily: 'Trebuchet MS, Arial', fontSize: '11px', fontStyle: 'bold', color: '#fff8e6', backgroundColor: '#3c2814cc', padding: { x: 5, y: 2 }, resolution: 4 })
        .setOrigin(0.5)
        .setDepth(100000)
        .setVisible(false);
      this.cars.push({ x, y, label, img, k, body: CAR_BODIES[i], reach: car.reach ?? CAR_DIST });
      if (car.bob) this.tweens.add({ targets: img, y: img.y - BOAT_BOB * 0.5, duration: 1700, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' }); // Wasserflugzeug (Dschungel): schaukelt auf dem Fluss
    }
    this.car = this.cars[0] ?? null;
    if (LEVEL.car?.float) this.floatBoat(); // U-Boot (Unterwasserwelt): schaukelt über dem Boden
    this.nearCar = false;

    // Beschriftung über den Übergängen in andere Level
    for (const exit of EXITS) {
      // breite Türen (mehrere Übergangs-Kacheln nebeneinander) nur einmal beschriften
      if (EXITS.some((o) => o !== exit && o.to === exit.to && Math.abs(o.tx - exit.tx) + Math.abs(o.ty - exit.ty) === 1 && (o.tx < exit.tx || o.ty < exit.ty))) continue;
      const { x, y } = tileToWorld(exit.tx, exit.ty);
      const locked = !isUnlocked(exit.to);
      if (locked) this.drawBarrier(exit);
      this.add
        .text(x, y - 34, locked ? `${exit.label} · ${tr('noch im Bau', 'under construction')}` : `${this.exitLabel(exit)} ▸`, {
          fontFamily: 'Trebuchet MS, Arial',
          fontSize: '11px',
          fontStyle: 'bold',
          color: '#fff8e6',
          backgroundColor: '#3c2814cc',
          padding: { x: 5, y: 2 },
          resolution: 4,
        })
        .setOrigin(0.5)
        .setDepth(100000);
    }

    const arrive = data.arrive ?? START;
    const start = tileToWorld(arrive.tx, arrive.ty);
    // Kleidung passend zum Gebiet (fehlt das Bild noch, die normale Figur); unter Wasser schwimmt sie
    const hero = LEVEL.hero && this.textures.exists(LEVEL.hero) ? LEVEL.hero : 'hero';
    this.player = new Player(this, start.x, start.y, hero, { swim: !!LEVEL.sea });
    // Regen, Blitze, Pfützen, Staubteufel bzw. Nebel (erst nach Henrik: der Nebel richtet sich nach seiner Position)
    this.weather = SEASON_LEVELS.includes(LEVEL_ID) || (LEVEL.expedition && !LEVEL.camp && LEVEL.season !== 'normal') ? new Weather(this, LEVEL.season) : null; // Expedition: gewürfeltes Wetter
    // war Henrik beim Verlassen auf dem E-Roller (Tierpark-Abschnitt, Aquarium, Reptilienhaus, Ausbau): weiterfahren
    if (game.scooterRiding && this.scooter) this.getOnScooter(true);
    // Kanu (Dschungel): wer neu ankommt (nicht beim Wetterwechsel, nicht zurück aus einer kleinen Map), findet es am Inselsteg
    if (LEVEL.boat && !LEVEL.expedition && !LEVEL.side && !data.seasonNote && !data.keepBoat && game.boat) game.boat = null; // (zurück durch den Fluss-Durchgang: man sitzt noch im Kanu)
    this.boat = LEVEL.boat ? new Boat(this) : null;
    this.floes = LEVEL.floes ? new Floes(this) : null; // Eisschollen (Eiswelt am Tag)
    this.sway = new Sway(this, swayPlants);
    this.meadowLife = new MeadowLife(this, this.sway); // Enten, Bienen, Windmühle, Pusteblumen (Wiese)
    this.snowCover = LEVEL.snowline ? new SnowCover(this) : null; // Schneedecke der Hochebene, läuft weich aus (Bambuswald)
    if (LEVEL.prayerFlags) new PrayerFlags(this); // Gebetsfahnen auf der Hochebene (Bambuswald)
    this.forestLife = LEVEL.bats || LEVEL.bees || LEVEL.birds || LEVEL.moss ? new ForestLife(this) : null; // Schaum, Moos, Bienen, Vögel, Fledermäuse (Wald)
    this.moorFog = LEVEL.moorFog ? new MoorFog(this) : null; // Nebel über dem Moor (Wald)
    this.savannaLife = LEVEL.flies || LEVEL.gravePatch ? new SavannaLife(this) : null; // Friedhofsboden, Fliegen- und Mückenschwärme (Savanne)
    this.safariCars = LEVEL.safariCars ? new SafariCars(this, LEVEL.safariCars) : null; // Besucherautos auf der Piste der Safari (Tierpark)
    this.coldHintIn = 0;
    this.nearBoat = null;
    if (!this.boat?.riding) this.unstickPlayer();

    // Werkzeuge am Boden: gespeicherter Stand oder die Startplätze des Levels
    const saved = game.levels[LEVEL_ID];
    this.thicket = thicketImages.size ? new Thicket(this, thicketImages, saved?.thicket) : null; // Dickicht (Dschungel)
    const pickupList =
      saved?.pickups ??
      TOOL_SPOTS.filter((s) => s.tool !== 'empty').map(({ tool, tx, ty }) => ({ tool, ...tileToWorld(tx, ty) }));
    this.pickups = pickupList.map(({ tool, x, y }) => new Pickup(this, x, y, tool, tool));
    // "Hände frei"-Plätze: bleiben immer liegen; wer darüber läuft, legt sein Werkzeug zurück an dessen Platz
    this.handSpots = TOOL_SPOTS.filter((s) => s.tool === 'empty').map(({ tx, ty }) => {
      const p = tileToWorld(tx, ty);
      return new Pickup(this, p.x, p.y, 'hand', 'empty');
    });

    // Das getragene Werkzeug kommt mit
    this.tool = null;
    this.toolId = null;
    if (game.tool) {
      this.tool = TOOLS[game.tool].create(this, this.player);
      this.toolId = game.tool;
    }

    // Tiere: gespeicherter Stand oder neu verteilen
    this.animals = [];
    if (saved) {
      // hat die Wetterphase gewechselt, während man woanders war: die wilden Tiere der alten Phase sind weitergezogen
      // (z. B. keine Nilpferde mehr in der Trockenzeit)
      const otherSeason = (s) => s.state === 'wild' && ((saved.season && saved.season !== LEVEL.season) || (SEASON_SPECIES[s.species] && LEVEL_ID === 'savanna' && SEASON_SPECIES[s.species] !== LEVEL.season));
      for (const s of saved.animals) {
        if (!SPECIES[s.species]) continue; // unbekannte Tierart im Spielstand (z. B. aus einer anderen Version): überspringen
        if (otherSeason(s)) continue;
        // pending: aus einem anderen Tierpark-Abschnitt hergeschickt, noch ohne Platz (siehe sendToSection): kommt unten ins Gehege
        const a = s.pending ? this.createAnimal(s.species, start.x, start.y, s.variant) : this.createAnimal(s.species, s.x, s.y, s.variant);
        if (s.pending) {
          a.origin = s.origin;
          a.pendingPlace = true; // unten gleich ins passende Gehege (auch wenn der Ankunftsort selbst in einem liegt)
        }
        a.skin = s.skin ?? null; // seltener Skin (Katze 2)
        a.uid = s.uid ?? null; // feste Nummer (benannte Tiere, siehe src/world/friends.js)
        a.penSince = s.since ?? 0;
        a.restore(s.state);
        a.life = s.life ?? Phaser.Math.FloatBetween(...LIFETIME);
      }
    } else {
      this.spawnAnimals(arrive);
    }
    // Biber am Fluss: Damm, Stöcke und die Kolonie an den angenagten Bäumen (wilde Biber werden nicht gespeichert)
    // (Expedition: nur, wenn Biber auf der Tierliste stehen; dann so viele, wie noch frei sind)
    const beavers = this.expMap ? (LEVEL.beavers && expRun()?.left?.beaver ? { ...LEVEL.beavers, count: () => expRun()?.left?.beaver ?? 0 } : null) : LEVEL.beavers;
    this.beaverDam = beavers ? new BeaverDam(this, beavers) : null;
    this.beaverDam?.fill(true);
    // Yak-Herde auf der Hochebene: Steinhaufen, Salzstein und die Herde (wilde Yaks werden nicht gespeichert)
    // (Expedition: so viele Yaks, wie auf der Tierliste noch frei sind)
    const yaks = this.expMap ? (LEVEL.yaks && expRun()?.left?.yak ? { ...LEVEL.yaks, count: () => expRun()?.left?.yak ?? 0 } : null) : LEVEL.yaks;
    this.yakHerd = yaks ? new YakHerd(this, yaks) : null;
    this.yakHerd?.fill(true);
    // Futtersträucher, wo Tapire oder Okapis leben (Dschungel, Expeditions-Maps, Maps hinter den Durchgängen)
    this._leafTiles = null;
    this.oaks = null; // Eichen zum Schütteln: je Map neu suchen (siehe oakNear)
    this.nearOak = null;
    this.leafBushes = this.leafBushTiles().length ? new LeafBushes(this, this.leafBushTiles()) : null;
    this.nearBush = null;
    this.stashedTool = null;
    this.tutSheepTimer = TUT_SHEEP_CHECK;
    this.ensureStorySheep(false);
    this.ensureStoryAnimals(false);
    this.spawnTimer = Phaser.Math.FloatBetween(...SPAWN_INTERVAL);
    this.heronTimer = LEVEL.herons ? Phaser.Math.FloatBetween(LEVEL.expedition ? 2 : 5, Math.max(LEVEL.expedition ? 4 : 5, LEVEL.herons.every[0])) : Infinity; // (kleine Maps: bald nach dem Ankommen)
    this.flamingoTimer = Phaser.Math.FloatBetween(2, FLAMINGO_EVERY[0]);

    // Ausgelegte Fallen in diesem Level (gefangene Tiere stehen schon als 'trapped' in der Tierliste)
    this.traps = new Map();
    for (const t of game.traps) {
      if (t.level !== LEVEL_ID) continue;
      const trap = new Trap(this, t.x, t.y);
      if (t.caught) trap.showCaught();
      this.traps.set(t.id, trap);
    }

    // Tiere im Gehege, die nicht (mehr) ganz in dessen Innenfläche stehen (z. B. nach einem Ausbau): neu hineinsetzen
    for (const a of this.animals) {
      if (a.pendingPlace) {
        delete a.pendingPlace;
        const e = this.pickPen(ENCLOSURES.filter((f) => accepts(f, a.species)), a);
        if (e) this.placeInPen(a, e, true);
        continue;
      }
      // freilaufende außerhalb ihres Bereichs (z. B. nach einer Änderung der Karte): neu verteilen
      if (a.enclosure?.free) {
        const { tx, ty } = worldToTile(a.x, a.y);
        if (!inFreeArea(a.enclosure, tx, ty)) this.placeInPen(a, a.enclosure, true);
        continue;
      }
      // (auch: Gehege, das diese Art nicht mehr aufnimmt – z. B. nach dem Zusammenlegen von Teichen und Volieren)
      const fits = a.enclosure && accepts(a.enclosure, a.species);
      // steckt es auf etwas Festem fest (z. B. eine Katze, die oben auf dem Kratzbaum gespeichert wurde)? Dann auf einen freien Platz
      const stuck = a.state === 'penned' && a.blocked === Animal.prototype.blocked && a.blocked(a.x, a.y);
      if (a.state !== 'penned' || (fits && !stuck && a.enclosureFullyAt(a.x, a.y) === a.enclosure)) continue;
      const e = (fits && a.enclosure) || this.pickPen(ENCLOSURES.filter((f) => accepts(f, a.species)), a);
      if (e) this.placeInPen(a, e, true);
    }

    // Tiere, die dem Spieler aus dem letzten Level gefolgt sind
    this.followers = [];
    // im Expeditions-Camp laufen sie nicht mehr mit: sie kommen in den Wagen (siehe expArriveCamp)
    const campArrivals = this.expCamp ? game.followers.map((a) => ({ ...a })) : [];
    for (const { species, variant, origin, skin, uid } of this.expCamp ? [] : game.followers) {
      if (!SPECIES[species]) continue;
      const a = this.createAnimal(species, start.x, start.y, variant);
      a.skin = skin ?? null;
      a.uid = uid ?? null;
      a.restore('following');
      a.origin = origin;
      this.followers.push(a);
    }
    game.followers = [];
    // zu volle Gehege und Becken (z. B. durch einen früheren Fehler beim Einliefern ins Aquarium) wieder auf ihre Plätze bringen;
    // die Meldung dazu kommt mit der von moveFollowersIntoPens
    const home = isPark(LEVEL_ID) || !!HOUSES[LEVEL_ID]; // Tierpark (alle Abschnitte), Aquarium, Reptilienhaus
    if (home) for (const e of ENCLOSURES) if (hasSlots(e) && !e.free) this.releaseExtra(e);
    const moved = home ? this.moveFollowersIntoPens() : ''; // im Tierpark (und in den Häusern) ziehen sie gleich ein
    this.updateTankDeco();
    // Tierbabys, solange das Event läuft (vor den Besuchern, die Babys locken sie an)
    this.babiesOn = false;
    if (BABY_LEVELS.includes(LEVEL_ID) && isActive('babies')) this.spawnBabies(false);
    // Besucher im Tierpark (wie viele, hängt von den Tieren in den Gehegen ab)
    this.visitors = home ? new VisitorCrowd(this) : null; // auch im Aquarium und im Reptilienhaus (eigene Besucher)
    this.eventTimer = 0;
    this.eventBanner = document.getElementById('event-banner');

    this.hud = document.getElementById('hud');
    this.questCard = document.getElementById('quest-card');
    this.questTab = document.getElementById('quest-tab');
    this.wishCards = document.getElementById('wish-cards'); // Besucherwünsche unter Mavis Aufgabe (siehe src/world/wishes.js)
    this.wishCards.onclick = () => {
      lastBookTab = 'quests';
      this.showJournal();
    };
    this.wishTimer = 0;
    this.nearWish = null;
    ensureWishes();
    this.encounterEl = document.getElementById('encounter');
    this.beaverHintEl = document.getElementById('beaver-hint');
    this.beaverHintEl.classList.remove('show');
    this.beaverHintFor = null;
    this.yakHintEl = document.getElementById('yak-hint');
    this.yakHintEl.classList.remove('show');
    this.yakHintFor = null;
    this.oakHintEl = document.getElementById('oak-hint');
    this.oakHintEl.classList.remove('show');
    this.oakHintFor = null;
    this.encounterEl.classList.remove('show');
    this.encounterAnimal = null;
    this.encounterTimer = 0;
    this.fleeCounts = {};
    const book = document.getElementById('btn-book');
    book.querySelector('.book-label').textContent = tr('Tierbuch', 'Book');
    book.setAttribute('aria-label', tr('Tierbuch', 'Animal Book'));
    this.questCard.onclick = (e) => {
      if (e.target.closest('.quest-fold')) return this.foldQuestCard(true);
      lastBookTab = 'quests';
      this.showJournal();
    };
    this.questTab.onclick = (e) => {
      e.stopPropagation();
      this.foldQuestCard(false);
    };
    document.getElementById('btn-book').onclick = (e) => {
      e.stopPropagation();
      this.showJournal();
    };
    this.mavi = new Mavi(this); // führt durch die Geschichte (siehe src/npc/Mavi.js)
    this.events.once('shutdown', () => {
      this.mavi.destroy();
      closeWalkHint(); // Lauf-Hinweis nicht in die nächste Szene mitnehmen
    });
    this.updateBookButton();
    this.updateQuestCard();
    this.updateEventBanner();
    this.toolbar = document.getElementById('tools');
    this.toast = document.getElementById('toast');
    this.signPanel = document.getElementById('sign');
    this.markerBox = document.getElementById('markers');
    this.markerBox.innerHTML = '';
    this.markers = new Map(); // Fallen-ID → Hinweis am Bildschirmrand
    // Kisten, Boni und Glücksbringer (siehe src/world/LuckWorld.js); Knöpfe oben rechts
    this.luck = new LuckWorld(this);
    const charmsBtn = document.getElementById('btn-charms');
    charmsBtn.innerHTML = `<span class="charms-icon">${CHARMS.clover.icon}</span><span class="btn-label">${tr('Glücksbringer', 'Lucky Charms')}</span>`;
    charmsBtn.setAttribute('aria-label', tr('Glücksbringer', 'Lucky Charms'));
    charmsBtn.onclick = (e) => {
      e.stopPropagation();
      this.showCharms();
    };
    document.getElementById('btn-campfire').onclick = (e) => {
      e.stopPropagation();
      this.luck.campfire();
    };
    // Deko-Taste (nur im Tierpark): Deko aussuchen, setzen und aufheben (siehe src/world/DecorMode.js)
    // große Deko (2×2 Kacheln, z. B. der Pavillon): die Karte zeichnet sie nicht selbst (unsichtbares Zeichen)
    for (const d of placedIn(LEVEL_ID)) if (DECOR[d.id]?.size) this.drawDecor(d.tx, d.ty);
    this.decor = new DecorMode(this);
    const decorBtn = document.getElementById('btn-decor');
    // Eisstand als Bild (public/assets/icon_build.png, eng zugeschnitten aus hd/icecream_stand; wie das Kleeblatt am Glücksbringer-Knopf); auf dem Handy nur das Bild
    decorBtn.innerHTML = `${iconImg('icon_build').replace('class="luck-img"', 'class="decor-icon"')}<span class="btn-label">${tr('Bauen', 'Build')}</span>`;
    decorBtn.setAttribute('aria-label', tr('Bauen', 'Build'));
    decorBtn.classList.toggle('show', this.decor.enabled);
    decorBtn.classList.remove('on');
    decorBtn.onclick = (e) => {
      e.stopPropagation();
      this.decor.toggle();
    };
    // nach dem Umstellen einer Bude: Setzen-Modus weiter (mit Blickrichtung), und dort kauft gleich jemand ein
    if (data.decorResume) {
      if (data.decorResume.face) Object.assign(this.player, { faceX: data.decorResume.face.x, faceY: data.decorResume.face.y });
      this.decor.flip = !!data.decorResume.flip;
      this.decor.start(data.decorResume.sel);
    }
    if (data.boothMoved) this.time.delayedCall(1200, () => this.visitors?.sendToShop(data.boothMoved));
    this.lastBuildHint = undefined;
    game.buildOpen = !!data.decorResume; // (Mavis Buden-Aufgabe ist erst erledigt, wenn die Bauen-Leiste zu ist)
    this.updateBuildHint();
    if (DECOR_RETURNED) this.time.delayedCall(600, () => this.showToast(tr(`${DECOR_RETURNED}× Deko ist zurück in der Bauen-Leiste.`, `${DECOR_RETURNED}× decor is back in the build bar.`)));
    this.signPanel.classList.remove('show');
    this.updateHud();
    this.updateToolbar();
    this.expUpdateCounter();
    if (LEVEL.campfire) this.drawCampfire(LEVEL.campfire);
    this.expArrow = null;
    this.expCampAnimals = [];
    if (this.expCamp) {
      this.expDrawCamp();
      if (LEVEL.canoe) this.drawCampCanoe(LEVEL.canoe);
      this.expArriveCamp(campArrivals);
    }
    if (this.expMap) this.expTopUp(worldToTile(this.player.x, this.player.y), false); // (Dickicht gibt es erst jetzt)
    if (LEVEL.inlet && (this.expMap || (LEVEL.side && game.side?.canoe))) this.expArriveByCanoe(); // (Fluss-Durchgang: mit dem Kanu hinein)
    if (data.level) {
      const back = data.returned ? `<br><small>${tr(`${data.returned} ist wieder im Regal im anderen Gebiet`, `${data.returned} – back on the shelf in the other area`)}</small>` : '';
      if (data.upgraded) {
        this.time.delayedCall(350, () => this.showToast(tr(`🏗️ ${data.upgraded} ausgebaut! Mehr Platz, neue Ausstattung und Spielzeug – es kommen mehr Besucher.`, `🏗️ ${data.upgraded} upgraded! More space, new equipment and toys – more visitors come.`)));
      }
      if (data.built) {
        const def = sourceDef(builtOn(data.built));
        if (def === WHEEL) this.time.delayedCall(350, () => this.showToast(tr(`${def.icon} Das Riesenrad dreht sich! Jede Fahrt bringt ${def.hearts} Herzen, und es kommen mehr Besucher.`, `${def.icon} The Ferris wheel is turning! Every ride brings ${def.hearts} hearts, and more visitors come.`)));
        else if (def) this.time.delayedCall(350, () => this.showToast(tr(`${def.icon} ${def.name} ist fertig! Jeder Verkauf bringt ${def.hearts} Herzen.`, `${def.icon} ${def.name} is open! Every sale brings ${def.hearts} hearts.`)));
        this.time.delayedCall(1200, () => this.visitors?.sendToShop(data.built)); // gleich kauft jemand ein
      }
      if (data.seasonNote) this.showToast(data.seasonNote); // Wetterwechsel in der Savanne
      else this.showToast(`${LEVEL.name}${this.expMap ? ` · ${tr(`Map ${expRun().step} von ${RUN_LENGTH}`, `Map ${expRun().step} of ${RUN_LENGTH}`)}` : ''}${this.expHiddenHint()}${this.expEvent() ? `<br><small>${tr('🦬 Große Wanderung! Unten links zieht eine riesige Gnu-Herde vorbei – halte das Lasso bereit.', '🦬 Great Migration! A huge herd of wildebeest is passing by on the lower left – keep your lasso ready.')}</small>` : ''}${back}${moved}${LEVEL.wip ? `<br><small>${tr('🚧 Dieses Gebiet ist noch nicht fertig – hier kommen bald weitere Tiere dazu.', '🚧 This area is still under construction – more animals are coming soon.')}</small>` : ''}`);
    }

    const cam = this.cameras.main;
    cam.setBackgroundColor(LEVEL.background ?? '#4f8a2f'); // Farbe außerhalb der Karte
    this.fitZoom();
    this.scale.on('resize', this.fitZoom, this);
    this.events.once('shutdown', () => this.scale.off('resize', this.fitZoom, this));
    if (data.level) cam.fadeIn(300); // nach einem Levelwechsel sanft einblenden
    hideLoading(); // fertig aufgebaut (siehe showLoading beim Starten, Gebietswechsel und Ausbau)
    sessionLoaded(); // für die Statistik: Ladezeit (nur beim ersten Gebiet der Runde)
    if (data.fromWorld) {
      game.parkReturns++;
      this.time.delayedCall(PROMO_DELAY, () => this.maybeShowPromo());
    }
    this.startAmbient();
    this.startSteam();
    this.drawBridges();
    this.drawArches();
    this.drawProps();
    this.ropeBridge = LEVEL.ropeBridge ? new RopeBridge(this, LEVEL.ropeBridge) : null; // Seilbrücke der roten Pandas
    this.jungleHall = LEVEL.jungleHall ? new JungleHall(this, LEVEL.jungleHall) : null; // Tropenhalle: Glasdach und Sprühnebel

    // ESC (oder der Menü-Knopf oben rechts) öffnet das Menü: speichern, zurück zum Startbildschirm
    this.input.keyboard.on('keydown-ESC', (e) => e?.timeStamp !== this.decor?.escAt && this.openGameMenu()); // (Esc im Setzen-Modus beendet nur ihn)
    saveHandlers.snapshot = () => this.saveGame();
    // Werkzeug einsetzen (wenn man eins hat): E, Enter oder der Aktionsknopf auf dem Tablet
    const useTool = (event) => {
      if (event?.repeat) return; // gedrückt gehalten: nur der erste Druck zählt (z. B. beim Trommeln)
      if (isSpeaking()) {
        speechNext(); // Mavi spricht: nächste Seite
        return;
      }
      if (this.nearBoat && !this.leaving) {
        this.useBoat(); // am Steg: ins Kanu steigen bzw. aussteigen
        return;
      }
      if (this.onStand) {
        this.climbDown(); // oben auf dem Hochstand: wieder herunter
        return;
      }
      if (this.nearStand && !this.leaving) {
        this.climbUp(this.nearStand); // an der Leiter: hinauf
        return;
      }
      if (this.thicket?.target.size && !this.leaving) {
        this.thicket.strike(); // vor dem Dickicht: mit der Machete zuschlagen
        return;
      }
      if (this.nearFeeder && !this.leaving && this.toolId !== 'parkfood') {
        this.openFeeder(); // am Futterautomaten: Futterhaus (Futtersack oder Futter für die Tierfreunde)
        return;
      }
      if (this.nearComputer && !this.leaving) {
        this.openEventsPanel(); // am Hauptrechner: Events
        return;
      }
      if (this.luck.nearChest && !this.leaving) {
        this.luck.openChest(); // an einer Schatzkiste (Kisten-Karten)
        return;
      }
      if (this.nearChest && !this.leaving) {
        this.openChest(this.nearChest); // an der Kiste: Werkzeug auswählen
        return;
      }
      if (this.nearBed && !this.leaving) {
        this.rest(); // am Bett: ausruhen, danach ist das Wetter weiter
        return;
      }
      if (this.nearScooter && !this.driving && !this.leaving) {
        this.getOnScooter(); // am E-Roller: aufsteigen
        return;
      }
      if (this.nearSlot && !this.tool && !this.leaving) {
        this.openEventsPanel(null, this.nearSlot.slot.id); // am Bauplatz: Bude aussuchen
        return;
      }
      if (this.nearWish && !this.leaving) {
        this.talkToWisher(this.nearWish); // Wunsch-Besucher ansprechen: sein Wunsch kommt als Wunschkarte
        return;
      }
      if (this.nearNeed && !this.leaving) {
        this.meetNeed(this.nearNeed); // Tier ohne Namen mit Bedürfnis: erfüllen, dann gleich benennen
        return;
      }
      if (this.nearFriend && !this.leaving) {
        if (isTreat(this.toolId)) this.feedFriend(this.nearFriend); // am Zaun beim Tierfreund: mit Futter in der Hand füttern,
        else this.petFriend(this.nearFriend); // sonst streicheln
        return;
      }
      if (this.shownSign && this.toolId !== 'parkfood' && !this.leaving) {
        this.openSign(); // am Gehegeschild: Tafel mit den Tieren öffnen (mit Futter in der Hand wirft man weiter)
        return;
      }
      const pen = PEN_UPGRADES && this.penAtSign();
      if (pen && !this.tool && !this.leaving) {
        this.openEventsPanel(pen.id); // am Gehegeschild: Ausbau dieses Geheges
        return;
      }
      if (this.nearCages && !this.leaving) {
        this.expOpenWagon(); // Expeditions-Camp: an den Käfigen der Wagen
        return;
      }
      if (this.nearCanoe && !this.leaving) {
        this.expOnwards({ x: this.player.x, y: this.player.y }); // Dschungel-Camp: mit dem Kanu weiter (vorher die Karten)
        return;
      }
      if (this.decor?.on && ['place', 'pick'].includes(this.decor.state?.kind) && !this.leaving) {
        this.decor.act(); // Setzen-Modus: Setzen bzw. Aufheben geht vor (am Auto öffnete sonst die Karte)
        return;
      }
      if (this.nearCar && !this.leaving) {
        this.openCarMap(); // am Auto: Weltkarte statt Werkzeug
        return;
      }
      if (this.nearDam && this.toolId === 'stick' && !this.leaving) {
        this.fixDam(); // am Biberdamm: Stock ins Loch
        return;
      }
      if (this.nearOak && !this.leaving) {
        this.shakeOak(this.nearOak); // an der Eiche: Eicheln herunterschütteln
        return;
      }
      if (this.nearLantern && !this.leaving) {
        this.equipTool('lantern'); // abgestellte Moorlaterne wieder aufheben (das Werkzeug in der Hand kommt zurück in die Kiste)
        return;
      }
      if (this.nearStick && this.toolId !== 'stick' && !this.leaving) {
        this.takeStick(this.nearStick); // großen Stock aufheben
        return;
      }
      if (this.nearCairn && this.toolId === 'salt' && !this.leaving) {
        this.putSalt(); // am Steinhaufen: Salzstein ablegen
        return;
      }
      if (this.nearSalt && this.toolId !== 'salt' && this.toolId !== 'brush' && !this.leaving) {
        this.takeSalt(); // Salzstein aufheben
        return;
      }
      if (this.nearBush && this.toolId !== 'leaves' && !this.leaving) {
        this.takeLeaves(this.nearBush); // am Futterstrauch: Blätterzweig abbrechen
        return;
      }
      if (this.nearOrangutan && !this.tool && !this.leaving) {
        this.waveAt(this.nearOrangutan); // unter dem Orang-Utan: zurückwinken
        return;
      }
      if (this.nearTurtle && !this.leaving && this.toolId !== 'scissors') {
        this.showToast(tr('✂️ Das Netz ist zu fest – hol die Schere aus dem Sack am Anker.', '✂️ The net is too strong – get the scissors from the bag at the anchor.')); // mit der Schere schneidet der Werkzeug-Einsatz
        return;
      }
      // Setzen-Modus (Deko-Taste): Deko setzen bzw. aufheben statt Werkzeug oder Absteigen
      if (this.decor?.on && !this.leaving && this.decor.act()) return;
      // auf dem E-Roller: jede andere Aktion (oben) und das Werkzeug haben Vorrang, sonst steigt man ab
      if (this.driving && !this.tool && !this.leaving) {
        this.getOffScooter();
        return;
      }
      const tool = this.tool;
      if (this.leaving || !tool || tool.active) return; // läuft schon ein Schwung, zählt der Druck nicht
      tool.use();
      if (!(tool instanceof DrumTool) && this.cache.audio.exists('whoosh')) this.sound.play('whoosh', { volume: WHOOSH_VOLUME }); // die Trommel klingt selbst
    };
    this.input.keyboard.on(`keydown-${ACTION_KEY}`, useTool);
    this.input.keyboard.on('keydown-ENTER', useTool);
    // am PC: Linksklick ins Bild wie die Aktionstaste (Regal, Auto, Computer und Schilder haben ihre eigenen Klicks;
    // auf Tablet und Handy gibt es dafür den Aktionsknopf)
    // Bauen: Antippen bzw. Anklicken einer Kachel in Henriks Nähe setzt dort bzw. hebt auf (Tablet: viel leichter, als
    // Henrik genau davorzustellen); die linke Bildschirmhälfte (Joystick) meldet kurzes Tippen über touchHandlers.tap
    this.input.on('pointerdown', (pointer, over) => {
      if (pointer.button !== 0 || over.length) return;
      if (this.decor?.on && !this.leaving) {
        const w = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
        this.decor.tap(w.x, w.y);
        return;
      }
      if (pointer.wasTouch) return;
      useTool();
    });
    // Übersicht über Tiere und Werkzeuge (Taste I oder Tippen auf das Abzeichen oben links)
    this.input.keyboard.on('keydown-I', () => this.showJournal());
    // beim Reiten: Werkzeug wechseln (Q bzw. der Werkzeug-Knopf auf dem Tablet) – überall, ohne zur Hütte zu gehen
    this.input.keyboard.on('keydown-Q', () => this.openRideChest());
    // Glücksbringer ansehen bzw. (im Tierpark) wechseln: Taste G; Lagerfeuer (Glücksbringer): Taste F
    this.input.keyboard.on('keydown-G', () => this.showCharms());
    this.input.keyboard.on('keydown-F', () => this.luck.campfire());
    // Deko-Taste: B
    this.input.keyboard.on('keydown-B', () => this.decor?.toggle());
    // Cheat zum Testen: K stellt in dieser Welt sofort neue Kisten auf
    this.input.keyboard.on('keydown-K', () => {
      if (!this.luck.enabled) return;
      chestState().readyAt = 0;
      this.luck.timer = 0;
    });
    // Cheat zum Testen: L gibt 50 Bewunderungsherzen
    this.input.keyboard.on('keydown-L', () => {
      this.addHearts(50);
      for (const b of Object.values(game.bonds ?? {})) b.pettedAt = b.fedAt = 0; // Tierfreunde: Streicheln und Füttern gehen wieder
      if (this.shownSign && !this.signOpen) this.showSignPanel(this.shownSign);
      this.showToast('Cheat: <span class="heart">♥</span> +50 · Tierfreunde wieder bereit');
    });
    document.getElementById('btn-swap').onclick = (e) => {
      e.stopPropagation();
      this.openRideChest();
    };
    this.riding = false;
    this.updateMount();
    this.hud.onclick = () => this.showJournal();
    touchHandlers.action = useTool;
    touchHandlers.tap = (cx, cy) => {
      if (!this.decor?.on || this.leaving) return;
      const r = this.game.canvas.getBoundingClientRect();
      const w = this.cameras.main.getWorldPoint(((cx - r.left) * this.scale.width) / r.width, ((cy - r.top) * this.scale.height) / r.height);
      this.decor.tap(w.x, w.y);
    };
    touchHandlers.menu = () => this.openGameMenu();
    cam.setBounds(
      -MAP_H * (TILE_W / 2) - TILE_W,
      -TILE_H * 3,
      (MAP_W + MAP_H) * (TILE_W / 2) + TILE_W * 2,
      (MAP_W + MAP_H) * (TILE_H / 2) + TILE_H * 4,
    );
    cam.startFollow(this.player.sprite, true, 0.12, 0.12);
    // Blasen über Tieren und Besuchern (HTML) erst setzen, wenn die Kamera für dieses Bild nachgezogen hat; sonst hinken
    // sie beim Laufen einen Tick hinterher und zappeln
    cam.on(Phaser.Cameras.Scene2D.Events.FOLLOW_UPDATE, () => this.placeBubbles());
    // Kamera nirgends auf ganze Pixel runden: Figur und Kamera rasten sonst zu verschiedenen Zeiten auf den nächsten
    // Pixel ein, das sieht wie Stottern aus (besonders beim Laufen genau nach links und rechts; zuerst in Unterwasserwelt,
    // Eiswelt und Savanne bemerkt, dann auch auf der Wiese und im Tierpark)
    cam.roundPixels = false;
  }

  // Bogenbrücken: Bohlen als geschwungenes Band über dem Wasser, rote Geländer an beiden Seiten.
  // Das hintere Geländer liegt hinter, das vordere vor allem, was auf der Brücke steht.
  drawBridges() {
    const STEP = 0.125; // in Kacheln
    // Farben: rote Bogenbrücke (Asien) oder Holzbrücke (bridgeStyle 'wood', Wiese)
    const wood = LEVEL.bridgeStyle === 'wood';
    const C = wood
      ? { plank: [0xb58553, 0xa0703f], edge: 0x5e3d22, post: 0x8a5a32, cap: 0xb58553, rail: 0xa8763f, slat: 0x9a6a38 }
      : { plank: [0x9c5a38, 0xb06640], edge: 0x6e3a22, post: 0x9c2e20, cap: 0xe8b84a, rail: 0xd64a32, slat: 0xc8402c };
    for (const br of BRIDGES) {
      if (br.log) {
        this.drawLogBridge(br);
        continue;
      }
      const art = LEVEL.bridgeArt;
      if (art && br.axis === 'x' && br.to + 1 - br.from === art.len) {
        this.drawArtBridge(br, art);
        continue;
      }
      const arch = bridgeArch(br);
      const len = br.to + 1 - br.from;
      // Punkt auf der Brücke: u entlang (in Kacheln ab Brückenanfang), v quer (0 = hinten, 1 = vorne), h über dem Deck
      const pt = (u, v, h = 0) => {
        const along = br.from + u;
        const cross = br.at + v;
        const [txf, tyf] = br.axis === 'y' ? [cross, along] : [along, cross];
        const lift = Math.sin((Math.PI * u) / len) * arch;
        return { x: (txf - tyf) * (TILE_W / 2), y: (txf + tyf) * (TILE_H / 2) - lift - h };
      };
      const deck = this.add.graphics().setDepth(-99998);
      for (let u = 0, i = 0; u < len - 1e-6; u += STEP, i++) {
        const quad = [pt(u, 0), pt(u + STEP, 0), pt(u + STEP, 1), pt(u, 1)];
        deck.fillStyle(C.plank[i % 2], 1);
        deck.fillPoints(quad, true);
        deck.lineStyle(1, C.edge, 1);
        deck.lineBetween(quad[0].x, quad[0].y, quad[3].x, quad[3].y);
      }
      // Seitenkante des Decks (vorne), damit der Bogen Dicke bekommt
      for (let u = 0; u < len - 1e-6; u += STEP) {
        const a = pt(u, 1), b = pt(u + STEP, 1);
        deck.fillStyle(C.edge, 1);
        deck.fillPoints([a, b, { x: b.x, y: b.y + 3 }, { x: a.x, y: a.y + 3 }], true);
      }
      // Geländer stückweise (je eine halbe Kachel), jedes Stück mit der Tiefe seiner Stelle am Boden: so steht man vor
      // dem vorderen Geländer, wenn man davor steht, und dahinter, wenn man auf der Brücke ist – auf der ganzen Länge
      const groundY = (u, v) => {
        const along = br.from + u;
        const cross = br.at + v;
        const [txf, tyf] = br.axis === 'y' ? [cross, along] : [along, cross];
        return (txf + tyf) * (TILE_H / 2);
      };
      const rail = (v, shift) => {
        const PIECE = 0.5;
        for (let u0 = 0; u0 < len - 1e-6; u0 += PIECE) {
          const u1 = Math.min(len, u0 + PIECE);
          const g = this.add.graphics().setDepth(groundY((u0 + u1) / 2, v) + shift);
          const line = (h, w, col) => {
            g.lineStyle(w, col, 1);
            g.beginPath();
            for (let u = u0, first = true; u <= u1 + 1e-6; u += STEP, first = false) {
              const p = pt(Math.min(u, u1), v, h);
              if (first) g.moveTo(p.x, p.y);
              else g.lineTo(p.x, p.y);
            }
            g.strokePath();
          };
          // Pfosten am Anfang des Stücks (und am Ende der Brücke)
          for (const u of u1 >= len - 1e-6 ? [u0, len] : [u0]) {
            const a = pt(u, v, 0), b = pt(u, v, 13);
            g.lineStyle(4, 0x2b1d14, 1).lineBetween(a.x, a.y, b.x, b.y - 1);
            g.lineStyle(2, C.post, 1).lineBetween(a.x, a.y, b.x, b.y);
            g.fillStyle(C.cap, 1).fillRect(b.x - 1, b.y - 1, 3, 2);
          }
          line(12, 4, 0x2b1d14); // Handlauf mit dunkler Kontur
          line(12, 2, C.rail);
          line(6, 3, 0x2b1d14); // Mittellatte
          line(6, 1.5, C.slat);
        }
      };
      rail(0, -4); // hinten: hinter allem, was auf der Brücke steht
      rail(1, 2); // vorne: vor allem auf der Brücke, hinter allem davor
    }
  }

  // Torbögen über einem Tor (z. B. Eingang des Wildparks im Tierpark): LEVEL.arches = [{ key, tx, ty, label }], tx/ty ist
  // die Mitte der Toröffnung (bei zwei Torkacheln entlang ty also ty + 0.5 zwischen ihnen). Das Bild (tools/
  // wildpark-placeholders.py) hat seinen Fußpunkt ARCH_FOOT Pixel unter der Oberkante und eine leere schräge Tafel
  // ARCH_BOARD Pixel darüber; den Namen schreibt das Spiel darauf, schräg wie auf den Wegweisern (signLabel).
  // Tiefe: das Bild ist längs der Mitte geteilt. Die linke Hälfte (vorderer Pfosten) hat die Tiefe des vorderen Pfostens,
  // die rechte (hinterer Pfosten) die des hinteren – sonst verdeckt der hintere Pfosten Figuren in der Toröffnung.
  drawArches() {
    for (const a of LEVEL.arches ?? []) {
      const { x, y } = tileToWorld(a.tx, a.ty);
      const depth = tileToWorld(a.tx, a.ty + 1).y;
      for (const [right, d] of [[0, depth], [1, tileToWorld(a.tx, a.ty - 1).y]]) {
        const img = this.add.image(x, y, a.key).setOrigin(0.5, ARCH_FOOT / ARCH_H).setDepth(d);
        const w = img.frame.width / 2;
        img.setCrop(right * w, 0, w, img.frame.height);
      }
      if (!a.label) continue;
      // so groß wie möglich, aber höchstens so breit wie die Tafel (waagrecht gemessen)
      let text = null;
      for (const k of [1.4, 1.2, 1, 0.85]) {
        text?.destroy();
        text = this.signLabel(a.label, k, ARCH_SLOPE);
        if (text.texture.customData.width <= ARCH_BOARD_W) break;
      }
      text.setPosition(x, y - ARCH_BOARD).setDepth(depth + 0.01);
    }
  }

  // große Bilder über mehreren Kacheln (LEVEL.props, z. B. das Teehaus im Bambuswald): in der Mitte der Grundfläche,
  // Tiefe der vordersten Kachel (die Kacheln selbst sind V: unsichtbar und fest)
  drawProps() {
    for (const p of LEVEL.props ?? []) {
      const n = p.size ?? 1;
      const { x, y } = tileToWorld(p.tx + (n - 1) / 2, p.ty + (n - 1) / 2);
      this.add.image(x, y, p.key).setOrigin(0.5, p.originY).setDepth(tileToWorld(p.tx + n - 1, p.ty + n - 1).y);
    }
  }

  // Auf den Hochstand: Henrik steht oben auf der Plattform, die Kamera zoomt weit heraus (man sieht den ganzen Wald)
  climbUp(stand) {
    const p = this.player;
    this.onStand = stand;
    this.standLock = STAND_LOCK;
    this.standFrom = { x: p.x, y: p.y };
    p.x = stand.x;
    p.y = stand.y + 1; // knapp vor dem Hochstand (Tiefe); er läuft hier nicht, die Kachel ist sonst fest
    p.perch = { x: stand.x, y: stand.y - STAND_UP, depth: stand.y + 2 };
    const cam = this.cameras.main;
    this.standZoom = cam.zoom;
    const fit = Math.min(cam.width / ((MAP_W + MAP_H) * (TILE_W / 2)), cam.height / ((MAP_W + MAP_H) * (TILE_H / 2))) * 1.25;
    this.tweens.add({ targets: cam, zoom: Math.min(cam.zoom, fit), duration: STAND_ZOOM_MS, ease: 'Sine.easeInOut' });
    this.updateToolbar();
  }

  // vom Hochstand herunter: zurück an die Leiter, Kamera wie vorher
  climbDown() {
    const p = this.player;
    if (!this.onStand) return;
    this.onStand = null;
    p.perch = null;
    Object.assign(p, this.standFrom);
    this.tweens.add({ targets: this.cameras.main, zoom: this.standZoom, duration: STAND_ZOOM_MS, ease: 'Sine.easeInOut' });
    this.updateToolbar();
  }

  // Brücke als Bild (bridgeArt in levels.js, aus tools/forest-art.py): Deck mit hinterem Geländer ganz unten, das vordere
  // Geländer in Stücken je halbe Kachel, jedes mit der Tiefe seiner Stelle am Boden (wie bei der gezeichneten Brücke).
  // ox/oy: wo im Bild der Brückenanfang hinten liegt
  drawArtBridge(br, art) {
    const x = (br.from - br.at) * (TILE_W / 2);
    const y = (br.from + br.at) * (TILE_H / 2);
    const back = this.add.image(x, y, art.back).setDepth(-99998);
    back.setOrigin(art.ox / back.width, art.oy / back.height);
    const len = br.to + 1 - br.from;
    for (let i = 0; i < len * 2; i++) {
      const u0 = i / 2, u1 = (i + 1) / 2;
      const xa = i === 0 ? 0 : art.ox + (u0 - 1) * (TILE_W / 2);
      const xb = i === len * 2 - 1 ? back.width : art.ox + (u1 - 1) * (TILE_W / 2);
      const ground = (br.from + (u0 + u1) / 2 + br.at + 1) * (TILE_H / 2);
      const piece = this.add.image(x, y, art.front).setOrigin(back.originX, back.originY).setCrop(xa, 0, xb - xa, back.height);
      piece.setDepth(ground + 2);
    }
  }

  // umgestürzter Baumstamm über dem Wasser (Wald): Bild forest_log_bridge (für zwei Kacheln entlang ty gemalt, entlang tx
  // gespiegelt, längere Brücken gestreckt), Bildmitte über der Mitte der Brücke. Flach unter allem, was darauf läuft
  // (die Höhe beim Darüberlaufen: bridgeLift)
  drawLogBridge(br) {
    const len = br.to + 1 - br.from;
    const along = br.from + len / 2;
    const cross = br.at + 0.5;
    const [txf, tyf] = br.axis === 'y' ? [cross, along] : [along, cross];
    const x = (txf - tyf) * (TILE_W / 2);
    const y = (txf + tyf) * (TILE_H / 2) - bridgeArch(br) / 2;
    this.add.image(x, y, 'forest_log_bridge').setFlipX(br.axis === 'x').setScale(len / 2).setDepth(-99998);
  }

  // Dampf über heißen Quellen: kleine Wölkchen steigen auf und verblassen
  // Unterwasserwelt: Fischschwärme über der ganzen Karte, blaue Tönung, Lichtstrahlen von oben und aufsteigende Bläschen
  drawSea() {
    const sea = LEVEL.sea;
    if (!sea) return;
    const area = { tx0: 1, tx1: MAP_W - 2, ty0: 1, ty1: MAP_H - 2, height: sea.fishHeight, scale: sea.fishScale };
    this.tankFish.push(stockTank(this, area, sea.fish));
    // Tönung und Lichtstrahlen hängen am Bildschirm (groß genug für jeden Zoom), unter den Beschriftungen
    this.add.rectangle(0, 0, 8000, 8000, ...SEA_TINT).setScrollFactor(0).setDepth(SEA_TINT_DEPTH);
    const { width: w, height: h } = this.scale;
    for (let i = 0; i < 5; i++) {
      const x = (w * (i + 0.5)) / 5 + Phaser.Math.Between(-40, 40);
      const top = Phaser.Math.Between(26, 60);
      const ray = this.add.graphics().setScrollFactor(0).setDepth(SEA_TINT_DEPTH + 1).setBlendMode(Phaser.BlendModes.ADD);
      ray.fillStyle(0xbfe8ff, 0.07).fillPoints([{ x: x - top / 2, y: -h }, { x: x + top / 2, y: -h }, { x: x + top * 2.5 - 180, y: h * 2 }, { x: x - top - 180, y: h * 2 }], true);
      this.tweens.add({ targets: ray, alpha: 0.35, duration: Phaser.Math.Between(2500, 4500), yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    }
    this.time.addEvent({
      delay: SEA_BUBBLES,
      loop: true,
      callback: () => {
        const v = this.cameras.main.worldView;
        const x = Phaser.Math.Between(v.x, v.right);
        const y = Phaser.Math.Between(v.y + v.height * 0.3, v.bottom);
        const b = this.add.circle(x, y, Phaser.Math.FloatBetween(1.2, 2.6), 0xd8f2ff, 0.7).setStrokeStyle(1, 0x7fc0e8).setDepth(y);
        this.tweens.add({ targets: b, y: y - Phaser.Math.Between(90, 180), x: x + Phaser.Math.Between(-10, 10), alpha: 0, duration: Phaser.Math.Between(2200, 3600), ease: 'Sine.easeIn', onComplete: () => b.destroy() });
      },
    });
  }

  // Bodenschatten eines Autos (mit Anhänger), aus dem Umriss des Bilds: unter jeder Spalte ein Streifen am unteren Rand,
  // über die Lücken zwischen den Rädern hinweg geglättet und weichgezeichnet. Wird einmal pro Bild erzeugt
  carShadow(key, frame) {
    const sk = `${key}_${frame}_shadow`;
    if (this.textures.exists(sk)) return sk;
    const f = this.textures.getFrame(key, frame);
    const w = f.cutWidth;
    const h = f.cutHeight;
    const hd = hdScale(this, key); // große Fassung (z. B. car_zoo): das Bild ist hd-mal so groß wie der Ausschnitt
    const src = document.createElement('canvas');
    src.width = w;
    src.height = h;
    const sctx = src.getContext('2d');
    sctx.drawImage(f.source.image, f.cutX * hd, f.cutY * hd, w * hd, h * hd, 0, 0, w, h);
    const alpha = sctx.getImageData(0, 0, w, h).data;
    const bottom = new Array(w).fill(-1);
    for (let x = 0; x < w; x++) {
      let n = 0;
      for (let y = h - 1; y >= 0; y--) if (alpha[(y * w + x) * 4 + 3] > 200 && n++ === 0) bottom[x] = y;
      if (n < 8) bottom[x] = -1; // einzelne Pixel werfen keinen Schatten
    }
    src.height = h + SHADOW_PAD; // etwas höher: der Schatten reicht unter die Räder
    sctx.fillStyle = '#14320a';
    for (let x = 0; x < w; x++) {
      if (bottom[x] < 0) continue;
      let b = bottom[x];
      for (let d = -12; d <= 12; d++) if (bottom[x + d] > b) b = bottom[x + d];
      sctx.fillRect(x, b - 12, 1, 18);
    }
    const out = document.createElement('canvas');
    out.width = w;
    out.height = h + SHADOW_PAD;
    const ctx = out.getContext('2d');
    ctx.filter = 'blur(3px)';
    ctx.drawImage(src, 0, 0);
    this.textures.addCanvas(sk, out);
    return sk;
  }

  // U-Boot in der Unterwasserwelt: schaukelt langsam auf und ab, sein Schatten liegt auf dem Meeresboden
  floatBoat() {
    const { x, y, img, k } = this.car;
    const base = img.y;
    this.add.ellipse(x + 2, y - 22 * k, 120 * k, 28 * k, 0x0a2a40, 0.22).setDepth(-99980).setAngle(-12);
    this.tweens.add({ targets: img, y: base - BOAT_BOB, duration: 1800, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
  }

  startSteam() {
    const hot = [];
    for (let ty = 0; ty < MAP_H; ty++) for (let tx = 0; tx < MAP_W; tx++) if (groundAt(tx, ty) === 'hotspring') hot.push(tileToWorld(tx, ty));
    if (!hot.length) return;
    this.time.addEvent({
      delay: 140,
      loop: true,
      callback: () => {
        const p = Phaser.Utils.Array.GetRandom(hot);
        const x = p.x + Phaser.Math.Between(-20, 20);
        const y = p.y + Phaser.Math.Between(-6, 6);
        const puff = this.add.circle(x, y, Phaser.Math.FloatBetween(4, 7), 0xffffff, 0.35).setDepth(y + 40);
        this.tweens.add({
          targets: puff,
          x: x + Phaser.Math.Between(-8, 8),
          y: y - Phaser.Math.Between(26, 44),
          scale: 2.2,
          alpha: 0,
          duration: Phaser.Math.Between(1400, 2200),
          ease: 'Sine.easeOut',
          onComplete: () => puff.destroy(),
        });
      },
    });
  }

  // Zaunstück zeichnen: nur die Hälften, die zu einem Nachbarzaun (oder Tor) führen. So ragt an Ecken
  // nichts über, und dort steht ein Eckpfosten.
  addFence(tx, ty, obj) {
    const { kind, axis } = obj.fence;
    const { x, y } = tileToWorld(tx, ty);
    // Verbindung in Richtung dx/dy entlang der Achse a: der Nachbar ist ein Zaun oder Tor, und einer von beiden läuft in diese
    // Richtung. Ein Nachbar derselben Zaunart wird immer verbunden: so schließen auch Stufen in frei geformten Gehegen.
    const joins = (dx, dy, a) => {
      const other = fenceAxisAt(tx + dx, ty + dy);
      return !!other && (axis === a || other === a || objectAt(tx + dx, ty + dy)?.fence?.kind === kind);
    };
    const xl = joins(-1, 0, 'x');
    const xr = joins(1, 0, 'x');
    const yu = joins(0, -1, 'y');
    const yd = joins(0, 1, 'y');
    const house = kind === 'hut' ? buildingAt(tx, ty) : null;
    const hut = house ? `hutwall_${house.style}` : null; // Wand im Stil des Gebäudes
    // Terrarium auf einem Sockel: die hinteren Wände (entlang tx die obere Reihe, entlang ty die linke Spalte) nur als
    // Scheiben ohne Sockel, um die Höhe des Sockels höher; der Pfosten nur in der hinteren Ecke
    const back = (a) => !!house?.raise && (a === 'x' ? ty !== house.ty1 : tx !== house.tx1);
    const postBack = !!house?.raise && tx !== house.tx1 && ty !== house.ty1;
    const prefix = hut ?? obj.key.slice(0, -2); // z. B. fence, mesh, net, chain
    const imgs = [];
    // Gebäudewände können verschieden hoch sein: die Kachelmitte liegt immer 20 Pixel über dem unteren Bildrand
    const originY = (img) => (hut ? (img.height - 20) / img.height : obj.originY);
    const piece = (a, crop) => {
      const img = back(a) ? this.add.image(x, y - house.raise, `${prefix}_back_${a}`) : this.add.image(x, y, `${prefix}_${a}`);
      img.setOrigin(0.5, originY(img)).setDepth(y);
      if (crop === 'left') img.setCrop(0, 0, 34, img.height);
      if (crop === 'right') img.setCrop(30, 0, 34, img.height);
      imgs.push(img);
    };
    // entlang tx: links geht es zu tx-1, rechts zu tx+1; entlang ty (gespiegelt): rechts zu ty-1, links zu ty+1
    if (xl && xr) piece('x');
    else if (xl) piece('x', 'left');
    else if (xr) piece('x', 'right');
    if (yu && yd) piece('y');
    else if (yu) piece('y', 'right');
    else if (yd) piece('y', 'left');
    if (!xl && !xr && !yu && !yd) piece(axis); // einzelnes Stück
    if ((xl || xr) && (yu || yd)) {
      const post = this.add.image(x, y - (postBack ? house.raise : 0), `post_${hut ?? kind}${postBack ? '_back' : ''}`);
      imgs.push(post.setOrigin(0.5, originY(post)).setDepth(y + 0.01));
    }
    return imgs;
  }

  // Wegweiser mit schrägen Brettern: jedes Ziel bekommt ein Brett, das entlang einer der vier Wegrichtungen zeigt
  // (schräg wie die Wege) – in die Richtung, in die man vom Schild aus losgeht. Ziele sind die Bereiche des Levels
  // (sections, z. B. im Tierpark) oder sonst seine Ausgänge. signScale macht einen Wegweiser größer.
  drawSignBoards(x, y, tx, ty) {
    // Ziele mit at: [tx, ty] stehen nur auf dem (kleinen) Wegweiser an dieser Kachel, alle anderen auf dem großen
    const all = (LEVEL.sections ?? EXITS.map(({ label, tx, ty }) => ({ label, tx, ty }))).filter((s) => !s.unlock || game.unlocked.includes(s.unlock));
    const own = all.filter((s) => s.at?.[0] === tx && s.at?.[1] === ty);
    const targets = own.length ? own : all.filter((s) => !s.at);
    const k = own.length ? 1 : LEVEL.signScale ?? 1;
    const post = this.add.image(x, y, 'signpost_post').setOrigin(0.5, 60 / 64).setScale(k).setDepth(y);
    // Richtungen auf dem Bildschirm: entlang ty nach oben rechts bzw. unten links, entlang tx nach unten rechts bzw. oben links
    const DIRS = { 'ty-': [2, -1], 'tx-': [-2, -1], 'tx+': [2, 1], 'ty+': [-2, 1] };
    const boards = targets.map((s) => {
      // like: in dieselbe Richtung wie das Brett eines anderen Ziels (z. B. das Aquarium wie die Savanne)
      const ref = (s.like && targets.find((o) => o.label === s.like)) || s;
      const dtx = ref.tx - tx;
      const dty = ref.ty - ty;
      const key = Math.abs(dtx) >= Math.abs(dty) ? (dtx > 0 ? 'tx+' : 'tx-') : dty > 0 ? 'ty+' : 'ty-';
      const [dx, dy] = DIRS[key];
      const n = Math.hypot(dx, dy);
      return { label: s.label, ux: dx / n, uy: dy / n };
    });
    boards.sort((a, b) => a.uy - b.uy); // nach oben zeigende Bretter oben am Pfosten
    // je Seite des Pfostens (nach links bzw. rechts zeigend) eigene Höhen, damit sich die Bretter nicht überlappen
    const HEIGHTS = [52, 41, 30, 19];
    const side = { left: 0, right: 0 };
    const half = 5 * k; // halbe Brettbreite
    // der Pfosten reicht bis über das oberste Brett (im Bild ist er 33 Pixel hoch, von der Spitze bis zum Fußpunkt)
    const top = boards.length ? HEIGHTS[0] * k + half + 4 * k : 0;
    post.setScale(k, Math.max(k, top / 33));
    boards.forEach((b) => {
      const s = b.ux < 0 ? 'left' : 'right';
      const h = (HEIGHTS[side[s]++] ?? 19) * k;
      const text = this.signLabel(b.label, k, b.uy / b.ux);
      const W = text.texture.customData.width;
      const L = (W + 8 * k) / Math.abs(b.ux); // Brettlänge: waagrecht so breit wie der Name samt Rand
      const bx = x + b.ux * 2;
      const by = y - h;
      const along = (t, off) => ({ x: bx + b.ux * t, y: by + b.uy * t + off });
      const pts = [along(0, -half), along(L, -half), along(L + half, 0), along(L, half), along(0, half)];
      const depth = y + (b.uy < 0 ? -0.2 : 0.2); // nach hinten zeigende Bretter hinter, nach vorne zeigende vor dem Pfosten
      const g = this.add.graphics().setDepth(depth);
      g.fillStyle(0xe0b57a, 1).fillPoints(pts, true);
      g.lineStyle(1, 0xf2d4a0, 1).lineBetween(pts[0].x, pts[0].y + 1, pts[1].x, pts[1].y + 1);
      g.lineStyle(1, 0x2b1d14, 1).strokePoints(pts, true);
      const mid = along(L / 2, 0);
      text.setPosition(mid.x, mid.y).setDepth(depth + 0.01); // mittig auf dem Brett
    });
  }

  // Schrift für ein Wegweiser-Brett: von links nach rechts lesbar, die Buchstaben stehen aufrecht, nur die Grundlinie steigt
  // bzw. fällt mit dem schrägen Brett (slope: so viel tiefer pro Pixel nach rechts) – wie aufgemalt. Gezeichnet in 8-facher
  // Größe auf eine eigene Leinwand (einmal je Name, Größe und Richtung); die Bildmitte ist die Mitte der Schrift.
  // customData.width: Breite der Schrift im Spiel
  signLabel(label, k, slope) {
    const R = 8;
    const key = `signlabel_${label}_${k}_${slope}`;
    if (!this.textures.exists(key)) {
      const size = Math.round(7 * k) * R;
      const font = `bold ${size}px "Trebuchet MS", Arial`;
      const probe = document.createElement('canvas').getContext('2d');
      probe.font = font;
      const w = Math.ceil(probe.measureText(label).width);
      const h = Math.ceil(size * 1.4);
      const drop = Math.ceil(Math.abs(slope) * w);
      const tex = this.textures.createCanvas(key, w, h + drop);
      const ctx = tex.getContext();
      ctx.font = font;
      ctx.fillStyle = '#3a2414';
      ctx.textBaseline = 'middle';
      ctx.setTransform(1, slope, 0, 1, 0, h / 2 + (slope < 0 ? drop : 0));
      ctx.fillText(label, 0, 0);
      tex.refresh();
      tex.customData.width = w / R;
    }
    return this.add.image(0, 0, key).setScale(1 / R);
  }

  // Aquarium: Wassertanks (Gebäude im Stil "tank") sind hoch und bis knapp unter den Rand voll Wasser. Dazu gehören
  // eine dunkelblaue Rückwand (wie in echten Aquarien), eine Wasseroberfläche je Kachel, eine zarte Tönung hinter der
  // vorderen Glasscheibe und die Zierfische, die darin schweben. Alles je Kachel einsortiert: Rückwand hinter den
  // Fischen, Oberfläche und vordere Tönung davor.
  drawTanks() {
    this.tankFish = [];
    for (const h of buildings().filter((b) => b.style === 'tank')) {
      const W = (tx, ty, z = 0) => {
        const p = tileToWorld(tx, ty);
        return { x: p.x, y: p.y - z };
      };
      const pane = (x0, y0, x1, y1, depth, color, alpha, z0 = 3, z1 = TANK_WATER_UP) => {
        this.add.graphics().setDepth(depth).fillStyle(color, alpha).fillPoints([W(x0, y0, z0), W(x1, y1, z0), W(x1, y1, z1), W(x0, y0, z1)], true);
      };
      // Rückwände (oben und links): tiefes Blau, nach oben heller, mit Metallrahmen oben und unten
      const rim = (x0, y0, x1, y1, depth) => {
        const g = this.add.graphics().setDepth(depth + 0.02).lineStyle(3, 0x2f5068, 1);
        for (const z of [2, TANK_TOP]) g.lineBetween(W(x0, y0, z).x, W(x0, y0, z).y, W(x1, y1, z).x, W(x1, y1, z).y);
      };
      for (let tx = h.tx0; tx < h.tx1; tx++) {
        const d = tileToWorld(tx + 0.5, h.ty0).y + 0.2;
        pane(tx, h.ty0, tx + 1, h.ty0, d, 0x123f63, 1, 2, TANK_TOP);
        pane(tx, h.ty0, tx + 1, h.ty0, d + 0.01, 0x2a78a8, 0.45, TANK_WATER_UP - 30);
        rim(tx, h.ty0, tx + 1, h.ty0, d);
      }
      for (let ty = h.ty0; ty < h.ty1; ty++) {
        const d = tileToWorld(h.tx0, ty + 0.5).y + 0.2;
        pane(h.tx0, ty, h.tx0, ty + 1, d, 0x0f3656, 1, 2, TANK_TOP);
        pane(h.tx0, ty, h.tx0, ty + 1, d + 0.01, 0x2a78a8, 0.4, TANK_WATER_UP - 30);
        rim(h.tx0, ty, h.tx0, ty + 1, d);
      }
      // Wasseroberfläche je Innenkachel
      for (let ty = h.ty0 + 1; ty < h.ty1; ty++) {
        for (let tx = h.tx0 + 1; tx < h.tx1; tx++) {
          const c = tileToWorld(tx, ty);
          const pts = [[0, -0.5], [0.5, 0], [0, 0.5], [-0.5, 0]].map(([dx, dy]) => W(tx + dx + dy, ty + dy - dx, TANK_WATER_UP));
          const g = this.add.graphics().setDepth(c.y + 0.6);
          g.fillStyle(0x6fc8f0, 0.22).fillPoints(pts, true);
          if ((tx + ty) % 2 === 0) g.lineStyle(1, 0xe8f8ff, 0.4).lineBetween(pts[3].x + 6, pts[3].y, pts[1].x - 10, pts[1].y - 2); // Glanz
        }
      }
      // Wasser hinter der vorderen Glasscheibe (unten und rechts): zarte Tönung über den Fischen
      for (let tx = h.tx0; tx < h.tx1; tx++) pane(tx, h.ty1, tx + 1, h.ty1, tileToWorld(tx + 0.5, h.ty1).y + 0.3, 0x3fa8d8, 0.12);
      for (let ty = h.ty0; ty < h.ty1; ty++) pane(h.tx1, ty, h.tx1, ty + 1, tileToWorld(h.tx1, ty + 0.5).y + 0.3, 0x3fa8d8, 0.12);
      if (h.noDeco) continue; // z. B. das Quallenbecken
      const deco = stockTank(this, { ...h, scale: TANK_FISH_SCALE }, Phaser.Math.Between(...TANK_FISH));
      deco.tank = h;
      this.tankFish.push(deco);
    }
  }

  // Steht die Figur beim Betreten auf etwas Festem (z. B. hat ein Gehegeausbau dort gerade etwas aufgestellt)?
  // Dann auf den nächsten freien Platz daneben, sonst steckt sie fest
  unstickPlayer() {
    const p = this.player;
    if (!blockedAt(p.x, p.y, 7, 3)) return;
    for (let r = 8; r <= 96; r += 8) {
      for (let k = 0; k < 16; k++) {
        const a = (k / 16) * Math.PI * 2;
        const x = p.x + Math.cos(a) * r;
        const y = p.y + Math.sin(a) * r * 0.5;
        if (!blockedAt(x, y, 7, 3)) {
          p.x = x;
          p.y = y;
          p.trail = [{ x, y }];
          return;
        }
      }
    }
  }

  // variant: Farbmuster (nur Koi), sonst zufällig
  createAnimal(species, x, y, variant) {
    const a =
      species === 'fish'
        ? new Fish(this, this.animals)
        : species === 'koi'
          ? new Koi(this, this.animals, variant)
        : species === 'reeffish'
          ? new ReefFish(this, x, y, variant)
        : species === 'piranha'
          ? new Piranha(this, x, y)
        : species === 'butterfly'
          ? new Butterfly(this, x, y, variant)
        : species === 'seahorse'
          ? new Seahorse(this, x, y)
        : species === 'octopus'
          ? new Octopus(this, x, y)
        : species === 'turtle'
          ? new Turtle(this, x, y)
        : species === 'jellyfish'
          ? new Jellyfish(this, x, y)
        : species === 'ray'
          ? new Ray(this, x, y)
        : species === 'hippo'
          ? new Hippo(this, this.animals)
        : species === 'tapir'
          ? new Tapir(this, this.animals)
        : species === 'okapi'
          ? new Okapi(this, x, y)
        : species === 'elk'
          ? new Elk(this, x, y)
        : species === 'hedgehog'
          ? new Hedgehog(this, x, y)
        : species === 'boar'
          ? new Boar(this, x, y)
        : species === 'tanuki'
          ? new Tanuki(this, x, y)
        : species === 'yak'
          ? new Yak(this, x, y)
        : species === 'snowleopard'
          ? new SnowLeopard(this, x, y)
        : species === 'vulture'
          ? new Vulture(this, x, y)
        : species === 'hyena'
          ? new Hyena(this, x, y)
        : species === 'warthog'
          ? new Warthog(this, x, y)
        : species === 'redpanda'
          ? new RedPanda(this, x, y)
        : species === 'howler'
          ? new Howler(this, x, y)
        : species === 'anteater'
          ? new Anteater(this, x, y)
        : species === 'penguin'
          ? new Penguin(this, x, y)
        : species === 'seal'
          ? new Seal(this, x, y)
        : species === 'iguana'
          ? new Iguana(this, x, y)
        : species === 'beaver'
          ? new Beaver(this, x, y)
        : species === 'jaguar'
          ? new Jaguar(this, x, y)
        : species === 'gorilla'
          ? new Gorilla(this, x, y)
        : species === 'snake' || species === 'tarantula'
          ? new Critter(this, x, y, species)
        : species === 'macaw' || species === 'toucan'
          ? new Macaw(this, x, y, species)
        : species === 'gnu'
          ? new Gnu(this, x, y)
        : species === 'wolf'
          ? new Wolf(this, x, y)
        : species === 'crocodile'
          ? new Crocodile(this, this.animals)
        : species === 'squirrel'
          ? new Squirrel(this, this.animals)
          : species === 'frog'
            ? new Frog(this, x, y)
            : species === 'heron' || species === 'flamingo'
                ? new Heron(this, x, y, species)
                : species === 'antelope'
                  ? new Antelope(this, x, y, this.animals)
                  : species === 'zebra'
                    ? new Zebra(this, x, y, this.animals)
                    : species === 'meerkat'
                      ? new Meerkat(this, x, y, this.animals)
                      : species === 'lion'
                        ? new Lion(this, x, y)
                        : species === 'macaque'
                          ? new Macaque(this, x, y)
                        : species === 'panda'
                          ? new Panda(this, x, y)
                        : species === 'tiger'
                          ? new Tiger(this, x, y)
                        : species === 'orangutan'
                          ? new Orangutan(this, x, y)
                        : species === 'peacock'
                          ? new Peacock(this, x, y)
                        : species === 'giraffe'
                          ? new Giraffe(this, x, y)
                          : species === 'cat'
                            ? new Cat(this, x, y, this.animals)
                            : species === 'fox'
                              ? new Fox(this, x, y)
                              : species === 'sheep' || species === 'cow' || species === 'pig' || species === 'goat'
                                ? new Sheep(this, x, y, species)
                                : new Animal(this, x, y, species);
    a.x = x;
    a.y = y;
    this.animals.push(a);
    return a;
  }

  // Erste Tiere beim Betreten eines neuen Levels: nicht zu nah an der Ankunft, nicht auf Werkzeugen,
  // nicht aufeinander. Ihre Lebenszeit ist gestaffelt, damit sie nicht alle gleichzeitig verschwinden.
  spawnAnimals(arrive) {
    if (this.expMap) return this.expTopUp(arrive, false); // Expedition: die feste Tierliste der Map
    const taken = [arrive, ...TOOL_SPOTS];
    for (const pool of spawnPools(LEVEL)) {
      // bis die Plätze voll sind (Versuche, die nichts bringen – z. B. Tiger schon am Maximum –, zählen nicht als Platz)
      for (let n = 0; n < pool.population * 3 && this.wildUnits(pool) < pool.population; n++) {
        const group = this.spawnOne(taken, false, pool);
        const life = Phaser.Math.FloatBetween(20, LIFETIME[1]);
        for (const a of group) a.life = life; // eine Gruppe verschwindet gemeinsam (und zählt als ein Platz)
      }
    }
    this.spawnIguanas();
    this.spawnGorillas();
  }

  // Gorillas auf der Lichtung (nur bei Nebel): eine Gruppe aus LEVEL.gorillas.count, eigener Pool
  spawnGorillas() {
    const max = LEVEL.gorillas?.count ?? 0;
    const wild = this.animals.filter((a) => a.species === 'gorilla' && a.state === 'wild').length;
    for (let i = wild; i < max; i++) {
      const [a] = Gorilla.spawnOnClearing(this);
      if (!a) continue;
      a.life = Phaser.Math.FloatBetween(...LIFETIME);
      a.rollSkin('wild'); // selten ein Albino-Gorilla
    }
  }

  // Leguane am Wasserfall: ein eigener kleiner Pool (LEVEL.waterfallSun.iguanas), versteckt bis die Sonne kommt
  spawnIguanas() {
    const max = LEVEL.waterfallSun?.iguanas ?? 0;
    const wild = this.animals.filter((a) => a.species === 'iguana' && a.state === 'wild').length;
    for (let i = wild; i < max; i++) {
      const [a] = Iguana.spawnHidden(this);
      if (!a) continue;
      a.life = Phaser.Math.FloatBetween(...LIFETIME);
      a.rollSkin('wild'); // selten der blaue Leguan
    }
  }

  // Tierart nach den Wahrscheinlichkeiten eines Pools auswürfeln
  pickSpecies(pool) {
    const entries = Object.entries(pool.weights);
    let r = Math.random() * entries.reduce((s, [, w]) => s + w, 0);
    const species = (entries.find(([, w]) => (r -= w) <= 0) ?? entries[0])[0];
    // Hoftiere außerhalb des Events: nicht, solange Mavis Aufgaben auf der Wiese laufen (dort soll man Schafe fangen)
    if (FARM_SPECIES.includes(species) && !isActive('farm') && activeStep()?.at.level === 'meadow') return 'sheep';
    // Bauernhof-Event: statt der Schafe kommen reihum Kühe, Schweine und Ziegen auf die Wiese (nur beim normalen Spawner,
    // nicht für Mavis Schaf-Aufgabe, die echte Schafe braucht)
    if (species === 'sheep' && LEVEL_ID === 'meadow' && isActive('farm') && spawnPools(LEVEL).includes(pool)) return FARM_SPECIES[(this.farmTurn = ((this.farmTurn ?? -1) + 1) % FARM_SPECIES.length)];
    return species;
  }

  // Ein zufälliges wildes Tier erzeugen. Fische und Eichhörnchen suchen sich ihre Plätze selbst
  // (Wasser, Baum), alle anderen kommen auf eine freie Kachel mit Abstand zu "taken" (siehe randomFreeTile).
  // Gibt die neuen Tiere zurück (meist eins, Antilopen kommen in kleinen Gruppen).
  spawnOne(taken, fadeIn = false, pool = LEVEL.spawn) {
    if (this.wolfNight) return []; // Wolfsnacht: im Wald nur die Wolfsrudel (siehe Wolf.js)
    const species = this.pickSpecies(pool);
    const group = [];
    // Japanmakaken sitzen gleich in der heißen Quelle (höchstens MAX_MACAQUES, sonst wird es dort zu voll)
    if (species === 'macaque') {
      const wild = this.animals.filter((a) => a.species === 'macaque' && a.state === 'wild').length;
      if (wild < MAX_MACAQUES && HOT_SPRING_TILES.some((t) => !enclosureAt(t.tx, t.ty))) {
        const a = this.createAnimal('macaque', 0, 0);
        a.placeInSpring();
        group.push(a);
      }
      return group;
    }
    // Brüllaffen: ein kleiner Trupp unsichtbar oben in nahe beieinander stehenden Urwaldbäumen
    if (species === 'howler') return this.finishSpawn(Howler.spawnTroop(this), false); // bei jedem Wetter; seltene Variante: Gibbon (Skin)
    // Piranhas: ein Schwarm mitten im Fluss
    if (species === 'piranha') return this.finishSpawn(Piranha.spawnSchool(this), fadeIn);
    // Aras: ein Paar in einem Uferbaum (fängt man einen, fliegt der andere davon)
    if (species === 'macaw') return this.finishSpawn(Macaw.spawnPair(this), false);
    if (species === 'toucan') return this.finishSpawn(Macaw.spawnSingle(this, species), false); // Tukan: allein
    // Jaguar: schläft oben in einem Urwaldbaum (höchstens MAX_JAGUARS gleichzeitig)
    if (species === 'jaguar') {
      if (!this.expMap && this.animals.filter((a) => a.species === 'jaguar' && a.state === 'wild').length >= MAX_JAGUARS) return group; // (Expedition: die Tierliste bestimmt die Zahl)
      return this.finishSpawn(Jaguar.spawnInTree(this), false);
    }
    // Orang-Utans sitzen oben in den Urwaldbäumen (höchstens MAX_ORANGUTANS gleichzeitig)
    if (species === 'orangutan') {
      const wild = this.animals.filter((a) => a.species === 'orangutan' && a.state === 'wild').length;
      if (wild < MAX_ORANGUTANS && JUNGLE_TREES.length) {
        const a = this.createAnimal('orangutan', 0, 0);
        a.placeInTree();
        group.push(a);
      }
      return this.finishSpawn(group, fadeIn);
    }
    // Schneeleopard (selten): döst auf einem großen Felsen der Hochebene, seine Spur führt dorthin (höchstens einer)
    if (species === 'snowleopard') {
      if (this.animals.some((a) => a.species === 'snowleopard' && a.state === 'wild')) return group;
      const [a] = this.finishSpawn([this.createAnimal('snowleopard', 0, 0)], false);
      if (a.lieDownSomewhere(worldToTile(this.player.x, this.player.y))) return [a];
      this.despawn(a);
      return group;
    }
    // Elche stehen im Moorwasser (höchstens MAX_ELKS gleichzeitig), im Nebel nur als Schemen (siehe Elk.js)
    if (species === 'elk') {
      if (!this.expMap && this.animals.filter((a) => a.species === 'elk' && a.state === 'wild').length >= MAX_ELKS) return group;
      const a = this.createAnimal('elk', 0, 0);
      a.placeInWater();
      a.unplaced = false;
      return this.finishSpawn([a], false);
    }
    // Wildschweine streifen durch den Eichenhain (höchstens MAX_BOARS gleichzeitig, siehe Boar.js)
    if (species === 'boar') {
      if (!this.expMap && this.animals.filter((a) => a.species === 'boar' && a.state === 'wild').length >= MAX_BOARS) return group;
      const tile = this.tileIn(LEVEL.boarArea, taken);
      if (!tile) return group;
      taken.push(tile);
      const p = tileToWorld(tile.tx, tile.ty);
      return this.finishSpawn([this.createAnimal('boar', p.x, p.y)], fadeIn);
    }
    // Igel sitzen versteckt in den Laubhaufen (höchstens MAX_HEDGEHOGS gleichzeitig, siehe Hedgehog.js)
    if (species === 'hedgehog') {
      if (!this.expMap && this.animals.filter((a) => a.species === 'hedgehog' && a.state === 'wild').length >= MAX_HEDGEHOGS) return group;
      const [a] = this.finishSpawn([this.createAnimal('hedgehog', 0, 0)], false);
      if (a.hideSomewhere()) return [a];
      this.despawn(a);
      return group;
    }
    // Tanukis stehen verkleidet neben Steinlaternen (höchstens MAX_TANUKIS gleichzeitig); erst die Variante würfeln
    // (finishSpawn), dann verkleiden: der Schwanz hat die Farbe des Fells
    if (species === 'tanuki') {
      if (this.animals.filter((a) => a.species === 'tanuki' && a.state === 'wild').length >= MAX_TANUKIS) return group;
      const [a] = this.finishSpawn([this.createAnimal('tanuki', 0, 0)], false);
      if (a.hideSomewhere()) return [a];
      this.despawn(a);
      return group;
    }
    // Tiger streifen als Schemen durch den Bambus (höchstens MAX_TIGERS gleichzeitig)
    if (species === 'tiger') {
      const wild = this.animals.filter((a) => a.species === 'tiger' && a.state === 'wild').length;
      if (wild < MAX_TIGERS && TIGER_ZONE.length) {
        const a = this.createAnimal('tiger', 0, 0);
        a.placeInZone();
        group.push(a);
      }
      return this.finishSpawn(group, fadeIn);
    }
    // Meeresschildkröte: höchstens eine gleichzeitig (selten), irgendwo im Netz verheddert
    if (species === 'turtle' && this.animals.some((a) => a.species === 'turtle' && a.state === 'wild')) return group;
    if (species === 'ray' && this.animals.filter((a) => a.species === 'ray' && a.state === 'wild').length >= MAX_RAYS) return group;
    // Riff-Fische: eine Art (alle gleich häufig), allein oder in einer kleinen Gruppe, die gemeinsam schwimmt
    if (species === 'reeffish') {
      const tile = this.randomFreeTile(taken);
      taken.push(tile);
      const p = tileToWorld(tile.tx, tile.ty);
      const lead = this.createAnimal('reeffish', p.x, p.y);
      group.push(lead);
      const more = Math.random() < REEF_SOLO ? 0 : Phaser.Math.Between(...REEF_GROUP) - 1;
      for (let i = 0; i < more; i++) {
        const a = new ReefFish(this, p.x + Phaser.Math.Between(-16, 16), p.y + Phaser.Math.Between(-8, 8), lead.variant, lead.herd);
        this.animals.push(a);
        group.push(a);
      }
      return this.finishSpawn(group, fadeIn);
    }
    if (species === 'fish' || species === 'koi' || species === 'crocodile' || species === 'hippo' || species === 'tapir' || species === 'squirrel' || species === 'seahorse') {
      const a = this.createAnimal(species, 0, 0);
      if (species === 'squirrel') a.restore('wild'); // setzt es auf seinen Baum
      if (species === 'koi') a.placeRandom(); // irgendwo in den Koi-Teich
      group.push(a);
    } else {
      // Frösche meistens nah am Wasser, Giraffen meistens nah an Bäumen
      const tile =
        (species === 'frog' && Math.random() < (LEVEL.prefer?.frog ?? 0) && this.tileFrom(this.preferredShore(), taken)) || // im Wald meist im Moor
        (species === 'frog' && Math.random() < FROG_NEAR_WATER && this.tileFrom(NEAR_WATER, taken)) ||
        (species === 'penguin' && LEVEL.iceHoles && Math.random() < PENGUIN_AT_HOLES && this.tileFrom(this.holeTiles(), taken)) || // nachts meist an den Eislöchern
        (species === 'penguin' && this.tileFrom(NEAR_WATER, taken)) || // Pinguine immer am Wasser
        (species === 'seal' && this.tileFrom(Seal.shoreTiles(), taken)) || // Robben im Wasser am Ufer
        (species === 'giraffe' && Math.random() < GIRAFFE_NEAR_TREES && this.tileFrom(NEAR_TREES, taken)) ||
        (species === 'panda' && this.tileFrom(NEAR_BAMBOO, taken)) ||
        (species === 'butterfly' && this.tileFrom(flowerTiles(), taken)) || // Schmetterlinge bei den Blumen // Pandas immer beim Bambus
        (species === 'lion' && this.tileFrom(NEAR_TREES, taken)) || // Löwen dösen immer im Schatten eines Baums
        (LEVEL.gatherAt && (species === 'zebra' || species === 'antelope') && this.tileFrom(this.gatherTiles(), taken)) || // Trockenzeit: am letzten Wasserloch
        this.randomFreeTile(taken);
      taken.push(tile);
      const p = tileToWorld(tile.tx, tile.ty);
      group.push(this.createAnimal(species, p.x, p.y));
      // Antilopen: noch 1 bis 3 weitere dicht daneben
      if (SPECIES[species].herd) {
        const more = Phaser.Math.Between(...(LEVEL.expedition ? EXP_GROUP : SPECIES[species].groupSize ?? HERD_SIZE)) - 1;
        for (let i = 0; i < more; i++) {
          const spot = this.freeSpotNear(p.x, p.y, 28);
          if (spot) group.push(this.createAnimal(species, spot.x, spot.y));
        }
      }
    }
    return this.finishSpawn(group, fadeIn);
  }

  // Lebenszeit, seltene Variante und Einblenden für frisch erzeugte wilde Tiere
  finishSpawn(group, fadeIn) {
    const life = Phaser.Math.FloatBetween(...LIFETIME);
    group[0]?.rollSkin('wild'); // selten z. B. Katze 2; eine Herde sieht ganz gleich aus (Oryx)
    const g = LEVEL.gatherAt && ['zebra', 'antelope'].includes(group[0]?.species) && tileToWorld(LEVEL.gatherAt.tx, LEVEL.gatherAt.ty);
    // eine Pinguin-Gruppe ist eine Herde: zählt als ein Platz (wildUnits) und springt zusammen ab (siehe Penguin.js)
    if (group[0]?.species === 'penguin') {
      const herd = {};
      for (const a of group) a.herd = herd;
    }
    for (const a of group) {
      if (g) a.leash = { x: g.x, y: g.y, r: LEVEL.gatherAt.r }; // drängen sich am letzten Wasserloch
      a.life = life;
      a.skin = group[0].skin;
      if (fadeIn) {
        a.sprite.setAlpha(0);
        this.tweens.add({ targets: a.sprite, alpha: 1, duration: 800 });
      }
    }
    return group;
  }

  // Freier Punkt höchstens r Pixel von x/y entfernt (nicht im Gehege, nicht auf Hindernissen), oder null
  freeSpotNear(x, y, r) {
    for (let i = 0; i < 20; i++) {
      const sx = x + Phaser.Math.FloatBetween(-r, r);
      const sy = y + Phaser.Math.FloatBetween(-r / 2, r / 2);
      const { tx, ty } = worldToTile(sx, sy);
      if (isBlocked(tx, ty) || nearEnclosure(tx, ty)) continue;
      if (!blockedAt(sx, sy, 12, 5)) return { x: sx, y: sy };
    }
    return null;
  }

  // Freie Kachel aus der Liste (z. B. am Wasser oder an Bäumen) mit Abstand zu "taken" (gleiche Regel wie randomFreeTile), oder null
  tileFrom(list, taken) {
    const free = list.filter(
      ({ tx, ty }) => !taken.some((t, i) => Math.max(Math.abs(t.tx - tx), Math.abs(t.ty - ty)) < (i === 0 ? 5 : 2)),
    );
    return free.length ? Phaser.Utils.Array.GetRandom(free) : null;
  }

  // Wilde Tiere rotieren: abgelaufene verschwinden (nicht in der Nähe des Spielers, Fische nur abgetaucht,
  // Eichhörnchen nur oben im Baum), und fehlen Tiere, kommt ab und zu ein neues dazu.
  // Wie viele Plätze sind belegt? Eine Herde oder Kolonie zählt als einer, damit seltene Einzeltiere
  // (Giraffe, Löwe ...) neben den großen Gruppen noch eine Chance haben. Fischreiher zählen nicht. Mit pool nur dessen Tierarten
  // Fische und Koi belegen nur einen halben Platz (sonst blockieren sie die großen Landtiere, z. B. im Bambuswald)
  wildUnits(pool = null) {
    const units = new Map();
    for (const a of this.animals) {
      if (pool && !pool.weights[a.species]) continue;
      if (a.state === 'wild' && a.species !== 'heron') units.set(a.herd ?? a.colony ?? a.troop ?? a.school ?? a, HALF_SLOT.includes(a.species) ? 0.5 : 1);
    }
    let n = 0;
    for (const w of units.values()) n += w;
    return n;
  }

  updateSpawner(dt) {
    const p = this.player;
    // Expedition: keine Lebenszeit, kein neuer Zufall – nur wer weggelaufen ist, taucht woanders wieder auf
    if (this.expMap) {
      this.spawnTimer -= dt;
      if (this.spawnTimer <= 0) {
        this.spawnTimer = Phaser.Math.FloatBetween(...SPAWN_INTERVAL);
        this.expTopUp(worldToTile(p.x, p.y), true);
      }
      return;
    }
    for (const a of [...this.animals]) {
      if (a.state !== 'wild') continue;
      a.life -= dt;
      if (a.life > 0) continue;
      const far = Math.hypot(a.x - p.x, (a.y - p.y) * 2) > DESPAWN_DIST;
      if (far && a.canDespawn()) this.despawn(a);
    }

    this.tutSheepTimer -= dt;
    if (this.tutSheepTimer <= 0) {
      this.tutSheepTimer = TUT_SHEEP_CHECK;
      this.ensureStorySheep(true);
      this.ensureStoryAnimals(true);
    }

    this.spawnTimer -= dt;
    if (this.spawnTimer > 0) return;
    this.spawnTimer = Phaser.Math.FloatBetween(...SPAWN_INTERVAL);
    const more = bonusActive('moreAnimals') ? MORE_ANIMALS : 1; // Bonus "Mehr Tiere" aus einer Kiste
    const pool = spawnPools(LEVEL).find((q) => this.wildUnits(q) < Math.round(q.population * more));
    // kam nichts (die Art ist schon am Maximum), gleich noch ein Versuch mit einer anderen
    for (let i = 0; pool && i < 3; i++) if (this.spawnOne([worldToTile(p.x, p.y), ...TOOL_SPOTS], true, pool).length) break;
    this.spawnIguanas();
    this.spawnGorillas();
  }

  // Mavis Schaf-Aufgabe auf der Wiese: rund um Auto und Hütte grasen immer ein paar wilde Schafe (TUT_SHEEP, höchstens so
  // viele, wie für die Aufgabe noch fehlen). Die übrigen kommen wie sonst auch von selbst. fadeIn: neue blenden sanft ein
  ensureStorySheep(fadeIn) {
    if (LEVEL_ID !== 'meadow' || activeId() !== 'sheep') return;
    const at = this.car ?? this.player;
    const near = (a) => Math.hypot(a.x - at.x, (a.y - at.y) * 2) < TUT_SHEEP_R;
    const sheep = this.animals.filter((a) => a.species === 'sheep');
    const missing = SHEEP_QUEST - (game.catches.sheep ?? 0);
    const want = Math.min(TUT_SHEEP, missing);
    for (let i = sheep.filter((a) => a.state === 'wild' && near(a)).length; i < want; i++) {
      const spot = this.freeSpotNear(at.x, at.y, TUT_SHEEP_R * 0.6); // (Quadrat um den Punkt: so liegt es sicher im Umkreis)
      if (!spot) break;
      this.finishSpawn([this.createAnimal('sheep', spot.x, spot.y)], fadeIn);
    }
  }

  // Mavis Fang-Aufgaben (wild in steps.js): von jeder Art, die noch fehlt, sind im Gebiet der Aufgabe immer mindestens so
  // viele wilde Tiere unterwegs, wie noch gebraucht werden – sonst sucht ein neuer Spieler vergeblich. Sie kommen an
  // ihre üblichen Plätze (Frösche meist am Wasser, Schmetterlinge bei den Blumen). fadeIn: neue blenden sanft ein
  ensureStoryAnimals(fadeIn) {
    const step = activeStep();
    if (!step?.wild || step.at.level !== LEVEL_ID) return;
    const taken = [worldToTile(this.player.x, this.player.y)];
    for (const [species, n] of Object.entries(step.wild)) {
      const missing = n - (game.catches[species] ?? 0);
      for (let i = this.animals.filter((a) => a.species === species && a.state === 'wild').length; i < missing; i++) {
        if (!this.spawnOne(taken, fadeIn, { weights: { [species]: 1 } }).length) break;
      }
    }
  }

  // Fischreiher: alle paar Sekunden fliegt einer über die Karte; manche landen an einer Uferstelle
  updateHerons(dt) {
    // weggeflogene Reiher entfernen
    for (const a of [...this.animals]) {
      if (!a.gone) continue;
      this.animals.splice(this.animals.indexOf(a), 1);
      a.destroy();
    }
    // Flamingo-Flug: Flamingos fliegen ein wie Reiher, nur öfter
    if (isActive('flamingo') && FLAMINGO_WORLDS.includes(LEVEL_ID)) {
      this.flamingoTimer -= dt;
      if (this.flamingoTimer <= 0) {
        this.flamingoTimer = Phaser.Math.FloatBetween(...FLAMINGO_EVERY);
        this.flyIn('flamingo', FLAMINGO_LAND);
      }
    }
    // Trockenzeit: ab und zu kreist ein Geier heran und landet auf einer kahlen Akazie
    // ein versprochenes seltenes Tier aus der Kiste (Storch, Ohrengeier) lässt nicht lange auf sich warten
    const promised = rarePromiseHere()?.species;
    if (LEVEL.vultures) {
      this.vultureTimer = (this.vultureTimer ?? Phaser.Math.FloatBetween(4, LEVEL.vultures.every[0])) - dt;
      if (promised === 'vulture') this.vultureTimer = Math.min(this.vultureTimer, PROMISE_WAIT);
      if (this.vultureTimer <= 0) {
        this.vultureTimer = Phaser.Math.FloatBetween(...LEVEL.vultures.every);
        if (!this.expMap || this.expWants('vulture')) this.flyInVulture(); // Expedition: nur so viele, wie noch zu fangen sind
      }
    }
    this.heronTimer -= dt;
    if (promised === 'heron') this.heronTimer = Math.min(this.heronTimer, PROMISE_WAIT);
    if (this.heronTimer > 0) return;
    const { every, landChance } = LEVEL.herons;
    this.heronTimer = Phaser.Math.FloatBetween(...every);
    if (this.expMap && !this.expWants('heron')) {
      this.heronTimer = 2; // Expedition: nur so viele, wie noch zu fangen sind – ist einer weggeflogen, kommt bald der nächste
      return;
    }
    // kleine Map hinter einem Durchgang: immer nur einer zur Zeit, ist er weg, kommt bald der nächste
    if (LEVEL.side && this.animals.some((a) => a.species === 'heron' && a.state === 'wild' && !a.gone)) {
      this.heronTimer = 2;
      return;
    }
    this.flyIn('heron', landChance);
  }

  // ein Vogel fliegt über die Karte; manche landen an einer Uferstelle
  flyIn(species, landChance) {
    const angle = Math.random() * Math.PI * 2;
    const from = this.mapEdgePoint(angle);
    // der versprochene seltene Vogel aus der Kiste landet immer (sonst flöge er nur über die Karte)
    const land = (rarePromiseHere()?.species === species || Math.random() < landChance) && NEAR_WATER.length > 0;
    let to;
    if (land) {
      // bevorzugtes Gebiet (LEVEL.prefer, im Wald das Moor): dort landen die meisten
      const moor = Math.random() < (LEVEL.prefer?.[species] ?? 0) ? this.preferredShore() : [];
      const t = Phaser.Utils.Array.GetRandom(moor.length ? moor : NEAR_WATER);
      to = tileToWorld(t.tx, t.ty);
    } else {
      to = this.mapEdgePoint(angle + Math.PI + Phaser.Math.FloatBetween(-0.6, 0.6)); // quer hinüber
    }
    const bird = this.createAnimal(species, from.x, from.y);
    bird.rollSkin('wild', land); // z. B. der Schuhschnabel bei Starkregen in der Savanne; das versprochene Tier aus der Kiste nur, wenn er landet
    bird.startFlight(from, to, land);
  }

  // ein Geier fliegt zu einer freien kahlen Akazie (nicht am Kartenrand, keine, auf der schon einer sitzt)
  flyInVulture() {
    const taken = this.animals.filter((a) => a.species === 'vulture' && a.state === 'wild').map((a) => a.perch);
    const trees = [];
    for (let ty = 2; ty < MAP_H - 2; ty++) for (let tx = 2; tx < MAP_W - 2; tx++) if (charAt(tx, ty) === 'A') trees.push(tileToWorld(tx, ty));
    const free = trees.filter((t) => !taken.some((p) => p && Math.abs(p.x - t.x) < 4 && Math.abs(p.y - 3 - t.y) < 4));
    const t = Phaser.Utils.Array.GetRandom(free);
    if (!t) return;
    const from = this.mapEdgePoint(Math.random() * Math.PI * 2);
    const bird = this.createAnimal('vulture', from.x, from.y);
    bird.rollSkin('wild'); // selten ein Ohrengeier
    bird.startCircle(from, { x: t.x, y: t.y + 3 }); // knapp vor dem Stamm, damit er vor dem Baum gezeichnet wird
  }

  // Uferkacheln im bevorzugten Gebiet (LEVEL.prefer.area, im Wald das Moor)
  preferredShore() {
    const a = LEVEL.prefer?.area;
    return a ? NEAR_WATER.filter(({ tx, ty }) => tx >= a.tx0 && tx <= a.tx1 && ty >= a.ty0 && ty <= a.ty1) : [];
  }

  // Trockenzeit: freie Kacheln am letzten Wasserloch (dort tauchen Zebras und Antilopen auf)
  gatherTiles() {
    const g = LEVEL.gatherAt;
    return NEAR_WATER.filter(({ tx, ty }) => Math.hypot(tx - g.tx, ty - g.ty) < 5);
  }

  // Eiswelt bei Nacht: freie Plätze rund um die Eislöcher (LEVEL.iceHoles, je 2 x 2 Kacheln ab der Ecke oben links)
  holeTiles() {
    return NEAR_WATER.filter(({ tx, ty }) => LEVEL.iceHoles.some(([hx, hy]) => Math.hypot(tx - hx - 0.5, ty - hy - 0.5) < 3));
  }

  // Punkt außerhalb der Karte in Richtung angle (von der Kartenmitte aus gesehen)
  mapEdgePoint(angle) {
    const c = tileToWorld(MAP_W / 2, MAP_H / 2);
    const r = (MAP_W + MAP_H) * (TILE_W / 2) * 0.6;
    return { x: c.x + Math.cos(angle) * r, y: c.y + (Math.sin(angle) * r) / 2 };
  }

  // Wohin ein gelandeter Reiher wieder wegfliegt: vom Rand der Karte, weg von seiner Position
  heronExitPoint(x, y) {
    const c = tileToWorld(MAP_W / 2, MAP_H / 2);
    const away = Math.atan2((y - c.y) * 2, x - c.x);
    return this.mapEdgePoint(away + Phaser.Math.FloatBetween(-0.8, 0.8));
  }

  // ---- Tierfreunde (siehe src/world/friends.js und docs/plan-freundschaft.md) ----

  // Mavis Tierfreund-Aufgabe läuft (Einführung gehört): 'name' – noch kein Tier benannt (rote Pfeile durch die Tafel am
  // Schild), 'pet' – benannt, aber noch nicht gestreichelt (Pfeil auf den Schließen-Knopf und dann auf das Tier); sonst null
  friendTutorial() {
    if (activeStep()?.id !== 'friend' || !game.story.heard || !isPark(LEVEL_ID)) return null;
    const bonds = Object.values(game.bonds ?? {});
    if (bonds.some((b) => b.points > 0)) return null;
    return bonds.length ? 'pet' : 'name';
  }

  // der benannte, noch nie gestreichelte Tierfreund in diesem Abschnitt, der Henrik am nächsten ist
  tutorialFriend() {
    const p = this.player;
    let best = null;
    let bd = Infinity;
    for (const a of this.friendsHere()) {
      if (bondOf(a).points > 0 || !a.sprite?.active) continue;
      const d = Math.hypot(a.x - p.x, (a.y - p.y) * 2);
      if (d < bd) {
        bd = d;
        best = a;
      }
    }
    return best;
  }

  // benannte Tiere in diesem Abschnitt (nur in den Gehegen des Tierparks; Aquarium und Reptilienhaus vorerst nicht)
  friendsHere() {
    if (!isPark(LEVEL_ID)) return [];
    return this.animals.filter((a) => a.state === 'penned' && isFriend(a));
  }

  // Namensschild über jedem Tierfreund (Name und ein Herz je Stufe, auf Stufe 3 golden); ab Stufe 2 kommt er zum Zaun,
  // wenn Henrik in der Nähe ist, und läuft ihm am Zaun entlang nach
  updateFriends(dt) {
    const friends = this.friendsHere();
    for (const [a, tag] of this.friendTags) {
      if (friends.includes(a)) continue;
      tag.destroy();
      this.friendBars.get(a)?.destroy();
      this.friendBars.delete(a);
      this.friendTags.delete(a);
      a.visit = null;
    }
    for (const a of friends) {
      const bond = bondOf(a);
      const level = friendLevel(bond.points);
      let tag = this.friendTags.get(a);
      if (!tag) {
        tag = this.add.text(0, 0, '', { fontFamily: 'Trebuchet MS, Arial', fontSize: '9px', fontStyle: 'bold', padding: { x: 3, y: 1 }, resolution: 4 }).setOrigin(0.5, 1);
        this.friendTags.set(a, tag);
      }
      const label = `${bond.name} ${levelHearts(level)}`;
      if (tag.text !== label) {
        tag.setText(label);
        const gold = level >= FRIEND_LEVELS.length;
        tag.setColor(gold ? '#3c2814' : '#fff8e6').setBackgroundColor(gold ? '#ffd966' : '#3c2814f0');
      }
      const spr = a.sprite;
      // immer obenauf (vor Zäunen, Schildern und Bäumen), damit man Namen und Balken lesen kann
      tag.setPosition(spr.x, spr.y - spr.displayHeight * spr.originY + 4).setDepth(FRIEND_TAG_DEPTH + spr.depth / 1e4).setVisible(spr.visible);
      // Fortschritt bis zur nächsten Stufe: Balken über dem Namensschild, nur wenn Henrik nah dran ist
      let bar = this.friendBars.get(a);
      if (!bar) {
        bar = this.add.graphics();
        this.friendBars.set(a, bar);
      }
      const near = spr.visible && Math.hypot(this.player.x - a.x, (this.player.y - a.y) * 2) < FRIEND_BAR_DIST;
      bar.setVisible(near);
      if (near) {
        const { frac, level, max } = levelProgress(bond.points);
        const w = Math.max(30, tag.width);
        const x = Math.round(spr.x - w / 2);
        const y = Math.round(tag.y - tag.height - 6);
        bar.clear().setDepth(FRIEND_TAG_DEPTH + spr.depth / 1e4);
        bar.fillStyle(0x3c2814, 0.85).fillRoundedRect(x - 1, y - 1, w + 2, 6, 3);
        if (frac > 0) bar.fillStyle(level >= max ? 0xffd966 : 0xff6fa8, 1).fillRoundedRect(x, y, Math.max(4, w * frac), 4, 2);
      }
    }
    this.friendVisitTimer -= dt;
    if (this.friendVisitTimer > 0) return;
    this.friendVisitTimer = 0.4;
    const p = this.player;
    const { tx, ty } = worldToTile(p.x, p.y);
    for (const a of friends) {
      const level = friendLevel(bondOf(a).points);
      if (level < 2 || a.baby) continue;
      const d = Math.hypot(p.x - a.x, (p.y - a.y) * 2);
      if (d > (a.visit ? FRIEND_STAY_DIST : FRIEND_CALL_DIST)) {
        if (a.visit) {
          a.visit = null;
          a.pickWander();
        }
        continue;
      }
      if (a.feed || a.petted || a.inCanopy?.()) continue; // (Brüllaffen oben in den Bäumen der Tropenhalle: bleiben oben)
      // im offenen Bereich (Streichelzoo) kommt es zu Henrik selbst, sonst an die Stelle am Zaun, die ihm am nächsten ist
      const inside = a.enclosure.tileSet.has(tx + ',' + ty);
      const spot = inside ? this.besidePlayer(a) : this.penSpotNear(a.enclosure, p);
      if (!spot) continue;
      if (!a.visit || Math.hypot(spot.x - a.visit.spot.x, spot.y - a.visit.spot.y) > 12) a.visit = { spot };
    }
  }

  // ---- Bedürfnisse: Blasen mit Hand oder Futter über den Tieren im Tierpark ----
  // Ohne Tierfreund (diese Art in diesem Gehege hat noch keinen Namen): ab und zu über einem Tier; erfüllt Henrik es am
  // Zaun, öffnet sich gleich die Tafel zum Benennen (kostenlos). Mit Tierfreund: nur über ihm, sobald seine Pause vorbei ist
  // (zeigt, dass Streicheln bzw. Füttern wieder geht). Die Blase ist nur ein Hinweis, sie bringt nichts extra.
  updateNeeds(dt) {
    if (!isPark(LEVEL_ID) || LEVEL.camp) return;
    const now = Date.now();
    // Blasen aufräumen: Tier weg, abgelaufen, oder beim Freund die Pause doch nicht vorbei
    for (const [a, need] of this.needs) {
      need.left -= dt;
      const bond = bondOf(a);
      const gone = !a.sprite?.active || a.state !== 'penned' || need.left <= 0 || a.inCanopy?.();
      const notReady = isFriend(a) && (need.kind === 'pet' ? !canPet(bond, now) : !canFeed(bond, now));
      const nowFriendless = !isFriend(a) && need.named; // (der Freund wurde gewechselt)
      if (gone || notReady || nowFriendless || (!isFriend(a) && this.friendOfAnimal(a))) this.clearNeed(a);
      else this.placeNeed(a, need);
    }
    this.needTimer -= dt;
    if (this.needTimer > 0) return;
    this.needTimer = Phaser.Math.FloatBetween(...NEED_EVERY);
    if (this.needs.size >= NEED_MAX) return;
    // zuerst die Tierfreunde, deren Pause vorbei ist
    const ready = this.friendsHere().filter((a) => !this.needs.has(a) && !a.baby && !a.inCanopy?.()).map((a) => {
      const bond = bondOf(a);
      const kinds = [canPet(bond, now) && 'pet', (SPECIES_FOOD[a.species] ?? []).length && canFeed(bond, now) && 'feed'].filter(Boolean);
      return kinds.length ? { a, kind: Phaser.Utils.Array.GetRandom(kinds) } : null;
    }).filter(Boolean);
    if (ready.length) {
      const { a, kind } = Phaser.Utils.Array.GetRandom(ready);
      return this.addNeed(a, kind, true);
    }
    // sonst ab und zu ein Tier einer Art, die in ihrem Gehege noch keinen Freund hat (je Art und Gehege höchstens eine Blase)
    if (Math.random() > 0.5) return;
    const taken = new Set([...this.needs.keys()].map((a) => `${a.enclosure?.id}:${a.species}`));
    const pool = this.animals.filter((a) => a.state === 'penned' && !a.baby && a.sprite?.visible && !a.inCanopy?.() && !isFriend(a)
      && this.signOfAnimal(a) && !this.friendOfAnimal(a) && !taken.has(`${a.enclosure.id}:${a.species}`));
    if (!pool.length) return;
    const a = Phaser.Utils.Array.GetRandom(pool);
    const eats = (SPECIES_FOOD[a.species] ?? []).length > 0;
    this.addNeed(a, eats && Math.random() < 0.4 ? 'feed' : 'pet', false);
  }

  // Gehegeschild für dieses Tier (über die Tafel bekommt es seinen Namen)
  signOfAnimal(a) {
    return this.enclosureSigns.find((s) => s.enclosure === a.enclosure && (s.only ?? s.enclosure.species ?? []).includes(a.species)) ?? null;
  }

  // der Tierfreund seiner Art in seinem Gehege (falls es einen gibt)
  friendOfAnimal(a) {
    const sign = this.signOfAnimal(a);
    return sign ? this.friendOfSign(sign) : null;
  }

  addNeed(a, kind, named) {
    const el = document.createElement('div');
    el.className = 'wish-bubble need';
    // Futter: beim Freund mit bekanntem Lieblingsfutter dessen Bild, sonst das Futterhaus (dort gibt es das Futter)
    const bond = named ? bondOf(a) : null;
    const fav = kind === 'feed' && bond?.favoriteKnown ? FEED_SORTS[favoriteOf(bond)]?.image : null;
    el.innerHTML = `<img src="${this.needIcon(kind === 'pet' ? 'hand' : fav ?? 'feeder')}" alt="">`;
    document.body.append(el);
    const need = { kind, el, named, left: named ? NEED_TIME * 2 : NEED_TIME };
    this.needs.set(a, need);
    this.placeNeed(a, need);
  }

  // Bild für die Blase: aus dem schon geladenen Spielbild (sonst wartet es hinter dem Laden im Hintergrund), einmal gemerkt
  needIcon(key) {
    this.needIcons ??= {};
    if (this.needIcons[key]) return this.needIcons[key];
    if (!this.textures.exists(key)) return `assets/${key}.png`;
    const img = this.textures.get(key).getSourceImage();
    const c = document.createElement('canvas');
    c.width = img.width;
    c.height = img.height;
    c.getContext('2d').drawImage(img, 0, 0);
    return (this.needIcons[key] = c.toDataURL('image/png'));
  }

  // Blase über dem Tier bzw. neben dem Namensschild des Tierfreunds mitführen
  // alle HTML-Blasen an die aktuelle Kamera anpassen (Bedürfnisse der Tiere, Wünsche der Besucher)
  placeBubbles() {
    for (const [a, need] of this.needs ?? []) if (a.sprite?.active) this.placeNeed(a, need);
    for (const v of this.visitors?.visitors ?? []) v.placeWish?.();
  }

  // Tierfreund: rechts neben seinem Namensschild; sonst über dem Kopf (nach dem Tier, nicht nach dem wippenden Bild,
  // und auf ganze Bildpunkte gerundet, damit die Blase ruhig steht)
  placeNeed(a, need) {
    const spr = a.sprite;
    const show = spr.visible && !this.signOpen;
    if (show !== need.el.classList.contains('show')) need.el.classList.toggle('show', show);
    if (!show) return;
    const cam = this.cameras.main;
    const k = cam.zoom * this.scale.zoom;
    const tag = isFriend(a) ? this.friendTags.get(a) : null;
    need.el.classList.toggle('side', !!tag);
    const x = tag ? tag.x + tag.width / 2 + 2 : a.x;
    const y = tag ? tag.y - tag.height / 2 : a.y - spr.displayHeight * spr.originY + 4;
    need.el.style.left = `${Math.round((x - cam.worldView.x) * k)}px`;
    need.el.style.top = `${Math.round((y - cam.worldView.y) * k)}px`;
  }

  clearNeed(a) {
    const need = this.needs.get(a);
    if (!need) return;
    need.el.remove();
    this.needs.delete(a);
  }

  clearNeeds() {
    for (const a of [...(this.needs?.keys() ?? [])]) this.clearNeed(a);
  }

  // Tier ohne Namen mit Bedürfnis, an das Henrik nah genug herangekommen ist (Tierfreunde laufen über nearFriend)
  needToMeet() {
    if (this.leaving || this.toolId === 'parkfood' || !this.needs?.size) return null;
    const p = this.player;
    const dist = (o) => Math.hypot(p.x - o.x, (p.y - o.y) * 2);
    let best = null;
    for (const a of this.needs.keys()) if (!isFriend(a) && dist(a) < FRIEND_PET_DIST && (!best || dist(a) < dist(best))) best = a;
    return best;
  }

  // Bedürfnis eines Tiers ohne Namen erfüllen: erst die Tafel zum Benennen (kostenlos), danach streicheln bzw. füttern wie
  // beim Tierfreund. Falsches oder kein Futter: ein Hinweis, die Blase bleibt
  meetNeed(a) {
    const need = this.needs.get(a);
    const sign = this.signOfAnimal(a);
    if (!need || !sign) return;
    const kind = ANIMAL_INFO[a.species]?.[0] ?? '';
    let then;
    if (need.kind === 'feed') {
      const sort = isTreat(this.toolId) ? this.tool?.sort : null;
      if (!sort) {
        this.showToast(tr('Hunger! Hol Futter im Futterhaus.', 'Hungry! Get food at the feed house.'));
        return;
      }
      if (!(SPECIES_FOOD[a.species] ?? []).includes(sort)) {
        this.showToast(tr(`Das frisst es nicht.`, `It doesn’t eat that.`));
        return;
      }
      then = () => this.feedFriend(a, sort);
    } else {
      if (isTreat(this.toolId)) {
        this.showToast(tr(`Es möchte gestreichelt werden.`, `It wants to be petted.`));
        return;
      }
      then = () => this.petFriend(a);
    }
    this.clearNeed(a);
    this.nearNeed = null;
    this.openSign(sign, { mode: 'name', animal: a, name: randomName(a.species), free: true, then, kind });
  }

  // Henrik hat Futter ins Gehege geworfen und das Tier mit dem Futter-Bedürfnis frisst davon: beim Tierfreund zählt das
  // wie Füttern (ohne Lieblingsfutter), ein Tier ohne Namen bekommt gleich die Tafel zum Benennen (kostenlos)
  fedByThrow(a) {
    if (!this.needs.has(a) || this.signOpen || this.leaving) return;
    this.clearNeed(a);
    if (isFriend(a)) return this.creditFeed(a);
    const sign = this.signOfAnimal(a);
    if (sign && !this.friendOfAnimal(a)) this.openSign(sign, { mode: 'name', animal: a, name: randomName(a.species), free: true, then: () => this.creditFeed(a) });
  }

  // gefüttert mit geworfenem Futter: ein Punkt, die Pause fürs Füttern beginnt, ein Herz steigt auf
  creditFeed(a) {
    const bond = bondOf(a);
    if (!bond || !canFeed(bond)) return;
    const before = friendLevel(bond.points);
    bond.points += FEED_POINTS;
    bond.fedAt = Date.now();
    this.friendHeart(a);
    const up = this.friendLevelUp(a, bond, before);
    if (up) this.showToast(up);
    this.updateQuestCard();
  }

  // Platz knapp neben Henrik, auf der Seite des Tiers
  besidePlayer(a) {
    const p = this.player;
    const d = Math.hypot(a.x - p.x, a.y - p.y) || 1;
    return { x: p.x + ((a.x - p.x) / d) * 30, y: p.y + ((a.y - p.y) / d) * 15 };
  }

  // die Kachel im Gehege, die diesem Punkt am nächsten ist (als Weltpunkt)
  penSpotNear(e, pt) {
    let best = null;
    let bd = Infinity;
    for (const t of e.tiles) {
      const w = tileToWorld(t.tx, t.ty);
      const d = Math.hypot(w.x - pt.x, (w.y - pt.y) * 2);
      if (d < bd) {
        bd = d;
        best = w;
      }
    }
    return best;
  }

  // Tierfreund, den man gerade streicheln kann (nah genug, ohne Futter in der Hand); steht man näher am Gehegeschild,
  // öffnet die Aktionstaste lieber die Tafel
  friendToPet() {
    if (this.toolId === 'parkfood' || this.leaving) return null;
    const p = this.player;
    const dist = (o) => Math.hypot(p.x - o.x, (p.y - o.y) * 2);
    let best = null;
    for (const a of this.friendsHere()) if (!a.inCanopy?.() && dist(a) < FRIEND_PET_DIST && (!best || dist(a) < dist(best))) best = a; // (Brüllaffen oben in den Bäumen der Tropenhalle: nicht)
    if (best && this.shownSign && dist(this.shownSign) < dist(best)) return null;
    return best;
  }

  // streicheln: das Tier bleibt stehen, dreht sich zu Henrik, sackt kurz zusammen, ein Herz steigt auf. Alle 5 Minuten
  // (echte Zeit) einmal; kommt man zu früh, dreht es sich kurz weg – ohne Abzug
  petFriend(a) {
    const bond = bondOf(a);
    if (!bond) return;
    const p = this.player;
    if (!canPet(bond)) {
      a.faceX = p.x < a.x ? 1 : -1; // schaut weg
      this.time.delayedCall(900, () => a.sprite?.active && (a.faceX = p.x < a.x ? -1 : 1));
      this.showToast(tr(`${bond.name} möchte gerade nicht gestreichelt werden. Versuch es später noch einmal.`, `${bond.name} doesn’t want to be petted right now. Try again later.`));
      return;
    }
    const before = friendLevel(bond.points);
    bond.points += PET_POINTS;
    bond.pettedAt = Date.now();
    this.clearNeed(a);
    // stehen bleiben und zu Henrik schauen (wie beim Streicheln durch Besucher im Streichelzoo)
    const hold = { x: p.x, y: p.y };
    a.petted = hold;
    this.time.delayedCall(1800, () => a.petted === hold && (a.petted = null));
    p.faceX = a.x < p.x ? -1 : 1;
    if (!this.tweens.isTweening(a.sprite)) {
      const { scaleX, scaleY } = a.sprite;
      this.tweens.add({ targets: a.sprite, scaleX: scaleX * 1.12, scaleY: scaleY * 0.86, duration: 170, yoyo: true, repeat: 1, ease: 'Sine.easeInOut', onComplete: () => a.sprite.setScale(scaleX, scaleY) });
    }
    this.friendHeart(a);
    const up = this.friendLevelUp(a, bond, before);
    if (up) this.showToast(up);
    this.updateQuestCard();
    this.updateToolbar();
  }

  // Aufstieg in eine neue Stufe: der Ruf des Tiers; gibt den Text für die Meldung zurück (was die Stufe bringt), sonst ''
  friendLevelUp(a, bond, before) {
    const level = friendLevel(bond.points);
    if (level <= before) return '';
    if (this.cache.audio.exists(this.callOf(a))) this.sound.play(this.callOf(a), { volume: 0.5 });
    return `${tr(`${bond.name} und du seid jetzt Freunde der Stufe ${level}!`, `${bond.name} and you are now level ${level} friends!`)}<br><small>${levelText(bond.name, level) ?? ''}</small>`;
  }

  // Freudenhüpfer: n kleine Sprünge (Höhe jumpLift, siehe render in Animal.js)
  friendHop(a, n) {
    a.jumpLift = 0;
    this.tweens.add({ targets: a, jumpLift: 9, duration: 150, yoyo: true, repeat: n - 1, ease: 'Sine.easeOut', onComplete: () => (a.jumpLift = 0) });
  }

  // aus der Hand füttern (Futter aus dem Futterhaus): passendes Futter 1 Punkt, Lieblingsfutter 3 Punkte. Alle 5 Minuten
  // (echte Zeit) einmal; zu früh oder Futter, das es nicht frisst: es dreht sich kurz weg, das Futter bleibt in der Hand
  feedFriend(a, sort = this.tool?.sort) {
    a ??= this.nearFriend;
    if (!a) {
      this.showToast(tr('Geh damit zu deinem Tierfreund an den Zaun und füttere ihn aus der Hand.', 'Take it to your animal friend at the fence and feed it from your hand.'));
      return;
    }
    const bond = bondOf(a);
    const p = this.player;
    const turnAway = () => {
      a.faceX = p.x < a.x ? 1 : -1;
      this.time.delayedCall(900, () => a.sprite?.active && (a.faceX = p.x < a.x ? -1 : 1));
    };
    const food = FEED_SORTS[sort];
    if (!(SPECIES_FOOD[a.species] ?? []).includes(sort)) {
      turnAway();
      this.showToast(tr(`${bond.name} mag kein ${food.name}.`, `${bond.name} doesn’t like ${food.name.toLowerCase()}.`));
      return;
    }
    if (!canFeed(bond)) {
      turnAway();
      this.showToast(tr(`${bond.name} ist satt. Versuch es später noch einmal.`, `${bond.name} is full. Try again later.`));
      return;
    }
    // Futter ist weg (neues gibt es im Futterhaus)
    this.tool.destroy();
    this.tool = null;
    this.toolId = null;
    const before = friendLevel(bond.points);
    const favorite = favoriteOf(bond) === sort;
    bond.points += favorite ? FAVORITE_POINTS : FEED_POINTS;
    bond.fedAt = Date.now();
    this.clearNeed(a);
    const hold = { x: p.x, y: p.y };
    a.petted = hold;
    this.time.delayedCall(2200, () => a.petted === hold && (a.petted = null));
    p.faceX = a.x < p.x ? -1 : 1;
    let said;
    if (favorite) {
      // Lieblingsfutter: 2–3 Freudenhüpfer, viele Herzen und der Ruf des Tiers
      const first = !bond.favoriteKnown;
      bond.favoriteKnown = true;
      this.friendHop(a, Phaser.Math.Between(2, 3));
      for (let i = 0; i < 5; i++) this.time.delayedCall(140 * i, () => a.sprite?.active && this.friendHeart(a, Phaser.Math.Between(-14, 14)));
      if (this.cache.audio.exists(this.callOf(a))) this.sound.play(this.callOf(a), { volume: 0.6 });
      said = first
        ? tr(`${bond.name} liebt ${food.name}! Das ist das Lieblingsfutter.`, `${bond.name} loves ${food.name.toLowerCase()}! That’s the favorite food.`)
        : tr(`Mmh, ${food.name}! ${bond.name} ist überglücklich.`, `Yum, ${food.name.toLowerCase()}! ${bond.name} is overjoyed.`);
    } else {
      this.friendHop(a, 1);
      this.friendHeart(a);
      said = tr(`${bond.name} frisst ${food.name} aus deiner Hand.`, `${bond.name} eats ${food.name.toLowerCase()} from your hand.`);
    }
    // eine Meldung: was passiert ist, darunter ein Aufstieg in die nächste Stufe
    const up = this.friendLevelUp(a, bond, before);
    this.showToast(up ? `${said}<br>${up}` : said);
    this.updateQuestCard();
    this.updateToolbar();
  }

  // Futterhaus (am Futterautomaten): Futtersack zum Werfen ins Gehege, dazu die Sorten zum Füttern aus der Hand. Eine Sorte
  // liegt hier erst, wenn man sie draußen einmal in der Hand hatte (die anderen als Schatten); was kein Tierfreund frisst,
  // ist ausgegraut. Das Spiel pausiert, solange die Tafel offen ist (Pfeile wählen, E/Enter nimmt, Esc schließt)
  openFeeder() {
    if (this.feederOpen || this.leaving) return;
    this.feederOpen = true;
    this.scene.pause();
    const wanted = wantedSorts();
    const known = game.feedUnlocked ?? [];
    this.feederItems = [
      { id: 'parkfood', image: 'parkfood', name: tr('Futtersack', 'Food sack'), note: tr('zum Werfen ins Gehege', 'to throw into an enclosure'), ok: true },
      ...Object.entries(FEED_SORTS).map(([k, f]) => ({
        id: `treat_${k}`,
        image: f.image,
        name: known.includes(k) ? f.name : '?',
        locked: !known.includes(k),
        ok: known.includes(k) && wanted.has(k),
        note: !known.includes(k) ? tr('erst draußen finden', 'find it outside first') : wanted.has(k) ? tr('für deine Tierfreunde', 'for your animal friends') : tr('frisst keiner deiner Freunde', 'none of your friends eats it'),
      })),
    ];
    this.feederPick = 0;
    const box = document.getElementById('feeder');
    const draw = () => {
      box.innerHTML = `<b class="feeder-title">${tr('Futterhaus', 'Food house')}</b>
        <div class="feeder-items">${this.feederItems
          .map((it, i) => `<button type="button" class="feeder-item${it.ok ? '' : ' off'}${it.locked ? ' locked' : ''}${i === this.feederPick ? ' picked' : ''}" data-item="${i}"><img src="assets/${it.image}.png" alt=""><b>${it.name}</b><small>${it.note}</small></button>`)
          .join('')}</div>
        ${Object.keys(game.friends ?? {}).length ? '' : `<small class="feeder-hint">${tr('Gib erst an einem Gehegeschild einem Tier einen Namen – dann kannst du es hier mit Futter verwöhnen.', 'First give an animal a name at an enclosure sign – then you can treat it with food from here.')}</small>`}
        <div class="sign-close"><button type="button" data-close>${tr('Schließen', 'Close')}</button></div>`;
    };
    const take = (i) => {
      const it = this.feederItems[i];
      if (!it?.ok) return;
      this.closeFeeder();
      this.equipTool(it.id);
      if (it.id === 'parkfood') this.showToast(tr('Futter genommen! Wirf es am Zaun ins Gehege – dann kommen die Tiere.', 'Got food! Throw it over the fence into an enclosure – the animals will come.'));
      else this.showToast(tr(`${it.name} genommen. Geh zu deinem Tierfreund an den Zaun und füttere ihn (${ACTION_KEY}).`, `You took ${it.name.toLowerCase()}. Go to your animal friend at the fence and feed it (${ACTION_KEY}).`));
    };
    draw();
    box.classList.add('show');
    document.body.classList.add('sign-open');
    box.onclick = (ev) => {
      if (ev.target.closest('[data-close]')) return this.closeFeeder();
      const btn = ev.target.closest('[data-item]');
      if (btn) take(Number(btn.dataset.item));
    };
    this.feederKeys = (ev) => {
      const k = ev.key;
      const moves = { ArrowLeft: -1, a: -1, A: -1, ArrowUp: -1, w: -1, W: -1, ArrowRight: 1, d: 1, D: 1, ArrowDown: 1, s: 1, S: 1 };
      if (k in moves) {
        this.feederPick = (this.feederPick + moves[k] + this.feederItems.length) % this.feederItems.length;
        draw();
      } else if (k === 'Enter' || k === ' ' || k.toUpperCase() === ACTION_KEY) {
        if (!ev.repeat) take(this.feederPick);
      } else if (k === 'Escape' || k === 'Backspace') {
        this.closeFeeder();
      } else return;
      ev.preventDefault();
      ev.stopPropagation();
    };
    setTimeout(() => this.feederOpen && document.addEventListener('keydown', this.feederKeys, true), 0);
    this.events.once('shutdown', () => this.feederKeys && document.removeEventListener('keydown', this.feederKeys, true));
  }

  closeFeeder() {
    if (!this.feederOpen) return;
    document.removeEventListener('keydown', this.feederKeys, true);
    this.feederKeys = null;
    this.feederOpen = false;
    document.getElementById('feeder').classList.remove('show');
    document.body.classList.remove('sign-open');
    this.scene.resume();
  }


  // ein Herz steigt über dem Tier auf
  friendHeart(a, dx = 0) {
    const spr = a.sprite;
    const h = this.add
      .text(spr.x + dx, spr.y - spr.displayHeight * spr.originY - 6, '♥', { fontFamily: 'Arial', fontSize: '18px', color: '#ff6fa8', stroke: '#ffffff', strokeThickness: 3 })
      .setOrigin(0.5)
      .setDepth(spr.depth + 1);
    this.tweens.add({ targets: h, y: h.y - 26, alpha: 0, duration: 1200, ease: 'Sine.easeOut', onComplete: () => h.destroy() });
  }

  // für die Besucher (ab Stufe 3): der Tierfreund mit der höchsten Stufe in diesem Gehege, oder null
  friendIn(pen) {
    let best = null;
    for (const a of this.friendsHere()) {
      if (a.enclosure !== pen) continue;
      const level = friendLevel(bondOf(a).points);
      if (!best || level > best.level) best = { animal: a, bond: bondOf(a), level };
    }
    return best;
  }


  // Ruf eines Tiers
  callOf(a) {
    // seltene Variante mit eigenem Ton (der Gibbon ruft anders als der Brüllaffe)
    if (a.skin && this.cache.audio.exists(`animal_${a.skin}`)) return `animal_${a.skin}`;
    const key = `animal_${a.species}`;
    // ohne eigenen Ton: ein ähnlicher (der Tiger brüllt wie der Löwe)
    return this.cache.audio.exists(key) ? key : CALL_FALLBACK[a.species] ?? key;
  }

  // ab und zu ein Ruf eines Tiers in der Nähe, das einen Ruf hat: im Tierpark aus den Gehegen, in der Wildnis von den
  // wilden Tieren (außer WILD_SILENT und solchen, die gerade nicht zu sehen sind)
  updateNearCalls(dt) {
    const park = isPark(LEVEL_ID);
    this.penCallTimer = (this.penCallTimer ?? Phaser.Math.FloatBetween(2, PEN_CALL_EVERY[0])) - dt;
    if (this.penCallTimer > 0) return;
    this.penCallTimer = Phaser.Math.FloatBetween(...PEN_CALL_EVERY);
    const p = this.player;
    const callers = this.animals
      .filter((a) => (park ? a.state === 'penned' : a.state === 'wild' && a.sprite.visible && !WILD_SILENT.includes(a.species)))
      .map((a) => ({ a, key: park && a.species in PEN_CALLS ? PEN_CALLS[a.species] : this.callOf(a) }))
      .filter(({ key }) => key && this.cache.audio.exists(key))
      .map((c) => ({ ...c, d: Math.hypot(c.a.x - p.x, (c.a.y - p.y) * 2) }))
      .filter(({ d }) => d < PEN_CALL_DIST);
    if (!callers.length) return;
    // eher die Tiere ganz in der Nähe, aber nicht immer dasselbe
    callers.sort((u, v) => u.d - v.d);
    const { key, d } = callers[Math.floor(Math.random() * Math.min(3, callers.length))];
    const near = 1 - d / PEN_CALL_DIST;
    this.sound.play(key, { volume: PEN_CALL_VOLUME * (0.35 + 0.65 * near), detune: Phaser.Math.Between(-120, 120) });
  }

  // Übergang in einen Tierpark-Abschnitt (oder ein Haus), den Mavi noch nicht freigeschaltet hat: stehen bleiben
  blockedExit(exit, prev) {
    this.player.x = prev.x;
    this.player.y = prev.y;
    if (this.time.now < (this.blockedHintAt ?? 0)) return;
    this.blockedHintAt = this.time.now + 4000;
    this.showToast(tr(`🚧 ${exit.label}: Hier wird noch gebaut – Mavi sagt dir, wenn es fertig ist.`, `🚧 ${exit.label}: Still under construction – Mavi will tell you when it’s ready.`));
  }

  // Baustellen-Absperrung (rot-weiß gestreifte Latte auf zwei Böcken) an einem gesperrten Übergang
  drawBarrier(exit) {
    const { x, y } = tileToWorld(exit.tx, exit.ty);
    const g = this.add.graphics().setDepth(y + 8);
    const w = 44;
    g.fillStyle(0x6b4224, 1);
    g.fillRect(x - w / 2, y - 14, 3, 16);
    g.fillRect(x + w / 2 - 3, y - 14, 3, 16);
    for (let i = 0; i < 6; i++) {
      g.fillStyle(i % 2 ? 0xffffff : 0xe8483f, 1);
      g.fillRect(x - w / 2 + (i * w) / 6, y - 16, w / 6, 6);
    }
    g.lineStyle(1, 0x6b4224, 1).strokeRect(x - w / 2, y - 16, w, 6);
  }

  // Boden einmal in große Flächen (je 1024 x 1024 Pixel) malen statt tausender einzelner Kacheln, die sonst in jedem Bild
  // neu gezeichnet würden
  bakeGround(list) {
    const PAD = 4; // die Flächen überlappen ein wenig, damit an den Nahtstellen keine feine Linie durchscheint
    const minX = Math.min(...list.map(([x]) => x)) - TILE_W / 2;
    const minY = Math.min(...list.map(([, y]) => y)) - TILE_H / 2;
    // Kacheln in hoher Auflösung (siehe hd.js): Boden feiner malen (bis doppelt), so fein, wie es die Zahl der Flächen
    // erlaubt (jede Fläche belegt 4 MB Grafikspeicher; leere Flächen ohne Kachel werden nicht angelegt). Große Gebiete
    // wie der Tierpark bekommen so eine Zwischenstufe statt gleich der einfachen Auflösung
    const hd = list.some(([, , key]) => hdScale(this, key) > 1);
    const areas = (r) => new Set(list.map(([x, y]) => Math.floor(((x - minX) * r) / 1024) + ',' + Math.floor(((y - minY) * r) / 1024))).size;
    const res = hd ? [2, 1.5, 1.25, 1.1].find((r) => areas(r) <= GROUND_HD_CHUNKS) ?? 1 : 1;
    const CHUNK = 1024 / res; // so viel Welt deckt eine Fläche ab (die Fläche selbst hat immer 1024 Pixel)
    const chunks = new Map();
    const chunk = (i, j) => {
      const k = i + ',' + j;
      if (!chunks.has(k)) {
        const rt = this.add.renderTexture(minX + i * CHUNK - PAD, minY + j * CHUNK - PAD, (CHUNK + 2 * PAD) * res, (CHUNK + 2 * PAD) * res);
        rt.setOrigin(0).setScale(1 / res).setDepth(-100000 + (i + j) * 0.001);
        // Pixel-Art: scharfe Kanten; gezeichnete Kacheln (hohe Auflösung): weich, sonst wirken sie treppig
        rt.texture.setFilter(hd ? Phaser.Textures.FilterMode.LINEAR : Phaser.Textures.FilterMode.NEAREST);
        chunks.set(k, rt);
      }
      return chunks.get(k);
    };
    for (const [x, y, key] of list) {
      // eine Kachel kann über den Rand einer Fläche (samt Überlappung) reichen: dann in alle betroffenen malen
      const i0 = Math.floor((x - TILE_W / 2 - PAD - minX) / CHUNK), i1 = Math.floor((x + TILE_W / 2 + PAD - minX) / CHUNK);
      const j0 = Math.floor((y - TILE_H / 2 - PAD - minY) / CHUNK), j1 = Math.floor((y + TILE_H / 2 + PAD - minY) / CHUNK);
      for (let i = i0; i <= i1; i++) for (let j = j0; j <= j1; j++) {
        const rt = chunk(i, j);
        rt.stamp(key, undefined, (x - rt.x) * res, (y - rt.y) * res, { scale: res });
      }
    }
  }

  // feste Dinge (Bäume, Zäune, Büsche ...) außerhalb des Bildausschnitts ausblenden, damit sie nicht gezeichnet werden.
  // Nur neu rechnen, wenn sich die Kamera bewegt hat. Bilder ragen vom Fußpunkt nach oben, daher unten mehr Rand
  cullStatic() {
    const v = this.cameras.main.worldView;
    const last = this.cullView;
    if (last && Math.abs(last.x - v.x) < 16 && Math.abs(last.y - v.y) < 16 && last.width === v.width) return;
    this.cullView = { x: v.x, y: v.y, width: v.width };
    const x0 = v.x - 200, x1 = v.right + 200, y0 = v.y - 60, y1 = v.bottom + 320;
    for (const o of this.cullables) o.setVisible(o.x > x0 && o.x < x1 && o.y > y0 && o.y < y1);
  }

  despawn(a) {
    // dieselbe Liste behalten: Fische und Eichhörnchen schauen darin nach freien Plätzen
    this.animals.splice(this.animals.indexOf(a), 1);
    this.tweens.add({ targets: a.sprite, alpha: 0, duration: 800, onComplete: () => a.destroy() });
  }

  fitZoom() {
    const h = this.scale.height;
    this.cameras.main.setZoom(IS_PHONE ? Math.max(1, Math.round((h / PHONE_VIEW_H) * 4) / 4) : Math.max(1, Math.round(h / VIEW_H)));
  }

  // Zufällige freie Kachel außerhalb des Geheges mit Abstand zu den Kacheln in "taken"
  randomFreeTile(taken) {
    for (;;) {
      const tx = Phaser.Math.Between(1, MAP_W - 2);
      const ty = Phaser.Math.Between(1, MAP_H - 2);
      if (isBlocked(tx, ty)) continue;
      if (nearEnclosure(tx, ty)) continue;
      const p = tileToWorld(tx, ty);
      if (blockedAt(p.x, p.y, 12, 5)) continue;
      const tooClose = taken.some((t, i) => Math.max(Math.abs(t.tx - tx), Math.abs(t.ty - ty)) < (i === 0 ? 5 : 2));
      if (!tooClose) return { tx, ty };
    }
  }

  // Wie viele Tiere jeder Art sind zuhause (im Gehege bzw. Fischteich), über alle Level?
  homeCounts() {
    const counts = {};
    const add = (species, state) => {
      if (state === 'penned') counts[species] = (counts[species] ?? 0) + 1;
    };
    for (const a of this.animals) if (!a.baby && !LEVEL.camp) add(a.species, a.state); // (Käfige im Expeditions-Camp zählen nicht)
    for (const [id, saved] of Object.entries(game.levels)) {
      if (id !== LEVEL_ID) for (const s of saved.animals) add(s.species, s.state);
    }
    return counts;
  }

  // Abzeichen oben links: Gebiet und wie viele Tiere schon zuhause sind; die Einzelheiten zeigt die Übersicht (I)
  updateHud() {
    if (!this.hud) return; // beim ersten Aufbau noch nicht da (z. B. Herzen fürs Auswildern beim Ankommen, siehe moveFollowersIntoPens)
    const total = Object.values(this.homeCounts()).reduce((s, n) => s + n, 0);
    this.hud.innerHTML = `${LEVEL.name} · 🐾 <b>${total}</b> · <span class="hearts">♥ <b>${game.hearts}</b></span>${save.testMode ? '<span class="test">TEST</span>' : ''}`;
    this.updateQuestCard(); // (Fortschritt der Besucher-Aufgabe)
    this.layoutHudStack();
  }

  // links oben untereinander: Tierbuch-Knopf und Zähler nebeneinander, darunter das laufende Event und die nächste Aufgabe
  layoutHudStack() {
    if (!this.eventBanner || !this.questCard) return;
    let y = Math.max(this.hud.getBoundingClientRect().bottom, document.getElementById('btn-book').getBoundingClientRect().bottom) + 6;
    this.eventBanner.style.top = `${Math.round(y)}px`;
    if (this.eventBanner.classList.contains('show')) y = this.eventBanner.getBoundingClientRect().bottom + 6;
    this.questCard.style.top = `${Math.round(y)}px`;
    this.questTab.style.top = `${Math.round(y)}px`;
    if (this.wishCards) {
      const below = this.questCard.classList.contains('show') ? this.questCard.getBoundingClientRect().bottom + 6 : y;
      this.wishCards.style.top = `${Math.round(below)}px`;
    }
  }

  // Neues fürs Tierbuch merken: 'caught:<Art>' (neu gefangen), 'seen:<Art>' (Fang-Tipp freigeschaltet), 'quest:<Id>'
  // (Aufgabe erledigt). Der Knopf bekommt einen roten Punkt; beim Öffnen leuchten genau diese Einträge auf
  markNew(key) {
    if (!game.bookNew.includes(key)) game.bookNew.push(key);
    this.updateBookButton();
  }

  updateBookButton() {
    document.getElementById('btn-book').classList.toggle('new', game.bookNew.length > 0);
  }

  // Aufgabe aus Mavis Geschichte geschafft (die Herzen gibt Mavi): eine kleine Feier mit der nächsten Aufgabe
  storySuccess(step) {
    this.time.delayedCall(400, () => {
      const box = document.getElementById('success');
      const next = activeStep();
      box.innerHTML = `${tr(`<b>Aufgabe geschafft!</b>`, `<b>Task done!</b>`)}<span>${step.goal}</span>${step.reward ? `<span><span class="heart">♥</span> +${step.reward}</span>` : ''}${next ? `<small>${tr('Nächste Aufgabe', 'Next task')}: ${next.goal}</small>` : ''}`;
      box.classList.remove('show');
      void box.offsetWidth; // Animation neu starten
      box.classList.add('show');
    });
  }

  // aktive Aufgabe aus Mavis Geschichte unter dem Zähler; antippen öffnet das Tierbuch dort. Der Pfeil rechts klappt sie
  // nach links weg (dann bleibt ein kleiner Knopf am Rand, der sie wieder ausklappt)
  updateQuestCard() {
    if (!this.questCard) return; // beim allerersten Aufbau (Tiere ziehen ein, bevor die Anzeige steht)
    const q = activeStep();
    let folded = false;
    try {
      folded = localStorage.getItem(QUEST_FOLD_KEY) === '1';
    } catch {}
    this.questCard.classList.toggle('show', !!q);
    this.questCard.classList.toggle('folded', folded);
    const wishes = this.updateWishCards(folded);
    this.questTab.classList.toggle('show', (!!q || wishes) && folded);
    if (q) {
      const n = STEPS.indexOf(q) + 1;
      const html = `<b>${tr('Mavis Aufgabe', 'Mavi’s task')} ${n} / ${STEPS.length}</b><span>${q.goal}${q.progress?.(game) ?? ''}</span>${q.reward ? `<span class="quest-reward"><span class="heart">♥</span> ${q.reward}</span>` : ''}<button class="quest-fold" aria-label="${tr('Einklappen', 'Collapse')}">◀</button>`;
      // neue Aufgabe, während die Karte eingeklappt ist: roter Punkt am Knopf
      if (folded && this.questCardStep && this.questCardStep !== q.id) this.questTab.classList.add('new');
      this.questCardStep = q.id;
      if (this.questCard.innerHTML !== html) this.questCard.innerHTML = html;
    }
    if (q || wishes) this.questTab.innerHTML = `${tr('Aufgabe', 'Task')}<span class="quest-fold">▶</span>`;
    this.layoutHudStack();
    // eingeklappt: der Knopf ist so hoch wie die Karten (sie bleiben dafür unsichtbar daneben im Layout)
    if (q || wishes) {
      const top = (q ? this.questCard : this.wishCards).getBoundingClientRect().top;
      const bottom = (wishes ? this.wishCards : this.questCard).getBoundingClientRect().bottom;
      this.questTab.style.height = `${Math.round(bottom - top)}px`;
    }
  }

  // --- Besucherwünsche (siehe src/world/wishes.js und docs/plan-wuensche.md) ---

  // darf sich ein Besucher diese Art wünschen? Noch nicht im Tierpark, aus einer freigeschalteten Welt, mit einem
  // Gehege im (freigeschalteten) Tierpark; keine Event-Tiere
  // Seltene Variante (skin): die Art lebt schon im Tierpark, die Variante noch nicht, und sie kommt in einer
  // freigeschalteten Welt vor
  wishValid(s, home = this.homeCounts(), skin = null) {
    if (!canWish(s) || EVENT_SPECIES[s] || !SPECIES_ORDER.includes(s)) return false;
    if (skin) {
      const sk = skinInfo(s, skin);
      if (!canWishSkin(s, sk) || !(sk.wild > 0 || sk.share > 0) || !((home[s] ?? 0) > 0) || this.homeSkins().has(skin)) return false;
      return sk.level ? isUnlocked(sk.level) && worldsOf(s).some((w) => w.level === sk.level) : worldsOf(s).some((w) => isUnlocked(w.level));
    }
    if ((home[s] ?? 0) > 0) return false;
    const house = houseOf(s);
    const pen = house ? isUnlocked(house) : PARK_LEVELS.some((l) => isUnlocked(l) && LEVELS[l].enclosures.some((e) => e.species?.includes(s)));
    return pen && worldsOf(s).some((w) => isUnlocked(w.level));
  }

  // zufällige Art für einen neuen Wunsch-Besucher (nicht in taken: schon gewünscht bzw. angenommen)
  // gibt { species, skin } zurück (skin nur bei einer seltenen Variante)
  pickWish(taken) {
    const home = this.homeCounts();
    const rare = SPECIES_ORDER.flatMap((s) => [SKINS[s] ?? []].flat().filter((sk) => !taken.has(wishKey(s, sk.id)) && this.wishValid(s, home, sk.id)).map((sk) => ({ species: s, skin: sk.id })));
    if (rare.length && Math.random() < RARE_WISH_CHANCE) return Phaser.Utils.Array.GetRandom(rare);
    const list = SPECIES_ORDER.filter((s) => !taken.has(s) && this.wishValid(s, home)).map((s) => ({ species: s, skin: null }));
    if (list.length) return Phaser.Utils.Array.GetRandom(list);
    return rare.length ? Phaser.Utils.Array.GetRandom(rare) : null;
  }

  // seltene Varianten, die im Tierpark (und seinen Häusern) im Gehege leben
  homeSkins() {
    const skins = new Set();
    for (const a of this.animals) if (a.skin && a.state === 'penned' && !LEVEL.camp) skins.add(a.skin);
    for (const [id, saved] of Object.entries(game.levels)) {
      if (id !== LEVEL_ID) for (const x of saved.animals) if (x.skin && x.state === 'penned') skins.add(x.skin);
    }
    return skins;
  }

  // Bild eines Besuchers (erstes Bild seines Blatts, von vorn) für den Aktionsknopf; einmal je Aussehen erzeugt
  visitorPortrait(look) {
    visitorPics[look] ??= this.textures.getBase64(`visitor${look}`, 0);
    return visitorPics[look];
  }

  // Wunsch-Besucher angesprochen
  talkToWisher(v) {
    const species = this.visitors?.acceptWish(v);
    if (!species) return;
    this.nearWish = null;
    this.updateToolbar();
    this.updateQuestCard();
  }

  // Gehege, in dem die Art lebt (für die Wunschkarte)
  wishPenName(s) {
    const a = this.animals.find((x) => x.species === s && x.state === 'penned' && x.enclosure?.name);
    if (a) return a.enclosure.name;
    const house = houseOf(s);
    if (house) return LEVELS[house].enclosures.find((e) => e.species?.includes(s))?.name ?? LEVELS[house].name;
    return parkPenFor(s)?.name ?? '';
  }

  // jede Sekunde: erfüllte Wünsche erkennen; ist Henrik an einem Gehege mit einer gewünschten (erfüllten) Art, kommt
  // der Besucher herbei
  updateWishes(dt) {
    this.wishTimer -= dt;
    if (this.wishTimer > 0) return;
    this.wishTimer = 1;
    const open = openWishes();
    if (!open.length) return;
    const home = this.homeCounts();
    const skins = this.homeSkins();
    let changed = false;
    for (const w of open) {
      if (w.done || !(w.skin ? skins.has(w.skin) : home[w.species] > 0)) continue;
      w.done = true;
      changed = true;
      this.showToast(`${wishIcon(w.species, w.skin, 2.2)} ${tr('Wunsch erfüllt! Schau am Gehege vorbei.', 'Wish come true! Visit the enclosure.')}`);
    }
    if (changed) this.updateQuestCard();
    const crowd = this.visitors;
    if (!crowd || crowd.thanking || this.leaving || isSpeaking()) return;
    const p = this.player;
    for (const w of open) {
      if (!w.done) continue;
      const a = this.animals.find((x) => x.species === w.species && (!w.skin || x.skin === w.skin) && x.state === 'penned' && !x.baby && ENCLOSURES.includes(x.enclosure) && Math.hypot(x.x - p.x, (x.y - p.y) * 2) < THANK_DIST);
      if (a && crowd.thank(w, a.enclosure, a)) return;
    }
  }

  // der Besucher freut sich am Gehege: Herzen, Wunschkarte weg
  wishThanked(wish) {
    const open = openWishes();
    const i = open.findIndex((w) => w === wish || (w.species === wish.species && (w.skin ?? null) === (wish.skin ?? null) && w.done));
    if (i < 0) return;
    const [w] = open.splice(i, 1);
    const s = w.species;
    const hearts = wishHearts(w);
    countPark('wishes'); // für die Statistik
    this.addHearts(hearts, s);
    this.updateQuestCard();
    // die Tafel erst nach den Freudensprüngen (sonst verdeckt sie den Besucher)
    this.time.delayedCall(2600, () => {
      const box = document.getElementById('success');
      box.innerHTML = `${tr('<b>Wunsch erfüllt!</b>', '<b>Wish come true!</b>')}<span>${wishIcon(s, w.skin, 2.6)}</span><span><span class="heart">♥</span> +${hearts}</span>`;
      box.classList.remove('show');
      void box.offsetWidth; // Animation neu starten
      box.classList.add('show');
    });
  }

  // Wunschkarten unter Mavis Aufgabe; gibt zurück, ob welche da sind
  updateWishCards(folded) {
    const el = this.wishCards;
    if (!el) return false;
    const open = openWishes();
    el.classList.toggle('show', open.length > 0);
    el.classList.toggle('folded', folded);
    const html = open
      .map((w) => {
        const name = wishName(w.species, w.skin, (ANIMAL_INFO[w.species] ?? [w.species])[0]);
        const icon = wishIcon(w.species, w.skin, 1.6);
        if (w.done) return `<div class="wish-card done"><b>${tr('Wunsch erfüllt!', 'Wish come true!')}</b><span class="wish-line">${icon}<span>${tr('Schau am Gehege vorbei', 'Visit the enclosure')}: ${this.wishPenName(w.species)}</span></span></div>`;
        const places = worldsOf(w.species).filter((x) => isUnlocked(x.level)).map((x) => LEVELS[x.level].name).join(', ');
        return `<div class="wish-card"><b>${tr('Besucherwunsch', 'Visitor’s wish')}</b><span class="wish-line">${icon}<span>${name}${places ? ` · ${places}` : ''}</span><span class="quest-reward"><span class="heart">♥</span> ${wishHearts(w)}</span></span></div>`;
      })
      .join('');
    if (el.innerHTML !== html) el.innerHTML = html;
    return open.length > 0;
  }

  foldQuestCard(fold) {
    try {
      localStorage.setItem(QUEST_FOLD_KEY, fold ? '1' : '0');
    } catch {}
    this.questTab.classList.remove('new');
    this.updateQuestCard();
  }

  // Events am Hauptrechner: Tafel mit allen Events, ihren Kosten und ihrem Zustand; das Spiel pausiert so lange
  // focus: Gehege-Id – dann nur der Ausbau dieses Geheges (am Gehegeschild); slotId: nur die Buden für diesen Bauplatz
  openEventsPanel(focus = null, slotId = null) {
    if (this.leaving || isEventsOpen() || isToolChestOpen() || isTravelMapOpen() || isJournalOpen()) return;
    this.scene.pause();
    openEvents(
      () => ({
        hearts: game.hearts,
        // den Eiswagen gibt es nur, solange nirgends ein fester Eisstand steht
        events: [...EVENTS].sort((a, b) => a.cost - b.cost).map((ev) => ({ ...ev, cost: price(ev.cost), ...eventState(ev.id), blocked: this.eventBlocked(ev) })),
        pens: this.penUpgrades(),
        build: this.shopOffers(slotId),
      }),
      (tab, id) => {
        this.scene.resume();
        if (tab === 'pens') return this.upgradePen(id);
        if (tab === 'build') return this.buildShop(id, slotId);
        // Event mit Tieren, deren Bilder noch im Hintergrund laden: erst darauf warten, dann die Tafel noch einmal
        if (!groupsLoaded(EVENT_GROUPS[id] ?? [])) return this.afterGroupsLoaded(EVENT_GROUPS[id], () => this.openEventsPanel());
        this.beginEvent(id);
      },
      () => this.scene.resume(),
      slotId
        ? slotId === wheelSlot()?.id
          ? { tab: 'build', single: true, title: WHEEL.name, note: tr('Die Besucher fahren eine Runde mit – jede Fahrt bringt Herzen. Mit dem Riesenrad kommen mehr Besucher in den Park.', 'Visitors take a ride – every ride brings hearts. With the Ferris wheel, more visitors come to the zoo.') }
          : { tab: 'build', single: true, point: activeId() === 'stands' ? 'icecream' : null } // Mavis Aufgabe: Pfeil auf den Eisstand
        : focus
          ? { tab: 'pens', only: focus }
          : activeId() === 'babies' // Mavis Aufgabe: Pfeil auf die Tierbabys
            ? { point: 'babies', hint: tr('Starte die Tierbabys – die Besucher lieben die Kleinen!', 'Start the animal babies – the visitors love the little ones!') }
            : {},
    );
  }

  // Event starten (am Computer oder geschenkt, free: kostet keine Herzen) und Bescheid sagen
  beginEvent(id, free = false) {
    startEvent(id, Date.now(), free);
    countEvent(id);
    this.updateHud();
    // für Mavis Event-Aufgabe (ganz am Ende): nicht der Eiswagen und nicht die Tierbabys aus ihrer eigenen Aufgabe
    if (!free && !(id === 'babies' && activeId() === 'babies')) game.story.flags.event = true;
    this.mavi?.check();
    if (id === 'lanterns') this.showToast(tr('🏮 Laternenabend im Bambuswald!', '🏮 Lantern Evening in the bamboo forest!'));
    if (id === 'farm') this.showToast(tr('🐄 Bauernhof! Auf die Wiese kommen viele Kühe, Schweine und Ziegen – fang sie ein!', '🐄 Farm! Lots of cows, pigs and goats are coming to the meadow – catch them!'));
    if (id === 'rare') this.showToast(tr('✨ Seltene Tiere! 5 Minuten lang ist in den Welten jedes zweite neue Tier eine seltene Variante.', '✨ Rare Animals! For 5 minutes every second new animal in the worlds is a rare variant.'));
    if (id === 'flamingo') this.showToast(tr('🦩 Flamingo-Flug! In Wiese, Wald und Savanne fliegen jetzt Flamingos.', '🦩 Flamingo Flight! Flamingos are now flying over the meadow, forest and savanna.'));
    if (id === 'fireflies') this.showToast(tr('✨ Glühwürmchen-Abend! Im Bambuswald wird es Abend – in der Hütte liegt ein Glas für die Glühwürmchen.', '✨ Firefly Evening! It is getting dark in the bamboo forest – there is a jar for the fireflies in the hut.'));
    if (id === 'migration') this.showToast(tr('🦬 Große Wanderung! Unten links in der Savanne zieht eine riesige Gnu-Herde vorbei – halte das Lasso bereit.', '🦬 Great Migration! A huge herd of wildebeest is passing through the lower left of the savanna – keep your lasso ready.'));
    if (id === 'wolves') this.showToast(tr('🐺 Wolfsnacht! Im Wald ist es dunkel – folge mit der Laterne den leuchtenden Spuren zu den Wölfen.', '🐺 Wolf Night! It is dark in the forest – follow the glowing tracks to the wolves with your lantern.'));
    if (id === 'jellyfish') this.showToast(tr('🪼 Quallen-Schwarm! Im Riff treiben jetzt Quallen – das Quallenglas liegt im Sack am Anker.', '🪼 Jellyfish Swarm! Jellyfish are drifting through the reef – the jellyfish jar is in the bag at the anchor.'));
    if (id === 'ride') this.showToast(tr('🐴 Dein Reittier wartet in den Welten! Dort sitzt du 10 Minuten lang im Sattel.', '🐴 Your mount is waiting in the worlds! There you ride for 10 minutes.'));
    if (id === 'babies') {
      this.spawnBabies(true);
      this.visitors?.updateScore();
      this.showToast(`<span class="heart">♥</span> ${tr('Tierbabys! Die Besucher strömen herbei.', 'Animal babies! Visitors are flocking in.')}`);
    }
    this.updateEventBanner();
  }

  // Reittier: in den Welten aufsitzen (in Gebäuden steigt Henrik ab), im Tierpark zu Fuß
  updateMount() {
    const key = this.rideOn() ? RIDES[biomeOf()] ?? null : null;
    const { tx, ty } = worldToTile(this.player.x, this.player.y);
    const mount = this.driving ? 'scooter' : key && !buildingAt(tx, ty) ? key : null; // auf dem E-Roller bleibt man stehen
    if (mount && !this.player.mount && !this.riding) {
      this.showToast(tr('🐴 Du reitest! Schneller unterwegs – Werkzeug wechseln mit Q bzw. dem Werkzeug-Knopf.', '🐴 You are riding! You move faster – switch tools with Q or the tool button.'));
    }
    this.riding = !!key;
    this.player.setMount(mount);
    // Werkzeug-Knopf: beim Reiten und mit dem Bonus "Werkzeug überall"
    this.toolsAnywhere = !!key || (bonusActive('toolsEverywhere') && !!(LEVEL.chests ?? [])[0]);
    document.body.classList.toggle('riding', this.toolsAnywhere);
  }

  // reitet man gerade? (Reittier-Event überall in den Welten, oder der Bonus aus einer Kiste in diesem Gebiet)
  rideOn() {
    return isActive('ride') || bonusActive('ride');
  }

  // Glücksbringer-Tafel: im Tierpark wechseln, sonst nur ansehen
  showCharms() {
    if (this.leaving || isCharmsOpen() || isLuckPickerOpen() || isEventsOpen() || isToolChestOpen() || isTravelMapOpen() || isJournalOpen()) return;
    this.scene.pause();
    openCharms(isPark(LEVEL_ID), () => {
      this.scene.resume();
      this.luck.updateCampfireButton();
      this.updateHud();
    });
  }

  // Werkzeug wechseln vom Reittier aus: dieselbe Auswahl wie am Regal dieser Welt
  openRideChest() {
    if (!this.riding && !this.toolsAnywhere) return;
    const chest = (LEVEL.chests ?? [])[0];
    if (chest) this.openChest(chest);
  }

  // Gehegeausbau: alle Gehege mit Plätzen; noch nicht ausgebaute zuerst
  // (aus allen Abschnitten des Tierparks)
  // (aus allen Abschnitten des Tierparks); der Ausbau bringt mehr Platz, neue Ausstattung und Spielzeug
  penUpgrades() {
    const cost = price(upgradeCost());
    return parkPens().filter((e) => hasSlots(e) && !e.free)
      .map((e) => {
        const done = isUpgraded(e);
        const toys = PEN_TOYS[e.id] ? tr(` · Spielzeug: ${toysText(e)}`, ` · Toys: ${toysText(e)}`) : '';
        return {
          id: e.id,
          name: e.name,
          species: e.species ?? [],
          cost,
          done,
          text: `${done ? '' : `${penCapacity(e, 0)} → `}${penCapacity(e, 1)} ${tr('Plätze', 'spaces')} · ${e.upgrade}${toys}`,
          blocked: done ? null : game.hearts < cost ? tr('zu wenig Herzen', 'not enough hearts') : null,
        };
      })
      .sort((u, v) => u.done - v.done);
  }

  // Gehege ausbauen: Herzen abziehen, Stand speichern und den Tierpark mit dem größeren Gehege neu aufbauen
  // (liegt es in einem anderen Abschnitt, ist es beim nächsten Besuch dort ausgebaut)
  upgradePen(id) {
    const e = parkPens().find((f) => f.id === id);
    const cost = price(upgradeCost());
    if (!e || isUpgraded(e) || game.hearts < cost) return;
    game.hearts -= cost;
    game.upgrades += 1;
    game.penLevel[id] = 1;
    if (e.level !== LEVEL_ID) {
      this.updateHud();
      this.mavi?.check();
      this.saveGame();
      this.showToast(tr(`🔨 ${e.name} wird ausgebaut! Du findest es im Tierpark-Bereich „${LEVELS[e.level].part.name}“.`, `🔨 ${e.name} is being upgraded! You'll find it in the zoo area “${LEVELS[e.level].part.name}”.`));
      return;
    }
    this.saveLevelState();
    const arrive = worldToTile(this.player.x, this.player.y);
    this.leaving = true; // bis zum Neuaufbau steht alles (sonst hakt Mavi die Ausbau-Aufgabe ab, und ihr Satz geht verloren)
    this.cameras.main.fadeOut(250);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      showLoading(tr(`${e.name} wird ausgebaut …`, `Upgrading ${e.name} …`));
      afterPaint(() => this.scene.restart({ level: LEVEL_ID, arrive, upgraded: e.name }));
    });
  }

  // warum ein Event gerade nicht startbar ist (sonst null)
  eventBlocked(ev) {
    if (ev.id === 'lanterns' && !isUnlocked('park3')) return tr('braucht den Bambuswald im Tierpark', 'needs the bamboo forest in the zoo');
    if (ev.id === 'babies' && !babyPlan(this.animals.filter((a) => a.state === 'penned')).length && !this.aquariumBabyPair()) {
      return tr('braucht 2 gleiche größere Tiere in einem Gehege', 'needs 2 matching grown-up animals in one enclosure');
    }
    if (game.hearts < price(ev.cost)) return tr('zu wenig Herzen', 'not enough hearts');
    return null;
  }

  // Gibt es im Aquarium (gespeicherter Stand) zwei Tiere einer Familie im selben Becken? Dann kann das Tierbaby-Event dort Babys bringen
  aquariumBabyPair() {
    const saved = LEVEL_ID === 'aquarium' ? [] : game.levels.aquarium?.animals ?? []; // im Aquarium selbst zählt this.animals
    const tanks = aquariumTanks();
    const count = {};
    for (const s of saved) {
      const family = babyFamily(s.species);
      const t = s.state === 'penned' && family ? tankOf(tanks, s) : null;
      if (!t) continue;
      const k = t.e.id + ':' + family;
      count[k] = (count[k] ?? 0) + 1;
    }
    return Object.values(count).some((n) => n >= 2);
  }

  // Tierbabys: in jedem Gehege auf je 2 größere Tiere ein kleines, neben einem der Eltern
  spawnBabies(pop) {
    for (const { enclosure, species, parent } of babyPlan(this.animals.filter((a) => a.state === 'penned'))) {
      const a = this.createAnimal(species, parent.x, parent.y);
      a.rollSkin('baby'); // seltene Skins bei Babys nur ganz selten
      a.makeBaby();
      // an die nächste Stelle im Gehege, an der es ganz hineinpasst (nicht halb im Zaun, wenn die Eltern am Rand stehen)
      const spots = enclosure.tiles
        .map((t) => tileToWorld(t.tx, t.ty))
        .filter((p) => !isBlockedPoint(p.x, p.y) && a.enclosureFullyAt(p.x, p.y) === enclosure)
        .sort((p, q) => Math.hypot(p.x - parent.x, p.y - parent.y) - Math.hypot(q.x - parent.x, q.y - parent.y));
      const spot = spots[Phaser.Math.Between(0, Math.min(2, spots.length - 1))];
      if (spot) {
        a.x = spot.x + Phaser.Math.Between(-6, 6);
        a.y = spot.y + Phaser.Math.Between(-3, 3);
      }
      a.restore('penned');
      a.enclosure = enclosure;
      if (pop) a.popHeart();
    }
    this.babiesOn = true;
  }

  removeBabies() {
    for (const a of this.animals.filter((b) => b.baby)) {
      this.animals.splice(this.animals.indexOf(a), 1);
      this.tweens.add({ targets: [a.sprite, a.shadow], alpha: 0, duration: 800, onComplete: () => a.destroy() });
    }
    this.babiesOn = false;
  }

  // Setzen-Modus: eine Bude wurde aufgehoben bzw. umgestellt – den Abschnitt neu aufbauen (die Besucher berechnen Wege und
  // Plätze vor den Buden beim Aufbau); danach geht der Setzen-Modus weiter (resume: { sel, flip }), und an einer
  // umgestellten Bude (booth) kauft gleich jemand ein
  rebuildForDecor(resume, booth = null) {
    this.saveLevelState();
    const arrive = worldToTile(this.player.x, this.player.y);
    const face = { x: this.player.faceX, y: this.player.faceY };
    this.leaving = true;
    this.cameras.main.fadeOut(200);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      showLoading(tr('Die Bude wird umgestellt …', 'Moving the stand …'));
      afterPaint(() => this.scene.restart({ level: LEVEL_ID, arrive, decorResume: { ...resume, face }, boothMoved: booth }));
    });
  }

  // Katalog der Bauen-Taste („Bestellen“): eine Liste, erst die Buden, dann die Deko (Zwischenüberschriften, keine Reiter);
  // die Tafel bleibt beim Bestellen offen. Mavis Buden-Aufgabe: ein Pfeil zeigt auf den Eisstand
  openCatalog() {
    if (this.leaving || isEventsOpen() || isToolChestOpen() || isTravelMapOpen() || isJournalOpen()) return;
    const tut = storyActiveId() === 'stands' && game.story.heard;
    this.scene.pause();
    openEvents(
      () => ({
        hearts: game.hearts,
        shop: [
          { head: true, name: tr('Buden', 'Stands') },
          ...this.boothOffers().map((o) => ({ ...o, id: 'stand:' + o.id })),
          { head: true, name: tr('Deko', 'Decor') },
          ...this.decoOffers(),
        ],
      }),
      (_t, id) => (id.startsWith('stand:') ? this.buyBooth(id.slice(6)) : this.buyDecor(id)),
      () => {
        this.scene.resume();
        this.decor?.renderBar();
        this.updateBuildHint();
      },
      {
        tab: 'shop',
        single: true,
        title: tr('Bestellen', 'Order'),
        point: tut && !storedBooths(LEVEL_ID).length ? 'stand:icecream' : null,
        hint: tut && !storedBooths(LEVEL_ID).length ? tr('Bestell eine Bude – dann stellst du sie an einen Weg.', 'Order a stand – then put it next to a path.') : null,
        hintTab: 'shop',
      },
    );
  }

  // Buden im Katalog: Preis, Herzen je Verkauf; gesperrt, wenn sie hier schon steht, der Abschnitt voll ist oder der
  // Bauplan noch fehlt (Zuckerwatte und Brezeln: aus Kisten)
  boothOffers() {
    return SHOPS.filter((def) => boothKnown(def.id)).map((def) => ({
      id: def.id,
      name: def.name,
      image: def.stand,
      cost: price(def.cost),
      text: tr(`Jeder Verkauf bringt ${def.hearts} Herzen.`, `Every sale brings ${def.hearts} hearts.`),
      blocked: storedBooths(LEVEL_ID).some((b) => b.kind === def.id)
        ? tr('liegt in der Bauen-Leiste', 'in your build bar')
        : hasShop(LEVEL_ID, def.id)
        ? tr('steht hier schon', 'already in this area')
        : boothCount(LEVEL_ID) >= MAX_BOOTHS
          ? tr(`höchstens ${MAX_BOOTHS} Buden hier`, `at most ${MAX_BOOTHS} stands here`)
          : game.hearts < price(def.cost)
            ? tr('zu wenig Herzen', 'not enough hearts')
            : null,
    }));
  }

  // Bude bestellen: Herzen ab, sie liegt in der Bauen-Leiste (Reiter Buden, gleich ausgewählt)
  buyBooth(kind) {
    const def = shopDef(kind);
    if (!def || hasShop(LEVEL_ID, kind) || boothCount(LEVEL_ID) >= MAX_BOOTHS || game.hearts < price(def.cost)) return;
    game.hearts -= price(def.cost);
    const id = orderBooth(LEVEL_ID, kind);
    this.updateHud();
    if (this.decor?.on) this.decor.choose('booth:' + id);
    this.updateBuildHint();
  }

  // Mavis Buden-Aufgabe: wo ist man gerade? 'open' (Bauen-Taste drücken), 'order' (bestellen), 'place' (Bude an einen Weg
  // stellen), 'close' (steht – jetzt „Fertig“, erst dann ist die Aufgabe erledigt) oder null (keine Aufgabe). Den Eisstand
  // gibt es schon in der Grundausstattung: dann gleich 'place'
  buildHintStage() {
    if (storyActiveId() !== 'stands' || !game.story.heard || LEVEL_ID !== 'park') return null;
    if (Object.values(game.booths ?? {}).some((b) => !b.stored)) return this.decor?.on ? 'close' : null;
    if (!this.decor?.on) return 'open';
    return storedBooths(LEVEL_ID).length ? 'place' : 'order';
  }

  // der nächste Knopf pulsiert und bekommt den roten Pfeil (wie beim Tierfreund): Bauen-Taste, „Bestellen“, beim Setzen
  // die Bude in der Leiste (solange sie nicht ausgewählt ist), danach „Fertig“; Mavis Pfeil zeigt beim Setzen auf einen
  // guten Platz
  updateBuildHint() {
    const stage = this.buildHintStage();
    const booth = this.decor?.booths()[0];
    const mark = (el, on) => {
      if (!el) return;
      el.classList.toggle('tut', on);
      const ptr = el.querySelector(':scope > .tut-pointer');
      if (on && !ptr) el.insertAdjacentHTML('beforeend', TUT_POINTER);
      else if (!on) ptr?.remove();
    };
    mark(document.getElementById('btn-decor'), stage === 'open');
    mark(document.querySelector('#decor-bar [data-id="@order"]'), stage === 'order');
    mark(document.querySelector('#decor-bar [data-id="@done"]'), stage === 'close');
    document.querySelectorAll('#decor-bar .decor-item').forEach((el) => mark(el, stage === 'place' && el.dataset.id === booth && this.decor.sel !== booth));
    if (stage !== this.lastBuildHint) {
      this.lastBuildHint = stage;
      this.mavi?.updateArrow();
    }
  }

  // Deko im Katalog: Teile mit Preis und wie viele man schon hat
  decoOffers() {
    const owned = ensureDecor().owned;
    return shopDecor().map((id) => {
      const def = DECOR[id];
      const placed = PARK_LEVELS.reduce((n, l) => n + placedIn(l).filter((d) => d.id === id).length, 0);
      return {
        id,
        name: def.name,
        image: def.key,
        cost: price(def.cost),
        text: tr(`Du hast ${owned[id] ?? 0} · aufgestellt ${placed}`, `You have ${owned[id] ?? 0} · placed ${placed}`),
        blocked: game.hearts < price(def.cost) ? tr('zu wenig Herzen', 'not enough hearts') : null,
      };
    });
  }

  // Bild einer Deko, das noch nicht geladen ist (aus dem Paket einer anderen Welt, z. B. der Schneemann): kurz laden, dann
  // weiter (then)
  ensureDecorArt(key, then = () => {}) {
    if (!key || this.textures.exists(key)) return then();
    const group = groupOfKey(key);
    if (!group || groupsLoaded([group])) return then();
    this.afterGroupsLoaded([group], then);
  }

  buyDecor(id) {
    const def = DECOR[id];
    if (!def || game.hearts < price(def.cost)) return;
    game.hearts -= price(def.cost);
    giveDecor(id, 1);
    this.updateHud();
    if (this.decor?.on) this.decor.renderBar();
  }

  // selbst gesetzte Deko (DecorMode): Bild an dieser Kachel zeichnen bzw. wieder wegnehmen (die Karte selbst ändert DecorMode)
  drawDecor(tx, ty) {
    const obj = objectAt(tx, ty);
    if (!obj?.decor && !obj?.toy) return null;
    // große Deko (2×2 Kacheln): in der Mitte der Grundfläche, Tiefe der vordersten Kachel
    const n = (obj.decor && DECOR[obj.decor].size) || 1;
    const { x, y } = tileToWorld(tx + (n - 1) / 2, ty + (n - 1) / 2);
    const depth = obj.floor ? -99990 : tileToWorld(tx + n - 1, ty + n - 1).y;
    const img = this.add.image(x, y, obj.key).setOrigin(0.5, obj.originY).setDepth(depth);
    this.decorImages.set(`${tx},${ty}`, img);
    if (obj.sway) this.sway.plants.set(`${tx},${ty}`, { img, deg: obj.sway, obj });
    return img;
  }

  removeDecor(tx, ty) {
    const k = `${tx},${ty}`;
    const img = this.decorImages.get(k);
    if (!img) return;
    this.decorImages.delete(k);
    const plant = this.sway.plants.get(k);
    if (plant) this.sway.active.delete(plant);
    this.sway.plants.delete(k);
    this.cullables = this.cullables.filter((o) => o !== img);
    this.tweens.add({ targets: img, alpha: 0, scale: img.scale * 0.6, duration: 180, onComplete: () => img.destroy() });
  }

  // Setzen-Modus: steht Henrik an etwas, dem die Aktionstaste gilt (Schild, Futterhaus, Tierfreund …)? Dann ist die
  // Vorschau rot, und die Taste bleibt bei der anderen Aktion
  decorBusy() {
    return !!(this.nearFeeder || this.nearComputer || this.nearSlot || this.nearWish || this.nearNeed || this.nearFriend || this.shownSign || (this.nearScooter && !this.driving) || this.nearChest || this.luck?.nearChest || this.nearBed || this.nearStand);
  }

  // Bauplätze dieses Abschnitts: gebaute Buden mit Verkäufer (wie der Eiswagen), leere zeigen Baupflöcke (Karte)
  drawShops() {
    this.shopSlots = [];
    this.wheel = null;
    // Riesenrad: gebaut dreht es sich, sonst ein Bauplatz mit Schild (Riesenrad darauf)
    const w = LEVEL.wheelSlot;
    if (w && hasWheel(LEVEL_ID)) this.wheel = new FerrisWheel(this, w);
    else if (w && slotsShown()) {
      const { x, y } = tileToWorld(w.tx, w.ty);
      this.shopSlots.push({ slot: w, x, y, kind: null, wheel: true });
      this.drawSlotSign(w, x, y, 'wheel_ring');
    }
    // aufgestellte Buden (frei an den Wegen, siehe shops.js); große (size 2) in der Mitte ihrer 2×2 Kacheln
    for (const slot of slotsIn(LEVEL_ID)) {
      const kind = builtOn(slot.id);
      const def = shopDef(kind);
      if (!def) continue;
      const n = def.size ?? 1;
      const { x, y } = tileToWorld(slot.tx + (n - 1) / 2, slot.ty + (n - 1) / 2);
      const depth = tileToWorld(slot.tx + n - 1, slot.ty + n - 1).y;
      this.shopSlots.push({ slot, x, y, kind });
      const stand = this.add.image(x, y, def.stand).setOrigin(0.5, def.originY ?? 100 / 128).setScale(def.scale ?? 0.7).setDepth(depth).setFlipX(!!slot.flip);
      if (def.seller) this.add.sprite(x + (slot.flip ? -8 : 8), y - 10, def.seller, 1).setOrigin(0.5, 112 / 116).setScale(0.5).setDepth(depth - 6).setFlipX(!!slot.flip);
      this.decorImages?.set(`${slot.tx},${slot.ty}`, stand); // (im Setzen-Modus leuchtet sie zum Aufheben auf)
    }
  }

  // E-Roller: steht in jedem Tierpark-Abschnitt an seinem Platz (scooterSpot); man steigt auf und fährt schneller durch den
  // Park, auch durch die Gehege. Im Haupthaus steigt man von selbst ab, der Roller bleibt davor stehen. Durch einen Ausgang (anderer
  // Abschnitt, Aquarium, Reptilienhaus) und beim Neuaufbau nach einem Ausbau fährt man weiter: game.scooterRiding merkt es
  // sich, zurück im Tierpark sitzt Henrik gleich wieder auf dem Roller (getOnScooter(true)). Mit dem Auto reist man zu Fuß.
  drawScooter() {
    this.driving = false;
    this.scooter = null;
    const spot = LEVEL.scooterSpot;
    if (!spot) return;
    const { x, y } = tileToWorld(spot.tx, spot.ty);
    const img = this.add.sprite(x, y, 'scooter_empty', 1).setOrigin(0.5, 164 / 170).setScale(0.5).setDepth(y);
    // Schatten wie beim Fahren (Player.js): schräg unter der Mitte des Rollers; Bild 1 = nach unten links
    const shadow = this.add.ellipse(x, y - 9, 46, 13, 0x14320a, 0.3).setAngle(-26.6).setDepth(y - 0.5);
    img.setInteractive({ useHandCursor: true }).on('pointerdown', () => this.nearScooter && this.getOnScooter());
    this.scooter = { x, y, img, shadow };
    this.scooterSafe = { x, y };
  }

  // resume: nach einem Gebietswechsel bzw. Neuaufbau weiterfahren (Henrik bleibt, wo er ankommt; ohne Hinweis)
  getOnScooter(resume = false) {
    if (!this.scooter || this.driving) return;
    this.driving = true;
    game.scooterRiding = true;
    this.nearScooter = false;
    this.scooter.img.setVisible(false);
    this.scooter.shadow.setVisible(false);
    if (!resume) {
      this.player.x = this.scooter.x;
      this.player.y = this.scooter.y;
    }
    this.player.setMount('scooter');
    this.scooterSafe = { x: this.player.x, y: this.player.y };
    if (resume) this.scooterHinted = true;
    if (!this.scooterHinted) {
      this.scooterHinted = true;
      this.showToast(tr('🛴 Mit dem E-Roller bist du im Park schneller unterwegs. Absteigen mit der Aktionstaste.', '🛴 The e-scooter gets you around the zoo faster. Press the action button to get off.'));
    }
    this.updateToolbar();
  }

  // absteigen: der Roller bleibt hier stehen (at: anderer Platz, z. B. vor der Tür, durch die man gerade gegangen ist)
  getOffScooter(at = null) {
    if (!this.driving) return;
    this.driving = false;
    game.scooterRiding = false;
    const p = at ?? { x: this.player.x, y: this.player.y };
    const face = this.player.faceY > 0 ? (this.player.faceX < 0 ? 1 : 0) : this.player.faceX > 0 ? 2 : 3;
    this.scooter.x = p.x;
    this.scooter.y = p.y;
    this.scooter.img.setPosition(p.x, p.y).setFrame(face).setDepth(p.y).setVisible(true);
    this.scooter.shadow.setPosition(p.x, p.y - 9).setAngle(face === 1 || face === 2 ? -26.6 : 26.6).setDepth(p.y - 0.5).setVisible(true);
    this.player.setMount(null);
    this.updateToolbar();
  }

  // jedes Bild: in der Nähe des Rollers die Aktionstaste zum Aufsteigen; beim Fahren in ein Gebäude von selbst ab (in Gehege darf man mit dem Roller)
  updateScooter() {
    if (!this.scooter) return;
    if (this.driving) {
      const { tx, ty } = worldToTile(this.player.x, this.player.y);
      if (buildingAt(tx, ty)) this.getOffScooter(this.scooterSafe); // (durch Ausgänge und in Gehege fährt man weiter)
      else this.scooterSafe = { x: this.player.x, y: this.player.y };
      return;
    }
    const near = !this.tool && Math.hypot(this.player.x - this.scooter.x, (this.player.y - this.scooter.y) * 2) < 46;
    if (near !== !!this.nearScooter) {
      this.nearScooter = near;
      this.updateToolbar();
    }
  }

  // leerer Bauplatz: Schild auf einem Pfosten (wie an den Gehegen) mit einer kleinen Bude und einem pulsierenden Plus,
  // damit man ihn bemerkt; antippen öffnet den Buden-Katalog (wenn man davorsteht)
  drawSlotSign(slot, x, y, iconKey = 'icecream_stand') {
    const front = y + 4;
    const sx = x - 14;
    const sy = y - 10;
    this.add.rectangle(sx, sy - 4, 3, 22, 0x8a5a30).setStrokeStyle(1, 0x3c2814).setDepth(front - 0.1);
    const board = this.add.image(sx, sy - 26, 'esign_board').setScale(0.5).setDepth(front);
    const icon = this.add.image(sx - 4, sy - 24, iconKey);
    icon.setScale(SIGN_ICON_H / icon.height * 1.15).setDepth(front + 0.1);
    const plus = this.add
      .text(sx + 14, sy - 32, '+', { fontFamily: 'Trebuchet MS, Arial', fontSize: '10px', fontStyle: 'bold', color: '#ffffff', backgroundColor: '#3fae4a', padding: { x: 2, y: -1 }, resolution: 4 })
      .setOrigin(0.5)
      .setDepth(front + 0.2);
    this.tweens.add({ targets: plus, scale: 1.2, duration: 650, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    board.setInteractive({ useHandCursor: true }).on('pointerdown', () => this.nearSlot?.slot === slot && this.openEventsPanel(null, slot.id));
  }

  // freie Bauplätze für diese Buden-Art (jede Art nur einmal je Abschnitt), die in diesem Abschnitt zuerst
  freeSlotsFor(kind) {
    return allSlots()
      .filter((s) => !builtOn(s.id) && !hasShop(s.level, kind))
      .sort((a, b) => (b.level === LEVEL_ID) - (a.level === LEVEL_ID));
  }

  // Buden-Katalog: am Bauplatz für diesen einen Platz (slotId), am Computer für den nächsten freien Platz
  shopOffers(slotId = null) {
    // Riesenrad: am eigenen Bauplatz nur das, am Computer zusätzlich zu den Buden
    const ws = wheelSlot();
    const wheel = ws && {
      id: WHEEL.id,
      name: WHEEL.name,
      icon: WHEEL.icon,
      cost: price(WHEEL.cost),
      text: tr(`Jede Fahrt bringt ${WHEEL.hearts} Herzen, und es kommen mehr Besucher.`, `Every ride brings ${WHEEL.hearts} hearts, and more visitors come.`),
      done: builtOn(ws.id) === WHEEL.id,
      blocked: game.hearts < price(WHEEL.cost) ? tr('zu wenig Herzen', 'not enough hearts') : null,
    };
    if (slotId && slotId === ws?.id) return [wheel];
    const target = slotId ? allSlots().find((s) => s.id === slotId) : null;
    const shops = SHOPS.map((def) => {
      const here = !!target && hasShop(target.level, def.id);
      const where = target ? (here ? [] : [target]) : this.freeSlotsFor(def.id);
      return {
        id: def.id,
        name: def.name,
        icon: def.icon,
        cost: price(def.cost),
        text: tr(`Jeder Verkauf bringt ${def.hearts} Herzen.`, `Every sale brings ${def.hearts} hearts.`),
        blocked: here
          ? tr('steht hier schon', 'already in this area')
          : !where.length
            ? tr('kein freier Bauplatz', 'no free building plot')
            : game.hearts < price(def.cost)
              ? tr('zu wenig Herzen', 'not enough hearts')
              : null,
      };
    });
    return slotId || !wheel ? shops : [...shops, wheel];
  }

  // Bude bauen: Herzen abziehen, merken und (im selben Abschnitt) den Park neu aufbauen; gleich kauft jemand dort ein
  buildShop(kind, slotId = null) {
    const def = kind === WHEEL.id ? WHEEL : shopDef(kind);
    const slot = kind === WHEEL.id ? wheelSlot() : slotId ? allSlots().find((s) => s.id === slotId) : this.freeSlotsFor(kind)[0];
    if (!def || !slot || builtOn(slot.id) || (kind !== WHEEL.id && hasShop(slot.level, kind)) || game.hearts < price(def.cost)) return;
    game.hearts -= price(def.cost);
    game.builds[slot.id] = kind;
    if (slot.level !== LEVEL_ID) {
      this.updateHud();
      this.mavi?.check();
      this.saveGame();
      this.showToast(tr(`${def.icon} ${def.name} wird gebaut! Du findest die Bude im Tierpark-Bereich „${LEVELS[slot.level].part.name}“.`, `${def.icon} ${def.name} is being built! You'll find it in the zoo area “${LEVELS[slot.level].part.name}”.`));
      return;
    }
    this.saveLevelState();
    const arrive = worldToTile(this.player.x, this.player.y);
    this.leaving = true; // bis zum Neuaufbau steht alles (sonst hakt Mavi die Aufgabe ab, und ihr Satz geht verloren)
    this.cameras.main.fadeOut(250);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      showLoading(tr(`${def.name} wird gebaut …`, `Building the ${def.name} …`));
      afterPaint(() => this.scene.restart({ level: LEVEL_ID, arrive, built: slot.id }));
    });
  }

  // Start und Ende der Events (auch wenn man zwischendurch woanders war) und die Restzeit oben
  // Eisstand-Event: Eiswagen mit Eisverkäuferin mitten im Park, solange es läuft
  updateIceStand() {
    const on = LEVEL_ID === 'park' && !!LEVEL.iceStand && isActive('icecream');
    if (on && !this.iceStand) {
      const { x, y } = tileToWorld(LEVEL.iceStand.tx, LEVEL.iceStand.ty);
      const cart = this.add.image(x, y, 'icecream_stand').setOrigin(0.5, 100 / 128).setScale(0.7).setDepth(y);
      const seller = this.add.sprite(x + 8, y - 10, 'icecream_seller', 1).setOrigin(0.5, 112 / 116).setScale(0.5).setDepth(y - 6);
      this.iceStand = [cart, seller];
      for (const o of this.iceStand) {
        o.setAlpha(0);
        this.tweens.add({ targets: o, alpha: 1, duration: 600 });
      }
    }
    if (!on && this.iceStand) {
      const parts = this.iceStand;
      this.iceStand = null;
      this.tweens.add({ targets: parts, alpha: 0, duration: 600, onComplete: () => parts.forEach((o) => o.destroy()) });
    }
  }

  updateEvents() {
    this.updatePenSigns();
    this.updateIceStand();
    if (this.riding && !this.rideOn()) this.showToast(tr('Das Reittier ist zurück im Stall.', 'Your mount is back in the stable.'));
    this.updateMount();
    const on = isActive('babies');
    if (BABY_LEVELS.includes(LEVEL_ID) && on && !this.babiesOn) this.spawnBabies(false);
    if (BABY_LEVELS.includes(LEVEL_ID) && !on && this.babiesOn) {
      this.removeBabies();
      this.visitors?.updateScore();
      this.showToast(tr('Das Tierbaby-Event ist vorbei – die Kleinen schlafen jetzt.', 'The animal baby event is over – the little ones are asleep now.'));
    }
    this.updateEventBanner();
  }

  // Gehege, an dessen Schild man gerade steht (nur im Tierpark, nur Gehege mit Plätzen)
  // ... oder in dem man gerade drin steht
  penAtSign() {
    if (!isPark(LEVEL_ID)) return null;
    const { tx, ty } = worldToTile(this.player.x, this.player.y);
    const e = this.shownSign?.enclosure ?? enclosureAt(tx, ty);
    return e && hasSlots(e) && !e.free ? e : null;
  }

  // Erfolg: ein Gehege ist voll – kleine Meldung mit Tierbild und Stern
  showPenFull(e) {
    const box = document.getElementById('success');
    box.innerHTML = e.free
      ? `<div class="success-star">⭐</div><div>${animalIcons(e.species ?? [], 3.4)}</div>${tr(
          `<b>Alle ${penCapacity(e)} ${e.name} sind da!</b><small>Sie laufen frei durch den Park – die Besucher sind begeistert.</small>`,
          `<b>All ${penCapacity(e)} ${e.name} are here!</b><small>They roam freely through the zoo – the visitors are thrilled.</small>`,
        )}`
      : `<div class="success-star">⭐</div><div>${animalIcons(e.species ?? [], 3.4)}</div>${tr(
          `<b>${e.name} ist voll!</b><small>Alle ${penCapacity(e)} Plätze belegt – die Besucher sind begeistert.</small>`,
          `<b>${e.name} is full!</b><small>All ${penCapacity(e)} spaces taken – the visitors are thrilled.</small>`,
        )}`;
    box.classList.remove('show');
    void box.offsetWidth; // Animation neu starten
    box.classList.add('show');
  }

  // Plätze für n Schilder eines gemeinsamen Geheges (je Tierart eins): am Zaun neben dem Tor alle 2 Kacheln eins, erst vom
  // Tor weg (wie das eine Schild sonst), dann auf der anderen Seite des Tors. Reicht der Zaun dafür nicht (Ecke) oder
  // steht das Schild auf einem eigenen Platz (signAt: Pfosten, Scheibe), hängen sie dort nebeneinander.
  // Gibt [{ at: Kachel, shift: seitlicher Versatz in Pixeln, fence: hängt am Zaun }] zurück
  signSpots(e, n) {
    const row = () => Array.from({ length: n }, (_, i) => ({ at: e.sign, shift: (i - (n - 1) / 2) * 50, fence: undefined }));
    const d = e.signSide === 'right' ? 1 : -1;
    const g0 = d > 0 ? e.gates.at(-1) : e.gates[0]; // das Tor, neben dem das Schild sonst hängt (siehe map.js)
    if (e.signAt || !g0 || buildingAt(g0.tx, g0.ty)) return row();
    const axis = g0.vertical ? 'y' : 'x';
    const along = (t, k) => (axis === 'y' ? { tx: t.tx, ty: t.ty + k } : { tx: t.tx + k, ty: t.ty });
    const fenceHere = (t) => fenceAxisAt(t.tx, t.ty) === axis && !isGate(t.tx, t.ty);
    // vom Startplatz in Richtung dir: Plätze, solange der Zaun durchgeht
    const side = (start, dir) => {
      const out = [];
      for (let k = 0; out.length < n; k++) {
        const t = along(start, dir * 2 * k);
        if (!fenceHere(t) || (k > 0 && !fenceHere(along(start, dir * (2 * k - 1))))) break;
        out.push(t);
      }
      return out;
    };
    let end = g0; // anderes Ende des Tors (Doppeltor)
    while (isGate(along(end, -d).tx, along(end, -d).ty)) end = along(end, -d);
    const spots = [...side(e.sign, d), ...side(along(end, -d), -d)].slice(0, n);
    return spots.length < n ? row() : spots.map((at) => ({ at, shift: 0, fence: true }));
  }

  // Platz-Zähler an den Gehegeschildern
  updatePenSigns() {
    if (!this.animals) return; // beim Aufbau sind die Tiere noch nicht da (danach jede halbe Sekunde)
    for (const sign of this.enclosureSigns ?? []) {
      const quotas = penQuotas(sign.enclosure);
      for (const c of sign.counts) {
        const cap = quotas.find((q) => q.key === c.key)?.cap ?? 0;
        const n = penCount(this.animals, sign.enclosure, c.key);
        const full = n >= cap;
        const text = `${n} / ${cap}${full ? ' ⭐' : ''}`;
        if (c.text.text === text) continue;
        c.text.setText(text).setColor(full ? '#ffd966' : '#fff8e6');
        if (sign === this.shownSign) this.showSignPanel(sign); // Tafel offen: Liste der Tiere auffrischen
      }
    }
  }

  updateEventBanner() {
    const icons = EVENT_ICONS;
    const lines = EVENTS.map((ev) => ({ ev, s: eventState(ev.id) }))
      .filter(({ s }) => s.state === 'active')
      .map(({ ev, s }) => `${icons[ev.id] ?? '★'} ${ev.name} · ${tr(`noch ${formatTime(s.left)}`, `${formatTime(s.left)} left`)}`);
    // in der Savanne und im Dschungel: das Wetter mit seiner Restzeit und was danach kommt
    if (SEASON_LEVELS.includes(LEVEL_ID)) {
      const s = seasonState(LEVEL_ID);
      if (s.id === LEVEL.season) lines.unshift(`${SEASON_INFO[s.id].icon} ${SEASON_INFO[s.id].name} · ${tr(`noch ${formatTime(s.left)}`, `${formatTime(s.left)} left`)} → ${SEASON_INFO[s.next].icon}`);
    }
    // Eiswelt bei Nacht: wie warm Henrik noch ist
    if (LEVEL.cold) {
      const cold = game.cold ?? 0;
      // Balken: voll und orange, wenn er warm ist, kürzer und hellblau, je kälter es wird
      const k = 1 - cold;
      const bar = `<span style="display:inline-block;width:5em;height:0.6em;border-radius:0.3em;background:rgba(255,255,255,0.3);vertical-align:middle;overflow:hidden"><span style="display:block;height:100%;width:${Math.round(k * 100)}%;background:${k > 0.25 ? '#ffb347' : '#a8dcff'}"></span></span>`;
      lines.splice(1, 0, cold >= 1
        ? tr('🥶 Zu kalt zum Fangen – wärm dich in der Station auf!', '🥶 Too cold to catch animals – warm up at the station!')
        : `🌡️ ${tr('Wärme', 'Warmth')} ${bar}`);
    }
    lines.push(...(this.luck?.bannerLines() ?? [])); // Boni aus einer Kiste (nur in diesem Gebiet)
    this.eventBanner.classList.toggle('show', lines.length > 0);
    if (lines.length) this.eventBanner.innerHTML = lines.join('<br>');
    this.layoutHudStack(); // direkt unter den Zähler oben links (auf dem Tablet ist er größer und kann umbrechen)
  }

  // Bewunderungsherzen der Besucher aufs Konto; der Zähler oben hüpft kurz
  // source: Tierart (oder 'icecream') für die Statistik in der Übersicht; ohne Quelle (Cheat) zählt es dort nicht
  addHearts(n, source = null) {
    game.hearts += n;
    if (source) game.heartsBy[source] = (game.heartsBy[source] ?? 0) + n;
    this.updateHud();
    const el = this.hud?.querySelector('.hearts');
    if (el) {
      el.classList.remove('pulse');
      void el.offsetWidth; // Animation neu starten
      el.classList.add('pulse');
    }
  }

  // Tierbuch (Taste I oder der Knopf oben links): Reiter für die Tiere, das Fangen, die Starter-Aufgaben und die Statistik
  showJournal() {
    if (isJournalOpen() || this.leaving) return;
    // was seit dem letzten Öffnen neu ist, leuchtet auf (und der Reiter dazu ist markiert und wird gleich aufgeschlagen)
    this.bookFresh = new Set(game.bookNew);
    game.bookNew = [];
    this.updateBookButton();
    const fresh = [...this.bookFresh];
    const newAnimals = fresh.some((k) => !k.startsWith('quest:'));
    const newQuests = fresh.some((k) => k.startsWith('quest:'));
    const dot = (on) => (on ? '<span class="tab-new"></span>' : '');
    const tabs = [
      { id: 'animals', label: `${tr('Tiere', 'Animals')}${dot(newAnimals)}`, html: () => this.bookAnimals() },
      { id: 'catch', label: tr('Fangen', 'Catching'), html: () => this.bookCatching() },
      { id: 'quests', label: `${tr('Aufgaben', 'Tasks')}${dot(newQuests)}`, html: () => this.bookQuests() },
      { id: 'stats', label: tr('Statistik', 'Stats'), html: () => this.bookStats() },
    ];
    const start = newAnimals ? 'animals' : newQuests ? 'quests' : lastBookTab;
    this.scene.pause();
    openBook(tabs, start, () => this.scene.resume(), (id) => (lastBookTab = id));
  }

  // Reiter "Tiere": alle Arten mit Anzahl zuhause, Lebensraum, Werkzeug und Tipp; Filter je Welt; noch nie gefangene als
  // Schatten, und den Fang-Tipp gibt es erst, wenn man dem Tier draußen begegnet ist (sonst wird es zu viel Text)
  bookAnimals() {
    const home = this.homeCounts();
    const toolImg = (t) => `<img class="tool-img" src="assets/${CATCH_TOOLS[t][0]}.png" alt="">`;
    const cards = SPECIES_ORDER.map((s) => {
      const [name] = ANIMAL_INFO[s] ?? [s];
      const worlds = worldsOf(s);
      const places = worlds.map((w) => `${LEVELS[w.level].name}${w.extra ? ` (${w.extra.icon} ${w.extra.name})` : ''}`);
      const tools = SPECIES[s].catchWith.map((t) => `<span class="catch">${toolImg(t)}${CATCH_TOOLS[t][1]}</span>`).join('');
      const n = home[s] ?? 0;
      const known = caughtBefore(s);
      const seen = known || game.seenSpecies.includes(s);
      // neu seit dem letzten Öffnen: leuchtet und steht vorne
      const fresh = this.bookFresh.has(`caught:${s}`) ? tr('Neu gefangen!', 'Newly caught!') : this.bookFresh.has(`seen:${s}`) ? tr('Neuer Tipp!', 'New tip!') : '';
      return { fresh, html: `<div class="card${n ? ' has' : ''}${known ? '' : ' unknown'}${fresh ? ' new' : ''}" data-worlds="${worlds.map((w) => w.level).join(' ')}">
        ${fresh ? `<span class="new-badge">${fresh}</span>` : ''}
        <div class="head">${animalIcon(s, 3.2)}<div><b>${name}</b><span class="home">${known ? `${tr('Zuhause', 'At home')}: <span class="num">${n}${penCapFor(s) ? ` / ${penCapFor(s)}` : ''}</span>` : tr('noch nicht gefangen', 'not caught yet')}</span></div></div>
        ${this.bookFriends(s)}
        <div class="where">${places.join(', ')}</div>
        <div class="tools">${tools}</div>
        <div class="tip">${seen ? CATCH_TIPS[s] ?? '' : `<span class="tip-locked">${tr('Begegne dem Tier draußen – dann steht hier, wie du es fängst.', 'Meet this animal in the wild – then you will find out here how to catch it.')}</span>`}</div>
      </div>` };
    });
    const total = Object.values(home).reduce((s, x) => s + x, 0);
    const found = SPECIES_ORDER.filter(caughtBefore).length;
    const chips = ['all', ...WILD_WORLDS].map((w) => `<button class="book-chip" data-filter="${w}">${w === 'all' ? tr('Alle', 'All') : LEVELS[w].name}</button>`).join('');
    return `<h2>${tr(`<span class="num">${found}</span> von ${SPECIES_ORDER.length} Arten gefangen · <span class="num">${total}</span> Tiere zuhause`, `<span class="num">${found}</span> of ${SPECIES_ORDER.length} species caught · <span class="num">${total}</span> animals at home`)}</h2>
      <div class="book-chips">${chips}</div>
      <div class="cards">${[...cards.filter((c) => c.fresh), ...cards.filter((c) => !c.fresh)].map((c) => c.html).join('')}</div>`;
  }

  // Tierbuch: Tierfreunde dieser Art auf der höchsten Stufe (goldenes Namensschild), mit dem Tag, seit dem sie Freunde sind
  bookFriends(species) {
    const best = Object.values(game.bonds ?? {}).filter((b) => b.species === species && b.name && friendLevel(b.points) >= FRIEND_LEVELS.length);
    if (!best.length) return '';
    const day = (t) => new Date(t).toLocaleDateString(locale, { day: 'numeric', month: 'long' });
    const likes = (b) => (b.favoriteKnown && FEED_SORTS[b.favorite] ? tr(`, mag ${FEED_SORTS[b.favorite].name}`, `, loves ${FEED_SORTS[b.favorite].name.toLowerCase()}`) : '');
    return `<div class="book-friends">${best.map((b) => tr(`♥ <b>${b.name}</b>, seit ${day(b.since)} bei dir${likes(b)}`, `♥ <b>${b.name}</b>, with you since ${day(b.since)}${likes(b)}`)).join('<br>')}</div>`;
  }

  // Reiter "Fangen": die Fangarten kurz erklärt, seltene Varianten und welches Werkzeug welche Tiere fängt
  bookCatching() {
    const img = (key) => `<img class="tool-img" src="assets/${key}.png" alt="">`;
    const ways = [
      [img('hand'), tr('<b>Berühren:</b> Manche Tiere wie Schafe und Katzen laufen dir einfach hinterher, wenn du sie berührst.', '<b>Touch:</b> Some animals like sheep and cats simply follow you when you touch them.')],
      [img('net'), tr('<b>Kescher:</b> für kleine und flinke Tiere – geh nah heran und schwing ihn.', '<b>Net:</b> for small and quick animals – get close and swing it.')],
      [img('lasso'), tr('<b>Lasso:</b> für scheue und große Tiere – wirf es aus der Ferne, sonst rennen sie weg.', '<b>Lasso:</b> for shy and big animals – throw it from a distance, or they run away.')],
      [img('trap'), tr('<b>Falle:</b> im Wald auslegen und weggehen – irgendwann geht ein Tier hinein.', '<b>Trap:</b> set it in the forest and walk away – sooner or later an animal walks in.')],
      [img('banana'), tr('<b>Locken:</b> Grünfutter, Bananen, Knochen, ein Ball … locken besondere Tiere an.', '<b>Lure:</b> leafy greens, bananas, bones, a ball … lure special animals.')],
      ['<span class="way-icon">🌦️</span>', tr('<b>Wetter:</b> In der Savanne und im Dschungel wechselt das Wetter, in der Eiswelt Tag und Nacht – manche Tiere kommen nur bei Regen, Nebel oder Trockenzeit.', '<b>Weather:</b> In the savanna and the jungle the weather changes, in the ice world day and night – some animals only appear in rain, fog or the dry season.')],
      ['<span class="way-icon">🎉</span>', tr('<b>Events:</b> Am Computer im Haupthaus startest du mit Herzen Events. Manche bringen ganz neue Tiere: Flamingos, Wölfe, Gnus, Quallen, rote Pandas.', '<b>Events:</b> Start events with hearts at the computer in the main building. Some bring brand-new animals: flamingos, wolves, wildebeest, jellyfish, red pandas.')],
      ['<span class="way-icon">✨</span>', tr('<b>Selten:</b> Viele Tiere gibt es ab und zu in einer seltenen Variante – etwa einen Hirsch statt eines Rehs. Sie locken besonders viele Besucher an. Mit dem Event „Seltene Tiere“ triffst du sie viel öfter.', '<b>Rare:</b> Many animals now and then come in a rare variant – like a stag instead of a deer. They attract lots of visitors. With the “Rare Animals” event you meet them much more often.')],
      ['<span class="way-icon">🎁</span>', tr('<b>Schatzkisten:</b> In jeder Welt steht eine Kiste. Hast du sie geöffnet, kommt nach ein paar Minuten eine neue. Darin wählst du 1 von 3 Karten: ein seltenes Tier, einen Bonus für 5 Minuten oder einen Glücksbringer. Für Herzen darfst du neu würfeln.', '<b>Treasure chests:</b> Every world has a chest. Once you open it, a new one comes after a few minutes. Inside you pick 1 of 3 cards: a rare animal, a 5-minute bonus or a lucky charm. You can reroll for hearts.')],
      ['<span class="way-icon">🍀</span>', tr('<b>Glücksbringer:</b> Du kannst 2 gleichzeitig tragen (Knopf „Glücksbringer“ oben rechts oder Taste G). Wechseln geht nur im Tierpark.', '<b>Lucky charms:</b> You can wear 2 at a time (“Lucky Charms” button at the top right or key G). You can only switch them in the zoo.')],
    ];
    const icons = (list) => list.map((s) => `<span class="chest-animal${caughtBefore(s) ? '' : ' unknown'}">${animalIconSquare(s, 2.2)}</span>`).join('');
    const toolRows = [null, ...Object.keys(TOOLS).filter((id) => id !== 'parkfood' && id !== 'glowjar' && id !== 'stick' && id !== 'salt' && !isTreat(id))].map((id) => {
      const list = toolAnimals(id).filter((s) => SPECIES_ORDER.includes(s));
      if (!list.length) return '';
      return `<div class="tool-row">${img(id ? TOOLS[id].image ?? id : 'hand')}<b>${id ? TOOLS[id].name : tr('Hände frei', 'Empty hands')}</b><span class="tool-animals">${icons(list)}</span></div>`;
    });
    return `<h2>${tr('So fängst du Tiere', 'How to catch animals')}</h2>
      <div class="ways">${ways.map(([icon, text]) => `<div class="way">${icon}<span>${text}</span></div>`).join('')}</div>
      <h3>${tr('Womit fängst du was?', 'What catches what?')}</h3>
      <p class="book-note">${tr('Die Werkzeuge liegen im Regal der Hütte jeder Welt. Dort siehst du auch, welche Tiere es in dieser Welt gibt.', 'The tools are on the shelf in the hut of every world. There you can also see which animals live in that world.')}</p>
      <div class="tool-list">${toolRows.join('')}</div>`;
  }

  // Reiter "Aufgaben": alle Starter-Aufgaben mit Häkchen und Belohnung
  bookQuests() {
    const at = game.story.step;
    const rows = STEPS.slice(0, at + 1).map((q, i) => {
      const done = i < at;
      return `<div class="quest-row${done ? ' done' : ''}${this.bookFresh.has(`quest:${q.id}`) ? ' new' : ''}"><span class="quest-check">${done ? '✅' : '⬜'}</span><span>${q.goal}</span>${q.reward ? `<span class="quest-reward"><span class="heart">♥</span> ${q.reward}</span>` : ''}</div>`;
    });
    const later = STEPS.length - at - 1;
    if (later > 0) rows.push(`<div class="quest-row"><span class="quest-check">⬜</span><span>${tr(`… und noch ${later} weitere – Mavi verrät sie nach und nach`, `… and ${later} more – Mavi will reveal them one by one`)}</span></div>`);
    const wishes = openWishes().map((w) => {
      const name = wishName(w.species, w.skin, (ANIMAL_INFO[w.species] ?? [w.species])[0]);
      const pen = this.wishPenName(w.species);
      const text = w.done ? tr(`${name}: erfüllt! Schau am Gehege vorbei: ${pen}`, `${name}: done! Visit the enclosure: ${pen}`) : `${name} · ${worldsOf(w.species).filter((x) => isUnlocked(x.level)).map((x) => LEVELS[x.level].name).join(', ')}`;
      return `<div class="quest-row${w.done ? ' done' : ''}"><span class="quest-check">${wishIcon(w.species, w.skin, 1.6)}</span><span>${text}</span><span class="quest-reward"><span class="heart">♥</span> ${wishHearts(w)}</span></div>`;
    });
    const wishHtml = wishes.length ? `<h2>${tr('Besucherwünsche', 'Visitors’ wishes')}</h2><div class="quest-list">${wishes.join('')}</div>` : '';
    return `${wishHtml}<h2>${tr(`Mavis Aufgaben · ${Math.min(at, STEPS.length)} / ${STEPS.length}`, `Mavi’s tasks · ${Math.min(at, STEPS.length)} / ${STEPS.length}`)}</h2>
      <div class="quest-list">${rows.join('')}</div>`;
  }


  // Reiter "Statistik": Herzen je Tierart (und vom Eisstand), die meisten zuerst
  bookStats() {
    const hearts = Object.entries(game.heartsBy).filter(([, n]) => n > 0).sort((u, v) => v[1] - u[1]);
    const top = hearts[0]?.[1] ?? 1;
    const heartRows = hearts.map(([s, n]) => {
      const shop = sourceDef(s);
      const icon = shop ? `<span class="hs-ice">${shop.icon}</span>` : animalIcon(s, 2.2);
      const name = shop ? shop.name : (ANIMAL_INFO[s] ?? [s])[0];
      return `<div class="hs-row">${icon}<b>${name}</b><span class="hs-bar"><span style="width:${Math.max(3, (100 * n) / top)}%"></span></span><span class="hs-num"><span class="heart">♥</span> ${n}</span></div>`;
    });
    const heartSum = hearts.reduce((s, [, n]) => s + n, 0);
    return hearts.length
      ? `<h2>${tr('Herzen von den Besuchern', 'Hearts from visitors')} · <span class="heart">♥</span> ${heartSum}</h2><div class="hs-list">${heartRows.join('')}</div>`
      : `<h2>${tr('Herzen von den Besuchern', 'Hearts from visitors')}</h2><p class="hs-empty">${tr('Noch keine – bring Tiere in den Tierpark, dann kommen Besucher.', 'None yet – bring animals to your zoo and visitors will come.')}</p>`;
  }

  // Steuerung (aus dem Menü)
  showControls() {
    if (isJournalOpen() || this.leaving) return;
    this.scene.pause();
    openJournal(`<div class="journal-box intro-box">${CONTROLS}<p class="close-hint">${tr('Beliebige Taste oder Tippen zum Schließen', 'Press any key or tap to close')}</p></div>`, () => this.scene.resume());
  }

  updateToolbar() {
    // Setzen-Modus: kann man vor Henrik etwas setzen oder aufheben, zeigt die Leiste das (auch am Auto, siehe useTool)
    const build = this.decor?.on && ['place', 'pick'].includes(this.decor.state?.kind) ? this.decor.toolbar() : null;
    if (build) {
      setTouchTool(null, build.image);
      this.toolbar.innerHTML = `<div class="tool"><img src="${build.image}" alt=""><span><b>${ACTION_KEY}</b><b>Enter</b>${build.label}</span></div>`;
      return;
    }
    if (this.nearBoat) {
      const label = this.nearBoat === 'board' ? tr('Ins Kanu steigen', 'Get into the canoe') : tr('Aussteigen', 'Get out');
      setTouchTool(null, 'assets/canoe_icon.png');
      this.toolbar.innerHTML = `<div class="tool"><img src="assets/canoe_icon.png" alt=""><span><b>${ACTION_KEY}</b><b>Enter</b>${label}</span></div>`;
      return;
    }
    if (this.thicket?.target.size) {
      setTouchTool(null, 'assets/machete.png');
      this.toolbar.innerHTML = `<div class="tool"><img src="assets/machete.png" alt=""><span><b>${ACTION_KEY}</b><b>Enter</b>${tr('Dickicht wegschlagen', 'Cut the thicket')}</span></div>`;
      return;
    }
    if (this.nearFeeder && this.toolId !== 'parkfood') {
      setTouchTool(null, 'assets/feeder.png');
      this.toolbar.innerHTML = `<div class="tool"><img src="assets/feeder.png" alt=""><span><b>${ACTION_KEY}</b><b>Enter</b>${tr('Futterhaus', 'Food house')}</span></div>`;
      return;
    }
    if (this.nearScooter && !this.driving) {
      setTouchTool(null, 'assets/scooter_icon.png');
      this.toolbar.innerHTML = `<div class="tool"><img src="assets/scooter_icon.png" alt=""><span><b>${ACTION_KEY}</b><b>Enter</b>${this.driving ? tr('Absteigen', 'Get off') : tr('Aufsteigen', 'Get on')}</span></div>`;
      return;
    }
    if (this.nearSlot && !this.tool) {
      setTouchTool(null, 'assets/icecream.png');
      const label = this.nearSlot.wheel ? tr('Riesenrad bauen', 'Build the Ferris wheel') : tr('Bude bauen', 'Build a stand');
      this.toolbar.innerHTML = `<div class="tool"><img src="assets/icecream.png" alt=""><span><b>${ACTION_KEY}</b><b>Enter</b>${label}</span></div>`;
      return;
    }
    if (this.nearWish) {
      const img = this.visitorPortrait(this.nearWish.look);
      setTouchTool(null, img);
      this.toolbar.innerHTML = `<div class="tool"><img src="${img}" alt=""><span><b>${ACTION_KEY}</b><b>Enter</b>${tr('Ansprechen', 'Talk')}</span></div>`;
      return;
    }
    if (this.nearNeed) {
      const feed = this.needs.get(this.nearNeed)?.kind === 'feed';
      const img = feed && isTreat(this.toolId) ? `assets/${TOOLS[this.toolId].image}.png` : feed ? 'assets/feeder.png' : 'assets/hand.png';
      setTouchTool(null, img);
      const kind = ANIMAL_INFO[this.nearNeed.species]?.[0] ?? '';
      this.toolbar.innerHTML = `<div class="tool"><img src="${img}" alt=""><span><b>${ACTION_KEY}</b><b>Enter</b>${feed ? tr(`${kind} füttern`, `Feed the ${kind.toLowerCase()}`) : tr(`${kind} streicheln`, `Pet the ${kind.toLowerCase()}`)}</span></div>`;
      return;
    }
    if (this.nearFriend) {
      setTouchTool(null, 'assets/hand.png');
      const who = bondOf(this.nearFriend).name;
      const feed = isTreat(this.toolId);
      const img = feed ? `assets/${TOOLS[this.toolId].image}.png` : 'assets/hand.png';
      if (feed) setTouchTool(null, img);
      this.toolbar.innerHTML = `<div class="tool"><img src="${img}" alt=""><span><b>${ACTION_KEY}</b><b>Enter</b>${feed ? tr(`${who} füttern`, `Feed ${who}`) : tr(`${who} streicheln`, `Pet ${who}`)}</span></div>`;
      return;
    }
    if (this.shownSign && this.toolId !== 'parkfood') {
      setTouchTool(null, 'assets/esign_board.png');
      this.toolbar.innerHTML = `<div class="tool"><img src="assets/esign_board.png" alt=""><span><b>${ACTION_KEY}</b><b>Enter</b>${tr('Tiere ansehen', 'See the animals')}</span></div>`;
      return;
    }
    const pen = PEN_UPGRADES && !this.tool && this.penAtSign();
    if (pen) {
      const done = isUpgraded(pen);
      setTouchTool(null, 'assets/esign_board.png');
      this.toolbar.innerHTML = `<div class="tool"><img src="assets/esign_board.png" alt=""><span><b>${ACTION_KEY}</b><b>Enter</b>${done ? tr('Gehege ansehen', 'View enclosure') : tr('Gehege ausbauen', 'Upgrade enclosure')}</span></div>`;
      return;
    }
    if (this.nearComputer) {
      setTouchTool(null, 'assets/office_desk.png');
      this.toolbar.innerHTML = `<div class="tool"><img src="assets/office_desk.png" alt=""><span><b>${ACTION_KEY}</b><b>Enter</b>${tr('Computer benutzen', 'Use computer')}</span></div>`;
      return;
    }
    if (this.luck?.nearChest) {
      const img = this.luck.chestImage();
      setTouchTool(null, img);
      this.toolbar.innerHTML = `<div class="tool"><img src="${img}" alt=""><span><b>${ACTION_KEY}</b><b>Enter</b>${tr('Schatzkiste öffnen', 'Open treasure chest')}</span></div>`;
      return;
    }
    if (this.nearChest) {
      // in der Hütte das Werkzeug-Regal, sonst (z. B. auf der Teichinsel) eine kleine Kiste
      const house = buildingAt(this.nearChest.tx, this.nearChest.ty, 1); // Regal in oder an der Hütte
      const own = objectAt(this.nearChest.tx, this.nearChest.ty); // eigenes Bild und eigener Name (z. B. der Sack am Anker im Riff)
      const key = own?.chestName ? own.key : house ? `hut_shelf_${house.style}` : 'hut_chest_small';
      const img = `assets/${HD.includes(key) ? `${HD_DIR}/` : ''}${key}.png`; // große Fassung, falls es eine gibt (das kleine Bild ist teils noch das alte)
      setTouchTool(null, img);
      this.toolbar.innerHTML = `<div class="tool"><img src="${img}" alt=""><span><b>${ACTION_KEY}</b><b>Enter</b>${tr(`${own?.chestName ?? (house ? 'Regal' : 'Kiste')} öffnen`, `Open ${own?.chestName ?? (house ? 'shelf' : 'chest')}`)}</span></div>`;
      return;
    }
    if (this.onStand || this.nearStand) {
      const img = `assets/${HD_DIR}/forest_stand.png`;
      setTouchTool(null, img);
      this.toolbar.innerHTML = `<div class="tool"><img src="${img}" alt=""><span><b>${ACTION_KEY}</b><b>Enter</b>${this.onStand ? tr('Herunterklettern', 'Climb down') : tr('Auf den Hochstand', 'Climb the hide')}</span></div>`;
      return;
    }
    if (this.nearBed) {
      const img = `assets/${HD_DIR}/hut_bed_${buildingAt(this.nearBed.tx, this.nearBed.ty, 1)?.style ?? LEVEL_ID}.png`;
      setTouchTool(null, img);
      this.toolbar.innerHTML = `<div class="tool"><img src="${img}" alt=""><span><b>${ACTION_KEY}</b><b>Enter</b>${tr('Ausruhen', 'Rest')} 💤</span></div>`;
      return;
    }
    if (this.nearTurtle && this.toolId === 'scissors') {
      setTouchTool('scissors');
      this.toolbar.innerHTML = `<div class="tool"><img src="assets/scissors.png" alt=""><span><b>${ACTION_KEY}</b><b>Enter</b>${tr('Netz aufschneiden', 'Cut the net')} ✂️ ${this.nearTurtle.cuts} / ${CUTS_NEEDED}</span></div>`;
      return;
    }
    if (this.nearDam && this.toolId === 'stick') {
      setTouchTool(null, 'assets/forest_stick.png');
      this.toolbar.innerHTML = `<div class="tool"><img src="assets/forest_stick.png" alt=""><span><b>${ACTION_KEY}</b><b>Enter</b>${tr('Stock ins Loch stecken', 'Put the stick into the hole')}</span></div>`;
      return;
    }
    if (this.nearBush && this.toolId !== 'leaves') {
      setTouchTool(null, 'assets/leaf_branch.png');
      this.toolbar.innerHTML = `<div class="tool"><img src="assets/leaf_branch.png" alt=""><span><b>${ACTION_KEY}</b><b>Enter</b>${tr('Zweig abbrechen', 'Break off a branch')}</span></div>`;
      return;
    }
    if (this.nearCairn && this.toolId === 'salt') {
      setTouchTool(null, 'assets/salttool.png');
      this.toolbar.innerHTML = `<div class="tool"><img src="assets/salttool.png" alt=""><span><b>${ACTION_KEY}</b><b>Enter</b>${tr('Salzstein auf den Steinhaufen legen', 'Put the salt lick on the cairn')}</span></div>`;
      return;
    }
    if (this.nearLicker && this.toolId === 'brush') {
      setTouchTool('brush');
      this.toolbar.innerHTML = `<div class="tool"><img src="assets/brush.png" alt=""><span><b>${ACTION_KEY}</b><b>Enter</b>${tr('Yak bürsten', 'Brush the yak')} ${this.nearLicker.brushed} / ${BRUSHES_NEEDED}</span></div>`;
      return;
    }
    if (this.nearSalt && this.toolId !== 'salt' && this.toolId !== 'brush') {
      setTouchTool(null, 'assets/salttool.png');
      this.toolbar.innerHTML = `<div class="tool"><img src="assets/salttool.png" alt=""><span><b>${ACTION_KEY}</b><b>Enter</b>${tr('Salzstein aufheben', 'Pick up the salt lick')}</span></div>`;
      return;
    }
    if (this.nearOak) {
      setTouchTool(null, 'assets/acorns.png');
      this.toolbar.innerHTML = `<div class="tool"><img src="assets/acorns.png" alt=""><span><b>${ACTION_KEY}</b><b>Enter</b>${tr('Eicheln schütteln', 'Shake down acorns')}</span></div>`;
      return;
    }
    if (this.nearLantern) {
      setTouchTool(null, 'assets/lantern.png');
      this.toolbar.innerHTML = `<div class="tool"><img src="assets/lantern.png" alt=""><span><b>${ACTION_KEY}</b><b>Enter</b>${tr('Laterne aufheben', 'Pick up the lantern')}</span></div>`;
      return;
    }
    if (this.nearStick && this.toolId !== 'stick') {
      setTouchTool(null, 'assets/forest_stick.png');
      this.toolbar.innerHTML = `<div class="tool"><img src="assets/forest_stick.png" alt=""><span><b>${ACTION_KEY}</b><b>Enter</b>${tr('Stock aufheben', 'Pick up the stick')}</span></div>`;
      return;
    }
    if (this.nearOrangutan && !this.tool) {
      setTouchTool(null, 'assets/orangutan_tree.png');
      this.toolbar.innerHTML = `<div class="tool"><img src="assets/orangutan_tree.png" alt=""><span><b>${ACTION_KEY}</b><b>Enter</b>${tr('Zurückwinken', 'Wave back')} 👋</span></div>`;
      return;
    }
    if (this.nearCanoe) {
      setTouchTool(null, 'assets/canoe_icon.png');
      this.toolbar.innerHTML = `<div class="tool"><img src="assets/canoe_icon.png" alt=""><span><b>${ACTION_KEY}</b><b>Enter</b>${isFinalCamp() ? tr('Ziel erreicht', 'Goal reached') : tr('Mit dem Kanu weiter', 'On by canoe')}</span></div>`;
      return;
    }
    if (this.nearCages) {
      setTouchTool(null, 'assets/treasure_chest0.png');
      this.toolbar.innerHTML = `<div class="tool"><img src="assets/treasure_chest0.png" alt=""><span><b>${ACTION_KEY}</b><b>Enter</b>${tr('Wagen ansehen', 'View wagon')}</span></div>`;
      return;
    }
    if (this.nearCar && LEVEL.camp) {
      setTouchTool(null, 'assets/worldmap.jpg');
      this.toolbar.innerHTML = `<div class="tool"><img src="assets/worldmap.jpg" alt=""><span><b>${ACTION_KEY}</b><b>Enter</b>${tr('Expedition beenden', 'End expedition')}</span></div>`;
      return;
    }
    if (this.nearCar) {
      // am Auto zeigt die Aktionstaste die Schnellreise
      setTouchTool(null, 'assets/worldmap.jpg');
      this.toolbar.innerHTML = `<div class="tool"><img src="assets/worldmap.jpg" alt=""><span><b>${ACTION_KEY}</b><b>Enter</b>${tr('Schnellreise', 'Fast travel')}</span></div>`;
      return;
    }
    // Setzen-Modus (Deko-Taste): was die Aktionstaste mit der Kachel vor Henrik macht
    const decor = this.decor?.toolbar();
    if (decor) {
      setTouchTool(null, decor.image);
      this.toolbar.innerHTML = `<div class="tool"><img src="${decor.image}" alt=""><span><b>${ACTION_KEY}</b><b>Enter</b>${decor.label}</span></div>`;
      return;
    }
    // auf dem E-Roller: Absteigen erst, wenn sonst nichts zu tun ist (und kein Werkzeug in der Hand)
    if (this.driving && !this.toolId) {
      setTouchTool(null, 'assets/scooter_icon.png');
      this.toolbar.innerHTML = `<div class="tool"><img src="assets/scooter_icon.png" alt=""><span><b>${ACTION_KEY}</b><b>Enter</b>${tr('Absteigen', 'Get off')}</span></div>`;
      return;
    }
    const id = this.toolId;
    setTouchTool(id, id && TOOLS[id].image ? `assets/${TOOLS[id].image}.png` : undefined);
    this.toolbar.innerHTML = id
      ? `<div class="tool"><img src="assets/${TOOLS[id].image ?? id}.png" alt=""><span><b>${ACTION_KEY}</b><b>Enter</b>${TOOLS[id].name}</span></div>`
      : '';
  }

  // Hinweis zum Werkzeug: bei Kescher, Lasso und Futter nur die Tiere, die es in diesem Gebiet gibt
  toolHint(id) {
    const t = TOOLS[id];
    if (!t.catches) return t.hint;
    const here = (s) => !!spawnWeights(LEVEL)[s] || (s === 'heron' && !!LEVEL.herons) || (s === 'vulture' && !!LEVEL.vultures) || (s === 'hyena' && !!LEVEL.hyenas) || (s === 'iguana' && !!LEVEL.waterfallSun) || (s === 'gorilla' && !!LEVEL.gorillas) || (s === 'beaver' && !!LEVEL.beavers) || (s === 'yak' && !!LEVEL.yaks);
    const list = toolAnimals(id).filter(here);
    return list.length ? t.hint(list) : '';
  }

  // text darf HTML enthalten (z. B. Tierbilder)
  showToast(text) {
    this.toast.innerHTML = text;
    // zwischen dem Abzeichen oben links und den Knöpfen oben rechts, damit die Meldung nichts davon verdeckt.
    // Ist dort zu wenig Platz (Handy hochkant), kommt sie darunter über die ganze Breite
    const hud = this.hud.getBoundingClientRect();
    const buttons = [...document.querySelectorAll('#btn-menu, #btn-full, #btn-charms, #btn-campfire, #btn-decor')].map((b) => b.getBoundingClientRect()).filter((r) => r.width);
    const left = hud.right + 10;
    const right = Math.min(window.innerWidth - 10, ...buttons.map((r) => r.left - 10));
    if (right - left >= TOAST_MIN_W) {
      this.toast.style.top = '12px';
      this.toast.style.left = `${Math.round((left + right) / 2)}px`;
      this.toast.style.maxWidth = `${Math.round(Math.min(right - left, window.innerWidth * 0.65))}px`;
    } else {
      const banner = this.eventBanner.classList.contains('show') ? this.eventBanner.getBoundingClientRect().bottom : 0;
      this.toast.style.top = `${Math.round(Math.max(hud.bottom, banner, ...buttons.map((r) => r.bottom)) + 8)}px`;
      this.toast.style.left = `${Math.round(window.innerWidth / 2)}px`;
      this.toast.style.maxWidth = `${window.innerWidth - 24}px`;
    }
    this.toast.classList.remove('show');
    void this.toast.offsetWidth; // Animation neu starten
    this.toast.classList.add('show');
    // Expedition: der Tier-Zähler rückt unter die Meldung, solange sie steht (TOAST_MS), danach wieder hoch
    this.toastShownAt = Date.now();
    this.layoutExpCounter();
    clearTimeout(this.toastCounterTimer);
    this.toastCounterTimer = setTimeout(() => this.sys.isActive() && this.layoutExpCounter(), TOAST_MS + 50);
  }

  // Tier-Zähler der Expedition auf dem Handy: direkt unter der Knopfreihe (CSS), steht oben eine Meldung, darunter
  layoutExpCounter() {
    const el = document.getElementById('exp-counter');
    if (!el) return;
    const small = matchMedia('(max-width: 900px), (max-height: 500px)').matches;
    const showing = Date.now() - (this.toastShownAt ?? 0) < TOAST_MS;
    el.style.top = '';
    if (!small || !showing) return;
    const base = parseFloat(getComputedStyle(el).top) || 0; // (ohne eigene Angabe: die aus dem CSS)
    el.style.top = `${Math.max(base, Math.round(this.toast.getBoundingClientRect().bottom + 6))}px`;
  }

  // Werkzeuge kommen zurück in die Kiste (dort gibt es beliebig viele). Nur Werkzeuge mit einem festen Platz
  // am Boden (toolSpots im Level) werden dort wieder hingelegt. Gibt es mehrere gleiche
  // (die zwei Fallen), kommt es auf den ersten freien davon.
  returnTool(id) {
    const spots = TOOL_SPOTS.filter((s) => s.tool === id).map(({ tx, ty }) => tileToWorld(tx, ty));
    const home = spots.find((s) => !this.pickups.some((p) => !p.collected && Math.hypot(p.x - s.x, p.y - s.y) < 8)) ?? spots[0];
    // erst aufhebbar, wenn der Spieler einmal weggegangen ist (er steht evtl. gerade daneben)
    if (home) this.pickups.push(new Pickup(this, home.x, home.y, id, id, false));
  }

  // Werkzeug aufnehmen; ein getragenes kommt zurück auf seinen Platz an der Hütte (Tausch)
  takeTool(pickup) {
    const tiger = this.animals.find((a) => a.ballPickup === pickup);
    if (tiger) {
      tiger.ballPickup = null;
      tiger.goBack();
    }
    this.equipTool(pickup.tool);
    this.toolLockUntil = this.time.now + TOOL_SWITCH_LOCK;
  }

  // Hände frei: das getragene Werkzeug kommt zurück an seinen Platz an der Hütte
  dropTool() {
    const id = this.toolId;
    this.tool.destroy();
    this.tool = null;
    this.toolId = null;
    this.returnTool(id);
    this.updateToolbar();
  }

  // Werkzeug in die Hand nehmen (ein getragenes kommt zurück an die Hütte)
  equipTool(id) {
    if (id === 'lantern') this.removeLantern(); // es gibt nur eine Laterne
    if (CARRIED.includes(this.toolId)) this.stashedTool = null; // Stock bzw. Zweig weg, neues Werkzeug: das eingesteckte bleibt in der Kiste
    if (this.tool) {
      this.tool.destroy();
      this.returnTool(this.toolId);
    }
    this.tool = TOOLS[id].create(this, this.player);
    this.toolId = id;
    this.updateToolbar();
    const sort = unlockFeedFor(id); // diese Futtersorte draußen in der Hand: ab jetzt liegt sie auch im Futterhaus
    if (sort) this.time.delayedCall(TOAST_MS + 300, () => this.showToast(tr(`Neu im Futterhaus im Tierpark: ${FEED_SORTS[sort].name}.`, `New in the food house at the zoo: ${FEED_SORTS[sort].name.toLowerCase()}.`)));
  }

  // Getragene Falle vor dem Spieler auslegen
  // Grünfutter an die nächste Giraffe verfüttern: das Futter ist weg (liegt gleich wieder an der Hütte),
  // und mit etwas Glück (FEED_CHANCE) läuft sie einem danach hinterher
  feedGiraffe() {
    const p = this.player;
    const near = this.animals
      .filter((a) => (a.species === 'giraffe' || a.species === 'panda') && (a.canBeCaughtNow() || a.isSnacking?.()))
      .map((a) => ({ a, d: Math.hypot(a.x - p.x, (a.y - p.y) * 2) }))
      .filter(({ d }) => d < FEED_DIST)
      .sort((u, v) => u.d - v.d)[0]?.a;
    if (!near) {
      this.showToast(tr(`Geh näher an eine ${animalIcon('giraffe')} oder einen ${animalIcon('panda')} heran, um zu füttern.`, `Get closer to a ${animalIcon('giraffe')} or a ${animalIcon('panda')} to feed it.`));
      return;
    }
    if (near.species === 'panda') return this.feedPanda(near);
    const giraffe = near;
    this.tool.destroy();
    this.tool = null;
    this.toolId = null;
    this.returnTool('food');
    this.updateToolbar();
    giraffe.faceX = Math.sign(p.x - giraffe.x) || giraffe.faceX; // schaut zum Spieler
    this.munchLeaves(giraffe);
    if (Math.random() < FEED_CHANCE) {
      this.catchAnimal(giraffe, 'food');
      this.showToast(`${animalIcon('giraffe', 3.2)} ${tr('Die Giraffe mag dich! Sie läuft dir jetzt hinterher.', 'The giraffe likes you! It follows you now.')}`);
    } else {
      this.showToast(`${animalIcon('giraffe', 3.2)} ${tr('Mmh, lecker! Aber sie bleibt lieber hier. Neues Grünfutter gibt es im Regal in der Hütte.', 'Yum! But it would rather stay here. You can get new leafy greens from the shelf in the hut.')}`);
    }
  }

  // Plätze der Futtersträucher (einmal je Besuch gewürfelt): einer nah am Wasser (dort grasen die Tapire), die anderen
  // irgendwo, nicht verdeckt und mit Abstand zueinander. Nur wo Tapire oder Okapis vorkommen können
  leafBushTiles() {
    if (this._leafTiles) return this._leafTiles;
    const here = { ...spawnWeights(LEVEL), ...(LEVEL.home ?? {}) };
    if (isPark(LEVEL_ID) || LEVEL.camp || !(here.tapir || here.okapi)) return (this._leafTiles = []);
    const tiles = [];
    // nicht an Regalen und Kisten (dort legt Henrik das Getragene ab, der Zweig wäre weg), nicht an Hütte, Start und Auto
    const keep = [...(LEVEL.chests ?? []), LEVEL.start, LEVEL.car].filter(Boolean);
    const hut = LEVEL.hut;
    const clear = (tx, ty) =>
      !'#GXI'.includes(charAt(tx, ty)) && // nicht auf dem Weg
      keep.every((k) => Math.max(Math.abs(k.tx - tx), Math.abs(k.ty - ty)) > 4) &&
      !(hut && tx >= hut.tx0 - 2 && tx <= hut.tx1 + 2 && ty >= hut.ty0 - 2 && ty <= hut.ty1 + 2) &&
      this.handSpots.every((h) => Math.hypot(h.x - tileToWorld(tx, ty).x, h.y - tileToWorld(tx, ty).y) > HAND_DIST * 3);
    const ok = ({ tx, ty }) => clear(tx, ty) && !coveredAt(charAt, tx, ty) && tiles.every((t) => Math.max(Math.abs(t.tx - tx), Math.abs(t.ty - ty)) >= LEAF_BUSH_GAP);
    const shore = Phaser.Utils.Array.Shuffle(NEAR_WATER.filter((t) => !isBlocked(t.tx, t.ty) && !nearEnclosure(t.tx, t.ty)));
    const first = here.tapir ? shore.find(ok) : null;
    if (first) tiles.push(first);
    for (let tries = 0; tiles.length < LEAF_BUSHES && tries < 200; tries++) {
      const t = this.randomFreeTile([]);
      if (ok(t)) tiles.push(t);
    }
    return (this._leafTiles = tiles);
  }

  // Blätterzweig abbrechen: das getragene Werkzeug steckt Henrik so lange ein (wie beim großen Stock)
  takeLeaves(bush) {
    const prev = this.toolId;
    if (this.tool) this.tool.destroy();
    if (!CARRIED.includes(prev)) this.stashedTool = prev ?? null;
    this.leafBushes.take(bush);
    this.tool = TOOLS.leaves.create(this, this.player);
    this.toolId = 'leaves';
    this.nearBush = null;
    this.updateToolbar();
    if (this.cache.audio.exists('whoosh')) this.sound.play('whoosh', { volume: WHOOSH_VOLUME });
  }

  // mit dem Blätterzweig einen Tapir oder ein Okapi in der Nähe füttern: es frisst und läuft mit, der Zweig ist weg
  // (das eingesteckte Werkzeug kommt wieder in die Hand)
  feedLeaves() {
    const p = this.player;
    const near = this.animals
      .filter((a) => a.kind.catchWith.includes('leaves') && a.canBeCaughtNow())
      .map((a) => ({ a, d: Math.hypot(a.x - p.x, (a.y - p.y) * 2) }))
      .filter(({ d }) => d < FEED_DIST)
      .sort((u, v) => u.d - v.d)[0]?.a;
    if (!near) {
      this.showToast(tr(`Geh nah an einen ${animalIcon('tapir')} oder ein ${animalIcon('okapi')} heran, um es zu füttern.`, `Get close to a ${animalIcon('tapir')} or an ${animalIcon('okapi')} to feed it.`));
      return;
    }
    this.tool.destroy();
    const prev = this.stashedTool;
    this.stashedTool = null;
    this.tool = null;
    this.toolId = null;
    if (prev) this.equipTool(prev);
    else this.updateToolbar();
    near.faceX = Math.sign(p.x - near.x) || near.faceX; // schaut zum Spieler
    this.munchLeaves(near);
    this.catchAnimal(near, 'leaves');
  }

  // Panda mit Grünfutter: folgt sofort – außer er frisst gerade Bambus (dann erst nach einer kurzen Pause).
  // Das Grünfutter bleibt dabei in der Hand
  feedPanda(panda) {
    if (panda.isSnacking()) {
      const sec = Math.ceil(panda.snackLock);
      this.showToast(`${animalIcon('panda', 3.2)} ${tr(`Er frisst noch Bambus … in ${sec} Sekunden mag er wieder Grünfutter.`, `It is still eating bamboo … in ${sec} seconds it will want leafy greens again.`)}`);
      return;
    }
    // in Asien verbraucht sich das Grünfutter nicht: es bleibt in der Hand (für den nächsten Panda)
    this.munchLeaves(panda);
    this.catchAnimal(panda, 'food');
    this.showToast(`${animalIcon('panda', 3.2)} ${tr('Der Panda folgt dir! Mach einen Bogen um Bambus und hohes Gras – da kann er nicht widerstehen.', 'The panda follows you! Stay away from bamboo and tall grass – it can’t resist them.')}`);
  }

  // Kachel in einem Gehege?
  isPenTile(tx, ty) {
    return !!enclosureAt(tx, ty);
  }

  // Japanmakak taucht in der Quelle ab, wenn man ihn herausfischen will: Blubberblasen und ein Hinweis
  macaqueDives(m) {
    for (let i = 0; i < 6; i++) {
      const b = this.add.circle(m.x + Phaser.Math.Between(-8, 8), m.y + Phaser.Math.Between(-3, 3), Phaser.Math.FloatBetween(1.5, 3)).setStrokeStyle(1, 0xffffff, 0.9).setDepth(m.y + 1);
      this.tweens.add({ targets: b, y: b.y - Phaser.Math.Between(6, 14), alpha: 0, delay: i * 120, duration: 700, onComplete: () => b.destroy() });
    }
    const now = this.time.now;
    if (now - (this.macaqueToastAt ?? -1e9) > 8000) {
      this.macaqueToastAt = now;
      this.showToast(tr('Blubb! Der Affe ist abgetaucht. Aus der heißen Quelle kriegst du ihn nicht – warte, bis er herausspringt.', 'Blub! The monkey dived under. You can’t get it out of the hot spring – wait until it jumps out.'));
    }
  }

  // Panda in der Schlange sieht Bambus: er verlässt sie, setzt sich hin und frisst
  pandaSnack(panda, target) {
    const i = this.followers.indexOf(panda);
    if (i < 0) return;
    this.followers.splice(i, 1);
    panda.snack(target);
    this.updateHud();
    this.showToast(`${animalIcon('panda', 3.2)} ${tr('Oh nein – Bambus! Der Panda frisst jetzt erst mal. Gleich kannst du ihn wieder mit Grünfutter locken.', 'Oh no – bamboo! The panda is eating now. Soon you can lure it with leafy greens again.')}`);
  }

  // Fischfutter am Ufer ins Wasser streuen: die Koi in der Nähe (wild oder im Gehege) kommen herbei und schnappen
  feedKoi() {
    const now = this.time.now;
    if (now < (this.koiFedAt ?? -Infinity) + KOI_FEED_PAUSE) return;
    const p = this.player;
    const aim = { x: p.x + p.faceX * 24, y: p.y + p.faceY * 12 };
    // Wasser direkt vor dem Spieler: wilder Koi-Teich oder Teich in einem Koi-Gehege
    const water = [
      ...KOI_WATER,
      ...FISHPOND_TILES.filter(({ tx, ty }) => ENCLOSURES.some((e) => e.species?.includes('koi') && enclosureAt(tx, ty) === e)),
    ]
      .map((t) => tileToWorld(t.tx, t.ty))
      .map((w) => ({ ...w, d: Math.hypot(w.x - aim.x, (w.y - aim.y) * 2) }))
      .sort((u, v) => u.d - v.d)[0];
    if (!water || water.d > KOI_FEED_DIST) {
      this.showToast(tr(`Geh ans Ufer und streu das Futter ins Wasser – dann kommen die ${animalIcon('koi')}.`, `Go to the shore and scatter the food into the water – the ${animalIcon('koi')} will come.`));
      return;
    }
    // das Futter landet mitten auf der Wasserkachel vor dem Ufer, damit man die Koi gut sieht
    const spot = { x: water.x, y: water.y };
    // die nächsten wilden Koi in der Nähe und alle Koi im Gehege, an dessen Teich man steht
    const dist = (a) => Math.hypot(a.x - spot.x, a.y - spot.y);
    const wild = this.animals
      .filter((a) => a.species === 'koi' && a.state === 'wild' && a.phase !== 'up' && dist(a) < KOI_CALL_DIST)
      .sort((u, v) => dist(u) - dist(v));
    const penned = this.animals.filter((a) => a.species === 'koi' && a.state === 'penned' && dist(a) < KOI_CALL_DIST);
    const koi = [...wild.slice(0, KOI_CALLED), ...penned];
    // kein Koi in der Nähe: das Futter nicht verschwenden
    if (!koi.length) {
      this.showToast(tr(`Hier ist gerade kein ${animalIcon('koi')} in der Nähe. Stell dich ans Ufer, wo du bunte Schatten im Wasser siehst.`, `There is no ${animalIcon('koi')} nearby right now. Stand on the shore where you see colorful shadows in the water.`));
      return;
    }
    this.koiFedAt = now;
    // das Futter ist verbraucht (wie beim Grünfutter), neues liegt wieder an seinem Platz; gleich den Kescher in der Hand
    this.tool.destroy();
    this.tool = null;
    this.toolId = null;
    this.returnTool('koifood');
    this.equipTool('net');
    this.scatterFood(p, spot);
    for (const a of koi) a.call(spot);
    this.showToast(tr(`Die ${animalIcon('koi')} kommen! Du hast jetzt den Kescher in der Hand – sie fressen eine Weile.`, `The ${animalIcon('koi')} are coming! You have the net in your hand now – they will eat for a while.`));
  }

  // Futter am Zaun ins Gehege werfen: die Tiere dort kommen herbei und fressen, jedes an seinem eigenen Platz
  feedPen() {
    const p = this.player;
    const aim = { x: p.x + p.faceX * 30, y: p.y + p.faceY * 15 };
    // nächste Gehegekachel vor dem Spieler (nur Gehege mit Landtieren)
    let best = null;
    for (const e of ENCLOSURES) {
      if (!e.species?.some((s) => !NO_PEN_FEED.includes(s))) continue;
      for (const t of e.tiles) {
        if (isBlocked(t.tx, t.ty)) continue;
        const w = tileToWorld(t.tx, t.ty);
        const d = Math.hypot(w.x - aim.x, (w.y - aim.y) * 2);
        if (!best || d < best.d) best = { e, t, w, d };
      }
    }
    if (!best || best.d > PEN_FEED_DIST) {
      this.showToast(tr('Stell dich an den Zaun eines Geheges und wirf das Futter hinein.', 'Stand at the fence of an enclosure and throw the food in.'));
      return;
    }
    const e = best.e;
    // Futter ist verbraucht (wie beim Fischfutter), neues gibt es am Automaten
    this.tool.destroy();
    this.tool = null;
    this.toolId = null;
    this.updateToolbar();
    const eaters = this.feedEnclosure(e, p, best.w, true);
    this.showToast(
      eaters
        ? tr(`Die Tiere im Gehege ${e.name} kommen zum Fressen!`, `The animals in ${e.name} are coming to eat!`)
        : tr(`Lecker Futter im Gehege ${e.name} … aber gerade frisst niemand davon.`, `Yummy food in ${e.name} … but nobody is eating it right now.`),
    );
  }

  // Futter von "from" aus ins Gehege werfen (Spieler oder Besucher): die Tiere dort kommen herbei und fressen, jedes an
  // seinem eigenen Platz. food: wohin es fliegt (sonst die Gehegekachel am nächsten bei "from"); always: auch werfen,
  // wenn gerade niemand frisst. Ergebnis: wie viele Tiere kommen
  feedEnclosure(e, from, food = null, always = false) {
    if (!food) {
      let best = null;
      for (const t of e.tiles) {
        if (isBlocked(t.tx, t.ty)) continue;
        const w = tileToWorld(t.tx, t.ty);
        const d = Math.hypot(w.x - from.x, (w.y - from.y) * 2);
        if (!best || d < best.d) best = { w, d };
      }
      if (!best) return 0;
      food = best.w;
    }
    const eaters = this.animals.filter((a) => a.enclosure === e && !NO_PEN_FEED.includes(a.species) && a.canFeed());
    if (!eaters.length && !always) return 0;
    this.scatterFood(from, food);
    if (!eaters.length) return 0;
    // Futterplätze: freie Stellen im Gehege rund ums Futter, mit Abstand zueinander (nichts überlagert sich)
    const spots = [];
    const candidates = [];
    for (const t of e.tiles) {
      if (isBlocked(t.tx, t.ty)) continue;
      const c = tileToWorld(t.tx, t.ty);
      for (const [ox, oy] of [[0, 0], [-14, -5], [14, 5], [14, -5], [-14, 5]]) candidates.push({ x: c.x + ox, y: c.y + oy });
    }
    candidates.sort((u, v) => Math.hypot(u.x - food.x, (u.y - food.y) * 2) - Math.hypot(v.x - food.x, (v.y - food.y) * 2));
    for (const c of candidates) {
      if (spots.length >= eaters.length) break;
      if (Math.hypot(c.x - food.x, (c.y - food.y) * 2) < 12) continue; // nicht mitten aufs Futter
      if (spots.every((s) => Math.hypot(s.x - c.x, (s.y - c.y) * 2) >= FEED_GAP * 1.4)) spots.push(c);
    }
    // jedes Tier zum nächsten noch freien Platz
    const free = [...spots];
    for (const a of [...eaters].sort((u, v) => Math.hypot(u.x - food.x, u.y - food.y) - Math.hypot(v.x - food.x, v.y - food.y))) {
      if (!free.length) break;
      free.sort((u, v) => Math.hypot(u.x - a.x, u.y - a.y) - Math.hypot(v.x - a.x, v.y - a.y));
      a.eatAt(free.shift(), food, Phaser.Math.FloatBetween(...FEED_TIME));
      if (from === this.player && a.feed && this.needs?.get(a)?.kind === 'feed') this.time.delayedCall(700, () => this.fedByThrow(a)); // Futter-Bedürfnis erfüllt
    }
    return eaters.length;
  }

  // bunte Futterflocken fliegen in einem Bogen aufs Wasser, dann kleine Ringe
  // Besucher auf der Brücke über dem Koi-Teich (siehe VisitorCrowd.feedKoi): Futter aufs Wasser neben der Brücke streuen,
  // die Koi im Teich in der Nähe kommen herbei und schnappen. Gibt zurück, ob es geklappt hat
  visitorFeedKoi(v) {
    const e = v.pen;
    const water = FISHPOND_TILES.filter(({ tx, ty }) => enclosureAt(tx, ty) === e)
      .map((t) => tileToWorld(t.tx, t.ty))
      .map((w) => ({ ...w, d: Math.hypot(w.x - v.x, (w.y - v.y) * 2) }))
      .sort((p, q) => p.d - q.d)[0];
    if (!water || water.d > KOI_FEED_DIST * 1.6) return false;
    const spot = { x: water.x, y: water.y };
    const koi = this.animals.filter((a) => a.species === 'koi' && a.state === 'penned' && a.enclosure === e && Math.hypot(a.x - spot.x, a.y - spot.y) < KOI_CALL_DIST * 1.5);
    if (!koi.length) return false;
    this.scatterFood(v, spot);
    for (const a of koi) a.call(spot);
    return true;
  }

  scatterFood(from, spot) {
    const colors = [0xf08a2c, 0xe8483f, 0xf2c84a];
    for (let i = 0; i < 12; i++) {
      const tx = spot.x + Phaser.Math.Between(-14, 14);
      const ty = spot.y + Phaser.Math.Between(-5, 5);
      const flake = this.add.rectangle(from.x, from.y - 18, 2, 2, colors[i % 3]).setDepth(100000);
      this.tweens.add({ targets: flake, x: tx, duration: 450 + i * 25, ease: 'Linear' });
      this.tweens.add({
        targets: flake,
        y: { value: from.y - 34, duration: 200 + i * 12, ease: 'Quad.easeOut', yoyo: false },
        onComplete: () =>
          this.tweens.add({
            targets: flake,
            y: ty,
            duration: 260 + i * 13,
            ease: 'Quad.easeIn',
            onComplete: () => {
              flake.setDepth(-99998.5);
              // das Futter treibt so lange auf dem Wasser, wie die Koi daran schnappen
              this.tweens.add({ targets: flake, alpha: 0, delay: KOI_FOOD_FLOAT, duration: 1500, onComplete: () => flake.destroy() });
              if (i % 4 === 0) {
                const ring = this.add.ellipse(tx, ty, 8, 3).setStrokeStyle(1, 0xffffff, 0.8).setDepth(-99998.5);
                this.tweens.add({ targets: ring, scale: 2.5, alpha: 0, duration: 600, onComplete: () => ring.destroy() });
              }
            },
          }),
      });
    }
  }

  // Ein paar grüne Blätter rieseln vom Maul der Giraffe
  munchLeaves(animal) {
    const top = animal.y - animal.sprite.displayHeight * 0.8;
    for (let i = 0; i < 8; i++) {
      const leaf = this.add
        .ellipse(animal.x + animal.faceX * 10 + Phaser.Math.Between(-6, 6), top + Phaser.Math.Between(-4, 4), 4, 2.5, i % 2 ? 0x66932f : 0x9cc850)
        .setDepth(100000);
      this.tweens.add({
        targets: leaf,
        y: leaf.y + Phaser.Math.Between(18, 34),
        x: leaf.x + Phaser.Math.Between(-10, 10),
        angle: Phaser.Math.Between(-180, 180),
        alpha: 0,
        duration: Phaser.Math.Between(700, 1100),
        ease: 'Quad.easeIn',
        onComplete: () => leaf.destroy(),
      });
    }
  }

  placeTrap() {
    const p = this.player;
    let x = p.x + p.faceX * 20;
    let y = p.y + p.faceY * 10;
    const { tx, ty } = worldToTile(x, y);
    if (isBlocked(tx, ty)) {
      x = p.x;
      y = p.y;
    }
    const t = { id: game.nextTrapId++, level: LEVEL_ID, x, y, timer: Phaser.Math.FloatBetween(...(smallMap() ? TRAP_TIME_SMALL : TRAP_TIME)), caught: false, armed: false };
    game.traps.push(t);
    this.traps.set(t.id, new Trap(this, x, y));
    this.tool.destroy();
    this.tool = null;
    this.toolId = null;
    this.updateToolbar();
    this.showToast(tr('Falle ausgelegt! Jetzt heißt es abwarten …', 'Trap set! Now you have to wait …'));
  }

  // Jede ausgelegte Falle wartet für sich (auch, wenn man im anderen Level ist). Läuft ihre Zeit ab,
  // geht ein Tier aus der Umgebung hinein: je näher und je lieber es Köder mag (trapWeight), desto wahrscheinlicher.
  updateTraps(dt) {
    for (const t of [...game.traps]) {
      if (t.caught) this.collectTrap(t);
      else if (!this.pickUpTrap(t)) this.waitTrap(t, dt);
    }
  }

  // Leere ausgelegte Falle wieder aufheben, wenn man darüber läuft (erst, nachdem man sich einmal entfernt hat)
  pickUpTrap(t) {
    if (t.level !== LEVEL_ID) return false;
    const d = Math.hypot(this.player.x - t.x, (this.player.y - t.y) * 2);
    if (!t.armed) {
      if (d > TRAP_REARM_DIST) t.armed = true;
      return false;
    }
    if (d >= TRAP_PICKUP_DIST * 2) return false;
    this.traps.get(t.id)?.destroy();
    this.traps.delete(t.id);
    game.traps = game.traps.filter((g) => g !== t);
    this.equipTool('trap');
    return true;
  }

  // Hinweise am Bildschirmrand: ein Kreis in Richtung jeder ausgelegten Falle, die gerade nicht zu sehen ist.
  // Fallen im anderen Gebiet zeigen blass zum Übergang dorthin. Sitzt ein Tier drin, leuchtet der Hinweis.
  updateTrapMarkers() {
    const cam = this.cameras.main;
    const view = cam.worldView;
    const z = this.scale.zoom; // Spielpixel -> Seitenpixel (das Spiel zeichnet in Display-Auflösung, siehe main.js)
    const W = this.scale.width * z;
    const H = this.scale.height * z;
    const top = Math.max(MARKER_MARGIN, this.hud.getBoundingClientRect().bottom + 26);
    // links oben stehen Event, Mavis Aufgabe und die Wunschkarten: dort rutscht ein Hinweis darunter
    let stack = null;
    for (const el of [this.eventBanner, this.questCard, this.wishCards]) {
      const r = el?.getBoundingClientRect();
      if (!r?.width) continue;
      stack = { right: Math.max(stack?.right ?? 0, r.right), bottom: Math.max(stack?.bottom ?? 0, r.bottom) };
    }
    // Hinweise auf ausgelegte Fallen nur im Wald (dort gibt es die Falle); woanders keine
    const traps = LEVEL_ID === 'forest' ? game.traps : [];
    // dazu Pfeile zu Schatzkisten (Glücksbringer Kisten-Kompass) und zum seltenen Tier aus einer Kiste
    const luck = this.luck?.markerTargets() ?? [];
    // und ein roter Hinweis zu Mavis Pfeil (Tutorial), wenn er gerade nicht zu sehen ist
    const tut = this.mavi?.markerTarget?.();
    if (tut) luck.push(tut);
    for (const t of [...traps, ...luck]) {
      let target = t;
      if (t.level && t.level !== LEVEL_ID) {
        // direkter Übergang dorthin (zwischen den Gebieten fährt man sonst mit dem Auto: dann kein Hinweis)
        const exit = EXITS.find((e) => e.to === t.level);
        if (!exit) continue;
        target = tileToWorld(exit.tx, exit.ty);
      }
      // Bildschirmposition (etwas oberhalb des Fußpunkts, wo man die Falle sieht)
      const sx = (target.x - view.x) * cam.zoom * z;
      const sy = (target.y - 8 - view.y) * cam.zoom * z;
      const onScreen = sx > 0 && sx < W && sy > 0 && sy < H;
      let el = this.markers.get(t.id);
      // im Bild: weg – außer bei versteckten Tieren (Fernglas: Affe oben in der Krone, Schlange im Dickicht), dort steht
      // das Tierbild direkt über der Stelle
      if (onScreen && !t.here) {
        el?.classList.remove('show');
        continue;
      }
      if (!el) {
        el = document.createElement('div');
        el.className = t.cls ?? (t.icon ? `marker luck${t.bino ? ' bino' : ''}` : 'marker'); // bino: Fernglas (Tierbild, etwas größer)
        this.markerBox.appendChild(el);
        this.markers.set(t.id, el);
      }
      // Bild neu setzen, wenn es sich ändert (z. B. Tierbild des Fernglases, sobald sein Zuschnitt bekannt ist)
      if (el.iconHtml !== (t.icon ?? '')) {
        el.iconHtml = t.icon ?? '';
        el.innerHTML = `<span class="pointer"></span>${el.iconHtml}`;
      }
      el.classList.toggle('here', onScreen);
      if (onScreen) {
        el.style.left = `${sx}px`;
        el.style.top = `${sy}px`;
        el.classList.add('show');
        continue;
      }
      // vom Bildschirmmittelpunkt in Richtung Falle bis an den Rand (oben unterhalb der Anzeigeleiste)
      const dx = sx - W / 2 || 1e-6;
      const dy = sy - H / 2 || 1e-6;
      const kx = (dx > 0 ? W - MARKER_MARGIN - W / 2 : MARKER_MARGIN - W / 2) / dx;
      const ky = (dy > 0 ? H - MARKER_MARGIN - H / 2 : top - H / 2) / dy;
      const k = Math.min(kx, ky);
      const mx = W / 2 + dx * k;
      let my = H / 2 + dy * k;
      if (stack && mx < stack.right + MARKER_MARGIN && my < stack.bottom + MARKER_MARGIN) my = stack.bottom + MARKER_MARGIN;
      el.style.left = `${mx}px`;
      el.style.top = `${my}px`;
      el.querySelector('.pointer').style.transform = `rotate(${Math.atan2(dy, dx)}rad)`;
      el.classList.add('show');
      el.classList.toggle('caught', !!t.caught);
      el.classList.toggle('elsewhere', !!t.level && t.level !== LEVEL_ID);
    }
    // Hinweise zu Fallen, die es nicht mehr gibt (oder außerhalb des Waldes), entfernen
    for (const [id, el] of this.markers) {
      if (traps.some((t) => t.id === id) || luck.some((t) => t.id === id)) continue;
      el.remove();
      this.markers.delete(id);
    }
  }

  waitTrap(t, dt) {
    t.timer -= dt;
    if (t.timer > 0) return;
    const here = t.level === LEVEL_ID;
    const list = here ? this.animals : (game.levels[t.level]?.animals ?? []);
    const candidates = list.flatMap((a) => {
      const kind = SPECIES[a.species];
      if (a.state !== 'wild' || !kind.catchWith.includes('trap')) return [];
      const d = Math.hypot(a.x - t.x, (a.y - t.y) * 2);
      return d < TRAP_RADIUS ? [{ a, w: kind.trapWeight * (1 - d / TRAP_RADIUS) ** 2 }] : [];
    });
    if (!candidates.length) {
      t.timer = Phaser.Math.FloatBetween(...(here && smallMap() ? TRAP_RETRY_SMALL : TRAP_RETRY));
      return;
    }
    let r = Math.random() * candidates.reduce((s, c) => s + c.w, 0);
    const { a } = candidates.find((c) => (r -= c.w) <= 0) ?? candidates[0];
    if (here) {
      a.enterTrap(t.x, t.y);
      this.traps.get(t.id).showCaught();
    } else {
      Object.assign(a, { state: 'trapped', x: t.x, y: t.y }); // gespeicherter Stand des anderen Levels
    }
    t.caught = true;
    // Schnapp-Geräusch, auch wenn die Falle gerade nicht zu sehen ist (sie meldet sich ja auch mit einem Hinweis)
    if (this.cache.audio.exists('trap')) this.sound.play('trap', { volume: TRAP_VOLUME });
    const where = here ? '' : ` (${LEVELS[t.level].name})`;
    this.showToast(tr(`Etwas ist in die Falle gegangen!${where} Geh hin und schau nach …`, `Something walked into the trap!${where} Go and have a look …`));
  }

  // Tier abholen, wenn der Spieler an der vollen Falle ist: es folgt ihm, die Falle kehrt zur Hütte zurück
  collectTrap(t) {
    const trap = this.traps.get(t.id);
    if (!trap || Math.hypot(this.player.x - t.x, (this.player.y - t.y) * 2) >= TRAP_PICKUP_DIST * 2) return;
    // das Tier, das in genau dieser Falle sitzt
    const animal = this.animals
      .filter((a) => a.state === 'trapped')
      .sort((a, b) => Math.hypot(a.x - t.x, a.y - t.y) - Math.hypot(b.x - t.x, b.y - t.y))[0];
    if (animal) this.catchAnimal(animal, 'trap');
    const surprise = animal ? `${animalIcon(animal.species, 3.2)} ${tr('war in der Falle!', 'was in the trap!')} ` : '';
    trap.destroy();
    this.traps.delete(t.id);
    game.traps = game.traps.filter((g) => g !== t);
    this.returnTool('trap');
    this.showToast(`${surprise}${tr('Die Falle ist wieder im Regal.', 'The trap is back on the shelf.')}`);
  }

  // Kiste an dieser Kachel (aus LEVEL.chests)
  chestAt(tx, ty) {
    return (LEVEL.chests ?? []).find((c) => c.tx === tx && c.ty === ty) ?? null;
  }

  // Werkzeug-Kiste öffnen: Werkzeuge dieses Gebiets und "Hände frei"; das Spiel pausiert so lange
  openChest(chest) {
    if (!chest || this.leaving || isToolChestOpen() || isTravelMapOpen() || isJournalOpen()) return;
    const tools = [...new Set([...(this.expMap || LEVEL.side ? this.expTools() : chest.tools), ...(this.sideWolfNight() ? ['lantern'] : []), ...(LEVEL.sea && isActive('jellyfish') ? ['jar'] : []), ...(this.fireflyEvening() && !this.expMap ? ['fireflyjar'] : [])])]; // (Wolfsnacht hinter einem Durchgang: die Laterne für die Spuren) beim Quallen-Schwarm liegt das Quallenglas im Sack, beim Glühwürmchen-Abend das Glas in der Hütte
    const items = [...tools, null].map((id) => ({
      id,
      name: id ? TOOLS[id].name : tr('Hände frei', 'Empty hands'),
      image: id ? TOOLS[id].image ?? id : 'hand',
      animals: toolAnimalsHtml(id),
    }));
    this.scene.pause();
    openToolChest(
      items,
      this.toolId,
      (id) => {
        this.scene.resume();
        if (id === this.toolId) return;
        if (id) {
          this.equipTool(id); // das getragene Werkzeug kommt zurück in die Kiste
          this.showToast(`${tr(`${TOOLS[id].name} genommen.`, `You took the ${TOOLS[id].name.toLowerCase()}.`)} ${this.toolHint(id)}`);
        } else if (this.tool) this.dropTool();
      },
      () => this.scene.resume(),
      // Mavis Schaf-Aufgabe: Schafe fängt man mit leeren Händen; bei der Wiesen-Aufgabe zeigt der Pfeil auf den Kescher
      activeId() === 'sheep'
        ? { id: null, hint: tr('Für Schafe brauchst du kein Werkzeug: Nimm „Hände frei“ und lauf einfach zu ihnen hin!', 'You don’t need a tool for sheep: choose “Empty hands” and simply walk up to them!') }
        : this.mavi.needsNet() && chest.tools.includes('net')
          ? { id: 'net', hint: tr('Nimm den Kescher – damit fängst du Schmetterlinge, wenn sie auf einer Blüte sitzen!', 'Take the net – use it to catch butterflies while they sit on a blossom!') }
          : null,
    );
  }

  // Regal (oder Kiste, Sack) dieser Welt: oberer Rand des Bilds (bzw. die obere Mitte des Schranks, peak)
  chestPoint() {
    for (const c of LEVEL.chests ?? []) {
      const img = this.chestSprites?.get(`${c.tx},${c.ty}`);
      if (!img) continue;
      const [px, py] = objectAt(c.tx, c.ty)?.peak ?? [img.originX, 0];
      return { x: img.x + (px - img.originX) * img.displayWidth, y: img.y + (py - img.originY) * img.displayHeight + 6 };
    }
    return null;
  }

  // Schild am Schafgehege (Weide) im Tierpark
  sheepSign() {
    return (this.enclosureSigns ?? []).find((s) => s.enclosure.species?.includes('sheep')) ?? null;
  }

  // Erste Begegnung, ganz dezent: über dem nächsten wilden Tier einer Art, die man noch nie gefangen hat, schwebt eine kleine
  // Blase mit dem Werkzeug dafür – ohne Text und Ton. Antippen zeigt den Fang-Tipp. Flieht so ein Tier mehrmals vor einem,
  // kommt der Tipp einmal von selbst (game.tipsSeen)
  updateEncounter(dt) {
    const el = this.encounterEl;
    this.encounterTimer -= dt;
    if (this.encounterTimer <= 0) {
      this.encounterTimer = 0.3;
      const p = this.player;
      let best = null;
      let bestD = ENCOUNTER_DIST;
      for (const a of this.animals) {
        if (a.state !== 'wild' || a.species === 'sheep' || a.species === 'seal' || a.species === 'ray' || a.species === 'beaver' || caughtBefore(a.species) || !CATCH_TIPS[a.species]) continue; // die Robbe zeigt selbst, was sie will; über Rochen keine Blase
        if (a.fleeing && !a.wasFleeing) this.countFlee(a.species);
        a.wasFleeing = a.fleeing;
        // getarnte Krake: erst, wenn sie sich zeigt; Gorilla im Trommel-Duell (und auf dem Weg dorthin): die Blase läge über der Trommelanzeige
        if (!a.sprite?.visible || a.sprite.alpha < 0.4 || a.mode === 'camo' || a.mode === 'come' || a.mode === 'duel') continue;
        const d = Math.hypot(a.x - p.x, (a.y - p.y) * 2);
        if (d < bestD) {
          best = a;
          bestD = d;
        }
      }
      if (best !== this.encounterAnimal) {
        this.encounterAnimal = best;
        if (best) {
          // ab jetzt steht der Fang-Tipp im Tierbuch
          if (!game.seenSpecies.includes(best.species)) {
            game.seenSpecies.push(best.species);
            this.markNew(`seen:${best.species}`);
          }
          const tools = [...new Set([...SPECIES[best.species].catchWith.map((t) => CATCH_TOOLS[t][0]), ...Object.keys(TOOL_LURES).filter((id) => TOOL_LURES[id].includes(best.species) && id !== 'glowjar').map((id) => TOOLS[id].image ?? id)])];
          el.innerHTML = `${tools.slice(0, 3).map((t) => `<img src="assets/${t}.png" alt="">`).join('')}`;
          el.onclick = (e) => {
            e.stopPropagation();
            this.showCatchTip(best.species);
          };
        }
        el.classList.toggle('show', !!best);
      }
    }
    // jedes Bild mitwandern, über dem Kopf des Tiers
    const a = this.encounterAnimal;
    if (!a) return;
    if (a.state !== 'wild' || !this.animals.includes(a)) return this.hideEncounterBubble();
    const cam = this.cameras.main;
    const z = this.scale.zoom;
    const top = a.sprite.y - a.sprite.displayHeight * a.sprite.originY;
    el.style.left = `${(a.sprite.x - cam.worldView.x) * cam.zoom * z}px`;
    el.style.top = `${(top - cam.worldView.y) * cam.zoom * z}px`;
  }

  // Biber: Hinweisblase mit einem Biber über dem nächsten großen Stock, solange der Damm ein Loch hat; trägt Henrik einen
  // Stock, zeigt sie stattdessen mit dem Stock auf das Loch im Damm. Antippen zeigt den Fang-Tipp
  updateBeaverHint() {
    const el = this.beaverHintEl;
    const dam = this.beaverDam;
    let target = null;
    let what = null;
    if (dam?.open && !this.leaving) {
      if (this.toolId === 'stick') {
        if (Math.hypot(this.player.x - dam.hole.x, (this.player.y - dam.hole.y) * 2) < BEAVER_HINT_DIST * 1.6) {
          target = { x: dam.hole.x, y: dam.hole.y - 20 };
          what = 'dam';
        }
      } else {
        const s = dam.closestStick(this.player, BEAVER_HINT_DIST);
        if (s) {
          target = { x: s.x, y: s.y - 8 };
          what = s;
        }
      }
    }
    if (what !== this.beaverHintFor) {
      this.beaverHintFor = what;
      if (what) {
        el.innerHTML = what === 'dam' ? '<img src="assets/forest_stick.png" alt="">' : animalIcon('beaver', 1.6);
        el.onclick = (e) => {
          e.stopPropagation();
          this.showCatchTip('beaver');
        };
      }
      el.classList.toggle('show', !!what);
    }
    if (!target) return;
    const cam = this.cameras.main;
    const z = this.scale.zoom;
    el.style.left = `${(target.x - cam.worldView.x) * cam.zoom * z}px`;
    el.style.top = `${(target.y - cam.worldView.y) * cam.zoom * z}px`;
  }

  // Yak-Herde: Hinweisblase mit einem Yak über dem Salzstein, wenn er in der Nähe liegt; trägt Henrik ihn, zeigt sie
  // stattdessen mit dem Salzstein auf den Steinhaufen. Antippen zeigt den Fang-Tipp
  updateYakHint() {
    const el = this.yakHintEl;
    const herd = this.yakHerd;
    const p = this.player;
    let target = null;
    let what = null;
    if (herd && !herd.onCairn && !this.leaving) {
      if (this.toolId === 'salt') {
        if (Math.hypot(p.x - herd.cairn.x, (p.y - herd.cairn.y) * 2) < BEAVER_HINT_DIST * 1.6) {
          target = { x: herd.cairn.x, y: herd.cairn.y - 46 };
          what = 'cairn';
        }
      } else if (herd.salt && Math.hypot(p.x - herd.salt.x, (p.y - herd.salt.y) * 2) < BEAVER_HINT_DIST) {
        target = { x: herd.salt.x, y: herd.salt.y - 20 };
        what = herd.salt;
      }
    }
    if (what !== this.yakHintFor) {
      this.yakHintFor = what;
      if (what) {
        el.innerHTML = what === 'cairn' ? '<img src="assets/salt_stone.png" alt="">' : animalIcon('yak', 1.6);
        el.onclick = (e) => {
          e.stopPropagation();
          this.showCatchTip('yak');
        };
      }
      el.classList.toggle('show', !!what);
    }
    if (!target) return;
    const cam = this.cameras.main;
    const z = this.scale.zoom;
    el.style.left = `${(target.x - cam.worldView.x) * cam.zoom * z}px`;
    el.style.top = `${(target.y - cam.worldView.y) * cam.zoom * z}px`;
  }

  // Eichenhain: über der nächsten großen Eiche schwebt eine Blase mit Eicheln – dort kann man sie herunterschütteln. Nur
  // solange man noch nicht beide Tiere gefangen hat, die man mit Eicheln lockt (Igel und Wildschwein), und nicht, wenn
  // Henrik schon Eicheln in der Hand hat. Antippen zeigt den Fang-Tipp
  updateOakHint() {
    const el = this.oakHintEl;
    const p = this.player;
    let what = null;
    if (LEVEL.boarArea && !this.leaving && this.toolId !== 'acorns' && !(caughtBefore('boar') && caughtBefore('hedgehog'))) {
      let best = OAK_HINT_DIST;
      for (const o of this.oakList()) {
        if (o.tx >= MAP_W - 1 || o.ty >= MAP_H - 1) continue; // nicht am Kartenrand (dort kommt man nicht hin)
        const d = Math.hypot(o.x - p.x, (o.y - p.y) * 2);
        if (d < best) {
          best = d;
          what = o;
        }
      }
    }
    if (what !== this.oakHintFor) {
      this.oakHintFor = what;
      if (what) {
        el.innerHTML = '<img src="assets/acorns.png" alt="">';
        el.onclick = (e) => {
          e.stopPropagation();
          this.showCatchTip(caughtBefore('boar') ? 'hedgehog' : 'boar');
        };
      }
      el.classList.toggle('show', !!what);
    }
    if (!what) return;
    const cam = this.cameras.main;
    const z = this.scale.zoom;
    el.style.left = `${(what.x - cam.worldView.x) * cam.zoom * z}px`;
    el.style.top = `${(what.y - OAK_HINT_UP - cam.worldView.y) * cam.zoom * z}px`;
  }

  // großen Stock aufheben: das getragene Werkzeug steckt Henrik so lange ein (es kommt nach dem Damm zurück)
  takeStick(stick) {
    const prev = this.toolId;
    if (this.tool) this.tool.destroy();
    this.stashedTool = prev && prev !== 'stick' ? prev : null;
    this.beaverDam.takeStick(stick);
    this.tool = TOOLS.stick.create(this, this.player);
    this.toolId = 'stick';
    this.updateToolbar();
  }

  // Salzstein aufheben: das getragene Werkzeug steckt Henrik so lange ein (es kommt danach zurück)
  takeSalt() {
    const prev = this.toolId;
    if (this.tool) this.tool.destroy();
    this.stashedTool = prev && !CARRIED.includes(prev) ? prev : null;
    this.yakHerd.takeSalt();
    this.tool = TOOLS.salt.create(this, this.player);
    this.toolId = 'salt';
    this.updateToolbar();
  }

  // Salzstein auf den Steinhaufen: ein Yak trottet herbei, Henrik nimmt die Bürste in die Hand
  putSalt() {
    this.tool.used = true;
    this.tool.destroy();
    const yak = this.yakHerd.putOnCairn();
    this.nearCairn = false;
    this.tool = TOOLS.brush.create(this, this.player);
    this.toolId = 'brush';
    this.updateToolbar();
    this.showToast(yak
      ? `${animalIcon('yak', 3.2)} ${tr('Ein Yak riecht das Salz und trottet herbei! Bürste es dreimal, während es leckt.', 'A yak smells the salt and comes trotting over! Brush it three times while it licks.')}`
      : tr('🧂 Der Salzstein liegt bereit – gleich kommt ein Yak.', '🧂 The salt lick is ready – a yak will come soon.'));
  }

  // Bürste: das leckende Yak einmal bürsten; nach dem dritten Mal kommt es mit
  brushYak() {
    const yak = this.yakHerd?.lickerNear(this.player);
    if (!yak) {
      this.showToast(tr(`Geh zum ${animalIcon('yak')} am Steinhaufen und bürste es, während es am Salzstein leckt.`, `Go to the ${animalIcon('yak')} at the cairn and brush it while it licks the salt.`));
      return;
    }
    this.tool.scrub?.();
    if (!yak.brush()) {
      const left = BRUSHES_NEEDED - yak.brushed;
      this.showToast(tr(`🪮 Das gefällt ihm! Noch ${left}-mal bürsten.`, `🪮 It likes that! ${left} more ${left === 1 ? 'time' : 'times'}.`));
      this.updateToolbar();
      return;
    }
    this.yakHerd.caught();
    this.putAwayCarried();
    this.showToast(`${animalIcon(yak.skin ?? 'yak', 3.2)} ${tr('Das Yak ist ganz flauschig und zufrieden – es kommt mit dir!', 'The yak is all fluffy and happy – it comes along with you!')}`);
    this.catchAnimal(yak);
  }

  // das Yak hat den Salzstein aufgeleckt (nicht fertig gebürstet) und ist zurück bei der Herde
  yakLickEnded() {
    if (this.toolId === 'brush') this.putAwayCarried();
    this.showToast(`${animalIcon('yak', 3.2)} ${tr('Der Salzstein ist aufgeleckt – das Yak trottet zurück. Such einen neuen Salzstein!', 'The salt is all licked up – the yak trots back. Find a new salt lick!')}`);
  }

  // getragenes Ding (Bürste) weglegen, das eingesteckte Werkzeug kommt wieder heraus
  putAwayCarried() {
    this.tool?.destroy();
    this.tool = null;
    this.toolId = null;
    const prev = this.stashedTool;
    this.stashedTool = null;
    if (prev) this.equipTool(prev);
    else this.updateToolbar();
  }

  // Stock ins Loch: der Damm ist dicht, die Biber freuen sich, und der nächste kommt mit
  fixDam() {
    this.tool.used = true;
    this.tool.destroy();
    this.tool = null;
    this.toolId = null;
    this.beaverDam.plug();
    const prev = this.stashedTool;
    this.stashedTool = null;
    if (prev) this.equipTool(prev);
    else this.updateToolbar();
    if (this.cache.audio.exists('whoosh')) this.sound.play('whoosh', { volume: WHOOSH_VOLUME });
    const p = this.player;
    const beavers = this.beaverDam.wild().sort((a, b) => Math.hypot(a.x - p.x, a.y - p.y) - Math.hypot(b.x - p.x, b.y - p.y));
    const [helper, ...others] = beavers;
    for (const b of others) b.cheer();
    this.showToast(`${animalIcon('beaver', 3.2)} ${helper
      ? tr('Der Damm ist wieder dicht! Die Biber freuen sich – einer kommt mit dir.', 'The dam is sealed again! The beavers are delighted – one of them comes along with you.')
      : tr('Der Damm ist wieder dicht! Die Biber freuen sich.', 'The dam is sealed again! The beavers are delighted.')}`);
    // der nächste Biber ist sofort gefangen und folgt (holt Henrik ein, auch wenn der gleich zum Auto läuft); Hinweise
    // beim Fangen (z. B. Gehege voll) ersetzen die Meldung oben
    if (helper) {
      helper.mode = null;
      this.catchAnimal(helper);
    }
  }

  hideEncounterBubble() {
    this.encounterAnimal = null;
    this.encounterEl?.classList.remove('show');
  }

  // eine Art ist vor einem geflohen: beim zweiten Mal der Fang-Tipp (einmal je Art)
  countFlee(species) {
    this.fleeCounts[species] = (this.fleeCounts[species] ?? 0) + 1;
    if (this.fleeCounts[species] < ENCOUNTER_FLEES || game.tipsSeen.includes(species)) return;
    game.tipsSeen.push(species);
    this.showCatchTip(species);
  }

  showCatchTip(species) {
    this.showToast(`${animalIcon(species, 3.2)} ${CATCH_TIPS_SHORT[species] ?? CATCH_TIPS[species]}`);
  }

  // Weltkarte öffnen (am Auto): das Spiel pausiert, bis man losfährt oder die Karte schließt
  openCarMap() {
    if (this.expCamp) return this.expConfirmHome(); // im Expeditions-Camp: Expedition beenden (mit Rückfrage)
    if (this.leaving || isTravelMapOpen() || isJournalOpen()) return;
    // der Tierpark hat ein Schild mit einem Feld je Abschnitt (part in levels.js)
    const places = Object.entries(LEVELS)
      .filter(([, l]) => l.car && l.map && !l.camp) // (das Expeditions-Camp wählt man über seine Welt, siehe chooseTrip)
      .map(([id, l]) => ({
        id,
        name: l.name,
        icon: l.map.icon,
        x: l.map.x,
        y: l.map.y,
        status: l.seasons ? this.seasonStatus(id) : null,
        events: eventsIn(id).map((e) => `${e.name} ${formatTime(e.left)}`), // laufende Events: leuchtender Rahmen
        wip: !!l.wip, // noch in Arbeit (Hinweis auf dem Schild)
        locked: !isUnlocked(l.unlockWith ?? id), // noch nicht freigeschaltet (Mavis Geschichte; das Expeditions-Camp mit seiner Welt)
        parts: isPark(id) ? PARK_LEVELS.map((p) => ({ id: p, name: LEVELS[p].part.name, icon: LEVELS[p].part.icon, main: p === id, locked: !isUnlocked(p), event: eventsIn(p).length > 0 })) : null,
      }));
    const at = LEVEL_ID;
    this.scene.pause();
    openTravelMap(
      places,
      at,
      (id) => {
        // Welt mit Expedition (Savanne): erst noch wählen – frei erkunden oder auf Expedition
        const camp = Object.entries(LEVELS).find(([, l]) => l.camp && l.expedition === id)?.[0];
        if (camp) return this.chooseTrip(id, camp);
        this.scene.resume();
        this.travelTo(id);
      },
      () => this.scene.resume(),
      this.mavi.mapHint(), // Mavi: Pfeil dorthin, wo es weitergeht
    );
  }

  // Weltkarte, Welt mit Expedition: Erkundung (die offene Welt, so lange man will) oder Expedition (Camp, mehrere Maps)
  chooseTrip(world, camp) {
    openChoice(
      `<h2>${LEVELS[world].name}</h2>`,
      [
        { icon: iconImg('trip_explore'), label: tr('Erkundung', 'Explore'), text: tr('Frei herumstreifen – bleib, so lange du willst.', 'Roam freely – stay as long as you like.') },
        // erst nach Mavis Tutorial (bis dahin als Vorschau ausgegraut)
        activeStep()
          ? { icon: iconImg('trip_expedition'), label: tr('Expedition', 'Expedition'), text: tr('Erst Tutorial abschließen', 'Finish the tutorial first'), disabled: true }
          : { icon: iconImg('trip_expedition'), label: tr('Expedition', 'Expedition'), text: tr(`${RUN_LENGTH} Maps hintereinander, mit Wagen und Belohnung am Ziel.`, `${RUN_LENGTH} maps in a row, with a wagon and a reward at the end.`) },
      ],
      (i) => {
        this.scene.resume();
        this.travelTo(i === 0 ? world : camp);
      },
      () => this.scene.resume(),
    );
  }

  // Schnellreise: wie ein Gebietswechsel (Tiere kommen mit), Ankunft vor dem Auto im Zielgebiet
  travelTo(target) {
    if (LEVELS[target].camp) startRun(LEVELS[target].expedition); // ins Expeditions-Camp: ein neuer Run beginnt
    if (this.cache.audio.exists('car')) this.sound.play('car', { volume: CAR_VOLUME }); // Motor springt an
    game.scooterRiding = false; // mit dem Auto reist man zu Fuß, der Roller bleibt im Park
    const car = LEVELS[target].car;
    this.leaveLevel({ to: target, arrive: car.arrive ?? { tx: car.tx + 1, ty: car.ty + 1 }, label: LEVELS[target].name });
  }

  // Tierpark: alle Tiere, die einem folgen, ziehen sofort in ihr Gehege ein – bevorzugt in das ihrer Herkunftswelt.
  // Gibt den Zusatz für die Meldung beim Ankommen zurück.
  moveFollowersIntoPens() {
    const moved = [];
    this.aquaNowFull = []; // Becken und Terrarien, die durch das Einliefern voll geworden sind (für die Erfolgsmeldung)
    if (isPark(LEVEL_ID)) this.releaseHomeless();
    const fish = isPark(LEVEL_ID) ? [...Object.keys(HOUSES).map((h) => this.sendToHouse(h)), ...PARK_LEVELS.filter((l) => l !== LEVEL_ID).map((l) => this.sendToSection(l))].join('') : '';
    const fullBefore = new Set(ENCLOSURES.filter((e) => isFull(this.animals, e)));
    for (const a of [...this.followers]) {
      const fitting = ENCLOSURES.filter((e) => accepts(e, a.species));
      const e = houseOf(a.species) ? this.tankFor(a, fitting) : this.pickPen(fitting, a);
      if (!e) continue;
      this.placeInPen(a, e);
      this.followers.splice(this.followers.indexOf(a), 1);
      moved.push(a.species);
      this.releaseExtra(e);
    }
    const nowFull = [...(this.aquaNowFull ?? []), ...ENCLOSURES.filter((e) => isFull(this.animals, e) && !fullBefore.has(e))]; // auch volle Becken im Aquarium
    this.aquaNowFull = [];
    nowFull.forEach((e, i) => this.time.delayedCall(1400 + i * 3200, () => this.showPenFull(e)));
    const tank = LEVEL_ID === 'aquarium';
    const home = moved.length === 1
      ? tr(`Dein Tier ist ${tank ? 'ins Becken' : 'in sein Gehege'} gezogen.`, `Your animal moved into its ${tank ? 'tank' : 'enclosure'}.`)
      : tr(`Deine Tiere sind ${tank ? 'in die Becken' : 'in ihre Gehege'} gezogen.`, `Your animals moved into their ${tank ? 'tanks' : 'enclosures'}.`);
    let text = moved.length ? `<br>${animalIcons(moved, 2.6)}<br>${home}` : '';
    if (this.released?.length) {
      const hearts = this.released.reduce((s, r) => s + r.hearts, 0);
      const n = this.released.length;
      const released = n === 1 ? tr('wurde im Naturreservat ausgewildert', 'was released into the nature reserve') : tr('wurden im Naturreservat ausgewildert', 'were released into the nature reserve');
      text += `<br>🌳 ${animalIcons(this.released.map((r) => r.species), 2.2)} ${released} · <span class="heart">♥</span> ${hearts}`;
      this.released = [];
    }
    return fish + text;
  }

  // Tierpark: gefangene Meerestiere (Riff-Fische, Seepferdchen) kommen gleich beim Betreten ins Aquarium, Schlangen und
  // Vogelspinnen ins Reptilienhaus (in dessen gespeicherten Stand), in die passenden Becken bzw. Terrarien wie in tankFor.
  // Ist alles voll, zieht dort eines der häufigsten Art ins Naturreservat. Gibt den Text für die Meldung zurück.
  sendToHouse(level) {
    const fish = this.followers.filter((a) => HOUSES[level].includes(a.species));
    if (!fish.length) return '';
    const saved = (game.levels[level] ??= { animals: [], pickups: [] });
    const allTanks = houseTanks(level);
    // im Becken mit eigenen Plätzen je Art zählt nur die eigene Art
    const inside = (t, species) => saved.animals.filter((s) => s.state === 'penned' && tankOf(allTanks, s) === t && (!t.e.quota || s.species === species));
    // voll: alle Plätze belegt (im Becken mit Plätzen je Art: jede Art für sich)
    const tankFull = (t) => (t.e.quota ? Object.keys(t.e.quota) : [null]).every((sp) => inside(t, sp).length >= t.capFor(sp));
    const fullBefore = new Set(allTanks.filter(tankFull));
    this.released ??= [];
    const delivered = [];
    for (const a of fish) {
      const tanks = allTanks.filter((t) => accepts(t.e, a.species));
      if (!tanks.length) continue;
      const same = (t) => inside(t, a.species).filter((s) => s.species === a.species && s.variant === a.variant).length;
      const room = (t) => t.capFor(a.species) - inside(t, a.species).length;
      const t = [...tanks].sort((p, q) => (room(q) > 0) - (room(p) > 0) || same(q) - same(p) || room(q) - room(p))[0];
      if (room(t) <= 0) {
        // voll: wie bei releaseExtra – seltene Skins bleiben, sonst zieht vom häufigsten Aussehen (nicht dem des neuen Tiers,
        // falls möglich) das älteste aus. Aussehen: Skin, Farbvariante (Riff-Fische) oder Tierart (Kraken haben keine Variante)
        const list = inside(t, a.species).filter((s) => !s.baby);
        const pool = list.some((s) => !s.skin) ? list.filter((s) => !s.skin) : list;
        const look = (s) => String(s.skin ?? s.variant ?? s.species);
        const counts = {};
        for (const s of pool) counts[look(s)] = (counts[look(s)] ?? 0) + 1;
        const most = Object.keys(counts).sort((u, v) => (u === look(a)) - (v === look(a)) || counts[v] - counts[u])[0];
        const victim = pool.filter((s) => look(s) === most).sort((u, v) => (u.since ?? 0) - (v.since ?? 0))[0];
        if (victim) {
          saved.animals.splice(saved.animals.indexOf(victim), 1);
          const hearts = releaseHearts(victim.species, victim.skin ?? victim.variant);
          this.addHearts(hearts, victim.species);
          this.released.push({ species: victim.species, hearts });
        }
      }
      const p = tileToWorld(Phaser.Math.FloatBetween(t.tx0 - 0.3, t.tx1 + 0.3), Phaser.Math.FloatBetween(t.ty0 - 0.3, t.ty1 + 0.3));
      saved.animals.push({ species: a.species, variant: a.variant, skin: a.skin ?? null, since: Date.now(), state: 'penned', x: p.x, y: p.y });
      this.followers.splice(this.followers.indexOf(a), 1);
      this.animals.splice(this.animals.indexOf(a), 1);
      a.destroy();
      delivered.push(a.species);
    }
    if (!delivered.length) return '';
    this.aquaNowFull.push(...allTanks.filter((t) => tankFull(t) && !fullBefore.has(t)).map((t) => t.e));
    const kinds = HOUSES[level].filter((s) => delivered.includes(s)).map((s) => `${animalIcon(s, 2.6)} × ${delivered.filter((d) => d === s).length}`);
    const one = delivered.length === 1;
    const swims = one
      ? tr('Dein Fang schwimmt jetzt im Aquarium.', 'Your catch is swimming in the aquarium now.')
      : tr('Deine Fänge schwimmen jetzt im Aquarium.', 'Your catches are swimming in the aquarium now.');
    return `<br>${kinds.join(' ')}<br>${swims}`;
  }

  // Tierpark: Tiere, deren Gehege in einem anderen Abschnitt liegt, ziehen gleich dorthin (in dessen gespeicherten Stand,
  // noch ohne Platz: pending; beim nächsten Besuch kommen sie ins Gehege, siehe create). Gibt den Text für die Meldung zurück.
  sendToSection(level) {
    const sent = this.followers.filter((a) => !houseOf(a.species) && parkPenFor(a.species, a.origin, (l) => this.speciesIn(l, a.species))?.level === level);
    if (!sent.length) return '';
    const saved = (game.levels[level] ??= { animals: [], pickups: [] });
    for (const a of sent) {
      saved.animals.push({ species: a.species, variant: a.variant, skin: a.skin ?? null, ...(a.uid != null ? { uid: a.uid } : {}), since: Date.now(), state: 'penned', pending: true, origin: a.origin });
      this.followers.splice(this.followers.indexOf(a), 1);
      this.animals.splice(this.animals.indexOf(a), 1);
      a.destroy();
    }
    const one = sent.length === 1;
    const where = LEVELS[level].part.name;
    return `<br>${animalIcons(sent.map((a) => a.species), 2.6)}<br>${tr(
      `${one ? 'Dein Tier ist' : 'Deine Tiere sind'} in den Tierpark-Bereich „${where}“ gezogen.`,
      `${one ? 'Your animal moved' : 'Your animals moved'} to the zoo area “${where}”.`,
    )}`;
  }

  // Tierpark: beim Verlassen eines Abschnitts merken, wie viele Herzen er pro Minute bringt (wie viele Besucher die Tiere anlocken, ein halbes
  // Herz pro Besucher und Minute) – auch für die Zeit, in der das Tierbaby-Event bzw. der Eisstand läuft – und welche
  // Tierarten wie viel dazu beitragen (für die Statistik)
  parkIncomeRates() {
    const adults = this.animals.filter((a) => a.state === 'penned' && !a.baby);
    const score = parkScore(adults);
    const plan = babyPlan(adults);
    const babies = plan.length;
    // der Baby-Bonus gilt nur für den Anteil der Besucher, die zu Gehegen mit Babys gehen
    const babyPens = [...new Set(plan.map((b) => b.enclosure))];
    const babyTotal = score + babies * BABY_APPEAL;
    const babyShare = babyTotal > 0 ? (babyPens.reduce((s, e) => s + penScore(adults, e), 0) + babies * BABY_APPEAL) / babyTotal : 0;
    const cap = parkCap(LEVEL_ID); // mit Riesenrad mehr Besucher
    const shops = shopsIn(LEVEL_ID).map(({ kind }) => ({ kind, rate: maxVisitors(score, cap) * AWAY_BUYS_PER_VISITOR_MINUTE * shopDef(kind).hearts }));
    if (hasWheel(LEVEL_ID)) shops.push({ kind: WHEEL.id, rate: maxVisitors(score, cap) * AWAY_RIDES_PER_VISITOR_MINUTE * WHEEL.hearts });
    if (LEVEL.teaHouse) shops.push({ kind: TEA.id, rate: maxVisitors(score, cap) * AWAY_BUYS_PER_VISITOR_MINUTE * TEA_CHANCE / SHOP_CHANCE * TEA.hearts }); // Teehaus (Bambuswald)
    return {
      normal: maxVisitors(score, cap) * AWAY_HEARTS_PER_VISITOR_MINUTE,
      babies: maxVisitors(babyTotal, cap) * AWAY_HEARTS_PER_VISITOR_MINUTE * (1 + BABY_BONUS * babyShare),
      ice: LEVEL.iceStand ? maxVisitors(score, cap) * AWAY_ICE_PER_VISITOR_MINUTE : 0, // der Eiswagen steht nur im Zentrum
      // feste Buden und Riesenrad: Herzen pro Minute je Bude
      shops,
      split: splitHearts(adults, 1000), // Anteile je Tierart
    };
  }

  // Tierpark: solange man woanders ist, kommen die Herzen seiner Abschnitte laufend dazu (wie beim Aquarium); Events, die in
  // der Zeit beginnen oder enden, zählen mit. game.parkIncome: { Abschnitt: Werte aus parkIncomeRates }
  parkIncome(dt) {
    const rates = Object.entries(game.parkIncome ?? {}).filter(([level]) => level !== LEVEL_ID).map(([, r]) => r);
    if (!rates.length) return;
    const sum = (key) => rates.reduce((s, r) => s + r[key], 0);
    const perMinute = isActive('babies') ? sum('babies') : sum('normal');
    this.parkHearts = (this.parkHearts ?? 0) + (perMinute / 60) * dt;
    this.iceHearts = (this.iceHearts ?? 0) + (isActive('icecream') ? sum('ice') / 60 : 0) * dt;
    if (this.iceHearts >= 1) {
      this.iceHearts -= 1;
      this.addHearts(1, 'icecream');
    }
    this.shopHearts ??= {};
    for (const r of rates) {
      for (const { kind, rate } of r.shops ?? []) {
        this.shopHearts[kind] = (this.shopHearts[kind] ?? 0) + (rate / 60) * dt;
        if (this.shopHearts[kind] < 1) continue;
        this.shopHearts[kind] -= 1;
        this.addHearts(1, kind);
      }
    }
    if (this.parkHearts < 1) return;
    this.parkHearts -= 1;
    // für die Statistik: eine Tierart, je nach ihrem Anteil
    const shares = rates.flatMap((r) => Object.entries(r.split ?? {}));
    let pick = Math.random() * shares.reduce((s, [, n]) => s + n, 0);
    const from = shares.find(([, n]) => (pick -= n) <= 0)?.[0] ?? null;
    this.addHearts(1, from);
  }

  // Aquarium: solange man woanders ist, locken die Tiere in den Becken weiter Besucher an. Die Herzen kommen laufend dazu
  // (so viele wie bei den Herzen der Abwesenheit im Tierpark: ein halbes Herz pro Besucher und Minute)
  // (genauso das Reptilienhaus: houseIncome(level, dt) für jedes Haus, in dem man gerade nicht ist)
  houseIncome(level, dt) {
    const saved = game.levels[level]?.animals ?? [];
    if (!saved.length) return;
    const st = ((this.houseStats ??= {})[level] ??= { timer: 0, hearts: 0, rate: 0, penned: [] });
    st.timer -= dt;
    if (st.timer <= 0) {
      // Anziehung wie im Haus selbst: Summe je Becken, volle Becken zählen mehr
      st.timer = 5;
      const tanks = houseTanks(level);
      st.penned = saved.filter((s) => s.state === 'penned' && !s.baby);
      // Tierbaby-Event (im Aquarium): je 2 Tiere einer Familie in einem Becken ein Baby – das lockt wie im Tierpark mehr
      // Besucher an, und die geben mehr (siehe parkIncomeRates)
      const babyTime = eventsIn(level).some((e) => e.id === 'babies');
      let babies = 0;
      let babyScore = 0; // Anziehung der Becken mit Babys (nur dort gibt es den Baby-Bonus)
      const score = tanks.reduce((sum, t) => {
        const list = st.penned.filter((s) => tankOf(tanks, s) === t);
        let n = 0;
        if (babyTime) {
          const fam = {};
          for (const a of list) if (babyFamily(a.species)) fam[babyFamily(a.species)] = (fam[babyFamily(a.species)] ?? 0) + 1;
          n = Object.values(fam).reduce((m, k) => m + Math.floor(k / 2), 0);
          babies += n;
        }
        const raw = list.reduce((s, a) => s + appeal(a), 0);
        const score = list.length >= t.cap ? raw * FULL_BONUS : raw;
        if (n) babyScore += score + n * BABY_APPEAL;
        return sum + score;
      }, 0);
      const total = score + babies * BABY_APPEAL;
      st.rate = babies
        ? (maxVisitors(total, HOUSE_VISITORS[level]) * AWAY_HEARTS_PER_VISITOR_MINUTE * (1 + BABY_BONUS * (babyScore / total))) / 60
        : (maxVisitors(score, HOUSE_VISITORS[level]) * AWAY_HEARTS_PER_VISITOR_MINUTE) / 60;
    }
    st.hearts += st.rate * dt;
    if (st.hearts < 1) return;
    st.hearts -= 1;
    // für die Statistik: eine Tierart aus dem Haus, je nach Anziehung
    let r = Math.random() * st.penned.reduce((s, a) => s + appeal(a), 0);
    const from = st.penned.find((a) => (r -= appeal(a)) <= 0) ?? st.penned[0];
    this.addHearts(1, from?.species ?? null);
  }

  // Schildkröte im Netz: ein Schnitt mit der Schere (siehe ScissorsTool); nach dem dritten ist sie frei und schwimmt hinterher
  cutNet(t) {
    if (t.cut()) {
      this.catchAnimal(t);
      this.showToast(`${animalIcon('turtle', 3.2)} ${tr('Geschafft – die Meeresschildkröte ist frei! Sie schwimmt dir dankbar hinterher.', 'You did it – the sea turtle is free! It gratefully swims after you.')}`);
    } else if (t.cuts === 1) {
      const left = CUTS_NEEDED - t.cuts;
      this.showToast(tr(`✂️ Das Netz reißt! Noch ${left}-mal schneiden.`, `✂️ The net is tearing! ${left} more ${left === 1 ? 'cut' : 'cuts'}.`));
    }
    this.updateToolbar();
  }

  // Quallen-Schwarm im Riff: Quallen kommen nach, solange das Event läuft (beim Ankommen gleich ein paar), danach sind sie
  // fort. Berührt man eine, brennt es.
  updateJellies(dt) {
    if (!LEVEL.sea) return;
    const wild = this.animals.filter((a) => a.species === 'jellyfish' && a.state === 'wild');
    if (!isActive('jellyfish')) {
      for (const a of wild) this.despawn(a);
      return;
    }
    this.jellyTimer = (this.jellyTimer ?? 0) - dt;
    const want = this.jellyStarted ? 1 : JELLY_START - wild.length;
    this.jellyStarted = true;
    if (this.jellyTimer <= 0 || want > 1) {
      this.jellyTimer = Phaser.Math.FloatBetween(...JELLY_EVERY);
      for (let i = 0; i < want && wild.length + i < JELLY_MAX; i++) {
        const t = this.randomFreeTile([worldToTile(this.player.x, this.player.y), ...TOOL_SPOTS]);
        const p = tileToWorld(t.tx, t.ty);
        const [a] = this.finishSpawn([this.createAnimal('jellyfish', p.x, p.y)], true);
        a.life = Infinity; // bleibt bis zum Ende des Events
      }
    }
    // Brennen: zu nah an einer Qualle (gefangene in der Hand brennen nicht mehr)
    const p = this.player;
    const hit = wild.find((a) => this.animals.includes(a) && Math.hypot(a.x - p.x, (a.y - p.y) * 2) < STING_DIST);
    if (hit && p.sting()) {
      const t = this.add.text(p.x, p.y - 60, tr('Autsch!', 'Ouch!'), { fontFamily: 'Trebuchet MS, Arial', fontSize: '13px', fontStyle: 'bold', color: '#ffffff', stroke: '#c8303a', strokeThickness: 3, resolution: 4 }).setOrigin(0.5).setDepth(100000);
      this.tweens.add({ targets: t, y: t.y - 18, alpha: 0, duration: 900, onComplete: () => t.destroy() });
      if (this.time.now - (this.stingHintAt ?? -Infinity) > STING_HINT_EVERY) {
        this.stingHintAt = this.time.now;
        this.showToast(`${animalIcon('jellyfish', 3)} ${tr('Autsch – Quallen brennen! Nicht anfassen, nimm das Quallenglas.', 'Ouch – jellyfish sting! Don’t touch them, use the jellyfish jar.')}`);
      }
    }
  }

  // Aquarium: abgedunkelte Räume (Gebäude mit dark, außer den Becken darin). Eine dunkle Fläche über Boden und Wänden;
  // die Quallen im Becken dort leuchten darüber (siehe Jellyfish.js), die Schilder liegen ebenfalls darüber
  drawDarkRooms() {
    for (const h of buildings().filter((b) => b.dark && b.style !== 'tank')) {
      const W = (tx, ty, up = 0) => {
        const q = tileToWorld(tx, ty);
        return { x: q.x, y: q.y - up };
      };
      // nur an der Rückwand nach oben (dahinter ist nichts); an der Seite zum Nachbarraum nicht, sonst würde der mit abgedunkelt
      const UP = 150;
      const [x0, y0, x1, y1] = [h.tx0 - 0.5, h.ty0 - 0.5, h.tx1 + 0.5, h.ty1 + 0.5];
      this.add
        .graphics()
        .setDepth(DARK_DEPTH)
        .fillStyle(0x040818, 0.62)
        .fillPoints([W(x0, y0, UP), W(x1, y0, UP), W(x1, y0), W(x1, y1), W(x0, y1), W(x0, y0)], true);
    }
  }

  // Kanu: am Steg einsteigen bzw. an einem Steg aussteigen
  useBoat() {
    if (this.nearBoat === 'board') this.boat.board();
    else this.boat.land();
    if (this.cache.audio.exists('whoosh')) this.sound.play('whoosh', { volume: 0.2, detune: -600 });
    this.nearBoat = null;
    this.boat.near = null;
    this.updateToolbar();
  }

  // Wasserfall: am Fuß steigt feiner Sprühnebel auf (weiche, helle Wölkchen, die nach oben treiben und verblassen)
  waterfallSpray(x, y) {
    if (!this.cameras.main.worldView.contains(x, y - 60)) return; // nur, wenn man es sieht
    const puff = this.add
      .image(x + Phaser.Math.Between(-40, 40), y + Phaser.Math.Between(-6, 16), glowTexture(this))
      .setTint(0xdcecf4)
      .setAlpha(0)
      .setScale(Phaser.Math.FloatBetween(0.5, 0.9))
      .setDepth(y + 20);
    this.tweens.add({ targets: puff, alpha: Phaser.Math.FloatBetween(0.45, 0.7), duration: 350 });
    this.tweens.add({
      targets: puff,
      y: puff.y - Phaser.Math.Between(60, 120),
      x: puff.x + Phaser.Math.Between(-20, 20),
      scale: puff.scale * 2,
      duration: Phaser.Math.Between(1800, 2800),
      ease: 'Sine.easeOut',
    });
    this.tweens.add({ targets: puff, alpha: 0, delay: 700, duration: 1800, onComplete: () => puff.destroy() });
  }

  // Wasserfall (Dschungel): rauscht lauter, je näher man ihm kommt
  updateWaterfallSound() {
    if (!this.waterfalls.length) return;
    const key = 'ambient_waterfall';
    if (!this.cache.audio.exists(key)) {
      if (this.waterfallLoading) return;
      this.waterfallLoading = true;
      this.load.audio(key, `assets/sounds/${key}.mp3`);
      this.load.start();
      return;
    }
    if (!this.waterfallSound) {
      this.waterfallSound = this.sound.add(key, { loop: true, volume: 0 });
      this.waterfallSound.play();
      this.events.once('shutdown', () => {
        this.waterfallSound?.destroy();
        this.waterfallSound = null;
      });
    }
    const p = this.player;
    const d = Math.min(...this.waterfalls.map((w) => Math.hypot(p.x - w.x, (p.y - w.y) * 2)));
    const k = Math.max(0, 1 - d / WATERFALL_HEAR);
    this.waterfallSound.setVolume(WATERFALL_VOLUME * k * k);
  }

  // Zone mit eigenem Hintergrundgeräusch: Moor im Wald (LEVEL.ambientZone), Hochebene im Bambuswald (LEVEL.snowline,
  // dort die Eiswelt-Geräusche). Je näher man ihr kommt, desto lauter ihr Geräusch und desto leiser das normale
  zoneAmbient() {
    if (LEVEL.ambientZone) return LEVEL.ambientZone;
    if (LEVEL.snowline && LEVEL.ambient !== ZONE_SNOW) return { sound: ZONE_SNOW, snowline: LEVEL.snowline };
    return null;
  }

  // wie sehr man in der Zone ist (0 bis 1)
  zoneMix(zone) {
    const { tx, ty } = worldToTile(this.player.x, this.player.y);
    if (zone.snowline) {
      const { full, band } = zone.snowline;
      return Phaser.Math.Clamp((full + band - ty) / band, 0, 1);
    }
    const a = zone.area;
    const d = Math.hypot(Math.max(a.tx0 - tx, 0, tx - a.tx1), Math.max(a.ty0 - ty, 0, ty - a.ty1));
    return Phaser.Math.Clamp(1 - d / zone.fade, 0, 1);
  }

  updateZoneAmbient() {
    const zone = this.zoneAmbient();
    if (!zone || this.leaving || this.resting) return;
    const key = zone.sound;
    if (!this.cache.audio.exists(key)) {
      if (this.zoneLoading) return;
      this.zoneLoading = true;
      this.load.audio(key, `assets/sounds/${key}.mp3`);
      this.load.start();
      return;
    }
    if (!this.zoneSound) {
      this.zoneSound = this.sound.add(key, { loop: true, volume: 0 });
      this.zoneSound.play();
      this.zoneLevel = this.zoneMix(zone);
      this.events.once('shutdown', () => {
        this.zoneSound?.destroy();
        this.zoneSound = null;
      });
    }
    // sanft nachziehen (kein Sprung beim Betreten oder an einer Kachelgrenze)
    const k = this.zoneMix(zone);
    this.zoneLevel += (k - this.zoneLevel) * Math.min(1, this.game.loop.delta / 800);
    const z = this.zoneLevel;
    this.zoneSound.setVolume(ZONE_VOLUME * z);
    // das normale Geräusch leiser (nicht, solange es gerade ein- oder ausgeblendet wird)
    if (ambient && ambient.key === this.ambientKey() && !this.tweens.isTweening(ambient)) {
      ambient.setVolume(this.ambientVolume(ambient.key, z));
    }
  }

  // Im Bett ausruhen: Henrik schläft ein und wacht in der nächsten Wetterphase des Gebiets wieder auf (Savanne, Dschungel)
  rest() {
    if (!SEASON_LEVELS.includes(LEVEL_ID)) return this.showToast(tr('💤 Du ruhst dich kurz aus.', '💤 You take a short rest.'));
    const bed = this.nearBed;
    this.resting = true;
    this.leaving = true; // solange er schläft, steht alles still
    // Henrik liegt im Bett (eigenes Bild), die Figur und was er trägt verschwinden
    if (bed.img && this.textures.exists(`${bed.key}_sleep`)) bed.img.setTexture(`${bed.key}_sleep`);
    this.player.sprite?.setVisible(false);
    this.player.shadow?.setVisible(false);
    this.tool?.sprite?.setVisible(false);
    // über ihm steigen langsam Zs auf
    const head = bed.head ?? tileToWorld(bed.tx, bed.ty);
    let n = 0;
    this.time.addEvent({
      delay: 650,
      repeat: Math.floor(SLEEP_FADE / 650),
      callback: () => {
        const z = this.add.text(head.x + (n % 2 ? 4 : -2), head.y, 'Z', { fontFamily: '"Trebuchet MS", Arial, sans-serif', fontStyle: 'bold', fontSize: '14px', color: '#fff8e6', stroke: '#2b1d14', strokeThickness: 3 }).setOrigin(0.5).setDepth(head.y + 99999).setScale(0.6 + (n % 3) * 0.2);
        n++;
        this.tweens.add({ targets: z, x: z.x + 14, y: z.y - 34, scale: z.scale * 1.6, alpha: { from: 1, to: 0 }, duration: 2200, ease: 'Sine.easeOut', onComplete: () => z.destroy() });
      },
    });
    // das Bild wird langsam schwarz; dann ist das Wetter eine Phase weiter (Umbau siehe updateSeason)
    this.cameras.main.fadeOut(SLEEP_FADE, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.leaving = false;
      skipSeason(LEVEL_ID);
      this.seasonTimer = 0;
    });
  }

  // Wetterphase gewechselt (Uhr oder ausgeschlafen im Bett): das Gebiet neu aufbauen, man bleibt
  // an seinem Platz, die Tiere, die einem folgen, kommen mit; die wilden Tiere der alten Phase sind weg
  updateSeason(dt) {
    this.seasonTimer -= dt;
    if (this.seasonTimer > 0) return;
    this.seasonTimer = 1;
    if (!SEASON_LEVELS.includes(LEVEL_ID) || this.leaving) return;
    const now = seasonState(LEVEL_ID);
    if (now.id === LEVEL.season) return;
    this.leaving = true;
    if (this.toolId === 'bone' && now.id !== 'dry') {
      this.returnTool('bone'); // die Knochen gibt es nur in der Trockenzeit
      this.tool.destroy();
      this.tool = null;
      this.toolId = null;
    }
    this.saveLevelState();
    game.levels[LEVEL_ID].animals = game.levels[LEVEL_ID].animals.filter((a) => a.state !== 'wild');
    const arrive = worldToTile(this.player.x, this.player.y);
    const text = LEVEL_ID === 'ice' ? {
      night: tr('🌙 Es wird Nacht. Das Meer friert zu – jetzt kommst du zu Fuß auf die Inseln. Aber es ist eisig kalt: wärm dich zwischendurch in der Forschungsstation auf!', '🌙 Night is falling. The sea is freezing over – now you can walk to the islands. But it is icy cold: warm up at the station now and then!'),
      day: tr('☀️ Es wird Tag. Das Eis bricht auf – zu den Inseln fahren jetzt wieder die Eisschollen.', '☀️ Day is breaking. The ice is breaking up – ice floes ferry you to the islands again.'),
    }[now.id] : LEVEL_ID === 'jungle' ? {
      rain: tr('🌧️ Starkregen im Dschungel! Es prasselt und donnert.', '🌧️ Heavy rain in the jungle! It is pouring and thundering.'),
      fog: tr('🌫️ Über dem Fluss steigt Nebel auf – man sieht kaum noch etwas.', '🌫️ Fog is rising over the river – you can hardly see anything.'),
      normal: tr('🌿 Im Dschungel ist wieder normales Wetter.', '🌿 The jungle is back to normal weather.'),
    }[now.id] : {
      rain: tr('🌧️ Starkregen! Die Wasserlöcher laufen voll – jetzt kommen Nilpferde, Lungenfische und Schuhschnäbel.', '🌧️ Heavy rain! The waterholes are filling up – now hippos, lungfish and shoebills are coming.'),
      dry: tr('☀️ Trockenzeit! Die Wasserlöcher trocknen aus – Geier kreisen, Warzenschweine graben, und am Elefantenfriedhof kichern Hyänen.', '☀️ Dry season! The waterholes are drying up – vultures circle, warthogs dig, and hyenas are giggling at the elephant graveyard.'),
      normal: tr('🌿 In der Savanne ist wieder normales Wetter.', '🌿 The savanna is back to normal weather.'),
    }[now.id];
    writeSave(LEVEL_ID);
    // nach dem Schlafen: langsam dunkel, und beim Aufwachen steht dabei, dass man ausgeschlafen hat
    const restart = () => {
      showLoading(this.resting ? tr('Du schläfst … 💤', 'You are sleeping … 💤') : tr('Das Wetter wechselt …', 'The weather is changing …'));
      const note = this.resting ? `${tr('😴 Ausgeschlafen!', '😴 Well rested!')} ${text}` : text;
      afterPaint(() => this.scene.restart({ level: LEVEL_ID, arrive, seasonNote: note }));
    };
    if (this.resting) return restart(); // eingeschlafen: das Bild ist schon schwarz (siehe rest)
    this.cameras.main.fadeOut(400);
    this.cameras.main.once('camerafadeoutcomplete', restart);
  }

  // Kälte in der Eiswelt (nachts, LEVEL.cold): draußen kühlt Henrik langsam aus (game.cold von 0 bis 1 in cold.minutes
  // Minuten), ist ihm zu kalt, fängt er keine Tiere mehr (tooCold). In der Station und direkt davor wird er schnell wieder warm.
  // Er wird dabei immer bläulicher, sein Atem dampft (je kälter, desto stärker), und durchgefroren zittert er. Am Tag
  // ist er warm.
  updateCold(dt) {
    const c = LEVEL.cold;
    const p = this.player;
    if (!c) {
      if (game.cold) game.cold = 0;
      return;
    }
    const before = game.cold ?? 0;
    const { tx, ty } = worldToTile(p.x, p.y);
    const warm = !!buildingAt(tx, ty, 1);
    const cold = warm ? Math.max(0, before - dt / c.warmSeconds) : Math.min(1, before + dt / (c.minutes * 60));
    game.cold = cold;
    if (before < COLD_WARN && cold >= COLD_WARN) this.showToast(tr('🥶 Henrik wird kalt! Wärm dich bald in der Station auf.', '🥶 Henrik is getting cold! Warm up at the station soon.'));
    if (before < 1 && cold >= 1) {
      this.showToast(tr('🥶 Henrik ist durchgefroren – mit klammen Fingern fängt er keine Tiere. Ab in die Station zum Aufwärmen!', '🥶 Henrik is frozen through – with numb fingers he cannot catch animals. Off to the station to warm up!'));
      this.updateEventBanner();
    }
    if (before >= COLD_WARN && cold < COLD_WARN && warm) {
      this.showToast(tr('☀️ Henrik ist wieder schön warm.', '☀️ Henrik is nice and warm again.'));
      this.updateEventBanner();
    }
    // bläulich (ab der Hälfte), zittern und Atemwölkchen (durchgefroren)
    const k = Phaser.Math.Clamp((cold - 0.5) * 2, 0, 1);
    if (k > 0) {
      const tint = Phaser.Display.Color.Interpolate.ColorWithColor(Phaser.Display.Color.ValueToColor(0xffffff), Phaser.Display.Color.ValueToColor(COLD_TINT), 1, k);
      p.sprite.setTint(Phaser.Display.Color.GetColor(tint.r, tint.g, tint.b));
    } else if (before > 0.5) p.sprite.clearTint();
    if (cold >= 1) p.sprite.x += Math.sin(this.time.now / 22) * 0.9; // durchgefroren: zittert
    // Eisatem: nachts dampft bei jedem Ausatmen eine Wolke aus dem Mund, je kälter, desto öfter und größer (nicht in der
    // warmen Station)
    this.breathIn = (this.breathIn ?? Phaser.Math.FloatBetween(0.5, 1.5)) - dt;
    if (this.breathIn <= 0 && !warm) {
      this.breathIn = BREATH_EVERY - cold * 0.8;
      this.breathe(1 + cold * 0.7);
    }
    this.coldHintIn -= dt;
  }

  // eine Atemwolke vor Henriks Mund: weicher, heller Dunst, der in Blickrichtung schwebt, größer wird und verblasst
  // (von hinten gesehen hinter dem Kopf); size: 1 normal, größer, wenn ihm kälter ist
  breathe(size) {
    const p = this.player;
    const back = p.faceY < 0;
    const x = p.x + p.faceX * 7;
    const y = p.sprite.y - BREATH_UP - p.handLift;
    for (const [k, delay] of [[1, 0], [0.6, 120]]) {
      const puff = this.add.image(x, y, glowTexture(this)).setTint(0xf4faff).setAlpha(0).setScale(0.2 * k).setDepth(BREATH_DEPTH + (back ? -1 : 1));
      this.tweens.add({ targets: puff, alpha: { from: 1, to: 0 }, x: x + p.faceX * 18 * size * k, y: y - 6 - 4 * size, scale: BREATH_SIZE * size * k, delay, duration: 1300, ease: 'Sine.easeOut', onComplete: () => puff.destroy() });
    }
  }

  // zu kalt zum Fangen? (dann ein Hinweis, aber nicht bei jedem Versuch)
  tooCold() {
    if (!LEVEL.cold || (game.cold ?? 0) < 1) return false;
    if (this.coldHintIn <= 0) {
      this.coldHintIn = COLD_HINT_GAP;
      this.showToast(tr('🥶 Zu kalt! Mit klammen Fingern fängt Henrik nichts – wärm dich erst in der Station auf.', '🥶 Too cold! With numb fingers Henrik cannot catch anything – warm up at the station first.'));
    }
    return true;
  }

  // Knochen vor sich streuen (Werkzeug "Knochen"): lockt die Hyänen an, wenn sie gerade kichern; danach hat man gleich
  // das Lasso in der Hand (die Knochen kommen zurück in die Hütte)
  dropBones() {
    if (!this.hyenaPack) return;
    const p = this.player;
    const x = p.x + p.faceX * 18;
    const y = p.y + p.faceY * 9;
    if (!this.hyenaPack.dropBones(x, y)) return;
    if (this.cache.audio.exists('whoosh')) this.sound.play('whoosh', { volume: 0.3 });
    this.equipTool('lasso');
  }

  // Wetterphase eines Gebiets für die Weltkarte: Zeichen, Restzeit und was danach kommt (kurz, das Feld ist klein)
  seasonStatus(level) {
    const s = seasonState(level);
    const now = SEASON_INFO[s.id];
    const next = SEASON_INFO[s.next];
    return `<span title="${now.name} → ${next.name}">${now.icon} ${formatTime(s.left)} → ${next.icon}</span>`;
  }

  // Glühwürmchen-Abend im Bambuswald: Abendlicht, leuchtende Laternen, Glühwürmchen und rote Pandas in den Kirschbäumen
  updateFireflies(dt) {
    const lanterns = this.lanternEvening();
    const on = this.fireflyEvening() || lanterns;
    if (on && !this.fireflies) {
      // Laternenabend (Bambuswald im Tierpark): Abendlicht, Laternen, Teehaus und Glühwürmchen, aber keine wilden roten Pandas
      this.fireflies = new FireflyEvening(this, lanterns ? { pandas: false, props: LEVEL.props } : {});
      this.startAmbient(); // Abendgeräusche
    }
    if (!on && this.fireflies) {
      this.fireflies.destroy();
      this.fireflies = null;
      this.startAmbient();
      if (LEVEL.lanterns) {
        this.showToast(tr('🏮 Der Laternenabend ist vorbei.', '🏮 The Lantern Evening is over.'));
        return;
      }
      // Glas und leuchtendes Glas gibt es nur beim Event
      if (this.toolId === 'fireflyjar' || this.toolId === 'glowjar') {
        this.tool.destroy();
        this.tool = null;
        this.toolId = null;
        this.updateToolbar();
      }
      for (const p of this.pickups) if (p.tool === 'glowjar' && !p.collected) {
        p.collected = true;
        this.tweens.killTweensOf(p.sprite);
        for (const o of [p.sprite, p.shadow, ...p.extras]) o.destroy();
      }
      this.jarFlies = 0;
      this.showToast(tr('✨ Der Glühwürmchen-Abend ist vorbei – im Bambuswald wird es wieder hell.', '✨ The Firefly Evening is over – the bamboo forest is getting light again.'));
    }
    this.fireflies?.update(dt);
  }

  // Glühwürmchen ins Glas (siehe FireflyJar); mit JAR_FULL wird es zum leuchtenden Glas
  addJarFlies(n) {
    this.jarFlies += n;
    if (this.jarFlies < JAR_FULL) {
      this.showToast(tr(`✨ ${this.jarFlies} von ${JAR_FULL} Glühwürmchen im Glas`, `✨ ${this.jarFlies} of ${JAR_FULL} fireflies in the jar`));
      return;
    }
    this.jarFlies = 0;
    this.tool.destroy();
    this.tool = null;
    this.toolId = null;
    this.equipTool('glowjar');
    this.showToast(`${animalIcon('redpanda', 3.2)} ${tr('Das Glas leuchtet! Stell es vor einen Kirschbaum – dann klettert der rote Panda herunter.', 'The jar is glowing! Put it in front of a cherry tree – the red panda will climb down.')}`);
  }

  // leuchtendes Glas vor sich abstellen (danach Hände frei, um den Panda zu berühren; man hebt es wieder auf)
  // Banane vor sich ablegen (Dschungel); danach hat Henrik gleich das Lasso in der Hand (wie nach dem Knochenstreuen).
  // Liegt sie unten an einem Baum mit einem Brüllaffen, kommt er herunter (siehe Howler.js); sonst kann man sie wieder aufheben
  placeBanana() {
    const p = this.player;
    const x = p.x + p.faceX * 16;
    const y = p.y + p.faceY * 8;
    // nur direkt unter einem Baum, in dem gerade ein Brüllaffe sitzt (sonst legt man sie im Dickicht aus Versehen ab)
    const monkey = this.animals.some((a) => a instanceof Howler && a.state === 'wild' && a.phase === 'tree' && Math.hypot(x - a.x, (y - a.y) * 2) < LURE_DIST);
    if (!monkey) {
      if (this.time.now - (this.bananaTipAt ?? -1e9) > 4000) {
        this.bananaTipAt = this.time.now;
        this.showToast(`${animalIcon('howler', 3.2)} ${tr('Die Banane legst du direkt unter einen Baum, in dem ein Affe sitzt – hör und schau, wo sie hinspringen!', 'Put the banana right under a tree with a monkey in it – listen and watch where they jump!')}`);
      }
      return;
    }
    const banana = new Pickup(this, x, y, 'banana', 'banana', false);
    banana.temporary = true; // wird nicht gespeichert
    this.pickups.push(banana);
    this.tool.destroy(); // die Banane liegt jetzt am Boden (nicht zurück in die Kiste)
    this.tool = null;
    this.toolId = null;
    this.equipTool('lasso');
  }

  // Dickicht weggeschlagen (siehe Thicket.strike): manchmal schreckt eine Schlange oder Vogelspinne auf und flieht ins
  // nächste Dickicht – solange fängt man sie mit dem Kescher (siehe Critter.js)
  thicketCut(tx, ty) {
    if (this.expMap) return this.expThicketCut(tx, ty);
    if (Math.random() >= STARTLE_CHANCE || this.animals.some((a) => a instanceof Critter && a.phase === 'flee')) return;
    const { x, y } = tileToWorld(tx, ty);
    const a = this.createAnimal(randomCritter(), x, y);
    a.life = Infinity;
    a.rollSkin('wild'); // selten grün bzw. golden
    a.startle(tx, ty);
    const t = this.add.text(x, y - 30, '❗', { fontSize: '18px', resolution: 4 }).setOrigin(0.5).setDepth(100000);
    this.tweens.add({ targets: t, y: t.y - 14, alpha: 0, duration: 900, onComplete: () => t.destroy() });
    if (this.cache.audio.exists('tree_rustle')) this.sound.play('tree_rustle', { volume: 0.4, detune: 300 });
    if (!this.critterTip) {
      this.critterTip = true;
      this.showToast(`${animalIcon(a.species, 3.2)} ${tr('Aufgeschreckt! Schnell mit dem Kescher, bevor sie im Dickicht verschwindet!', 'Startled! Quick, use the net before it vanishes into the thicket!')}`);
    }
  }

  // Aras und Tukane fliegen los: ein kurzer Ruf (eigener Laut, falls es einen gibt, sonst der Flamingo höher), nur in der Nähe zu hören
  macawCall(a) {
    const k = Math.max(0, 1 - Math.hypot(this.player.x - a.x, (this.player.y - a.y) * 2) / MACAW_HEAR);
    if (k <= 0) return;
    const call = `animal_${a.species}`;
    if (this.cache.audio.exists(call)) this.sound.play(call, { volume: MACAW_VOLUME * k * k });
    else if (this.cache.audio.exists('animal_flamingo')) this.sound.play('animal_flamingo', { volume: MACAW_VOLUME * k * k, detune: 500 });
  }

  // eine Schlange oder Vogelspinne hat das Dickicht erreicht: weg
  critterHidden(a) {
    // Expedition: im neuen Dickicht versteckt – dort raschelt es jetzt (nichts geht verloren)
    if (this.expMap && this.thicket) {
      const { tx, ty } = worldToTile(a.x, a.y);
      const near = [...this.thicket.images.keys()].map((k) => k.split(',').map(Number)).filter(([x, y]) => this.thicket.stage(`${x},${y}`) === 2)
        .sort((u, v) => Math.hypot(u[0] - tx, u[1] - ty) - Math.hypot(v[0] - tx, v[1] - ty))[0];
      if (near) (this.expHidden ??= []).push({ species: a.species, tx: near[0], ty: near[1], skin: a.skin });
    }
    this.despawn(a);
  }

  // Expedition: Dickicht freigeschlagen – saß dort eine Schlange oder Spinne, schreckt sie sicher auf
  expThicketCut(tx, ty) {
    const i = (this.expHidden ?? []).findIndex((h) => h.tx === tx && h.ty === ty);
    if (i < 0) return;
    const [h] = this.expHidden.splice(i, 1);
    h.ghost?.destroy();
    const { x, y } = tileToWorld(tx, ty);
    const a = this.createAnimal(h.species, x, y);
    a.life = Infinity;
    if (h.skin === undefined) a.rollSkin('wild');
    else a.skin = h.skin;
    a.startle(tx, ty);
    const t = this.add.text(x, y - 30, '❗', { fontSize: '18px', resolution: 4 }).setOrigin(0.5).setDepth(100000);
    this.tweens.add({ targets: t, y: t.y - 14, alpha: 0, duration: 900, onComplete: () => t.destroy() });
    if (this.cache.audio.exists('tree_rustle')) this.sound.play('tree_rustle', { volume: 0.4, detune: 300 });
  }

  // ein Brüllaffe frisst die Banane: sie verschwindet
  eatBanana(banana) {
    banana.collected = true;
    this.tweens.killTweensOf(banana.sprite);
    banana.sprite.destroy();
    banana.shadow.destroy();
    for (const e of banana.extras) e.destroy();
  }

  // die Krone eines Urwaldbaums raschelt (ein Brüllaffe springt): sie wackelt kurz, und ein paar Blätter rieseln
  rustleCrown(tree) {
    const img = this.crownImages?.get(tree.tx + ',' + tree.ty);
    const { x, y } = tileToWorld(tree.tx, tree.ty);
    // Rascheln: nah laut, weiter weg leiser
    const near = Math.max(0, 1 - Math.hypot(this.player.x - x, (this.player.y - y) * 2) / RUSTLE_HEAR);
    if (near > 0 && this.cache.audio.exists('tree_rustle')) this.sound.play('tree_rustle', { volume: RUSTLE_VOLUME * near * near, detune: Phaser.Math.Between(-150, 150) });
    if (img) {
      this.tweens.killTweensOf(img);
      img.setAngle(0);
      this.tweens.add({ targets: img, angle: { from: -2.5, to: 2.5 }, duration: 90, yoyo: true, repeat: 3, ease: 'Sine.easeInOut', onComplete: () => img.setAngle(0) });
    }
    for (let i = 0; i < 7; i++) {
      const leaf = this.add.ellipse(x + Phaser.Math.Between(-24, 24), y - 104 + Phaser.Math.Between(-14, 14), 5, 3, Phaser.Utils.Array.GetRandom([0x2c7232, 0x3f8a3c, 0x5aa84c])).setDepth(y + 3);
      this.tweens.add({
        targets: leaf,
        y: leaf.y + Phaser.Math.Between(40, 80),
        x: leaf.x + Phaser.Math.Between(-14, 14),
        angle: Phaser.Math.Between(-180, 180),
        alpha: 0,
        duration: Phaser.Math.Between(800, 1300),
        onComplete: () => leaf.destroy(),
      });
    }
  }

  placeGlowJar() {
    const p = this.player;
    const x = p.x + p.faceX * 16;
    const y = p.y + p.faceY * 8;
    const jar = new Pickup(this, x, y, 'jar_glow', 'glowjar', false);
    jar.temporary = true; // wird nicht gespeichert
    jar.extras.push(this.add.image(x, y - 8, 'firefly_glow').setBlendMode(Phaser.BlendModes.ADD).setTint(0xe8ff80).setScale(1).setDepth(NIGHT_DEPTH + 2));
    this.pickups.push(jar);
    this.tool.destroy();
    this.tool = null;
    this.toolId = null;
    this.updateToolbar();
  }

  // Eicheln vor sich ablegen: direkt neben einem Laubhaufen für den Igel (danach der Kescher, siehe Hedgehog.js), sonst für
  // die Wildschweine (danach das Lasso, siehe Boar.js)
  placeAcorns() {
    const p = this.player;
    const x = p.x + p.faceX * 16;
    const y = p.y + p.faceY * 8;
    const pile = leafPiles(this).some((l) => Math.hypot(x - l.x, (y - l.y) * 2) < NUT_PLACE);
    const acorns = new Pickup(this, x, y, 'acorns', 'acorns', false);
    acorns.temporary = true; // wird nicht gespeichert
    acorns.forHedgehog = pile; // (dann wühlen keine Wildschweine darin)
    this.pickups.push(acorns);
    this.acornsAt = this.time.now;
    this.tool.destroy(); // die Eicheln liegen jetzt am Boden (nicht zurück in die Kiste)
    this.tool = null;
    this.toolId = null;
    this.equipTool(pile ? 'net' : 'lasso');
  }

  // An einer großen Eiche schütteln: die Krone wackelt, Eicheln prasseln herunter, Henrik hat eine Handvoll in der Hand
  shakeOak(oak) {
    this.oakShakeAt = this.time.now;
    const img = this.sway.plants.get(`${oak.tx},${oak.ty}`)?.img;
    if (img) {
      this.tweens.killTweensOf(img);
      this.tweens.add({ targets: img, angle: { from: -2.5, to: 2.5 }, duration: 90, yoyo: true, repeat: 3, onComplete: () => img.setAngle(0) });
    }
    for (let i = 0; i < 9; i++) {
      const sx = oak.x + Phaser.Math.Between(-34, 34), sy = oak.y - Phaser.Math.Between(50, 90);
      const nut = this.add.ellipse(sx, sy, 3.2, 4, 0xb48042).setStrokeStyle(0.8, 0x5a3c1e).setDepth(oak.y + 2);
      this.tweens.add({ targets: nut, y: oak.y + Phaser.Math.Between(-6, 12), x: sx + Phaser.Math.Between(-6, 6), delay: Phaser.Math.Between(0, 250), duration: Phaser.Math.Between(380, 520), ease: 'Quad.easeIn', onComplete: () => this.tweens.add({ targets: nut, alpha: 0, delay: 300, duration: 300, onComplete: () => nut.destroy() }) });
    }
    if (this.cache.audio.exists('whoosh')) this.sound.play('whoosh', { volume: 0.25, rate: 0.7 });
    this.time.delayedCall(450, () => this.equipTool('acorns'));
  }

  // alle großen Eichen der Karte (einmal je Map)
  oakList() {
    if (!this.oaks) {
      this.oaks = [];
      for (let ty = 0; ty < MAP_H; ty++) for (let tx = 0; tx < MAP_W; tx++) if (charAt(tx, ty) === 'Ø') this.oaks.push({ tx, ty, ...tileToWorld(tx, ty) });
    }
    return this.oaks;
  }

  // die nächste große Eiche, an der Henrik gerade schütteln kann (oder null) – jede Eiche, in jedem Gebiet
  oakNear(p) {
    const oaks = this.oakList();
    if (!oaks.length || this.toolId === 'acorns' || this.time.now - (this.oakShakeAt ?? -1e9) < 1500 || this.time.now - (this.acornsAt ?? -1e9) < 2000) return null;
    // fängt Henrik gerade ein Tier, das an Eicheln frisst, geht der Wurf vor
    if (this.animals.some((a) => (a.species === 'boar' || a.species === 'hedgehog') && a.canBeCaughtNow() && Math.hypot(a.x - p.x, (a.y - p.y) * 2) < 200)) return null;
    let best = null;
    let bestD = OAK_SHAKE_DIST;
    for (const o of oaks) {
      const d = Math.hypot(o.x - p.x, (o.y - p.y) * 2);
      if (d < bestD) {
        best = o;
        bestD = d;
      }
    }
    return best;
  }

  // freie Kachel in einem Rechteck (z. B. dem Eichenhain für die Wildschweine), mit Abstand zu "taken"
  tileIn(a, taken) {
    if (!a) return null;
    for (let i = 0; i < 60; i++) {
      const tx = Phaser.Math.Between(a.tx0, a.tx1), ty = Phaser.Math.Between(a.ty0, a.ty1);
      if (isBlocked(tx, ty) || charAt(tx, ty) !== '.') continue;
      if (taken.some((t) => Math.max(Math.abs(t.tx - tx), Math.abs(t.ty - ty)) < 3)) continue;
      return { tx, ty };
    }
    return null;
  }

  // ein Igel oder Wildschwein hat die Eicheln aufgefressen
  eatAcorns(nuts) {
    nuts.collected = true;
    this.tweens.killTweensOf(nuts.sprite);
    this.tweens.add({ targets: [nuts.sprite, nuts.shadow], alpha: 0, duration: 400, onComplete: () => { nuts.sprite.destroy(); nuts.shadow.destroy(); } });
  }

  // Moorlaterne vor sich abstellen: sie leuchtet dort weiter (Nebel weg, lockt die Elche, siehe Elk.js); danach das Lasso
  placeLantern() {
    const p = this.player;
    const x = p.x + p.faceX * 16;
    const y = p.y + p.faceY * 8;
    this.removeLantern();
    const imgs = [
      this.add.ellipse(x, y + 1, 60, 20, LANTERN_GLOW, 0.22).setBlendMode(Phaser.BlendModes.ADD).setDepth(-98000), // Lichtschein am Boden
      this.add.image(x, y, 'lantern').setOrigin(0.5, 0.92).setScale(0.42).setDepth(y),
      this.add.image(x, y - 14, glowTexture(this)).setBlendMode(Phaser.BlendModes.ADD).setTint(LANTERN_GLOW).setScale(1.3).setDepth(GLOW_DEPTH),
    ];
    this.lantern = { x, y, imgs, placedAt: this.time.now };
    this.tool.destroy(); // die Laterne steht jetzt am Boden (nicht zurück in die Kiste) ...
    this.tool = null;
    this.toolId = null;
    this.equipTool('lasso'); // ... und Henrik hat gleich das Lasso für den Elch in der Hand
  }

  removeLantern() {
    for (const img of this.lantern?.imgs ?? []) img.destroy();
    this.lantern = null;
  }

  // wo die Moorlaterne gerade leuchtet: in Henriks Hand und/oder abgestellt
  lanternLights() {
    const l = [];
    if (this.toolId === 'lantern') l.push({ x: this.player.x, y: this.player.y });
    if (this.lantern) l.push(this.lantern);
    return l;
  }

  // so hell ist es hier von der Moorlaterne (0..1)
  lightAt(x, y) {
    return lanternLight(this.lanternLights(), x, y);
  }

  // Große Wanderung in der Savanne: der Gnu-Strom zieht, solange das Event läuft
  updateMigration(dt) {
    const on = (LEVEL_ID === 'savanna' && isActive('migration')) || this.expEvent(); // Expedition: Event-Karte
    if (on && !this.migration) {
      this.migration = new Migration(this);
      this.startAmbient(); // Hufgetrappel der Herde
    }
    if (!on && this.migration) {
      this.migration.destroy();
      this.migration = null;
      this.startAmbient();
      this.showToast(tr('🦬 Die Gnu-Herde ist weitergezogen.', '🦬 The wildebeest herd has moved on.'));
    }
    this.migration?.update(dt);
  }

  // Wolfsnacht im Wald: beginnt bzw. endet mit dem Event (auch wenn man schon im Wald ist)
  updateWolfNight(dt) {
    const exp = this.expWolfNight(); // Expedition: Event-Karte (ein kleines Rudel je Wolf auf der Tierliste)
    const side = this.sideWolfNight(); // hinter einem Durchgang: weniger Rudel, die Map ist kleiner
    const on = (LEVEL_ID === 'forest' && isActive('wolves')) || exp || side;
    if (on && !this.wolfNight) {
      this.wolfNight = new WolfNight(this, exp ? { packs: () => expRun()?.left?.wolf ?? 0, size: EXP_GROUP, leave: true } : side ? { packs: () => SIDE_WOLF_PACKS } : {});
      this.startAmbient(); // Wald bei Nacht
    }
    if (!on && this.wolfNight) {
      this.wolfNight.destroy();
      this.wolfNight = null;
      this.startAmbient();
      this.showToast(tr('🌅 Die Wolfsnacht ist vorbei – es wird wieder hell im Wald.', '🌅 The Wolf Night is over – it is getting light in the forest again.'));
    }
    this.wolfNight?.update(dt);
  }

  // beim Umschauen hat sich der Spieler bewegt: kurzer Hinweis (nicht zu oft)
  wolvesSawYou() {
    if (this.time.now - (this.wolfHintAt ?? -Infinity) < 8000) return;
    this.wolfHintAt = this.time.now;
    this.showToast(tr('👀 Die Wölfe haben dich gesehen und sind weggerannt! Beweg dich nur, wenn sie heulen.', '👀 The wolves saw you and ran away! Only move while they howl.'));
  }

  // Rochen: die Herzchen-Leiste ist voll – er vertraut einem und schwimmt hinterher
  rayTrusts(ray) {
    this.catchAnimal(ray);
    if (!ray.skin) this.showToast(`${animalIcon('ray', 3.2)} ${tr('Der Rochen vertraut dir! Er schwimmt dir jetzt hinterher.', 'The ray trusts you! It swims after you now.')}`);
  }

  // Krake entwischt in einer Tintenwolke (kurzer Hinweis, nur beim ersten Mal in diesem Gebiet)
  inkEscape() {
    if (this.inkShown) return;
    this.inkShown = true;
    this.showToast(`${animalIcon('octopus', 3)} ${tr('Puff – die Krake ist in einer Tintenwolke verschwunden! Beim nächsten Mal schneller keschern.', 'Poof – the octopus vanished in a cloud of ink! Net it faster next time.')}`);
  }

  // Aquarium: Zierfische nur in Tanks ohne echte Fische
  updateTankDeco() {
    for (const deco of this.tankFish ?? []) {
      if (!deco.tank) continue;
      const h = deco.tank;
      const real = this.animals.some((a) => AQUA_FISH.includes(a.species) && a.state === 'penned' && a.enclosure?.tiles.some(({ tx, ty }) => tx > h.tx0 && tx < h.tx1 && ty > h.ty0 && ty < h.ty1));
      deco.setVisible(!real);
    }
  }

  // Gehege für ein Tier unter mehreren passenden in diesem Abschnitt (z. B. Brüllaffen: Affeninsel oder Tropenhalle):
  // zuerst eins mit freiem Platz, dort bevorzugt das seiner Herkunftswelt; sind alle voll, das seiner Herkunftswelt (dort
  // zieht dann ein anderes aus, siehe releaseExtra)
  pickPen(fitting, a) {
    const room = (e) => penCount(this.animals, e, e.quota ? quotaKey(a.species) : null) < capFor(e, a.species);
    return fitting.find((e) => room(e) && e.world === a.origin) ?? fitting.find(room) ?? fitting.find((e) => e.world === a.origin) ?? fitting[0] ?? null;
  }

  // so viele Tiere dieser Art leben in einem Tierpark-Abschnitt (hier: die lebenden, sonst der gespeicherte Stand)
  speciesIn(level, species) {
    const list = level === LEVEL_ID ? this.animals : (game.levels[level]?.animals ?? []);
    return list.filter((a) => a.state === 'penned' && !a.baby && quotaKey(a.species) === quotaKey(species)).length;
  }

  // Aquarium: in welchen Tank ein Riff-Fisch zieht. Gleiche Arten sollen zusammen schwimmen: zuerst ein Tank mit Platz, in dem
  // schon Fische seiner Art sind, sonst der leerste mit Platz. Sind alle voll, der mit den meisten seiner Art (dort zieht dann
  // ein anderer ins Naturreservat, siehe releaseExtra)
  tankFor(fish, tanks) {
    const inside = (e) => this.animals.filter((a) => a.state === 'penned' && a.enclosure === e && (!e.quota || a.species === fish.species));
    const same = (e) => inside(e).filter((a) => a.variant === fish.variant).length;
    const room = (e) => (penQuotas(e).find((q) => q.key === (e.quota ? fish.species : null))?.cap ?? 0) - inside(e).length;
    return [...tanks].sort((p, q) => (room(q) > 0) - (room(p) > 0) || same(q) - same(p) || room(q) - room(p))[0];
  }

  // Tiere, für die es im Tierpark noch kein Gehege gibt (noParkHome), werden beim Ankommen gleich im Naturreservat
  // ausgewildert (bringt ein paar Herzen, wie bei vollen Gehegen; siehe die Meldung in moveFollowersIntoPens)
  releaseHomeless() {
    this.released ??= [];
    for (const a of this.followers.filter((f) => noParkHome(f.species))) {
      const hearts = releaseHearts(a.species, a.skin ?? a.variant);
      this.addHearts(hearts, a.species);
      this.released.push({ species: a.species, hearts });
      this.followers.splice(this.followers.indexOf(a), 1);
      this.animals.splice(this.animals.indexOf(a), 1);
      this.tweens.add({ targets: [a.sprite, a.shadow], alpha: 0, duration: 900, onComplete: () => a.destroy() });
    }
  }

  // Gehege voll: das älteste Tier wird im Naturreservat ausgewildert (bringt ein paar Herzen). Seltene Varianten bleiben; sonst zuerst das
  // Aussehen bzw. die Art, von der es am meisten gibt (Schaf, Kuh, Zebra, Giraffe ...), damit die Mischung ausgewogen bleibt
  releaseExtra(e) {
    this.released ??= [];
    // jedes Kontingent für sich: ein neues Zebra kann nur ein Zebra verdrängen, nie eine Giraffe
    for (const { key, cap } of penQuotas(e)) while (penCount(this.animals, e, key) > cap) {
      const inside = this.animals.filter((a) => a.state === 'penned' && a.enclosure === e && !a.baby && (key === null || quotaKey(a.species) === key));
      const looks = {};
      // seltene Varianten bleiben bevorzugt: zuerst zieht ein normales Tier aus, zuletzt ein Skin
      const rarity = (a) => (a.isRare() ? 1 : 0);
      const least = Math.min(...inside.map(rarity));
      const pool = inside.filter((a) => rarity(a) === least);
      const look = (a) => a.skin ?? a.variant ?? a.species;
      // in gemeinsamen Gehegen (Zebra und Giraffe, Reh und Hirsch ...) zieht die Art aus, von der es am meisten gibt;
      // bei Gleichstand die, die gerade dazugekommen ist – so verdrängt ein neues Zebra keine Giraffe
      const newest = {};
      for (const a of pool) {
        looks[look(a)] = (looks[look(a)] ?? 0) + 1;
        newest[look(a)] = Math.max(newest[look(a)] ?? 0, a.penSince ?? 0);
      }
      const most = Object.entries(looks).sort((u, v) => v[1] - u[1] || newest[v[0]] - newest[u[0]])[0][0];
      const victim = pool.filter((a) => String(look(a)) === most).sort((u, v) => (u.penSince ?? 0) - (v.penSince ?? 0))[0]; // (Schlüssel von looks sind Text, Varianten z. B. der Schmetterlinge Zahlen)
      const hearts = releaseHearts(victim.species, victim.skin ?? victim.variant);
      this.addHearts(hearts, victim.species);
      this.released.push({ species: victim.species, hearts });
      this.animals.splice(this.animals.indexOf(victim), 1);
      this.tweens.add({ targets: [victim.sprite, victim.shadow], alpha: 0, duration: 900, onComplete: () => victim.destroy() });
    }
  }

  // Ist das Gehege für diese Tierart im Tierpark schon voll (samt den Tieren, die gerade mitlaufen)? (für den Hinweis)
  // Meerestiere: die Becken im Aquarium
  parkPenFull(species, origin) {
    if (houseOf(species)) return this.houseFull(houseOf(species), species);
    // mehrere Gehege für diese Art (Brüllaffen, Schmetterlinge): voll, wenn alle zusammen voll sind
    const pens = parkPens().filter((p) => accepts(p, species) && hasSlots(p));
    if (pens.length > 1) {
      const cap = pens.reduce((n, p) => n + capFor(p, species), 0);
      const levels = [...new Set(pens.map((p) => p.level))];
      const coming = this.followers.filter((a) => quotaKey(a.species) === quotaKey(species)).length;
      return levels.reduce((n, l) => n + this.speciesIn(l, species), 0) + coming >= cap;
    }
    const e = parkPenFor(species, origin);
    if (!e || !hasSlots(e)) return false;
    // nur das Kontingent dieser Tierart (in gemeinsamen Gehegen)
    const key = e.quota ? quotaKey(species) : null;
    const cap = penQuotas(e).find((x) => x.key === key)?.cap ?? Infinity;
    const saved = game.levels[e.level]?.animals ?? []; // im Abschnitt, in dem das Gehege liegt
    const accepts2 = (s) => (key ? quotaKey(s) === key : !e.species || e.species.includes(s));
    const inPen = saved.filter((a) => a.state === 'penned' && accepts2(a.species)).length;
    const coming = this.followers.filter((a) => accepts2(a.species)).length;
    return inPen + coming >= cap;
  }

  // Sind alle Becken im Aquarium, in die diese Meerestier-Art darf, schon voll (samt denen, die gerade mitschwimmen)?
  // Gezählt wird im gespeicherten Stand des Hauses, wie beim Einliefern (siehe sendToHouse)
  houseFull(level, species) {
    const saved = game.levels[level]?.animals ?? [];
    const all = houseTanks(level);
    const tanks = all.filter((t) => accepts(t.e, species));
    if (!tanks.length) return false;
    const cap = tanks.reduce((n, t) => n + t.capFor(species), 0);
    const inside = saved.filter((s) => {
      const t = s.state === 'penned' && tankOf(all, s);
      return t && tanks.includes(t) && (!t.e.quota || s.species === species);
    }).length;
    const coming = this.followers.filter((a) => a.species === species).length;
    return inside + coming >= cap;
  }

  // Ein Tier an eine freie Stelle in diesem Gehege setzen (Wassertiere in dessen Teich) und einziehen lassen
  // quiet: ohne Herz (z. B. beim Umsetzen nach einem Ausbau)
  placeInPen(animal, e, quiet = false) {
    // freilaufend (Pfauen): irgendwo im Park in der Nähe eines Wegs loslassen, damit sie sich verteilen
    if (e.free) {
      const t = Phaser.Utils.Array.GetRandom(freeAreaTiles(e)); // (Schmetterlinge der Tropenhalle nur dort, Pfauen nicht dort)
      const spot = t ? tileToWorld(t.tx, t.ty) : { x: this.player.x, y: this.player.y };
      animal.x = spot.x;
      animal.y = spot.y;
      if (quiet) {
        animal.restore('penned');
      } else {
        animal.penSince = Date.now();
        animal.enterPen();
      }
      animal.enclosure = e;
      return;
    }
    const a = e.area;
    const water = ['fish', 'koi', 'crocodile'].includes(animal.species);
    const tiles = [];
    for (const { tx, ty } of e.tiles) if (water && !animal.campBag ? isFishpond(tx, ty) : !isBlocked(tx, ty)) tiles.push({ tx, ty });
    const t = Phaser.Utils.Array.GetRandom(tiles) ?? { tx: a.tx0, ty: a.ty0 };
    const p = tileToWorld(t.tx, t.ty);
    animal.x = p.x + Phaser.Math.Between(-6, 6);
    animal.y = p.y + Phaser.Math.Between(-3, 3);
    animal.enclosure = e;
    if (quiet) {
      animal.restore('penned');
      animal.enclosure = e;
      return;
    }
    animal.penSince = Date.now();
    animal.enterPen();
  }

  // Ruf eines wilden Pfaus: schallt ab und zu durchs ganze Gebiet (überall gleich laut)
  updatePeacockCall(dt) {
    const every = isPark(LEVEL_ID) ? PEACOCK_CALL_EVERY_PARK : PEACOCK_CALL_EVERY;
    this.peacockCallTimer = (this.peacockCallTimer ?? Phaser.Math.FloatBetween(5, every[1])) - dt;
    if (this.peacockCallTimer > 0) return;
    this.peacockCallTimer = Phaser.Math.FloatBetween(...every);
    if (!this.animals.some((a) => a.species === 'peacock' && (a.state === 'wild' || a.enclosure?.free))) return;
    if (this.cache.audio.exists('animal_peacock')) this.sound.play('animal_peacock', { volume: PEACOCK_CALL_VOLUME, detune: Phaser.Math.Between(-80, 80) });
  }

  peacockFlew() {
    this.showToast(`${animalIcon('peacock', 3.2)} ${tr('Zu nah – der Pfau ist davongeflogen! Warte, bis einer ein Rad schlägt.', 'Too close – the peacock flew away! Wait until one fans out its tail.')}`);
  }

  // Orang-Utan: der Spieler winkt zurück (👋 über Henrik); was es bewirkt, entscheidet der Orang-Utan
  waveAt(o) {
    const p = this.player;
    const hand = this.add.text(p.x - p.faceX * 12, p.sprite.y - 44, '👋', { fontSize: '16px', resolution: 4 }).setOrigin(0.5).setDepth(100000);
    this.tweens.add({ targets: hand, angle: { from: -20, to: 20 }, duration: 150, yoyo: true, repeat: 2, onComplete: () => hand.destroy() });
    const result = o.playerWaves();
    if (result === 'happy') this.showToast(`${animalIcon('orangutan', 3.2)} ${tr('Er freut sich!', 'It is happy!')} ${'😊'.repeat(o.waves)} ${tr('Warte, bis er wieder winkt.', 'Wait until it waves again.')}`);
  }

  orangutanMissed(o, reason) {
    this.showToast(
      reason === 'early'
        ? `${animalIcon('orangutan', 3.2)} ${tr('Zu früh! Warte, bis er zuerst winkt. Jetzt ist er auf einen anderen Baum gesprungen.', 'Too early! Wait until it waves first. Now it has jumped to another tree.')}`
        : `${animalIcon('orangutan', 3.2)} ${tr('Zu langsam! Er ist auf einen anderen Baum gesprungen. Wink gleich zurück, wenn er winkt.', 'Too slow! It has jumped to another tree. Wave back right when it waves.')}`,
    );
  }

  orangutanDown() {
    this.showToast(`${animalIcon('orangutan', 3.2)} ${tr('Dreimal zurückgewinkt! Er klettert herunter – geh hin und streichel ihn.', 'You waved back three times! It is climbing down – go and pet it.')}`);
  }

  // Ball (Asien): vor einem Tiger-Schemen im Bambus hinrollen – der Tiger wird neugierig und kommt heraus.
  // auto: der Spieler stand mit dem Ball still (dann ohne Hinweis, wenn kein Tiger in der Nähe ist)
  rollBall(auto) {
    const p = this.player;
    const near = this.animals
      .filter((a) => a.species === 'tiger' && a.isProwling())
      .map((a) => ({ a, d: Math.hypot(a.x - p.x, (a.y - p.y) * 2) }))
      .sort((u, v) => u.d - v.d)[0];
    if (!near || near.d > TIGER_LURE_DIST) {
      if (!auto) this.showToast(tr('Halte Ausschau nach einem dunklen Schatten im Bambus – und stell dich mit dem Ball davor.', 'Look out for a dark shadow in the bamboo – and stand in front of it with the ball.'));
      return;
    }
    // der Ball rollt ein Stück auf den Tiger zu (bis vor den Bambus)
    const t = near.a;
    const angle = Math.atan2(t.y - p.y, t.x - p.x);
    const spot = BALL_ROLL.map((r) => ({ x: p.x + Math.cos(angle) * r, y: p.y + Math.sin(angle) * r * 0.5 })).find((s) => !blockedAt(s.x, s.y, 6, 3)) ?? { x: p.x + p.faceX * 14, y: p.y + 4 };
    // der Ball bleibt am Boden liegen (beim Drüberlaufen hebt man ihn wieder auf); er rollt aus der Hand dorthin
    const ball = new Pickup(this, spot.x, spot.y, 'toy_ball', 'ball', false);
    ball.temporary = true; // wird nicht gespeichert
    ball.sprite.setX(p.x);
    this.tweens.add({ targets: ball.sprite, x: spot.x, angle: 340, duration: 700, ease: 'Quad.easeOut' });
    this.pickups.push(ball);
    // gleich das Lasso in der Hand
    if (this.toolId === 'ball') {
      this.tool.destroy();
      this.tool = null;
      this.toolId = null;
    }
    this.equipTool('lasso');
    t.lure(spot);
    t.ballPickup = ball;
    this.showToast(`${animalIcon('tiger', 3.2)} ${tr('Der Ball rollt zum Bambus. Jetzt geh ein Stück weg – dann wird der Tiger aufmerksam. Du hast das Lasso in der Hand.', 'The ball rolls to the bamboo. Now walk away a bit – then the tiger gets curious. You have the lasso in your hand.')}`);
  }

  // der Tiger ist herausgekommen und spielt am Ball
  tigerOut() {
    this.showToast(`${animalIcon('tiger', 3.2)} ${tr('Der Tiger spielt mit dem Ball – gleich rennt er wieder los. Schnell das Lasso!', 'The tiger is playing with the ball – soon it will run off again. Quick, the lasso!')}`);
  }

  // nach dem Wurf weggegangen: der Tiger schaut neugierig aus dem Bambus
  tigerCurious() {
    this.showToast(`${animalIcon('tiger', 3.2)} ${tr('Da schaut jemand neugierig aus dem Bambus … nicht näher kommen!', 'Someone is peeking curiously out of the bamboo … don’t come closer!')}`);
  }

  // zu nah herangekommen (shy) oder nicht weggegangen: der Tiger bleibt im Bambus; den Ball kann man noch aufheben
  tigerShy(t, shy) {
    this.expireBall(t);
    this.showToast(
      shy
        ? `${animalIcon('tiger', 3.2)} ${tr('Zu nah! Der Tiger ist erschrocken. Halt Abstand, wenn er neugierig schaut.', 'Too close! The tiger got scared. Keep your distance while it looks curious.')}`
        : `${animalIcon('tiger', 3.2)} ${tr('Der Tiger hat das Interesse verloren. Nach dem Werfen musst du ein Stück weggehen.', 'The tiger lost interest. After throwing, you have to walk away a bit.')}`,
    );
  }

  // zurück im Bambus: der Ball liegt noch eine Weile da
  tigerBack(t) {
    this.expireBall(t);
  }

  // Der Tiger spielt nicht mehr mit dem Ball: noch BALL_KEEP lang aufhebbar, dann ist er weg (neuen aus dem Regal holen)
  expireBall(t) {
    const ball = t.ballPickup;
    t.ballPickup = null;
    if (!ball || ball.collected) return;
    this.time.delayedCall(BALL_KEEP, () => {
      if (ball.collected) return;
      ball.collected = true;
      this.tweens.killTweensOf(ball.sprite);
      this.tweens.add({ targets: [ball.sprite, ball.shadow], alpha: 0, duration: 800, onComplete: () => (ball.sprite.destroy(), ball.shadow.destroy()) });
    });
  }

  // Ein wildes Tier fangen: es stellt sich hinten in die Reihe
  catchAnimal(animal) {
    // schon weg oder schon gefangen (z. B. Erdmännchen: nach dem ersten Fang verschwindet der Rest der Kolonie, auch die,
    // die im selben Kescherschwung mit erwischt wurden) – so fängt man wirklich nur eins
    // (Tiere aus der Falle sind 'trapped' und dürfen natürlich mit)
    if (animal.state === 'following' || animal.state === 'penned' || !this.animals.includes(animal)) return;
    if (this.tooCold()) return; // Eiswelt bei Nacht: mit klammen Fingern fängt man nichts
    animal.origin ??= biomeOf(); // Expedition: Herkunft ist die Welt (Savanne), nicht die Map
    // der erste Flamingo: im Tierpark entsteht das Flamingo-Gehege
    if (animal.species === 'flamingo' && !game.unlocked.includes('flamingo')) {
      game.unlocked.push('flamingo');
      this.time.delayedCall(1200, () => this.showToast(`${animalIcon('flamingo', 3.2)} ${tr('Erster Flamingo! Neues Gehege gegenüber vom Haupthaus.', 'First flamingo! New enclosure across from the main building.')}`));
    }
    // der erste Wolf: im Tierpark entsteht am Waldrand der Wolfswald
    if (animal.species === 'wolf' && !game.unlocked.includes('wolves')) {
      game.unlocked.push('wolves');
      this.time.delayedCall(1200, () => this.showToast(`${animalIcon('wolf', 3.2)} ${tr('Erster Wolf! Neuer Wolfswald im Wald-Bereich ganz links.', 'First wolf! New Wolf Woods at the far left of the forest area.')}`));
    }
    // (Geier, Hyänen, Warzenschweine und Gnus haben in der Safari von Anfang an ihren Platz, siehe docs/plan-safari.md)
    // die erste Qualle: im Aquarium öffnet sich der dunkle Quallenraum
    if (animal.species === 'jellyfish' && !game.unlocked.includes('jellyfish')) {
      game.unlocked.push('jellyfish');
      this.time.delayedCall(1200, () => this.showToast(`${animalIcon('jellyfish', 3.2)} ${tr('Erste Qualle! Im Aquarium ist der Quallenraum offen (Raum 2, unten rechts).', 'First jellyfish! The jellyfish room is open (aquarium room 2, bottom right).')}`));
    } // aus welcher Welt es kommt: im Tierpark zieht es in das Gehege dieser Welt
    // Gehege im Tierpark schon voll? Dann vorher Bescheid sagen (es zieht dann eins ins Naturreservat)
    const full = !isPark(LEVEL_ID) && this.parkPenFull(animal.species, animal.origin);
    const homeless = !isPark(LEVEL_ID) && noParkHome(animal.species); // noch kein Gehege: es kommt ins Naturreservat
    const unit = unitOf(animal);
    animal.catch();
    // Expedition: eine Einheit (Herde, Rudel, Einzeltier) weniger auf der Map
    if (this.expMap && !this.expCaught.has(unit)) {
      this.expCaught.add(unit);
      caughtUnit(animal.species);
      this.expUpdateCounter();
    }
    // Glücksbringer Stoffteddy (Expedition): gleich Herzen wie fürs Naturreservat, eine Herz-Zahl steigt auf
    if (this.expMap && hasCharm('teddy')) {
      const h = releaseHearts(animal.species, animal.skin ?? animal.variant);
      this.addHearts(h, animal.species);
      const tag = this.add.text(animal.x, animal.y - 40, `♥ ${h}`, { fontFamily: 'Trebuchet MS, Arial', fontSize: '15px', fontStyle: 'bold', color: '#ff5a8c', stroke: '#ffffff', strokeThickness: 4, resolution: 4 }).setOrigin(0.5).setDepth(100000);
      this.tweens.add({ targets: tag, y: tag.y - 22, alpha: 0, delay: 500, duration: 1200, onComplete: () => tag.destroy() });
    }
    // für die Statistik nur einmal je Tier: ein Panda, der zum Bambus abhaut und wieder angelockt wird, zählt nicht doppelt
    if (!animal.counted) {
      animal.counted = true;
      countCatch(animal.species);
    }
    if (!caughtBefore(animal.species)) {
      game.caughtSpecies.push(animal.species);
      this.markNew(`caught:${animal.species}`);
    }
    this.hideEncounterBubble();
    countStoryCatch(animal.species, animal.origin); // für Mavis Aufgaben
    this.followers.push(animal);
    this.updateQuestCard();
    this.mavi.check();
    if (animal.species === 'tiger') this.expireBall(animal); // der Ball bleibt noch eine Weile liegen
    // Hinweise beim Fangen in einer Meldung, je eine Zeile (sonst überschreibt einer den anderen, z. B. seltener Wolf + Rudel rennt weg)
    const notes = [];
    const rare = animal.skin && skinInfo(animal.species, animal.skin);
    if (rare && !rare.common) {
      notes.push(
        tr(
          `✨ ${rare.neuter ? 'Ein seltenes' : rare.male ? 'Ein seltener' : 'Eine seltene'} ${rare.name}! Im Tierpark lockt ${rare.neuter ? 'es' : rare.male ? 'er' : 'sie'} besonders viele Besucher an.`,
          `✨ A rare ${rare.name}! It attracts lots of visitors to your zoo.`,
        ),
      );
    }
    if (homeless) {
      notes.push(tr(
        `🌳 Für ${animalIcon(animal.species, 3)} gibt es im Tierpark noch kein Gehege – bring es trotzdem hin: Dort wird es im Naturreservat ausgewildert und bringt dir Herzen.`,
        `🌳 There is no enclosure for ${animalIcon(animal.species, 3)} in your zoo yet – take it there anyway: it will be released into the nature reserve and earn you hearts.`,
      ));
    }
    if (full) {
      const tag = this.add.text(animal.x, animal.y - 40, '🌳', { fontSize: '18px' }).setOrigin(0.5).setDepth(100000);
      this.tweens.add({ targets: tag, y: tag.y - 18, alpha: 0, delay: 600, duration: 1400, onComplete: () => tag.destroy() });
      const icon = animalIcon(animal.species, 3);
      notes.push(
        AQUA.includes(animal.species)
          ? tr(`🌳 Das Becken für ${icon} im Aquarium ist schon voll – beim Abgeben zieht ein Tier ins Naturreservat.`, `🌳 The tank for ${icon} in the aquarium is already full – when you bring it home, one animal moves to the nature reserve.`)
          : tr(`🌳 Das Gehege für ${icon} ist schon voll – beim Abgeben zieht ein Tier ins Naturreservat.`, `🌳 The enclosure for ${icon} is already full – when you bring it home, one animal moves to the nature reserve.`),
      );
    }
    // Riff-Fische: der Rest der Gruppe schießt davon und ist weg – man bekommt nur einen
    if (animal.species === 'reeffish') {
      const mates = this.animals.filter((a) => a !== animal && a.herd === animal.herd && a.state === 'wild');
      for (const a of mates) this.despawn(a);
      if (mates.length) notes.push(tr(`Die anderen ${animalIcon('reeffish')} sind blitzschnell davongeschwommen!`, `The other ${animalIcon('reeffish')} swam away in a flash!`));
    } else if (this.expMap && unit !== animal && !animal.herd) {
      // Expedition: Brüllaffen-Trupp, Ara-Paar, Piranha-Schwarm, Erdmännchen – die anderen sind weg (wie die Herde, die
      // davonrennt), damit eine Gruppe im Zähler eindeutig ein Fang ist (unit: vor animal.catch() gemerkt)
      const mates = this.animals.filter((a) => a !== animal && unitOf(a) === unit && a.state === 'wild');
      for (const a of mates) {
        if (a.tree) this.rustleCrown?.(a.tree);
        this.despawn(a);
      }
      const how = { howler: tr('sind durch die Baumkronen davongeschwungen', 'swung away through the treetops'), piranha: tr('sind in die Tiefe abgetaucht', 'dived down into the deep'), meerkat: tr('sind in ihren Bau geflitzt', 'darted into their burrow') }[animal.species] ?? tr('sind davongeflogen', 'flew away');
      if (mates.length) notes.push(tr(`Die anderen ${animalIcon(animal.species)} ${how}!`, `The other ${animalIcon(animal.species)} ${how}!`));
    } else if (animal.herd) {
      const mates = this.animals.filter((a) => a !== animal && a.herd === animal.herd && a.state === 'wild' && a.scatter);
      for (const a of mates) a.scatter();
      if (mates.length) notes.push(tr(`Die anderen ${animalIcon(animal.species)} sind vor Schreck davongerannt!`, `The other ${animalIcon(animal.species)} got scared and ran away!`));
    }
    if (notes.length) this.showToast(notes.join('<br>'));
    // kurzer Tierruf (falls es für diese Art einen gibt)
    const sound = this.callOf(animal);
    if (this.cache.audio.exists(sound)) this.sound.play(sound, { volume: ANIMAL_VOLUME });
  }

  // --- Expedition (Regeln siehe world/expedition.js) ---

  // Map: fehlende Tiere der Tierliste auftauchen lassen (beim Betreten alle; danach nur, wenn eins weggelaufen ist).
  // Geier, Hyänen und Reiher kommen über ihre eigenen Timer (siehe expWants)
  expTopUp(near, fadeIn) {
    const left = expRun()?.left ?? {};
    const taken = [near, ...TOOL_SPOTS];
    for (const [species, n] of Object.entries(left)) {
      // Leguane (versteckt am Wasserfall), Gorillas (auf der Lichtung), Schlangen und Vogelspinnen (im Dickicht)
      if (species === 'iguana' || species === 'gorilla') {
        for (let tries = 0; tries < n * 3 && this.expWildUnits(species) < n; tries++) {
          const [a] = species === 'iguana' ? Iguana.spawnHidden(this) : Gorilla.spawnOnClearing(this);
          if (!a) break;
          a.life = Infinity;
          a.rollSkin('wild');
        }
        continue;
      }
      if (species === 'snake' || species === 'tarantula') {
        this.expHideCritters(species, n);
        continue;
      }
      if (CALLED_UNITS.includes(species) || !SPECIES[species]) continue;
      for (let tries = 0; tries < n * 3 && this.expWildUnits(species) < n; tries++) {
        const group = this.spawnOne(taken, fadeIn, { population: 99, weights: { [species]: 1 } });
        for (const a of group) a.life = Infinity;
      }
    }
  }

  // Ankunft auf einer Expeditions-Map: kurzer Hinweis zu Tieren, die man nicht gleich sieht
  expHiddenHint() {
    if (!this.expMap) return '';
    const home = expRun()?.home ?? {};
    const lines = [];
    if (home.howler) lines.push(tr(`${animalIcon('howler')} Brüllaffen sitzen unsichtbar oben in den Bäumen – wo die Krone raschelt, leg eine Banane unter den Baum.`, `${animalIcon('howler')} Howler monkeys sit unseen high up in the trees – where a crown rustles, put a banana at the foot of the tree.`));
    if (this.expFireflies()) lines.push(tr(`✨ Glühwürmchen-Abend! Fang mit dem Glas aus der Kiste 3 Glühwürmchen – das leuchtende Glas lockt die ${animalIcon('redpanda')} aus den Kirschbäumen.`, `✨ Firefly evening! Catch 3 fireflies with the jar from the chest – the glowing jar lures the ${animalIcon('redpanda')} down from the cherry trees.`));
    if (home.yak) lines.push(tr(`🧂 Die ${animalIcon('yak')} grasen am Steinhaufen – such den Salzstein und leg ihn darauf.`, `🧂 The ${animalIcon('yak')} graze by the cairn – find the salt lick and put it on top.`));
    if (this.expWolfNight()) lines.push(tr(`🐺 Wolfsnacht! Folge den leuchtenden Spuren zu den ${animalIcon('wolf')}. Heulen sie, darfst du laufen – schauen sie sich um, bleib stehen!`, `🐺 Wolf Night! Follow the glowing tracks to the ${animalIcon('wolf')}. While they howl you may walk – when they look around, stand still!`));
    if (home.elk) lines.push(tr(`🏮 Die ${animalIcon('elk')} stehen im Nebel über dem Moorwasser – stell die Laterne aus der Kiste ans Ufer, dann kommen sie ins Licht.`, `🏮 The ${animalIcon('elk')} stand in the fog over the bog water – put the lantern from the chest by the shore and they come into the light.`));
    if (home.hedgehog || home.boar) lines.push(tr('🌰 Schüttel Eicheln aus einer großen Eiche – damit lockst du Igel aus den Laubhaufen und Wildschweine zum Fressen.', '🌰 Shake acorns from a big oak – they lure hedgehogs out of the leaf piles and wild boars to feed.'));
    if (home.beaver && LEVEL.beavers) lines.push(tr(`🪵 Im Biberdamm ist ein Loch – steck einen großen Stock hinein, dann kommt ein ${animalIcon('beaver')} mit.`, `🪵 There is a hole in the beaver dam – push a big stick into it and a ${animalIcon('beaver')} comes along.`));
    if (home.snake || home.tarantula) lines.push(tr('🌿 Schlangen und Spinnen verstecken sich im Dickicht – wo es raschelt, schlag es frei.', '🌿 Snakes and spiders hide in the thicket – where it rustles, cut it away.'));
    return lines.map((l) => `<br><small>${l}</small>`).join('');
  }

  // Werkzeuge in der Kiste einer Expeditions-Map: Kescher und Lasso, dazu was die gewürfelten Tiere brauchen (Angel,
  // Trommel, Grünfutter) bzw. womit man sie lockt (Banane, Knochen)
  expTools() {
    // (hinter einem Durchgang: die Arten des Spawn-Pools und die Sondertiere, die hier kommen können)
    const special = { gorillas: 'gorilla', hyenas: 'hyena', herons: 'heron', vultures: 'vulture', waterfallSun: 'iguana' };
    const species = this.expMap
      ? Object.keys({ ...(expRun()?.home ?? {}), ...(expRun()?.left ?? {}) })
      : [...Object.keys(spawnWeights(LEVEL)), ...Object.entries(special).filter(([k]) => LEVEL[k]).map(([, sp]) => sp)];
    const need = new Set(['net', 'lasso']);
    for (const sp of species) {
      for (const t of SPECIES[sp]?.catchWith ?? []) if (TOOLS[t] && !CARRIED.includes(t)) need.add(t); // (den Blätterzweig gibt es am Strauch)
      for (const [t, list] of Object.entries(TOOL_LURES)) if (list.includes(sp) && TOOLS[t] && t !== 'glowjar' && t !== 'acorns') need.add(t); // (das leuchtende Glas entsteht erst aus dem Glas, Eicheln schüttelt man aus den Eichen)
    }
    const order = ['net', 'lasso', 'trap', 'lantern', 'rod', 'drum', 'food', 'banana', 'bone', 'ball', 'koifood', 'fireflyjar'];
    return [...need].sort((a, b) => (order.indexOf(a) + 1 || 99) - (order.indexOf(b) + 1 || 99));
  }

  // freie Einheiten dieser Art (eine Herde, Kolonie oder ein Rudel zählt als eine; ohne die, aus denen man schon eins hat)
  expWildUnits(species) {
    const units = new Set();
    for (const a of this.animals) {
      if (a.species !== species || a.state !== 'wild' || a.gone) continue;
      const u = unitOf(a);
      if (!this.expCaught.has(u)) units.add(u);
    }
    return units.size;
  }

  // soll noch eins dieser Art kommen? (Geier fliegen heran, Hyänen kommen zu den Knochen)
  expWants(species) {
    return this.expWildUnits(species) < (expRun()?.left?.[species] ?? 0);
  }

  // Ziele für das Fernglas: raschelnde Dickichte (versteckte Schlangen und Spinnen)
  expHiddenTargets() {
    return (this.expHidden ?? []).map((h) => ({ ...tileToWorld(h.tx, h.ty), species: h.species, key: `${h.tx},${h.ty}` }));
  }

  // Zähler oben in der Mitte: je freie Einheit ein Schattenbild; alles gefangen → zurück zum Camp
  expUpdateCounter() {
    const el = document.getElementById('exp-counter');
    if (!el) return;
    if (!this.expMap) {
      el.classList.remove('show', 'done');
      return;
    }
    const left = expRun()?.left ?? {};
    const icons = Object.entries(left).flatMap(([s, n]) => (SPECIES[s] ? Array.from({ length: n }, () => animalIconFit(s, 1.9, () => this.sys.isActive() && this.expUpdateCounter())) : []));
    el.classList.add('show');
    el.classList.toggle('done', !icons.length);
    el.innerHTML = icons.length ? icons.join('') : tr('Alles gefangen – zurück zum Camp!', 'All caught – back to camp!');
    if (!icons.length && !this.expDoneShown) {
      this.expDoneShown = true;
      this.time.delayedCall(1500, () => this.showToast(tr('⛺ Auf dieser Map ist alles gefangen! Folge dem Pfeil zurück zum Camp.', '⛺ Everything on this map is caught! Follow the arrow back to camp.')));
    }
  }

  // Schlangen und Vogelspinnen (Expedition): jede sitzt in einem bestimmten dichten Dickicht, das ab und zu raschelt
  // (expRustle). Schlägt man genau dieses frei, schreckt sie sicher auf; flieht sie ins nächste Dickicht, versteckt sie
  // sich dort (critterHidden) – verloren geht nichts. this.expHidden: [{ species, tx, ty, skin }]
  expHideCritters(species, n) {
    if (!this.thicket) return;
    this.expHidden ??= [];
    const have = this.expHidden.filter((h) => h.species === species).length + this.expWildUnits(species);
    const used = new Set(this.expHidden.map((h) => `${h.tx},${h.ty}`));
    const free = [...this.thicket.images.keys()].filter((k) => !used.has(k) && this.thicket.stage(k) === 2);
    for (let i = have; i < n && free.length; i++) {
      const k = free.splice(Math.floor(Math.random() * free.length), 1)[0];
      const [tx, ty] = k.split(',').map(Number);
      this.expHidden.push({ species, tx, ty, skin: undefined });
    }
  }

  // ab und zu raschelt ein Dickicht, in dem etwas sitzt: es wackelt, ein paar Blätter fliegen
  expRustle(dt) {
    if (!this.expHidden?.length) return;
    this.rustleIn = (this.rustleIn ?? 1) - dt;
    if (this.rustleIn > 0) return;
    this.rustleIn = Phaser.Math.FloatBetween(1.2, 2.4);
    const h = Phaser.Utils.Array.GetRandom(this.expHidden);
    const img = this.thicket?.images.get(`${h.tx},${h.ty}`);
    if (!img) return;
    // verdeckt (z. B. hinter einem Baum)? Dann scheint beim Rascheln die Kontur des Dickichts durch
    if (h.ghost === undefined) {
      h.ghost = isCovered(this, img)
        ? this.add.image(img.x, img.y, outlineTexture(this, img.texture.key), img.frame.name).setOrigin(img.originX, img.originY).setScale(img.scaleX).setDepth(GHOST_DEPTH).setAlpha(0)
        : null;
    }
    // nur beim Rascheln kurz zu sehen
    if (h.ghost) this.tweens.add({ targets: h.ghost, alpha: { from: 0, to: GHOST_ALPHA }, duration: 200, hold: 900, yoyo: true });
    const wiggle = h.ghost ? [img, h.ghost] : img;
    this.tweens.add({ targets: wiggle, angle: { from: -4, to: 4 }, duration: 90, yoyo: true, repeat: 3, onComplete: () => (h.ghost ? [img, h.ghost] : [img]).forEach((o) => o.setAngle(0)) });
    for (let i = 0; i < 4; i++) {
      const leaf = this.add.ellipse(img.x + Phaser.Math.Between(-14, 14), img.y - Phaser.Math.Between(18, 34), 5, 3, i % 2 ? 0x5a9a3a : 0x86c25a).setDepth(img.y + 1);
      this.tweens.add({ targets: leaf, x: leaf.x + Phaser.Math.Between(-18, 18), y: leaf.y - Phaser.Math.Between(6, 16), angle: Phaser.Math.Between(-90, 90), alpha: 0, duration: 700, onComplete: () => leaf.destroy() });
    }
    if (this.cache.audio.exists('tree_rustle') && Math.hypot(img.x - this.player.x, (img.y - this.player.y) * 2) < 260) this.sound.play('tree_rustle', { volume: 0.25, detune: 400 });
  }

  // Kanu im Dschungel-Camp: liegt am Steg (damit geht es zur nächsten Map)
  drawCampCanoe(c) {
    const p = tileToWorld(c.tx, c.ty);
    const img = this.add.sprite(p.x, p.y, 'canoe', 0).setOrigin(0.5, 148 / 152).setScale(0.5).setDepth(p.y);
    this.tweens.add({ targets: img, y: img.y - 1.5, duration: 1600, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    this.campCanoe = img;
  }

  // Ankunft auf einer Dschungel-Map: das Kanu gleitet mit Henrik über den Fluss-Einlauf an den Steg, dann steigt er aus
  expArriveByCanoe() {
    const { from, to } = LEVEL.inlet;
    const a = tileToWorld(from.tx, from.ty);
    const b = tileToWorld(to.tx, to.ty);
    const boat = this.add.sprite(a.x, a.y, 'canoe_hero', 0).setOrigin(0.5, 148 / 152).setScale(0.5).setDepth(a.y + 1);
    const p = this.player;
    p.sprite.setVisible(false);
    p.shadow?.setVisible(false);
    this.boat?.img.setVisible(false); // Fluss-Map: das fahrbare Kanu erscheint erst, wenn Henrik angelegt hat
    this.leaving = true; // solange steht alles still
    const cam = this.cameras.main;
    cam.startFollow(boat, true, 0.12, 0.12);
    this.tweens.add({
      targets: boat,
      x: b.x,
      y: b.y,
      duration: 1900,
      ease: 'Sine.easeOut',
      onUpdate: () => boat.setDepth(boat.y + 1),
      onComplete: () => {
        if (this.boat) {
          // Fluss-Map: ab jetzt das fahrbare Kanu (liegt genau dort)
          boat.destroy();
          this.boat.img.setVisible(true);
        } else {
          boat.setTexture('canoe', 0); // Henrik steigt aus, das Kanu bleibt am Steg
          this.tweens.add({ targets: boat, y: boat.y - 1.5, duration: 1600, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
        }
        p.sprite.setVisible(true);
        p.shadow?.setVisible(true);
        cam.startFollow(p.sprite, true, 0.12, 0.12);
        this.leaving = false;
      },
    });
  }

  // läuft auf dieser Map das Event der Event-Karte? (Große Wanderung auf der Gnu-Furt)
  expEvent() {
    return !!(this.expMap && LEVEL.migration && expRun()?.event === LEVEL_ID);
  }

  // ... bzw. die Wolfsnacht (Wald: Waldwiese, Felsenschlucht)
  expWolfNight() {
    return !!(this.expMap && LEVEL.wolfNight && expRun()?.event === LEVEL_ID);
  }

  // Wolfsnacht im Wald: auch hinter seinen Durchgängen auf Maps, die eine Wolfsnacht kennen (Waldwiese, Felsenschlucht)
  sideWolfNight() {
    return !!(LEVEL.side && LEVEL.wolfNight && game.side?.parent === 'forest' && isActive('wolves'));
  }

  // Ist hier gerade Glühwürmchen-Abend? Im Bambuswald und hinter seinen Durchgängen (Maps mit Kirschbäumen) beim Event,
  // auf einer Expeditions-Map mit der Event-Karte
  // Laternenabend: läuft das Event, und ist man im Bambuswald des Tierparks (LEVEL.lanterns)?
  lanternEvening() {
    return !!LEVEL.lanterns && isActive('lanterns');
  }

  fireflyEvening() {
    if (this.expMap) return this.expFireflies();
    return isActive('fireflies') && (LEVEL_ID === 'asia' || !!(LEVEL.side && LEVEL.fireflies));
  }

  // ... bzw. der Glühwürmchen-Abend (Bambuswald: Koi-Garten, Kirschblütenhang)
  expFireflies() {
    return !!(this.expMap && LEVEL.fireflies && expRun()?.event === LEVEL_ID);
  }

  // so viele rote Pandas sitzen beim Glühwürmchen-Abend gleichzeitig in den Kirschbäumen (Expedition: nur so viele, wie
  // auf der Tierliste noch frei sind; null: wie beim Event)
  redPandaTarget() {
    return this.expMap ? expRun()?.left?.redpanda ?? 0 : null;
  }

  // Pfeil am Bildschirmrand zum Ausgang, wenn die Map leer ist (über LuckWorld.markerTargets)
  expMarkers() {
    if (!this.expMap || unitsLeft() > 0) return [];
    const exit = EXITS.find((e) => e.to === '@camp');
    if (!exit) return [];
    const p = tileToWorld(exit.tx, exit.ty);
    return [{ id: 'exp-exit', x: p.x, y: p.y, icon: '⛺' }];
  }

  // Lagerfeuer im Camp (Bild aus LuckWorld), flackert
  drawCampfire({ tx, ty }) {
    const p = tileToWorld(tx, ty);
    const fire = this.add.image(p.x, p.y + 6, 'campfire').setOrigin(0.5, 0.9).setScale(0.5).setDepth(p.y + 6);
    const glow = this.add.image(fire.x, fire.y - 8, 'luck_sparkle').setBlendMode(Phaser.BlendModes.ADD).setTint(0xffa040).setScale(2.2).setDepth(fire.depth + 1).setAlpha(0.5);
    this.tweens.add({ targets: fire, scaleY: 0.54, duration: 180, yoyo: true, repeat: -1 });
    this.tweens.add({ targets: glow, alpha: 0.25, duration: 260, yoyo: true, repeat: -1 });
  }

  // Wohin käme dieses Tier im Zoo? 'star' (neue Art im Zoo oder seltene Variante), 'house' (freier Gehege-Platz) oder
  // 'tree' (Gehege voll bzw. gar keins: Naturreservat). Der Platz wird beim Fragen verbraucht – also in der Reihenfolge
  // fragen, in der die Tiere ankommen sollen (erst der Wagen, dann der Rest)
  expPlacer() {
    const room = new Map();
    const starred = new Set();
    const zoo = {};
    for (const [id, saved] of Object.entries(game.levels)) if (!LEVELS[id]?.expedition) for (const s of saved.animals ?? []) if (s.state === 'penned') zoo[s.species] = (zoo[s.species] ?? 0) + 1; // (ohne die Käfige im Camp)
    return (a) => {
      if (noParkHome(a.species)) return 'tree';
      const rare = !!a.skin && !skinInfo(a.species, a.skin)?.common;
      const fresh = !zoo[a.species] && !starred.has(a.species);
      const e = houseOf(a.species) ? null : parkPenFor(a.species, a.origin);
      let key = null;
      let free = Infinity;
      const pens = parkPens().filter((p) => accepts(p, a.species) && hasSlots(p));
      if (e && pens.length > 1) {
        // mehrere Gehege für diese Art (Brüllaffen, Schmetterlinge): alle Plätze zusammen
        key = `all:${quotaKey(a.species)}`;
        if (!room.has(key)) {
          const levels = [...new Set(pens.map((p) => p.level))];
          const inside = levels.reduce((n, l) => n + (game.levels[l]?.animals ?? []).filter((s) => s.state === 'penned' && quotaKey(s.species) === quotaKey(a.species)).length, 0);
          room.set(key, pens.reduce((n, p) => n + capFor(p, a.species), 0) - inside);
        }
        free = room.get(key);
      } else if (e && hasSlots(e)) {
        const qk = e.quota ? quotaKey(a.species) : null;
        key = `${e.id}:${qk}`;
        if (!room.has(key)) {
          const cap = penQuotas(e).find((q) => q.key === qk)?.cap ?? Infinity;
          const fits = (sp) => (qk ? quotaKey(sp) === qk : !e.species || e.species.includes(sp));
          room.set(key, cap - (game.levels[e.level]?.animals ?? []).filter((s) => s.state === 'penned' && fits(s.species)).length);
        }
        free = room.get(key);
      }
      const use = () => key && room.set(key, free - 1);
      if (rare || fresh) {
        starred.add(a.species);
        use();
        return 'star';
      }
      if (free > 0) {
        use();
        return 'house';
      }
      return 'tree';
    };
  }

  // Tiere im Camp auswildern (Naturreservat): bringt Herzen wie im Zoo. Gibt die Herzen zurück
  expRelease(list) {
    let hearts = 0;
    for (const a of list) {
      const h = releaseHearts(a.species, a.skin ?? a.variant);
      hearts += h;
      this.addHearts(h, a.species);
    }
    return hearts;
  }

  // Ankunft im Camp: Wagen vorbelegen, die Tiere in die Käfige setzen; wer nicht in den Wagen passt (auch wer im Zoo
  // ins Naturreservat käme), wartet im Sammelgehege bis zum Ende der Expedition – man kann ihn jederzeit noch einpacken.
  // Ein Pfeil zeigt erst auf die Käfige (neue Tiere), danach auf den Weg nach vorn (im letzten Camp aufs Auto)
  expArriveCamp(arrivals) {
    const r = expRun();
    if (!r) return;
    // seltene Varianten zuerst: sie bekommen sicher einen Platz (im Zoo zieht für sie eher ein normales Tier aus)
    const rare = (a) => !!a.skin && !skinInfo(a.species, a.skin)?.common;
    const all = [...r.wagon, ...r.stay, ...arrivals];
    const { wagon, stay, release } = sortWagon([...all.filter(rare), ...all.filter((a) => !rare(a))], this.expPlacer());
    r.wagon = wagon;
    r.stay = [...stay, ...release]; // (ausgewildert wird erst bei der Heimfahrt, siehe expGoHome)
    this.expWagonNote = null;
    this.expPlaceCampAnimals();
    // für die Statistik: geschaffte Maps (je Map nur einmal, auch wenn das Camp neu aufgebaut wird)
    // (Runs aus älteren Spielständen haben noch keinen Zähler: nur die letzte Map zählt)
    r.counted ??= Math.max(0, r.step - 1);
    for (; r.counted < r.step; r.counted++) countExpStep(r.biome);
    const released = '';
    const later = (ms, fn) => this.time.delayedCall(ms, fn);
    if (isFinalCamp() && !r.finalChest) {
      this.expPoint('car');
      later(700, () => this.expFinalChest(() => this.showToast(tr('🏁 Ziel erreicht! Sieh dir deinen Wagen an – mit dem Auto geht es zurück in den Zoo.', '🏁 Goal reached! Look at your wagon – the car takes you back to the zoo.') + released)));
    } else if (arrivals.length) {
      this.expPoint('cages');
      later(900, () => this.showToast(tr('⛺ Neues Camp! Deine Tiere sind in den Käfigen – sieh nach, wen du mitnimmst.', '⛺ New camp! Your animals are in the cages – check who comes along.') + released));
    } else if (r.step === 0) {
      this.expPoint('exit');
      later(900, () => this.showToast(LEVEL.campHint ?? tr('⛺ Willkommen im Expeditions-Camp! Folge rechts dem Weg tiefer in die Savanne – die Tafel am Zelt zeigt deinen Weg.', '⛺ Welcome to the expedition camp! Follow the path on the right deeper into the savanna – the board at the tent shows your route.')));
    } else this.expPoint(isFinalCamp() ? 'car' : 'exit');
  }

  // Tiere des Wagens in die Käfige setzen (je eins), die übrigen ins Sammelgehege; vorher die alten entfernen
  expPlaceCampAnimals() {
    const r = expRun();
    for (const a of this.expCampAnimals) {
      const i = this.animals.indexOf(a);
      if (i >= 0) this.animals.splice(i, 1);
      a.destroy();
    }
    this.expCampAnimals = [];
    if (!r) return;
    const cages = ENCLOSURES.filter((e) => e.cage !== undefined).sort((p, q) => q.seed.tx + q.seed.ty - (p.seed.tx + p.seed.ty) || q.seed.ty - p.seed.ty); // vorderster Käfig (zur Kamera hin) zuerst
    const corral = ENCLOSURES.find((e) => e.corral);
    const put = (d, e) => {
      if (!e || !SPECIES[d.species]) return;
      const a = this.createAnimal(d.species, 0, 0, d.variant);
      a.skin = d.skin ?? null;
      a.origin = d.origin;
      if (isWaterAnimal(d.species)) a.campBag = true; // Fische: im Tank im Käfig (wie an Land), kein Wasser
      this.placeInPen(a, e, true);
      if (a.campBag) a.useBagLook?.();
      // Nilpferde stehen im Käfig an Land (der Trog ist zu klein zum Schwimmen; sonst sähe man nur ihren Kopf im Sand)
      if (a instanceof Hippo) { // (auch der Tapir)
        a.onLand = true;
        a.penTime = Infinity;
        a.useBagLook();
        a.pickWander();
      }
      this.expCampAnimals.push(a);
    };
    wagonCages(r.wagon).forEach((c, i) => c.animals.forEach((d) => put(d, cages[i]))); // je Art ein Käfig
    for (const d of r.stay) put(d, corral);
  }

  // Pfeil über dem, was als Nächstes dran ist: 'cages', 'exit' oder 'car' (null: weg)
  expPoint(what) {
    this.expArrow?.destroy();
    this.expArrow = null;
    if (!what) return;
    let at;
    if (what === 'cages') at = { ...tileToWorld(LEVEL.cageCenter.tx, LEVEL.cageCenter.ty), lift: 30 };
    else if (what === 'car') at = { ...tileToWorld(LEVEL.car.tx, LEVEL.car.ty), lift: 110 };
    else if (LEVEL.canoe) at = { ...tileToWorld(LEVEL.canoe.tx, LEVEL.canoe.ty), lift: 46 }; // Dschungel: weiter mit dem Kanu
    else {
      const e = EXITS.find((x) => x.to === '@next');
      at = { ...tileToWorld(e.tx, e.ty), lift: 50 }; // knapp über dem Schild am Ausgang
    }
    // wie Mavis Pfeil im Tutorial (npc/Mavi.js), nur größer
    const img = this.add.text(at.x, at.y - at.lift, '▼', { fontFamily: 'Arial', fontSize: '34px', color: '#e8483f', stroke: '#ffffff', strokeThickness: 5, resolution: 4 }).setOrigin(0.5, 1).setDepth(100001);
    this.tweens.add({ targets: img, y: img.y - 12, duration: 450, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    this.expArrow = img;
  }

  // Camp-Deko: Zelt (gezeichneter Platzhalter) und Tafel mit dem Weg der Expedition
  expDrawCamp() {
    if (LEVEL.tent) {
      if (!this.textures.exists('exp_tent')) {
        const tex = this.textures.createCanvas('exp_tent', 200, 150);
        const c = tex.getContext();
        const poly = (pts, fill) => {
          c.beginPath();
          pts.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y)));
          c.closePath();
          c.fillStyle = fill;
          c.fill();
          c.strokeStyle = '#5a3c1c';
          c.lineWidth = 2;
          c.stroke();
        };
        c.fillStyle = 'rgba(40, 30, 10, 0.25)';
        c.beginPath();
        c.ellipse(100, 112, 96, 34, 0, 0, Math.PI * 2);
        c.fill();
        poly([[100, 8], [8, 100], [100, 146]], '#d8b46c'); // linke Seite (zur Kamera)
        poly([[100, 8], [100, 146], [192, 100]], '#b48a48'); // rechte Seite
        poly([[100, 40], [62, 110], [100, 132]], '#5a3c1c'); // Eingang
        c.strokeStyle = '#6b4224';
        c.lineWidth = 4;
        c.beginPath();
        c.moveTo(100, 8);
        c.lineTo(100, 0);
        c.stroke();
        tex.refresh();
      }
      const p = tileToWorld(LEVEL.tent.tx, LEVEL.tent.ty);
      const h = this.textures.getFrame('exp_tent').height; // gemaltes Zelt (tools/expedition-sprites.py) bzw. der Platzhalter: unten 4 Pixel Rand
      this.add.image(p.x, p.y + 48, 'exp_tent').setOrigin(0.5, (h - 4) / h).setDepth(p.y + 48);
    }
    if (LEVEL.board) this.expDrawBoard(LEVEL.board);
  }

  // Tafel: 4 Maps und das Ziel als Stationen; gespielte abgehakt, ein roter Pfeil zeigt, wo man gerade ist (im Camp nach Map n)
  expDrawBoard({ tx, ty }) {
    const r = expRun();
    const p = tileToWorld(tx, ty);
    const d = p.y + 10;
    const g = this.add.graphics().setDepth(d + 0.05);
    // leichter Schatten auf dem Boden unter den Pfosten (wie bei Truhe und Zelt), weich in zwei Lagen
    this.add.ellipse(p.x + 4, p.y - 1, 112, 26, 0x14320a, 0.12).setDepth(d - 1);
    this.add.ellipse(p.x + 4, p.y - 1, 84, 16, 0x14320a, 0.16).setDepth(d - 0.9);
    // gemaltes Brett mit Pfosten (exp_board, tools/expedition-sprites.py: Brett oben, BOARD.h hoch); ohne Bild gezeichnet
    let x0;
    let y0;
    let W;
    let H;
    if (this.textures.exists('exp_board')) {
      const f = this.textures.getFrame('exp_board');
      const img = this.add.image(p.x, p.y, 'exp_board').setOrigin(0.5, (f.height - 4) / f.height).setDepth(d);
      W = img.width;
      H = BOARD_PLANK_H;
      x0 = p.x - W / 2;
      y0 = p.y - (f.height - 4);
    } else {
      W = 132;
      H = 62;
      x0 = p.x - W / 2;
      y0 = p.y - 92;
      g.fillStyle(0x6b4224, 1);
      g.fillRect(p.x - 34, y0 + H - 4, 6, 96 - H);
      g.fillRect(p.x + 28, y0 + H - 4, 6, 96 - H);
      g.fillStyle(0xc9965a, 1).fillRoundedRect(x0, y0, W, H, 6);
      g.lineStyle(3, 0x6b4224, 1).strokeRoundedRect(x0, y0, W, H, 6);
    }
    const n = RUN_LENGTH + 1; // Maps und Ziel
    const R = 8; // Radius der Stationen
    const step = (W - 36) / (n - 1);
    const cy = y0 + H / 2 + 7;
    const nx = (i) => x0 + 18 + i * step;
    g.lineStyle(3, 0x6b4224, 0.7);
    for (let i = 0; i < n - 1; i++) for (let k = 0; k < 4; k++) g.lineBetween(nx(i) + R - 2 + k * (step - 2 * R + 4) / 4, cy, nx(i) + R - 2 + (k + 0.5) * (step - 2 * R + 4) / 4, cy);
    const style = { fontFamily: 'Trebuchet MS, Arial', fontSize: '11px', fontStyle: 'bold', color: '#3a2414', resolution: 4 };
    for (let i = 0; i < n; i++) {
      const done = i < r.step;
      const goal = i === n - 1;
      const x = nx(i);
      g.fillStyle(goal ? 0xf4c43a : done ? 0x5fae4a : 0xf8e6c0, 1).fillCircle(x, cy, R);
      g.lineStyle(2, 0x3a2414, 1).strokeCircle(x, cy, R);
      // Haken und Stern gezeichnet (genau mittig), Zahlen als Text: dessen Kasten hat unten Platz für Unterlängen, darum
      // sitzt die Mitte der Ziffer etwas über der Mitte des Kastens
      if (goal) {
        const pts = [];
        for (let k = 0; k < 10; k++) {
          const a = -Math.PI / 2 + (k * Math.PI) / 5;
          const rr = k % 2 ? 2.4 : 5.6;
          pts.push(new Phaser.Geom.Point(x + Math.cos(a) * rr, cy + 0.6 + Math.sin(a) * rr));
        }
        g.fillStyle(0x3a2414, 1).fillPoints(pts, true);
      } else if (done) {
        g.lineStyle(2.4, 0xffffff, 1).beginPath().moveTo(x - 4, cy + 0.2).lineTo(x - 1.2, cy + 3).lineTo(x + 4.2, cy - 3).strokePath();
      } else {
        this.add.text(x, cy, String(i + 1), style).setOrigin(0.5, 0.56).setDepth(d + 0.1);
      }
    }
    // "Du bist hier": zwischen der zuletzt gespielten und der nächsten Station (am Anfang über der ersten)
    const here = r.step >= RUN_LENGTH ? nx(n - 1) : r.step === 0 ? nx(0) : (nx(r.step - 1) + nx(r.step)) / 2;
    g.fillStyle(0xe8483f, 1).fillTriangle(here - 6, cy - 22, here + 6, cy - 22, here, cy - 12);
    this.add.text(p.x, y0 + 11, tr('Expedition', 'Expedition'), style).setOrigin(0.5).setDepth(d + 0.1);
  }

  // Wagen-Tafel (an den Käfigen im Camp)
  expOpenWagon() {
    const r = expRun();
    if (!r || this.leaving || isWagonOpen() || isLuckPickerOpen()) return;
    this.scene.pause();
    const view = () => {
      const place = this.expPlacer(); // erst der Wagen, dann die anderen (so verteilen sich die freien Plätze)
      const list = wagonCages(r.wagon);
      const cages = Array.from({ length: wagonCageCount() }, (_, i) => (list[i] ? { cap: cageSize(list[i].species), animals: list[i].animals.map((a) => ({ icon: wagonIcon(a), badge: place(a) })) } : null));
      const stay = r.stay.map((a) => ({ icon: wagonIcon(a), badge: place(a) }));
      const note = [this.expWagonNote, r.stay.length ? tr('Wer nicht im Wagen ist, wartet im Sammelgehege bis zum Ende der Expedition – bei der Heimfahrt wird er im Naturreservat ausgewildert (bringt Herzen).', 'Animals not in the wagon wait in the holding pen until the expedition ends – when you head home they are released into the nature reserve (earns hearts).') : null].filter(Boolean).join('<br>');
      return { cages, stay, note };
    };
    openWagon(view, {
      tap: (where, i, j) => {
        if (where === 'cage') {
          const a = wagonCages(r.wagon)[i]?.animals[j];
          if (a) r.stay.push(...r.wagon.splice(r.wagon.indexOf(a), 1));
        } else if (fitsWagon(r.wagon, r.stay[i])) r.wagon.push(...r.stay.splice(i, 1));
        else {
          const own = wagonCages(r.wagon).some((c) => c.species === r.stay[i].species);
          this.expWagonNote = own
            ? tr('Der Käfig für diese Tiere ist voll – tippe erst eins davon im Wagen an.', 'The cage for these animals is full – tap one of them in the wagon first.')
            : tr('Alle Käfige sind belegt – mach erst einen Käfig frei (tippe seine Tiere an).', 'All cages are taken – free a cage first (tap its animals).');
          return;
        }
        this.expWagonNote = null;
      },
      close: () => {
        this.scene.resume();
        this.expWagonNote = null;
        this.expPlaceCampAnimals();
        this.expPoint(isFinalCamp() ? 'car' : 'exit');
      },
    });
  }

  // am Auto im Camp: Expedition beenden? (Rückfrage, damit man nicht aus Versehen heimfährt)
  expConfirmHome() {
    const r = expRun();
    if (!r || this.leaving || isWagonOpen()) return;
    this.scene.pause();
    const icons = r.wagon.length ? animalIcons(r.wagon.map((a) => a.species), 2.4) : '';
    const html = isFinalCamp()
      ? `<h2>${tr('Zurück in den Zoo?', 'Back to the zoo?')}</h2><p>${icons}</p>`
      : `<h2>${tr('Expedition beenden?', 'End the expedition?')}</h2><p>${tr(`Du hast erst ${r.step} von ${RUN_LENGTH} Maps geschafft.`, `You have only done ${r.step} of ${RUN_LENGTH} maps.`)}</p><p>${icons}</p>`;
    openConfirm(html, tr('Zum Zoo fahren', 'Drive to the zoo'), isFinalCamp() ? tr('Noch nicht', 'Not yet') : tr('Weiter erkunden', 'Keep exploring'), {
      yes: () => {
        this.scene.resume();
        this.expGoHome();
      },
      close: () => this.scene.resume(),
    });
  }

  // Heimfahrt aus dem Camp: die Tiere im Wagen kommen mit in den Zoo, die übrigen ins Naturreservat; der Run ist vorbei
  expGoHome() {
    const r = expRun();
    if (!r || this.leaving) return;
    this.expRelease(r.stay);
    this.carryHome = r.wagon.map((a) => ({ ...a }));
    endRun();
    this.travelTo('park');
  }

  // Beschriftung über einem Übergang (Expedition: welche Map als Nächstes kommt)
  exitLabel(exit) {
    const r = expRun();
    if (exit.to === '@next' && r) return isFinalCamp() ? tr('Ziel erreicht', 'Goal reached') : tr(`Weiter · Map ${r.step + 1} von ${RUN_LENGTH}`, `Onward · Map ${r.step + 1} of ${RUN_LENGTH}`);
    if (exit.to === '@camp' && r && r.step >= RUN_LENGTH) return tr('Zum Ziel-Camp', 'To the final camp');
    return exit.label;
  }

  // am Weg aus dem Camp: die Karten für die nächste Map (wie in einer Kiste; neu würfeln gegen Herzen)
  expOnwards(prev) {
    this.player.x = prev.x;
    this.player.y = prev.y;
    if (this.leaving || isLuckPickerOpen() || isWagonOpen()) return;
    const r = expRun();
    if (!r) return;
    if (isFinalCamp()) {
      if (this.time.now < (this.blockedHintAt ?? 0)) return;
      this.blockedHintAt = this.time.now + 4000;
      this.showToast(tr('🏁 Die Expedition ist geschafft! Am Auto geht es mit deinem Wagen zurück in den Zoo.', '🏁 The expedition is complete! Take your wagon back to the zoo at the car.'));
      return;
    }
    let rerolls = 0;
    let cards = rollRunCards(cardCount());
    this.scene.pause();
    openLuckPicker(
      () => ({
        title: tr(`Wohin geht es? (Map ${r.step + 1} von ${RUN_LENGTH})`, `Where to? (Map ${r.step + 1} of ${RUN_LENGTH})`),
        cards: cards.map((c) => this.expCardView(c)),
        cost: rerollCost(rerolls),
        hearts: game.hearts,
      }),
      (i) => {
        this.scene.resume();
        this.expTake(cards[i]);
      },
      () => {
        game.hearts -= rerollCost(rerolls);
        rerolls++;
        cards = rollRunCards(cardCount());
        this.updateHud();
      },
    );
  }

  expCardView(c) {
    // darunter: Map, ihr gewürfeltes Wetter und ihre Tiere (kleine Bilder)
    const w = SEASON_INFO[c.plan?.season ?? 'normal'];
    const animals = Object.keys(c.plan?.home ?? {}).map((s) => animalIcon(s, 1.6)).join('');
    const where = `<br>${tr('Nächste Map', 'Next map')}: <b>${mapName(c.map)}</b><span class="exp-plan" title="${w.name}">${w.icon}${animals}</span>`;
    if (c.kind === 'animal') {
      const name = ANIMAL_INFO[c.species]?.[0] ?? c.species;
      return { icon: animalIcon(c.species, 3), title: name, text: tr('Taucht dort sicher auf.', 'Sure to show up there.') + where, color: '#5fae4a', tag: tr('Tier', 'Animal') };
    }
    if (c.kind === 'rare') {
      const v = this.luck.view({ kind: 'rare', species: c.species, skin: c.skin, tier: 'rare' });
      return { ...v, text: tr('Kommt dort sicher als seltene Variante!', 'Sure to show up there as a rare variant!') + where };
    }
    if (c.kind === 'bonus') {
      const v = this.luck.view({ kind: 'bonus', id: c.id });
      return { ...v, text: v.text + where };
    }
    if (c.kind === 'event' && LEVELS[c.map]?.fireflies) {
      return { icon: animalIcon('redpanda', 3), title: tr('Glühwürmchen-Abend', 'Firefly Evening'), text: tr('Es wird Abend, Glühwürmchen schweben umher – rote Pandas sitzen in den Kirschbäumen!', 'Evening falls and fireflies drift about – red pandas sit in the cherry trees!') + where, color: '#7a5ad0', tag: tr('Event', 'Event') };
    }
    if (c.kind === 'event' && LEVELS[c.map]?.wolfNight) {
      return { icon: animalIcon('wolf', 3), title: tr('Wolfsnacht', 'Wolf Night'), text: tr('Es wird Nacht im Wald – Wolfsrudel ruhen auf den Lichtungen. Folge ihren leuchtenden Spuren!', 'Night falls in the forest – wolf packs rest in the clearings. Follow their glowing tracks!') + where, color: '#3a4a8a', tag: tr('Event', 'Event') };
    }
    if (c.kind === 'event') {
      return { icon: animalIcon('gnu', 3), title: tr('Große Wanderung', 'Great Migration'), text: tr('Eine riesige Gnu-Herde zieht vorbei – fang ein Gnu!', 'A huge herd of wildebeest passes by – catch one!') + where, color: '#d07a2a', tag: tr('Event', 'Event') };
    }
    return { icon: '<img class="luck-img" src="assets/treasure_chest0.png" alt="" draggable="false">', title: tr('Schatzkiste', 'Treasure chest'), text: tr('Auf der Map steht eine Kiste.', 'There is a chest on the map.') + where, color: '#c08a2a', tag: tr('Kiste', 'Chest') };
  }

  // Karte genommen: zur gewählten Map (wer nicht im Wagen ist, zieht im Sammelgehege mit ins nächste Camp)
  expTake(card) {
    const r = expRun();
    if (card.kind === 'bonus' && card.id === 'heartRain') this.addHearts(HEART_RAIN);
    countExpCard(card.kind === 'bonus' ? card.id : card.kind); // für die Statistik
    const map = takeRunCard(card);
    this.leaveLevel({ to: map, arrive: LEVELS[map].start, label: LEVELS[map].name });
  }

  // nach der letzten Map: die große Abschlusskiste – Glücksbringer, die man noch nicht hat; gibt es weniger als Karten
  // (oder keine mehr), kommt ein Schatz mit FINAL_HEARTS Herzen dazu (eine große Belohnung, die immer wirkt), und die
  // übrigen Plätze füllt Deko der Welt dieser Expedition auf (erst dann – solange es Glücksbringer gibt, keine Deko)
  expFinalChest(then) {
    const r = expRun();
    r.finalChest = true;
    const roll = () => {
      const charms = Object.keys(CHARMS).filter((id) => !ownsCharm(id));
      const cards = rollCards({ rare: [], boni: [], charms }, cardCount());
      if (cards.length < cardCount()) cards.push({ kind: 'treasure' });
      const deco = rollCards({ rare: [], boni: [], charms: [], deco: finalChestDecor(biomeOf()) }, cardCount() - cards.length); // (Baupläne)
      return [...cards, ...deco];
    };
    const view = (c) => (c.kind === 'treasure'
      ? { icon: iconImg('bonus_heartRain'), title: tr('Schatz', 'Treasure'), text: tr(`${FINAL_HEARTS} Herzen für deinen Zoo.`, `${FINAL_HEARTS} hearts for your zoo.`), color: '#e0a820', tag: tr('Belohnung', 'Reward') }
      : this.luck.view(c));
    const take = (c) => {
      if (c.kind !== 'treasure') return this.luck.take(c); // (zählt dort für die Statistik)
      countChestPick('treasure');
      this.addHearts(FINAL_HEARTS);
      this.showToast(`${iconImg('bonus_heartRain')} ${tr(`<b>Schatz!</b> <span class="heart">♥</span> ${FINAL_HEARTS} für deinen Zoo.`, `<b>Treasure!</b> <span class="heart">♥</span> ${FINAL_HEARTS} for your zoo.`)}`);
    };
    let rerolls = 0;
    let cards = roll();
    this.scene.pause();
    openLuckPicker(
      () => ({ title: tr('🏁 Expedition geschafft! Deine Belohnung:', '🏁 Expedition complete! Your reward:'), cards: cards.map(view), cost: rerollCost(rerolls), hearts: game.hearts }),
      (i) => {
        this.scene.resume();
        take(cards[i]);
        this.time.delayedCall(300, then);
      },
      () => {
        game.hearts -= rerollCost(rerolls);
        rerolls++;
        cards = roll();
        this.updateHud();
      },
    );
  }

  // Hintergrundgeräusch des Levels starten; ein anderes (oder in einem Level ohne) sofort beenden.
  // Die Dateien sind groß: sie werden erst beim Betreten des Levels im Hintergrund geladen, damit das Spiel schnell startet.
  startAmbient() {
    const key = this.ambientKey();
    if (ambient && ambient.key !== key) {
      ambient.destroy();
      ambient = null;
    }
    if (!key) return;
    if (ambient) {
      // läuft schon (gleiches Geräusch im neuen Gebiet): auf die hier passende Lautstärke (z. B. aus dem Moor kommend)
      if (!this.leaving) this.tweens.add({ targets: ambient, volume: this.ambientVolume(key), duration: AMBIENT_FADE });
      return;
    }
    if (!this.cache.audio.exists(key)) {
      this.load.audio(key, `assets/sounds/${key}.mp3`);
      this.load.once('complete', () => {
        if (this.sys.isActive() && this.ambientKey() === key) this.startAmbient();
      });
      this.load.start();
      return;
    }
    ambient = this.sound.add(key, { loop: true, volume: 0 });
    ambient.play();
    // Lautstärke je Gebiet (ambientVolume in levels.js), sonst die normale
    this.tweens.add({ targets: ambient, volume: this.ambientVolume(key), duration: AMBIENT_FADE });
  }

  // Lautstärke des Hintergrundgeräuschs: je Gebiet (ambientVolume in levels.js), sonst die normale; in einer Zone mit
  // eigenem Geräusch (Moor, Hochebene) leiser
  ambientVolume(key, mix = null) {
    const base = AMBIENT_VOLUMES[key] ?? LEVEL.ambientVolume ?? AMBIENT_VOLUME;
    const zone = this.zoneAmbient();
    const z = mix ?? (zone && this.player ? this.zoneMix(zone) : 0);
    return base * (1 - (1 - ZONE_KEEP) * z);
  }

  // Hintergrundgeräusch: das des Levels, in der Wolfsnacht im Wald der Wald bei Nacht
  ambientKey() {
    if ((LEVEL_ID === 'savanna' && isActive('migration')) || this.expEvent?.()) return 'ambient_migration';
    if (this.fireflyEvening?.() || this.lanternEvening?.()) return 'ambient_forest_night'; // Glühwürmchen- und Laternenabend: Abendgeräusche
    return (LEVEL_ID === 'forest' && isActive('wolves')) || this.expWolfNight() || this.sideWolfNight() ? 'ambient_forest_night' : LEVEL.ambient;
  }

  // Level verlassen: Stand merken, folgende Tiere mitnehmen. Jedes Level hat seine eigenen Werkzeuge:
  // ein getragenes kommt nicht mit, sondern zurück an seinen Platz an der Hütte (sonst gäbe es es doppelt).
  leaveLevel(exit) {
    this.leaving = true;
    // zum ersten Mal mit Meerestieren zurück: Ankunft mit Mavi direkt vor dem Aquarium
    if (isPark(exit.to) && !isPark(LEVEL_ID) && !HOUSES[LEVEL_ID] && activeId() === 'reef' && seaReady(game) && this.followers.some((a) => a.origin === 'reef')) {
      exit = { ...exit, to: 'park2', arrive: AQUARIUM_TOUR };
    }
    let returned = null;
    if (CARRIED.includes(this.toolId)) {
      // mit dem Stock (bzw. Blätterzweig) in der Hand: der bleibt hier, das eingesteckte Werkzeug kommt wieder heraus
      this.tool.destroy();
      this.tool = this.stashedTool ? TOOLS[this.stashedTool].create(this, this.player) : null;
      this.toolId = this.stashedTool;
      this.stashedTool = null;
    }
    if (this.toolId) {
      returned = TOOLS[this.toolId].name;
      this.returnTool(this.toolId);
      this.tool.destroy();
      this.tool = null;
      this.toolId = null;
    }
    if (isPark(LEVEL_ID)) game.parkIncome = { ...game.parkIncome, [LEVEL_ID]: this.parkIncomeRates() }; // ab jetzt kommen die Herzen dieses Abschnitts laufend (siehe parkIncome)
    this.saveLevelState();
    if (LEVEL.expedition) delete game.levels[LEVEL_ID]; // Expedition: Camp und Maps beginnen immer frisch
    if (this.carryHome) {
      game.followers.push(...this.carryHome); // Heimfahrt aus dem Camp: die Tiere aus dem Wagen ziehen im Zoo ein
      this.carryHome = null;
    }
    writeSave(exit.to); // beim Laden geht es dann im neuen Gebiet weiter
    // Hintergrundgeräusch ausblenden, wenn das nächste Level ein anderes hat
    if (ambient && LEVELS[exit.to].ambient !== ambient.key) this.tweens.add({ targets: ambient, volume: 0, duration: 240 });
    this.cameras.main.fadeOut(250);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      setLoadingBackground(exit.to);
      // andere Gebiete brauchen Pakete, die nach dem Start im Hintergrund laden (siehe BootScene): darauf warten
      const groups = levelGroups(exit.to);
      const wait = !groupsLoaded(groups);
      showLoading(tr(`${LEVELS[exit.to].name} wird geladen …`, `Loading ${LEVELS[exit.to].name} …`), wait ? 0 : null);
      // aus einer Welt zurück in den Tierpark (nicht aus einem anderen Abschnitt oder Haus): zählt für die Tafeln (maybeShowPromo)
      const fromWorld = isPark(exit.to) && !isPark(LEVEL_ID) && !HOUSES[LEVEL_ID];
      const go = () => afterPaint(() => this.scene.restart({ level: exit.to, arrive: exit.arrive, returned, fromWorld, keepBoat: !!exit.keepBoat }));
      if (wait) whenGroupsLoaded(groups, setLoadingProgress).then(go);
      else go();
    });
  }

  // wartet mit der Ladeanzeige, bis diese Pakete geladen sind (siehe BootScene), und macht dann weiter
  afterGroupsLoaded(groups, then) {
    this.scene.pause();
    showLoading(tr('Weitere Tiere werden geladen …', 'Loading more animals …'), 0);
    whenGroupsLoaded(groups, setLoadingProgress).then(() => {
      hideLoading();
      this.scene.resume();
      then();
    });
  }

  // Tafel beim Zurückkommen aus einer Welt: ab der 2. Rückkehr einmal ein geschenktes Event (Tierbabys oder Reittier). Die
  // anderen Welten zeigt Mavi (Tutorial), dafür gibt es keine Tafel mehr
  maybeShowPromo() {
    if (this.leaving || isEventsOpen() || isToolChestOpen() || isTravelMapOpen() || isJournalOpen() || isShowcaseOpen() || isGiftOpen()) return;
    if (!game.promos.includes('gift') && this.giftReady()) this.showGift();
  }

  // Geschenk erst nach dem Tutorial, im Hauptabschnitt (Schafgehege, Computer), und wenn beide Events gerade startbar sind
  giftReady() {
    if (game.parkReturns < 2 || !storyAt('stands') || LEVEL_ID !== 'park') return false;
    if (eventState('babies').state !== 'ready' || eventState('ride').state !== 'ready') return false;
    return babyPlan(this.animals.filter((a) => a.state === 'penned')).length > 0 || this.aquariumBabyPair();
  }

  showGift() {
    game.promos.push('gift');
    countPromo('gift');
    this.scene.pause();
    openGiftEvent(
      (id) => {
        this.scene.resume();
        countPromo('gift' + id);
        // das Reittier braucht Bilder, die nach dem Start im Hintergrund laden (siehe BootScene)
        if (!groupsLoaded(EVENT_GROUPS[id] ?? [])) this.afterGroupsLoaded(EVENT_GROUPS[id], () => this.beginEvent(id, true));
        else this.beginEvent(id, true);
        this.time.delayedCall(4000, () => this.showToast(tr('Alle Events findest du am Computer im Haupthaus.', 'You can find all events at the computer in the main building.')));
      },
      () => this.scene.resume(),
    );
  }

  // Spielstand speichern (Autosave, Menü). Während eines Levelwechsels nicht: der ist dann schon gespeichert.
  saveGame() {
    if (this.leaving) return false;
    this.saveLevelState();
    return writeSave(LEVEL_ID);
  }

  // Menü: das Spiel pausiert, solange es offen ist
  openGameMenu() {
    if (this.leaving || isMenuOpen() || isEventsOpen() || isToolChestOpen() || isTravelMapOpen() || isJournalOpen()) return;
    this.scene.pause();
    openMenu(
      () => this.saveGame(),
      () => {
        this.saveGame();
        location.reload(); // Seite neu laden: zeigt den Startbildschirm
      },
      () => this.scene.resume(),
      () => this.showControls(),
      activeStep() ? () => this.skipTutorial() : null,
    );
  }

  // Tutorial überspringen (Menü): alles frei, keine Aufgaben mehr; das Gebiet baut sich neu auf (ohne Absperrungen, Pfeil,
  // Mavi an ihrem Platz der Aufgabe)
  skipTutorial() {
    skipStory();
    this.saveLevelState();
    const arrive = worldToTile(this.player.x, this.player.y);
    this.leaving = true;
    this.mavi.destroy();
    this.cameras.main.fadeOut(250);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      writeSave(LEVEL_ID);
      afterPaint(() => this.scene.restart({ level: LEVEL_ID, arrive, seasonNote: tr('Tutorial übersprungen – alle Welten sind offen. Viel Spaß!', 'Tutorial skipped – all worlds are open. Have fun!') }));
    });
  }

  // Tiere, liegende Werkzeuge und Begleiter dieses Levels merken (beim Verlassen bzw. Neuaufbau)
  saveLevelState() {
    game.levels[LEVEL_ID] = {
      animals: this.animals
        .filter((a) => a.state !== 'following' && !a.baby && !(['heron', 'flamingo', 'vulture', 'hyena', 'redpanda', 'howler', 'snake', 'tarantula', 'macaw', 'toucan', 'piranha', 'iguana', 'jaguar', 'gorilla', 'beaver', 'yak', 'snowleopard'].includes(a.species) && a.state === 'wild')) // wilde Reiher und Geier fliegen weiter, Hyänen ziehen weiter, Babys gibt es nur beim Event
        .map((a) => ({ species: a.species, variant: a.variant, skin: a.skin ?? null, ...(a.uid != null ? { uid: a.uid } : {}), since: a.penSince ?? 0, state: a.state, ...(a.savedSpot?.() ?? { x: a.x, y: a.y }), life: a.life })),
      pickups: this.pickups.filter((p) => !p.collected && !p.temporary).map((p) => ({ tool: p.tool, x: p.x, y: p.y })),
      ...(this.thicket ? { thicket: this.thicket.state() } : {}), // geschlagenes Dickicht (wächst nach der Uhr nach)
      season: LEVEL.season, // Wetterphase: wechselt sie bis zum nächsten Besuch, ziehen die wilden Tiere weiter
    };
    game.followers = this.followers.map((a) => ({ species: a.species, variant: a.variant, skin: a.skin ?? null, origin: a.origin, ...(a.uid != null ? { uid: a.uid } : {}) }));
    game.tool = CARRIED.includes(this.toolId) ? this.stashedTool : this.toolId; // beim Neuaufbau bleibt das Werkzeug in der Hand (beim Verlassen ist es schon zurückgelegt)
  }

  // Seilnetz über einem Gehege, auf Höhe der Netzstangen. Es liegt über allem, was im Gehege ist,
  // aber hinter allem, was davor steht.
  drawNetRoof(e) {
    const H = 32; // Höhe der Netzstangen
    // Netzfelder (halbe Kacheln): jede Innenkachel, dazu die halbe Kachel bis zur Zaunmitte daneben
    const cells = new Set();
    const add = (a, b) => cells.add(a + ',' + b); // Feld a, b reicht von a/2 bis a/2 + 0.5 (Kachel-Koordinaten)
    for (const { tx, ty } of e.tiles) {
      for (const [da, db] of [[0, 0], [1, 0], [0, 1], [1, 1]]) add(2 * tx - 1 + da, 2 * ty - 1 + db);
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]]) {
        if (e.tileSet.has(tx + dx + ',' + (ty + dy))) continue;
        // halbe Kachel Richtung Zaun
        const ca = dx > 0 ? [2 * tx + 1] : dx < 0 ? [2 * tx - 2] : [2 * tx - 1, 2 * tx];
        const cb = dy > 0 ? [2 * ty + 1] : dy < 0 ? [2 * ty - 2] : [2 * ty - 1, 2 * ty];
        for (const a of ca) for (const b of cb) add(a, b);
      }
    }
    // Ecke eines Netzfelds: (a/2, b/2) in Kachel-Koordinaten (Kachelmitte = ganze Zahl), auf Höhe der Netzstangen
    const corner = (a, b) => {
      const p = tileToWorld(a / 2, b / 2);
      return [p.x, p.y - H];
    };
    const maxY = Math.max(...e.tiles.map(({ tx, ty }) => tileToWorld(tx, ty).y));
    const g = this.add.graphics().setDepth(maxY + TILE_H + 1);
    g.lineStyle(1, 0xd8c89a, 0.55);
    const drawn = new Set();
    const edge = (a0, b0, a1, b1) => {
      const key = [a0, b0, a1, b1].join(',');
      if (drawn.has(key)) return;
      drawn.add(key);
      g.lineBetween(...corner(a0, b0), ...corner(a1, b1));
    };
    g.fillStyle(0x8a7a5a, 0.6);
    for (const key of cells) {
      const [a, b] = key.split(',').map(Number);
      edge(a, b, a + 1, b);
      edge(a, b, a, b + 1);
      edge(a + 1, b, a + 1, b + 1);
      edge(a, b + 1, a + 1, b + 1);
      g.fillRect(...corner(a, b), 1, 1);
    }
  }

  // Tafel am Gehegeschild (die einzige: sie erscheint, sobald man davorsteht): erst das Tier, dann die Tiere dieser Art
  // im Gehege. Mehrere Schilder nah beieinander (gemeinsame Gehege): das nächste zählt
  updateSign() {
    const p = this.player;
    const dist = (s) => Math.hypot(p.x - s.x, (p.y - s.y) * 2);
    let sign = null; // nur die Gehegeschilder (an Wegweisern keine Tafel)
    for (const s of this.enclosureSigns) if (dist(s) < SIGN_DIST && (!sign || dist(s) < dist(sign))) sign = s;
    if (sign === this.shownSign) return;
    this.shownSign = sign;
    this.updateToolbar();
    if (!sign) {
      this.signPanel.classList.remove('show');
      return;
    }
    this.showSignPanel(sign);
    this.signPanel.scrollTop = 0;
    this.signPanel.classList.add('show');
  }

  // Zwei Zustände derselben Tafel: kompakt (man steht davor: nur die Tierart) und offen (Aktionstaste oder Tafel antippen:
  // groß in der Mitte, das Spiel pausiert, darunter die Tiere dieser Art zum Aussuchen). In der offenen Tafel gibt man
  // einem Tier einen Namen (signView: Namen eingeben bzw. Rückfrage, wenn hier schon ein anderes Tier der Freund ist)
  showSignPanel(sign) {
    const open = this.signOpen === sign;
    this.signAnimals = this.signResidents(sign);
    const view = open ? this.signView : null;
    this.signPanel.innerHTML = view ? this.friendView(sign, view) : this.enclosureInfo(sign.enclosure, sign, this.signAnimals, open);
    if (open && !view) this.pickResident(this.signPick ?? 0, false);
    if (view?.mode === 'name' && !isTouch()) this.signPanel.querySelector('.name-input')?.focus(); // am Tablet erst beim Antippen (sonst springt die Tastatur auf)
    this.signPanel.onclick = (ev) => {
      if (!this.signOpen) return this.openSign(); // kompakt: antippen öffnet die Tafel
      const t = ev.target;
      if (t.closest('[data-close]')) return this.closeSign();
      if (t.closest('[data-back]')) return this.signView?.then ? this.closeSign() : this.setSignView(null);
      if (t.closest('[data-yes]')) return this.setSignView({ mode: 'name', animal: this.signView.animal, name: randomName(this.signView.animal.species) });
      if (t.closest('[data-dice]')) {
        const input = this.signPanel.querySelector('.name-input');
        input.value = randomName(this.signView.animal.species, input.value.trim());
        return;
      }
      if (t.closest('[data-ok]')) return this.finishNaming();
      const btn = t.closest('[data-resident]');
      if (btn) this.chooseResident(Number(btn.dataset.resident));
    };
  }

  setSignView(view) {
    this.signView = view;
    if (this.signOpen) this.showSignPanel(this.signOpen);
  }

  // Tafel am Gehegeschild öffnen: das Spiel pausiert, die Tasten steuern die Auswahl (Pfeile/WASD wählen ein Tier,
  // E/Enter/Leertaste nimmt es, Esc schließt). Beim Namen-Eingeben gehen die Tasten ins Eingabefeld
  // (sign/view: aus einem erfüllten Bedürfnis gleich zum Benennen dieses Tiers, auch wenn Henrik nicht am Schild steht)
  openSign(sign = this.shownSign, view = null) {
    if (!sign || this.signOpen || this.leaving) return;
    this.signOpen = sign;
    this.signPick = 0;
    this.signView = view;
    this.scene.pause();
    this.showSignPanel(sign);
    this.signPanel.scrollTop = 0;
    this.signPanel.classList.add('open', 'show');
    document.body.classList.add('sign-open');
    this.signKeys = (ev) => {
      const k = ev.key;
      if (this.signView) {
        // Namen eingeben bzw. Rückfrage: Enter bestätigt, Esc geht zurück zur Liste; alles andere tippt (das Spiel bekommt
        // die Taste nicht, sonst würde es z. B. W, A, S, D und Leertaste abfangen)
        if (k === 'Enter') this.signView.mode === 'name' ? this.finishNaming() : this.setSignView({ mode: 'name', animal: this.signView.animal, name: randomName(this.signView.animal.species) });
        else if (k === 'Escape') this.signView.then ? this.closeSign() : this.setSignView(null);
        else return ev.stopPropagation();
        ev.preventDefault();
        ev.stopPropagation();
        return;
      }
      const n = this.signAnimals.length;
      const cols = this.residentColumns();
      const moves = { ArrowLeft: -1, a: -1, A: -1, ArrowRight: 1, d: 1, D: 1, ArrowUp: -cols, w: -cols, W: -cols, ArrowDown: cols, s: cols, S: cols };
      if (k in moves) {
        if (n) this.pickResident(Math.max(0, Math.min(n - 1, this.signPick + moves[k])));
      } else if (k === 'Enter' || k === ' ' || k.toUpperCase() === ACTION_KEY) {
        if (!ev.repeat) this.chooseResident(this.signPick);
      } else if (k === 'Escape' || k === 'Backspace') {
        this.closeSign();
      } else return;
      ev.preventDefault();
      ev.stopPropagation();
    };
    // (erst nach diesem Tastendruck lauschen, sonst wählt dasselbe E gleich das erste Tier)
    setTimeout(() => this.signOpen === sign && document.addEventListener('keydown', this.signKeys, true), 0);
    this.events.once('shutdown', () => this.signKeys && document.removeEventListener('keydown', this.signKeys, true));
  }

  closeSign() {
    if (!this.signOpen) return;
    document.removeEventListener('keydown', this.signKeys, true);
    this.signKeys = null;
    this.signOpen = null;
    this.signView = null;
    this.signPanel.classList.remove('open');
    document.body.classList.remove('sign-open');
    this.scene.resume();
    if (this.shownSign) this.showSignPanel(this.shownSign); // wieder kompakt
    else this.signPanel.classList.remove('show'); // (aus einem Bedürfnis geöffnet, Henrik steht nicht am Schild)
  }

  // so viele Tier-Kacheln stehen in einer Zeile (für Pfeil hoch/runter)
  residentColumns() {
    const tiles = [...this.signPanel.querySelectorAll('.resident')];
    return Math.max(1, tiles.filter((t) => t.offsetTop === tiles[0]?.offsetTop).length);
  }

  pickResident(i, scroll = true) {
    this.signPick = Math.max(0, Math.min(i, this.signAnimals.length - 1));
    this.signPanel.querySelectorAll('.resident').forEach((t, j) => t.classList.toggle('picked', j === this.signPick));
    // Tierfreund-Aufgabe: der rote Pfeil zeigt auf das ausgewählte Tier
    this.signPanel.querySelector('.sign-residents .tut-pointer')?.remove();
    if (this.friendTutorial() === 'name') this.signPanel.querySelector('.resident.picked')?.insertAdjacentHTML('beforeend', TUT_POINTER);
    if (scroll) this.signPanel.querySelector('.resident.picked')?.scrollIntoView({ block: 'nearest' });
  }

  // ein Tier in der Liste gewählt: ihm einen Namen geben (bzw. den Namen ändern). Ist hier schon ein anderes Tier dieser Art
  // der Freund, erst nachfragen (dessen Bindung bleibt gespeichert)
  chooseResident(i) {
    const a = this.signAnimals?.[i];
    if (!a) return;
    this.pickResident(i, false);
    if (!isPark(LEVEL_ID)) {
      this.showToast(tr('Hier im Haus kannst du noch keine Tierfreunde finden – probier es draußen im Tierpark.', 'You can’t make animal friends in here yet – try outside in the zoo.'));
      return;
    }
    const current = this.friendOfSign(this.signOpen);
    if (current && current !== a) return this.setSignView({ mode: 'swap', animal: a, old: current });
    this.setSignView({ mode: 'name', animal: a, name: bondOf(a)?.name ?? randomName(a.species) });
  }

  // der Tierfreund dieser Tierart in diesem Gehege (falls er noch da ist)
  friendOfSign(sign) {
    const kind = (sign.only ?? sign.enclosure.species ?? [])[0];
    const uid = kind && game.friends[friendKey(sign.enclosure, kind)];
    return uid != null ? this.animals.find((a) => a.uid === uid && a.enclosure === sign.enclosure) ?? null : null;
  }

  // Name übernehmen: das Tier bekommt eine feste Nummer und ist ab jetzt der Freund dieser Tierart im Gehege
  finishNaming() {
    const view = this.signView;
    if (view?.mode !== 'name') return;
    const a = view.animal;
    const typed = (this.signPanel.querySelector('.name-input')?.value ?? '').trim().slice(0, NAME_MAX);
    const name = typed || view.name || randomName(a.species);
    // neuer Freund oder neuer Name: ab dem zweiten Mal kostet es Herzen (wieder das alte Tier mit seinem Namen: frei)
    const changed = bondOf(a)?.name !== name;
    const cost = changed && !view.free ? nameCost() : 0; // aus einem erfüllten Bedürfnis: kostenlos
    if (cost > game.hearts) {
      this.showToast(tr(`Dafür brauchst du <span class="heart">♥</span> ${cost}.`, `You need <span class="heart">♥</span> ${cost} for that.`));
      return;
    }
    if (cost) this.addHearts(-cost);
    if (changed) {
      if (!view.free) game.namings++; // (kostenlose zählen nicht für den Preis der nächsten)
      countPark('named'); // für die Statistik
    }
    const uid = animalUid(a);
    const fresh = !game.bonds[uid];
    game.bonds[uid] ??= { species: a.species, points: 0, pettedAt: 0, since: Date.now() };
    game.bonds[uid].name = name;
    favoriteOf(game.bonds[uid]); // Lieblingsfutter (zufällig aus dem, was die Art frisst)
    game.friends[friendKey(a.enclosure, a.species)] = uid;
    if (view.then) {
      // aus einem Bedürfnis: Tafel zu, dann streicheln bzw. füttern wie beim Tierfreund
      this.closeSign();
      this.showToast(tr(`${name} ist jetzt dein Freund!`, `${name} is your friend now!`));
      view.then();
      this.updateQuestCard();
      return;
    }
    this.signView = null;
    this.showSignPanel(this.signOpen);
    this.updateQuestCard(); // Mavis Aufgabe zum Tierfreund: Fortschritt gleich zeigen
    this.showToast(fresh
      ? tr(`${name} ist jetzt dein Freund! Komm an den Zaun und streichle ${name} (${ACTION_KEY}).`, `${name} is your friend now! Come to the fence and pet ${name} (${ACTION_KEY}).`)
      : tr(`Dein Freund heißt jetzt ${name}.`, `Your friend is now called ${name}.`));
  }

  // Ansicht in der offenen Tafel: Namen eingeben (mit Würfel für einen Vorschlag) oder Rückfrage beim Wechsel
  friendView(sign, view) {
    const a = view.animal;
    const redraw = () => this.signOpen === sign && this.showSignPanel(sign);
    const kind = ANIMAL_INFO[a.species]?.[0] ?? a.species;
    const pic = `<span class="resident-pic big">${this.residentPortrait(a, 4, redraw)}</span>`;
    if (view.mode === 'swap') {
      const old = bondOf(view.old).name;
      return `<div class="sign-head">${pic}<span><b>${tr('Anderes Tier wählen?', 'Choose another animal?')}</b><small>${kind}</small></span></div>
        <p class="sign-text">${tr(`${old} ist hier schon dein Freund. Möchtest du lieber dieses Tier? Die Freundschaft mit ${old} bleibt gespeichert – wählst du ${old} später wieder, geht es dort weiter.`, `${old} is already your friend here. Would you rather choose this animal? Your friendship with ${old} is kept – if you choose ${old} again later, it continues where it left off.`)}</p>
        <div class="sign-close"><button type="button" data-back>${tr('Nein', 'No')}</button><button type="button" data-yes>${tr('Ja', 'Yes')}${this.friendTutorial() === 'name' ? TUT_POINTER : ''}</button></div>`;
    }
    const bond = bondOf(a);
    const value = String(view.name ?? '').replace(/"/g, '&quot;');
    return `<div class="sign-head">${pic}<span><b>${bond ? tr('Neuer Name?', 'New name?') : tr('Wie soll es heißen?', 'What should it be called?')}</b><small>${kind}</small></span></div>
      <div class="name-row"><input class="name-input" type="text" maxlength="${NAME_MAX}" value="${value}" autocomplete="off" spellcheck="false"><button type="button" class="dice" data-dice aria-label="${tr('Namen würfeln', 'Roll a name')}" title="${tr('Namen würfeln', 'Roll a name')}">🎲</button></div>
      <div class="sign-close"><button type="button" data-back>${tr('Zurück', 'Back')}</button><button type="button" data-ok>${tr('Fertig', 'Done')}${nameCost() && !view.free ? ` <span class="heart">♥</span> ${nameCost()}` : ''}${this.friendTutorial() === 'name' ? TUT_POINTER : ''}</button></div>`;
  }

  // Bild eines Tiers auf seinen sichtbaren Teil zugeschnitten (seltene Varianten mit eigenem Bild bzw. eingefärbt)
  residentPortrait(a, size, redraw) {
    const own = a.skin && hasAnimalIcon(a.skin) ? a.skin : a.species;
    const css = own === a.species && a.skin ? skinInfo(a.species, a.skin)?.css : null;
    const icon = animalIconFit(own, size, redraw);
    return css ? `<span style="filter:${css}">${icon}</span>` : icon;
  }

  // Tiere dieser Tierart(en) im Gehege des Schilds: der Tierfreund zuerst, dann die Großen, seltene Varianten vorn
  signResidents(sign) {
    const kinds = sign.only ?? sign.enclosure.species ?? [];
    return this.animals
      .filter((a) => a.state === 'penned' && a.enclosure === sign.enclosure && (!kinds.length || kinds.includes(a.species)))
      .sort((a, b) => isFriend(b) - isFriend(a) || !!a.baby - !!b.baby || !!b.skin - !!a.skin);
  }

  // Inhalt der Tafel: Bild, Name und Wissen zur Tierart, ihre Plätze, darunter die Tiere, die hier wohnen (zum Antippen)
  enclosureInfo(enclosure, sign, residents = [], open = false) {
    const kinds = sign.only ?? enclosure.species ?? [];
    // Bilder auf ihren sichtbaren Teil zugeschnitten (alle gleich groß); den Zuschnitt misst das Bild beim ersten Mal aus
    const redraw = () => this.shownSign === sign && this.showSignPanel(sign);
    const head = kinds
      .map((s) => {
        const [name, text] = ANIMAL_INFO[s] ?? [s, ''];
        return `<div class="sign-head">${animalIconFit(s, 3, redraw)}<span><b>${name}</b><small>${sign.name ? `${sign.name} · ` : ''}${enclosure.name}</small></span></div>${text ? `<p class="sign-text">${text}</p>` : ''}`;
      })
      .join('') || `<b>${sign.name ?? enclosure.name}</b>`;
    const c = sign.counts[0];
    const slots = c ? `<div class="pen-slots">${tr('Plätze', 'Spaces')}: <b>${c.text.text}</b></div>` : '';
    // der Tierfreund hier: Name, Stufe, und ob er sich gerade über Besuch freut (Streicheln geht wieder)
    const friend = isPark(LEVEL_ID) ? this.friendOfSign(sign) : null;
    const fb = friend && bondOf(friend);
    const eats = fb && SPECIES_FOOD[fb.species];
    const ready = fb && canPet(fb) && (!eats || canFeed(fb));
    const fav = fb?.favoriteKnown && FEED_SORTS[fb.favorite] ? `<div class="sign-friend">${tr('Lieblingsfutter', 'Favorite food')}: <b>${FEED_SORTS[fb.favorite].name}</b></div>` : '';
    const pr = fb && levelProgress(fb.points);
    const next = pr && pr.level < pr.max
      ? tr(`Noch ${pr.need} ${pr.need === 1 ? 'Punkt' : 'Punkte'} bis Stufe ${pr.level + 1}: ${levelText(fb.name, pr.level + 1)}`, `${pr.need} more ${pr.need === 1 ? 'point' : 'points'} to level ${pr.level + 1}: ${levelText(fb.name, pr.level + 1)}`)
      : tr('Höchste Stufe erreicht!', 'Highest level reached!');
    const progress = pr
      ? `<div class="friend-progress"><span class="friend-level">${tr(`Stufe ${pr.level} von ${pr.max}`, `Level ${pr.level} of ${pr.max}`)}</span><span class="friend-bar${pr.level >= pr.max ? ' max' : ''}"><i style="width:${Math.round(pr.frac * 100)}%"></i></span></div><small class="friend-next">${next}</small>`
      : '';
    const friendLine = fb
      ? `<div class="sign-friend">${tr('Dein Freund', 'Your friend')}: <b>${fb.name}</b> <span class="hearts">${levelHearts(friendLevel(fb.points))}</span>${ready ? ` · ${tr(`${fb.name} freut sich über Besuch`, `${fb.name} would love a visit`)}` : ''}</div>${progress}${fav}`
      : '';
    // kompakt: nur der Hinweis, wie man die Tafel öffnet
    if (!open) {
      const how = isTouch() ? tr('Antippen', 'Tap') : `${ACTION_KEY} / Enter`;
      const what = isPark(LEVEL_ID) && residents.length && !fb ? tr('Freund aussuchen', 'Pick a friend') : tr(`Hier wohnen: ${residents.length}`, `Living here: ${residents.length}`);
      return `${head}${slots}${friendLine}<div class="sign-more">${what} · <b>${how}${this.friendTutorial() === 'name' ? TUT_POINTER : ''}</b></div>`;
    }
    const close = `<div class="sign-close"><button type="button" data-close>${tr('Schließen', 'Close')}${this.friendTutorial() === 'pet' ? TUT_POINTER : ''}</button></div>`;
    const hint = isPark(LEVEL_ID) && residents.length ? `<small class="sign-hint">${fb ? tr('Tippe ein Tier an, um es umzubenennen oder ein anderes zu wählen.', 'Tap an animal to rename it or choose another one.') : tr('Tippe ein Tier an und gib ihm einen Namen – dann ist es dein Freund.', 'Tap an animal and give it a name – then it is your friend.')}</small>` : '';
    const list = residents.length
      ? `<div class="sign-sub">${tr('Hier wohnen', 'Living here')}</div>${hint}<div class="sign-residents">${residents
          .map((a, i) => {
            // Beschriftung: der Name (benannte Tiere), der Name der Variante (seltene Tiere, Fischarten) oder der Tierart
            const bond = bondOf(a);
            const raw = bond?.name || (a.skin && skinInfo(a.species, a.skin)?.name) || (ANIMAL_INFO[a.species]?.[0] ?? a.species);
            const label = raw[0].toUpperCase() + raw.slice(1);
            const rare = a.skin && !skinInfo(a.species, a.skin)?.common;
            const cls = `${a.baby ? ' baby' : ''}${rare ? ' rare' : ''}${isFriend(a) ? ' friend' : ''}`;
            return `<button type="button" class="resident${cls}" data-resident="${i}"><span class="resident-pic">${this.residentPortrait(a, 3, redraw)}</span><small>${label}</small></button>`;
          })
          .join('')}</div>`
      : `<div class="sign-sub">${tr('Hier wohnt noch niemand.', 'Nobody lives here yet.')}</div>`;
    return head + slots + friendLine + list + close;
  }

  // Läuft man mit einem Tier in ein Gehege, das nicht zu ihm passt: kurzer Hinweis
  checkWrongHome(dt) {
    this.wrongHomeTimer -= dt;
    if (this.wrongHomeTimer > 0) return;
    for (const a of this.followers) {
      const enclosure = a.enclosureFullyAt(a.x, a.y);
      if (!enclosure || accepts(enclosure, a.species)) continue;
      this.showToast(
        tr(
          `${animalIcon(a.species, 3)} wohnt nicht hier! Hier (${enclosure.name}) dürfen nur ${animalIcons(enclosure.species)} hinein. Schau aufs Schild am Tor!`,
          `${animalIcon(a.species, 3)} doesn’t live here! Only ${animalIcons(enclosure.species)} may go in here (${enclosure.name}). Check the sign at the gate!`,
        ),
      );
      this.wrongHomeTimer = WRONG_HOME_HINT;
      return;
    }
  }

  // Spieler und folgende Tiere öffnen das Tor; ist der Eingang frei, schließt es sich wieder. Auch Besucher, die in den
  // Streichelzoo gehen (die anderen laufen nie durch Tore)
  updateGate(dt) {
    const inZoo = (v) => { const t = v.tile; return this.visitors.grid.petAll?.has(t.tx + ',' + t.ty); };
    const petting = (this.visitors?.visitors ?? []).filter((v) => v.goal === 'petenter' || inZoo(v));
    const walkers = [this.player, ...this.followers, ...(this.safariCars?.walkers() ?? []), ...petting]; // (auch die Autos der Safari)
    for (const group of this.gateGroups) {
      // Abstand in Kachel-Proportionen (Kacheln sind halb so hoch wie breit)
      const near = walkers.some((w) => group.sprites.some((g) => Math.hypot(w.x - g.x, (w.y - g.y) * 2) < GATE_OPEN_DIST));
      if (near) {
        group.closeTimer = GATE_CLOSE_DELAY;
        if (!group.open) this.setGateOpen(group, true);
      } else if (group.open) {
        group.closeTimer -= dt;
        if (group.closeTimer <= 0) this.setGateOpen(group, false);
      }
    }
  }

  setGateOpen(group, open) {
    group.open = open;
    this.tweens.killTweensOf(group.sprites);
    this.tweens.add({ targets: group.sprites, alpha: open ? 0 : 1, duration: open ? 150 : 300 });
    // Schilder dieses Geheges: offen auf ihre eigene Tiefe (Figuren im Tor davor), geschlossen wieder vor das Tor
    for (const s of this.enclosureSigns ?? []) {
      if (s.enclosure !== group.enclosure || !s.lift) continue;
      for (const [p, d] of s.lift.parts) p.setDepth(open ? d + s.lift.drop : d);
    }
  }

  update(_time, delta) {
    if (this.leaving) return;
    // Begrenzen, damit nach einem Tab-Wechsel kein Riesensprung passiert
    const dt = Math.min(delta, 50) / 1000;
    const prev = { x: this.player.x, y: this.player.y };
    this.player.update(dt);
    this.floes?.update(dt); // auf einer fahrenden Scholle fährt Henrik mit
    this.sway.update(dt);
    this.meadowLife.update(dt);
    this.snowCover?.update(); // Fußspuren im Schnee
    this.forestLife?.update(dt);
    this.moorFog?.update(dt);
    this.savannaLife?.update(dt);
    this.safariCars?.update(dt);
    // Gorilla-Trommelduell: der Tier-Zähler oben läge über den Trommelpunkten – solange es läuft, ist er ausgeblendet
    const duel = this.tool instanceof DrumTool && !!this.tool.duel;
    if (duel !== this.counterDuelHidden) {
      this.counterDuelHidden = duel;
      document.getElementById('exp-counter')?.classList.toggle('duel', duel);
    }

    // Übergang in ein anderes Level?
    const { tx, ty } = worldToTile(this.player.x, this.player.y);
    // Ausgänge auf dem Fluss (Kanu) zählen nur, wenn man hineinpaddelt – sonst triebe einen die Strömung von selbst hindurch.
    // Nach dem Ankommen erst, wenn man einmal angehalten hat: wer die Taste beim Wechsel festhält, paddelt sonst gleich
    // wieder durch den Durchgang zurück
    if (!this.player.moving) this.canoeExitArmed = true;
    const at = exitAt(tx, ty);
    const exit = at?.canoe && (!this.player.moving || !this.canoeExitArmed) ? null : at;
    if (exit?.to === '@next') this.expOnwards(prev); // Expeditions-Camp: weiter (vorher die Karten)
    else if (exit?.to === '@camp') {
      const camp = campLevel();
      this.leaveLevel({ ...exit, to: camp ?? 'park', arrive: camp ? LEVELS[camp].start : undefined });
      return;
    } else if (exit?.to === '@side') {
      // Durchgang in eine kleine Map (siehe sideMaps.js)
      const map = enterPassage(LEVEL_ID, exit);
      this.leaveLevel({ ...exit, to: map, arrive: LEVELS[map].start, label: LEVELS[map].name });
      return;
    } else if (exit?.to === '@back') {
      // zurück zum Durchgang; durch den Fluss-Durchgang im Kanu
      const side = game.side;
      game.side = null;
      if (side?.canoe) {
        const w = tileToWorld(side.back.tx, side.back.ty);
        game.boat = { level: side.parent, x: w.x, y: w.y, riding: true };
      }
      this.leaveLevel({ ...exit, to: side?.parent ?? 'park', arrive: side?.back, keepBoat: true }); // (auch zu Fuß: das Kanu liegt noch, wo man es verlassen hat)
      return;
    } else if (exit && !isUnlocked(exit.to)) this.blockedExit(exit, prev);
    else if (exit) {
      this.leaveLevel(exit);
      return;
    }

    // Auto und Anhänger stehen schräg: als Tiefe gilt die Grundlinie dort, wo die Spielfigur gerade ist.
    // So steht man vor dem Anhänger davor und hinter dem Auto dahinter.
    for (const car of this.cars) {
      const b = car.body;
      const t = Phaser.Math.Clamp((this.player.x - b.ax) / (b.bx - b.ax), 0, 1);
      car.img.setDepth(b.ay + (b.by - b.ay) * t);
    }
    // am Futterautomaten: die Aktionstaste gibt Futter
    const feeder = (LEVEL.feeders ?? []).find((c) => {
      const p = tileToWorld(c.tx, c.ty);
      return Math.hypot(this.player.x - p.x, (this.player.y - p.y) * 2) < CHEST_DIST * 1.6;
    }) ?? null;
    if (feeder !== this.nearFeeder) {
      this.nearFeeder = feeder;
      this.updateToolbar();
    }
    // am Hauptrechner: die Aktionstaste zeigt die Events
    const computer = (LEVEL.computers ?? []).some((c) => {
      const p = tileToWorld(c.tx, c.ty);
      return Math.hypot(this.player.x - p.x, (this.player.y - p.y) * 2) < CHEST_DIST * 1.6;
    });
    if (computer !== this.nearComputer) {
      this.nearComputer = computer;
      this.updateToolbar();
    }
    // an einem leeren Bauplatz: die Aktionstaste öffnet den Buden-Katalog
    const slot = this.shopSlots?.find((s) => !s.kind && Math.hypot(this.player.x - s.x, (this.player.y - s.y) * 2) < CHEST_DIST * 1.8) ?? null;
    if (slot !== this.nearSlot) {
      this.nearSlot = slot;
      this.updateToolbar();
    }
    // an einer Kiste: die Aktionstaste öffnet sie
    const chest = (LEVEL.chests ?? []).find((c) => {
      const p = tileToWorld(c.tx, c.ty);
      return Math.hypot(this.player.x - p.x, (this.player.y - p.y) * 2) < CHEST_DIST * 1.6;
    }) ?? null;
    if (chest !== this.nearChest) {
      this.nearChest = chest;
      this.updateToolbar();
    }
    // am Bett: die Aktionstaste legt Henrik schlafen
    const bed = this.beds.find((b) => {
      const p = b.img ?? tileToWorld(b.tx, b.ty);
      return Math.hypot(this.player.x - p.x, (this.player.y - p.y) * 2) < CHEST_DIST * 2;
    }) ?? null;
    if (bed !== this.nearBed) {
      this.nearBed = bed;
      this.updateToolbar();
    }
    // an der Leiter des Hochstands: die Aktionstaste bringt Henrik hinauf; oben bringt ihn Laufen wieder herunter
    const stand = this.onStand ? null : this.stands.find((s) => Math.hypot(this.player.x - s.x, (this.player.y - s.y) * 2) < CHEST_DIST * 1.6) ?? null;
    if (stand !== this.nearStand) {
      this.nearStand = stand;
      this.updateToolbar();
    }
    if (this.onStand) {
      this.standLock -= dt;
      if (this.player.pushing && this.standLock <= 0) this.climbDown();
    }
    // in einem Gebäude: Dach und vordere Wände durchsichtig, damit man das Innere sieht
    const { tx: px, ty: py } = worldToTile(this.player.x, this.player.y);
    for (const house of this.houses) {
      const h = house.h;
      const inside = px >= h.tx0 && px <= h.tx1 && py >= h.ty0 && py <= h.ty1 && !(px === h.tx0 || py === h.ty0); // samt Tür
      if (inside !== house.inside) {
        house.inside = inside;
        if (h.style === 'office') this.time.delayedCall(0, () => this.mavi.updateArrow()); // Pfeil: Tür ↔ Computer
        if (house.roof) this.tweens.add({ targets: house.roof, alpha: inside ? HUT_ROOF_ALPHA : (ROOF_ALPHA[h.style] ?? 1), duration: 250 });
        this.tweens.add({ targets: house.front, alpha: inside ? Math.min(HUT_FRONT_ALPHA, FRONT_ALPHA[h.style] ?? 1) : (FRONT_ALPHA[h.style] ?? 1), duration: 250 });
      }
    }
    // Dschungel-Camp: am Steg beim Kanu geht es weiter
    if (this.expCamp && LEVEL.canoe) {
      const b = tileToWorld(LEVEL.canoe.board.tx, LEVEL.canoe.board.ty);
      const canoe = Math.hypot(this.player.x - b.x, (this.player.y - b.y) * 2) < 44;
      if (canoe !== this.nearCanoe) {
        this.nearCanoe = canoe;
        this.updateToolbar();
      }
    }
    // Raschelndes Dickicht (Expedition)
    if (this.expMap) this.expRustle(dt);
    // Expeditions-Camp: an den Käfigen öffnet die Aktionstaste den Wagen
    if (this.expCamp) {
      const t = worldToTile(this.player.x, this.player.y);
      const cages = LEVEL.cageAreas.some((z) => t.tx >= z.tx0 && t.tx <= z.tx1 && t.ty >= z.ty0 && t.ty <= z.ty1);
      if (cages !== this.nearCages) {
        this.nearCages = cages;
        this.updateToolbar();
      }
    }
    // am Auto: Schild zeigen, die Aktionstaste wird zur Schnellreise (das Auto ist breit, daher seitlich weiter)
    const nearOne = this.cars.find((c) => nearSegment(this.player.x, this.player.y, c.body) < c.body.hw + c.reach) ?? null;
    for (const c of this.cars) c.label.setVisible(c === nearOne);
    const near = !!nearOne;
    if (near !== this.nearCar) {
      this.nearCar = near;
      this.updateToolbar();
    }
    // Tierfreunde: Namensschilder, zum Zaun kommen, und ob man gerade einen streicheln kann
    this.updateFriends(dt);
    const friend = this.friendToPet();
    if (friend !== this.nearFriend) {
      this.nearFriend = friend;
      this.updateToolbar();
    }
    // Bedürfnisse (Blasen über den Tieren) und ob man gerade eins erfüllen kann
    this.updateNeeds(dt);
    const needy = this.needToMeet();
    if (needy !== this.nearNeed) {
      this.nearNeed = needy;
      this.updateToolbar();
    }
    // Besucherwünsche: Wunsch-Besucher in der Nähe, erfüllte Wünsche und der große Moment am Gehege
    const wisher = this.leaving ? null : (this.visitors?.wishNear(this.player) ?? null);
    if (wisher !== this.nearWish) {
      this.nearWish = wisher;
      this.updateToolbar();
    }
    this.updateWishes(dt);
    this.decor?.update(); // Setzen-Modus: Vorschau auf der Kachel vor Henrik
    // Mavis Buden-Aufgabe: sobald sie erklärt ist (oder sich der Stand ändert), leuchtet der nächste Knopf
    if (this.decor && this.buildHintStage() !== this.lastBuildHint) this.updateBuildHint();
    // am Gehegeschild oder im Gehege: die Werkzeugleiste zeigt "Gehege ausbauen"
    const penHere = this.penAtSign();
    if (penHere !== this.penHere) {
      this.penHere = penHere;
      this.updateToolbar();
    }
    // unter einem Orang-Utan im Baum: die Aktionstaste winkt
    const p0 = this.player;
    const orang = this.animals.find((a) => a.species === 'orangutan' && a.inTree?.() && Math.hypot(a.x - p0.x, (a.y - p0.y) * 2) < WAVE_DIST) ?? null;
    if (orang !== this.nearOrangutan) {
      this.nearOrangutan = orang;
      this.updateToolbar();
    }
    // an einer Schildkröte im Netz: die Aktionstaste schneidet
    const turtle = this.animals.find((a) => a.species === 'turtle' && a.netted() && Math.hypot(a.x - p0.x, (a.y - p0.y) * 2) < CUT_DIST) ?? null;
    if (turtle !== this.nearTurtle) {
      this.nearTurtle = turtle;
      this.updateToolbar();
    }
    // an einem großen Stock bzw. mit dem Stock am Biberdamm: die Aktionstaste hebt auf bzw. steckt ihn ins Loch
    if (this.beaverDam) {
      this.beaverDam.update(dt);
      const stick = this.beaverDam.stickNear(p0);
      const dam = this.beaverDam.nearHole(p0);
      if (stick !== this.nearStick || dam !== this.nearDam) {
        this.nearStick = stick;
        this.nearDam = dam;
        this.updateToolbar();
      }
    }
    // an einer großen Eiche (überall, wo eine steht): die Aktionstaste schüttelt Eicheln herunter
    if (this.oakList().length) {
      const oak = this.oakNear(p0);
      if (oak !== this.nearOak) {
        this.nearOak = oak;
        this.updateToolbar();
      }
    }
    // abgestellte Moorlaterne: erst nach einer kurzen Pause und wenn Henrik einmal weggegangen ist (sonst nähme der nächste
    // Lassowurf sie gleich wieder auf), dann nah dran mit der Aktionstaste aufheben
    if (this.lantern) {
      const d = Math.hypot(p0.x - this.lantern.x, (p0.y - this.lantern.y) * 2);
      if (d > LANTERN_ARM && this.time.now > this.lantern.placedAt + LANTERN_COOLDOWN) this.lantern.armed = true;
      const near = !!this.lantern.armed && d < LANTERN_TAKE;
      if (near !== !!this.nearLantern) {
        this.nearLantern = near;
        this.updateToolbar();
      }
    } else if (this.nearLantern) {
      this.nearLantern = false;
      this.updateToolbar();
    }
    // Yak-Herde: Salzstein aufheben, auf den Steinhaufen legen, das leckende Yak bürsten
    if (this.yakHerd) {
      this.yakHerd.update(dt);
      const salt = this.yakHerd.saltNear(p0);
      const cairn = this.toolId === 'salt' && this.yakHerd.nearCairn(p0);
      const licker = this.yakHerd.lickerNear(p0);
      if (salt !== this.nearSalt || cairn !== this.nearCairn || licker !== this.nearLicker) {
        this.nearSalt = salt;
        this.nearCairn = cairn;
        this.nearLicker = licker;
        this.updateToolbar();
      }
    }
    // am Futterstrauch: die Aktionstaste bricht einen Blätterzweig ab
    if (this.leafBushes) {
      this.leafBushes.update(dt);
      const bush = this.leafBushes.near(p0);
      if (bush !== this.nearBush) {
        this.nearBush = bush;
        this.updateToolbar();
      }
    }
    // kurz nach dem Aufheben kein Tausch: sonst wechselt man aus Versehen, wenn man über die Werkzeuge daneben läuft
    if (this.time.now >= (this.toolLockUntil ?? 0)) {
      for (const p of [...this.pickups]) if (p.checkCollect(this.player)) this.takeTool(p);
      if (this.tool && this.handSpots.some((h) => Math.hypot(this.player.x - h.x, this.player.y - h.y) < HAND_DIST)) this.dropTool();
    }
    this.pickups = this.pickups.filter((p) => !p.collected);
    this.tool?.update(dt);

    // Wilde Tiere fangen, die der Spieler berührt oder mit einem Werkzeug erwischt
    for (const a of this.animals) {
      if (a.canBeCaughtWith('touch') && Math.hypot(this.player.x - a.x, this.player.y - a.y) < CATCH_DIST) this.catchAnimal(a, 'touch');
    }
    if (this.tool) for (const a of this.tool.caughtBy(this.animals)) this.catchAnimal(a);
    this.followers.forEach((s, i) => (s.followGap = FOLLOW_GAP * (i + 1)));

    for (const a of this.animals) {
      // im Kanu: Tiere, die folgen, sitzen unsichtbar mit im Boot
      if (a.state === 'following' && this.player.boat) {
        a.x = this.player.x;
        a.y = this.player.y;
        a.sprite.setVisible(false);
        a.shadow?.setVisible(false);
        a.inBoat = true;
        continue;
      }
      if (a.inBoat) {
        a.inBoat = false;
        a.sprite.setVisible(true);
        a.shadow?.setVisible(true);
      }
      // auf einer fahrenden Eisscholle: Tiere, die folgen, stehen mit darauf
      if (a.state === 'following' && this.floes?.carrier) {
        Object.assign(a, this.floes.seat(this.followers.indexOf(a)));
        a.render(false);
        continue;
      }
      a.update(dt, this.player);
    }
    if (this.thicket?.update(dt)) this.updateToolbar();
    if (this.boat?.update(dt)) {
      this.nearBoat = this.boat.near === 'board' ? 'board' : this.boat.near ? 'land' : null;
      this.updateToolbar();
    }
    this.updateWaterfallSound();
    this.updateZoneAmbient();
    this.waterfallSun?.update(dt);
    this.visitors?.update(dt);
    this.wheel?.update(dt);
    this.updateScooter();
    this.updateJellies(dt);
    if (!this.leaving) for (const h of Object.keys(HOUSES)) if (h !== LEVEL_ID) this.houseIncome(h, dt);
    if (!this.leaving) this.parkIncome(dt); // die anderen Tierpark-Abschnitte
    this.updateNearCalls(dt);
    this.updatePeacockCall(dt);
    for (const f of this.tankFish) f.update(dt); // Zierfische im Aquarium und Fischschwärme im Riff
    this.cullStatic();
    if (this.riding) this.updateMount(); // in Gebäuden ab-, draußen wieder aufsteigen
    this.eventTimer -= dt;
    if (this.eventTimer <= 0) {
      this.eventTimer = 0.5;
      this.updateEvents();
    }
    this.updateTraps(dt);
    this.luck.update(dt);
    this.updateTrapMarkers();
    this.updateWolfNight(dt);
    this.updateMigration(dt);
    this.updateFireflies(dt);
    this.ropeBridge?.update(dt);
    this.jungleHall?.update(dt);
    this.hyenaPack?.update(dt);
    this.weather?.update(dt);
    this.updateSeason(dt);
    this.updateCold(dt);
    this.updateSpawner(dt);
    if (!this.wolfNight) this.updateHerons(dt);
    this.updateGate(dt);
    this.updateSign();
    this.mavi.update(dt);
    this.updateEncounter(dt);
    this.updateBeaverHint();
    this.updateYakHint();
    this.updateOakHint();
    this.checkWrongHome(dt);

    // Tiere, die zuhause angekommen sind, folgen nicht mehr
    const before = this.followers.length;
    this.followers = this.followers.filter((s) => s.state === 'following');
    if (this.followers.length !== before) this.updateHud();
  }
}

// Fisch-Umriss im Pflaster, flach in der Iso-Ansicht; dir: Richtung der Nase in Kacheln (z. B. { tx: -1, ty: 0 })
function pathFishTexture(scene, dir) {
  const key = `path_fish_${dir.tx}_${dir.ty}`;
  if (scene.textures.exists(key)) return key;
  const W = 80;
  const H = 48;
  const tex = scene.textures.createCanvas(key, W, H);
  const ctx = tex.getContext();
  // Kachelmaß auf den Bildschirm: tx nach rechts unten, ty nach links unten
  ctx.setTransform(32, 16, -32, 16, W / 2, H / 2);
  ctx.rotate(Math.atan2(dir.ty, dir.tx) + Math.PI); // gezeichnet mit der Nase in Richtung -tx
  const fish = () => {
    ctx.beginPath();
    ctx.ellipse(0, 0, 0.34, 0.16, 0, 0, Math.PI * 2);
    ctx.moveTo(0.3, 0);
    ctx.lineTo(0.54, -0.17);
    ctx.lineTo(0.54, 0.17);
    ctx.closePath();
  };
  // heller Stein mit dunkler Fuge, wie ins Pflaster eingelegt
  fish();
  ctx.lineWidth = 0.14;
  ctx.strokeStyle = 'rgba(60, 52, 44, 0.7)';
  ctx.stroke();
  ctx.lineWidth = 0.07;
  ctx.strokeStyle = 'rgba(250, 246, 236, 1)';
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(-0.19, -0.04, 0.035, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(250, 246, 236, 1)';
  ctx.fill();
  tex.refresh();
  return key;
}

// Kacheln des Flusses (LEVEL.flow): zusammenhängendes Wasser samt Stegen, das groß genug ist (kleine Becken wie das am
// Wasserfall fließen nicht). Set "tx,ty"
function riverTiles() {
  const water = (tx, ty) => '~ŜBEƬƫřǒ'.includes(charAt(tx, ty)) && tx >= 0 && ty >= 0 && tx < MAP_W && ty < MAP_H; // unter Brücken fließt er weiter
  const seen = new Set();
  const river = new Set();
  for (let ty = 0; ty < MAP_H; ty++) {
    for (let tx = 0; tx < MAP_W; tx++) {
      if (!water(tx, ty) || seen.has(tx + ',' + ty)) continue;
      const group = [];
      const todo = [[tx, ty]];
      seen.add(tx + ',' + ty);
      while (todo.length) {
        const [x, y] = todo.pop();
        group.push(x + ',' + y);
        for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
          const k = x + dx + ',' + (y + dy);
          if (!seen.has(k) && water(x + dx, y + dy)) {
            seen.add(k);
            todo.push([x + dx, y + dy]);
          }
        }
      }
      // except: Rechteck, dessen Wasser normal (blau) bleibt, z. B. das Becken am Wasserfall
      const ex = LEVEL.flow.except;
      const kept = ex ? group.filter((k) => { const [x, y] = k.split(',').map(Number); return x < ex.tx0 || x > ex.tx1 || y < ex.ty0 || y > ex.ty1; }) : group;
      if (group.length >= LEVEL.flow.minSize) kept.forEach((k) => river.add(k));
    }
  }
  return river;
}
