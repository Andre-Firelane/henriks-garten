// Ansprüche der Tierarten in Savanne, Dschungel, Bambuswald, Wald und Eiswelt: für die Expeditionen (planMap in expedition.js) und die kleinen Maps
// hinter den Durchgängen der großen Erkundungs-Maps (sideMaps.js). Ohne Importe, damit es überall verwendbar ist.
// Ansprüche der Tierarten: needs = Merkmal, das die Map haben muss (features in expeditionMaps.js), seasons = bei welchem
// Wetter sie vorkommen (ohne Angabe: bei jedem), units = so viele Fang-Einheiten [min, max] (Herde, Kolonie, Rudel = eine)
// plain = Standardtier: bekommt in der Expedition keine eigene Tierkarte (nur seltene Karten), lebt aber als Nebentier auf den Maps
// Angelfische stehen hier nicht: sie schwimmen als Schatten in jedem Gewässer (FishShadows.js) und zählen nicht zur Tierliste
export const SPECIES_RULES = {
  savanna: {
    antelope: { plain: true, units: [1, 2] },
    zebra: { plain: true, units: [1, 2] },
    giraffe: { units: [1, 2] },
    lion: { units: [1, 2] },
    meerkat: { plain: true, units: [1, 2] },
    crocodile: { needs: 'water', seasons: ['normal', 'rain'], units: [1, 1] },
    hippo: { needs: 'water', seasons: ['rain'], units: [1, 2] },
    heron: { needs: 'water', seasons: ['rain'], units: [1, 2] }, // Schuhschnabel
    warthog: { seasons: ['dry'], units: [1, 2] },
    hyena: { needs: 'graveyard', seasons: ['dry'], units: [1, 1] },
    vulture: { needs: 'graveyard', seasons: ['dry'], units: [1, 2] },
  },
  jungle: {
    jaguar: { units: [1, 1] },
    anteater: { plain: true, units: [1, 2] },
    howler: { plain: true, seasons: ['normal', 'fog'], units: [1, 2] },
    snake: { needs: 'thicket', units: [1, 2] },
    tarantula: { needs: 'thicket', units: [1, 2] },
    iguana: { needs: 'waterfall', seasons: ['normal'], units: [1, 2] }, // sonnen sich am Wasserfall
    piranha: { needs: 'river', seasons: ['rain'], units: [1, 2] },
    toucan: { needs: 'river', seasons: ['rain'], units: [1, 2] },
    macaw: { needs: 'river', seasons: ['normal', 'fog'], units: [1, 2] },
    gorilla: { needs: 'clearing', seasons: ['fog'], units: [1, 2] },
    tapir: { needs: 'river', units: [1, 1] }, // grast lange am Ufer, frisst Blätter vom Futterstrauch
    okapi: { needs: 'thicket', seasons: ['normal', 'fog'], units: [1, 1] }, // scheu, im dichten Wald
  },
  // Bambuswald: der Rote Panda kommt nur mit der Event-Karte Glühwürmchen-Abend (fireflies in expeditionMaps.js), die
  // Yaks grasen als Herde am Steinhaufen (eine Einheit je Yak, siehe YakHerd.js)
  asia: {
    peacock: { needs: 'meadow', seasons: ['normal', 'fog'], units: [1, 2] }, // nur auf grünen Maps, nicht im Schnee
    panda: { needs: 'bamboo', units: [1, 2] },
    tiger: { needs: 'bamboo', seasons: ['normal', 'snow', 'fog'], units: [1, 1] },
    macaque: { needs: 'hotspring', units: [1, 2] },
    tanuki: { needs: 'lanterns', units: [1, 2] },
    koi: { needs: 'pond', units: [1, 2] },
    orangutan: { needs: 'forest', seasons: ['normal', 'fog'], units: [1, 1] },
    yak: { needs: 'plateau', seasons: ['normal', 'snow'], units: [2, 3] },
    snowleopard: { needs: 'rocks', seasons: ['normal', 'snow'], units: [1, 1] }, // selten: höchstens einer
  },
  // Wald: Reh und Fuchs überall; Merkmale sind Zutaten (eine Map kann Moor und Eichen zugleich haben). Wölfe kommen nur mit
  // der Event-Karte Wolfsnacht (wolfNight in expeditionMaps.js), Biber über den Damm (BeaverDam.js)
  forest: {
    deer: { plain: true, units: [1, 2] },
    fox: { plain: true, units: [1, 1] },
    squirrel: { plain: true, seasons: ['normal', 'rain'], units: [1, 2] },
    boar: { needs: 'oaks', units: [1, 1] }, // frisst Eicheln aus den Eichen (dann mit dem Lasso)
    hedgehog: { needs: 'leaves', seasons: ['normal', 'fog'], units: [1, 2] }, // versteckt in Laubhaufen
    elk: { needs: 'moor', seasons: ['normal', 'fog'], units: [1, 1] }, // im Moorwasser, nur im Licht der Laterne
    frog: { plain: true, needs: 'water', seasons: ['normal', 'rain'], units: [1, 1] },
    heron: { needs: 'water', seasons: ['rain'], units: [1, 1] },
    beaver: { needs: 'dam', units: [1, 1] }, // nur auf Maps mit Biberdamm (beavers): Stock ins Loch, dann kommt einer mit
  },
  // Eiswelt (docs/plan-eis-expedition.md): statt Wetter Tag oder Nacht. Nachts ist das Wasser zugefroren (Eislöcher bleiben).
  // Jede Map hat Wasser (Pinguine, Robben); Rentiere laufen als Herde (eine Einheit), das Polarwolf-Rudel ist eine Einheit
  // (siehe updatePolarWolves), die Schneeeule sitzt in einer Tanne (updateOwl in IceCatch.js)
  ice: {
    penguin: { plain: true, units: [1, 2] },
    seal: { plain: true, units: [1, 2] },
    snowhare: { plain: true, needs: 'tundra', seasons: ['day'], units: [1, 2] }, // Bau mit 2 bis 3 Löchern
    reindeer: { needs: 'tundra', seasons: ['day'], units: [1, 1] }, // Herde auf ihrem Rundweg
    arcticfox: { needs: 'tundra', units: [1, 1] }, // Spur, Laterne
    arcticwolf: { needs: 'tundra', units: [1, 1] }, // ein Rudel ("Ochs am Berg")
    walrus: { needs: 'beach', units: [1, 2] }, // tagsüber am Kiesstrand, nachts an den Eislöchern
    puffin: { needs: 'birdrocks', seasons: ['day'], units: [1, 2] },
    polarbear: { needs: 'sea', seasons: ['night'], units: [1, 1] }, // Fisch ans Eisloch
    snowowl: { needs: 'taiga', seasons: ['night'], units: [1, 1] }, // in einer verschneiten Tanne, Laterne
  },
};
export const BIOME_SEASONS = { savanna: ['normal', 'rain', 'dry'], jungle: ['normal', 'rain', 'fog'], asia: ['normal', 'snow', 'fog'], forest: ['normal', 'rain', 'fog'], ice: ['day', 'night'] };
// so oft kommt jedes Wetter beim Würfeln (ohne Angabe: alle gleich oft); Eiswelt: 60 % Tag, 40 % Nacht (Andre, 26.11.2026)
export const SEASON_WEIGHTS = { ice: { day: 0.6, night: 0.4 } };
