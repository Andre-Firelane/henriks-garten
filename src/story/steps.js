// Die Geschichte mit Mavi der Tierpflegerin: eine Aufgabe nach der anderen, jede schaltet neue Gebiete frei.
// Ob eine Aufgabe erledigt ist, steht immer im Spielstand (done) – nicht in dem, was seit ihrem Start passiert ist.
// So merkt das Spiel auch, wenn man etwas schon vorher (in anderer Reihenfolge) geschafft hat.
//
// at:      wo Mavi steht, solange die Aufgabe läuft: Gebiet und Platz ('start', 'car', 'hut', 'door', 'sign',
//          'aquarium', 'entry'; siehe spot in src/npc/Mavi.js); also: ein zweiter Platz (z. B. im Aquarium)
// intro:   was sie zur Aufgabe sagt (Seiten der Sprechblase)
// already: kurz, wenn die Aufgabe schon erledigt ist, bevor man mit ihr gesprochen hat
// outro:   was sie sagt, wenn die Aufgabe geschafft ist
// talk:    erledigt erst im Gespräch mit Mavi (sonst von selbst, sobald done stimmt)
// done(game):  erledigt laut Spielstand (fehlt es, ist die Aufgabe nur ein Gespräch)
// introWhen(game): erst dann sagt sie intro (vorher waiting); waiting/ready: Satz beim Warten bzw. wenn es geschafft ist
// goal:    Text der Aufgaben-Karte; progress(game, ctx): Zusatz wie "2 / 3"
// wild:    { Art: Anzahl } – so viele davon braucht die Aufgabe: solange welche fehlen, sind im Gebiet der Aufgabe immer
//          mindestens so viele wilde Tiere dieser Art unterwegs (siehe ensureStoryAnimals in GardenScene)
// unlocks: Gebiete, die danach offen sind (Welten, Tierpark-Abschnitte park2/park3, reptiles)
import { tr } from '../i18n.js';
import { LEVELS } from '../world/levels.js';
import { SHOP_IDS } from '../world/shops.js';

// Tierarten einer Welt (alle Wetterphasen), ohne die überall häufigen Fische – wie im Tierbuch (livesIn in GardenScene):
// Spawn und Wetter-Spawn, dazu die Tiere mit eigenem Auftritt (Reiher, Geier, Hyänen, Leguane am Wasserfall, Gorillas,
// Schlangen und Vogelspinnen im Dickicht des Dschungels)
export function worldSpecies(id) {
  const all = [];
  for (const l of [LEVELS[id], ...Object.values(LEVELS[id].seasons ?? {})]) {
    for (const pool of [l.spawn, l.weatherSpawn]) all.push(...Object.keys(pool?.weights ?? {}));
    if (l.herons) all.push('heron');
    if (l.vultures) all.push('vulture');
    if (l.hyenas) all.push('hyena');
    if (l.waterfallSun) all.push('iguana');
    if (l.gorillas) all.push('gorilla');
    if (l.beavers) all.push('beaver');
  }
  if (id === 'jungle') all.push('snake', 'tarantula');
  return [...new Set(all)].filter((s) => s !== 'fish');
}

const caught = (game, s) => game.catches?.[s] ?? 0;
// so viele verschiedene Arten dieser Welt schon gefangen (dazu alles, was dort gefangen wurde, siehe countStoryCatch)
const kinds = (game, world) => new Set([...worldSpecies(world).filter((s) => caught(game, s) > 0), ...(game.caughtIn?.[world] ?? [])].filter((s) => s !== 'fish')).size;
// Herzen der Besucher (ohne Eiswagen und Buden)
const visitorHearts = (game) => Object.entries(game.heartsBy).reduce((n, [k, v]) => n + (SHOP_IDS.includes(k) ? 0 : v), 0);
const count = (n, of) => ` (${Math.min(n, of)} / ${of})`;
// schon Tiere aus dem Riff gefangen (ab dann zeigt Mavi das Aquarium)
export const seaCatches = (game) => worldSpecies('reef').reduce((n, s) => n + caught(game, s), 0);
const REEF_CATCHES = 10; // so viele Meerestiere verlangt die Riff-Aufgabe
export const seaReady = (game) => seaCatches(game) >= REEF_CATCHES;

const SHEEP = 3;
const MEADOW = { cat: 2, frog: 2, butterfly: 2 };
const FOREST = { deer: 2, squirrel: 2 };
const VISITOR_HEARTS = 5; // (wenige Tiere bringen jetzt wenige Besucher, siehe ANIMALS_PER_VISITOR)
const SAVANNA_KINDS = 3;
const ASIA_KINDS = 3;
const JUNGLE_KINDS = 2;
const all = (game, list) => Object.entries(list).every(([s, n]) => caught(game, s) >= n);
const listProgress = (game, list) => Object.entries(list).reduce((n, [s, k]) => n + Math.min(k, caught(game, s)), 0);
const listTotal = (list) => Object.values(list).reduce((n, k) => n + k, 0);
// Tierfreund-Aufgabe: 1, wenn ein Tier einen Namen hat, 2, wenn man es auch schon gestreichelt oder gefüttert hat
const friendSteps = (game) => {
  const bonds = Object.values(game.bonds ?? {});
  return bonds.some((b) => b.points > 0) ? 2 : bonds.length ? 1 : 0;
};

export const STEPS = [
  {
    id: 'welcome',
    at: { level: 'park', spot: 'start' },
    talk: true,
    goal: tr('Sprich mit Mavi', 'Talk to Mavi'),
    intro: [
      tr('Hallo! Ich bin Mavi, die Tierpflegerin. Willkommen in deinem Tierpark!', 'Hi! I’m Mavi, the zookeeper. Welcome to your zoo!'),
      tr('Schau dich um: Gehege, Wege, das Haupthaus – alles ist fertig gebaut. Nur eins fehlt noch …', 'Look around: enclosures, paths, the main building – everything is built. Only one thing is missing …'),
      tr('… die Tiere! Du reist um die ganze Welt und fängst Tiere für unseren Park.', '… the animals! You’ll travel around the world and catch animals for our zoo.'),
      tr('Wir fangen klein an: Fahr mit dem Auto auf die Wiese. Ich warte dort an der Hütte auf dich!', 'Let’s start small: drive to the meadow by car. I’ll wait for you at the hut there!'),
    ],
    reward: 0,
    unlocks: ['meadow'],
  },
  {
    id: 'sheep',
    at: { level: 'meadow', spot: 'hut' },
    talk: true,
    goal: tr('Fang 3 Schafe und bring sie zu Mavi an der Hütte', 'Catch 3 sheep and bring them to Mavi at the hut'),
    progress: (game) => count(caught(game, 'sheep'), SHEEP),
    wild: { sheep: SHEEP },
    done: (game) => caught(game, 'sheep') >= SHEEP,
    intro: [
      tr('Da bist du ja! Schau mal, die Schafe dort drüben.', 'There you are! Look at the sheep over there.'),
      tr('Schafe sind ganz zahm: Lauf einfach zu ihnen hin, dann laufen sie dir hinterher.', 'Sheep are really tame: just walk up to them and they’ll follow you.'),
      tr('Fang drei Schafe und bring sie zu mir!', 'Catch three sheep and bring them to me!'),
    ],
    waiting: tr('Fang drei Schafe – lauf einfach zu ihnen hin!', 'Catch three sheep – just walk up to them!'),
    ready: tr('Super, drei Schafe! Komm zu mir an die Hütte.', 'Great, three sheep! Come to me at the hut.'),
    outro: [
      tr('Toll gemacht! Die drei ziehen in unseren Park – sie laufen dir einfach mit nach Hause.', 'Well done! These three are moving to our zoo – they’ll simply follow you home.'),
      tr('Aber Achtung: Nicht alle Tiere sind so einfach wie Schafe!', 'But careful: not all animals are as easy as sheep!'),
      tr('Jedes Tier wird anders gefangen. Manche musst du anschleichen, andere mit Futter locken, mit dem Kescher, dem Lasso oder einer Falle fangen.', 'Every animal is caught differently. Some you have to sneak up on, others you lure with food, or catch with the net, the lasso or a trap.'),
      tr('Die Werkzeuge liegen im Regal in der Hütte. Und im Tierbuch oben links steht zu jedem Tier ein Tipp.', 'The tools are on the shelf in the hut. And the Animal Book at the top left has a tip for every animal.'),
    ],
    reward: 10,
  },
  {
    id: 'meadow',
    at: { level: 'meadow', spot: 'hut' },
    goal: tr('Fang 2 Katzen, 2 Frösche und 2 Schmetterlinge', 'Catch 2 cats, 2 frogs and 2 butterflies'),
    progress: (game) => count(listProgress(game, MEADOW), listTotal(MEADOW)),
    wild: MEADOW,
    done: (game) => all(game, MEADOW),
    intro: [
      tr('Jetzt wird es etwas kniffliger: Fang zwei Katzen, zwei Frösche und zwei Schmetterlinge.', 'Now it gets a little trickier: catch two cats, two frogs and two butterflies.'),
      tr('Katzen sind flinker als Schafe – lauf ihnen einfach hinterher. Frösche sitzen meistens am Wasser.', 'Cats are quicker than sheep – just run after them. Frogs mostly sit near the water.'),
      tr('Schmetterlinge fliegen weg, wenn du hinläufst. Für sie brauchst du den Kescher – er liegt im Regal in der Hütte!', 'Butterflies fly away when you walk up to them. For them you need the net – it’s on the shelf in the hut!'),
    ],
    already: [tr('Oh, du hast ja schon Katzen, Frösche und Schmetterlinge gefangen – klasse!', 'Oh, you’ve already caught cats, frogs and butterflies – brilliant!')],
    outro: [tr('Wunderbar! Jetzt fahr mit deinen Tieren zurück in den Tierpark – ich komme mit.', 'Wonderful! Now drive back to the zoo with your animals – I’ll come along.')],
    reward: 20,
  },
  {
    id: 'visitors',
    at: { level: 'park', spot: 'sign' },
    goal: tr('Sammle Herzen von den Besuchern', 'Collect hearts from the visitors'),
    progress: (game) => count(visitorHearts(game), VISITOR_HEARTS),
    done: (game) => visitorHearts(game) >= VISITOR_HEARTS,
    intro: [
      tr('Schau, die ersten Besucher sind da!', 'Look, the first visitors are here!'),
      tr('Sie lieben unsere Tiere. Wenn ihnen ein Gehege gefällt, schenken sie dir Herzen.', 'They love our animals. When they like an enclosure, they give you hearts.'),
      tr('Je mehr und je seltenere Tiere, desto mehr Besucher kommen. Schau eine Weile zu!', 'The more animals – and the rarer – the more visitors come. Watch for a while!'),
    ],
    already: [tr('Die Besucher haben dir ja schon viele Herzen geschenkt!', 'The visitors have already given you lots of hearts!')],
    outro: [
      tr('Siehst du? Herzen! Und von mir gibt es noch ein paar dazu.', 'See? Hearts! And here are a few more from me.'),
      tr('Mit Herzen kannst du oben bei „Events“ tolle Sachen starten.', 'With hearts you can start great things under “Events” at the top.'),
    ],
    reward: 30,
  },
  {
    // (früher an dieser Stelle: der Eiswagen, siehe STEP_RENAMES in story.js)
    id: 'babies',
    at: { level: 'park', spot: 'door' }, // vor dem Haupthaus (gestartet wird oben über den Events-Knopf, nicht am Computer)
    goal: tr('Starte oben bei „Events“ die Tierbabys', 'Start the animal babies under “Events” at the top'),
    done: (game) => !!game.events.babies,
    intro: [
      tr('Drück oben auf „Events“ – dort startest du mit Herzen tolle Sachen. Fangen wir mit den Tierbabys an!', 'Press “Events” at the top – that’s where you start great things with hearts. Let’s begin with the animal babies!'),
      tr('Wo zwei gleiche Tiere in einem Gehege wohnen, bekommen sie ein Baby. Die Besucher lieben die Kleinen und schenken dir mehr Herzen.', 'Where two matching animals live in one enclosure, they get a baby. The visitors love the little ones and give you more hearts.'),
    ],
    already: [tr('Die Tierbabys hast du ja schon gestartet – wie süß!', 'You’ve already started the animal babies – how cute!')],
    outro: [
      tr('Ohhh, wie süß! Schau mal in die Gehege.', 'Aww, how cute! Take a look in the enclosures.'),
      tr('Jetzt ist es Zeit für eine neue Welt: Der Wald ist offen! Ich warte dort auf dich.', 'Now it’s time for a new world: the forest is open! I’ll wait for you there.'),
    ],
    reward: 10,
    unlocks: ['forest'],
  },
  {
    id: 'forest',
    at: { level: 'forest', spot: 'hut' },
    goal: tr('Fang im Wald 2 Rehe und 2 Eichhörnchen', 'Catch 2 deer and 2 squirrels in the forest'),
    progress: (game) => count(listProgress(game, FOREST), listTotal(FOREST)),
    wild: FOREST,
    done: (game) => all(game, FOREST),
    intro: [
      tr('Willkommen im Wald! Die Tiere hier sind scheuer als auf der Wiese.', 'Welcome to the forest! The animals here are shyer than on the meadow.'),
      tr('Fang zwei Rehe und zwei Eichhörnchen. Rehe erschrecken leicht, und Eichhörnchen sitzen gern oben im Baum …', 'Catch two deer and two squirrels. Deer startle easily, and squirrels like to sit up in the trees …'),
      tr('Schau ins Regal – und wenn du nicht weiterweißt, ins Tierbuch.', 'Check the shelf – and if you get stuck, the Animal Book.'),
    ],
    already: [tr('Rehe und Eichhörnchen hast du ja schon – du bist richtig gut!', 'You already have deer and squirrels – you’re really good at this!')],
    outro: [
      tr('Klasse! Fahr mit deinen Tieren zurück in den Tierpark.', 'Brilliant! Drive back to the zoo with your animals.'),
      tr('Ich warte dort vor dem Haupthaus auf dich – ich habe noch etwas vor!', 'I’ll wait for you in front of the main building – I’ve got something planned!'),
    ],
    reward: 20,
    unlocks: ['park2'], // (Mavi schickt einen erst nach der Bude in die Savanne)
  },
  {
    id: 'stands',
    at: { level: 'park', spot: 'build' },
    goal: tr('Stell eine Bude an einen Weg', 'Put a stand next to a path'),
    done: (game) => Object.values(game.booths ?? {}).some((b) => !b.stored) && !game.buildOpen, // (erst nach „Fertig“)
    intro: [
      tr('Zeit für eine Bude! Einen Eisstand hast du schon – drück oben auf „Bauen“.', 'Time for a stand! You already have an ice cream stand – press “Build” at the top.'),
      tr('Stell ihn direkt an einen Weg, dort kaufen die Besucher ein. Mehr Buden gibt es unter „Bestellen“.', 'Put it right next to a path – that’s where visitors buy. More stands are under “Order”.'),
    ],
    already: [tr('Du hast ja schon eine Bude – lecker!', 'You’ve already got a stand – yummy!')],
    outro: [
      tr('Super! Die Besucher stehen schon an – jeder Verkauf bringt dir Herzen.', 'Great! The visitors are already queueing – every sale brings you hearts.'),
      tr('Komm mit, gleich hinter dem Haupthaus ist unser Stall!', 'Come along, our stable is right behind the main building!'),
    ],
    reward: 20,
  },
  {
    // Stall: Reittiere leihen oder kaufen, E-Roller freischalten (siehe src/world/mounts.js)
    id: 'stable',
    at: { level: 'park', spot: 'stable' },
    goal: tr('Schau in den Stall hinter dem Haupthaus', 'Look into the stable behind the main building'),
    done: (game) => !!game.story.flags.stable,
    intro: [
      tr('Das ist unser Stall. Hier gibt es Reittiere – damit bist du in den Welten viel schneller!', 'This is our stable. It has mounts – they make you much faster in the worlds!'),
      tr('Du kannst eins für 10 Minuten leihen oder für ein Gebiet für immer kaufen. Auch den E-Roller für den Park gibt es hier.', 'You can rent one for 10 minutes or buy one forever for an area. The e-scooter for the zoo is here too.'),
    ],
    already: [tr('Den Stall kennst du ja schon!', 'You already know the stable!')],
    outro: [
      tr('Spar deine Herzen – ein eigenes Reittier lohnt sich!', 'Save your hearts – your own mount is worth it!'),
      tr('Komm mit zum Streichelzoo, ich möchte dir noch etwas Schönes zeigen!', 'Come along to the petting zoo, I’d like to show you something lovely!'),
    ],
    reward: 20,
  },
  {
    // Tierfreund (an der Stelle der früheren Ausbau-Aufgabe, siehe DONE_WITH in story.js und src/world/friends.js)
    id: 'friend',
    at: { level: 'park', spot: 'sign' },
    goal: tr('Gib einem Tier am Gehegeschild einen Namen und streichle es', 'Name an animal at an enclosure sign and pet it'),
    progress: (game) => count(friendSteps(game), 2),
    done: (game) => friendSteps(game) >= 2,
    intro: [
      tr('Hier am Schild siehst du, wer bei uns wohnt. Jede Tierart hat ihr eigenes Schild.', 'This sign shows who lives here. Every kind of animal has its own sign.'),
      tr('Drück davor die Aktionstaste und such dir ein Tier aus. Gib ihm einen Namen – dann ist es dein Freund!', 'Press the action button in front of it and pick an animal. Give it a name – then it’s your friend!'),
      tr('Danach geh zu ihm an den Zaun und streichle es.', 'Then go to it at the fence and pet it.'),
    ],
    already: [tr('Du hast ja schon einen Tierfreund! Wie schön.', 'You already have an animal friend! How lovely.')],
    outro: [
      tr('Schau, wie es sich freut! Je öfter du es besuchst, desto enger wird eure Freundschaft.', 'Look how happy it is! The more often you visit, the closer you become.'),
      tr('Der Balken über dem Namen zeigt, wie weit es bis zur nächsten Stufe ist.', 'The bar above the name shows how far it is to the next level.'),
      tr('Im Futterhaus gibt es auch Futter für deine Freunde. Was frisst deiner am liebsten?', 'The food house also has food for your friends. What does yours like best?'),
      tr('Und jetzt geht die Reise los: Die Savanne ist offen!', 'And now the journey begins: the savanna is open!'),
      tr('Fahr mit dem Auto hin – ich warte dort an der Hütte auf dich.', 'Drive there by car – I’ll wait for you at the hut.'),
    ],
    reward: 20,
    unlocks: ['savanna'],
  },
  {
    id: 'savanna',
    at: { level: 'savanna', spot: 'hut' },
    goal: tr('Fang 3 verschiedene Tierarten in der Savanne', 'Catch 3 different kinds of animals in the savanna'),
    progress: (game) => count(kinds(game, 'savanna'), SAVANNA_KINDS),
    done: (game) => kinds(game, 'savanna') >= SAVANNA_KINDS,
    intro: [
      tr('Die Savanne! Zebras, Giraffen, Löwen … und das Wetter wechselt hier.', 'The savanna! Zebras, giraffes, lions … and the weather changes here.'),
      tr('Giraffen lockst du mit Grünfutter, für andere brauchst du das Lasso. Fang drei verschiedene Tierarten!', 'You lure giraffes with leafy greens, others need the lasso. Catch three different kinds of animals!'),
    ],
    already: [tr('Du warst ja schon fleißig in der Savanne!', 'You’ve already been busy in the savanna!')],
    outro: [
      tr('Fantastisch! Bring deine Savannentiere jetzt nach Hause in den Tierpark.', 'Fantastic! Now take your savanna animals home to the zoo.'),
      tr('Ich warte dort im Savannenbereich auf dich!', 'I’ll wait for you there in the savanna area!'),
    ],
    reward: 30,
  },
  {
    // erst die Savannentiere abgeben (sie ziehen beim Ankommen im Tierpark ein), dann geht es ins Riff – sonst nähme man
    // sie mit unter Wasser
    id: 'savannaHome',
    at: { level: 'park2', spot: 'feeder' },
    talk: true,
    goal: tr('Bring die Savannentiere zu Mavi in den Savannenbereich des Tierparks', 'Bring the savanna animals to Mavi in the savanna area of the zoo'),
    intro: [
      tr('Da seid ihr ja! Schau, deine Savannentiere sind schon in ihre Gehege gezogen.', 'There you are! Look, your savanna animals have already moved into their enclosures.'),
      tr('Jetzt wird es nass: Das Riff ist offen! Fahr mit dem U-Boot hin und fang Meerestiere.', 'Now it gets wet: the reef is open! Take the submarine there and catch sea animals.'),
      tr('Bring sie dann mit – ich zeige dir unser Aquarium!', 'Then bring them back – I’ll show you our aquarium!'),
    ],
    reward: 10,
    unlocks: ['reef'],
  },
  {
    id: 'reef',
    at: { level: 'park2', spot: 'aquarium' },
    also: { level: 'aquarium', spot: 'entry' }, // drinnen sagt sie noch etwas
    talk: true, // abgehakt im Gespräch drinnen
    goal: tr(`Fang ${REEF_CATCHES} Meerestiere im Riff und bring sie ins Aquarium`, `Catch ${REEF_CATCHES} sea animals at the reef and bring them to the aquarium`),
    progress: (game) => count(seaCatches(game), REEF_CATCHES),
    done: (game) => !!game.story.flags.aquarium,
    introWhen: seaReady, // vorher sagt sie nur waiting
    readyWhen: seaReady, // dann einmal ready am Rand (noch im Riff)
    intro: [
      tr('Willkommen am Aquarium! Deine Meerestiere ziehen hier ein.', 'Welcome to the aquarium! Your sea animals are moving in here.'),
      tr('Komm, schau es dir an – geh einfach durch die Tür!', 'Come and have a look – just walk through the door!'),
    ],
    waiting: tr(`Fang im Riff ${REEF_CATCHES} Meerestiere – dann zeige ich dir das Aquarium!`, `Catch ${REEF_CATCHES} sea animals at the reef – then I’ll show you the aquarium!`),
    ready: tr(`Super, ${REEF_CATCHES} Meerestiere! Fahr mit ihnen zurück in den Tierpark – ich warte am Aquarium.`, `Great, ${REEF_CATCHES} sea animals! Take them back to the zoo – I’ll wait at the aquarium.`),
    outro: [
      tr('Ist das nicht schön? Jedes Becken hat seine eigenen Tiere.', 'Isn’t it beautiful? Every tank has its own animals.'),
      tr('Im Tierpark ist jetzt auch der Bereich Bambuswald & Dschungel fertig – und der Bambuswald wartet auf dich!', 'In the zoo, the Bamboo Forest & Jungle area is ready now too – and the bamboo forest is waiting for you!'),
    ],
    reward: 30,
    unlocks: ['asia', 'park3'],
  },
  {
    id: 'asia',
    at: { level: 'asia', spot: 'hut' },
    goal: tr('Fang 3 verschiedene Tierarten im Bambuswald', 'Catch 3 different kinds of animals in the bamboo forest'),
    progress: (game) => count(kinds(game, 'asia'), ASIA_KINDS),
    done: (game) => kinds(game, 'asia') >= ASIA_KINDS,
    intro: [
      tr('Der Bambuswald! Hier leben Pandas, Japanmakaken in der heißen Quelle und sogar Tiger.', 'The bamboo forest! Pandas live here, macaques in the hot spring and even tigers.'),
      tr('Fang drei verschiedene Tierarten!', 'Catch three different kinds of animals!'),
    ],
    already: [tr('Im Bambuswald hast du ja schon ordentlich gefangen!', 'You’ve already caught plenty in the bamboo forest!')],
    outro: [
      tr('Großartig! Bring deine Tiere jetzt nach Hause in den Tierpark.', 'Great! Now take your animals home to the zoo.'),
      tr('Ich warte dort im Bereich Bambuswald & Dschungel auf dich!', 'I’ll wait for you there in the Bamboo Forest & Jungle area!'),
    ],
    reward: 30,
  },
  {
    // erst die Tiere aus dem Bambuswald abgeben, dann geht es in den Dschungel (wie nach der Savanne)
    id: 'asiaHome',
    at: { level: 'park3', spot: 'car' },
    talk: true,
    goal: tr('Bring die Bambuswald-Tiere zu Mavi in den Tierpark (Bambuswald & Dschungel)', 'Bring the bamboo forest animals to Mavi in the zoo (Bamboo Forest & Jungle)'),
    intro: [
      tr('Da seid ihr ja! Deine Tiere aus dem Bambuswald sind schon in ihre Gehege gezogen.', 'There you are! Your animals from the bamboo forest have already moved into their enclosures.'),
      tr('Jetzt kommt der Dschungel – mit dem Wasserflugzeug! Deine Dschungeltiere ziehen hier in die Tropenhalle.', 'Next up is the jungle – by seaplane! Your jungle animals will move into the tropical hall here.'),
    ],
    reward: 10,
    unlocks: ['jungle', 'reptiles'], // (reptiles: das frühere Reptilienhaus, die Tiere wohnen jetzt in der Tropenhalle)
  },
  {
    id: 'jungle',
    at: { level: 'jungle', spot: 'hut' },
    talk: true, // abgehakt bei ihr an der Hütte
    goal: tr('Fang 2 verschiedene Tierarten im Dschungel und triff Mavi an der Hütte', 'Catch 2 different kinds of animals in the jungle and meet Mavi at the hut'),
    progress: (game) => count(kinds(game, 'jungle'), JUNGLE_KINDS),
    done: (game) => kinds(game, 'jungle') >= JUNGLE_KINDS,
    intro: [
      tr('Willkommen im Dschungel! Hier ist es wild – Affen, Aras, Jaguare …', 'Welcome to the jungle! It’s wild here – monkeys, macaws, jaguars …'),
      tr('Fang zwei verschiedene Tierarten und komm dann zu mir!', 'Catch two different kinds of animals and then come back to me!'),
    ],
    waiting: tr('Fang zwei verschiedene Tierarten im Dschungel!', 'Catch two different kinds of animals in the jungle!'),
    ready: tr('Super, zwei Tierarten! Komm zu mir an die Hütte.', 'Great, two kinds! Come to me at the hut.'),
    outro: [
      tr('Super, zwei Dschungeltiere – du hast es geschafft!', 'Great, two jungle animals – you did it!'),
      tr('Ein Tipp noch: Hier wechselt das Wetter. Bei Regen oder Nebel zeigen sich ganz andere Tiere.', 'One more tip: the weather changes here. In rain or fog completely different animals appear.'),
      tr('Leg dich in der Hütte ins Bett, dann ist das Wetter nach einem Nickerchen weiter. Das klappt auch in der Savanne.', 'Lie down in the bed in the hut and the weather moves on after a nap. That works in the savanna too.'),
      tr('Fahr jetzt mit deinen Tieren zurück in den Tierpark. Ich warte vor dem Haupthaus – ich zeige dir noch etwas Tolles!', 'Now take your animals back to the zoo. I’ll wait in front of the main building – I’ve got one more great thing to show you!'),
    ],
    reward: 30,
    unlocks: ['ice'],
  },
  {
    // ganz zum Schluss (vorher unterbrach es zwischen Aquarium und Bambuswald den Ablauf)
    id: 'event',
    at: { level: 'park', spot: 'door' }, // vor dem Haupthaus (gestartet wird oben über den Events-Knopf)
    goal: tr('Starte oben bei „Events“ ein Event (nicht die Tierbabys)', 'Start an event under “Events” at the top (not the animal babies)'),
    done: (game) => !!game.story.flags.event, // selbst über den Events-Knopf gestartet (nicht Eiswagen, Geschenk, Überraschungs-Flamingos oder die Tierbabys aus ihrer Aufgabe)
    intro: [
      tr('Da bist du ja! Oben bei „Events“ gibt es noch viel mehr: Flamingos, seltene Tiere, die große Wanderung …', 'There you are! Under “Events” at the top there’s much more: flamingos, rare animals, the great migration …'),
      tr('Manche bringen sogar ganz neue Tiere, wie Wölfe, Gnus oder Quallen. Such dir eins aus!', 'Some even bring brand-new animals, like wolves, wildebeest or jellyfish. Pick one!'),
    ],
    already: [tr('Du hast ja schon ein Event gestartet – prima!', 'You’ve already started an event – excellent!')],
    outro: [
      tr('Was für ein Spaß! Jetzt kennst du alles Wichtige – du bist ein richtiger Tierparkdirektor!', 'What fun! Now you know everything important – you’re a real zoo director!'),
      tr('Es gibt noch mehr Welten zu entdecken, zum Beispiel die Eiswelt. Viel Spaß!', 'There are more worlds to discover, like the Ice World. Have fun!'),
    ],
    reward: 40,
  },
  // die letzte Aufgabe: danach steht Mavi vor dem Haupthaus und hat nur noch einen Gruß (siehe talk in src/npc/Mavi.js)
];

export const STEP_IDS = STEPS.map((s) => s.id);
